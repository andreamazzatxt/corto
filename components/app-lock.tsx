"use client";
import { useEffect, useState } from "react";
import { Fingerprint, ScanFace, ShieldAlert } from "lucide-react";

const CRED_KEY = "corto_webauthn_cred_id";
const SESSION_KEY = "corto_unlocked";

type Status = "checking" | "setup" | "locked" | "error" | "unlocked";

function bufferToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

export function AppLock({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "true") {
      setStatus("unlocked");
      return;
    }
    if (localStorage.getItem(CRED_KEY)) {
      setStatus("locked");
      authenticate();
    } else {
      setStatus("unlocked");
    }
  }, []);

  async function authenticate() {
    setErrorMsg(null);
    try {
      const credId = localStorage.getItem(CRED_KEY);
      if (!credId) { setStatus("setup"); return; }

      await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          allowCredentials: [{ id: base64ToBuffer(credId), type: "public-key" }],
          userVerification: "required",
          timeout: 60000,
        },
      });

      sessionStorage.setItem(SESSION_KEY, "true");
      setStatus("unlocked");
    } catch (err: unknown) {
      const name = (err as { name?: string }).name;
      if (name === "NotAllowedError") {
        setErrorMsg("Accesso biometrico negato");
      } else if (name === "NotSupportedError") {
        setErrorMsg("Biometrico non supportato su questo dispositivo");
      } else {
        setErrorMsg("Autenticazione fallita");
      }
      setStatus("error");
    }
  }

  async function register() {
    setErrorMsg(null);
    try {
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: "Corto", id: window.location.hostname },
          user: {
            id: crypto.getRandomValues(new Uint8Array(16)),
            name: "user",
            displayName: "Corto",
          },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }],
          authenticatorSelection: { userVerification: "required", residentKey: "preferred" },
          timeout: 60000,
        },
      }) as PublicKeyCredential | null;

      if (!cred) throw new Error("Registrazione annullata");

      localStorage.setItem(CRED_KEY, bufferToBase64(cred.rawId));
      sessionStorage.setItem(SESSION_KEY, "true");
      setStatus("unlocked");
    } catch (err: unknown) {
      const name = (err as { name?: string }).name;
      if (name === "NotAllowedError") {
        setErrorMsg("Registrazione annullata");
      } else {
        setErrorMsg("Biometrico non supportato su questo dispositivo");
      }
      setStatus("error");
    }
  }

  if (status === "unlocked") return <>{children}</>;

  if (status === "checking") return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8 px-6">
      <div className="flex flex-col items-center gap-3">
        <img src="/icon-192.png" alt="Corto" className="w-20 h-20 rounded-2xl shadow-sm" />
        <h1 className="text-xl font-bold tracking-tight">Corto</h1>
      </div>

      {status === "setup" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground max-w-xs">
            Configura il blocco biometrico per proteggere l&apos;accesso all&apos;app.
          </p>
          <button
            type="button"
            onClick={register}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <ScanFace size={16} />
            Configura Face ID / Touch ID
          </button>
          <button
            type="button"
            onClick={() => { sessionStorage.setItem(SESSION_KEY, "true"); setStatus("unlocked"); }}
            className="text-xs text-muted-foreground hover:underline"
          >
            Salta per ora
          </button>
        </div>
      )}

      {status === "locked" && (
        <div className="flex flex-col items-center gap-4">
          <Fingerprint size={40} className="text-muted-foreground animate-pulse" />
          <p className="text-sm text-muted-foreground">Autenticazione in corso…</p>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <ShieldAlert size={36} className="text-destructive" />
          <p className="text-sm text-muted-foreground max-w-xs">{errorMsg}</p>
          <button
            type="button"
            onClick={() => { setStatus("locked"); authenticate(); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Fingerprint size={16} />
            Riprova
          </button>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(CRED_KEY);
              sessionStorage.setItem(SESSION_KEY, "true");
              setStatus("unlocked");
            }}
            className="text-xs text-muted-foreground hover:underline"
          >
            Rimuovi blocco biometrico
          </button>
        </div>
      )}
    </div>
  );
}
