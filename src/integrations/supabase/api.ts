import { supabase } from "./client";
import {
  User, TravelRequest, Approval, TicketOption, AuditLog, Notification, UserRole, RequestStatus,
  ApprovalAction, AuditAction
} from "@/types";
import { Json } from "@/integrations/supabase/types";

// USERS
export async function getAllUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase.from("users").select("*");
    if (error) throw error;
    return data.map(user => ({
      ...user,
      role: user.role as UserRole
    }));
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? {
      ...data,
      role: data.role as UserRole
    } : null;
  } catch (error) {
    console.error(`Error fetching user with ID ${id}:`, error);
    return null;
  }
}

export async function getUsersByRole(role: UserRole): Promise<User[]> {
  const { data, error } = await supabase.from("users").select("*").eq("role", role);
  if (error) throw error;
  return data.map(user => ({
    ...user,
    role: user.role as UserRole
  }));
}

export async function createUser(user: Omit<User, "id">): Promise<number> {
  const { data, error } = await supabase.from("users").insert([user]).select("id").single();
  if (error) throw error;
  return data.id;
}

// REQUESTS
export async function getAllRequests(): Promise<TravelRequest[]> {
  const { data, error } = await supabase.from("requests").select("*");
  if (error) throw error;
  return data.map(transformRequestFromDB);
}

export async function getUserRequests(userId: number): Promise<TravelRequest[]> {
  const { data, error } = await supabase.from("requests").select("*").eq("requester_id", userId);
  if (error) throw error;
  return data.map(transformRequestFromDB);
}

export async function getRequestById(requestId: number): Promise<TravelRequest | null> {
  const { data, error } = await supabase.from("requests").select("*").eq("request_id", requestId).maybeSingle();
  if (error) throw error;
  return data ? transformRequestFromDB(data) : null;
}

export async function createRequestApi(request: Omit<TravelRequest, "request_id">): Promise<number> {
  const requestToInsert = transformRequestForDB(request);
  const { data, error } = await supabase.from("requests").insert([requestToInsert]).select("request_id").single();
  if (error) throw error;
  return data.request_id;
}

export async function updateRequestApi(request: TravelRequest): Promise<void> {
  const requestToUpdate = transformRequestForDB(request);
  const { error } = await supabase.from("requests").update(requestToUpdate).eq("request_id", request.request_id);
  if (error) throw error;
}

// Helper functions to transform between DB and app types
function transformRequestFromDB(dbRequest: any): TravelRequest {
  return {
    ...dbRequest,
    current_status: dbRequest.current_status as RequestStatus,
    approval_chain: dbRequest.approval_chain as any[],
    travel_details: dbRequest.travel_details as any,
    version_history: dbRequest.version_history as any[]
  };
}

function transformRequestForDB(request: Omit<TravelRequest, "request_id"> | TravelRequest): any {
  return {
    ...request,
    approval_chain: request.approval_chain as unknown as Json,
    travel_details: request.travel_details as unknown as Json,
    version_history: request.version_history as unknown as Json
  };
}

// APPROVALS
export async function addApproval(approval: Omit<Approval, "approval_id">): Promise<number> {
  const { data, error } = await supabase.from("approvals").insert([{
    ...approval,
    action: approval.action
  }]).select("approval_id").single();
  if (error) throw error;
  return data.approval_id;
}

export async function getApprovalsByRequest(requestId: number): Promise<Approval[]> {
  const { data, error } = await supabase.from("approvals").select("*").eq("request_id", requestId);
  if (error) throw error;
  return data.map(approval => ({
    ...approval,
    action: approval.action as ApprovalAction
  }));
}

// TICKET OPTIONS
export async function getTicketOptions(requestId: number): Promise<TicketOption[]> {
  const { data, error } = await supabase.from("ticket_options").select("*").eq("request_id", requestId);
  if (error) throw error;
  return data;
}
export async function addTicketOption(option: Omit<TicketOption, "option_id" | "added_date">): Promise<number> {
  const now = new Date().toISOString();
  const body = { ...option, added_date: now };
  const { data, error } = await supabase.from("ticket_options").insert([body]).select("option_id").single();
  if (error) throw error;
  return data.option_id;
}

// AUDIT LOGS
export async function addAuditLogApi(log: Omit<AuditLog, "log_id">): Promise<number> {
  const logToInsert = {
    ...log,
    action_type: log.action_type,
    before_state: log.before_state as unknown as Json,
    after_state: log.after_state as unknown as Json
  };
  const { data, error } = await supabase.from("audit_logs").insert([logToInsert]).select("log_id").single();
  if (error) throw error;
  return data.log_id;
}

export async function getAuditLogs(requestId: number): Promise<AuditLog[]> {
  const { data, error } = await supabase.from("audit_logs").select("*").eq("request_id", requestId);
  if (error) throw error;
  return data.map(log => ({
    ...log,
    action_type: log.action_type as AuditAction,
    before_state: log.before_state as any,
    after_state: log.after_state as any
  }));
}

// NOTIFICATIONS
export async function addNotification(notification: Omit<Notification, "id">): Promise<number> {
  const { data, error } = await supabase.from("notifications").insert([notification]).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function getUserNotifications(userId: number): Promise<Notification[]> {
  const { data, error } = await supabase.from("notifications").select("*").eq("user_id", userId);
  if (error) throw error;
  return data.map(notification => ({
    ...notification,
    type: notification.type as "state_change" | "sla_breach" | "budget_overrun" | "general"
  }));
}
