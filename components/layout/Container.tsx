import { cn } from "@/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
  /**
   * Tailwind className to append. Use for additional layout utilities
   * (flex, gap, etc.). The standard max-width + padding is always applied.
   */
  className?: string;
  as?: "div" | "section" | "header" | "footer" | "nav" | "main";
}

/**
 * Layout primitive — applies the standard Sillage page width
 * (max-w-[1440px], responsive horizontal padding, centered).
 *
 * The SearchOverlay modal intentionally uses a different max-width
 * (860px) and lives outside this primitive on purpose.
 */
export function Container({
  children,
  className,
  as: Tag = "div",
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        "max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8",
        className
      )}
    >
      {children}
    </Tag>
  );
}
