
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWorkflow } from "@/context/WorkflowContext";
import { TravelRequest, RequestStatus } from "@/types";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer 
} from "recharts";
import { Loader2, DollarSign, MapPin, Clock, Users } from "lucide-react";
import { formatDate } from "@/lib/utils/formatters";

const AnalyticsPage = () => {
  const { currentUser } = useAuth();
  const { getCurrentRequests } = useWorkflow();
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const allRequests = await getCurrentRequests();
        setRequests(allRequests);
      } catch (error) {
        console.error("Failed to load analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [getCurrentRequests]);

  if (isLoading) {
    return (
      <PageLayout title="Analytics Dashboard" subtitle="Loading analytics data...">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </PageLayout>
    );
  }

  // Prepare data for charts
  
  // 1. Status distribution
  const statusCounts: Record<string, number> = {};
  requests.forEach(request => {
    statusCounts[request.current_status] = (statusCounts[request.current_status] || 0) + 1;
  });
  
  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status,
    value: count
  }));
  
  // 2. Requests by month
  const monthlyData: Record<string, number> = {};
  requests.forEach(request => {
    const date = new Date(request.created_at);
    const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
    monthlyData[monthYear] = (monthlyData[monthYear] || 0) + 1;
  });
  
  const requestsByMonth = Object.entries(monthlyData)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => {
      const [aMonth, aYear] = a.month.split('/').map(Number);
      const [bMonth, bYear] = b.month.split('/').map(Number);
      return aYear === bYear ? aMonth - bMonth : aYear - bYear;
    });
  
  // 3. Top destinations
  const destinationCounts: Record<string, number> = {};
  requests.forEach(request => {
    const dest = request.travel_details.destination;
    destinationCounts[dest] = (destinationCounts[dest] || 0) + 1;
  });
  
  const topDestinations = Object.entries(destinationCounts)
    .map(([destination, count]) => ({ destination, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // 4. Average approval time
  const approvedRequests = requests.filter(req => req.current_status === "approved");
  let totalApprovalDays = 0;
  
  approvedRequests.forEach(request => {
    const createDate = new Date(request.created_at);
    const lastUpdateDate = new Date(request.updated_at);
    const daysToApprove = Math.floor((lastUpdateDate.getTime() - createDate.getTime()) / (1000 * 60 * 60 * 24));
    totalApprovalDays += daysToApprove;
  });
  
  const avgApprovalDays = approvedRequests.length > 0 
    ? (totalApprovalDays / approvedRequests.length).toFixed(1) 
    : "N/A";

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  const STATUS_COLORS: Record<RequestStatus, string> = {
    "draft": "#9CA3AF",
    "manager_pending": "#60A5FA",
    "du_pending": "#34D399",
    "admin_pending": "#A78BFA",
    "manager_selection": "#F59E0B",
    "du_final": "#10B981",
    "approved": "#22C55E",
    "rejected": "#EF4444",
    "closed": "#94A3B8"  // Adding the 'closed' status with a slate color
  };

  return (
    <PageLayout
      title="Analytics Dashboard"
      subtitle="Travel request statistics and insights"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Summary Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-full mr-4">
                <Users className="h-6 w-6 text-blue-700" />
              </div>
              <div className="text-3xl font-semibold">{requests.length}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Approval Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-full mr-4">
                <Clock className="h-6 w-6 text-green-700" />
              </div>
              <div className="text-3xl font-semibold">
                {requests.length > 0 
                  ? `${Math.round((requests.filter(r => r.current_status === "approved").length / requests.length) * 100)}%` 
                  : "0%"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Avg. Approval Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 rounded-full mr-4">
                <Clock className="h-6 w-6 text-purple-700" />
              </div>
              <div className="text-3xl font-semibold">
                {avgApprovalDays} days
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="bg-amber-100 p-2 rounded-full mr-4">
                <Clock className="h-6 w-6 text-amber-700" />
              </div>
              <div className="text-3xl font-semibold">
                {requests.filter(r => 
                  !["draft", "approved", "rejected"].includes(r.current_status)
                ).length}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Request Analytics</TabsTrigger>
          <TabsTrigger value="destinations">Destinations</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Request Status Distribution</CardTitle>
                <CardDescription>
                  Breakdown of travel requests by current status
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={STATUS_COLORS[entry.name as RequestStatus] || COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Destinations</CardTitle>
                <CardDescription>
                  Most requested travel destinations
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topDestinations}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="destination" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Number of Requests" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Requests by Month</CardTitle>
              <CardDescription>
                Number of travel requests submitted each month
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={requestsByMonth}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      name="Number of Requests"
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="destinations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Popular Destinations</CardTitle>
              <CardDescription>
                Detailed breakdown of travel destinations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3">Destination</th>
                        <th className="text-left py-3">Count</th>
                        <th className="text-left py-3">Avg. Duration</th>
                        <th className="text-left py-3">Avg. Est. Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(destinationCounts)
                        .sort((a, b) => b[1] - a[1])
                        .map(([destination, count]) => {
                          // Calculate average duration for this destination
                          const destinationRequests = requests.filter(
                            req => req.travel_details.destination === destination
                          );
                          
                          let totalDuration = 0;
                          let totalCost = 0;
                          let costCount = 0;
                          
                          destinationRequests.forEach(req => {
                            const startDate = new Date(req.travel_details.start_date);
                            const endDate = new Date(req.travel_details.end_date);
                            const duration = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                            totalDuration += duration;
                            
                            if (req.travel_details.estimated_cost) {
                              totalCost += req.travel_details.estimated_cost;
                              costCount++;
                            }
                          });
                          
                          const avgDuration = totalDuration / destinationRequests.length;
                          const avgCost = costCount > 0 ? totalCost / costCount : 0;
                          
                          return (
                            <tr key={destination} className="border-b">
                              <td className="py-3">{destination}</td>
                              <td className="py-3">{count}</td>
                              <td className="py-3">{avgDuration.toFixed(1)} days</td>
                              <td className="py-3">${avgCost.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Request Activity</CardTitle>
              <CardDescription>
                Timeline of recently submitted and approved requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {requests
                  .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                  .slice(0, 10)
                  .map(request => {
                    const statusColors: Record<string, string> = {
                      "approved": "text-green-600",
                      "rejected": "text-red-600",
                      "draft": "text-gray-600",
                      "manager_pending": "text-blue-600",
                      "du_pending": "text-blue-600",
                      "admin_pending": "text-purple-600",
                      "manager_selection": "text-amber-600",
                      "du_final": "text-emerald-600",
                    };
                    
                    return (
                      <div key={request.request_id} className="flex">
                        <div className="mr-4 flex flex-col items-center">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${
                            statusColors[request.current_status] || "text-gray-600"
                          }`}>
                            {request.request_id}
                          </div>
                          <div className="h-full w-0.5 bg-gray-200 mt-2"></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium">
                              {request.travel_details.source} to {request.travel_details.destination}
                            </h4>
                            <span className="text-sm text-gray-500">
                              {formatDate(request.updated_at, true)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {request.travel_details.purpose.substring(0, 100)}
                            {request.travel_details.purpose.length > 100 ? "..." : ""}
                          </p>
                          <div className="flex items-center mt-2 text-sm">
                            <span className={`font-medium ${statusColors[request.current_status] || "text-gray-600"}`}>
                              Status: {request.current_status.replace(/_/g, " ")}
                            </span>
                            <span className="mx-2">•</span>
                            <span>
                              Travel dates: {formatDate(request.travel_details.start_date)} - {formatDate(request.travel_details.end_date)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default AnalyticsPage;
