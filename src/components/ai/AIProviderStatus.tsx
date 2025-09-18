import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, RefreshCw, Bot, Cloud, Server } from 'lucide-react';
import { aiProvider } from '@/lib/aiProvider';
import { AIProviderToggle } from './AIProviderToggle';

interface ProviderStatus {
  provider: string;
  available: boolean;
  models?: string[];
}

export const AIProviderStatus: React.FC = () => {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [loading, setLoading] = useState(false);

  const checkProviders = async () => {
    setLoading(true);
    try {
      const status = await aiProvider.getAvailableProviders();
      setProviders(status);
    } catch (error) {
      console.error('Erro ao verificar providers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkProviders();
  }, []);

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'ollama':
        return <Server className="w-4 h-4" />;
      case 'openai':
        return <Cloud className="w-4 h-4" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  const getProviderDescription = (provider: string) => {
    switch (provider) {
      case 'ollama':
        return 'IA Local - Funciona offline e é gratuita';
      case 'openai':
        return 'OpenAI API - Requer conexão e créditos';
      default:
        return 'Provedor de IA';
    }
  };

  const availableProviders = providers.filter(p => p.available);
  const unavailableProviders = providers.filter(p => !p.available);

  return (
    <div className="space-y-6">
      <AIProviderToggle />
      
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="w-5 h-5" />
            Status dos Provedores de IA
          </CardTitle>
          <Button 
            onClick={checkProviders}
            disabled={loading}
            size="sm"
            variant="outline"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Atualizar
          </Button>
        </CardHeader>
      <CardContent className="space-y-4">
        {availableProviders.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Disponíveis ({availableProviders.length})
            </h4>
            {availableProviders.map((provider) => (
              <div 
                key={provider.provider}
                className="flex items-start justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
              >
                <div className="flex items-start gap-3">
                  {getProviderIcon(provider.provider)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">
                        {provider.provider === 'ollama' ? 'Ollama (Local)' : 
                         provider.provider === 'openai' ? 'OpenAI' : provider.provider}
                      </span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Ativo
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getProviderDescription(provider.provider)}
                    </p>
                    {provider.models && provider.models.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {provider.models.slice(0, 3).map((model) => (
                          <Badge key={model} variant="outline" className="text-xs">
                            {model}
                          </Badge>
                        ))}
                        {provider.models.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{provider.models.length - 3} modelos
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {unavailableProviders.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-orange-700 dark:text-orange-400 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Indisponíveis ({unavailableProviders.length})
            </h4>
            {unavailableProviders.map((provider) => (
              <div 
                key={provider.provider}
                className="flex items-start justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
              >
                <div className="flex items-start gap-3">
                  {getProviderIcon(provider.provider)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize opacity-60">
                        {provider.provider === 'ollama' ? 'Ollama (Local)' : 
                         provider.provider === 'openai' ? 'OpenAI' : provider.provider}
                      </span>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        Inativo
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {provider.provider === 'ollama' 
                        ? 'Execute: ollama serve'
                        : 'Configure a chave da API'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {availableProviders.length === 0 && unavailableProviders.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Verificando provedores de IA...</p>
          </div>
        )}

        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Sistema Híbrido:</strong> Use o seletor acima para escolher um provedor específico
            ou deixe no automático para detecção inteligente.
          </p>
        </div>
      </CardContent>
      </Card>
    </div>
  );
};