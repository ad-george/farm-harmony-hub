import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { SidebarProvider, useSidebarState } from "@/contexts/SidebarContext";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

function DashboardContent({ children, title, subtitle }: DashboardLayoutProps) {
  const { collapsed } = useSidebarState();
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div
        className="transition-all duration-300"
        style={{ paddingLeft: collapsed ? 80 : 280 }}
      >
        <TopBar title={title} subtitle={subtitle} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

export function DashboardLayout(props: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardContent {...props} />
    </SidebarProvider>
  );
}
