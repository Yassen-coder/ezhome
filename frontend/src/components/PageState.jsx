import { RefreshCw } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

export const ProductGridSkeleton = ({ count = 8 }) => (
  <div
    className="grid grid-cols-2 gap-x-1.5 gap-y-3 sm:gap-x-2 sm:gap-y-4 md:grid-cols-3 lg:grid-cols-4"
    data-testid="product-grid-skeleton"
  >
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="aspect-[3/4] w-full rounded-xl" />
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-3 w-2/3 rounded-md" />
        <Skeleton className="h-4 w-1/2 rounded-md" />
      </div>
    ))}
  </div>
);

export const PageLoading = ({ message = "Loading…" }) => (
  <div className="container-px mx-auto max-w-[1400px] py-20" data-testid="page-loading">
    <p className="overline text-muted-foreground text-center mb-8">{message}</p>
    <ProductGridSkeleton count={8} />
  </div>
);

export const PageError = ({ message = "We couldn't load this page. Please try again.", onRetry }) => (
  <div className="container-px mx-auto max-w-[1400px] py-20 text-center" data-testid="page-error">
    <div className="max-w-md mx-auto border border-border bg-card p-8">
      <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          data-testid="page-retry-button"
        >
          <RefreshCw className="w-4 h-4" /> Try again
        </button>
      )}
    </div>
  </div>
);

export const PageEmpty = ({ message = "Nothing here yet.", testId = "page-empty" }) => (
  <p className="text-center text-muted-foreground py-20" data-testid={testId}>
    {message}
  </p>
);

export const InlineErrorBanner = ({ message, onRetry }) => (
  <div className="container-px mx-auto max-w-[1400px] pt-4" data-testid="inline-error-banner">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
      <p className="text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] font-medium hover:underline shrink-0"
          data-testid="inline-retry-button"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      )}
    </div>
  </div>
);
