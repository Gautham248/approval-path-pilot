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
  Pencil,
  Lock
} from "lucide-react";
import { Link } from "react-router-dom";

interface RequestActionsProps {
  request: TravelRequest;
  currentUser: User | null;
  onActionComplete?: () => void;
}

const RequestActions = ({ request, currentUser, onActionComplete }: RequestActionsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { submitRequest, canUserActOnRequest, closeRequest } = useWorkflow();
  const [canTakeAction, setCanTakeAction] = useState<boolean | null>(null);

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

  const handleCloseRequest = async () => {
    if (!currentUser || !request || request.current_status !== "approved") return;
    
    setIsLoading(true);
    try {
      await closeRequest(request.request_id, currentUser.id);
      
      toast({
        title: "Request Closed",
        description: "The travel request has been successfully closed.",
      });
      
      if (onActionComplete) {
        onActionComplete();
      }
    } catch (error) {
      console.error("Error closing request:", error);
      toast({
        title: "Action Failed",
        description: "There was an error closing the request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canEditRequest = () => {
    if (!currentUser) return false;
    
    if (currentUser.id === request.requester_id && request.current_status === "draft") return true;
    
    if (currentUser.role === "admin") return true;
    
    if (["manager", "du_head"].includes(currentUser.role)) {
      return true;
    }
    
    return false;
  };

  if (!request) return null;

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

  const renderActions = () => {
    const { current_status } = request;
    
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
    
    if (["manager_pending", "du_pending", "admin_pending", "manager_selection", "du_final"].includes(current_status)) {
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
            {currentUser?.role === "admin" && (
              <Button 
                onClick={handleCloseRequest}
                disabled={isLoading}
                className="w-full md:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Closing...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Close Request
                  </>
                )}
              </Button>
            )}
            {renderEditButton()}
          </div>
        </div>
      );
    }
    
    if (current_status === "closed") {
      return (
        <div className="flex flex-col space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
            <div className="flex items-center mb-1">
              <Lock className="h-4 w-4 text-slate-500 mr-2" />
              <p className="text-slate-700 font-medium">This request has been closed</p>
            </div>
            <p className="text-sm text-gray-600">
              This travel request has been completed and closed by the administrator.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-3">
            {renderEditButton()}
          </div>
        </div>
      );
    }
    
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
