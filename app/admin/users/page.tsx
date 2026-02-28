"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { BellOff, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { fetchJson } from "@/lib/fetch";
import { addUser, toggleUser, deleteUser, changeUserRole } from "@/lib/actions";
import type { UserRole } from "@/lib/schema";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type AdminUser = {
  email: string;
  active: boolean;
  role: UserRole;
  last_login: string | null;
  subscribed: boolean;
  notifMuted: boolean;
};

const addUserSchema = z.object({
  email: z.string().email("Email non valida"),
  role: z.enum(["superadmin", "admin", "user"]),
});
type AddUserInput = z.infer<typeof addUserSchema>;

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.3, ease: "easeOut" as const },
  }),
};

const roleBadgeVariant: Record<UserRole, "default" | "secondary" | "outline"> = {
  superadmin: "default",
  admin: "secondary",
  user: "outline",
};

const roleLabel: Record<UserRole, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
  user: "Utente",
};

export default function UsersPage() {
  const queryClient = useQueryClient();

  const { data: me } = useQuery<{ email: string; role: UserRole }>({
    queryKey: ["me"],
    queryFn: () => fetchJson("/api/auth/me"),
  });

  const { data: users } = useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: () => fetchJson<AdminUser[]>("/api/admin-users"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddUserInput>({
    resolver: zodResolver(addUserSchema),
    defaultValues: { role: "user" },
  });

  const canManage = me?.role === "admin" || me?.role === "superadmin";
  const isSuperadmin = me?.role === "superadmin";

  async function onAdd(data: AddUserInput) {
    try {
      await addUser(data.email, data.role);
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Utente aggiunto");
      reset();
    } catch (e) {
      toast.error("Errore", { description: e instanceof Error ? e.message : "Riprova" });
    }
  }

  async function onToggle(email: string, active: boolean) {
    try {
      await toggleUser(email, active);
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(active ? "Utente attivato" : "Utente disattivato");
    } catch (e) {
      toast.error("Errore", { description: e instanceof Error ? e.message : "Riprova" });
    }
  }

  async function onDelete(email: string) {
    try {
      await deleteUser(email);
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Utente eliminato");
    } catch (e) {
      toast.error("Errore", { description: e instanceof Error ? e.message : "Riprova" });
    }
  }

  async function onRoleChange(email: string, role: UserRole) {
    try {
      await changeUserRole(email, role);
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Ruolo aggiornato");
    } catch (e) {
      toast.error("Errore", { description: e instanceof Error ? e.message : "Riprova" });
    }
  }

  async function onMute(email: string, muted: boolean) {
    try {
      const res = await fetch("/api/push/mute", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, muted }),
      });
      if (!res.ok) throw new Error();
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(muted ? "Notifiche silenziata" : "Notifiche riattivate");
    } catch (e) {
      toast.error("Errore", { description: e instanceof Error ? e.message : "Riprova" });
    }
  }

  return (
    <motion.div
      className="p-4 md:p-8 max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Utenti</h1>
        <p className="text-sm text-muted-foreground">
          {users === undefined ? "Caricamento…" : `${users.length} utenti`}
        </p>
      </div>

      {canManage && (
        <Card className="p-4 mb-6">
          <p className="text-sm font-medium mb-3">Aggiungi utente</p>
          <form onSubmit={handleSubmit(onAdd)} className="flex flex-col gap-2 sm:flex-row">
            <div className="flex gap-2 flex-1">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="email@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>
              {isSuperadmin && (
                <select
                  {...register("role")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="user">Utente</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              )}
            </div>
            <Button type="submit" disabled={isSubmitting} className="gap-2 w-full sm:w-auto">
              <UserPlus size={16} />
              Aggiungi
            </Button>
          </form>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {users === undefined &&
          [...Array(3)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1.5">
                  <div className="h-4 bg-muted rounded w-48" />
                  <div className="h-3 bg-muted rounded w-32" />
                </div>
                <div className="h-5 w-9 bg-muted rounded-full" />
              </div>
            </Card>
          ))}

        <AnimatePresence mode="popLayout">
          {users?.map((user, i) => {
            const isSelf = user.email === me?.email;
            const canEditThis =
              !isSelf && (isSuperadmin || (me?.role === "admin" && user.role === "user"));

            return (
              <motion.div
                key={user.email}
                layout
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}
              >
                <Card className="p-4">
                  <div className="flex flex-col gap-2">
                    {/* Top row: email + badge */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium truncate">{user.email}</span>
                      <Badge variant={roleBadgeVariant[isSuperadmin ? user.role : user.role === "superadmin" ? "admin" : user.role]} className="shrink-0 text-xs">
                        {isSuperadmin ? roleLabel[user.role] : user.role === "superadmin" ? roleLabel.admin : roleLabel[user.role]}
                      </Badge>
                    </div>

                    {/* Bottom row: last login + actions */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {user.last_login
                          ? `Accesso ${new Date(user.last_login).toLocaleString("it-IT", {
                              dateStyle: "short",
                              timeStyle: "short",
                              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                            })}`
                          : "Mai effettuato l'accesso"}
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        {isSuperadmin && !isSelf && (
                          <select
                            value={user.role}
                            onChange={(e) => onRoleChange(user.email, e.target.value as UserRole)}
                            className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            <option value="user">Utente</option>
                            <option value="admin">Admin</option>
                            <option value="superadmin">Superadmin</option>
                          </select>
                        )}

                        {canEditThis && (
                          <Switch
                            id={`toggle-${user.email}`}
                            checked={user.active}
                            onCheckedChange={(checked) => onToggle(user.email, checked)}
                          />
                        )}

                        {isSuperadmin && !isSelf && user.subscribed && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${user.notifMuted ? "text-primary" : "text-muted-foreground"} hover:text-primary`}
                            onClick={() => onMute(user.email, !user.notifMuted)}
                            title={user.notifMuted ? "Riattiva notifiche" : "Silenzia notifiche"}
                          >
                            <BellOff size={15} />
                          </Button>
                        )}

                        {isSuperadmin && !isSelf && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => onDelete(user.email)}
                          >
                            <Trash2 size={15} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {users?.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Nessun utente ancora.</p>
        )}
      </div>
    </motion.div>
  );
}
