import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

const SIZES = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-10 w-10",
};

export function Spinner({ size = "md", className, ...props }) {
  return (
    <Loader2
      className={cn(
        "animate-spin text-slate-900 dark:text-slate-100",
        SIZES[size] || size,
        className
      )}
      {...props}
    />
  );
}

export default Spinner;
