"use client";
import { useEffect } from "react";

const VERSION_KEY = "corto_deploy_version";

function reloadWithBlur() {
  const el = document.createElement("div");
  el.style.cssText =
    "position:fixed;inset:0;z-index:9999;backdrop-filter:blur(6px);background:rgba(255,255,255,0.35);opacity:0;transition:opacity 0.2s ease";
  document.body.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => { el.style.opacity = "1"; }));
  setTimeout(() => window.location.reload(), 250);
}

async function checkForAppUpdate() {
  try {
    const res = await fetch("/api/version", { cache: "no-store" });
    const { v } = await res.json();
    if (!v) return;
    const stored = sessionStorage.getItem(VERSION_KEY);
    if (stored === null) {
      sessionStorage.setItem(VERSION_KEY, v);
    } else if (stored !== v) {
      sessionStorage.setItem(VERSION_KEY, v);
      reloadWithBlur();
    }
  } catch {}
}

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {});

    // When a new SW takes control, reload to apply updates
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      reloadWithBlur();
    });

    // On iOS PWA the app resumes from background without a page reload.
    // On visibilitychange: check if the server has a new deploy version —
    // if so reload immediately (catches app changes even when sw.js is unchanged).
    // Also trigger a SW update check as fallback.
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        checkForAppUpdate();
        navigator.serviceWorker.getRegistration().then((reg) => {
          if (reg) reg.update();
        });
      }
    }

    // Handle navigation requests from SW (e.g. notification click on iOS)
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate" && event.data?.url) {
        window.location.href = event.data.url;
      }
    }

    checkForAppUpdate(); // check on first load too
    navigator.serviceWorker.addEventListener("message", handleMessage);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
  return null;
}
