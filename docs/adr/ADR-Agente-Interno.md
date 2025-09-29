# ADR-001: Agente Conversacional Interno ("Funcionário-IA")

**Status:** Proposto  
**Data:** 2025-09-29  
**Autores:** Sistema MinerDocs AI  
**Revisores:** Equipe de Desenvolvimento  

---

## 1. Resumo Executivo

### O que é

O **Agente Interno** (ou "Funcionário-IA") é um assistente conversacional inteligente integrado ao mine-docs-ai que atua de forma **proativa e reativa** para auxiliar usuários em tarefas técnicas relacionadas a documentos de engenharia civil/mineração.

### Por que é útil

- **Proatividade:** Detecta eventos do sistema (uploads, indexações, erros) e oferece ações contextuais automaticamente
- **Contextualização:** Tem acesso ao Data Lake, histórico de documentos e conhecimento extraído para respostas precisas
- **Flexibilidade:** Suporta execução local (Ollama) e em nuvem (OpenAI-compatible APIs)
- **Produtividade:** Reduz tempo em tarefas repetitivas (geração de relatórios, análises, triagem)

### Como se encaixa no fluxo atual

O agente se integra de forma **não-invasiva** através de:
1. **UI flutuante** (dock minimizável) acessível de qualquer página
2. **Event bus** que escuta eventos-chave do sistema sem alterar lógica existente
3. **Providers plugáveis** que funcionam com infraestrutura atual (Ollama já presente, OpenAI via env vars)

---

## 2. Como Implementar (Passo a Passo)

### 2.1 Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    AppLayout                          │   │
│  │  ┌────────────────┐    ┌──────────────────────────┐  │   │
│  │  │  Main Content  │    │    <AgentDock />         │  │   │
│  │  │  (Pages/Routes)│    │  ┌────────────────────┐  │  │   │
│  │  │                │    │  │ Chat UI            │  │  │   │
│  │  │                │    │  │ - Messages         │  │  │   │
│  │  │                │    │  │ - Input            │  │  │   │
│  │  │                │    │  │ - Status           │  │  │   │
│  │  │                │    │  │ - Settings         │  │  │   │
│  │  └────────────────┘    │  └────────────────────┘  │  │   │
│  │                        │  (Minimizável, Arrastável)│  │   │
│  └────────────────────────┴──────────────────────────┘  │   │
└─────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   ┌────▼─────┐    ┌─────▼──────┐   ┌─────▼─────┐
   │ EventBus │    │InternalAgent│   │ Providers │
   │          │◄───┤             │──►│           │
   │ - emit() │    │ - history   │   │ - Ollama  │
   │ - on()   │    │ - context   │   │ - OpenAI  │
   │ - off()  │    │ - state     │   │ - Groq    │
   └──────────┘    └─────────────┘   └───────────┘
        ▲
        │
   [Sistema emite eventos:]
   - USER_MESSAGE
   - DL_ITEM_UPLOADED
   - DOCS_INDEXED
   - PROCESSING_ERROR
   - SYSTEM_TICK (opcional)
```

### 2.2 Arquivos a Criar

```
src/agent/
├── core/
│   ├── InternalAgent.ts          # Lógica principal do agente
│   ├── eventBus.ts                # Event bus singleton
│   └── types.ts                   # Interfaces e tipos
├── providers/
│   ├── BaseProvider.ts            # Interface abstrata
│   ├── OllamaProvider.ts          # Implementação Ollama
│   └── OpenAIProvider.ts          # Implementação OpenAI-compatible
├── ui/
│   ├── AgentDock.tsx              # Componente dock flutuante
│   ├── ChatMessage.tsx            # Componente de mensagem
│   ├── AgentSettings.tsx          # Painel de configurações
│   └── styles.css                 # Estilos específicos (se necessário)
└── utils/
    ├── prompts.ts                 # System prompts e templates
    └── context.ts                 # Helpers para construir contexto
```

### 2.3 Arquivos Existentes a Alterar

| Arquivo | Alteração |
|---------|-----------|
| `src/App.tsx` | Adicionar `<AgentDock />` no render final |
| `src/components/datalake/UploadForm.tsx` | Emitir evento `DL_ITEM_UPLOADED` após upload |
| `src/lib/knowledgeProcessor.ts` | Emitir evento `DOCS_INDEXED` após indexação |
| `src/lib/ollama.ts` | (Nenhuma alteração, mas será usado pelo OllamaProvider) |
| `.env` | Adicionar variáveis `VITE_AI_*` |

### 2.4 Pseudocódigo e Snippets

#### 2.4.1 EventBus (`src/agent/core/eventBus.ts`)

```typescript
type EventType = 
  | 'USER_MESSAGE'
  | 'DL_ITEM_UPLOADED'
  | 'DOCS_INDEXED'
  | 'PROCESSING_ERROR'
  | 'SYSTEM_TICK'
  | 'AGENT_RESPONSE';

type EventPayload = {
  USER_MESSAGE: { message: string; userId?: string };
  DL_ITEM_UPLOADED: { itemId: string; title: string; type: string };
  DOCS_INDEXED: { count: number; userId?: string };
  PROCESSING_ERROR: { error: string; context?: any };
  SYSTEM_TICK: { timestamp: number };
  AGENT_RESPONSE: { message: string; metadata?: any };
};

