"use client";

import React, { useEffect, useState } from "react";
import type { User } from "@ion/types";
import { getManagerAgents } from "../../lib/api/manager";
import { transferConversation } from "../../lib/api/conversations";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { UserCheck, AlertCircle } from "lucide-react";

interface TransferModalProps {
  isOpen: boolean;
  conversationId: number;
  currentAgentId: number;
  onTransferred: () => void;
  onClose: () => void;
}

export function TransferModal({
  isOpen,
  conversationId,
  currentAgentId,
  onTransferred,
  onClose,
}: TransferModalProps) {
  const [agents, setAgents] = useState<User[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);
      getManagerAgents({ presence: "online", availability: "available" })
        .then((res) => {
          // Filter out current agent
          setAgents(res.data.filter((a) => a.id !== currentAgentId));
        })
        .catch((err) => setError(err.message || "Gagal memuat daftar agen."))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, currentAgentId]);

  const handleTransfer = async () => {
    if (!selectedAgentId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await transferConversation(conversationId, selectedAgentId);
      onTransferred();
    } catch (err: any) {
      setError(err.message || "Gagal melakukan transfer percakapan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Percakapan"
      description="Pilih agen tujuan yang sedang online dan tersedia untuk menerima percakapan ini."
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            Tidak ada agen lain yang sedang online dan available saat ini.
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {agents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedAgentId === agent.id
                    ? "border-[#1E4ED8] bg-[#1E4ED8]/5 text-[#1E4ED8]"
                    : "border-slate-200 hover:bg-slate-50 text-slate-800"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-xs">
                    {agent.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{agent.name}</p>
                    <p className="text-[11px] text-slate-500">{agent.email}</p>
                  </div>
                </div>

                {selectedAgentId === agent.id && <UserCheck className="h-4 w-4 text-[#1E4ED8]" />}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!selectedAgentId}
            isLoading={isSubmitting}
            onClick={handleTransfer}
          >
            Konfirmasi Transfer
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
