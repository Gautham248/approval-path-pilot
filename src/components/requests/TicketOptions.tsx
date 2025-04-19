
import { TicketOption } from "@/types";
import { formatDate } from "@/lib/utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plane, Clock, Calendar, CheckCircle, DollarSign } from "lucide-react";
import { useState } from "react";
import { useWorkflow } from "@/context/WorkflowContext";
import { toast } from "@/hooks/use-toast";

interface TicketOptionsProps {
  options: TicketOption[];
  requestId: number;
  selectedTicketId?: number | null;
  canSelect: boolean;
}

const TicketOptions = ({ 
  options, 
  requestId, 
  selectedTicketId, 
  canSelect 
}: TicketOptionsProps) => {
  const [selecting, setSelecting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(selectedTicketId || null);
  const { selectTicketOption } = useWorkflow();

  if (!options || options.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ticket Options</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No ticket options available for this request.</p>
        </CardContent>
      </Card>
    );
  }

  const handleSelectTicket = async (optionId: number) => {
    if (!canSelect) return;
    
    try {
      setSelecting(true);
      await selectTicketOption(requestId, optionId, 0); // We'll rely on the auth context for the actual user ID
      
      toast({
        title: "Ticket Selected",
        description: "The ticket option has been successfully selected.",
      });
      
      // In a real app, we would update local state or refresh data here
      window.location.reload();
    } catch (error) {
      console.error("Error selecting ticket:", error);
      toast({
        title: "Selection Failed",
        description: "Failed to select the ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSelecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Available Ticket Options</h3>
        {selectedTicketId && (
          <Badge className="bg-green-100 text-green-800 px-3 py-1">
            <CheckCircle className="h-3 w-3 mr-1" /> Ticket Selected
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option) => (
          <Card key={option.option_id} className={`border-2 ${
            selectedTicketId === option.option_id 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200'
          }`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  <Plane className="mr-2 h-4 w-4" />
                  {option.carrier}
                </CardTitle>
                <Badge className="capitalize">{option.class}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-xl text-green-700">${option.price.toFixed(2)}</span>
                  {option.refundable && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Refundable
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {option.departure_time && (
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 text-gray-500 mr-1" />
                      <span className="text-gray-700">
                        Departure: {formatDate(option.departure_time, true)}
                      </span>
                    </div>
                  )}
                  
                  {option.arrival_time && (
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 text-gray-500 mr-1" />
                      <span className="text-gray-700">
                        Arrival: {formatDate(option.arrival_time, true)}
                      </span>
                    </div>
                  )}
                  
                  {option.flight_duration && (
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 text-gray-500 mr-1" />
                      <span className="text-gray-700">
                        Duration: {option.flight_duration}
                      </span>
                    </div>
                  )}
                  
                  {option.stops !== undefined && (
                    <div className="flex items-center">
                      <span className="text-gray-700">
                        Stops: {option.stops}
                      </span>
                    </div>
                  )}
                  
                  {option.carrier_rating && (
                    <div className="flex items-center">
                      <span className="text-gray-700">
                        Rating: {option.carrier_rating.toFixed(1)} ★
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center text-sm">
                  <DollarSign className="h-3 w-3 text-gray-500 mr-1" />
                  <span className="text-gray-700">
                    Valid: {formatDate(option.validity_start)} to {formatDate(option.validity_end)}
                  </span>
                </div>
                
                {canSelect && (
                  <Button 
                    onClick={() => handleSelectTicket(option.option_id)}
                    className="w-full mt-2"
                    disabled={selecting || selectedTicketId === option.option_id}
                  >
                    {selecting ? 'Selecting...' : 
                      selectedTicketId === option.option_id ? 'Selected' : 'Select This Ticket'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TicketOptions;
