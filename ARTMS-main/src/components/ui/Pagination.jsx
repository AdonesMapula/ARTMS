import { cn } from "../../utils/cn";
import Button from "./Button";

export default function Pagination({
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
  className,
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < pageCount;

  const getVisiblePages = (current, total) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    
    if (current <= 4) {
      return [1, 2, 3, 4, 5, "...", total];
    }
    
    if (current >= total - 3) {
      return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    }
    
    return [1, "...", current - 1, current, current + 1, "...", total];
  };

  const pages = getVisiblePages(page, pageCount);

  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <p className="text-xs text-slate-500">
        Page <span className="font-semibold text-slate-700">{page}</span> of{" "}
        <span className="font-semibold text-slate-700">{pageCount}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!canPrev}
          onClick={() => onPageChange?.(page - 1)}
        >
          Prev
        </Button>
        
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">
                  ...
                </span>
              );
            }
            return (
              <Button
                key={p}
                variant={p === page ? "primary" : "outline"}
                size="sm"
                className={cn("w-9 h-9 p-0", p !== page && "text-slate-600")}
                onClick={() => onPageChange?.(p)}
              >
                {p}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={!canNext}
          onClick={() => onPageChange?.(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
