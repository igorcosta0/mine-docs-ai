import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Server, Cloud, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { aiProvider } from '@/lib/aiProvider';

export const AIActiveIndicator: React.FC = () => {
  const [activeProvider, setActiveProvider] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const checkActiveProvider = async () => {
    try {
      const providers = await aiProvider.getAvailableProviders();
      const available = providers.find(p => p.available);
      setActiveProvider(available?.provider || '');
    } catch (error) {
      console.error('Erro ao verificar provedor ativo:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkActiveProvider();
  }, []);

  const getProviderInfo = (provider: string) => {
    switch (provider) {
      case 'ollama':
        return {
          name: 'Ollama',
          description: 'IA Local',
          icon: <Server className="w-4 h-4" />,
          color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
        };
      case 'openai':
        return {
          name: 'OpenAI',
          description: 'IA Remota',
          icon: <Cloud className="w-4 h-4" />,
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
        };
      default:
        return {
          name: 'Indisponível',
          description: 'Nenhuma IA ativa',
          icon: <Bot className="w-4 h-4" />,
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
        };
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Verificando IA...</p>
                <p className="text-xs text-muted-foreground">Aguarde</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const providerInfo = getProviderInfo(activeProvider);

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {providerInfo.icon}
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">IA Ativa:</p>
                <Badge variant="secondary" className={providerInfo.color}>
                  {providerInfo.name}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{providerInfo.description}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/ai-status" className="flex items-center gap-1">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Configurar</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};