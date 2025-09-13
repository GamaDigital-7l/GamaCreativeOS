import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function Layout() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Sidebar />
      <main className="flex flex-col sm:gap-4 sm:py-4 sm:pl-72">
        <Outlet />
      </main>
    </div>
  );
}