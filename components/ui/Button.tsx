import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-card font-medium transition-[transform,opacity,background-color,color,border-color,box-shadow] duration-200 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none min-h-[44px] px-6 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default: "bg-black text-cream hover:bg-gray-mid",
        outline: "border bg-transparent hover:bg-black hover:text-cream",
        ghost: "bg-transparent hover:bg-gray-light",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-4 text-sm",
        lg: "h-12 px-8 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = ({ className, variant, size, ...props }: ButtonProps) => (
  <button
    className={cn(buttonVariants({ variant, size, className }))}
    {...props}
  />
);
