import { SignInButton } from "./sign-in-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const isUnauthorized = error === "unauthorized";

  return (
    <div className="min-h-dvh w-full flex items-center justify-center bg-white relative overflow-hidden">
      {/* Background geometric accents */}
      <div className="absolute top-[-120px] right-[-120px] w-[400px] h-[400px] rounded-full bg-primary opacity-[0.06] blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-80px] left-[-80px] w-[300px] h-[300px] rounded-full bg-primary opacity-[0.04] blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-[200px] h-[200px] rounded-full bg-orange-100 opacity-30 blur-2xl pointer-events-none" />

      <div className="relative w-full max-w-[360px] mx-4 flex flex-col gap-10">
        {/* Wordmark */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs font-medium tracking-widest text-gray-400 uppercase">
              Link shortener
            </span>
          </div>
          <h1 className="text-[72px] leading-none font-bold tracking-tight bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text text-transparent">
            Corto
          </h1>
          <div className="h-[3px] w-12 bg-primary rounded-full" />
          <p className="text-sm text-gray-500 leading-relaxed mt-1">
            Accorcia link, genera QR code e analizza i risultati
          </p>
        </div>

        {/* Auth block */}
        <div className="flex flex-col gap-4">
          {isUnauthorized && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              <p className="text-sm text-red-600 leading-snug">
                Account non autorizzato. Contatta un amministratore per
                richiedere l&apos;accesso.
              </p>
            </div>
          )}
          <SignInButton />
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-300 text-center">
          Accesso riservato ai membri autorizzati
        </p>
      </div>
    </div>
  );
}
