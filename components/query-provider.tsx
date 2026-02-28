"use client";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { AuthError } from "@/lib/fetch";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const client = useMemo(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError(error) {
            if (error instanceof AuthError) {
              router.push("/login");
            }
          },
        }),
      }),
    [router]
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
