import React from "react";
import Button from "./Button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./empty";
import { Spinner } from "./spinner";
import { cn } from "../../utils/cn";

export function SpinnerEmpty({
  title = "Processing your request",
  description = "Please wait while we process your request. Do not refresh the page.",
  onCancel,
  canCancel = false,
  className,
}) {
  return (
    <Empty className={cn("w-full", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Spinner />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {canCancel && onCancel && (
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}

export default SpinnerEmpty;
