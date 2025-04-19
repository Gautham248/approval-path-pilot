
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useWorkflow } from "@/context/WorkflowContext";
import { TravelRequest, TicketOption, User, Approval } from "@/types";
import PageLayout from "@/components/layout/PageLayout";
import { formatDate, getStatusColorClass, getStatusLabel } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  AlertCircle, 
  Calendar, 
  Clock, 
  Edit, 
  ExternalLink, 
  File, 
  Info, 
  Loader2,
  MapPin,
  Send,
  Tag,
  TicketCheck,
  User as UserIcon,
  UserCheck,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const RequestDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const requestId = parseInt(id || "0", 10);
  
  const navigate = useNavigate();
  const { currentUser, getUserById } = useAuth();
  const { 
    getRequestById, 
    getTicketOptions,
    getRequestAuditLogs,
    submitRequest,
    canUserActOnRequest,
  } = useWorkflow();
  
  const [request, setRequest] = useState<TravelRequest | null>(null);
  const [requester, setRequester] = useState<User | null>(null);
  const [ticketOptions, setTicketOptions] = useState<TicketOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    const loadRequestData = async () => {
      setIsLoading(true);
      try {
        if (requestId) {
          // Get request details
          const requestData = await getRequestById(requestId);
          
          if (requestData) {
            setRequest(requestData);
            
            // Get requester details
            const requesterData = await getUserById(requestData.requester_id);
            if (requesterData) {
              setRequester(requesterData);
            }
            
            // Get ticket options if applicable
            const tickets = await getTicketOptions(requestId);
            setTicketOptions(tickets);
            
            // Check if current user can act on this request
            if (currentUser) {
              const canAct = await canUserActOnRequest(currentUser.id, requestId);
              setCanReview(canAct);
            }
          }
        }
      } catch (error) {
        console.error("Error loading request data:", error);
        toast({
          title: "Error",
          description: "Failed to load request details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadRequestData();
  }, [requestId, getRequestById, getUserById, getTicketOptions, currentUser, canUserActOnRequest]);

  // Handle submit request to workflow
  const handleSubmitRequest = async () => {
    if (!request) return;
    
    setIsSubmitting(true);
    try {
      await submitRequest(requestId);
      // Refresh the request data
      const updatedRequest = await getRequestById(requestId);
      setRequest(updatedRequest);
      toast({
        title: "Request Submitted",
        description: "Your travel request has been submitted for approval",
      });
    } catch (error) {
      console.error("Error submitting request:", error);
      toast({
        title: "Error",
        description: "Failed to submit request",
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

  if (!request) {
    return (
      <PageLayout title="Request Not Found" subtitle="The requested travel request could not be found">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Request Not Found</h2>
          <p className="text-gray-500 mb-6">The request you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button asChild>
            <Link to="/requests">Back to Requests</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  // Determine if the current user is the requester
  const isRequester = currentUser?.id === request.requester_id;
  
  // Check if the request is in draft status
  const isDraft = request.current_status === "draft";
  
  // Determine if there's a selected ticket
  const selectedTicket = request.selected_ticket_id 
    ? ticketOptions.find(ticket => ticket.option_id === request.selected_ticket_id) 
    : null;

  return (
    <PageLayout 
      title={`Travel Request #${request.request_id}`}
      subtitle={`${request.travel_details.source} to ${request.travel_details.destination}`}
      backLink={{
        label: "Back to Requests",
        href: "/requests"
      }}
    >
      {/* Status Banner */}
      <div className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
        request.current_status === "approved" 
          ? "bg-green-50 border border-green-200" 
          : request.current_status === "rejected"
          ? "bg-red-50 border border-red-200"
          : "bg-blue-50 border border-blue-200"
      }`}>
        <div className="flex items-center">
          <Info className={`h-5 w-5 mr-2 ${
            request.current_status === "approved" 
              ? "text-green-600" 
              : request.current_status === "rejected"
              ? "text-red-600"
              : "text-blue-600"
          }`} />
          <span className="text-sm font-medium">
            Request Status: <Badge className={getStatusColorClass(request.current_status)}>
              {getStatusLabel(request.current_status)}
            </Badge>
          </span>
        </div>
        <div className="flex gap-2">
          {isRequester && isDraft && (
            <>
              <Button size="sm" variant="outline" asChild>
                <Link to={`/requests/${request.request_id}/edit`}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              </Button>
              <Button 
                size="sm" 
                onClick={handleSubmitRequest} 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    Submit
                  </>
                )}
              </Button>
            </>
          )}
          {canReview && !isDraft && (
            <Button size="sm" asChild>
              <Link to={`/requests/${request.request_id}/review`}>
                <UserCheck className="h-4 w-4 mr-1" />
                Review Request
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Travel Details</CardTitle>
              <CardDescription>
                Travel information and itinerary
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

          {ticketOptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ticket Options</CardTitle>
                <CardDescription>
                  Available travel ticket options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ticketOptions.map((ticket) => (
                    <div 
                      key={ticket.option_id}
                      className={`rounded-lg border p-4 ${
                        request.selected_ticket_id === ticket.option_id 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">
                            {ticket.carrier} ({ticket.class})
                            {request.selected_ticket_id === ticket.option_id && (
                              <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 border-green-200">
                                Selected
                              </Badge>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600">
                            ${ticket.price.toFixed(2)} USD
                          </p>
                        </div>
                        {ticket.refundable && (
                          <Badge variant="outline">Refundable</Badge>
                        )}
                      </div>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
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
                      </div>
                      {request.current_status === "manager_selection" && isRequester && (
                        <div className="mt-3">
                          <Button size="sm" variant="outline">
                            <TicketCheck className="h-4 w-4 mr-1" />
                            Select This Option
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Requested By</p>
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 text-gray-600 mr-1" />
                  <p className="text-base">{requester?.name || "Unknown"}</p>
                </div>
                <p className="text-xs text-gray-500">{requester?.email || ""}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Department</p>
                <p className="text-base">{requester?.department || "Unknown"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Created On</p>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-600 mr-1" />
                  <p className="text-base">{formatDate(request.created_at, true)}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-600 mr-1" />
                  <p className="text-base">{formatDate(request.updated_at, true)}</p>
                </div>
              </div>

              {selectedTicket && (
                <div className="pt-2">
                  <p className="text-sm font-medium text-gray-500 mb-1">Selected Ticket</p>
                  <div className="rounded-md bg-gray-50 p-3">
                    <p className="font-medium">{selectedTicket.carrier}</p>
                    <p className="text-sm text-gray-600">
                      {selectedTicket.class} - ${selectedTicket.price.toFixed(2)} USD
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approval Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {request.approval_chain.map((step, index) => {
                  let status = "pending";
                  
                  if (
                    (step.role === "manager" && ["manager_pending", "draft"].includes(request.current_status)) ||
                    (step.role === "du_head" && ["du_pending"].includes(request.current_status)) ||
                    (step.role === "admin" && ["admin_pending"].includes(request.current_status)) ||
                    (step.role === "manager" && ["manager_selection"].includes(request.current_status)) ||
                    (step.role === "du_head" && ["du_final"].includes(request.current_status))
                  ) {
                    status = "current";
                  } else if (
                    (step.role === "manager" && !["manager_pending", "draft", "manager_selection"].includes(request.current_status)) ||
                    (step.role === "du_head" && !["du_pending", "du_final", "draft"].includes(request.current_status) && request.current_status !== "rejected") ||
                    (step.role === "admin" && ["manager_selection", "du_final", "approved"].includes(request.current_status))
                  ) {
                    status = "completed";
                  }

                  // Define color classes based on status
                  const colorClass = 
                    status === "completed" 
                      ? "bg-green-100 text-green-800 border-green-200" 
                      : status === "current"
                      ? "bg-blue-100 text-blue-800 border-blue-200"
                      : "bg-gray-100 text-gray-800 border-gray-200";

                  return (
                    <div key={index} className="flex items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center mr-3 ${
                        status === "completed" 
                          ? "bg-green-500 text-white" 
                          : status === "current"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {step.role === "manager" ? "Manager Approval" :
                           step.role === "du_head" ? "Department Head Approval" :
                           step.role === "admin" ? "Admin Review" : "Unknown Step"}
                        </p>
                      </div>
                      <Badge variant="outline" className={`ml-2 ${colorClass}`}>
                        {status === "completed" ? "Approved" : 
                         status === "current" ? "In Progress" : "Pending"}
                      </Badge>
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

export default RequestDetailPage;
