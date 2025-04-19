
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";

export const NotificationsMenu = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative mr-2">
          <Bell className="h-5 w-5 text-gray-600" />
          <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5">3</Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-64 overflow-y-auto">
          <DropdownMenuItem className="p-3 cursor-default">
            <div className="flex flex-col gap-1">
              <span className="font-medium">Request #123 needs your approval</span>
              <span className="text-sm text-gray-500">2 minutes ago</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className="p-3 cursor-default">
            <div className="flex flex-col gap-1">
              <span className="font-medium">Your request #456 was approved</span>
              <span className="text-sm text-gray-500">1 hour ago</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className="p-3 cursor-default">
            <div className="flex flex-col gap-1">
              <span className="font-medium">Admin added ticket options to request #789</span>
              <span className="text-sm text-gray-500">3 hours ago</span>
            </div>
          </DropdownMenuItem>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center">
          <Link to="/notifications" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
