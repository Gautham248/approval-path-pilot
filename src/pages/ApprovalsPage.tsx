
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
import { CheckCircle2, Loader2, Clock, AlertTriangle } from "lucide-react";

const ApprovalsPage = () => {
  const { currentUser } = useAuth();
  const { getPendingApprovals } = useWorkflow();
  const [pendingApprovals, setPendingApprovals] = useState<TravelRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadApprovals = async () => {
      setIsLoading(true);
      try {
        if (currentUser) {
          const approvals = await getPendingApprovals(currentUser.id);
          setPendingApprovals(approvals);
        }
      } catch (error) {
        console.error("Failed to load pending approvals:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadApprovals();
  }, [currentUser, getPendingApprovals]);

  return (
    <PageLayout
      title="Pending Approvals"
      subtitle="Review and approve travel requests from your team"
    >
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : pendingApprovals.length === 0 ? (
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
                          #{request.request_id}
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
