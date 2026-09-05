import * as React from "react"
import { cn } from "../../utils/cn"

const Table = React.forwardRef(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm border-collapse", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70",
      className
    )}
    {...props}
  />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0 divide-y divide-slate-100 dark:divide-slate-800/70", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 font-medium [&>tr]:last:border-b-0", className)}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-slate-100 dark:border-slate-800/70 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-850/50 data-[state=selected]:bg-blue-50/40 dark:data-[state=selected]:bg-blue-950/20",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-9 px-3.5 text-left align-middle text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("py-2.5 px-3.5 align-middle text-sm text-slate-700 dark:text-slate-300 [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-xs text-slate-500 dark:text-slate-400", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

// Legacy Exports to maintain backward compatibility with old pages
export function THead({ className, ...props }) {
  return (
    <thead
      className={cn(
        "sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400",
        className
      )}
      {...props}
    />
  );
}

export function TH({ className, ...props }) {
  return (
    <th
      className={cn(
        "border-b border-slate-200/80 dark:border-slate-800 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400",
        className
      )}
      {...props}
    />
  );
}

export function TD({ className, ...props }) {
  return (
    <td
      className={cn(
        "border-b border-slate-100 dark:border-slate-800/70 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-300",
        className
      )}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
}
