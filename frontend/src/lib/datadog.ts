"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

let initialized = false;
let rum: any = null;

export function initDatadog() {
  if (initialized || typeof window === "undefined") return;

  const applicationId = process.env.NEXT_PUBLIC_DD_APPLICATION_ID;
  const clientToken = process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN;

  if (!applicationId || !clientToken) {
    console.log("[Datadog] No credentials, running without monitoring");
    initialized = true;
    return;
  }

  import("@datadog/browser-rum")
    .then((mod) => {
      rum = mod.datadogRum;
      rum.init({
        applicationId,
        clientToken,
        site: "datadoghq.com",
        service: "nestmind",
        env: "production",
        version: "1.0.0",
        sessionSampleRate: 100,
        sessionReplaySampleRate: 100,
        trackUserInteractions: true,
        trackResources: true,
        trackLongTasks: true,
        defaultPrivacyLevel: "mask-user-input",
      });
      initialized = true;
      console.log("[Datadog] RUM initialized");
    })
    .catch((e) => {
      console.log("[Datadog] Failed to load", e);
      initialized = true;
    });
}

export function trackAction(name: string, context?: Record<string, unknown>) {
  try {
    if (rum) rum.addAction(name, context);
  } catch { /* noop */ }
}

export function trackError(error: Error, context?: Record<string, unknown>) {
  try {
    if (rum) rum.addError(error, context);
  } catch { /* noop */ }
}

export function setUser(id: string, name: string) {
  try {
    if (rum) rum.setUser({ id, name });
  } catch { /* noop */ }
}

export function trackTiming(name: string, durationMs: number) {
  try {
    if (rum) rum.addAction(name, { duration_ms: durationMs });
  } catch { /* noop */ }
}
