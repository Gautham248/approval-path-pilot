
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
import { Input } from "@/components/ui/input";
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
  TicketPlus,
  SendHorizontal,
  X
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    selectTicketOption,
    addTicketOption
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
  const [isAddingTicket, setIsAddingTicket] = useState(false);
  
  // New state for adding ticket options
  const [newTicket, setNewTicket] = useState<{
    carrier: string;
    class: string;
    price: string;
    departure_time: string;
    arrival_time: string;
    validity_start: string;
    validity_end: string;
    flight_duration: string;
    stops: string;
    refundable: boolean;
    carrier_rating: string;
  }>({
    carrier: "",
    class: "Economy",
    price: "",
    departure_time: "",
    arrival_time: "",
    validity_start: "",
    validity_end: "",
    flight_duration: "",
    stops: "0",
    refundable: false,
    carrier_rating: "4.0"
  });

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
  
  const handleAddTicket = async () => {
    if (!request || !currentUser) return;
    
    try {
      setIsAddingTicket(true);
      
      // Convert the price, stops, and rating to numbers
      const price = parseFloat(newTicket.price);
      const stops = parseInt(newTicket.stops, 10);
      const carrier_rating = parseFloat(newTicket.carrier_rating);
      
      if (isNaN(price) || price <= 0) {
        toast({
          title: "Invalid Price",
          description: "Please enter a valid price",
          variant: "destructive",
        });
        return;
      }
      
      const ticketOption: Omit<TicketOption, "option_id" | "added_date"> = {
        request_id: requestId,
        carrier: newTicket.carrier,
        class: newTicket.class,
        price: price,
        departure_time: newTicket.departure_time,
        arrival_time: newTicket.arrival_time,
        validity_start: newTicket.validity_start,
        validity_end: newTicket.validity_end,
        flight_duration: newTicket.flight_duration,
        stops: stops,
        refundable: newTicket.refundable,
        carrier_rating: carrier_rating,
        added_by_admin_id: currentUser.id
      };
      
      const ticketId = await addTicketOption(ticketOption);
      
      // Add the new ticket to the list
      setTicketOptions(prev => [...prev, {...ticketOption, option_id: ticketId, added_date: new Date().toISOString()}]);
      
      toast({
        title: "Ticket Option Added",
        description: "The ticket option has been added successfully",
      });
      
      // Reset the form
      setNewTicket({
        carrier: "",
        class: "Economy",
        price: "",
        departure_time: "",
        arrival_time: "",
        validity_start: "",
        validity_end: "",
        flight_duration: "",
        stops: "0",
        refundable: false,
        carrier_rating: "4.0"
      });
      
    } catch (error) {
      console.error("Error adding ticket option:", error);
      toast({
        title: "Error",
        description: "Failed to add ticket option",
        variant: "destructive",
      });
    } finally {
      setIsAddingTicket(false);
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
  const isAdminUser = currentUser?.role === "admin";
  
  // Determine if the current user is allowed to add ticket options
  const canAddTickets = isAdminUser && (isAdminReview || request.current_status === "manager_selection");

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

          {/* Ticket Options Card */}
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

          {/* Card for adding ticket options (for Admins only) */}
          {canAddTickets && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TicketPlus className="mr-2 h-5 w-5" />
                  Add Ticket Option
                </CardTitle>
                <CardDescription>
                  Add ticket options for the manager to select from
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="carrier">Carrier</Label>
                    <Input
                      id="carrier"
                      placeholder="Airline Name"
                      value={newTicket.carrier}
                      onChange={(e) => setNewTicket({...newTicket, carrier: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="class">Class</Label>
                    <Select 
                      value={newTicket.class} 
                      onValueChange={(value) => setNewTicket({...newTicket, class: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Economy">Economy</SelectItem>
                        <SelectItem value="Economy Plus">Economy Plus</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                        <SelectItem value="First">First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (USD)</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="Price"
                      value={newTicket.price}
                      min="0"
                      step="0.01"
                      onChange={(e) => setNewTicket({...newTicket, price: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="departure">Departure Time</Label>
                    <Input
                      id="departure"
                      type="datetime-local"
                      value={newTicket.departure_time}
                      onChange={(e) => setNewTicket({...newTicket, departure_time: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="arrival">Arrival Time</Label>
                    <Input
                      id="arrival"
                      type="datetime-local"
                      value={newTicket.arrival_time}
                      onChange={(e) => setNewTicket({...newTicket, arrival_time: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="duration">Flight Duration</Label>
                    <Input
                      id="duration"
                      placeholder="e.g. 2h 35m"
                      value={newTicket.flight_duration}
                      onChange={(e) => setNewTicket({...newTicket, flight_duration: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="validFrom">Valid From</Label>
                    <Input
                      id="validFrom"
                      type="date"
                      value={newTicket.validity_start}
                      onChange={(e) => setNewTicket({...newTicket, validity_start: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="validTo">Valid Until</Label>
                    <Input
                      id="validTo"
                      type="date"
                      value={newTicket.validity_end}
                      onChange={(e) => setNewTicket({...newTicket, validity_end: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="stops">Number of Stops</Label>
                    <Input
                      id="stops"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={newTicket.stops}
                      onChange={(e) => setNewTicket({...newTicket, stops: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rating">Carrier Rating</Label>
                    <Input
                      id="rating"
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      placeholder="4.0"
                      value={newTicket.carrier_rating}
                      onChange={(e) => setNewTicket({...newTicket, carrier_rating: e.target.value})}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-6">
                    <input 
                      type="checkbox" 
                      id="refundable" 
                      className="rounded text-blue-600 focus:ring-blue-500"
                      checked={newTicket.refundable}
                      onChange={(e) => setNewTicket({...newTicket, refundable: e.target.checked})}
                    />
                    <Label htmlFor="refundable">Refundable Ticket</Label>
                  </div>
                </div>
                
                <Button 
                  onClick={handleAddTicket} 
                  disabled={isAddingTicket || !newTicket.carrier || !newTicket.price}
                  className="w-full mt-4"
                >
                  {isAddingTicket ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding Ticket...
                    </>
                  ) : (
                    <>
                      <TicketPlus className="mr-2 h-4 w-4" />
                      Add Ticket Option
                    </>
                  )}
                </Button>
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
