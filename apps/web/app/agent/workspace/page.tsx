"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../stores/authStore";
import { AgentWorkspace } from "../../../components/agent/AgentWorkspace";
import { Loader2 } from "lucide-react";

export default function AgentWorkspacePage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) {
      router.push("/login");
      return;
    }
    // Allow agents, managers, and superadmins
    if (user.role === "member") {
      router.push("/member/chat");
    }
  }, [user, isInitialized, router]);

  if (!isInitialized || !user || user.role === "member") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#1E3785] animate-spin" />
      </div>
    );
  }

  return <AgentWorkspace />;
}
