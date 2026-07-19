import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dot =
    size === "sm" ? "h-7 w-7" : size === "lg" ? "h-10 w-10" : "h-8 w-8";
  const text =
    size === "sm" ? "text-base" : size === "lg" ? "text-xl" : "text-lg";
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "grid place-items-center rounded-md bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-sm",
          dot
        )}
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M5 13.5A4.5 4.5 0 0 1 9.5 9h.5A6 6 0 0 1 22 11a4 4 0 0 1-4 4H6.5A4.5 4.5 0 0 1 5 13.5z" />
          <path d="M9 19l3-3 3 3" />
        </svg>
      </span>
      <span className={cn("font-semibold tracking-tight", text)}>
        XCloud Flow
      </span>
    </span>
  );
}
