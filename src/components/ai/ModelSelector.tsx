import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  AVAILABLE_MODELS, 
  getAveragePerformance,
  listAvailableModels,
  type OllamaModel 
} from '@/lib/ollama';
import { Zap, Clock, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  showPerformance?: boolean;
  compact?: boolean;
}

export function ModelSelector({ 
  selectedModel, 
  onModelChange, 
  showPerformance = true,
  compact = false 
}: ModelSelectorProps) {
  const [installedModels, setInstalledModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkInstalledModels();
  }, []);

  const checkInstalledModels = async () => {
    setLoading(false);
    try {
      const models = await listAvailableModels();
      setInstalledModels(models);
    } catch (error) {
      console.error('Error checking installed models:', error);
    } finally {
      setLoading(false);
    }
  };

  const isModelInstalled = (modelName: string) => {
    return installedModels.some(installed => 
      installed.includes(modelName) || modelName.includes(installed)
    );
  };

  const selectedModelInfo = AVAILABLE_MODELS.find(m => m.name === selectedModel);
  const performance = showPerformance ? getAveragePerformance(selectedModel) : null;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Label className="text-sm">Modelo:</Label>
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_MODELS.map((model) => (
              <SelectItem key={model.name} value={model.name}>
                {model.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">🤖 Modelo LLM</Label>
          {loading && (
            <Badge variant="outline" className="text-xs">
              Verificando...
            </Badge>
          )}
        </div>
        
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_MODELS.map((model) => {
              const installed = isModelInstalled(model.name);
              return (
                <SelectItem 
                  key={model.name} 
                  value={model.name}
                  disabled={!loading && !installed}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {installed ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-yellow-500" />
                      )}
                      <span>{model.displayName}</span>
                    </div>
                    {model.size && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {model.size}
                      </span>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {selectedModelInfo && (
          <p className="text-xs text-muted-foreground">
            {selectedModelInfo.description}
          </p>
        )}
      </div>

      {showPerformance && performance && performance.avgResponseTime > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <Label className="text-sm font-medium">📊 Performance Média</Label>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-muted/50 rounded-md">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <Clock className="h-3 w-3" />
                Tempo
              </div>
              <div className="text-sm font-bold">
                {(performance.avgResponseTime / 1000).toFixed(1)}s
              </div>
            </div>
            
            {performance.avgTokensPerSecond > 0 && (
              <div className="text-center p-2 bg-muted/50 rounded-md">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                  <Zap className="h-3 w-3" />
                  Tokens/s
                </div>
                <div className="text-sm font-bold">
                  {performance.avgTokensPerSecond.toFixed(0)}
                </div>
              </div>
            )}
            
            <div className="text-center p-2 bg-muted/50 rounded-md">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <TrendingUp className="h-3 w-3" />
                Taxa
              </div>
              <div className="text-sm font-bold">
                {performance.successRate.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !isModelInstalled(selectedModel) && (
        <div className="p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-xs">
          <AlertCircle className="h-4 w-4 text-yellow-500 inline mr-1" />
          Modelo não instalado. Execute: <code className="bg-muted px-1 py-0.5 rounded">ollama pull {selectedModel}</code>
        </div>
      )}
    </Card>
  );
}
