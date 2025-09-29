import { useState } from "react";
import { Send, Loader2, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  status?: "loading" | "success" | "error";
};

const MOCK_MESSAGES: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Olá! Detectei 3 novos documentos no Data Lake. Quer que eu analise?",
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: "2",
    role: "user",
    content: "Sim, me mostre um resumo",
    timestamp: new Date(Date.now() - 240000),
  },
  {
    id: "3",
    role: "assistant",
    content: "Analisando documentos...",
    timestamp: new Date(Date.now() - 180000),
    status: "loading",
  },
];

export function AgentChat() {
  const [messages] = useState<Message[]>(MOCK_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    setInput("");
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                {message.status === "loading" && (
                  <div className="flex items-center gap-2 mt-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs opacity-70">Processando...</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Demo de análise de documentos */}
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-muted">
              <div className="text-sm mb-3">Principais descobertas:</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Memorial-2024.pdf</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Especificação-X.docx</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Folha-Dados-Britador.pdf</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border text-sm">
                <div>• 2 docs sobre britagem</div>
                <div>• 1 memorial civil</div>
                <div>• Normas: ABNT NBR 13028</div>
              </div>
            </div>
          </div>

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Agente está digitando...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Digite sua mensagem..."
            className="flex-1"
          />
          <Button onClick={handleSend} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground text-center">
          Demo - Respostas são mockadas
        </div>
      </div>
    </div>
  );
}
