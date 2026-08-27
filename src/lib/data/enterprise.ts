import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  AuditLogRow,
  BranchRow,
  ContactRow,
  DealFinancialSummaryRow,
  DealRow,
  DocumentRow,
  ExpenseRow,
  InquiryRow,
  InviteRow,
  InstallmentRow,
  LeadRow,
  MembershipRow,
  OrganizationRow,
  ProfileRow,
  ProjectRow,
  PropertyRow,
  TaskRow,
} from "@/types/database";

export type EnterpriseContext = {
  organization: OrganizationRow;
  branch: BranchRow | null;
  membership: MembershipRow;
  profile: ProfileRow | null;
};

export async function getEnterpriseContext(): Promise<EnterpriseContext | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : null;
  if (!userId) return null;

  const { data: membership, error } = await supabase
    .from("organization_members")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!membership) return null;

  const [organizationResult, branchResult, profileResult] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", membership.organization_id).single(),
    membership.branch_id
      ? supabase.from("branches").select("*").eq("id", membership.branch_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  if (organizationResult.error) throw organizationResult.error;
  if (branchResult.error) throw branchResult.error;
  if (profileResult.error) throw profileResult.error;

  return {
    organization: organizationResult.data,
    branch: branchResult.data,
    membership,
    profile: profileResult.data,
  };
}

export type CrmData = {
  contacts: ContactRow[];
  leads: LeadRow[];
  inquiries: InquiryRow[];
  properties: PropertyRow[];
  projects: ProjectRow[];
};

export async function getCrmData(): Promise<CrmData> {
  const supabase = await createClient();
  if (!supabase) return { contacts: [], leads: [], inquiries: [], properties: [], projects: [] };
  const [contacts, leads, inquiries, properties, projects] = await Promise.all([
    supabase.from("contacts").select("*").order("created_at", { ascending: false }),
    supabase.from("leads").select("*").order("updated_at", { ascending: false }),
    supabase.from("inquiries").select("*").order("created_at", { ascending: false }),
    supabase.from("properties").select("*").order("created_at", { ascending: false }),
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
  ]);
  const error = contacts.error ?? leads.error ?? inquiries.error ?? properties.error ?? projects.error;
  if (error) throw error;
  return {
    contacts: contacts.data ?? [],
    leads: leads.data ?? [],
    inquiries: inquiries.data ?? [],
    properties: properties.data ?? [],
    projects: projects.data ?? [],
  };
}

export type DealsData = {
  deals: DealRow[];
  installments: InstallmentRow[];
  summaries: DealFinancialSummaryRow[];
  contacts: ContactRow[];
  properties: PropertyRow[];
  projects: ProjectRow[];
};

export async function getDealsData(): Promise<DealsData> {
  const supabase = await createClient();
  if (!supabase) return { deals: [], installments: [], summaries: [], contacts: [], properties: [], projects: [] };
  const [deals, installments, summaries, contacts, properties, projects] = await Promise.all([
    supabase.from("deals").select("*").order("created_at", { ascending: false }),
    supabase.from("installments").select("*").order("due_date", { ascending: true }),
    supabase.from("deal_financial_summary").select("*"),
    supabase.from("contacts").select("*").order("first_name"),
    supabase.from("properties").select("*").order("created_at", { ascending: false }),
    supabase.from("projects").select("*").order("name"),
  ]);
  const error = deals.error ?? installments.error ?? summaries.error ?? contacts.error ?? properties.error ?? projects.error;
  if (error) throw error;
  return {
    deals: deals.data ?? [],
    installments: installments.data ?? [],
    summaries: summaries.data ?? [],
    contacts: contacts.data ?? [],
    properties: properties.data ?? [],
    projects: projects.data ?? [],
  };
}

export type ProjectsData = {
  projects: ProjectRow[];
  properties: PropertyRow[];
  expenses: ExpenseRow[];
  tasks: TaskRow[];
  branches: BranchRow[];
};

export async function getProjectsData(): Promise<ProjectsData> {
  const supabase = await createClient();
  if (!supabase) return { projects: [], properties: [], expenses: [], tasks: [], branches: [] };
  const [projects, properties, expenses, tasks, branches] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("properties").select("*").order("created_at", { ascending: false }),
    supabase.from("expenses").select("*").order("incurred_on", { ascending: false }),
    supabase.from("tasks").select("*").order("due_at", { ascending: true, nullsFirst: false }),
    supabase.from("branches").select("*").order("name"),
  ]);
  const error = projects.error ?? properties.error ?? expenses.error ?? tasks.error ?? branches.error;
  if (error) throw error;
  return {
    projects: projects.data ?? [],
    properties: properties.data ?? [],
    expenses: expenses.data ?? [],
    tasks: tasks.data ?? [],
    branches: branches.data ?? [],
  };
}

