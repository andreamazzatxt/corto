import { z } from "zod";

const urlField = z.string().url("Inserisci un URL valido (deve iniziare con https://)");

export const createUrlSchema = z.object({
  destination: urlField,
  slug: z
    .string()
    .regex(/^[a-z0-9-_]*$/, "Solo lettere minuscole, numeri, - e _")
    .optional(),
  expires_at: z.string().optional(),
  expires_redirect: z
    .string()
    .refine((v) => !v || URL.canParse(v), "Inserisci un URL valido")
    .optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_term: z.string().optional(),
  utm_content: z.string().optional(),
  group: z.string().max(50).optional(),
});

export type CreateUrlInput = z.infer<typeof createUrlSchema>;
