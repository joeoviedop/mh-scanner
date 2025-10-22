import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "link";

type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingLabel?: ReactNode;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    _variant = "primary",
    _size = "md",
    type = "button",
    isLoading = false,
    loadingLabel,
    disabled,
    asChild = false,
    children,
    ...props
  },
  ref,
) {
  const loadingContent = loadingLabel ?? children;
  const Component = asChild ? Slot : "button";

  return (
    <Component
      ref={ref}
      {...(!asChild ? { type } : {})}
      className={className}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <>
          {typeof loadingContent === "string" || typeof loadingContent === "number" ? (
            <span>{loadingContent}</span>
          ) : (
            loadingContent
          )}
        </>
      ) : (
        children
      )}
    </Component>
  );
});
