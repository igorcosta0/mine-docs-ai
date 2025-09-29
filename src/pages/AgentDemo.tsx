import AppLayout from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AgentDock } from "@/components/ai/AgentDock";
import { Bot, Zap, Shield, Brain, MessageSquare, FileSearch } from "lucide-react";

export default function AgentDemo() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Bot className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold">Agente Conversacional IA</h1>
            <Badge variant="secondary" className="text-lg px-3 py-1">Demo</Badge>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Assistente inteligente para análise e gerenciamento de documentos técnicos
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6">
            <Zap className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Análise Automática</h3>
            <p className="text-sm text-muted-foreground">
              Processa e indexa documentos automaticamente ao fazer upload
            </p>
          </Card>

          <Card className="p-6">
            <Brain className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Busca Semântica</h3>
            <p className="text-sm text-muted-foreground">
              Encontre informações usando linguagem natural com tecnologia RAG
            </p>
          </Card>

          <Card className="p-6">
            <Shield className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">100% Local</h3>
            <p className="text-sm text-muted-foreground">
              Dados permanecem na empresa com Ollama local
            </p>
          </Card>
        </div>

        {/* Demo Instructions */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Como Usar a Demo
          </h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Abra o Dock Flutuante</h3>
                <p className="text-muted-foreground">
                  Clique no botão <Bot className="inline h-4 w-4 mx-1" /> no canto inferior direito
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Explore o Chat</h3>
                <p className="text-muted-foreground">
                  Veja mensagens demonstrativas e a interface de conversação
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Configure o Agente</h3>
                <p className="text-muted-foreground">
                  Acesse as configurações para ver opções de provedor, modo e parâmetros
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Use Cases */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <FileSearch className="h-6 w-6 text-primary" />
            Exemplos de Uso
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold">Consultas Técnicas</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• "Quais normas ABNT são citadas nos documentos?"</p>
                <p>• "Equipamentos com potência acima de 300kW"</p>
                <p>• "Capacidade total de processamento instalada"</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Análise e Relatórios</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• "Gere comparativo entre britadores HP-500 e XR-800"</p>
                <p>• "Resuma memoriais descritivos de 2024"</p>
                <p>• "Liste todos os fabricantes mencionados"</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Note */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Esta é uma demonstração visual do conceito. A implementação completa incluirá:
          </p>
          <p className="mt-2">
            Integração com Ollama • RAG com pgvector • Event Bus • Modo Autopilot
          </p>
        </div>
      </div>

      {/* Floating Dock - Always visible */}
      <AgentDock />
    </AppLayout>
  );
}
