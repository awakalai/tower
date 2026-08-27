import { Building, ShieldCheck, UserCog, UsersRound } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { createInviteAction, updateMemberAction } from "@/app/[locale]/admin/actions";
import { CopyInviteLink } from "@/components/admin/copy-invite-link";
import { EnterprisePageHeader } from "@/components/admin/enterprise-page-header";
import { MetricCard } from "@/components/admin/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CreatePanel, FormField, FormGrid, NativeSelect } from "@/components/ui/native-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTeamData } from "@/lib/data/enterprise";
import { toIntlLocale } from "@/lib/utils";

const roles = ["owner", "admin", "manager", "sales_agent", "accountant", "project_manager", "viewer"] as const;

export default async function TeamPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [data, t] = await Promise.all([getTeamData(), getTranslations({ locale, namespace: "Enterprise" })]);
  const profiles = new Map(data.profiles.map((profile) => [profile.user_id, profile]));
  const branches = new Map(data.branches.map((branch) => [branch.id, branch.name]));
  const formatter = new Intl.DateTimeFormat(toIntlLocale(locale), { dateStyle: "medium" });

  return (
    <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <EnterprisePageHeader eyebrow={t("governance")} title={t("teamTitle")} description={t("teamDescription")} icon={UsersRound} />
      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <MetricCard label={t("teamMembers")} value={String(data.memberships.length)} icon={UsersRound} tone="brand" />
        <MetricCard label={t("administrators")} value={String(data.memberships.filter((item) => ["owner", "admin"].includes(item.role)).length)} icon={ShieldCheck} tone="success" />
        <MetricCard label={t("branches")} value={String(data.branches.length)} icon={Building} />
      </section>
      <CreatePanel title={t("inviteMember")} description={t("inviteMemberHint")}>
        <form action={createInviteAction} className="grid gap-4">
          <input type="hidden" name="locale" value={locale} /><input type="hidden" name="organization_id" value={data.memberships[0]?.organization_id ?? ""} />
          <FormGrid className="lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-end">
            <FormField>{t("email")}<Input name="email" type="email" required /></FormField>
            <FormField>{t("role")}<NativeSelect name="role" defaultValue="viewer">{roles.map((role) => <option value={role} key={role}>{t(role)}</option>)}</NativeSelect></FormField>
            <FormField>{t("branch")}<NativeSelect name="branch_id" defaultValue=""><option value="">{t("allBranches")}</option>{data.branches.map((branch) => <option value={branch.id} key={branch.id}>{branch.name}</option>)}</NativeSelect></FormField>
            <Button>{t("createInvite")}</Button>
          </FormGrid>
        </form>
      </CreatePanel>

      {data.invites.some((invite) => !invite.accepted_at) && <Card className="mt-6 overflow-hidden"><CardHeader><CardTitle>{t("pendingInvites")}</CardTitle></CardHeader><CardContent className="px-0"><Table><TableHeader><TableRow><TableHead>{t("email")}</TableHead><TableHead>{t("role")}</TableHead><TableHead>{t("branch")}</TableHead><TableHead>{t("expires")}</TableHead><TableHead className="text-end">{t("actions")}</TableHead></TableRow></TableHeader><TableBody>{data.invites.filter((invite) => !invite.accepted_at).map((invite) => <TableRow key={invite.id}><TableCell className="font-semibold">{invite.email}</TableCell><TableCell><Badge variant="secondary">{t(invite.role)}</Badge></TableCell><TableCell>{invite.branch_id ? branches.get(invite.branch_id) : t("allBranches")}</TableCell><TableCell>{formatter.format(new Date(invite.expires_at))}</TableCell><TableCell className="text-end"><CopyInviteLink token={invite.token} locale={locale} /></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>}
      <Card className="mt-6 overflow-hidden">
        <CardHeader><CardTitle>{t("accessDirectory")}</CardTitle></CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader><TableRow><TableHead>{t("member")}</TableHead><TableHead>{t("jobTitle")}</TableHead><TableHead>{t("joined")}</TableHead><TableHead>{t("access")}</TableHead></TableRow></TableHeader>
            <TableBody>{data.memberships.map((membership) => {
              const profile = profiles.get(membership.user_id);
              return <TableRow key={`${membership.organization_id}-${membership.user_id}`}>
                <TableCell><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-primary/10 font-bold text-primary">{(profile?.full_name || "A").slice(0, 1).toUpperCase()}</span><div><p className="font-semibold">{profile?.full_name || t("administrator")}</p><p className="font-mono text-[10px] text-muted-foreground">{membership.user_id.slice(0, 12)}…</p></div></div></TableCell>
                <TableCell>{profile?.job_title || "—"}</TableCell>
                <TableCell>{formatter.format(new Date(membership.joined_at))}<Badge variant={membership.is_active ? "secondary" : "outline"} className="ms-2">{membership.is_active ? t("active") : t("inactive")}</Badge></TableCell>
                <TableCell>
                  <form action={updateMemberAction} className="grid min-w-[360px] grid-cols-[1fr_1fr_auto] gap-2">
                    <input type="hidden" name="locale" value={locale} /><input type="hidden" name="organization_id" value={membership.organization_id} /><input type="hidden" name="user_id" value={membership.user_id} />
                    <NativeSelect name="role" defaultValue={membership.role} className="h-9 text-xs">{roles.map((role) => <option value={role} key={role}>{t(role)}</option>)}</NativeSelect>
                    <NativeSelect name="branch_id" defaultValue={membership.branch_id ?? ""} className="h-9 text-xs"><option value="">{t("allBranches")}</option>{data.branches.map((branch) => <option value={branch.id} key={branch.id}>{branch.name}</option>)}</NativeSelect>
                    <Button type="submit" variant="outline" size="sm"><UserCog className="size-3.5" />{t("save")}</Button>
                  </form>
                </TableCell>
              </TableRow>;
            })}</TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="mt-4 text-xs text-muted-foreground">{t("branchScopeHint")} {Array.from(branches.values()).join(" · ")}</p>
    </main>
  );
}
