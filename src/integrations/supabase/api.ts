
import { supabase } from "./client";
import {
  User, TravelRequest, Approval, TicketOption, AuditLog, Notification, UserRole, RequestStatus,
} from "@/types";

// USERS
export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase.from("users").select("*");
  if (error) throw error;
  return data;
}

export async function getUserById(id: number): Promise<User | null> {
  const { data, error } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getUsersByRole(role: UserRole): Promise<User[]> {
  const { data, error } = await supabase.from("users").select("*").eq("role", role);
  if (error) throw error;
  return data;
}

export async function createUser(user: Omit<User, "id">): Promise<number> {
  const { data, error } = await supabase.from("users").insert([user]).select("id").single();
  if (error) throw error;
  return data.id;
}

// REQUESTS
export async function getAllRequests(): Promise<TravelRequest[]> {
  const { data, error } = await supabase.from("requests").select("*");
  if (error) throw error;
  return data;
}

export async function getUserRequests(userId: number): Promise<TravelRequest[]> {
  const { data, error } = await supabase.from("requests").select("*").eq("requester_id", userId);
  if (error) throw error;
  return data;
}

export async function getRequestById(requestId: number): Promise<TravelRequest | null> {
  const { data, error } = await supabase.from("requests").select("*").eq("request_id", requestId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createRequestApi(request: Omit<TravelRequest, "request_id">): Promise<number> {
  const { data, error } = await supabase.from("requests").insert([request]).select("request_id").single();
  if (error) throw error;
  return data.request_id;
}

export async function updateRequestApi(request: TravelRequest): Promise<void> {
  const { error } = await supabase.from("requests").update(request).eq("request_id", request.request_id);
  if (error) throw error;
}

// ... Implement similar CRUD functions for approvals, ticketOptions, auditLogs, notifications

// APPROVALS
export async function addApproval(approval: Omit<Approval, "approval_id">): Promise<number> {
  const { data, error } = await supabase.from("approvals").insert([approval]).select("approval_id").single();
  if (error) throw error;
  return data.approval_id;
}

export async function getApprovalsByRequest(requestId: number): Promise<Approval[]> {
  const { data, error } = await supabase.from("approvals").select("*").eq("request_id", requestId);
  if (error) throw error;
  return data;
}

// TICKET OPTIONS
export async function getTicketOptions(requestId: number): Promise<TicketOption[]> {
  const { data, error } = await supabase.from("ticket_options").select("*").eq("request_id", requestId);
  if (error) throw error;
  return data;
}
export async function addTicketOption(option: Omit<TicketOption, "option_id" | "added_date">): Promise<number> {
  const now = new Date().toISOString();
  const body = { ...option, added_date: now };
  const { data, error } = await supabase.from("ticket_options").insert([body]).select("option_id").single();
  if (error) throw error;
  return data.option_id;
}

// AUDIT LOGS
export async function addAuditLogApi(log: Omit<AuditLog, "log_id">): Promise<number> {
  const { data, error } = await supabase.from("audit_logs").insert([log]).select("log_id").single();
  if (error) throw error;
  return data.log_id;
}
export async function getAuditLogs(requestId: number): Promise<AuditLog[]> {
  const { data, error } = await supabase.from("audit_logs").select("*").eq("request_id", requestId);
  if (error) throw error;
  return data;
}

// NOTIFICATIONS
export async function addNotification(notification: Omit<Notification, "id">): Promise<number> {
  const { data, error } = await supabase.from("notifications").insert([notification]).select("id").single();
  if (error) throw error;
  return data.id;
}
export async function getUserNotifications(userId: number): Promise<Notification[]> {
  const { data, error } = await supabase.from("notifications").select("*").eq("user_id", userId);
  if (error) throw error;
  return data;
}
