
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { 
  Plane, 
  Plus, 
  Clock, 
  Check, 
  X, 
  Calendar, 
  Loader2,
  AlertCircle,
  FileCheck,
  Clock3,
  ArrowRight,
  Activity
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWorkflow } from "@/context/WorkflowContext";
import { TravelRequest, User } from "@/types";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, getStatusColorClass, getStatusLabel } from "@/lib/utils/formatters";

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const { getUserRequests, getPendingApprovals } = useWorkflow();
  const [isLoading, setIsLoading] = useState(true);
  const [myRequests, setMyRequests] = useState<TravelRequest[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<TravelRequest[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (currentUser) {
          // Load user's requests
          const requests = await getUserRequests(currentUser.id);
          setMyRequests(requests);

          // Load pending approvals if user is an approver
          if (["manager", "admin", "du_head"].includes(currentUser.role)) {
            const approvals = await getPendingApprovals(currentUser.id);
            setPendingApprovals(approvals);
          }
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser, getUserRequests, getPendingApprovals]);

  // Stats calculations
  const draftCount = myRequests.filter(req => req.current_status === "draft").length;
  const pendingCount = myRequests.filter(req => !["draft", "approved", "rejected"].includes(req.current_status)).length;
  const approvedCount = myRequests.filter(req => req.current_status === "approved").length;
  const rejectedCount = myRequests.filter(req => req.current_status === "rejected").length;

  // Upcoming travel dates
  const upcomingTravel = myRequests.filter(req => {
    if (req.current_status === "approved") {
      const startDate = new Date(req.travel_details.start_date);
      const today = new Date();
      return startDate > today;
    }
    return false;
  }).sort((a, b) => {
    return new Date(a.travel_details.start_date).getTime() - new Date(b.travel_details.start_date).getTime();
  }).slice(0, 3);

  return (
    <PageLayout 
      title={`Welcome, ${currentUser?.name}`} 
      subtitle={`Travel Dashboard | ${format(new Date(), "EEEE, MMMM d, yyyy")}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Quick stats cards */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Draft Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="bg-gray-100 p-2 rounded-full mr-4">
                <Clock className="h-6 w-6 text-gray-700" />
              </div>
              {isLoading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="text-3xl font-semibold">{draftCount}</div>
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Link to="/requests?status=draft" className="text-sm text-blue-600 hover:text-blue-800">
              View drafts
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-full mr-4">
                <Clock3 className="h-6 w-6 text-blue-700" />
              </div>
              {isLoading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="text-3xl font-semibold">{pendingCount}</div>
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Link to="/requests?status=pending" className="text-sm text-blue-600 hover:text-blue-800">
              View pending
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Approved Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-full mr-4">
                <Check className="h-6 w-6 text-green-700" />
              </div>
              {isLoading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="text-3xl font-semibold">{approvedCount}</div>
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Link to="/requests?status=approved" className="text-sm text-blue-600 hover:text-blue-800">
              View approved
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Rejected Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="bg-red-100 p-2 rounded-full mr-4">
                <X className="h-6 w-6 text-red-700" />
              </div>
              {isLoading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="text-3xl font-semibold">{rejectedCount}</div>
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Link to="/requests?status=rejected" className="text-sm text-blue-600 hover:text-blue-800">
              View rejected
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="col-span-2 space-y-6">
          {/* My Recent Requests */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>My Recent Requests</CardTitle>
                <Button asChild>
                  <Link to="/requests/new">
                    <Plus className="mr-2 h-4 w-4" />
                    New Request
                  </Link>
                </Button>
              </div>
              <CardDescription>
                Your recent travel requests and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-60" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : myRequests.length > 0 ? (
                <div className="space-y-4">
                  {myRequests.slice(0, 5).map((request) => (
                    <div key={request.request_id} className="flex items-start gap-4 border-b border-gray-100 pb-4">
                      <div className="flex-shrink-0">
                        <Plane className="h-10 w-10 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {request.travel_details.source} to {request.travel_details.destination}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {formatDate(request.travel_details.start_date)} - {formatDate(request.travel_details.end_date)}
                            </p>
                          </div>
                          <Badge className={getStatusColorClass(request.current_status)}>
                            {getStatusLabel(request.current_status)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-gray-600 truncate">
                          {request.travel_details.purpose}
                        </p>
                        <div className="mt-2">
                          <Link 
                            to={`/requests/${request.request_id}`} 
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No travel requests yet</h3>
                  <p className="text-gray-500 mb-4">Create your first travel request to get started.</p>
                  <Button asChild>
                    <Link to="/requests/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Request
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
            {myRequests.length > 5 && (
              <CardFooter className="pt-0">
                <Button variant="outline" asChild className="w-full">
                  <Link to="/requests">View All Requests</Link>
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Pending Approvals (for managers, admins, and DU heads) */}
          {["manager", "admin", "du_head"].includes(currentUser?.role || "") && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>
                  Requests waiting for your review and approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-4 w-60" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : pendingApprovals.length > 0 ? (
                  <div className="space-y-4">
                    {pendingApprovals.slice(0, 5).map((request) => (
                      <div key={request.request_id} className="flex items-start gap-4 border-b border-gray-100 pb-4">
                        <div className="flex-shrink-0">
                          <FileCheck className="h-10 w-10 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {request.travel_details.source} to {request.travel_details.destination}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {formatDate(request.travel_details.start_date)} - {formatDate(request.travel_details.end_date)}
                              </p>
                            </div>
                            <Badge className={getStatusColorClass(request.current_status)}>
                              {getStatusLabel(request.current_status)}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-gray-600 truncate">
                            {request.travel_details.purpose}
                          </p>
                          <div className="mt-2">
                            <Link 
                              to={`/requests/${request.request_id}/review`} 
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Review Now
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No pending approvals</h3>
                    <p className="text-gray-500">You're all caught up!</p>
                  </div>
                )}
              </CardContent>
              {pendingApprovals.length > 5 && (
                <CardFooter className="pt-0">
                  <Button variant="outline" asChild className="w-full">
                    <Link to="/approvals">View All Approvals</Link>
                  </Button>
                </CardFooter>
              )}
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Upcoming Travel */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Upcoming Travel</CardTitle>
              <CardDescription>Your approved upcoming trips</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              ) : upcomingTravel.length > 0 ? (
                <div className="space-y-4">
                  {upcomingTravel.map((trip) => (
                    <div key={trip.request_id} className="space-y-2 border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">
                          {formatDate(trip.travel_details.start_date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-sm">{trip.travel_details.source}</span>
                        <ArrowRight className="h-3 w-3 mx-1" />
                        <span className="font-medium text-sm">{trip.travel_details.destination}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {trip.travel_details.purpose}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No upcoming trips</h3>
                  <p className="text-gray-500 mb-4">You don't have any approved travel plans.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approval Timeline (for employees) */}
          {currentUser?.role === "employee" && pendingCount > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Request Timeline</CardTitle>
                <CardDescription>Status of your pending requests</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myRequests
                      .filter(req => !["draft", "approved", "rejected"].includes(req.current_status))
                      .slice(0, 3)
                      .map((request) => {
                        // Calculate progress percentage based on current status
                        let progressPercentage = 0;
                        switch (request.current_status) {
                          case "manager_pending":
                            progressPercentage = 20;
                            break;
                          case "du_pending":
                            progressPercentage = 40;
                            break;
                          case "admin_pending":
                            progressPercentage = 60;
                            break;
                          case "manager_selection":
                            progressPercentage = 80;
                            break;
                          case "du_final":
                            progressPercentage = 90;
                            break;
                        }

                        return (
                          <div key={request.request_id} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">
                                Request #{request.request_id}
                              </span>
                              <Badge className={getStatusColorClass(request.current_status)}>
                                {getStatusLabel(request.current_status)}
                              </Badge>
                            </div>
                            <Progress value={progressPercentage} className="h-2" />
                            <p className="text-xs text-gray-500">
                              {request.travel_details.destination} ({formatDate(request.travel_details.start_date)})
                            </p>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Activity Statistics (for admins and DU heads) */}
          {["admin", "du_head"].includes(currentUser?.role || "") && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Activity Overview</CardTitle>
                <CardDescription>System activity snapshot</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm font-medium">Active Requests</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {isLoading ? (
                        <Skeleton className="h-4 w-10 inline-block" />
                      ) : (
                        pendingCount.toString()
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium">Approved Today</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {isLoading ? (
                        <Skeleton className="h-4 w-10 inline-block" />
                      ) : (
                        "2"
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                      <span className="text-sm font-medium">SLA Breaches</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {isLoading ? (
                        <Skeleton className="h-4 w-10 inline-block" />
                      ) : (
                        "0"
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-purple-600 mr-2" />
                      <span className="text-sm font-medium">Avg. Approval Time</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {isLoading ? (
                        <Skeleton className="h-4 w-10 inline-block" />
                      ) : (
                        "1.2 days"
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" asChild className="w-full">
                  <Link to="/analytics">View Analytics</Link>
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default DashboardPage;
