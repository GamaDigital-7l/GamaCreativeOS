import { Badge, BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CustomVariant = "success" | "warning";
type BaseBadgeVariant = Exclude<BadgeProps['variant'], undefined>; // "default" | "destructive" | "outline" | "secondary"

interface CustomBadgeProps extends Omit<BadgeProps, 'variant'> {
  variant?: BaseBadgeVariant | CustomVariant;
}

export function CustomBadge({ className, variant, ...props }: CustomBadgeProps) {
  const customVariantClasses: Record<CustomVariant, string> = {
    success: "bg-green-500 text-green-50-foreground hover:bg-green-500/80",
    warning: "bg-yellow-500 text-yellow-50-foreground hover:bg-yellow-500/80",
  };

  const isCustomVariant = variant && (variant === "success" || variant === "warning");
  
  // Se for uma variante customizada, passa "default" para o componente Badge subjacente
  // e aplica o estilo customizado via className.
  // Caso contrário, passa a variante diretamente.
  const actualBadgeVariant: BaseBadgeVariant = isCustomVariant ? "default" : (variant as BaseBadgeVariant);

  return (
    <Badge
      className={cn(
        isCustomVariant && customVariantClasses[variant as CustomVariant],
        className
      )}
      variant={actualBadgeVariant}
      {...props}
    />
  );
}