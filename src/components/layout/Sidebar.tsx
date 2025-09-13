import { Link, NavLink, useNavigate } from "react-router-dom";
import { Home, Wrench, Users, Smartphone, Package, Settings, UserCircle, LogOut, ShoppingCart, Building, Receipt, DollarSign, Trophy, Store } from "lucide-react"; // Adicionado Store icon
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Início", icon: Home },
  { href: "/service-orders", label: "Ordens de Serviço", icon: Wrench },
  { href: "/sales", label: "Vendas de Aparelhos", icon: ShoppingCart },
  { href: "/pos", label: "Ponto de Venda", icon: Receipt },
  { href: "/financials", label: "Financeiro", icon: DollarSign },
  { href: "/customers", label: "Clientes", icon: Users },
  { href: "/devices", label: "Dispositivos", icon: Smartphone },
  { href: "/inventory", label: "Estoque", icon: Package },
  { href: "/suppliers", label: "Fornecedores", icon: Building },
  { href: "/catalog", label: "Catálogo Online", icon: Store }, // Novo item de navegação
  { href: "/gamification", label: "Gamificação", icon: Trophy },
];

const bottomNavItems = [
  { href: "/settings", label: "Configurações", icon: Settings },
  { href: "/profile", label: "Meu Perfil", icon: UserCircle },
];

export function SidebarNav({ isMobile = false }: { isMobile?: boolean }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
      isActive ? "bg-muted text-primary" : "text-muted-foreground"
    );

  return (
    <div className="flex flex-col h-full">
      <nav className={cn("grid gap-2 text-sm font-medium", isMobile ? "px-2" : "px-2 sm:py-5")}>
        {isMobile && (
          <Link to="/" className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base mb-4">
            <Wrench className="h-5 w-5 transition-all group-hover:scale-110" />
            <span className="sr-only">Service OS Pro</span>
          </Link>
        )}
        {navItems.map((item) => (
          <NavLink key={item.label} to={item.href} className={navLinkClasses} end={item.href === "/"}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <nav className={cn("mt-auto grid gap-2 text-sm font-medium", isMobile ? "px-2" : "px-2 sm:py-5")}>
        {bottomNavItems.map((item) => (
          <NavLink key={item.label} to={item.href} className={navLinkClasses}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
        <Button variant="ghost" onClick={handleLogout} className="flex items-center justify-start gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </nav>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-72 flex-col border-r bg-background sm:flex">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Wrench className="h-6 w-6 text-primary" />
            <span className="">Service OS Pro</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <SidebarNav />
        </div>
      </div>
    </aside>
  );
}