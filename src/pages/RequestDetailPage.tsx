
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useWorkflow } from "@/context/WorkflowContext";
import { useAuth } from "@/context/AuthContext";
import { TravelRequest, User, TicketOption } from "@/types";
import { formatDate, getStatusLabel, getStatusColorClass } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, MapPin, DollarSign, FileText, Clock, User as UserIcon, CheckCircle2, XCircle } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import RequestTimeline from "@/components/requests/RequestTimeline";
import TicketOptions from "@/components/requests/TicketOptions";
import RequestActions from "@/components/requests/RequestActions";

const RequestDetailPage = () => {
  const { id: requestId } = useParams<{ id: string }>();
  const { getRequestById, getUserById, getTicketOptions } = useWorkflow();
  const { currentUser } = useAuth();
  const [requestData, setRequestData] = useState<TravelRequest | null>(null);
  const [requester, setRequester] = useState<User | null>(null);
  const [ticketOptions, setTicketOptions] = useState<TicketOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequestData = async () => {
      if (!requestId) return;
      
      try {
        setLoading(true);
        const request = await getRequestById(parseInt(requestId));
        setRequestData(request);
        
        // Fetch requester details
        if (request) {
          const requesterData = await getUserById(request.requester_id);
          setRequester(requesterData);
          
          // Fetch ticket options if available
          // This would be implemented in a real app
          // For now, we'll use mock data
          if (request.current_status === "manager_selection") {
            setTicketOptions([
              {
                option_id: 1,
                request_id: request.request_id,
                carrier: "Delta Airlines",
                class: "Economy",
                price: 450,
                departure_time: "2023-11-15T08:30:00Z",
                arrival_time: "2023-11-15T11:45:00Z",
                validity_start: "2023-11-15T00:00:00Z",
                validity_end: "2023-11-15T23:59:59Z",
                added_by_admin_id: 2,
                added_date: "2023-11-01T14:23:45Z",
                carrier_rating: 4.2,
                refundable: true,
                flight_duration: "3h 15m",
                stops: 0
              },
              {
                option_id: 2,
                request_id: request.request_id,
                carrier: "United Airlines",
                class: "Economy Plus",
                price: 520,
                departure_time: "2023-11-15T10:15:00Z",
                arrival_time: "2023-11-15T13:20:00Z",
                validity_start: "2023-11-15T00:00:00Z",
                validity_end: "2023-11-15T23:59:59Z",
                added_by_admin_id: 2,
                added_date: "2023-11-01T14:25:12Z",
                carrier_rating: 3.8,
                refundable: false,
                flight_duration: "3h 05m",
                stops: 0
              }
            ]);
          }
        }
      } catch (error) {
        console.error("Error fetching request data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequestData();
  }, [requestId, getRequestById, getUserById]);

  if (loading) {
    return (
      <PageLayout
        title={`Request #${requestId}`}
        subtitle="Loading request details..."
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </PageLayout>
    );
  }

  if (!requestData) {
    return (
      <PageLayout
        title="Request Not Found"
        subtitle="The requested travel request could not be found"
      >
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-gray-600">The request you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button asChild>
            <Link to="/requests">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Requests
            </Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  const { travel_details, current_status, created_at, updated_at } = requestData;

  return (
    <PageLayout
      title={`Request #${requestId}`}
      subtitle={`Status: ${requestData ? getStatusLabel(requestData.current_status) : "Loading..."}`}
    >
      <div className="space-y-6">
        {/* Status Badge */}
        <div className="flex justify-between items-center">
          <Badge className={`${getStatusColorClass(current_status)} text-sm py-1 px-3`}>
            {getStatusLabel(current_status)}
          </Badge>
          <div className="text-sm text-gray-500">
            <span className="mr-4">Created: {formatDate(created_at)}</span>
            <span>Last Updated: {formatDate(updated_at)}</span>
          </div>
        </div>

        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Request Details</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            {ticketOptions.length > 0 && (
              <TabsTrigger value="tickets">Ticket Options</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="details" className="space-y-6 pt-4">
            {/* Requester Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Requester Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-medium mr-2">Name:</span>
                    <span>{requester?.name || "Unknown"}</span>
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-medium mr-2">Department:</span>
                    <span>{requester?.department || "Unknown"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Travel Details */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Travel Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-medium mr-2">From:</span>
                    <span>{travel_details.source}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-medium mr-2">To:</span>
                    <span>{travel_details.destination}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-medium mr-2">Start Date:</span>
                    <span>{formatDate(travel_details.start_date)}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-medium mr-2">End Date:</span>
                    <span>{formatDate(travel_details.end_date)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-medium mr-2">Duration:</span>
                    <span>
                      {Math.ceil(
                        (new Date(travel_details.end_date).getTime() - 
                         new Date(travel_details.start_date).getTime()) / 
                        (1000 * 60 * 60 * 24)
                      )} days
                    </span>
                  </div>
                  {travel_details.estimated_cost && (
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="font-medium mr-2">Estimated Cost:</span>
                      <span>${travel_details.estimated_cost.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Purpose of Travel</h4>
                  <p className="text-gray-700">{travel_details.purpose}</p>
                </div>

                {travel_details.project_code && (
                  <div>
                    <h4 className="font-medium mb-1">Project Code</h4>
                    <p className="text-gray-700">{travel_details.project_code}</p>
                  </div>
                )}

                {travel_details.additional_notes && (
                  <div>
                    <h4 className="font-medium mb-1">Additional Notes</h4>
                    <p className="text-gray-700">{travel_details.additional_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selected Ticket (if any) */}
            {requestData.selected_ticket_id && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Selected Ticket</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 border rounded-md bg-green-50 border-green-200">
                    <div className="flex items-center mb-2">
                      <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
                      <span className="font-medium text-green-800">
                        Ticket #{requestData.selected_ticket_id} has been selected for this request
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      The travel details will be sent to the requester once the request is fully approved.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Request Actions */}
            <RequestActions 
              request={requestData}
              currentUser={currentUser}
              onActionComplete={() => {
                // Refresh data after action
                window.location.reload();
              }}
            />
          </TabsContent>

          <TabsContent value="timeline" className="pt-4">
            <RequestTimeline request={requestData} />
          </TabsContent>

          {ticketOptions.length > 0 && (
            <TabsContent value="tickets" className="pt-4">
              <TicketOptions 
                options={ticketOptions}
                requestId={requestData.request_id}
                selectedTicketId={requestData.selected_ticket_id}
                canSelect={
                  currentUser?.role === "manager" && 
                  current_status === "manager_selection"
                }
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default RequestDetailPage;
