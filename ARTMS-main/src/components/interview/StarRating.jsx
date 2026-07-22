/**
 * StarRating — interactive or read-only star rating (1–5 stars).
 *
 * Props:
 *   value       number   current rating (0–5)
 *   onChange    fn       called with new rating; omit for read-only
 *   max         number   default 5
 *   size        'sm'|'md'|'lg'
 *   showLabel   bool     show numeric label next to stars
 */
import { useState } from "react";
import { cn } from "../../utils/cn";

const SIZES = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
};

export default function StarRating({
  value = 0,
  onChange,
  max = 5,
  size = "md",
  showLabel = false,
  className,
}) {
  const [hovered, setHovered] = useState(null);
  const readOnly = !onChange;
  const display = hovered ?? value;

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1;
        const filled = star <= display;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            aria-label={`Rate ${star} out of ${max}`}
            onClick={() => !readOnly && onChange(star === value ? 0 : star)}
            onMouseEnter={() => !readOnly && setHovered(star)}
            onMouseLeave={() => !readOnly && setHovered(null)}
            className={cn(
              SIZES[size],
              "leading-none transition-transform",
              readOnly
                ? "cursor-default"
                : "cursor-pointer hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded",
              filled ? "text-amber-400" : "text-slate-200"
            )}
          >
            ★
          </button>
        );
      })}
      {showLabel && (
        <span className="ml-1 text-sm font-semibold text-slate-600">
          {value > 0 ? `${value}/${max}` : "—"}
        </span>
      )}
    </div>
  );
}
