"use client";

import { useEffect } from "react";
import { startBackendKeepAlive } from "@/lib/backend-keep-alive";

export function BackendKeepAlive() {
  useEffect(() => startBackendKeepAlive(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"), []);
  return null;
}
