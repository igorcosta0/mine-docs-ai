import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  X, 
  Minimize2, 
  Maximize2,
  Settings, 
  Brain,
  Wifi,
  WifiOff,
  Bell,
  BellOff,
  Sparkles,
  Bot
} from 'lucide-react';
import { AgentChat, ChatMessage } from './AgentChat';
import { ModelSelector } from './ModelSelector';
import { eventBus } from '@/lib/eventBus';
import { aiSpecialist } from '@/lib/aiSpecialist';
import { toast } from 'sonner';

type AgentMode = 'passive' | 'proactive';

export function AgentDock() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Settings
  const [mode, setMode] = useState<AgentMode>('passive');
  const [useOllama, setUseOllama] = useState(false);
  const [selectedModel, setSelectedModel] = useState('llama3');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    // Escutar eventos do sistema
    const handleUpload = (payload: any) => {
      if (mode === 'proactive') {
        const suggestion = `📄 Detectei ${payload.count} novo(s) documento(s): "${payload.title}". Quer que eu analise e sugira tags/categorias?`;
        addSystemMessage(suggestion, { event: 'upload', ...payload });
        
        if (notificationsEnabled && !isOpen) {
          setUnreadCount(prev => prev + 1);
          toast.info('Agente IA', {
            description: `Novo documento detectado: ${payload.title}`,
          });
        }
      }
    };

    const handleIndexed = (payload: any) => {
      if (mode === 'proactive') {
        const suggestion = `✅ ${payload.count} documento(s) indexado(s) com sucesso. Quer um resumo do conhecimento extraído?`;
        addSystemMessage(suggestion, { event: 'indexed', ...payload });
        
        if (notificationsEnabled && !isOpen) {
          setUnreadCount(prev => prev + 1);
        }
      }
    };

    const handleError = (payload: any) => {
      const errorMsg = `⚠️ Erro detectado: ${payload.error}. Precisa de ajuda para diagnosticar?`;
      addSystemMessage(errorMsg, { event: 'error', ...payload });
      
      if (notificationsEnabled && !isOpen) {
        setUnreadCount(prev => prev + 1);
        toast.error('Erro no Sistema', {
          description: payload.error,
        });
      }
    };

    const handleDuplicate = (payload: any) => {
      if (mode === 'proactive') {
        const msg = `🔄 Duplicata detectada: "${payload.fileName}" já existe como "${payload.existingFile}"`;
        addSystemMessage(msg, { event: 'duplicate', ...payload });
        
        if (notificationsEnabled && !isOpen) {
          setUnreadCount(prev => prev + 1);
        }
      }
    };

    eventBus.on('DL_ITEM_UPLOADED', handleUpload);
    eventBus.on('DOCS_INDEXED', handleIndexed);
    eventBus.on('PROCESSING_ERROR', handleError);
    eventBus.on('DUPLICATE_DETECTED', handleDuplicate);

    return () => {
      eventBus.off('DL_ITEM_UPLOADED', handleUpload);
      eventBus.off('DOCS_INDEXED', handleIndexed);
      eventBus.off('PROCESSING_ERROR', handleError);
      eventBus.off('DUPLICATE_DETECTED', handleDuplicate);
    };
  }, [mode, notificationsEnabled, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const addSystemMessage = (content: string, metadata?: any) => {
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      metadata
    };
    
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async (userMessage: string) => {
    // Adicionar mensagem do usuário
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    eventBus.emit('USER_MESSAGE', { message: userMessage });
    
    setLoading(true);
    
    try {
      // Consultar o especialista IA
      const result = await aiSpecialist.consultSpecialist(userMessage, undefined, useOllama);
      
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.consultation.specialist_response,
        timestamp: new Date(),
        metadata: {
          confidence: result.consultation.confidence_level,
          sources: result.consultation.knowledge_sources.length
        }
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      eventBus.emit('AGENT_RESPONSE', { message: assistantMsg.content });
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Desculpe, ocorreu um erro ao processar sua mensagem: ${(error as Error).message}`,
        timestamp: new Date(),
        metadata: { error: true }
      };
      
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    toast.success('Histórico de conversa limpo');
  };

  // Botão flutuante (minimizado)
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center group"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 bg-red-500 text-white animate-pulse"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
        <div className="absolute -top-12 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-popover text-popover-foreground px-3 py-1 rounded-md text-sm whitespace-nowrap shadow-lg">
            Assistente IA
          </div>
        </div>
      </button>
    );
  }

  // Versão minimizada (barra)
  if (isMinimized) {
    return (
      <Card className="fixed bottom-6 right-6 z-50 shadow-xl w-80">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span className="font-semibold">Assistente IA</span>
            {mode === 'proactive' && (
              <Badge variant="secondary" className="text-xs">
                <Bell className="h-3 w-3 mr-1" />
                Proativo
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsMinimized(false)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Versão completa (expandida)
  return (
    <Card className="fixed bottom-6 right-6 z-50 shadow-2xl w-[400px] h-[600px] flex flex-col">
      <CardHeader className="border-b shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Assistente IA</CardTitle>
            {useOllama ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <WifiOff className="h-3 w-3" />
                Offline
              </Badge>
            ) : (
              <Badge variant="default" className="flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                Online
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsMinimized(true)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
        <div className="shrink-0 flex gap-2 px-4 py-2 border-b">
          <Button 
            variant="ghost" 
            size="sm"
            className="flex-1"
            onClick={() => {/* Already on chat */}}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            Chat
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="flex-1"
            onClick={() => {/* Settings modal could go here */}}
          >
            <Settings className="h-4 w-4 mr-1" />
            Config
          </Button>
        </div>

        <TabsContent value="chat" className="flex-1 m-0 min-h-0">
          <AgentChat
            messages={messages}
            onSendMessage={handleSendMessage}
            loading={loading}
            placeholder="Pergunte sobre seus documentos..."
          />
        </TabsContent>

        {/* Config Panel (inline) */}
        <div className="border-t p-3 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <Label htmlFor="mode-proactive" className="cursor-pointer">
              Modo Proativo
            </Label>
            <Switch
              id="mode-proactive"
              checked={mode === 'proactive'}
              onCheckedChange={(checked) => 
                setMode(checked ? 'proactive' : 'passive')
              }
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <Label htmlFor="ollama-mode" className="cursor-pointer">
              Offline (Ollama)
            </Label>
            <Switch
              id="ollama-mode"
              checked={useOllama}
              onCheckedChange={setUseOllama}
            />
          </div>
          {useOllama && (
            <div className="pt-2 border-t">
              <ModelSelector 
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                showPerformance={false}
                compact={true}
              />
            </div>
          )}
        </div>
      </Tabs>
    </Card>
  );
}
