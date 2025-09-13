import { Link, useNavigate } from "react-router-dom";
import { Home, Wrench, Users, Smartphone, Package, Settings, UserCircle, LogOut, ShoppingCart, Building, Receipt, DollarSign, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

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
  { href: "/gamification", label: "Gamificação", icon: Trophy },
];

const bottomNavItems = [
  { href: "/settings", label: "Configurações", icon: Settings },
  { href: "/profile", label: "Meu Perfil", icon: UserCircle },
];

export function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link to="/" className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base mb-4">
          <Wrench className="h-4 w-4 transition-all group-hover:scale-110" />
          <span className="sr-only">Service OS</span>
        </Link>
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        {bottomNavItems.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
        <Button variant="ghost" onClick={handleLogout} className="flex w-full items-center justify-start gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </nav>
    </aside>
  );
}