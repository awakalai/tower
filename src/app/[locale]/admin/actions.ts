"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optional(formData: FormData, key: string) {
  return value(formData, key) || null;
}

function numberValue(formData: FormData, key: string) {
  return Number(value(formData, key) || 0);
}

function refresh(formData: FormData, page: string) {
  const locale = ["en", "ku", "ar"].includes(value(formData, "locale"))
    ? value(formData, "locale")
    : "en";
  revalidatePath(`/${locale}/admin/${page}`);
  revalidatePath(`/${locale}/admin`);
}

async function client() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) throw new Error("Authentication is required.");
  return supabase;
}

export type SubmissionReviewState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function reviewSubmissionAction(
  _previousState: SubmissionReviewState,
  formData: FormData,
): Promise<SubmissionReviewState> {
  const supabase = await client();
  const id = value(formData, "id");
  const locale = ["en", "ku", "ar"].includes(value(formData, "locale"))
    ? value(formData, "locale")
    : "en";
  const decision = value(formData, "decision");
  const reviewerNotes = value(formData, "reviewer_notes");

  if (!id || !["under_review", "approved", "rejected"].includes(decision)) {
    return { status: "error", message: "Invalid review decision." };
  }
  if (decision === "rejected" && reviewerNotes.length < 3) {
    return { status: "error", message: "A rejection reason is required." };
  }

  const { error } = await supabase
    .from("property_submissions")
    .update({
      status: decision as "under_review" | "approved" | "rejected",
      reviewer_notes: reviewerNotes,
    })
    .eq("id", id);

  if (error) return { status: "error", message: error.message };

  revalidatePath(`/${locale}/admin/submissions`);
  revalidatePath(`/${locale}/admin/properties`);
  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}`);
  return { status: "success" };
}

export async function createContactAction(formData: FormData) {
  const supabase = await client();
  const firstName = value(formData, "first_name");
  if (firstName.length < 2) throw new Error("A contact name is required.");
  const { error } = await supabase.from("contacts").insert({
    first_name: firstName,
    last_name: value(formData, "last_name"),
    phone: value(formData, "phone"),
    email: value(formData, "email"),
    company_name: value(formData, "company_name"),
    contact_type: value(formData, "contact_type") as "buyer" | "seller" | "tenant" | "landlord" | "investor" | "vendor" | "partner",
    source: value(formData, "source") as "website" | "referral" | "social" | "walk_in" | "campaign" | "portal" | "other",
    notes: value(formData, "notes"),
  });
  if (error) throw error;
  refresh(formData, "crm");
}

export async function createLeadAction(formData: FormData) {
  const supabase = await client();
  const contactId = value(formData, "contact_id");
  if (!contactId) throw new Error("A contact is required.");
  const { error } = await supabase.from("leads").insert({
    contact_id: contactId,
    status: value(formData, "status") as "new" | "contacted" | "qualified" | "viewing" | "negotiation" | "won" | "lost",
    source: value(formData, "source") as "website" | "referral" | "social" | "walk_in" | "campaign" | "portal" | "other",
    priority: value(formData, "priority") as "low" | "normal" | "high" | "urgent",
    budget_min: numberValue(formData, "budget_min") || null,
    budget_max: numberValue(formData, "budget_max") || null,
    currency: value(formData, "currency") || "USD",
    property_id: optional(formData, "property_id"),
    project_id: optional(formData, "project_id"),
    next_follow_up_at: optional(formData, "next_follow_up_at"),
    notes: value(formData, "notes"),
  });
  if (error) throw error;
  refresh(formData, "crm");
}

export async function createProjectAction(formData: FormData) {
  const supabase = await client();
  const { error } = await supabase.from("projects").insert({
    name: value(formData, "name"),
    code: value(formData, "code").toUpperCase(),
    status: value(formData, "status") as "planning" | "active" | "on_hold" | "completed" | "cancelled",
    budget: numberValue(formData, "budget"),
    currency: value(formData, "currency") || "USD",
    start_date: optional(formData, "start_date"),
    target_completion: optional(formData, "target_completion"),
    address: value(formData, "address"),
    latitude: numberValue(formData, "latitude") || null,
    longitude: numberValue(formData, "longitude") || null,
    description: value(formData, "description"),
  });
  if (error) throw error;
  refresh(formData, "projects");
}

export async function createDealAction(formData: FormData) {
  const supabase = await client();
  const { error } = await supabase.from("deals").insert({
    contact_id: value(formData, "contact_id"),
    property_id: optional(formData, "property_id"),
    project_id: optional(formData, "project_id"),
    status: value(formData, "status") as "draft" | "reserved" | "contracted" | "completed" | "cancelled",
    payment_method: value(formData, "payment_method") as "cash" | "installment" | "advance",
    total_value: numberValue(formData, "total_value"),
    down_payment: numberValue(formData, "down_payment"),
    discount: numberValue(formData, "discount"),
    currency: value(formData, "currency") || "USD",
    expected_close_date: optional(formData, "expected_close_date"),
    notes: value(formData, "notes"),
  });
  if (error) throw error;
  refresh(formData, "deals");
}

export async function createInstallmentAction(formData: FormData) {
  const supabase = await client();
  const { error } = await supabase.from("installments").insert({
    deal_id: value(formData, "deal_id"),
    sequence_number: numberValue(formData, "sequence_number"),
    amount: numberValue(formData, "amount"),
    paid_amount: numberValue(formData, "paid_amount"),
    due_date: value(formData, "due_date"),
    currency: value(formData, "currency") || "USD",
    status: value(formData, "status") as "pending" | "partial" | "paid" | "overdue" | "waived",
    notes: value(formData, "notes"),
  });
  if (error) throw error;
  refresh(formData, "installments");
}

export async function createTaskAction(formData: FormData) {
  const supabase = await client();
  const { error } = await supabase.from("tasks").insert({
    title: value(formData, "title"),
    description: value(formData, "description"),
    priority: value(formData, "priority") as "low" | "normal" | "high" | "urgent",
    status: value(formData, "status") as "open" | "in_progress" | "completed" | "cancelled",
    due_at: optional(formData, "due_at"),
    project_id: optional(formData, "project_id"),
    property_id: optional(formData, "property_id"),
    lead_id: optional(formData, "lead_id"),
    deal_id: optional(formData, "deal_id"),
  });
  if (error) throw error;
  refresh(formData, "tasks");
}

export async function updateOperationalStatusAction(formData: FormData) {
  const supabase = await client();
  const table = value(formData, "table");
  const id = value(formData, "id");
  const status = value(formData, "status");
  let error: { message: string } | null = null;

  if (table === "leads") {
    ({ error } = await supabase.from("leads").update({ status: status as "new" | "contacted" | "qualified" | "viewing" | "negotiation" | "won" | "lost" }).eq("id", id));
  } else if (table === "deals") {
    ({ error } = await supabase.from("deals").update({ status: status as "draft" | "reserved" | "contracted" | "completed" | "cancelled" }).eq("id", id));
  } else if (table === "projects") {
    ({ error } = await supabase.from("projects").update({ status: status as "planning" | "active" | "on_hold" | "completed" | "cancelled" }).eq("id", id));
  } else if (table === "installments") {
    ({ error } = await supabase.from("installments").update({ status: status as "pending" | "partial" | "paid" | "overdue" | "waived" }).eq("id", id));
  } else if (table === "tasks") {
    ({ error } = await supabase.from("tasks").update({ status: status as "open" | "in_progress" | "completed" | "cancelled" }).eq("id", id));
  } else if (table === "inquiries") {
    ({ error } = await supabase.from("inquiries").update({ status: status as "new" | "contacted" | "converted" | "closed" }).eq("id", id));
  } else {
    throw new Error("Unsupported status operation.");
  }
  if (error) throw error;
  refresh(formData, table === "inquiries" || table === "leads" ? "crm" : table);
}

export async function updateMemberAction(formData: FormData) {
  const supabase = await client();
  const organizationId = value(formData, "organization_id");
  const userId = value(formData, "user_id");
  const { error } = await supabase
    .from("organization_members")
    .update({
      role: value(formData, "role") as "owner" | "admin" | "manager" | "sales_agent" | "accountant" | "project_manager" | "viewer",
      branch_id: optional(formData, "branch_id"),
    })
    .eq("organization_id", organizationId)
    .eq("user_id", userId);
  if (error) throw error;
  refresh(formData, "team");
}

export async function createInviteAction(formData: FormData) {
  const supabase = await client();
  const organizationId = value(formData, "organization_id");
  const email = value(formData, "email").toLowerCase();
  if (!email.includes("@") || email.length > 320) throw new Error("A valid email address is required.");
  await supabase.from("organization_invites").delete().eq("organization_id", organizationId).eq("email", email).is("accepted_at", null);
  const { error } = await supabase.from("organization_invites").insert({
    organization_id: organizationId,
    branch_id: optional(formData, "branch_id"),
    email,
    role: value(formData, "role") as "owner" | "admin" | "manager" | "sales_agent" | "accountant" | "project_manager" | "viewer",
  });
  if (error) throw error;
  refresh(formData, "team");
}

export async function updateOrganizationAction(formData: FormData) {
  const supabase = await client();
  const organizationId = value(formData, "organization_id");
  const { error } = await supabase.from("organizations").update({
    name: value(formData, "name"),
    legal_name: value(formData, "legal_name"),
    phone: value(formData, "phone"),
    email: value(formData, "email"),
    address: value(formData, "address"),
    tax_number: value(formData, "tax_number"),
    registration_number: value(formData, "registration_number"),
    default_currency: value(formData, "default_currency").toUpperCase() || "USD",
    timezone: value(formData, "timezone") || "Asia/Baghdad",
  }).eq("id", organizationId);
  if (error) throw error;
  refresh(formData, "settings");
}

export async function createBranchAction(formData: FormData) {
  const supabase = await client();
  const { error } = await supabase.from("branches").insert({
    organization_id: value(formData, "organization_id"),
    name: value(formData, "name"),
    code: value(formData, "code").toUpperCase(),
    phone: value(formData, "phone"),
    email: value(formData, "email"),
    address: value(formData, "address"),
    latitude: numberValue(formData, "latitude") || null,
    longitude: numberValue(formData, "longitude") || null,
  });
  if (error) throw error;
  refresh(formData, "settings");
}
