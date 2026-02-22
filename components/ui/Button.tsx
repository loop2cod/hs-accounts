import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-neutral-400 disabled:opacity-50";
  const variants = {
    primary:
      "bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800",
    secondary:
      "bg-transparent border-neutral-300 text-neutral-700 hover:bg-neutral-100",
    ghost:
      "border-transparent text-neutral-700 hover:bg-neutral-100",
    danger:
      "border-red-600 text-red-600 hover:bg-red-50",
  };
  const sizes = {
    sm: "text-sm px-2.5 py-1.5",
    md: "text-sm px-3 py-2",
  };
  return (
    <button
      type="button"
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
