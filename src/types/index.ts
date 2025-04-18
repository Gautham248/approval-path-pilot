
// Travel Request Management System Types

// User role types
export type UserRole = "employee" | "manager" | "admin" | "du_head";

// Request status types
export type RequestStatus = 
  | "draft" 
  | "manager_pending" 
  | "du_pending" 
  | "admin_pending" 
  | "manager_selection" 
  | "du_final" 
  | "approved" 
  | "rejected";

// Approval action types
export type ApprovalAction = "approved" | "rejected" | "returned" | "edited";

// Audit log action types
export type AuditAction = "create" | "edit" | "approve" | "reject" | "return";

// User interface
export interface User {
  id: number;
  name: string;
  role: UserRole;
  department: string;
  email: string;
  hierarchy_chain: number[]; // IDs of users in hierarchy chain
  avatar?: string;
}

// Travel details interface
export interface TravelDetails {
  source: string;
  destination: string;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  purpose: string;
  project_code?: string;
  estimated_cost?: number;
  additional_notes?: string;
}

// Approval chain step interface
export interface ApprovalStep {
  role: UserRole;
  user_id: number;
}

// Version history entry interface
export interface VersionHistoryEntry {
  timestamp: string; // ISO date string
  user_id: number;
  changeset: Record<string, any>; // Changes made in this version
}

// Travel request interface
export interface TravelRequest {
  request_id: number;
  current_status: RequestStatus;
  requester_id: number;
  travel_details: TravelDetails;
  approval_chain: ApprovalStep[];
  version_history: VersionHistoryEntry[];
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  selected_ticket_id?: number;
}

// Approval interface
export interface Approval {
  approval_id: number;
  request_id: number;
  approver_id: number;
  action: ApprovalAction;
  comments?: string;
  ticket_option_id?: number;
  decision_date: string; // ISO date string
}

// Ticket option interface
export interface TicketOption {
  option_id: number;
  request_id: number;
  carrier: string;
  class: string;
  price: number;
  departure_time?: string; // ISO date string
  arrival_time?: string; // ISO date string
  validity_start: string; // ISO date string
  validity_end: string; // ISO date string
  added_by_admin_id: number;
  added_date: string; // ISO date string
  carrier_rating?: number;
  refundable: boolean;
  flight_duration?: string;
  stops?: number;
}

// Audit log interface
export interface AuditLog {
  log_id: number;
  request_id: number;
  user_id: number;
  action_type: AuditAction;
  before_state: Record<string, any>; // JSON snapshot
  after_state: Record<string, any>; // JSON snapshot
  ip_address: string;
  timestamp: string; // ISO date string
}

// Notification interface
export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  read: boolean;
  created_at: string; // ISO date string
  request_id?: number;
  type: "state_change" | "sla_breach" | "budget_overrun" | "general";
}
