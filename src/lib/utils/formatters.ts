
import { format, formatDistanceToNow, parseISO, differenceInDays } from "date-fns";
import { RequestStatus, ApprovalAction, UserRole } from "@/types";

// Format a date to a human-readable string (e.g., "Jan 1, 2023")
export const formatDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, "MMM d, yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};

// Format a date and time to a human-readable string (e.g., "Jan 1, 2023, 3:45 PM")
export const formatDateTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, "MMM d, yyyy, h:mm a");
  } catch (error) {
    console.error("Error formatting date and time:", error);
    return "Invalid date";
  }
};

// Format a date as relative time (e.g., "2 days ago", "3 hours ago")
export const formatRelativeTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return "Unknown time";
  }
};

// Format currency (e.g., "$1,234.56")
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
};

// Format a phone number (e.g., "(123) 456-7890")
export const formatPhoneNumber = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/\D/g, "");
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  
  return phoneNumber;
};

// Calculate and format trip duration (e.g., "7 days")
export const formatTripDuration = (startDate: string, endDate: string): string => {
  try {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const days = differenceInDays(end, start) + 1; // Include the start day
    
    return `${days} day${days !== 1 ? "s" : ""}`;
  } catch (error) {
    console.error("Error calculating trip duration:", error);
    return "Unknown duration";
  }
};

// Get a human-readable status label from a request status
export const getStatusLabel = (status: RequestStatus): string => {
  const statusMap: Record<RequestStatus, string> = {
    draft: "Draft",
    manager_pending: "Pending Manager Approval",
    du_pending: "Pending DU Head Approval",
    admin_pending: "Pending Admin Review",
    manager_selection: "Awaiting Ticket Selection",
    du_final: "Pending Final Approval",
    approved: "Approved",
    rejected: "Rejected"
  };
  
  return statusMap[status] || "Unknown";
};

// Get a color class for a request status
export const getStatusColorClass = (status: RequestStatus): string => {
  const colorMap: Record<RequestStatus, string> = {
    draft: "bg-gray-200 text-gray-800",
    manager_pending: "bg-blue-100 text-blue-800",
    du_pending: "bg-indigo-100 text-indigo-800",
    admin_pending: "bg-purple-100 text-purple-800",
    manager_selection: "bg-yellow-100 text-yellow-800",
    du_final: "bg-orange-100 text-orange-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800"
  };
  
  return colorMap[status] || "bg-gray-100 text-gray-800";
};

// Get a human-readable action label from an approval action
export const getActionLabel = (action: ApprovalAction): string => {
  const actionMap: Record<ApprovalAction, string> = {
    approved: "Approved",
    rejected: "Rejected",
    returned: "Returned for Review",
    edited: "Edited"
  };
  
  return actionMap[action] || "Unknown";
};

// Get a human-readable role label from a user role
export const getRoleLabel = (role: UserRole): string => {
  const roleMap: Record<UserRole, string> = {
    employee: "Employee",
    manager: "Manager",
    admin: "Admin",
    du_head: "Department Head"
  };
  
  return roleMap[role] || "Unknown";
};

// Get a color class for a role
export const getRoleColorClass = (role: UserRole): string => {
  const colorMap: Record<UserRole, string> = {
    employee: "bg-blue-100 text-blue-800",
    manager: "bg-green-100 text-green-800",
    admin: "bg-purple-100 text-purple-800",
    du_head: "bg-orange-100 text-orange-800"
  };
  
  return colorMap[role] || "bg-gray-100 text-gray-800";
};

// Format flight duration (e.g., "3h 45m")
export const formatFlightDuration = (duration: string): string => {
  return duration; // Already in "3h 45m" format
};

// Get initials from a name (e.g., "John Doe" -> "JD")
export const getInitials = (name: string): string => {
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
};
