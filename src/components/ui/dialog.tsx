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
        <Dialog.Overlay data-lenis-prevent className="fixed inset-0 z-[90] bg-ink/50" />
        <Dialog.Content
          data-lenis-prevent
          onFocusOutside={(event) => event.preventDefault()}
          className={cn(
            "fixed left-1/2 top-1/2 z-[90] flex max-h-[calc(100dvh-1.5rem)] w-[min(calc(100vw-1.5rem),32rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden border border-line bg-background shadow-editorial outline-none sm:max-h-[calc(100dvh-2.5rem)]",
            wide && "w-[min(calc(100vw-1.5rem),56rem)]",
          )}
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6 sm:py-5">
            <div className="min-w-0 pr-2">
              <Dialog.Title className="font-serif text-2xl leading-tight sm:text-3xl">{title}</Dialog.Title>
              {description ? <Dialog.Description className="mt-2 text-sm leading-6 text-muted">{description}</Dialog.Description> : null}
            </div>
            <Dialog.Close className="flex h-10 w-10 shrink-0 items-center justify-center text-foreground transition hover:text-sage">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>
          <div
            data-lenis-prevent
            data-desk-scroll=""
            className="max-h-[min(44rem,calc(100dvh-12rem))] min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6"
          >
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
