import { cn } from "../../utils/cn";

export default function Skeleton({ className }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-[linear-gradient(90deg,#f1f5f9, #e2e8f0, #f1f5f9)] bg-[length:200%_100%]",
        className
      )}
      style={{ animation: "skeleton 1.4s ease-in-out infinite" }}
    />
  );
}

