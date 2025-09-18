import { Outlet } from "react-router-dom";
import { Sidebar, SidebarNav } from "./Sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";

export function Layout() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Sidebar />
      <div className="flex flex-col sm:pl-72">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:pt-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Abrir Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs bg-background/95 backdrop-blur-sm">
              <SidebarNav isMobile={true} />
            </SheetContent>
          </Sheet>
          {/* Futuramente, podemos adicionar um breadcrumb ou barra de busca aqui */}
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:pb-4 md:gap-8"> {/* Ajustado p-4 para mobile */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}