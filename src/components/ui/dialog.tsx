"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DeskDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-ink/50" />
        <Dialog.Content
          onFocusOutside={(event) => event.preventDefault()}
          className={cn(
            "fixed left-1/2 top-1/2 z-[90] flex max-h-[min(92dvh,52rem)] w-[min(100%-2rem,32rem)] -translate-x-1/2 -translate-y-1/2 flex-col border border-line bg-background p-6 shadow-editorial outline-none",
            wide && "w-[min(100%-2rem,56rem)]",
          )}
        >
          <Dialog.Title className="pr-10 font-serif text-3xl">{title}</Dialog.Title>
          {description ? <Dialog.Description className="mt-2 text-sm leading-6 text-muted">{description}</Dialog.Description> : null}
          <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">{children}</div>
          <Dialog.Close className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center text-foreground transition hover:text-sage">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