export type TeamData = {
  memberships: MembershipRow[];
  profiles: ProfileRow[];
  branches: BranchRow[];
  invites: InviteRow[];
};

export async function getTeamData(): Promise<TeamData> {
  const supabase = await createClient();
  if (!supabase) return { memberships: [], profiles: [], branches: [], invites: [] };
  const [memberships, profiles, branches, invites] = await Promise.all([
    supabase.from("organization_members").select("*").order("joined_at"),
    supabase.from("profiles").select("*").order("full_name"),
    supabase.from("branches").select("*").order("name"),
    supabase.from("organization_invites").select("*").order("created_at", { ascending: false }),
  ]);
  const error = memberships.error ?? profiles.error ?? branches.error ?? invites.error;
  if (error) throw error;
  return { memberships: memberships.data ?? [], profiles: profiles.data ?? [], branches: branches.data ?? [], invites: invites.data ?? [] };
}

export async function getTasks(): Promise<TaskRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("tasks").select("*").order("due_at", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export type TaskWorkspaceData = {
  tasks: TaskRow[];
  projects: ProjectRow[];
  properties: PropertyRow[];
  leads: LeadRow[];
  deals: DealRow[];
};

export async function getTaskWorkspace(): Promise<TaskWorkspaceData> {
  const supabase = await createClient();
  if (!supabase) return { tasks: [], projects: [], properties: [], leads: [], deals: [] };
  const [tasks, projects, properties, leads, deals] = await Promise.all([
    supabase.from("tasks").select("*").order("due_at", { ascending: true, nullsFirst: false }),
    supabase.from("projects").select("*").order("name"),
    supabase.from("properties").select("*").order("created_at", { ascending: false }),
    supabase.from("leads").select("*").order("updated_at", { ascending: false }),
    supabase.from("deals").select("*").order("created_at", { ascending: false }),
  ]);
  const error = tasks.error ?? projects.error ?? properties.error ?? leads.error ?? deals.error;
  if (error) throw error;
  return {
    tasks: tasks.data ?? [],
    projects: projects.data ?? [],
    properties: properties.data ?? [],
    leads: leads.data ?? [],
    deals: deals.data ?? [],
  };
}

export async function getAuditLogs(): Promise<AuditLogRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return data ?? [];
}

export type DocumentVaultData = {
  documents: DocumentRow[];
  entities: Array<{ id: string; type: "project" | "property" | "deal" | "contact"; label: string }>;
};

export async function getDocumentVaultData(locale: "en" | "ku" | "ar"): Promise<DocumentVaultData> {
  const supabase = await createClient();
  if (!supabase) return { documents: [], entities: [] };
  const [documents, projects, properties, deals, contacts] = await Promise.all([
    supabase.from("documents").select("*").order("created_at", { ascending: false }),
    supabase.from("projects").select("id,name").order("name"),
    supabase.from("properties").select("id,title").order("created_at", { ascending: false }),
    supabase.from("deals").select("id,contract_number").order("created_at", { ascending: false }),
    supabase.from("contacts").select("id,first_name,last_name").order("first_name"),
  ]);
  const error = documents.error ?? projects.error ?? properties.error ?? deals.error ?? contacts.error;
  if (error) throw error;
  const propertyEntities = (properties.data ?? []).map((property) => {
    const title = property.title && typeof property.title === "object" && !Array.isArray(property.title)
      ? String(property.title[locale] ?? property.title.en ?? "Property")
      : "Property";
    return { id: property.id, type: "property" as const, label: title };
  });
  return {
    documents: documents.data ?? [],
    entities: [
      ...(projects.data ?? []).map((project) => ({ id: project.id, type: "project" as const, label: project.name })),
      ...propertyEntities,
      ...(deals.data ?? []).map((deal) => ({ id: deal.id, type: "deal" as const, label: deal.contract_number })),
      ...(contacts.data ?? []).map((contact) => ({ id: contact.id, type: "contact" as const, label: `${contact.first_name} ${contact.last_name}`.trim() })),
    ],
  };
}
