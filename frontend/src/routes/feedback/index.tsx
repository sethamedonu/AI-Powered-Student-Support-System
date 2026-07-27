import { component$, useSignal } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { AppLayout } from '~/components/layout/AppLayout';
import { Button } from '~/components/ui/Button';
import { Textarea } from '~/components/ui/Textarea';
import { Select } from '~/components/ui/Select';
import { Alert } from '~/components/ui/Alert';
import { feedbackApi } from '~/lib/api';

const CATEGORIES = [
  { label: 'General experience', value: 'general' },
  { label: 'AI response quality', value: 'ai-quality' },
  { label: 'Admissions information', value: 'admissions' },
  { label: 'Course registration', value: 'registration' },
  { label: 'Tuition & fees', value: 'tuition' },
  { label: 'Examinations', value: 'examinations' },
  { label: 'Scholarships', value: 'scholarships' },
  { label: 'Campus services', value: 'campus-services' },
  { label: 'Technical issue', value: 'technical' },
];

export default component$(() => {
  const rating = useSignal(0);
  const hovered = useSignal(0);
  const category = useSignal('general');
  const comment = useSignal('');
  const loading = useSignal(false);
  const success = useSignal(false);
  const error = useSignal('');

  const handleSubmit = async () => {
    if (rating.value === 0) {
      error.value = 'Please select a star rating.';
      return;
    }
    if (!comment.value.trim()) {
      error.value = 'Please enter a comment.';
      return;
    }

    error.value = '';
    loading.value = true;

    try {
      await feedbackApi.submit({
        rating: rating.value,
        category: category.value,
        comment: comment.value.trim(),
      });
      success.value = true;
      rating.value = 0;
      comment.value = '';
      category.value = 'general';
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to submit feedback. Please try again.';
    } finally {
      loading.value = false;
    }
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

  return (
    <AppLayout>
      <div class="mx-auto max-w-2xl space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Share Feedback</h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Help us improve the AI Student Support System
          </p>
        </div>

        {success.value ? (
          <div class="rounded-xl border border-green-200 bg-green-50 p-8 text-center dark:border-green-800 dark:bg-green-950">
            <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 class="mt-4 text-lg font-semibold text-green-800 dark:text-green-200">
              Thank you for your feedback!
            </h2>
            <p class="mt-1 text-sm text-green-600 dark:text-green-400">
              Your response helps us improve the experience for all students.
            </p>
            <Button
              variant="secondary"
              class="mt-6"
              onClick$={() => (success.value = false)}
            >
              Submit another
            </Button>
          </div>
        ) : (
          <div class="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <div class="space-y-6">
              {error.value && <Alert variant="error">{error.value}</Alert>}

              {/* Star rating */}
              <div>
                <p class="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Overall rating
                </p>
                <div class="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick$={() => (rating.value = star)}
                      onMouseEnter$={() => (hovered.value = star)}
                      onMouseLeave$={() => (hovered.value = 0)}
                      class="transition-transform hover:scale-110 focus:outline-none"
                      aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class={[
                          'h-8 w-8 transition-colors',
                          (hovered.value || rating.value) >= star
                            ? 'text-yellow-400'
                            : 'text-slate-200 dark:text-slate-700',
                        ].join(' ')}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                  {(hovered.value || rating.value) > 0 && (
                    <span class="ml-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                      {ratingLabels[hovered.value || rating.value]}
                    </span>
                  )}
                </div>
              </div>

              {/* Category */}
              <Select
                label="Feedback category"
                options={CATEGORIES}
                value={category.value}
                onChange$={(e) => (category.value = (e.target as HTMLSelectElement).value)}
              />

              {/* Comment */}
              <Textarea
                label="Your feedback"
                placeholder="Tell us what you liked, what could be improved, or report an issue..."
                rows={5}
                value={comment.value}
                onInput$={(e) => (comment.value = (e.target as HTMLTextAreaElement).value)}
                hint="Minimum 10 characters"
              />

              <Button
                fullWidth
                loading={loading.value}
                disabled={rating.value === 0 || comment.value.trim().length < 10}
                onClick$={handleSubmit}
              >
                Submit feedback
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
});

export const head: DocumentHead = {
  title: 'Feedback — AI Student Support',
  meta: [{ name: 'description', content: 'Share your feedback about the AI Student Support System' }],
};
