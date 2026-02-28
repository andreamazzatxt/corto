"use client";
import { useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { createUrl } from "@/lib/actions";
import { createUrlSchema, type CreateUrlInput } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { DateTimePicker } from "@/components/date-time-picker";

// Schema for all fields except destination (handled separately)
const restSchema = createUrlSchema.omit({ destination: true });
type RestInput = z.infer<typeof restSchema>;

export function NewLinkDrawer() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expert, setExpert] = useState(false);
  const submitting = useRef(false);

  // Destination managed outside react-hook-form
  const [protocol, setProtocol] = useState("https://");
  const [urlBody, setUrlBody] = useState("");
  const [destError, setDestError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RestInput>({
    resolver: zodResolver(restSchema),
  });

  function handleDestChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const match = raw.match(/^(https?:\/\/)/i);
    if (match) setProtocol(match[1].toLowerCase());
    const proto = match ? match[1].toLowerCase() : protocol;
    const body = match ? raw.slice(match[1].length) : raw;

    try {
      const url = new URL(proto + body);
      const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
      let hasUtm = false;
      for (const key of utmKeys) {
        const val = url.searchParams.get(key);
        if (val !== null) {
          setValue(key, val);
          url.searchParams.delete(key);
          hasUtm = true;
        }
      }
      if (hasUtm) {
        setUrlBody(url.toString().replace(/^https?:\/\//, ""));
        setExpert(true);
      } else {
        setUrlBody(body);
      }
    } catch {
      setUrlBody(body);
    }

    if (destError) setDestError("");
  }

  function resetAll() {
    reset();
    setProtocol("https://");
    setUrlBody("");
    setDestError("");
    setExpert(false);
  }

  async function onSubmit(data: RestInput) {
    const destination = protocol + urlBody;
    try {
      z.string().url().parse(destination);
    } catch {
      setDestError("Inserisci un URL valido (es. example.com/path)");
      return;
    }

    if (submitting.current) return;
    submitting.current = true;
    try {
      const { slug } = await createUrl({
        ...data,
        destination,
        expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : undefined,
      });
      const shortUrl = `${process.env.NEXT_PUBLIC_SHORT_URL_BASE}/${slug}`;
      const shortUrlDisplay = shortUrl.replace(/^https?:\/\//, "");
      await navigator.clipboard.writeText(shortUrlDisplay);
      await queryClient.invalidateQueries({ queryKey: ["urls"] });
      await queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Link creato e copiato!", { description: shortUrlDisplay });
      resetAll();
      setOpen(false);
    } catch (e) {
      toast.error("Errore nella creazione", { description: e instanceof Error ? e.message : "Riprova" });
    } finally {
      submitting.current = false;
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetAll(); }}>
      <SheetTrigger asChild>
        <Button size="icon" className="fixed bottom-20 right-5 md:bottom-6 md:right-6 h-14 w-14 rounded-full shadow-lg z-40">
          <Plus size={24} />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90dvh] overflow-y-auto px-4 pb-6">
        <SheetHeader className="mb-4">
          <SheetTitle>Nuovo link</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="destination">URL di destinazione</Label>
            <div className={`flex items-center h-9 rounded-md border bg-background focus-within:ring-1 focus-within:ring-ring overflow-hidden ${destError ? "border-destructive" : "border-input"}`}>
              <button
                type="button"
                onClick={() => setProtocol(p => p === "https://" ? "http://" : "https://")}
                style={{ width: "72px", minWidth: "72px" }}
                className="pl-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >{protocol}</button>
              <input
                id="destination"
                value={urlBody}
                onChange={handleDestChange}
                placeholder="example.com/path"
                className="flex-1 min-w-0 h-full pr-3 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            {destError && <p className="text-xs text-destructive">{destError}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="slug">
              Slug personalizzato <span className="text-muted-foreground">(opzionale)</span>
            </Label>
            <Input id="slug" type="text" placeholder="es. evento-2025" {...register("slug")} />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
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
                <Label htmlFor="expires_redirect">
                  Redirect alla scadenza <span className="text-muted-foreground">(opzionale)</span>
                </Label>
                <Input id="expires_redirect" type="url" placeholder="https://..." {...register("expires_redirect")} />
                {errors.expires_redirect && <p className="text-xs text-destructive">{errors.expires_redirect.message}</p>}
              </div>
              <Separator />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Parametri UTM</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="utm_source">Source</Label>
                  <Input id="utm_source" placeholder="newsletter" {...register("utm_source")} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="utm_medium">Medium</Label>
                  <Input id="utm_medium" placeholder="email" {...register("utm_medium")} />
                </div>
                <div className="grid gap-1.5 col-span-2">
                  <Label htmlFor="utm_campaign">Campaign</Label>
                  <Input id="utm_campaign" placeholder="primavera-2025" {...register("utm_campaign")} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="utm_term">Term</Label>
                  <Input id="utm_term" placeholder="opzionale" {...register("utm_term")} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="utm_content">Content</Label>
                  <Input id="utm_content" placeholder="opzionale" {...register("utm_content")} />
                </div>
              </div>
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="mt-2">
            {isSubmitting ? "Creazione…" : "Crea link"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
