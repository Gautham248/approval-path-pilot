
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useWorkflow } from "@/context/WorkflowContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addDays, format } from "date-fns";
import { CalendarIcon, Save, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { User } from "@/types";

// Define form schema with zod
const requestFormSchema = z.object({
  source: z.string().min(2, "Source must be at least 2 characters"),
  destination: z.string().min(2, "Destination must be at least 2 characters"),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }),
  purpose: z.string().min(10, "Purpose must be at least 10 characters"),
  projectCode: z.string().optional(),
  estimatedCost: z.string().optional(),
  additionalNotes: z.string().optional(),
})
.refine(data => data.destination !== data.source, {
  message: "Destination cannot be the same as source",
  path: ["destination"],
})
.refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
})
.refine(
  data => {
    const maxDuration = addDays(data.startDate, 30);
    return data.endDate <= maxDuration;
  },
  {
    message: "Trip duration cannot exceed 30 days",
    path: ["endDate"],
  }
);

type RequestFormValues = z.infer<typeof requestFormSchema>;

const NewRequestPage = () => {
  const { currentUser } = useAuth();
  const { createRequest, submitRequest, getUsersByRole } = useWorkflow();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managers, setManagers] = useState<User[]>([]);
  const [duHeads, setDUHeads] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);

  // Initialize form with default values
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      source: "",
      destination: "",
      startDate: undefined,
      endDate: undefined,
      purpose: "",
      projectCode: "",
      estimatedCost: "",
      additionalNotes: "",
    },
  });

  const onSubmit = async (data: RequestFormValues, isDraft: boolean = false) => {
    if (!currentUser) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a request",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Load approvers if not already loaded
      if (managers.length === 0) {
        const managersData = await getUsersByRole("manager");
        setManagers(managersData);
      }
      
      if (duHeads.length === 0) {
        const duHeadsData = await getUsersByRole("du_head");
        setDUHeads(duHeadsData);
      }
      
      if (admins.length === 0) {
        const adminsData = await getUsersByRole("admin");
        setAdmins(adminsData);
      }

      // Find appropriate approvers
      const manager = managers.length > 0 ? managers[0] : null;
      const duHead = duHeads.length > 0 ? duHeads[0] : null;
      const admin = admins.length > 0 ? admins[0] : null;

      if (!manager || !duHead || !admin) {
        toast({
          title: "Configuration Error",
          description: "System is missing required approvers",
          variant: "destructive",
        });
        return;
      }

      // Create approval chain
      const approvalChain = [
        { role: "manager", user_id: manager.id },
        { role: "du_head", user_id: duHead.id },
        { role: "admin", user_id: admin.id },
      ];

      // Create request object
      const requestData = {
        requester_id: currentUser.id,
        travel_details: {
          source: data.source,
          destination: data.destination,
          start_date: data.startDate.toISOString(),
          end_date: data.endDate.toISOString(),
          purpose: data.purpose,
          project_code: data.projectCode || undefined,
          estimated_cost: data.estimatedCost ? parseFloat(data.estimatedCost) : undefined,
          additional_notes: data.additionalNotes || undefined,
        },
        approval_chain: approvalChain,
      };

      // Create the request
      const requestId = await createRequest(requestData);

      // If not a draft, submit the request
      if (!isDraft) {
        await submitRequest(requestId);
        toast({
          title: "Request Submitted",
          description: "Your travel request has been submitted for approval",
        });
      } else {
        toast({
          title: "Draft Saved",
          description: "Your travel request has been saved as a draft",
        });
      }

      // Navigate to the request detail page
      navigate(`/requests/${requestId}`);
    } catch (error) {
      console.error("Error creating request:", error);
      toast({
        title: "Error",
        description: "Failed to create travel request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout
      title="New Travel Request"
      subtitle="Fill in the details to create a new travel request"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => onSubmit(data, false))}>
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Source */}
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Location</FormLabel>
                      <FormControl>
                        <Input placeholder="From (e.g., New York)" {...field} />
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
                        <Input placeholder="To (e.g., London)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start Date */}
                <FormField
                  control={form.control}
                  name="startDate"
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
                            disabled={(date) => date < new Date()}
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
                  name="endDate"
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
                            disabled={(date) => 
                              date < new Date() || 
                              (form.watch("startDate") && date < form.watch("startDate"))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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
                    <FormLabel>Travel Purpose</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the purpose of your travel..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Project Code */}
                <FormField
                  control={form.control}
                  name="projectCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Project code (optional)" {...field} />
                      </FormControl>
                      <FormDescription>
                        For billing and departmental allocation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Estimated Cost */}
                <FormField
                  control={form.control}
                  name="estimatedCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Cost (USD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Estimated cost in USD (optional)"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Approximate cost of the entire trip
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Additional Notes */}
              <FormField
                control={form.control}
                name="additionalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional information (optional)"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onSubmit(form.getValues(), true)}
                disabled={isSubmitting || !form.formState.isValid}
              >
                <Save className="mr-2 h-4 w-4" />
                Save as Draft
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !form.formState.isValid}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </PageLayout>
  );
};

export default NewRequestPage;
