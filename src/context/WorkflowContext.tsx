import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  TravelRequest, 
  RequestStatus, 
  Approval, 
  TicketOption, 
  AuditLog,
  ApprovalAction,
  User
} from "@/types";
import { 
  addItem, 
  getAllItems, 
  getItemById, 
  updateItem,
  queryByIndex
} from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface WorkflowContextType {
  // Travel Requests
  getUserRequests: (userId: number) => Promise<TravelRequest[]>;
  getRequestById: (requestId: number) => Promise<TravelRequest | null>;
  createRequest: (request: Omit<TravelRequest, "request_id" | "created_at" | "updated_at" | "current_status" | "version_history">) => Promise<number>;
  updateRequest: (request: TravelRequest) => Promise<void>;
  submitRequest: (requestId: number) => Promise<void>;
  
  // Approvals
  getPendingApprovals: (approverId: number) => Promise<TravelRequest[]>;
  approveRequest: (requestId: number, approverId: number, comments?: string) => Promise<void>;
  rejectRequest: (requestId: number, approverId: number, comments?: string) => Promise<void>;
  returnForReview: (requestId: number, approverId: number, comments?: string) => Promise<void>;
  
  // Ticket Options
  getTicketOptions: (requestId: number) => Promise<TicketOption[]>;
  addTicketOption: (ticketOption: Omit<TicketOption, "option_id" | "added_date">) => Promise<number>;
  selectTicketOption: (requestId: number, ticketOptionId: number, approverId: number) => Promise<void>;
  
  // Audit Logs
  getRequestAuditLogs: (requestId: number) => Promise<AuditLog[]>;
  
  // Workflow Status
  canUserActOnRequest: (userId: number, requestId: number) => Promise<boolean>;
  getNextApprover: (request: TravelRequest) => Promise<User | null>;
  getCurrentRequests: () => Promise<TravelRequest[]>;
  
  // User data
  getUserById: (userId: number) => Promise<User | null>;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const WorkflowProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser, getUserById } = useAuth();
  const { toast } = useToast();
  
  // Get all requests for a specific user
  const getUserRequests = async (userId: number): Promise<TravelRequest[]> => {
    try {
      return await queryByIndex<TravelRequest>("requests", "requester_id", userId);
    } catch (error) {
      console.error(`Failed to get requests for user ${userId}:`, error);
      return [];
    }
  };
  
  // Get a specific request by ID
  const getRequestById = async (requestId: number): Promise<TravelRequest | null> => {
    try {
      return await getItemById<TravelRequest>("requests", requestId);
    } catch (error) {
      console.error(`Failed to get request ${requestId}:`, error);
      return null;
    }
  };
  
  // Create a new travel request
  const createRequest = async (request: Omit<TravelRequest, "request_id" | "created_at" | "updated_at" | "current_status" | "version_history">): Promise<number> => {
    try {
      const now = new Date().toISOString();
      
      const newRequest: Omit<TravelRequest, "request_id"> = {
        ...request,
        current_status: "draft",
        created_at: now,
        updated_at: now,
        version_history: [
          {
            timestamp: now,
            user_id: request.requester_id,
            changeset: { type: "create", details: "Initial request creation" }
          }
        ]
      };
      
      const requestId = await addItem<Omit<TravelRequest, "request_id">>("requests", newRequest);
      
      // Log audit entry
      await addAuditLog({
        request_id: requestId as number,
        user_id: request.requester_id,
        action_type: "create",
        before_state: {},
        after_state: newRequest,
        ip_address: await simulateIPAddress(),
        timestamp: now
      });
      
      return requestId as number;
    } catch (error) {
      console.error("Failed to create request:", error);
      throw error;
    }
  };
  
  // Update an existing travel request
  const updateRequest = async (request: TravelRequest): Promise<void> => {
    try {
      const existingRequest = await getItemById<TravelRequest>("requests", request.request_id);
      
      if (!existingRequest) {
        throw new Error(`Request ${request.request_id} not found`);
      }
      
      const now = new Date().toISOString();
      const userId = currentUser?.id || request.requester_id;
      
      // Create a new version history entry
      const updatedRequest: TravelRequest = {
        ...request,
        updated_at: now,
        version_history: [
          ...request.version_history,
          {
            timestamp: now,
            user_id: userId,
            changeset: { type: "edit", details: "Request updated" }
          }
        ]
      };
      
      await updateItem("requests", updatedRequest);
      
      // Log audit entry
      await addAuditLog({
        request_id: request.request_id,
        user_id: userId,
        action_type: "edit",
        before_state: existingRequest,
        after_state: updatedRequest,
        ip_address: await simulateIPAddress(),
        timestamp: now
      });
      
    } catch (error) {
      console.error(`Failed to update request ${request.request_id}:`, error);
      throw error;
    }
  };
  
  // Submit a request for approval
  const submitRequest = async (requestId: number): Promise<void> => {
    try {
      const request = await getItemById<TravelRequest>("requests", requestId);
      
      if (!request) {
        throw new Error(`Request ${requestId} not found`);
      }
      
      if (request.current_status !== "draft") {
        throw new Error(`Request ${requestId} is not in draft status`);
      }
      
      const now = new Date().toISOString();
      const userId = currentUser?.id || request.requester_id;
      
      // Update status to manager_pending
      const updatedRequest: TravelRequest = {
        ...request,
        current_status: "manager_pending",
        updated_at: now,
        version_history: [
          ...request.version_history,
          {
            timestamp: now,
            user_id: userId,
            changeset: { type: "submit", details: "Request submitted for approval" }
          }
        ]
      };
      
      await updateItem("requests", updatedRequest);
      
      // Log audit entry
      await addAuditLog({
        request_id: requestId,
        user_id: userId,
        action_type: "edit",
        before_state: { status: request.current_status },
        after_state: { status: "manager_pending" },
        ip_address: await simulateIPAddress(),
        timestamp: now
      });
      
      // Create notification for the next approver
      if (request.approval_chain.length > 0) {
        const nextApprover = request.approval_chain[0];
        console.log("Notifying approver:", nextApprover);
        createNotification({
          user_id: nextApprover.user_id,
          title: "New Request Pending Approval",
          message: `Request #${requestId} requires your approval.`,
          request_id: requestId,
          type: "state_change"
        });
      }
      
    } catch (error) {
      console.error(`Failed to submit request ${requestId}:`, error);
      throw error;
    }
  };
  
  // Get all requests pending approval for a specific approver
  const getPendingApprovals = async (approverId: number): Promise<TravelRequest[]> => {
    try {
      console.log(`Getting pending approvals for user ${approverId}`);
      const allRequests = await getAllItems<TravelRequest>("requests");
      console.log(`Found ${allRequests.length} total requests in the system`);
      
      const user = await getUserById(approverId);
      if (!user) {
        console.error(`User with ID ${approverId} not found when fetching pending approvals`);
        return [];
      }
      
      console.log(`User role: ${user.role}, ID: ${approverId}`);
      
      // Filter requests that this user should see based on role and status
      const pendingRequests = allRequests.filter(request => {
        // Debug info for each request
        console.log(`Checking request #${request.request_id}, status: ${request.current_status}, requester: ${request.requester_id}`);
        console.log(`Approval chain:`, JSON.stringify(request.approval_chain));
        
        // Skip drafts or completed requests
        if (request.current_status === "draft" || 
            request.current_status === "approved" || 
            request.current_status === "rejected") {
          return false;
        }
        
        // For manager pending requests, check if this manager should approve it
        if (request.current_status === "manager_pending" && user.role === "manager") {
          const managerStep = request.approval_chain.find(step => step.role === "manager");
          const shouldApprove = !managerStep || managerStep.user_id === approverId;
          console.log(`Manager check: User #${approverId} should${shouldApprove ? '' : ' not'} approve this request`);
          return shouldApprove;
        }
        
        // For department pending requests
        if (request.current_status === "du_pending" && user.role === "du_head") {
          const duHeadStep = request.approval_chain.find(step => step.role === "du_head");
          return !duHeadStep || duHeadStep.user_id === approverId;
        }
        
        // For admin pending requests
        if (request.current_status === "admin_pending" && user.role === "admin") {
          return true; // Any admin can see admin pending requests
        }
        
        // For manager ticket selection
        if (request.current_status === "manager_selection" && user.role === "manager") {
          const managerStep = request.approval_chain.find(step => step.role === "manager");
          return managerStep?.user_id === approverId;
        }
        
        // For final department head approval
        if (request.current_status === "du_final" && user.role === "du_head") {
          const duHeadStep = request.approval_chain.find(step => step.role === "du_head");
          return duHeadStep?.user_id === approverId;
        }
        
        return false;
      });
      
      console.log(`Found ${pendingRequests.length} pending requests for user ${approverId}`);
      return pendingRequests;
    } catch (error) {
      console.error(`Failed to get pending approvals for user ${approverId}:`, error);
      return [];
    }
  };
  
  // Approve a request
  const approveRequest = async (requestId: number, approverId: number, comments?: string): Promise<void> => {
    try {
      const request = await getItemById<TravelRequest>("requests", requestId);
      
      if (!request) {
        throw new Error(`Request ${requestId} not found`);
      }
      
      const now = new Date().toISOString();
      let newStatus: RequestStatus = request.current_status;
      
      // Determine the next status based on current status
      switch (request.current_status) {
        case "manager_pending":
          newStatus = "du_pending";
          break;
        case "du_pending":
          newStatus = "admin_pending";
          break;
        case "admin_pending":
          newStatus = "manager_selection";
          break;
        case "manager_selection":
          newStatus = "du_final";
          break;
        case "du_final":
          newStatus = "approved";
          break;
        default:
          throw new Error(`Invalid current status: ${request.current_status}`);
      }
      
      // Create an approval record
      const approval: Omit<Approval, "approval_id"> = {
        request_id: requestId,
        approver_id: approverId,
        action: "approved",
        comments,
        decision_date: now
      };
      
      await addItem("approvals", approval);
      
      // Update the request status
      const updatedRequest: TravelRequest = {
        ...request,
        current_status: newStatus,
        updated_at: now,
        version_history: [
          ...request.version_history,
          {
            timestamp: now,
            user_id: approverId,
            changeset: { 
              type: "approve", 
              details: `Request approved by ${approverId}, new status: ${newStatus}`,
              comments
            }
          }
        ]
      };
      
      await updateItem("requests", updatedRequest);
      
      // Log audit entry
      await addAuditLog({
        request_id: requestId,
        user_id: approverId,
        action_type: "approve",
        before_state: { status: request.current_status },
        after_state: { status: newStatus },
        ip_address: await simulateIPAddress(),
        timestamp: now
      });
      
      // Create notification for the next approver or requester
      if (newStatus === "approved") {
        // Notify requester that request is approved
        createNotification({
          user_id: request.requester_id,
          title: "Travel Request Approved",
          message: `Your travel request #${requestId} has been fully approved.`,
          request_id: requestId,
          type: "state_change"
        });
      } else {
        // Find the next approver based on the new status
        const nextApprover = await getNextApprover(updatedRequest);
        if (nextApprover) {
          createNotification({
            user_id: nextApprover.id,
            title: "Travel Request Pending Your Approval",
            message: `Request #${requestId} requires your approval.`,
            request_id: requestId,
            type: "state_change"
          });
        }
      }
      
    } catch (error) {
      console.error(`Failed to approve request ${requestId}:`, error);
      throw error;
    }
  };
  
  // Reject a request
  const rejectRequest = async (requestId: number, approverId: number, comments?: string): Promise<void> => {
    try {
      const request = await getItemById<TravelRequest>("requests", requestId);
      
      if (!request) {
        throw new Error(`Request ${requestId} not found`);
      }
      
      const now = new Date().toISOString();
      
      // Create a rejection record
      const rejection: Omit<Approval, "approval_id"> = {
        request_id: requestId,
        approver_id: approverId,
        action: "rejected",
        comments,
        decision_date: now
      };
      
      await addItem("approvals", rejection);
      
      // Update the request status
      const updatedRequest: TravelRequest = {
        ...request,
        current_status: "rejected",
        updated_at: now,
        version_history: [
          ...request.version_history,
          {
            timestamp: now,
            user_id: approverId,
            changeset: { 
              type: "reject", 
              details: `Request rejected by ${approverId}`,
              comments
            }
          }
        ]
      };
      
      await updateItem("requests", updatedRequest);
      
      // Log audit entry
      await addAuditLog({
        request_id: requestId,
        user_id: approverId,
        action_type: "reject",
        before_state: { status: request.current_status },
        after_state: { status: "rejected" },
        ip_address: await simulateIPAddress(),
        timestamp: now
      });
      
      // Notify requester that request is rejected
      createNotification({
        user_id: request.requester_id,
        title: "Travel Request Rejected",
        message: `Your travel request #${requestId} has been rejected.${comments ? ` Reason: ${comments}` : ''}`,
        request_id: requestId,
        type: "state_change"
      });
      
    } catch (error) {
      console.error(`Failed to reject request ${requestId}:`, error);
      throw error;
    }
  };
  
  // Return a request for review
  const returnForReview = async (requestId: number, approverId: number, comments?: string): Promise<void> => {
    try {
      const request = await getItemById<TravelRequest>("requests", requestId);
      
      if (!request) {
        throw new Error(`Request ${requestId} not found`);
      }
      
      const now = new Date().toISOString();
      let newStatus: RequestStatus;
      let returnToUserId: number;
      
      // Determine who to return to based on current status
      switch (request.current_status) {
        case "manager_pending":
          newStatus = "draft";
          returnToUserId = request.requester_id;
          break;
        case "du_pending":
          newStatus = "manager_pending";
          returnToUserId = request.approval_chain.find(step => step.role === "manager")?.user_id || 0;
          break;
        case "admin_pending":
          newStatus = "du_pending";
          returnToUserId = request.approval_chain.find(step => step.role === "du_head")?.user_id || 0;
          break;
        case "manager_selection":
          newStatus = "admin_pending";
          returnToUserId = request.approval_chain.find(step => step.role === "admin")?.user_id || 0;
          break;
        case "du_final":
          newStatus = "manager_selection";
          returnToUserId = request.approval_chain.find(step => step.role === "manager")?.user_id || 0;
          break;
        default:
          throw new Error(`Invalid current status for return: ${request.current_status}`);
      }
      
      // Create a return record
      const returnAction: Omit<Approval, "approval_id"> = {
        request_id: requestId,
        approver_id: approverId,
        action: "returned",
        comments,
        decision_date: now
      };
      
      await addItem("approvals", returnAction);
      
      // Update the request status
      const updatedRequest: TravelRequest = {
        ...request,
        current_status: newStatus,
        updated_at: now,
        version_history: [
          ...request.version_history,
          {
            timestamp: now,
            user_id: approverId,
            changeset: { 
              type: "return", 
              details: `Request returned by ${approverId}, new status: ${newStatus}`,
              comments
            }
          }
        ]
      };
      
      await updateItem("requests", updatedRequest);
      
      // Log audit entry
      await addAuditLog({
        request_id: requestId,
        user_id: approverId,
        action_type: "return",
        before_state: { status: request.current_status },
        after_state: { status: newStatus },
        ip_address: await simulateIPAddress(),
        timestamp: now
      });
      
      // Notify the user the request is returned to
      createNotification({
        user_id: returnToUserId,
        title: "Travel Request Returned for Review",
        message: `Request #${requestId} has been returned to you for review.${comments ? ` Comments: ${comments}` : ''}`,
        request_id: requestId,
        type: "state_change"
      });
      
    } catch (error) {
      console.error(`Failed to return request ${requestId} for review:`, error);
      throw error;
    }
  };
  
  // Get all ticket options for a specific request
  const getTicketOptions = async (requestId: number): Promise<TicketOption[]> => {
    try {
      return await queryByIndex<TicketOption>("ticketOptions", "request_id", requestId);
    } catch (error) {
      console.error(`Failed to get ticket options for request ${requestId}:`, error);
      return [];
    }
  };
  
  // Add a new ticket option
  const addTicketOption = async (ticketOption: Omit<TicketOption, "option_id" | "added_date">): Promise<number> => {
    try {
      const now = new Date().toISOString();
      
      const newTicketOption: Omit<TicketOption, "option_id"> = {
        ...ticketOption,
        added_date: now
      };
      
      const optionId = await addItem<Omit<TicketOption, "option_id">>("ticketOptions", newTicketOption);
      
      return optionId as number;
    } catch (error) {
      console.error("Failed to add ticket option:", error);
      throw error;
    }
  };
  
  // Select a ticket option for a request
  const selectTicketOption = async (requestId: number, ticketOptionId: number, approverId: number): Promise<void> => {
    try {
      const request = await getItemById<TravelRequest>("requests", requestId);
      
      if (!request) {
        throw new Error(`Request ${requestId} not found`);
      }
      
      if (request.current_status !== "manager_selection") {
        throw new Error(`Request ${requestId} is not in the ticket selection stage`);
      }
      
      const now = new Date().toISOString();
      
      // Create an approval record with the selected ticket
      const approval: Omit<Approval, "approval_id"> = {
        request_id: requestId,
        approver_id: approverId,
        action: "approved",
        ticket_option_id: ticketOptionId,
        decision_date: now
      };
      
      await addItem("approvals", approval);
      
      // Update the request status and selected ticket
      const updatedRequest: TravelRequest = {
        ...request,
        current_status: "du_final",
        selected_ticket_id: ticketOptionId,
        updated_at: now,
        version_history: [
          ...request.version_history,
          {
            timestamp: now,
            user_id: approverId,
            changeset: { 
              type: "select_ticket", 
              details: `Ticket option ${ticketOptionId} selected by ${approverId}`
            }
          }
        ]
      };
      
      await updateItem("requests", updatedRequest);
      
      // Log audit entry
      await addAuditLog({
        request_id: requestId,
        user_id: approverId,
        action_type: "approve",
        before_state: { status: request.current_status },
        after_state: { status: "du_final", selected_ticket_id: ticketOptionId },
        ip_address: await simulateIPAddress(),
        timestamp: now
      });
      
      // Notify the DU head that the request is ready for final approval
      const duHeadId = request.approval_chain.find(step => step.role === "du_head")?.user_id;
      if (duHeadId) {
        createNotification({
          user_id: duHeadId,
          title: "Travel Request Ready for Final Approval",
          message: `Request #${requestId} has a selected ticket and is ready for your final approval.`,
          request_id: requestId,
          type: "state_change"
        });
      }
      
    } catch (error) {
      console.error(`Failed to select ticket option for request ${requestId}:`, error);
      throw error;
    }
  };
  
  // Get all audit logs for a specific request
  const getRequestAuditLogs = async (requestId: number): Promise<AuditLog[]> => {
    try {
      return await queryByIndex<AuditLog>("auditLog", "request_id", requestId);
    } catch (error) {
      console.error(`Failed to get audit logs for request ${requestId}:`, error);
      return [];
    }
  };
  
  // Check if a user can act on a request
  const canUserActOnRequest = async (userId: number, requestId: number): Promise<boolean> => {
    try {
      const request = await getItemById<TravelRequest>("requests", requestId);
      
      if (!request) {
        return false;
      }
      
      // User is the requester and request is in draft
      if (request.requester_id === userId && request.current_status === "draft") {
        return true;
      }
      
      // Check if user is the current approver based on role and status
      const user = await getUserById(userId);
      
      if (!user) {
        return false;
      }
      
      let requiredRole;
      
      switch (request.current_status) {
        case "manager_pending":
          requiredRole = "manager";
          break;
        case "du_pending":
        case "du_final":
          requiredRole = "du_head";
          break;
        case "admin_pending":
          requiredRole = "admin";
          break;
        case "manager_selection":
          requiredRole = "manager";
          break;
        default:
          return false;
      }
      
      if (user.role !== requiredRole) {
        return false;
      }
      
      // Find the right approver in the chain
      const approverStep = request.approval_chain.find(step => step.role === requiredRole);
      
      return approverStep?.user_id === userId;
    } catch (error) {
      console.error(`Failed to check if user ${userId} can act on request ${requestId}:`, error);
      return false;
    }
  };
  
  // Get the next approver for a request
  const getNextApprover = async (request: TravelRequest): Promise<User | null> => {
    try {
      let nextApproverRole;
      
      switch (request.current_status) {
        case "manager_pending":
          nextApproverRole = "manager";
          break;
        case "du_pending":
          nextApproverRole = "du_head";
          break;
        case "admin_pending":
          nextApproverRole = "admin";
          break;
        case "manager_selection":
          nextApproverRole = "manager";
          break;
        case "du_final":
          nextApproverRole = "du_head";
          break;
        default:
          return null;
      }
      
      const approverStep = request.approval_chain.find(step => step.role === nextApproverRole);
      
      if (!approverStep) {
        return null;
      }
      
      return await getUserById(approverStep.user_id);
    } catch (error) {
      console.error(`Failed to get next approver for request:`, error);
      return null;
    }
  };
  
  // Get all current requests
  const getCurrentRequests = async (): Promise<TravelRequest[]> => {
    try {
      return await getAllItems<TravelRequest>("requests");
    } catch (error) {
      console.error("Failed to get current requests:", error);
      return [];
    }
  };
  
  // Helper function to add an audit log entry
  const addAuditLog = async (log: Omit<AuditLog, "log_id">): Promise<number> => {
    try {
      return await addItem<Omit<AuditLog, "log_id">>("auditLog", log) as number;
    } catch (error) {
      console.error("Failed to add audit log:", error);
      throw error;
    }
  };
  
  // Helper function to simulate an IP address
  const simulateIPAddress = async (): Promise<string> => {
    // In a real app, this would be handled by the server
    return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  };
  
  // Helper function to create a notification
  const createNotification = async (notification: {
    user_id: number;
    title: string;
    message: string;
    request_id?: number;
    type: "state_change" | "sla_breach" | "budget_overrun" | "general";
  }): Promise<void> => {
    try {
      const now = new Date().toISOString();
      
      const newNotification = {
        ...notification,
        read: false,
        created_at: now
      };
      
      // In a real app, this would be handled by a notification service
      // For this demo, we'll log it to the console
      console.log("Notification created:", newNotification);
      
      // Show toast notification for the current user
      if (currentUser && notification.user_id === currentUser.id) {
        toast({
          title: notification.title,
          description: notification.message,
        });
      }
    } catch (error) {
      console.error("Failed to create notification:", error);
    }
  };
  
  return (
    <WorkflowContext.Provider value={{
      getUserRequests,
      getRequestById,
      createRequest,
      updateRequest,
      submitRequest,
      
      getPendingApprovals,
      approveRequest,
      rejectRequest,
      returnForReview,
      
      getTicketOptions,
      addTicketOption,
      selectTicketOption,
      
      getRequestAuditLogs,
      
      canUserActOnRequest,
      getNextApprover,
      getCurrentRequests,
      
      getUserById
    }}>
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error("useWorkflow must be used within a WorkflowProvider");
  }
  return context;
};
