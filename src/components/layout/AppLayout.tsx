import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AgentDock } from "@/components/ai/AgentDock";
import { Menu } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center px-6">
              <SidebarTrigger className="p-2 hover:bg-accent rounded-md transition-colors">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              
              <div className="flex-1" />
              
              {/* Espaço para futuras funcionalidades como notificações, perfil, etc. */}
            </div>
          </header>
          
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
        
        {/* Agente IA Flutuante - Acessível de qualquer página */}
        <AgentDock />
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;