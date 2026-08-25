import { cn } from "../../utils/cn";

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-100 dark:bg-slate-800", className)}
      {...props}
    />
  );
}

export { Skeleton };
export default Skeleton; 
