"use client";

import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { feedbackApi } from "@/lib/api";

const CATEGORIES = [
  { label: "General experience", value: "general" },
  { label: "AI response quality", value: "ai-quality" },
  { label: "Admissions information", value: "admissions" },
  { label: "Course registration", value: "registration" },
  { label: "Tuition & fees", value: "tuition" },
  { label: "Examinations", value: "examinations" },
  { label: "Scholarships", value: "scholarships" },
  { label: "Campus services", value: "campus-services" },
  { label: "Technical issue", value: "technical" },
];

export function FeedbackClient() {
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [category, setCategory] = useState("general");
  const [comment, setComment] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const ratingLabels = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];
  const ratingColors = ["", "text-red-500", "text-orange-500", "text-yellow-500", "text-lime-500", "text-emerald-500"];

  function handleSubmit() {
    if (rating === 0) { setError("Please select a star rating."); return; }
    if (!comment.trim()) { setError("Please enter a comment."); return; }
    setError("");

    startTransition(async () => {
      try {
        await feedbackApi.submit({ rating, category, comment: comment.trim() });
        setSuccess(true);
        setRating(0);
        setComment("");
        setCategory("general");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to submit feedback. Please try again.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Share Feedback</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Help us improve the AI Student Support System
        </p>
      </div>

      {success ? (
        <div className="flex flex-col items-center rounded-2xl border border-emerald-200 bg-emerald-50 p-12 text-center dark:border-emerald-800 dark:bg-emerald-950/30">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-5 font-display text-xl font-bold text-emerald-800 dark:text-emerald-200">
            Thank you for your feedback!
          </h2>
          <p className="mt-2 max-w-sm text-sm text-emerald-600 dark:text-emerald-400">
            Your response helps us improve the experience for all students.
          </p>
          <Button variant="secondary" className="mt-7" onClick={() => setSuccess(false)}>
            Submit another
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <div className="space-y-6">
            {error && <Alert variant="error">{error}</Alert>}

            {/* Star rating */}
            <div>
              <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Overall rating</p>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                    className="transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-9 w-9 transition-colors ${(hovered || rating) >= star ? "text-yellow-400" : "text-slate-200 dark:text-slate-700"}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
                {(hovered || rating) > 0 && (
                  <span className={`ml-2 text-sm font-semibold ${ratingColors[hovered || rating]}`}>
                    {ratingLabels[hovered || rating]}
                  </span>
                )}
              </div>
            </div>

            <Select
              label="Feedback category"
              options={CATEGORIES}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />

            <Textarea
              label="Your feedback"
              placeholder="Tell us what you liked, what could be improved, or report an issue..."
              rows={5}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              hint="Minimum 10 characters"
            />

            <Button
              fullWidth
              loading={isPending}
              disabled={rating === 0 || comment.trim().length < 10}
              onClick={handleSubmit}
            >
              Submit feedback
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
