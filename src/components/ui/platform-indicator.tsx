import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Cloud, Server, Zap, Github } from 'lucide-react';
import { detectPlatform, getPlatformConfig, getChangesBehavior, type PlatformInfo } from '@/lib/platformUtils';

export const PlatformIndicator: React.FC = () => {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo | null>(null);

  useEffect(() => {
    setPlatformInfo(detectPlatform());
  }, []);

  if (!platformInfo) return null;

  const getPlatformDisplayConfig = () => {
    if (!platformInfo) return null;
    
    const config = getPlatformConfig(platformInfo.platform);
    
    switch (platformInfo.platform) {
      case 'bolt':
        return {
          ...config,
          textColor: 'text-blue-700 dark:text-blue-300',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          icon: <Zap className="w-4 h-4" />
        };
      case 'lovable':
        return {
          ...config,
          textColor: 'text-purple-700 dark:text-purple-300',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          borderColor: 'border-purple-200 dark:border-purple-800',
          icon: <Cloud className="w-4 h-4" />
        };
      case 'local':
        return {
          ...config,
          textColor: 'text-green-700 dark:text-green-300',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          icon: <Server className="w-4 h-4" />
        };
      default:
        return {
          ...config,
          textColor: 'text-gray-700 dark:text-gray-300',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          icon: <Server className="w-4 h-4" />
        };
    }
  };

  const config = getPlatformDisplayConfig();

  return (
    <Card className={`fixed top-4 right-4 z-50 w-64 ${config.bgColor} ${config.borderColor}`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          {config.icon}
          <span className="font-medium">{config.name}</span>
          <Badge 
            className={`${config.color} text-white text-xs`}
            variant="secondary"
          >
            {platformInfo.environment === 'development' ? 'DEV' : 'PROD'}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground mb-2">
          {config.description}
        </p>

        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span>IA:</span>
            <Badge variant="outline" className="text-xs">
              {platformInfo.aiCapabilities.recommendedProvider === 'hybrid' ? '🔄 Híbrido' :
               platformInfo.aiCapabilities.recommendedProvider === 'cloud-only' ? '☁️ Nuvem' : '💻 Local'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Hot Reload:</span>
            <Badge variant="outline" className="text-xs">
              {platformInfo.environment === 'development' ? '✅ Ativo' : '❌ Inativo'}
            </Badge>
          </div>
          
          {platformInfo.isLovable && (
            <div className="flex items-center justify-between">
              <span>GitHub Sync:</span>
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Github className="w-3 h-3" />
                Ativo
              </Badge>
            </div>
          )}
        </div>

        {platformInfo.isBolt && (
          <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-xs">
            <div className="font-medium mb-1">🚀 Bolt.new detectado!</div>
            <div>{getChangesBehavior(platformInfo)}</div>
            <div className="mt-1 text-blue-600 dark:text-blue-400">
              • IA usa OpenAI automaticamente<br/>
              • Não precisa configurar Ollama local
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};