import { Badge, BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CustomBadgeProps extends Omit<BadgeProps, 'variant'> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

export function CustomBadge({ className, variant, ...props }: CustomBadgeProps) {
  const customVariantClasses = {
    success: "bg-green-500 text-green-50-foreground hover:bg-green-500/80",
    warning: "bg-yellow-500 text-yellow-50-foreground hover:bg-yellow-500/80",
  };

  const baseVariant = variant && Object.keys(customVariantClasses).includes(variant)
    ? "default" // Fallback to a base variant if it's a custom one
    : variant;

  return (
    <Badge
      className={cn(
        variant && (customVariantClasses[variant as keyof typeof customVariantClasses]),
        className
      )}
      variant={baseVariant as BadgeProps['variant']}
      {...props}
    />
  );
}