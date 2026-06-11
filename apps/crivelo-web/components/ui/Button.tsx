"use client";

import { forwardRef, type ComponentProps } from "react";
import { type Button as CriveloButton, buttonVariants } from "@crivelo/ui/button";
import { cn } from "@crivelo/ui/lib/utils";

/**
 * crivelo-web Button — thin app-local wrapper over the shared
 * `@crivelo/ui/button` (RMP-206b). It reuses the shared shadcn `buttonVariants`
 * (cva) — the canonical primitive's variant/size scales and teal theming (via the
 * alias layer) flow through unchanged — and renders a native `<button>` so it can
 * forward refs via `React.forwardRef`.
 *
 * Why a wrapper: the shared `Button` is a plain function component, so it does NOT
 * forward refs on React 18. The Header hamburger needs its ref to reach the DOM
 * button (it is the NavSheet's focus-return target — `SheetContent`'s
 * `onCloseAutoFocus`), so a ref-forwarding wrapper is required. This wrapper is an
 * extension of the `@crivelo/ui` base, not a new primitive.
 */
// Reuse the shared Button's variant/size prop types (its cva VariantProps),
// without taking a direct dependency on class-variance-authority.
type ButtonProps = ComponentProps<"button"> &
  Pick<ComponentProps<typeof CriveloButton>, "variant" | "size">;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant, size, ...props }, ref) {
    return (
      <button
        ref={ref}
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
