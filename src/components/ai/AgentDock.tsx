import { useState } from "react";
import { Bot, X, Minimize2, Maximize2, Settings, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AgentChat } from "./AgentChat";
import { AgentConfig } from "./AgentConfig";

type DockState = "minimized" | "chat" | "config";

export function AgentDock() {
  const [state, setState] = useState<DockState>("minimized");
  const [unreadCount] = useState(3);

  if (state === "minimized") {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="h-16 w-16 rounded-full shadow-lg relative hover:scale-110 transition-transform"
          onClick={() => setState("chat")}
        >
          <Bot className="h-8 w-8" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px]">
      <Card className="w-full h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <span className="font-semibold">Assistente IA</span>
            <Badge variant="secondary" className="text-xs">Demo</Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setState(state === "chat" ? "config" : "chat")}
            >
              {state === "chat" ? <Settings className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setState("minimized")}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {state === "chat" ? <AgentChat /> : <AgentConfig />}
        </div>
      </Card>
    </div>
  );
}