class EventBus {
  private listeners = new Map<EventType, Set<(payload: any) => void>>();

  on<T extends EventType>(event: T, handler: (payload: EventPayload[T]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off<T extends EventType>(event: T, handler: (payload: EventPayload[T]) => void) {
    this.listeners.get(event)?.delete(handler);
  }

  emit<T extends EventType>(event: T, payload: EventPayload[T]) {
    console.log(`[EventBus] Emitting: ${event}`, payload);
    this.listeners.get(event)?.forEach(handler => {
      try {
        handler(payload);
      } catch (error) {
        console.error(`[EventBus] Error in handler for ${event}:`, error);
      }
    });
  }
}

export const eventBus = new EventBus();
```

#### 2.4.2 BaseProvider (`src/agent/providers/BaseProvider.ts`)

```typescript
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export abstract class BaseProvider {
  abstract name: string;
  
  abstract generate(
    messages: AIMessage[],
    options?: GenerateOptions
  ): Promise<string>;
  
  abstract isAvailable(): Promise<boolean>;
}
```

#### 2.4.3 OllamaProvider (`src/agent/providers/OllamaProvider.ts`)

```typescript
import { generateWithOllama, checkOllama } from '@/lib/ollama';
import { BaseProvider, AIMessage, GenerateOptions } from './BaseProvider';

export class OllamaProvider extends BaseProvider {
  name = 'Ollama';
  private model: string;

  constructor(model = 'llama3.1:8b') {
    super();
    this.model = model;
  }

  async generate(messages: AIMessage[], options?: GenerateOptions): Promise<string> {
    // Combinar mensagens em um prompt único para Ollama
    const prompt = messages
      .map(m => `${m.role === 'user' ? 'User' : m.role === 'assistant' ? 'Assistant' : 'System'}: ${m.content}`)
      .join('\n\n');
    
    return await generateWithOllama(this.model, prompt);
  }

  async isAvailable(): Promise<boolean> {
    return await checkOllama();
  }
}
```

#### 2.4.4 OpenAIProvider (`src/agent/providers/OpenAIProvider.ts`)

```typescript
import { BaseProvider, AIMessage, GenerateOptions } from './BaseProvider';

export class OpenAIProvider extends BaseProvider {
  name = 'OpenAI-Compatible';
  private baseURL: string;
  private apiKey: string;
  private model: string;

  constructor(baseURL: string, apiKey: string, model = 'gpt-4o-mini') {
    super();
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.model = model;
  }

  async generate(messages: AIMessage[], options?: GenerateOptions): Promise<string> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Simple health check
      const response = await fetch(`${this.baseURL}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

#### 2.4.5 InternalAgent (`src/agent/core/InternalAgent.ts`)

```typescript
import { eventBus } from './eventBus';
import { BaseProvider } from '../providers/BaseProvider';
import { OllamaProvider } from '../providers/OllamaProvider';
import { OpenAIProvider } from '../providers/OpenAIProvider';

export type AgentMode = 'passive' | 'autopilot';

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export class InternalAgent {
  private provider: BaseProvider;
  private history: AgentMessage[] = [];
  private mode: AgentMode = 'passive';
  private systemPrompt: string;

  constructor(provider: BaseProvider) {
    this.provider = provider;
    this.systemPrompt = this.getSystemPrompt();
    this.setupEventListeners();
  }

  private getSystemPrompt(): string {
    return `Você é um assistente especializado em documentos técnicos de engenharia civil e mineração.
Você tem acesso a um Data Lake de documentos e pode ajudar com:
- Análise e consulta de documentos
- Geração de relatórios técnicos
- Triagem de tarefas e priorização
- Sugestões proativas baseadas em eventos do sistema

Seja conciso, técnico e útil. Sempre cite fontes quando relevante.`;
  }

  private setupEventListeners() {
    // Escutar uploads
    eventBus.on('DL_ITEM_UPLOADED', (payload) => {
      if (this.mode === 'autopilot') {
        this.handleUploadEvent(payload);
      }
    });

    // Escutar indexações
    eventBus.on('DOCS_INDEXED', (payload) => {
      if (this.mode === 'autopilot') {
        this.handleIndexedEvent(payload);
      }
    });

    // Escutar erros
    eventBus.on('PROCESSING_ERROR', (payload) => {
      this.handleErrorEvent(payload);
    });
  }

  private async handleUploadEvent(payload: any) {
    const suggestion = `📄 Detectei upload de "${payload.title}". Quer que eu analise o conteúdo e sugira tags/categorias?`;
    this.addMessage('assistant', suggestion, { event: 'upload', ...payload });
    eventBus.emit('AGENT_RESPONSE', { message: suggestion, metadata: payload });
  }

  private async handleIndexedEvent(payload: any) {
    const suggestion = `✅ ${payload.count} documentos indexados com sucesso. Quer um resumo do conhecimento extraído?`;
    this.addMessage('assistant', suggestion, { event: 'indexed', ...payload });
    eventBus.emit('AGENT_RESPONSE', { message: suggestion, metadata: payload });
  }

  private async handleErrorEvent(payload: any) {
    const message = `⚠️ Erro detectado: ${payload.error}. Precisa de ajuda para diagnosticar?`;
    this.addMessage('assistant', message, { event: 'error', ...payload });
    eventBus.emit('AGENT_RESPONSE', { message, metadata: payload });
  }

  async sendMessage(userMessage: string): Promise<string> {
    this.addMessage('user', userMessage);
    eventBus.emit('USER_MESSAGE', { message: userMessage });

    const messages = [
      { role: 'system' as const, content: this.systemPrompt },
      ...this.history.slice(-10).map(m => ({ 
        role: m.role as 'user' | 'assistant', 
        content: m.content 
      })),
    ];

    try {
      const response = await this.provider.generate(messages);
      this.addMessage('assistant', response);
      eventBus.emit('AGENT_RESPONSE', { message: response });
      return response;
    } catch (error) {
      const errorMsg = `Erro ao gerar resposta: ${(error as Error).message}`;
      this.addMessage('assistant', errorMsg, { error: true });
      return errorMsg;
    }
  }

  private addMessage(role: 'user' | 'assistant' | 'system', content: string, metadata?: any) {
    this.history.push({
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
      metadata,
    });
  }

  getHistory() {
    return [...this.history];
  }

  setMode(mode: AgentMode) {
    this.mode = mode;
  }

  getMode() {
    return this.mode;
  }

  clearHistory() {
    this.history = [];
  }
}

// Singleton instance
let agentInstance: InternalAgent | null = null;

export function initializeAgent(provider: BaseProvider) {
  agentInstance = new InternalAgent(provider);
  return agentInstance;
}

export function getAgent(): InternalAgent {
  if (!agentInstance) {
    throw new Error('Agent not initialized. Call initializeAgent first.');
  }
  return agentInstance;
}
```

#### 2.4.6 AgentDock (`src/agent/ui/AgentDock.tsx`)

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { MessageCircle, X, Minimize2, Settings, Send } from 'lucide-react';
import { getAgent, AgentMode } from '../core/InternalAgent';
import { eventBus } from '../core/eventBus';

export const AgentDock: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AgentMode>('passive');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Escutar respostas do agente
    const handler = (payload: any) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: payload.message,
        timestamp: new Date(),
      }]);
    };
    
    eventBus.on('AGENT_RESPONSE', handler);
    return () => eventBus.off('AGENT_RESPONSE', handler);
  }, []);

  useEffect(() => {
    // Auto-scroll ao receber nova mensagem
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    }]);

    setLoading(true);
    try {
      const agent = getAgent();
      await agent.sendMessage(userMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    const newMode = mode === 'passive' ? 'autopilot' : 'passive';
    setMode(newMode);
    getAgent().setMode(newMode);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-110"
      >
        <MessageCircle className="h-6 w-6 mx-auto" />
      </button>
    );
  }

  if (isMinimized) {
    return (
      <Card className="fixed bottom-6 right-6 z-50 p-4 shadow-xl">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <span className="font-medium">Agente IA</span>
          <Button size="sm" variant="ghost" onClick={() => setIsMinimized(false)}>
            Expandir
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 z-50 w-96 h-[600px] shadow-2xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <h3 className="font-semibold">Agente IA</h3>
          <Badge variant={mode === 'autopilot' ? 'default' : 'secondary'}>
            {mode === 'autopilot' ? '🚀 Autopilot' : '💤 Passivo'}
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={() => setIsMinimized(true)}>
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Settings */}
      <div className="p-2 border-t bg-muted/50">
        <div className="flex items-center justify-between text-sm">
          <span>Modo Autopilot</span>
          <Switch checked={mode === 'autopilot'} onCheckedChange={toggleMode} />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t flex gap-2">
        <Input
          placeholder="Digite sua mensagem..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading}
        />
        <Button size="icon" onClick={handleSend} disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
```

#### 2.4.7 Emitir eventos no sistema

**Em `src/components/datalake/UploadForm.tsx`** (após upload bem-sucedido):

```typescript
// Após linha de toast.success("Upload concluído!")
import { eventBus } from '@/agent/core/eventBus';

eventBus.emit('DL_ITEM_UPLOADED', {
  itemId: result.id,
  title: title,
  type: docType,
});
```

**Em `src/lib/knowledgeProcessor.ts`** (após saveKnowledgeToDatabase):

```typescript
import { eventBus } from '@/agent/core/eventBus';

if (result.success) {
  eventBus.emit('DOCS_INDEXED', {
    count: knowledgeItems.length,
    userId: /* userId if available */
  });
}
```

#### 2.4.8 Integração no App.tsx

```typescript
// No topo do arquivo
import { AgentDock } from '@/agent/ui/AgentDock';
import { initializeAgent } from '@/agent/core/InternalAgent';
import { OllamaProvider } from '@/agent/providers/OllamaProvider';
import { OpenAIProvider } from '@/agent/providers/OpenAIProvider';
import { useEffect } from 'react';

// Dentro do componente App, após QueryClientProvider
const App = () => {
  useEffect(() => {
    // Inicializar agente baseado em env vars
    const aiProvider = import.meta.env.VITE_AI_PROVIDER || 'ollama';
    
    let provider;
    if (aiProvider === 'openai') {
      provider = new OpenAIProvider(
        import.meta.env.VITE_AI_BASE_URL || 'https://api.openai.com/v1',
        import.meta.env.VITE_AI_API_KEY || '',
        import.meta.env.VITE_AI_MODEL || 'gpt-4o-mini'
      );
    } else {
      provider = new OllamaProvider(
        import.meta.env.VITE_OLLAMA_MODEL || 'llama3.1:8b'
      );
    }
    
    initializeAgent(provider);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* ... rotas existentes ... */}
          </Routes>
        </BrowserRouter>
        
        {/* Dock do agente - sempre visível */}
        <AgentDock />
      </TooltipProvider>
    </QueryClientProvider>
  );
};
```

#### 2.4.9 Variáveis de ambiente (`.env`)

```env
# Existing vars...
VITE_SUPABASE_PROJECT_ID="injihzgvpbnzwswshigt"
VITE_SUPABASE_PUBLISHABLE_KEY="..."
VITE_SUPABASE_URL="https://injihzgvpbnzwswshigt.supabase.co"

# Agent Configuration
VITE_AI_PROVIDER="ollama"              # "ollama" | "openai"
VITE_OLLAMA_URL="http://localhost:11434"
VITE_OLLAMA_MODEL="llama3.1:8b"        # ou "qwen2.5:14b"

# Para modo nuvem (OpenAI-compatible)
VITE_AI_BASE_URL="https://api.groq.com/openai/v1"  # ou Together, Fireworks, etc.
VITE_AI_API_KEY="your-api-key-here"
VITE_AI_MODEL="llama-3.1-70b-versatile"
```

---

## 3. Benefícios Esperados (Matriz de Impacto)

| Benefício | Impacto | Justificativa |
|-----------|---------|---------------|
| **Produtividade** | 🟢 Alto | Reduz 30-50% do tempo em tarefas repetitivas (relatórios, análises) |
| **Padronização** | 🟢 Alto | Garante uso consistente de templates e normas técnicas |
| **Proatividade** | 🟡 Médio | Detecção automática de problemas/oportunidades (autopilot) |
| **Triagem** | 🟡 Médio | Prioriza tarefas e sugere próximos passos |
| **UX** | 🟡 Médio | Interface conversacional mais natural que menus/forms |
| **Redução de erros** | 🟢 Alto | Validação e sugestões baseadas em conhecimento extraído |
| **Onboarding** | 🟡 Médio | Novos usuários aprendem o sistema através do agente |

---

## 4. Mudanças no Sistema Atual

### 4.1 Componentes Impactados

- **`src/App.tsx`**: Adicionar `<AgentDock />` e lógica de inicialização do agente
- **`src/components/datalake/UploadForm.tsx`**: Emitir evento `DL_ITEM_UPLOADED`
- **`src/lib/knowledgeProcessor.ts`**: Emitir evento `DOCS_INDEXED`
- **`src/lib/ollama.ts`**: Nenhuma alteração (usado via OllamaProvider)

### 4.2 Novos Contextos/Env Vars

```
VITE_AI_PROVIDER        # "ollama" | "openai"
VITE_OLLAMA_URL         # URL do Ollama local
VITE_OLLAMA_MODEL       # Modelo Ollama (llama3.1:8b, qwen2.5:14b)
VITE_AI_BASE_URL        # URL do provider OpenAI-compatible
VITE_AI_API_KEY         # API key para provider nuvem
VITE_AI_MODEL           # Nome do modelo na nuvem
```

### 4.3 Ajustes no tsconfig

Se usar alias `@/agent`, adicionar em `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/agent/*": ["./src/agent/*"]
    }
  }
}
```

---

## 5. Impactos Negativos / Trade-offs

| Impacto Negativo | Severidade | Mitigação |
|------------------|------------|-----------|
| **Uso de CPU/GPU** | 🟡 Médio | Limitar frequência de chamadas; usar modelos menores (8B vs 70B); cache de respostas |
| **Latência** | 🟡 Médio | Indicadores de loading; respostas assíncronas; streaming (fase 3) |
| **Complexidade operacional** | 🟡 Médio | Documentação clara; feature flag para desabilitar; logs estruturados |
| **Alucinação/Erros** | 🔴 Alto | Guardrails (validação de output); disclaimers; modo "sugestão" vs "execução" |
| **Privacidade** | 🔴 Alto | Não enviar dados sensíveis para nuvem (prefer Ollama); mascaramento de logs; LGPD compliance |
| **Custo (nuvem)** | 🟡 Médio | Monitorar uso por usuário; limites de rate; alertas de budget |

### 5.1 Guardrails e Mitigações Detalhadas

1. **Limites por evento:**
   - Max 5 mensagens proativas por hora (autopilot)
   - Max 50 mensagens reativas por dia por usuário
   - Backoff exponencial em caso de erros consecutivos

2. **Auditoria:**
   - Log de todas as interações (prompt + resposta + custo/latência)
   - Amostragem de 10% para análise de qualidade
   - Dashboard de métricas (tokens usados, latência, erros)

3. **Cache:**
   - Cache de respostas comuns (ex: "Como fazer um memorial descritivo?")
   - TTL de 7 dias para respostas técnicas
   - Invalidação ao detectar novos documentos relevantes

4. **Métricas de segurança:**
   - Detecção de prompts maliciosos (injection)
   - Rate limiting por IP/usuário
   - Sandbox de execução (sem acesso direto ao DB)

---

## 6. Requisitos e Pré-condições

### 6.1 Modo Offline (Ollama)

**Hardware Mínimo:**
- **GPU:** 8GB VRAM (para Llama 3.1 8B quantizado Q4)
- **RAM:** 16GB
- **Armazenamento:** 5GB para modelo

**Modelo Recomendado:**
```bash
# Llama 3.1 8B (equilibrado)
ollama pull llama3.1:8b

# Qwen 2.5 14B (melhor qualidade, mais VRAM)
ollama pull qwen2.5:14b

# Parâmetros sugeridos
{
  "temperature": 0.7,
  "top_p": 0.9,
  "repeat_penalty": 1.1,
  "num_ctx": 4096  // contexto de 4k tokens
}
```

**Quantização:**
- Q4_K_M (recomendado): 4.5GB, boa qualidade
- Q5_K_M: 5.5GB, melhor qualidade
- Q8_0: 8GB, máxima qualidade (sem perda)

### 6.2 Modo Nuvem (OpenAI-compatible)

**Provedores testados:**
- **Groq** (rápido, gratuito com limites): `https://api.groq.com/openai/v1`
- **Together AI**: `https://api.together.xyz/v1`
- **Fireworks AI**: `https://api.fireworks.ai/inference/v1`
- **OpenRouter** (agregador): `https://openrouter.ai/api/v1`

**Credenciais:**
- Obter API key do provider escolhido
- Configurar `VITE_AI_BASE_URL` e `VITE_AI_API_KEY` no `.env`
- Modelos recomendados:
  - Groq: `llama-3.1-70b-versatile` (gratuito)
  - Together: `meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo`
  - OpenRouter: `meta-llama/llama-3.1-8b-instruct:free`

### 6.3 Embeddings Locais (Fase 1+)

**Modelo recomendado:**
```bash
ollama pull bge-m3
```

**Integração com pgvector (Supabase):**
```sql
-- Criar extensão
CREATE EXTENSION IF NOT EXISTS vector;

-- Criar tabela de embeddings
CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES data_lake(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1024),  -- bge-m3 produz 1024 dims
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca vetorial
CREATE INDEX ON document_embeddings USING ivfflat (embedding vector_cosine_ops);
```

### 6.4 Segurança

**Onde ficam as chaves:**
- **Ollama:** Nenhuma chave necessária (API local)
- **Nuvem:** Chaves em `.env` (NUNCA comitar no Git)
- **Produção:** Usar Supabase secrets ou variáveis de ambiente do host

**Políticas de acesso:**
- RLS no Supabase para embeddings e logs por usuário
- Mascaramento de dados sensíveis em logs
- HTTPS obrigatório para chamadas externas

---

## 7. Plano de Testes e Critérios de Aceite

### 7.1 Testes Manuais

| Cenário | Passos | Resultado Esperado |
|---------|--------|-------------------|
| **Envio de mensagem** | 1. Abrir dock<br>2. Digitar "Olá"<br>3. Clicar Send | Resposta do agente em <5s |
| **Troca de provider** | 1. Mudar `.env` de ollama → openai<br>2. Recarregar app<br>3. Enviar mensagem | Provider correto usado (verificar logs) |
| **Evento upload** | 1. Fazer upload de PDF<br>2. Observar dock | Mensagem proativa aparece (se autopilot) |
| **Evento indexação** | 1. Processar documentos<br>2. Observar dock | Notificação de N conhecimentos extraídos |
| **Timeout** | 1. Desligar Ollama<br>2. Enviar mensagem | Erro amigável exibido |

### 7.2 Cenários RAG (Fase 1+)

| Cenário | Entrada | Saída Esperada |
|---------|---------|----------------|
| **Consulta com citação** | "Como especificar concreto C30?" | Resposta + lista de fontes (docs relevantes) |
| **Pergunta sem contexto** | "Qual o clima de Marte?" | "Não tenho informações no Data Lake sobre isso" |
| **Multi-documento** | "Compare memoriais A e B" | Análise comparativa citando ambos |

### 7.3 Critérios de Aceite (Checklist)

#### Fase 0 (MVP)
- [ ] Dock flutuante aparece corretamente
- [ ] Mensagens enviadas e recebidas
- [ ] Histórico mantido durante sessão
- [ ] Modo passivo/autopilot togglável
- [ ] Provider Ollama funcional
- [ ] Provider OpenAI funcional
- [ ] Eventos `DL_ITEM_UPLOADED` emitidos
- [ ] Eventos `DOCS_INDEXED` emitidos
- [ ] Respostas proativas no modo autopilot

#### Fase 1 (RAG)
- [ ] Embeddings gerados para documentos
- [ ] Busca semântica funcional
- [ ] Citações de fontes nas respostas
- [ ] Contexto relevante injetado no prompt

#### Fase 2 (Avançado)
- [ ] Roteamento automático local ↔ nuvem
- [ ] Guardrails de validação de output
- [ ] Fallback em caso de erro de provider

#### Fase 3 (Produção)
- [ ] Streaming de respostas (SSE)
- [ ] Dashboard de métricas
- [ ] Testes automatizados (E2E)
- [ ] Logs estruturados e auditáveis

---

## 8. Métricas, Custo e Desempenho

### 8.1 Latência Alvo

| Provider | p50 | p95 | p99 |
|----------|-----|-----|-----|
| Ollama (8B) | <3s | <6s | <10s |
| Ollama (14B) | <5s | <10s | <15s |
| Groq (70B) | <1s | <2s | <4s |
| Together (70B) | <3s | <6s | <10s |

### 8.2 Custo por 1k Tokens (Nuvem)

| Provider | Input | Output | Modelo |
|----------|-------|--------|--------|
| Groq | Grátis* | Grátis* | llama-3.1-70b (30 req/min) |
| Together | $0.0006 | $0.0006 | Meta-Llama-3.1-70B-Instruct |
| OpenRouter | Grátis* | Grátis* | llama-3.1-8b (limite diário) |
| OpenAI | $0.15 | $0.60 | gpt-4o-mini |

*Sujeito a limites de rate/quota

### 8.3 Uso de GPU/CPU Local

**Ollama (Llama 3.1 8B Q4):**
- VRAM: ~4.5GB
- RAM: ~2GB
- CPU: 20-30% (inference) em i7 8-core

**Impacto no navegador:**
- RAM adicional: ~50MB (histórico + UI)
- CPU: desprezível (apenas UI)

### 8.4 Logs Mínimos

```typescript
// Estrutura de log sugerida
interface AgentLog {
  timestamp: Date;
  userId: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  cost?: number;  // se nuvem
  event?: string;  // ex: "USER_MESSAGE", "DL_ITEM_UPLOADED"
  promptSample?: string;  // primeiros 100 chars (para debug)
  responseSample?: string;  // primeiros 100 chars
}
```

**Amostragem:**
- 100% de logs de erro
- 10% de logs de sucesso (para métricas)
- Mascaramento de dados sensíveis (ex: nomes próprios, CPF, CNPJ)

**Privacidade:**
- Nunca logar prompts completos em produção
- Hash de userId para anonimização
- Retenção de logs: 30 dias

---

## 9. Riscos e Mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Ollama offline** | Alta | Médio | Fallback para provider nuvem; mensagem clara de erro |
| **Provider nuvem sem créditos** | Média | Alto | Alertas de budget; fallback para Ollama; modo read-only |
| **Limite de contexto** | Alta | Médio | Chunking de documentos; resumos progressivos; RAG eficiente |
| **Picos de carga** | Baixa | Alto | Rate limiting; queue de requisições; cache agressivo |
| **Dados sensíveis vazados** | Baixa | Crítico | Auditoria de prompts; não usar nuvem para docs confidenciais; disclaimers |
| **Dependência de biblioteca externa** | Baixa | Baixo | Providers abstraídos; fácil trocar implementação |

### 9.1 Plano de Rollback

**Cenário 1: Bug crítico no agente**
1. Desabilitar feature flag: `VITE_AGENT_ENABLED=false` no `.env`
2. Remover `<AgentDock />` do `App.tsx` temporariamente
3. Deploy de hotfix

**Cenário 2: Performance degradada**
1. Reduzir limites de rate (ex: 10 → 5 mensagens/hora)
2. Desabilitar modo autopilot por padrão
3. Otimizar prompts (reduzir tokens)

**Cenário 3: Custos excessivos (nuvem)**
1. Forçar todos os usuários para Ollama
2. Desabilitar features não-essenciais (ex: RAG)
3. Implementar hard cap por usuário

**Rollback completo:**
```bash
# Reverter commits relacionados ao agente
git revert <commit-hash-inicial>..<commit-hash-final>

# Remover arquivos do agente
rm -rf src/agent/

# Remover variáveis de .env
sed -i '/VITE_AI_/d' .env

# Rebuild
npm run build
```

---

## 10. Roadmap Incremental

### Fase 0: Prova de Conceito (MVP) — 4-6h
**Objetivo:** Dock básico + provider Ollama funcionando

- [ ] Criar estrutura `src/agent/`
- [ ] Implementar `EventBus` e `InternalAgent`
- [ ] Implementar `OllamaProvider`
- [ ] Criar UI básica `AgentDock` (sem drag)
- [ ] Integrar no `App.tsx`
- [ ] Emitir eventos básicos (upload, indexação)
- [ ] Teste smoke: enviar mensagem e receber resposta

**Resultado:** Usuário pode conversar com agente usando Ollama local.

---

### Fase 1: RAG + Eventos Reais — 6-8h
**Objetivo:** Agente responde com base no Data Lake

- [ ] Configurar pgvector no Supabase
- [ ] Gerar embeddings com bge-m3 (via Ollama)
- [ ] Implementar busca semântica
- [ ] Injetar contexto relevante no prompt
- [ ] Emitir eventos em pontos-chave do sistema
- [ ] Respostas proativas no modo autopilot

**Resultado:** Agente cita documentos reais ao responder.

---

### Fase 2: Roteamento + Guardrails — 4-6h
**Objetivo:** Inteligência na escolha de provider e validação

- [ ] Implementar `OpenAIProvider`
- [ ] Lógica de roteamento (local vs nuvem baseado em load/disponibilidade)
- [ ] Guardrails básicos (validação de output, detect injection)
- [ ] Rate limiting e backoff
- [ ] Cache de respostas comuns

**Resultado:** Sistema robusto que escolhe melhor provider e valida outputs.

---

### Fase 3: Streaming + Observabilidade — 6-8h
**Objetivo:** UX profissional e monitoramento

- [ ] Streaming SSE para respostas (aparecem token-por-token)
- [ ] Dashboard de métricas (Grafana ou custom)
- [ ] Logs estruturados (Winston ou Pino)
- [ ] Testes E2E com Playwright
- [ ] Documentação de API interna

**Resultado:** Experiência de produção com monitoramento completo.

---

### Fase 4: Autopilot Avançado + Auditoria — 4-6h
**Objetivo:** Agente realmente autônomo e auditável

- [ ] Policies de autopilot (quando agir, quando pedir permissão)
- [ ] Sistema de permissões (usuário pode aprovar ações)
- [ ] Limites configuráveis por usuário/organização
- [ ] Auditoria completa (quem, quando, qual ação, resultado)
- [ ] Interface de admin para revisar logs

**Resultado:** Agente pronto para produção enterprise.

---

## 11. Plano de Migração e Feature Flag

### 11.1 Introdução Gradual

**Etapa 1: Dev/Staging**
```env
# .env.development
VITE_AGENT_ENABLED=true
VITE_AI_PROVIDER=ollama
```

**Etapa 2: Beta (usuários selecionados)**
```typescript
// src/App.tsx
const isAgentEnabled = 
  import.meta.env.VITE_AGENT_ENABLED === 'true' || 
  betaUsers.includes(currentUserId);

{isAgentEnabled && <AgentDock />}
```

**Etapa 3: Produção (todos)**
```env
# .env.production
VITE_AGENT_ENABLED=true
```

### 11.2 Feature Flag Dinâmica (sem redeploy)

**Opção 1: Supabase Remote Config**
```typescript
// Buscar config do Supabase
const { data } = await supabase
  .from('feature_flags')
  .select('enabled')
  .eq('name', 'agent_dock')
  .single();

const isAgentEnabled = data?.enabled ?? false;
```

**Opção 2: LocalStorage (fallback)**
```typescript
// Para debugging local
const isAgentEnabled = 
  localStorage.getItem('agent_enabled') === 'true' ||
  import.meta.env.VITE_AGENT_ENABLED === 'true';
```

### 11.3 Comunicação ao Usuário

**Changelog:**
```markdown
## v2.0.0 — Agente IA Interno 🤖

**Novidade:** Apresentamos o Agente IA, seu assistente técnico inteligente!

- 💬 Converse naturalmente sobre seus documentos
- 🚀 Modo Autopilot: sugestões proativas automáticas
- 🔒 100% privado: funciona offline com Ollama
- ⚡ Respostas rápidas baseadas no seu Data Lake

Clique no ícone 💬 no canto inferior direito para começar!
```

**Tooltip no primeiro acesso:**
```typescript
const [hasSeenAgentIntro, setHasSeenAgentIntro] = useState(false);

useEffect(() => {
  const seen = localStorage.getItem('agent_intro_seen');
  if (!seen) {
    // Mostrar tooltip/modal explicativo
    setShowIntro(true);
    localStorage.setItem('agent_intro_seen', 'true');
  }
}, []);
```

---

## 12. Checklist de Implementação (Para Próxima Tarefa)

Após aprovação deste ADR, seguir esta checklist passo-a-passo:

### Setup Inicial
- [ ] Criar diretório `docs/adr/` e salvar este ADR
- [ ] Criar estrutura `src/agent/` com subpastas
- [ ] Adicionar variáveis de ambiente no `.env`
- [ ] Configurar alias `@/agent` no `tsconfig.json` (se necessário)

### Core do Agente
- [ ] Implementar `src/agent/core/eventBus.ts`
- [ ] Implementar `src/agent/core/types.ts`
- [ ] Implementar `src/agent/core/InternalAgent.ts`
- [ ] Escrever testes unitários básicos (opcional fase 0)

### Providers
- [ ] Implementar `src/agent/providers/BaseProvider.ts`
- [ ] Implementar `src/agent/providers/OllamaProvider.ts`
- [ ] Implementar `src/agent/providers/OpenAIProvider.ts`
- [ ] Testar conectividade de cada provider

### UI
- [ ] Implementar `src/agent/ui/AgentDock.tsx`
- [ ] Implementar `src/agent/ui/ChatMessage.tsx` (opcional, pode ser inline)
- [ ] Adicionar estilos responsivos e animações
- [ ] Testar UI em mobile e desktop

### Integração no Sistema
- [ ] Adicionar `<AgentDock />` no `App.tsx`
- [ ] Adicionar lógica de inicialização do agente no `App.tsx`
- [ ] Emitir evento `DL_ITEM_UPLOADED` em `UploadForm.tsx`
- [ ] Emitir evento `DOCS_INDEXED` em `knowledgeProcessor.ts`
- [ ] Emitir evento `PROCESSING_ERROR` onde relevante

### Testes e Validação
- [ ] Smoke test: abrir dock e enviar mensagem
- [ ] Testar modo passivo vs autopilot
- [ ] Testar troca de provider (Ollama ↔ OpenAI)
- [ ] Testar eventos proativos (upload, indexação)
- [ ] Verificar logs no console (sem erros críticos)

### Documentação
- [ ] Atualizar README com seção sobre Agente IA
- [ ] Documentar variáveis de ambiente
- [ ] Criar guia de usuário (como usar o agente)
- [ ] Documentar APIs internas para desenvolvedores

### Refinamento (Opcional Fase 0)
- [ ] Adicionar persistência de histórico (localStorage)
- [ ] Melhorar prompts e system message
- [ ] Adicionar indicador de status do provider
- [ ] Implementar retry automático em caso de erro

---

## 13. Sumário dos Próximos Passos

### Após Aprovação do ADR

1. **Revisão e ajustes:** Discutir pontos de dúvida ou mudanças necessárias no plano
2. **Priorização de fases:** Confirmar que começaremos pela Fase 0 (MVP)
3. **Setup de ambiente:** Garantir que Ollama está instalado e funcionando localmente
4. **Kickoff da implementação:** Criar tarefa/issue com esta checklist
5. **Desenvolvimento incremental:** Seguir roadmap fase por fase, com reviews entre cada uma

### Expectativa de Timeline

- **Fase 0 (MVP):** 1-2 dias de desenvolvimento
- **Fase 1 (RAG):** 2-3 dias adicionais
- **Fase 2 (Roteamento):** 1-2 dias
- **Fase 3 (Streaming):** 2-3 dias
- **Fase 4 (Autopilot avançado):** 2-3 dias

**Total estimado:** 2-3 semanas para implementação completa e madura.

### Critério de Sucesso Geral

✅ O agente está integrado e funcional  
✅ Usuários conseguem conversar e obter respostas relevantes  
✅ Eventos do sistema disparam ações proativas  
✅ Sistema é robusto e não quebra o fluxo existente  
✅ Performance e custos estão dentro do esperado  

---

## Apêndices

### A. Referências Técnicas

- Ollama API: https://github.com/ollama/ollama/blob/main/docs/api.md
- OpenAI Chat Completions: https://platform.openai.com/docs/api-reference/chat
- Groq API: https://console.groq.com/docs/quickstart
- pgvector: https://github.com/pgvector/pgvector
- BGE-M3 embeddings: https://huggingface.co/BAAI/bge-m3

### B. Modelos LLM Recomendados

**Local (Ollama):**
- `llama3.1:8b` — 8B params, rápido, equilibrado
- `qwen2.5:14b` — 14B params, melhor qualidade, mais VRAM
- `mistral:7b` — 7B params, muito rápido, boa qualidade

**Nuvem (Groq - gratuito com limites):**
- `llama-3.1-70b-versatile` — 70B params, excelente qualidade
- `mixtral-8x7b-32768` — 47B params, contexto longo (32k)

**Nuvem (Together - pago):**
- `meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo` — rápido
- `mistralai/Mixtral-8x7B-Instruct-v0.1` — contexto longo

### C. Prompts de Sistema (Templates)

```typescript
export const SYSTEM_PROMPTS = {
  default: `Você é um assistente especializado em documentos técnicos de engenharia civil e mineração.
Você tem acesso a um Data Lake de documentos e pode ajudar com análises, consultas e geração de relatórios.
Seja conciso, técnico e sempre cite fontes quando relevante.`,

  proactive: `Você é um assistente proativo que monitora eventos do sistema e oferece sugestões úteis.
Ao detectar uploads, indexações ou erros, forneça insights acionáveis de forma breve e clara.
Use emojis para tornar suas sugestões mais amigáveis (📄, ✅, ⚠️, 💡).`,

  rag: `Você tem acesso ao conteúdo de documentos técnicos através de busca semântica.
Ao responder, sempre cite as fontes usando o formato: [Fonte: nome_do_documento.pdf].
Se não houver informação relevante no Data Lake, seja honesto e sugira onde buscar.`,
};
```

### D. Estrutura de Testes (Sugestão)

```typescript
// tests/agent/InternalAgent.test.ts
import { describe, it, expect } from 'vitest';
import { InternalAgent } from '@/agent/core/InternalAgent';
import { OllamaProvider } from '@/agent/providers/OllamaProvider';

describe('InternalAgent', () => {
  it('should initialize with provider', () => {
    const provider = new OllamaProvider('llama3.1:8b');
    const agent = new InternalAgent(provider);
    expect(agent).toBeDefined();
  });

  it('should send message and get response', async () => {
    const provider = new OllamaProvider('llama3.1:8b');
    const agent = new InternalAgent(provider);
    const response = await agent.sendMessage('Olá');
    expect(response).toBeTruthy();
    expect(typeof response).toBe('string');
  });

  it('should maintain history', async () => {
    const provider = new OllamaProvider('llama3.1:8b');
    const agent = new InternalAgent(provider);
    await agent.sendMessage('Primeira mensagem');
    await agent.sendMessage('Segunda mensagem');
    const history = agent.getHistory();
    expect(history.length).toBeGreaterThanOrEqual(4); // 2 user + 2 assistant
  });
});
```

---

**Fim do ADR-001**

**Próxima ação:** Aguardar aprovação e feedback para iniciar implementação da Fase 0 (MVP).
