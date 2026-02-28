"use client";
import { useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch";
import { Pencil, ChevronDown, ChevronUp, Info } from "lucide-react";
import { toast } from "sonner";
import { updateUrl } from "@/lib/actions";
import { createUrlSchema, type CreateUrlInput } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DateTimePicker } from "@/components/date-time-picker";
import { GroupCombobox } from "@/components/group-combobox";

type UrlData = {
  id: string;
  slug: string;
  destination: string;
  expires_at: string | null;
  expires_redirect: string | null;
  group_name: string | null;
};

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

function parseForEdit(fullUrl: string) {
  try {
    const url = new URL(fullUrl);
    const utm: Record<string, string> = {};
    for (const key of UTM_KEYS) {
      utm[key] = url.searchParams.get(key) ?? "";
      url.searchParams.delete(key);
    }
    return { baseUrl: url.toString(), utm };
  } catch {
    return { baseUrl: fullUrl, utm: {} };
  }
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditLinkDrawer({ url }: { url: UrlData }) {
  const queryClient = useQueryClient();
  const { data: groups = [] } = useQuery<string[]>({ queryKey: ["groups"], queryFn: () => fetchJson("/api/groups") });
  const [open, setOpen] = useState(false);
  const [expert, setExpert] = useState(false);
  const submitting = useRef(false);

  const { baseUrl, utm } = parseForEdit(url.destination);
  const hasAdvanced = !!(url.expires_at || url.expires_redirect || Object.values(utm).some(Boolean));

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateUrlInput>({
    resolver: zodResolver(createUrlSchema),
    defaultValues: {
      destination: baseUrl,
      slug: url.slug,
      expires_at: url.expires_at ? toDatetimeLocal(url.expires_at) : "",
      expires_redirect: url.expires_redirect ?? "",
      group: url.group_name ?? "",
      ...utm,
    },
  });

  function handleOpen(v: boolean) {
    setOpen(v);
    if (!v) { reset(); setExpert(false); }
    if (v) setExpert(hasAdvanced);
  }

  async function onSubmit(data: CreateUrlInput) {
    if (submitting.current) return;
    submitting.current = true;
    try {
      await updateUrl(url.id, {
        ...data,
        expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["urls"] });
      await queryClient.invalidateQueries({ queryKey: ["analytics"] });
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Link aggiornato");
      setOpen(false);
    } catch (e) {
      toast.error("Errore nell'aggiornamento", { description: e instanceof Error ? e.message : "Riprova" });
    } finally {
      submitting.current = false;
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Pencil size={16} />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90dvh] overflow-y-auto px-4 pb-6" onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader className="mb-4">
          <SheetTitle>Modifica link</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="edit-destination">URL di destinazione</Label>
            <Input id="edit-destination" type="url" placeholder="https://..." {...register("destination")} />
            {errors.destination && <p className="text-xs text-destructive">{errors.destination.message}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="edit-group">Gruppo</Label>
            <Controller
              name="group"
              control={control}
              render={({ field }) => (
                <GroupCombobox id="edit-group" value={field.value ?? ""} onChange={field.onChange} groups={groups} />
              )}
            />
          </div>

          <div className="grid gap-1.5">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="edit-slug">Slug</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={13} className="text-muted-foreground cursor-default" />
                </TooltipTrigger>
                <TooltipContent>
                  Lo slug non può essere modificato per non rompere i link esistenti.
                </TooltipContent>
              </Tooltip>
            </div>
            <Input id="edit-slug" type="text" disabled {...register("slug")} />
          </div>

          <button
            type="button"
            onClick={() => setExpert((v) => !v)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            {expert ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            Opzioni avanzate
          </button>

          {expert && (
            <div className="flex flex-col gap-4">
              <Separator />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Scadenza</p>
              <div className="grid gap-1.5">
                <Label>Scade il</Label>
                <Controller
                  name="expires_at"
                  control={control}
                  render={({ field }) => (
                    <DateTimePicker value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit-expires_redirect">
                  Redirect alla scadenza <span className="text-muted-foreground">(opzionale)</span>
                </Label>
                <Input id="edit-expires_redirect" type="url" placeholder="https://..." {...register("expires_redirect")} />
                {errors.expires_redirect && <p className="text-xs text-destructive">{errors.expires_redirect.message}</p>}
              </div>
              <Separator />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Parametri UTM</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-utm_source">Source</Label>
                  <Input id="edit-utm_source" placeholder="newsletter" {...register("utm_source")} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-utm_medium">Medium</Label>
                  <Input id="edit-utm_medium" placeholder="email" {...register("utm_medium")} />
                </div>
                <div className="grid gap-1.5 col-span-2">
                  <Label htmlFor="edit-utm_campaign">Campaign</Label>
                  <Input id="edit-utm_campaign" placeholder="primavera-2025" {...register("utm_campaign")} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-utm_term">Term</Label>
                  <Input id="edit-utm_term" placeholder="opzionale" {...register("utm_term")} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-utm_content">Content</Label>
                  <Input id="edit-utm_content" placeholder="opzionale" {...register("utm_content")} />
                </div>
              </div>
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="mt-2">
            {isSubmitting ? "Salvataggio…" : "Salva modifiche"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
