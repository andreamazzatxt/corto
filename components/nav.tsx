"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createAuthClient } from "better-auth/react";
import {
  AnimatePresence,
  type MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { BarChart2, Bell, BellOff, Download, Fingerprint, List, LogOut, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const authClient = createAuthClient();

const items = [
  { href: "/admin", label: "Crea", icon: Plus },
  { href: "/admin/links", label: "Links", icon: List },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/admin/users", label: "Utenti", icon: Users },
];

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function DockLink({
  mouseX,
  href,
  label,
  icon: Icon,
  active,
}: {
  mouseX: MotionValue<number>;
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const scale = useSpring(useTransform(distance, [-50, 0, 50], [1, 1.2, 1]), {
    stiffness: 350,
    damping: 22,
  });

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatePresence>
        {hovered && (
          <motion.span
            className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-foreground text-background text-xs rounded-lg whitespace-nowrap pointer-events-none z-10"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      <motion.div ref={ref} style={{ scale }}>
        <Link
          href={href}
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
            active
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Icon size={18} />
        </Link>
      </motion.div>
    </div>
  );
}

function DockAvatar({
  mouseX,
  initials,
  onClick,
}: {
  mouseX: MotionValue<number>;
  initials: string;
  onClick: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const scale = useSpring(useTransform(distance, [-50, 0, 50], [1, 1.2, 1]), {
    stiffness: 350,
    damping: 22,
  });

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatePresence>
        {hovered && (
          <motion.span
            className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-foreground text-background text-xs rounded-lg whitespace-nowrap pointer-events-none z-10"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
          >
            Account
          </motion.span>
        )}
      </AnimatePresence>

      <motion.div ref={ref} style={{ scale }}>
        <button
          type="button"
          onClick={onClick}
          className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold hover:bg-primary/20 transition-colors"
        >
          {initials}
        </button>
      </motion.div>
    </div>
  );
}

function DockBell({
  mouseX,
  onClick,
}: {
  mouseX: MotionValue<number>;
  onClick: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const scale = useSpring(useTransform(distance, [-50, 0, 50], [1, 1.2, 1]), {
    stiffness: 350,
    damping: 22,
  });

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatePresence>
        {hovered && (
          <motion.span
            className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-foreground text-background text-xs rounded-lg whitespace-nowrap pointer-events-none z-10"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
          >
            Notifica
          </motion.span>
        )}
      </AnimatePresence>

      <motion.div ref={ref} style={{ scale }}>
        <button
          type="button"
          onClick={onClick}
          className="flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Bell size={18} />
        </button>
      </motion.div>
    </div>
  );
}

export function FloatingNav() {
  const path = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [showUser, setShowUser] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showIosInstall, setShowIosInstall] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyBody, setNotifyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const mouseX = useMotionValue(Infinity);

  const user = session?.user;
  const initials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : (user?.email?.slice(0, 2).toUpperCase() ?? "?");

  // Fetch role
  useEffect(() => {
    if (!user?.email) return;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setRole(d.role ?? null))
      .catch(() => {});
  }, [user?.email]);

  // Read deploy version stored by ServiceWorkerRegistrar
  useEffect(() => {
    const v = sessionStorage.getItem("corto_deploy_version");
    if (v) setVersion(v.slice(0, 7));
  }, []);

  // Capture install prompt (Android/Chrome)
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Check existing push subscription
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub);
      });
    });
  }, []);

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
  }

  async function setupBiometric() {
    try {
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: "Corto", id: window.location.hostname },
          user: { id: crypto.getRandomValues(new Uint8Array(16)), name: "user", displayName: "Corto" },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }],
          authenticatorSelection: { userVerification: "required", residentKey: "preferred" },
          timeout: 60000,
        },
      }) as PublicKeyCredential | null;
      if (!cred) throw new Error();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(cred.rawId)));
      localStorage.setItem("corto_webauthn_cred_id", b64);
      toast.success("Biometrico attivato");
      setShowUser(false);
    } catch {
      toast.error("Configurazione biometrico fallita");
    }
  }

  const isStandalone = typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true));

  const isIos = typeof window !== "undefined" &&
    /iphone|ipad|ipod/i.test(navigator.userAgent) && !("chrome" in window);

  async function handleInstall() {
    setShowUser(false);
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") setInstallPrompt(null);
    } else if (isIos) {
      setShowIosInstall(true);
    }
  }

  const showInstallButton = !isStandalone && (!!installPrompt || isIos);

  async function togglePushSubscription() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Push non supportate in questo browser");
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;

      if (subscribed) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await fetch("/api/push/subscribe", { method: "DELETE" });
        }
        setSubscribed(false);
        toast.success("Notifiche disattivate");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Permesso notifiche negato");
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY non configurata");
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });

      if (!res.ok) throw new Error(`Subscribe API error: ${res.status}`);

      setSubscribed(true);
      toast.success("Notifiche attivate");
    } catch (err) {
      console.error("[push]", err);
      toast.error(`Errore: ${err instanceof Error ? err.message : "sconosciuto"}`);
    }
  }

  async function sendCustomNotification(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/push/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: notifyTitle, body: notifyBody }),
      });
      if (!res.ok) throw new Error();
      toast.success("Notifica inviata");
      setNotifyTitle("");
      setNotifyBody("");
      setShowNotifyModal(false);
    } catch {
      toast.error("Errore nell'invio");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Custom notification modal (superadmin only) */}
      <AnimatePresence>
        {showNotifyModal && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setShowNotifyModal(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-white border rounded-2xl shadow-xl p-4 w-80"
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <p className="text-sm font-semibold mb-3">Invia notifica</p>
              <form onSubmit={sendCustomNotification} className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Titolo"
                  value={notifyTitle}
                  onChange={(e) => setNotifyTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <textarea
                  placeholder="Messaggio"
                  value={notifyBody}
                  onChange={(e) => setNotifyBody(e.target.value)}
                  required
                  rows={2}
                  className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {sending ? "Invio..." : "Invia a tutti"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* iOS install instructions */}
      <AnimatePresence>
        {showIosInstall && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setShowIosInstall(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-white border rounded-2xl shadow-xl p-4 w-72"
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <p className="text-sm font-semibold mb-1">Installa su iPhone</p>
              <p className="text-xs text-muted-foreground mb-3">
                Per installare Corto sulla schermata Home:
              </p>
              <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li>Tocca il pulsante <strong>Condividi</strong> ↑ in Safari</li>
                <li>Scorri e tocca <strong>Aggiungi a Home</strong></li>
                <li>Tocca <strong>Aggiungi</strong> in alto a destra</li>
              </ol>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* User popover */}
      <AnimatePresence>
        {showUser && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              onClick={() => setShowUser(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-white border rounded-2xl shadow-xl p-1.5 min-w-[200px]"
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <div className="px-3 py-2.5 border-b mb-1">
                <p className="text-sm font-medium truncate">
                  {user?.name || user?.email?.split("@")[0]}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              {showInstallButton && (
                <button
                  type="button"
                  onClick={handleInstall}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Download size={14} /> Installa app
                </button>
              )}
              <button
                type="button"
                onClick={togglePushSubscription}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {subscribed ? <BellOff size={14} /> : <Bell size={14} />}
                {subscribed ? "Disattiva notifiche" : "Attiva notifiche"}
              </button>
              {typeof window !== "undefined" && !localStorage.getItem("corto_webauthn_cred_id") && (
                <button
                  type="button"
                  onClick={setupBiometric}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Fingerprint size={14} /> Attiva biometrico
                </button>
              )}
              {typeof window !== "undefined" && localStorage.getItem("corto_webauthn_cred_id") && (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("corto_webauthn_cred_id");
                    toast.success("Biometrico rimosso");
                    window.location.reload();
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Fingerprint size={14} /> Rimuovi biometrico
                </button>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <LogOut size={14} /> Esci
              </button>
              {version && (
                <p className="px-3 pt-1 pb-1.5 text-[10px] text-muted-foreground/50 text-right">
                  v{version}
                </p>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating pill */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <motion.div
          className="flex items-center gap-1 bg-background/90 backdrop-blur-md border shadow-lg rounded-full px-3 py-2"
          onMouseMove={(e) => mouseX.set(e.clientX)}
          onMouseLeave={() => mouseX.set(Infinity)}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {items.map(({ href, label, icon }) => {
            const active =
              href === "/admin" ? path === "/admin" : path.startsWith(href);
            return (
              <DockLink
                key={href}
                mouseX={mouseX}
                href={href}
                label={label}
                icon={icon}
                active={active}
              />
            );
          })}

          <div className="w-px h-5 bg-border mx-1" />

          {role === "superadmin" && (
            <>
              <DockBell mouseX={mouseX} onClick={() => { setShowNotifyModal((v) => !v); setShowUser(false); }} />
              <div className="w-px h-5 bg-border mx-1" />
            </>
          )}

          <DockAvatar
            mouseX={mouseX}
            initials={initials}
            onClick={() => { setShowUser((v) => !v); setShowNotifyModal(false); }}
          />
        </motion.div>
      </div>
    </>
  );
}

export function Sidebar() {
  return null;
}
export function BottomNav() {
  return null;
}
