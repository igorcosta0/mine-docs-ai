import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Server, Cloud, Zap } from 'lucide-react';
import { aiProvider, AIProvider } from '@/lib/aiProvider';
import { toast } from '@/hooks/use-toast';

export const AIProviderToggle: React.FC = () => {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('auto');
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Carrega preferência atual
    const preferred = aiProvider.getPreferredProvider();
    setSelectedProvider(preferred);
    
    // Carrega status dos provedores
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const status = await aiProvider.getAvailableProviders();
      setProviders(status);
    } catch (error) {
      console.error('Erro ao carregar provedores:', error);
    }
  };

  const handleProviderChange = async (provider: AIProvider) => {
    setLoading(true);
    try {
      // Testa se o provedor está disponível (exceto para 'auto')
      if (provider !== 'auto') {
        const providerStatus = providers.find(p => p.provider === provider);
        if (!providerStatus?.available) {
          toast({
            title: "Provedor indisponível",
            description: `${provider === 'ollama' ? 'Ollama não está rodando' : 'OpenAI não configurado'}`,
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      }

      aiProvider.setPreferredProvider(provider);
      setSelectedProvider(provider);
      
      toast({
        title: "Provedor alterado",
        description: `Agora usando: ${getProviderName(provider)}`,
      });
      
      await loadProviders();
    } catch (error) {
      console.error('Erro ao alternar provedor:', error);
      toast({
        title: "Erro",
        description: "Falha ao alternar provedor de IA",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getProviderName = (provider: AIProvider) => {
    switch (provider) {
      case 'ollama': return 'Ollama (Local)';
      case 'openai': return 'OpenAI';
      case 'auto': return 'Automático';
      default: return provider;
    }
  };

  const getProviderIcon = (provider: AIProvider) => {
    switch (provider) {
      case 'ollama':
        return <Server className="w-4 h-4" />;
      case 'openai':
        return <Cloud className="w-4 h-4" />;
      case 'auto':
        return <Zap className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getProviderStatus = (provider: AIProvider) => {
    if (provider === 'auto') return 'available';
    const providerData = providers.find(p => p.provider === provider);
    return providerData?.available ? 'available' : 'unavailable';
  };

  const providerOptions: AIProvider[] = ['auto', 'ollama', 'openai'];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="w-5 h-5" />
          Seletor de Provedor de IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {providerOptions.map((provider) => {
            const isSelected = selectedProvider === provider;
            const status = getProviderStatus(provider);
            const isAvailable = status === 'available';
            
            return (
              <div
                key={provider}
                className={`
                  relative p-4 rounded-lg border-2 transition-all cursor-pointer
                  ${isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                  }
                  ${!isAvailable && provider !== 'auto' ? 'opacity-60' : ''}
                `}
                onClick={() => !loading && handleProviderChange(provider)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getProviderIcon(provider)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {getProviderName(provider)}
                        </span>
                        {isSelected && (
                          <Badge variant="default" className="text-xs">
                            Selecionado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {provider === 'auto' && 'Detecta automaticamente o melhor provedor'}
                        {provider === 'ollama' && 'IA local, gratuita e offline'}
                        {provider === 'openai' && 'IA em nuvem, requer API key'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {provider !== 'auto' && (
                      <Badge 
                        variant={isAvailable ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        {isAvailable ? 'Disponível' : 'Indisponível'}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      disabled={loading || (!isAvailable && provider !== 'auto')}
                    >
                      {isSelected ? 'Selecionado' : 'Selecionar'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Dica:</strong> Use "Automático" para alternar dinamicamente entre provedores,
            ou selecione um provedor específico para forçar seu uso.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};