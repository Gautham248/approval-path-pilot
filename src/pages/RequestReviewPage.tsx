
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useWorkflow } from "@/context/WorkflowContext";
import { TravelRequest, TicketOption, User, ApprovalStep } from "@/types";
import PageLayout from "@/components/layout/PageLayout";
import { formatDate, getStatusColorClass, getStatusLabel } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  AlertCircle, 
  Calendar, 
  Check, 
  Clock, 
  Loader2, 
  MapPin,
  Tag,
  ThumbsDown,
  TicketCheck,
  SendHorizontal,
  X
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const RequestReviewPage = () => {
  const { id } = useParams<{ id: string }>();
  const requestId = parseInt(id || "0", 10);
  
  const navigate = useNavigate();
  const { currentUser, getUserById } = useAuth();
  const { 
    getRequestById, 
    getTicketOptions,
    canUserActOnRequest,
    approveRequest,
    rejectRequest,
    returnForReview,
    selectTicketOption
  } = useWorkflow();
  
  const [request, setRequest] = useState<TravelRequest | null>(null);
  const [requester, setRequester] = useState<User | null>(null);
  const [ticketOptions, setTicketOptions] = useState<TicketOption[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState("");
  const [decision, setDecision] = useState<"approve" | "reject" | "return" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    const loadRequestData = async () => {
      setIsLoading(true);
      setLoadingError(null);
      
      try {
        if (!requestId || isNaN(requestId)) {
          setLoadingError("Invalid request ID");
          setIsLoading(false);
          return;
        }
        
        if (!currentUser) {
          setLoadingError("User not authenticated");
          setIsLoading(false);
          return;
        }
        
        console.log(`Checking if user ${currentUser.id} can act on request ${requestId}`);
        
        // First load the request to get basic information
        const requestData = await getRequestById(requestId);
        if (!requestData) {
          setLoadingError("Request not found");
          setIsLoading(false);
          return;
        }
        
        // Store the request data first so we have something to display
        setRequest(requestData);
        
        // Now check permissions
        const canAct = await canUserActOnRequest(currentUser.id, requestId);
        console.log(`Can user act on request: ${canAct}`);
        setIsAllowed(canAct);
        
        if (!canAct) {
          setLoadingError("You don't have permission to review this request");
          setIsLoading(false);
          return;
        }
        
        // Load additional data
        const requesterData = await getUserById(requestData.requester_id);
        if (requesterData) {
          setRequester(requesterData);
        }
        
        const tickets = await getTicketOptions(requestId);
        setTicketOptions(tickets);
        
        if (requestData.selected_ticket_id) {
          setSelectedTicketId(requestData.selected_ticket_id);
        }
        
      } catch (error) {
        console.error("Error loading request data:", error);
        setLoadingError("Failed to load request details");
      } finally {
        setIsLoading(false);
      }
    };

    loadRequestData();
  }, [requestId, getRequestById, getUserById, getTicketOptions, currentUser, canUserActOnRequest]);

  const handleSubmitDecision = async () => {
    if (!request || !currentUser || !decision) return;
    
    setIsSubmitting(true);
    try {
      switch (decision) {
        case "approve":
          if (request.current_status === "manager_selection" && selectedTicketId) {
            await selectTicketOption(requestId, selectedTicketId, currentUser.id);
          } else {
            await approveRequest(requestId, currentUser.id, comments);
          }
          break;
        case "reject":
          await rejectRequest(requestId, currentUser.id, comments);
          break;
        case "return":
          await returnForReview(requestId, currentUser.id, comments);
          break;
      }
      
      toast({
        title: "Decision Submitted",
        description: `Your decision has been recorded`,
      });
      
      navigate(`/requests/${requestId}`);
    } catch (error) {
      console.error("Error submitting decision:", error);
      toast({
        title: "Error",
        description: "Failed to submit your decision",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageLayout title="Loading Request" subtitle="Please wait...">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </PageLayout>
    );
  }

  if (loadingError || !request || !isAllowed) {
    return (
      <PageLayout 
        title="Access Denied" 
        subtitle={loadingError || "You don't have permission to review this request"}
      >
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-6">
            {loadingError || "You don't have permission to review this request or the request doesn't exist."}
          </p>
          <Button asChild>
            <Link to="/requests">Back to Requests</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  const isManagerReview = request.current_status === "manager_pending";
  const isDUReview = request.current_status === "du_pending" || request.current_status === "du_final";
  const isAdminReview = request.current_status === "admin_pending";
  const isTicketSelection = request.current_status === "manager_selection";

  let stepTitle = "Review Request";
  if (isManagerReview) stepTitle = "Manager Review";
  if (isDUReview) stepTitle = "Department Head Review";
  if (isAdminReview) stepTitle = "Admin Review";
  if (isTicketSelection) stepTitle = "Select Ticket Option";

  return (
    <PageLayout
      title={`Review Request #${requestId}`}
      subtitle={`Current Status: ${request ? getStatusLabel(request.current_status) : "Loading..."}`}
    >
      <div className="mb-6 p-4 rounded-lg flex items-center border border-blue-200 bg-blue-50">
        <AlertCircle className="h-5 w-5 mr-2 text-blue-600" />
        <span className="text-sm font-medium">
          You are reviewing a request with status: <Badge className={getStatusColorClass(request.current_status)}>
            {getStatusLabel(request.current_status)}
          </Badge>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Travel Details</CardTitle>
              <CardDescription>
                Review the travel information and itinerary
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">From</p>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-600 mr-1" />
                    <p className="text-base">{request.travel_details.source}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">To</p>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-600 mr-1" />
                    <p className="text-base">{request.travel_details.destination}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Start Date</p>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-600 mr-1" />
                    <p className="text-base">{formatDate(request.travel_details.start_date)}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">End Date</p>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-600 mr-1" />
                    <p className="text-base">{formatDate(request.travel_details.end_date)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Purpose</p>
                <p className="text-base whitespace-pre-line">{request.travel_details.purpose}</p>
              </div>

              {request.travel_details.project_code && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Project Code</p>
                  <div className="flex items-center">
                    <Tag className="h-4 w-4 text-gray-600 mr-1" />
                    <p className="text-base">{request.travel_details.project_code}</p>
                  </div>
                </div>
              )}

              {request.travel_details.estimated_cost !== undefined && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Estimated Cost</p>
                  <p className="text-base">${request.travel_details.estimated_cost.toFixed(2)} USD</p>
                </div>
              )}

              {request.travel_details.additional_notes && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Additional Notes</p>
                  <p className="text-base whitespace-pre-line">{request.travel_details.additional_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {isTicketSelection && ticketOptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Select a Ticket Option</CardTitle>
                <CardDescription>
                  Choose the best ticket option for this travel request
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedTicketId?.toString()} onValueChange={(value) => setSelectedTicketId(parseInt(value, 10))}>
                  <div className="space-y-4">
                    {ticketOptions.map((ticket) => (
                      <div 
                        key={ticket.option_id}
                        className={`rounded-lg border p-4 ${
                          selectedTicketId === ticket.option_id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start">
                          <RadioGroupItem 
                            value={ticket.option_id.toString()} 
                            id={`ticket-${ticket.option_id}`}
                            className="mt-1 mr-3"
                          />
                          <div className="flex-1">
                            <Label htmlFor={`ticket-${ticket.option_id}`} className="font-medium text-base">
                              {ticket.carrier} ({ticket.class})
                            </Label>
                            <p className="text-sm text-gray-600">
                              ${ticket.price.toFixed(2)} USD
                            </p>
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-500">Valid from:</span> {formatDate(ticket.validity_start)}
                              </div>
                              <div>
                                <span className="text-gray-500">Valid until:</span> {formatDate(ticket.validity_end)}
                              </div>
                              {ticket.departure_time && (
                                <div>
                                  <span className="text-gray-500">Departure:</span> {formatDate(ticket.departure_time, true)}
                                </div>
                              )}
                              {ticket.arrival_time && (
                                <div>
                                  <span className="text-gray-500">Arrival:</span> {formatDate(ticket.arrival_time, true)}
                                </div>
                              )}
                              {ticket.flight_duration && (
                                <div>
                                  <span className="text-gray-500">Duration:</span> {ticket.flight_duration}
                                </div>
                              )}
                              {ticket.stops !== undefined && (
                                <div>
                                  <span className="text-gray-500">Stops:</span> {ticket.stops}
                                </div>
                              )}
                              {ticket.refundable && (
                                <div>
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Refundable
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Decision</CardTitle>
              <CardDescription>
                {isTicketSelection 
                  ? "Confirm your ticket selection or provide feedback"
                  : "Make a decision on this travel request"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isTicketSelection ? (
                <RadioGroup value={decision || ""} onValueChange={(value) => setDecision(value as "approve" | "reject" | "return")}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="approve" id="approve" />
                      <Label htmlFor="approve" className="flex items-center cursor-pointer">
                        <Check className="h-4 w-4 text-green-600 mr-1" />
                        Approve
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="reject" id="reject" />
                      <Label htmlFor="reject" className="flex items-center cursor-pointer">
                        <X className="h-4 w-4 text-red-600 mr-1" />
                        Reject
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="return" id="return" />
                      <Label htmlFor="return" className="flex items-center cursor-pointer">
                        <SendHorizontal className="h-4 w-4 text-orange-600 mr-1" />
                        Return for Review
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="confirm-selection" 
                      className="rounded text-blue-600 focus:ring-blue-500"
                      checked={decision === "approve"}
                      onChange={() => setDecision(decision === "approve" ? null : "approve")}
                    />
                    <Label htmlFor="confirm-selection" className="flex items-center cursor-pointer">
                      <TicketCheck className="h-4 w-4 text-green-600 mr-1" />
                      Confirm Selected Ticket
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="return-selection" 
                      className="rounded text-blue-600 focus:ring-blue-500"
                      checked={decision === "return"}
                      onChange={() => setDecision(decision === "return" ? null : "return")}
                    />
                    <Label htmlFor="return-selection" className="flex items-center cursor-pointer">
                      <SendHorizontal className="h-4 w-4 text-orange-600 mr-1" />
                      Return to Admin
                    </Label>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Label htmlFor="comments">Comments</Label>
                <Textarea
                  id="comments"
                  placeholder="Add your comments or feedback here..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="mt-1"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-4">
              <Button 
                variant="outline" 
                asChild
                disabled={isSubmitting}
              >
                <Link to={`/requests/${request.request_id}`}>
                  Cancel
                </Link>
              </Button>

              <Button
                onClick={handleSubmitDecision}
                disabled={
                  isSubmitting || 
                  !decision || 
                  (isTicketSelection && decision === "approve" && !selectedTicketId)
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    {decision === "approve" && <Check className="mr-2 h-4 w-4" />}
                    {decision === "reject" && <ThumbsDown className="mr-2 h-4 w-4" />}
                    {decision === "return" && <SendHorizontal className="mr-2 h-4 w-4" />}
                    Submit Decision
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Requester Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {requester ? (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-base">{requester.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-base">{requester.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Department</p>
                    <p className="text-base">{requester.department}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Role</p>
                    <p className="text-base capitalize">{requester.role.replace("_", " ")}</p>
                  </div>
                </>
              ) : (
                <p className="text-gray-500">Requester information not available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="bg-blue-100 text-blue-700 h-6 w-6 rounded-full flex items-center justify-center mr-3">
                    <Clock className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-xs text-gray-500">{formatDate(request.created_at, true)}</p>
                  </div>
                </div>

                {request.version_history.map((entry, index) => {
                  if (index === 0) return null;
                  
                  return (
                    <div key={index} className="flex items-start">
                      <div className="bg-gray-100 text-gray-700 h-6 w-6 rounded-full flex items-center justify-center mr-3">
                        {entry.changeset.type === "edit" && <Clock className="h-3 w-3" />}
                        {entry.changeset.type === "approve" && <Check className="h-3 w-3" />}
                        {entry.changeset.type === "reject" && <X className="h-3 w-3" />}
                        {entry.changeset.type === "submit" && <SendHorizontal className="h-3 w-3" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">{entry.changeset.type}</p>
                        <p className="text-xs text-gray-500">{formatDate(entry.timestamp, true)}</p>
                        {entry.changeset.details && (
                          <p className="text-xs text-gray-600 mt-1">{entry.changeset.details}</p>
                        )}
                        {entry.changeset.comments && (
                          <p className="text-xs italic mt-1">"{entry.changeset.comments}"</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default RequestReviewPage;
