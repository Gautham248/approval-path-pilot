
import { format } from "date-fns";
import { RequestStatus, UserRole } from "@/types";

// Format a date string to a readable format
export const formatDate = (dateString: string, showTime: boolean = false): string => {
  try {
    const date = new Date(dateString);
    if (showTime) {
      return format(date, "MMM d, yyyy h:mm a");
    }
    return format(date, "MMM d, yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

// Get the appropriate Tailwind color class for a request status
export const getStatusColorClass = (status: RequestStatus): string => {
  switch (status) {
    case "draft":
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    case "manager_pending":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "du_pending":
      return "bg-indigo-100 text-indigo-800 hover:bg-indigo-200";
    case "admin_pending":
      return "bg-purple-100 text-purple-800 hover:bg-purple-200";
    case "manager_selection":
      return "bg-amber-100 text-amber-800 hover:bg-amber-200";
    case "du_final":
      return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200";
    case "approved":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "rejected":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};

// Get a human-readable label for request status
export const getStatusLabel = (status: RequestStatus): string => {
  switch (status) {
    case "draft":
      return "Draft";
    case "manager_pending":
      return "Manager Review";
    case "du_pending":
      return "Department Review";
    case "admin_pending":
      return "Admin Review";
    case "manager_selection":
      return "Ticket Selection";
    case "du_final":
      return "Final Approval";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      // Fix: Explicitly cast status to string to avoid 'never' type inference
      return (status as string).replace(/_/g, " ");
  }
};

// Get user initials from full name
export const getInitials = (name: string): string => {
  if (!name) return "";
  
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Get a human-readable label for user role
export const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case "employee":
      return "Employee";
    case "manager":
      return "Manager";
    case "admin":
      return "Administrator";
    case "du_head":
      return "Department Head";
    default:
      // Fix: Explicitly cast role to string to avoid 'never' type inference
      const roleAsString = role as string;
      return roleAsString.charAt(0).toUpperCase() + roleAsString.slice(1).replace(/_/g, " ");
  }
};
