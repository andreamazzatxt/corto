"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Scissors,
  Zap,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { DateTimePicker } from "@/components/date-time-picker";
import { GroupCombobox } from "@/components/group-combobox";
import { QRCodeDialog } from "@/components/qr-code-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createUrl } from "@/lib/actions";
import { fetchJson } from "@/lib/fetch";
import { createUrlSchema } from "@/lib/schemas";

const shortUrlBase = process.env.NEXT_PUBLIC_SHORT_URL_BASE ?? "";
const shortUrlDisplay = shortUrlBase.replace(/^https?:\/\//, "");

type Result = { slug: string; destination: string };

function toSlug(v: string): string {
  return v
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-");
}

const restSchema = createUrlSchema.omit({ destination: true });
type RestInput = z.infer<typeof restSchema>;

export default function AdminPage() {
  const queryClient = useQueryClient();
  const { data: groups = [] } = useQuery<string[]>({
    queryKey: ["groups"],
    queryFn: () => fetchJson("/api/groups"),
  });
  const [expert, setExpert] = useState(false);
  const [expertOpen, setExpertOpen] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const submitting = useRef(false);

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

  const handleDestChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const match = raw.match(/^(https?:\/\/)/i);
      if (match) setProtocol(match[1].toLowerCase());
      const proto = match ? match[1].toLowerCase() : protocol;
      const body = match ? raw.slice(match[1].length) : raw;

      try {
        const url = new URL(proto + body);
        const utmKeys = [
          "utm_source",
          "utm_medium",
          "utm_campaign",
          "utm_term",
          "utm_content",
        ] as const;
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

      setDestError("");
    },
    [protocol, setValue],
  );

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
        expires_at: data.expires_at
          ? new Date(data.expires_at).toISOString()
          : undefined,
      });
      setResult({ slug, destination });
      await queryClient.invalidateQueries({ queryKey: ["urls"] });
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
      reset();
      setUrlBody("");
      setProtocol("https://");
      setDestError("");
    } catch (e) {
      toast.error("Errore nella creazione", {
        description: e instanceof Error ? e.message : "Riprova",
      });
    } finally {
      submitting.current = false;
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(`${shortUrlDisplay}/${result.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleNew() {
    setResult(null);
    setCopied(false);
    setExpert(false);
    setExpertOpen(false);
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-7rem)] p-4">
      <motion.div
        className="w-full max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="bg-card border rounded-2xl shadow-sm">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.form
                key="form"
                onSubmit={handleSubmit(onSubmit)}
                className="p-6 flex flex-col gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* Main input row */}
                <div className="flex gap-3 items-center">
                  <div className="flex items-center flex-1 min-w-0 h-12 rounded-xl bg-muted px-4 focus-within:ring-1 focus-within:ring-ring">
                    <button
                      type="button"
                      onClick={() =>
                        setProtocol((p) =>
                          p === "https://" ? "http://" : "https://",
                        )
                      }
                      className="w-14 text-base text-right text-muted-foreground shrink-0 hover:text-foreground transition-colors "
                    >
                      {protocol}
                    </button>
                    <input
                      value={urlBody}
                      onChange={handleDestChange}
                      placeholder="example.com/path"
                      autoFocus
                      className="flex-1 h-full bg-transparent text-base outline-none placeholder:text-muted-foreground shrink"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 grow-0"
                  >
                    <motion.span
                      animate={
                        isSubmitting ? { rotate: [-25, 25] } : { rotate: 0 }
                      }
                      transition={
                        isSubmitting
                          ? {
                              duration: 0.25,
                              repeat: Infinity,
                              repeatType: "mirror",
                              ease: "easeInOut",
                            }
                          : { duration: 0.15 }
                      }
                      className="flex items-center justify-center"
                    >
                      <Scissors size={18} />
                    </motion.span>
                  </button>
                </div>

                {destError && (
                  <p className="text-xs text-destructive -mt-2 px-1">
                    {destError}
                  </p>
                )}

                {/* Advanced toggle */}
                <button
                  type="button"
                  onClick={() => setExpert((v) => !v)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
                >
                  {expert ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  Opzioni avanzate
                </button>

                {/* Expert fields */}
                <AnimatePresence initial={false}>
                  {expert && (
                    <motion.div
                      key="expert"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      style={{ overflow: expertOpen ? "visible" : "hidden" }}
                      onAnimationComplete={() => {
                        if (expert) setExpertOpen(true);
                      }}
                      onAnimationStart={() => setExpertOpen(false)}
                    >
                      <div className="flex flex-col gap-4">
                        <Separator />

                        <div className="grid gap-1.5">
                          <Label htmlFor="slug">Slug personalizzato</Label>
                          <Input
                            id="slug"
                            placeholder="es. promo-estate"
                            {...register("slug")}
                            onChange={(e) => {
                              e.target.value = toSlug(e.target.value);
                              register("slug").onChange(e);
                            }}
                          />
                          {errors.slug && (
                            <p className="text-xs text-destructive">
                              {errors.slug.message}
                            </p>
                          )}
                        </div>

                        <div className="grid gap-1.5">
                          <Label htmlFor="group">Gruppo</Label>
                          <Controller
                            name="group"
                            control={control}
                            render={({ field }) => (
                              <GroupCombobox
                                id="group"
                                value={field.value ?? ""}
                                onChange={field.onChange}
                                groups={groups}
                              />
                            )}
                          />
                        </div>

                        <Separator />
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Scadenza
                        </p>

                        <div className="grid gap-1.5">
                          <Label>Scade il</Label>
                          <Controller
                            name="expires_at"
                            control={control}
                            render={({ field }) => (
                              <DateTimePicker
                                value={field.value}
                                onChange={field.onChange}
                              />
                            )}
                          />
                        </div>

                        <div className="grid gap-1.5">
                          <Label htmlFor="expires_redirect">
                            Redirect alla scadenza{" "}
                            <span className="text-muted-foreground">
                              (opzionale)
                            </span>
                          </Label>
                          <Input
                            id="expires_redirect"
                            type="url"
                            placeholder="https://..."
                            {...register("expires_redirect")}
                          />
                          {errors.expires_redirect && (
                            <p className="text-xs text-destructive">
                              {errors.expires_redirect.message}
                            </p>
                          )}
                        </div>

                        <Separator />
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Parametri UTM
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="grid gap-1.5">
                            <Label htmlFor="utm_source">Source</Label>
                            <Input
                              id="utm_source"
                              placeholder="newsletter"
                              {...register("utm_source")}
                            />
                          </div>
                          <div className="grid gap-1.5">
                            <Label htmlFor="utm_medium">Medium</Label>
                            <Input
                              id="utm_medium"
                              placeholder="email"
                              {...register("utm_medium")}
                            />
                          </div>
                          <div className="grid gap-1.5 col-span-2">
                            <Label htmlFor="utm_campaign">Campaign</Label>
                            <Input
                              id="utm_campaign"
                              placeholder="primavera-2025"
                              {...register("utm_campaign")}
                            />
                          </div>
                          <div className="grid gap-1.5">
                            <Label htmlFor="utm_term">Term</Label>
                            <Input
                              id="utm_term"
                              placeholder="opzionale"
                              {...register("utm_term")}
                            />
                          </div>
                          <div className="grid gap-1.5">
                            <Label htmlFor="utm_content">Content</Label>
                            <Input
                              id="utm_content"
                              placeholder="opzionale"
                              {...register("utm_content")}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.form>
            ) : (
              <motion.div
                key="result"
                className="p-6 flex flex-col gap-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {/* Result row */}
                <div className="flex items-center gap-3 bg-muted rounded-xl p-4">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Zap size={16} fill="currentColor" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-primary leading-tight">
                      {shortUrlDisplay}/{result.slug}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      ↳ {result.destination}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex-1 flex items-center justify-center gap-2 h-10 rounded-full border text-sm font-medium hover:bg-accent transition-colors"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {copied ? (
                        <motion.span
                          key="check"
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.7, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-center gap-2"
                        >
                          <Check size={15} className="text-green-500" />{" "}
                          Copiato!
                        </motion.span>
                      ) : (
                        <motion.span
                          key="copy"
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.7, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-center gap-2"
                        >
                          <Copy size={15} /> Copia link
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>

                  <QRCodeDialog
                    url={`${shortUrlBase}/${result.slug}`}
                    slug={result.slug}
                  />

                  <button
                    type="button"
                    onClick={handleNew}
                    className="flex-1 h-10 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Nuovo link
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
