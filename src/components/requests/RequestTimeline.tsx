
import { TravelRequest } from "@/types";
import { formatDate } from "@/lib/utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Check,
  Calendar, 
  Clock, 
  SendHorizontal, 
  Pencil,
  UserCircle,
  X,
  TicketCheck
} from "lucide-react";

interface RequestTimelineProps {
  request: TravelRequest;
}

const RequestTimeline = ({ request }: RequestTimelineProps) => {
  if (!request || !request.version_history) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {request.version_history.map((entry, index) => {
            // Determine icon based on changeset type
            let Icon = Clock;
            let colorClass = "text-gray-500";
            let bgColorClass = "bg-gray-100";
            
            switch (entry.changeset.type) {
              case "create":
                Icon = Calendar;
                colorClass = "text-blue-500";
                bgColorClass = "bg-blue-100";
                break;
              case "edit":
                Icon = Pencil;
                colorClass = "text-amber-500";
                bgColorClass = "bg-amber-100";
                break;
              case "submit":
                Icon = SendHorizontal;
                colorClass = "text-indigo-500";
                bgColorClass = "bg-indigo-100";
                break;
              case "approve":
                Icon = Check;
                colorClass = "text-green-500";
                bgColorClass = "bg-green-100";
                break;
              case "reject":
                Icon = X;
                colorClass = "text-red-500";
                bgColorClass = "bg-red-100";
                break;
              case "select_ticket":
                Icon = TicketCheck;
                colorClass = "text-purple-500";
                bgColorClass = "bg-purple-100";
                break;
              case "return":
                Icon = SendHorizontal;
                colorClass = "text-orange-500";
                bgColorClass = "bg-orange-100";
                break;
            }

            return (
              <div key={index} className="flex items-start">
                <div className={`mr-4 mt-1 rounded-full p-2 ${bgColorClass}`}>
                  <Icon className={`h-4 w-4 ${colorClass}`} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium capitalize">
                      {entry.changeset.type === "create" 
                        ? "Request Created" 
                        : `${entry.changeset.type.charAt(0).toUpperCase() + entry.changeset.type.slice(1)}`
                      }
                    </p>
                    <p className="text-sm text-gray-500">{formatDate(entry.timestamp, true)}</p>
                  </div>
                  
                  {entry.changeset.details && (
                    <p className="text-sm text-gray-600 mt-1">{entry.changeset.details}</p>
                  )}
                  
                  {entry.user_id && (
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <UserCircle className="h-3 w-3 mr-1" />
                      <span>User #{entry.user_id}</span>
                    </div>
                  )}
                  
                  {entry.changeset.comments && (
                    <p className="text-sm italic mt-2 p-2 bg-gray-50 rounded-md border border-gray-100">
                      "{entry.changeset.comments}"
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RequestTimeline;
