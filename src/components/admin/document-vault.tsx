"use client";

import { Download, FileArchive, FileText, LoaderCircle, ShieldCheck, Trash2, UploadCloud } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormField, FormGrid, NativeSelect } from "@/components/ui/native-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DocumentVaultData } from "@/lib/data/enterprise";
import { createClient } from "@/lib/supabase/client";
import { toIntlLocale } from "@/lib/utils";
import type { DocumentRow } from "@/types/database";

const allowedTypes = new Set([
  "application/pdf", "image/jpeg", "image/png", "image/webp", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function safeName(name: string) {
  return name.normalize("NFKC").replace(/[^\p{L}\p{N}._-]+/gu, "-").slice(-120) || "document";
}

function sizeLabel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentVault({ organizationId, initialData }: { organizationId: string; initialData: DocumentVaultData }) {
  const locale = useLocale();
  const t = useTranslations("Enterprise");
  const [documents, setDocuments] = useState(initialData.documents);
  const [entityType, setEntityType] = useState<DocumentVaultData["entities"][number]["type"]>("project");
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const entities = useMemo(() => initialData.entities.filter((entity) => entity.type === entityType), [entityType, initialData.entities]);
  const entityLabels = useMemo(() => new Map(initialData.entities.map((entity) => [`${entity.type}:${entity.id}`, entity.label])), [initialData.entities]);
  const formatter = useMemo(() => new Intl.DateTimeFormat(toIntlLocale(locale), { dateStyle: "medium", timeStyle: "short" }), [locale]);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("file");
    const entityId = String(form.get("entity_id") ?? "");
    if (!(file instanceof File) || !entityId || !allowedTypes.has(file.type) || file.size > 25 * 1024 * 1024) return toast.error(t("documentInvalid"));
    const supabase = createClient();
    if (!supabase) return toast.error(t("documentError"));
    const storagePath = `${organizationId}/${entityType}/${entityId}/${crypto.randomUUID()}-${safeName(file.name)}`;
    setUploading(true);
    const storageResult = await supabase.storage.from("enterprise-documents").upload(storagePath, file, { contentType: file.type, upsert: false });
    if (storageResult.error) { setUploading(false); return toast.error(t("documentError"), { description: storageResult.error.message }); }
    const { data, error } = await supabase.from("documents").insert({
      organization_id: organizationId,
      entity_type: entityType,
      entity_id: entityId,
      name: file.name,
      storage_path: storagePath,
      mime_type: file.type,
      size_bytes: file.size,
    }).select().single();
    setUploading(false);
    if (error || !data) {
      await supabase.storage.from("enterprise-documents").remove([storagePath]);
      return toast.error(t("documentError"), { description: error?.message });
    }
    setDocuments((current) => [data, ...current]);
    event.currentTarget.reset();
    toast.success(t("documentUploaded"));
  }

  async function download(document: DocumentRow) {
    const supabase = createClient();
    if (!supabase) return;
    setBusyId(document.id);
    const { data, error } = await supabase.storage.from("enterprise-documents").createSignedUrl(document.storage_path, 60, { download: document.name });
    setBusyId(null);
    if (error || !data) return toast.error(t("documentError"));
    window.location.assign(data.signedUrl);
  }

  async function remove(document: DocumentRow) {
    const supabase = createClient();
    if (!supabase) return;
    setBusyId(document.id);
    const storage = await supabase.storage.from("enterprise-documents").remove([document.storage_path]);
    if (storage.error) { setBusyId(null); return toast.error(t("documentError"), { description: storage.error.message }); }
    const { error } = await supabase.from("documents").delete().eq("id", document.id);
    setBusyId(null);
    if (error) return toast.error(t("documentError"), { description: error.message });
    setDocuments((current) => current.filter((item) => item.id !== document.id));
    toast.success(t("documentDeleted"));
  }

  return (
    <>
      <Card className="mb-6 overflow-hidden border-primary/15">
        <CardHeader className="border-b bg-primary/[.035]"><CardTitle className="flex items-center gap-2"><UploadCloud className="size-5 text-primary" />{t("uploadDocument")}</CardTitle></CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={upload}>
            <FormGrid className="lg:grid-cols-[.7fr_1fr_1.4fr_auto] lg:items-end">
              <FormField>{t("entityType")}<NativeSelect value={entityType} onChange={(event) => setEntityType(event.target.value as typeof entityType)}>{["project", "property", "deal", "contact"].map((item) => <option value={item} key={item}>{t(item)}</option>)}</NativeSelect></FormField>
              <FormField>{t("relatedRecord")}<NativeSelect name="entity_id" required defaultValue=""><option value="" disabled>{t("select")}</option>{entities.map((entity) => <option value={entity.id} key={entity.id}>{entity.label}</option>)}</NativeSelect></FormField>
              <FormField>{t("file")}<Input name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx" /></FormField>
              <Button disabled={uploading}>{uploading ? <LoaderCircle className="animate-spin" /> : <UploadCloud />}{uploading ? t("uploading") : t("upload")}</Button>
            </FormGrid>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground"><ShieldCheck className="size-3.5 text-success" />{t("documentSecurityHint")}</p>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader><CardTitle className="flex items-center gap-2"><FileArchive className="size-5 text-primary" />{t("documentRegister")}</CardTitle></CardHeader>
        <CardContent className="px-0">
          {documents.length ? <Table><TableHeader><TableRow><TableHead>{t("file")}</TableHead><TableHead>{t("relatedRecord")}</TableHead><TableHead>{t("entityType")}</TableHead><TableHead>{t("uploadedAt")}</TableHead><TableHead>{t("size")}</TableHead><TableHead className="text-end">{t("actions")}</TableHead></TableRow></TableHeader>
            <TableBody>{documents.map((document) => <TableRow key={document.id}>
              <TableCell><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><FileText className="size-4" /></span><div><p className="max-w-64 truncate font-semibold">{document.name}</p><p className="font-mono text-[10px] text-muted-foreground">{document.mime_type}</p></div></div></TableCell>
              <TableCell>{entityLabels.get(`${document.entity_type}:${document.entity_id}`) ?? document.entity_id.slice(0, 8)}</TableCell>
              <TableCell><Badge variant="outline">{t(document.entity_type)}</Badge></TableCell>
              <TableCell>{formatter.format(new Date(document.created_at))}</TableCell>
              <TableCell>{sizeLabel(document.size_bytes)}</TableCell>
              <TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon-sm" disabled={busyId === document.id} onClick={() => download(document)} aria-label={t("download")}><Download /></Button><Button variant="ghost" size="icon-sm" className="text-destructive" disabled={busyId === document.id} onClick={() => remove(document)} aria-label={t("deleteDocument")}><Trash2 /></Button></div></TableCell>
            </TableRow>)}</TableBody></Table> : <div className="py-20 text-center"><FileArchive className="mx-auto size-10 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">{t("noDocuments")}</p></div>}
        </CardContent>
      </Card>
    </>
  );
}
