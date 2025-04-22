
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkflow } from "@/context/WorkflowContext";
import { TravelRequest, User } from "@/types";
import { toast } from "@/hooks/use-toast";
import { 
  ClipboardList, 
  SendHorizontal, 
  AlertCircle, 
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Pencil
} from "lucide-react";
import { Link } from "react-router-dom";

interface RequestActionsProps {
  request: TravelRequest;
  currentUser: User | null;
  onActionComplete?: () => void;
}

const RequestActions = ({ request, currentUser, onActionComplete }: RequestActionsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { submitRequest, canUserActOnRequest } = useWorkflow();
  const [canTakeAction, setCanTakeAction] = useState<boolean | null>(null);

  // Check if current user can take action on this request
  useEffect(() => {
    const checkPermissions = async () => {
      if (!currentUser) {
        setCanTakeAction(false);
        return;
      }
      
      try {
        const canAct = await canUserActOnRequest(currentUser.id, request.request_id);
        setCanTakeAction(canAct);
      } catch (error) {
        console.error("Error checking permissions:", error);
        setCanTakeAction(false);
      }
    };
    
    checkPermissions();
  }, [currentUser, request.request_id, canUserActOnRequest]);

  const handleSubmitRequest = async () => {
    if (!request || request.current_status !== "draft") return;
    
    setIsLoading(true);
    try {
      await submitRequest(request.request_id);
      
      toast({
        title: "Request Submitted",
        description: "Your travel request has been submitted for approval.",
      });
      
      if (onActionComplete) {
        onActionComplete();
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to determine if user can edit the request
  const canEditRequest = () => {
    if (!currentUser) return false;
    
    // The requester can always edit their draft requests
    if (currentUser.id === request.requester_id && request.current_status === "draft") return true;
    
    // Admins can edit any request
    if (currentUser.role === "admin") return true;
    
    // Managers and DU heads can always edit requests
    if (["manager", "du_head"].includes(currentUser.role)) {
      return true;
    }
    
    return false;
  };

  if (!request) return null;

  // Create a dedicated edit button if the user can edit
  const renderEditButton = () => {
    if (canEditRequest()) {
      return (
        <Button 
          variant="outline" 
          asChild
          className="w-full md:w-auto"
        >
          <Link to={`/requests/${request.request_id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Request
          </Link>
        </Button>
      );
    }
    return null;
  };

  // Show different actions based on request status and user permissions
  const renderActions = () => {
    const { current_status } = request;
    
    // For draft requests (only requester can submit)
    if (current_status === "draft" && currentUser?.id === request.requester_id) {
      return (
        <div className="flex flex-col space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleSubmitRequest}
              disabled={isLoading}
              className="w-full md:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <SendHorizontal className="mr-2 h-4 w-4" />
                  Submit for Approval
                </>
              )}
            </Button>
            
            {renderEditButton()}
          </div>
          <p className="text-sm text-gray-500">
            Submit this request to start the approval workflow. You won't be able to edit it after submission.
          </p>
        </div>
      );
    }
    
    // For requests pending approval
    if (["manager_pending", "du_pending", "admin_pending", "manager_selection", "du_final"].includes(current_status)) {
      // Check if current user can take action
      if (canTakeAction) {
        return (
          <div className="flex flex-col space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button 
                asChild
                className="w-full md:w-auto"
              >
                <Link to={`/requests/${request.request_id}/review`}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Review This Request
                </Link>
              </Button>
              
              {renderEditButton()}
            </div>
            <p className="text-sm text-gray-500">
              You can approve, reject, or return this request for changes.
            </p>
          </div>
        );
      } else {
        // User can't take action but can view status
        return (
          <div className="flex flex-col space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center mb-1">
                <Clock className="h-4 w-4 text-blue-500 mr-2" />
                <p className="text-blue-700 font-medium">This request is awaiting approval</p>
              </div>
              <p className="text-sm text-gray-600">
                The request is currently being reviewed by the appropriate approvers.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-3">
              {renderEditButton()}
            </div>
          </div>
        );
      }
    }
    
    // For approved requests
    if (current_status === "approved") {
      return (
        <div className="flex flex-col space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center mb-1">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <p className="text-green-700 font-medium">This request has been approved</p>
            </div>
            <p className="text-sm text-gray-600">
              Your travel request has been fully approved and will be processed.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-3">
            {renderEditButton()}
          </div>
        </div>
      );
    }
    
    // For rejected requests
    if (current_status === "rejected") {
      return (
        <div className="flex flex-col space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center mb-1">
              <XCircle className="h-4 w-4 text-red-500 mr-2" />
              <p className="text-red-700 font-medium">This request has been rejected</p>
            </div>
            <p className="text-sm text-gray-600">
              Unfortunately, your travel request has been rejected. Please check the comments for more information.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-3">
            {renderEditButton()}
          </div>
        </div>
      );
    }
    
    // Default action section
    return (
      <div className="flex flex-col space-y-4">
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
          <div className="flex items-center mb-1">
            <AlertCircle className="h-4 w-4 text-gray-500 mr-2" />
            <p className="text-gray-700 font-medium">No actions available</p>
          </div>
          <p className="text-sm text-gray-600">
            There are no actions available for this request at this time.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 mt-3">
          {renderEditButton()}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Actions</CardTitle>
      </CardHeader>
      <CardContent>
        {renderActions()}
      </CardContent>
    </Card>
  );
};

export default RequestActions;
