
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useWorkflow } from "@/context/WorkflowContext";
import { TravelRequest } from "@/types";
import PageLayout from "@/components/layout/PageLayout";
import { formatDate, getStatusColorClass, getStatusLabel } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, Clock, AlertTriangle, Info, RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ApprovalsPage = () => {
  const { currentUser } = useAuth();
  const { getPendingApprovals, getCurrentRequests } = useWorkflow();
  const [pendingApprovals, setPendingApprovals] = useState<TravelRequest[]>([]);
  const [allRequests, setAllRequests] = useState<TravelRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    const loadApprovals = async () => {
      setIsLoading(true);
      try {
        if (currentUser) {
          const debugMessages: string[] = [];
          debugMessages.push(`Loading approvals for user ID: ${currentUser.id}, role: ${currentUser.role}`);
          
          // Get all requests for debugging
          const allReqs = await getCurrentRequests();
          setAllRequests(allReqs);
          debugMessages.push(`Total requests in system: ${allReqs.length}`);
          
          // Get pending approvals for current user
          const approvals = await getPendingApprovals(currentUser.id);
          debugMessages.push(`Found ${approvals.length} pending approvals for user ${currentUser.id}`);
          
          if (approvals.length === 0) {
            debugMessages.push("No pending approvals found. This could mean:");
            debugMessages.push("- No requests have been submitted that require your approval");
            debugMessages.push("- Requests are in a different status than expected");
            debugMessages.push("- There might be an issue with the approval chain");
            
            // Add details about all requests for debugging
            if (allReqs.length > 0) {
              debugMessages.push("\nAll requests in the system:");
              allReqs.forEach(req => {
                debugMessages.push(`Request #${req.request_id}: Status = ${req.current_status}, Requester = ${req.requester_id}`);
                const approverIds = req.approval_chain.map(step => `${step.role}:${step.user_id}`).join(', ');
                debugMessages.push(`  Approval Chain: ${approverIds}`);
              });
            } else {
              debugMessages.push("There are no travel requests in the system yet.");
            }
          } else {
            approvals.forEach(req => {
              debugMessages.push(`Request #${req.request_id}: Status = ${req.current_status}, Requester = ${req.requester_id}`);
              debugMessages.push(`  Approval chain: ${JSON.stringify(req.approval_chain)}`);
            });
          }
          
          setPendingApprovals(approvals);
          setDebugInfo(debugMessages);
        }
      } catch (error) {
        console.error("Failed to load pending approvals:", error);
        setDebugInfo(prev => [...prev, `Error: ${error instanceof Error ? error.message : String(error)}`]);
      } finally {
        setIsLoading(false);
      }
    };

    loadApprovals();
  }, [currentUser, getPendingApprovals, getCurrentRequests, refreshCounter]);

  const handleRefresh = () => {
    setRefreshCounter(prev => prev + 1);
  };

  return (
    <PageLayout
      title="Pending Approvals"
      subtitle="Review and approve travel requests from your team"
    >
      <div className="mb-4 flex justify-end">
        <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : pendingApprovals.length === 0 ? (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center justify-center text-center py-10">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
                <p className="text-gray-500 mb-6 max-w-md">
                  You have no pending approvals at this time. Check back later for new travel requests.
                </p>
                <Button asChild>
                  <Link to="/">Return to Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Debug info card */}
          <Card className="border-dashed border-amber-300">
            <CardHeader>
              <CardTitle className="text-amber-600">Troubleshooting Information</CardTitle>
              <CardDescription>
                Details to help understand why no approvals are showing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm font-mono bg-gray-50 p-4 rounded-md">
                {debugInfo.map((message, index) => (
                  <div key={index} className="flex">
                    <span className="text-gray-500 mr-2">{index + 1}.</span>
                    <span>{message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* All requests in the system for debugging */}
          {allRequests.length > 0 && (
            <Card className="border-dashed border-blue-300">
              <CardHeader>
                <CardTitle className="text-blue-600">All Requests in System</CardTitle>
                <CardDescription>
                  Overview of all travel requests (admin view)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Requester</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Approval Chain</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allRequests.map((request) => (
                        <TableRow key={request.request_id}>
                          <TableCell>{request.request_id}</TableCell>
                          <TableCell>{request.requester_id}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColorClass(request.current_status)}>
                              {getStatusLabel(request.current_status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(request.created_at)}</TableCell>
                          <TableCell>
                            <div className="text-xs">
                              {request.approval_chain.map((step, i) => (
                                <div key={i}>
                                  {step.role}: User #{step.user_id}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>
                Travel requests waiting for your review and approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Travel Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Waiting Since</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingApprovals.map((request) => {
                    // Calculate how long the request has been waiting
                    const waitingSince = new Date(request.updated_at);
                    const now = new Date();
                    const daysPending = Math.floor((now.getTime() - waitingSince.getTime()) / (1000 * 60 * 60 * 24));
                    
                    // Determine if the request is urgent (pending for more than 3 days)
                    const isUrgent = daysPending >= 3;
                    
                    return (
                      <TableRow key={request.request_id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1">
                            #{request.request_id}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-4 w-4 text-gray-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs">
                                    <strong>Approval chain:</strong>
                                    <ul className="mt-1 list-disc pl-4">
                                      {request.approval_chain.map((step, i) => (
                                        <li key={i}>
                                          {step.role === "manager" ? "Manager" : 
                                            step.role === "du_head" ? "Department Head" : 
                                            step.role === "admin" ? "Admin" : step.role}
                                          : User #{step.user_id}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                        <TableCell>{request.requester_id}</TableCell>
                        <TableCell>{request.travel_details.destination}</TableCell>
                        <TableCell>
                          {formatDate(request.travel_details.start_date)} - {formatDate(request.travel_details.end_date)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColorClass(request.current_status)}>
                            {getStatusLabel(request.current_status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className={`h-4 w-4 mr-1 ${isUrgent ? 'text-red-500' : 'text-amber-500'}`} />
                            <span className={isUrgent ? 'text-red-600 font-medium' : ''}>
                              {daysPending} days
                              {isUrgent && (
                                <span className="ml-2">
                                  <AlertTriangle className="h-4 w-4 inline text-red-500" />
                                </span>
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild>
                            <Link to={`/requests/${request.request_id}/review`}>
                              Review
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approval Guidelines</CardTitle>
              <CardDescription>
                Reference guidelines for reviewing travel requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-1">Manager Approval</h3>
                  <p className="text-sm text-gray-600">
                    Verify that the trip aligns with business objectives and that the timing works for the team.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">Department Head Approval</h3>
                  <p className="text-sm text-gray-600">
                    Confirm department-level budget availability and strategic alignment with department goals.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">Admin Review</h3>
                  <p className="text-sm text-gray-600">
                    Verify policy compliance and add appropriate ticket options based on company travel policy.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">Ticket Selection</h3>
                  <p className="text-sm text-gray-600">
                    Choose the most cost-effective and practical ticket option that meets the traveler's needs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageLayout>
  );
};

export default ApprovalsPage;
