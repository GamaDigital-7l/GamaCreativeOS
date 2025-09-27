import { Badge, BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CustomBadgeProps extends BadgeProps {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

export function CustomBadge({ className, variant, ...props }: CustomBadgeProps) {
  const customVariantClasses = {
    success: "bg-green-500 text-green-50-foreground hover:bg-green-500/80",
    warning: "bg-yellow-500 text-yellow-50-foreground hover:bg-yellow-500/80",
  };

  return (
    <Badge
      className={cn(
        variant && (customVariantClasses[variant as keyof typeof customVariantClasses]),
        className
      )}
      variant={variant && !Object.keys(customVariantClasses).includes(variant) ? variant : "default"}
      {...props}
    />
  );
}