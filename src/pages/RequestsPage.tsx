
import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useWorkflow } from "@/context/WorkflowContext";
import { TravelRequest } from "@/types";
import PageLayout from "@/components/layout/PageLayout";
import { formatDate, getStatusColorClass, getStatusLabel } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const RequestsPage = () => {
  const { currentUser } = useAuth();
  const { getUserRequests } = useWorkflow();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Get status filter from URL or default to "all"
  const statusFilter = searchParams.get("status") || "all";

  useEffect(() => {
    const loadRequests = async () => {
      setIsLoading(true);
      if (currentUser) {
        try {
          const userRequests = await getUserRequests(currentUser.id);
          setRequests(userRequests);
        } catch (error) {
          console.error("Error loading requests:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadRequests();
  }, [currentUser, getUserRequests]);

  const handleStatusFilter = (status: string) => {
    searchParams.set("status", status);
    setSearchParams(searchParams);
  };

  // Filter requests based on status and search term
  const filteredRequests = requests.filter((request) => {
    // Status filtering
    if (statusFilter === "draft" && request.current_status !== "draft") {
      return false;
    }
    if (statusFilter === "pending" && 
      (request.current_status === "draft" || 
       request.current_status === "approved" || 
       request.current_status === "rejected")) {
      return false;
    }
    if (statusFilter === "approved" && request.current_status !== "approved") {
      return false;
    }
    if (statusFilter === "rejected" && request.current_status !== "rejected") {
      return false;
    }

    // Search term filtering
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        request.travel_details.destination.toLowerCase().includes(search) ||
        request.travel_details.source.toLowerCase().includes(search) ||
        request.travel_details.purpose.toLowerCase().includes(search) ||
        request.request_id.toString().includes(search)
      );
    }

    return true;
  });

  return (
    <PageLayout
      title="My Travel Requests"
      subtitle="Manage and track all your travel requests"
    >
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search requests..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button asChild>
          <Link to="/requests/new">
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Link>
        </Button>
      </div>

      <Tabs defaultValue={statusFilter} onValueChange={handleStatusFilter}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter}>
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : filteredRequests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request ID</TableHead>
                      <TableHead>From - To</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.request_id}>
                        <TableCell className="font-medium">
                          #{request.request_id}
                        </TableCell>
                        <TableCell>
                          {request.travel_details.source} &rarr; {request.travel_details.destination}
                        </TableCell>
                        <TableCell>
                          {formatDate(request.travel_details.start_date)} - {formatDate(request.travel_details.end_date)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={request.travel_details.purpose}>
                          {request.travel_details.purpose}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColorClass(request.current_status)}>
                            {getStatusLabel(request.current_status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(request.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/requests/${request.request_id}`}>
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-gray-500 mb-4">No requests found</p>
                  <Button asChild>
                    <Link to="/requests/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Request
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default RequestsPage;
