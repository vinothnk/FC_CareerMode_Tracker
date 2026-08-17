export const statusTone = {
  good: "bg-[var(--color-surface-positive)] text-[var(--color-positive)]",
  warning: "bg-[var(--color-surface-warning)] text-[var(--color-warning)]",
  neutral: "bg-[var(--color-surface-muted)] text-[var(--color-muted)]",
} as const;

export const appShell = {
  page: "min-h-screen bg-background text-foreground",
  section: "mx-auto max-w-7xl px-5 lg:px-8",
  panel: "rounded border border-[var(--color-border)] bg-[var(--color-panel)]",
} as const;
