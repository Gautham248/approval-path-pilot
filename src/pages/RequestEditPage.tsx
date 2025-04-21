
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWorkflow } from "@/context/WorkflowContext";
import { useAuth } from "@/context/AuthContext";
import { TravelRequest } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import PageLayout from "@/components/layout/PageLayout";

// Form schema
const formSchema = z.object({
  source: z.string().min(2, { message: "Source location is required" }),
  destination: z.string().min(2, { message: "Destination is required" }),
  start_date: z.date({ required_error: "Start date is required" }),
  end_date: z.date({ required_error: "End date is required" }),
  purpose: z.string().min(10, { message: "Please provide a detailed purpose (min 10 characters)" }),
  project_code: z.string().optional(),
  estimated_cost: z.string().optional().transform(val => (val === "" ? undefined : parseFloat(val))),
  additional_notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const RequestEditPage = () => {
  const { id: requestId } = useParams<{ id: string }>();
  const { getRequestById, updateRequest } = useWorkflow();
  const { currentUser } = useAuth();
  const [requestData, setRequestData] = useState<TravelRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      source: "",
      destination: "",
      purpose: "",
      project_code: "",
      additional_notes: "",
    },
  });

  useEffect(() => {
    const fetchRequestData = async () => {
      if (!requestId) return;
      
      try {
        setLoading(true);
        const request = await getRequestById(parseInt(requestId));
        
        if (request) {
          setRequestData(request);
          
          // Set form values
          form.reset({
            source: request.travel_details.source,
            destination: request.travel_details.destination,
            start_date: new Date(request.travel_details.start_date),
            end_date: new Date(request.travel_details.end_date),
            purpose: request.travel_details.purpose,
            project_code: request.travel_details.project_code || "",
            estimated_cost: request.travel_details.estimated_cost ? String(request.travel_details.estimated_cost) : "",
            additional_notes: request.travel_details.additional_notes || "",
          });
        }
      } catch (error) {
        console.error("Error fetching request data:", error);
        toast({
          title: "Error",
          description: "Could not load request data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRequestData();
  }, [requestId, getRequestById, form]);

  const onSubmit = async (values: FormValues) => {
    if (!requestData || !currentUser) return;
    
    try {
      // Prepare updated request
      const updatedRequest: TravelRequest = {
        ...requestData,
        travel_details: {
          ...requestData.travel_details,
          source: values.source,
          destination: values.destination,
          start_date: values.start_date.toISOString(),
          end_date: values.end_date.toISOString(),
          purpose: values.purpose,
          project_code: values.project_code,
          estimated_cost: values.estimated_cost as number | undefined,
          additional_notes: values.additional_notes,
        },
      };
      
      await updateRequest(updatedRequest);
      
      toast({
        title: "Success",
        description: "Request updated successfully.",
      });
      
      // Navigate back to request details
      navigate(`/requests/${requestId}`);
    } catch (error) {
      console.error("Error updating request:", error);
      toast({
        title: "Error",
        description: "Failed to update request. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <PageLayout
        title={`Edit Request #${requestId}`}
        subtitle="Loading request data..."
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
          <p className="text-gray-600">The request you're looking for doesn't exist or you don't have permission to edit it.</p>
          <Button asChild>
            <div onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </div>
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title={`Edit Request #${requestId}`}
      subtitle="Modify travel request details"
    >
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Edit Travel Request</CardTitle>
            <CardDescription>Update the details of your travel request</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Source */}
                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source Location</FormLabel>
                        <FormControl>
                          <Input placeholder="City, Country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Destination */}
                  <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination</FormLabel>
                        <FormControl>
                          <Input placeholder="City, Country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Start Date */}
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* End Date */}
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Estimated Cost */}
                  <FormField
                    control={form.control}
                    name="estimated_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Cost</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormDescription>Enter the estimated cost in USD (optional)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Project Code */}
                  <FormField
                    control={form.control}
                    name="project_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Project code (if applicable)" {...field} />
                        </FormControl>
                        <FormDescription>Enter the project code if applicable</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Purpose */}
                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose of Travel</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the purpose of your travel" 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Additional Notes */}
                <FormField
                  control={form.control}
                  name="additional_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional details or special requirements" 
                          className="min-h-[80px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>Any additional information that might be relevant</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate(`/requests/${requestId}`)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default RequestEditPage;
