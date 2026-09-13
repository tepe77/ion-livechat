"use client";

import React, { useState } from "react";
import { Dialog } from "../ui/Dialog";
import { RatingStars } from "../ui/RatingStars";
import { Button } from "../ui/Button";
import { submitRating } from "../../lib/api/ratings";

interface MemberRatingDialogProps {
  isOpen: boolean;
  conversationId: number;
  agentName?: string;
  onSubmitted: () => void;
  onClose: () => void;
}

export function MemberRatingDialog({
  isOpen,
  conversationId,
  agentName = "Customer Service",
  onSubmitted,
  onClose,
}: MemberRatingDialogProps) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError("Silakan pilih rating 1 hingga 5 bintang.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitRating(conversationId, {
        rating,
        comment: comment.trim() || undefined,
      });
      onSubmitted();
    } catch (err: any) {
      setError(err.message || "Gagal mengirimkan rating. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Beri Penilaian Layanan"
      description={`Percakapan dengan ${agentName} telah selesai.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col items-center justify-center py-3 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-500 mb-2">Bagaimana kepuasan Anda terhadap layanan kami?</p>
          <RatingStars value={rating} onChange={setRating} size="lg" />
          <p className="text-xs font-semibold text-slate-700 mt-2">
            {rating === 5 && "Sangat Memuaskan ⭐⭐⭐⭐⭐"}
            {rating === 4 && "Memuaskan ⭐⭐⭐⭐"}
            {rating === 3 && "Cukup Baik ⭐⭐⭐"}
            {rating === 2 && "Kurang Memuaskan ⭐⭐"}
            {rating === 1 && "Tidak Memuaskan ⭐"}
          </p>
        </div>

        <div>
          <label htmlFor="comment" className="block text-xs font-medium text-slate-700 mb-1">
            Komentar atau Masukan (Opsional)
          </label>
          <textarea
            id="comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tuliskan pengalaman Anda..."
            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#023E8A] focus:outline-none focus:ring-1 focus:ring-[#023E8A]"
          />
        </div>

        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Lewati
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Kirim Penilaian
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
