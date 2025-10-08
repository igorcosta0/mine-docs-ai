import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getPerformanceMetrics, AVAILABLE_MODELS } from '@/lib/ollama';
import { 
  BarChart3, 
  Clock, 
  Zap, 
  TrendingUp,
  Award,
  Activity
} from 'lucide-react';

interface ModelComparison {
  model: string;
  displayName: string;
  avgResponseTime: number;
  avgTokensPerSecond: number;
  successRate: number;
  totalTests: number;
}

export function PerformanceComparison() {
  const [comparisons, setComparisons] = React.useState<ModelComparison[]>([]);

  React.useEffect(() => {
    updateComparisons();
    
    // Atualizar a cada 5 segundos
    const interval = setInterval(updateComparisons, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateComparisons = () => {
    const data: ModelComparison[] = AVAILABLE_MODELS.map(model => {
      const metrics = getPerformanceMetrics(model.name);
      const successfulMetrics = metrics.filter(m => m.success);
      
      const avgResponseTime = successfulMetrics.length > 0
        ? successfulMetrics.reduce((sum, m) => sum + m.responseTime, 0) / successfulMetrics.length
        : 0;
      
      const avgTokensPerSecond = successfulMetrics.length > 0
        ? successfulMetrics
            .filter(m => m.tokensPerSecond)
            .reduce((sum, m) => sum + (m.tokensPerSecond || 0), 0) / 
            successfulMetrics.filter(m => m.tokensPerSecond).length
        : 0;
      
      const successRate = metrics.length > 0
        ? (successfulMetrics.length / metrics.length) * 100
        : 0;

      return {
        model: model.name,
        displayName: model.displayName,
        avgResponseTime,
        avgTokensPerSecond,
        successRate,
        totalTests: metrics.length
      };
    }).filter(c => c.totalTests > 0);

    setComparisons(data);
  };

  if (comparisons.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Comparação de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Execute alguns testes com diferentes modelos para visualizar a comparação de performance.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Determinar o melhor modelo em cada categoria
  const fastestModel = comparisons.reduce((prev, curr) => 
    curr.avgResponseTime < prev.avgResponseTime ? curr : prev
  );
  
  const mostThroughput = comparisons.reduce((prev, curr) => 
    curr.avgTokensPerSecond > prev.avgTokensPerSecond ? curr : prev
  );

  const mostReliable = comparisons.reduce((prev, curr) => 
    curr.successRate > prev.successRate ? curr : prev
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Comparação de Performance dos Modelos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Baseado em {comparisons.reduce((sum, c) => sum + c.totalTests, 0)} testes executados
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Clock className="h-3 w-3" />
              Mais Rápido
            </div>
            <div className="font-semibold text-sm">{fastestModel.displayName}</div>
            <div className="text-xs text-muted-foreground">
              {(fastestModel.avgResponseTime / 1000).toFixed(2)}s
            </div>
          </div>

          <div className="p-3 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Zap className="h-3 w-3" />
              Maior Throughput
            </div>
            <div className="font-semibold text-sm">{mostThroughput.displayName}</div>
            <div className="text-xs text-muted-foreground">
              {mostThroughput.avgTokensPerSecond.toFixed(0)} tok/s
            </div>
          </div>

          <div className="p-3 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              Mais Confiável
            </div>
            <div className="font-semibold text-sm">{mostReliable.displayName}</div>
            <div className="text-xs text-muted-foreground">
              {mostReliable.successRate.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Detailed Comparison */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Comparação Detalhada</h4>
          {comparisons.map((comparison) => (
            <div 
              key={comparison.model}
              className="p-4 border rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{comparison.displayName}</span>
                </div>
                <Badge variant="outline">
                  {comparison.totalTests} testes
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Tempo Médio</div>
                  <div className="font-semibold flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {(comparison.avgResponseTime / 1000).toFixed(2)}s
                  </div>
                  {comparison.model === fastestModel.model && (
                    <Award className="h-3 w-3 text-yellow-500 mt-1" />
                  )}
                </div>

                {comparison.avgTokensPerSecond > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Tokens/s</div>
                    <div className="font-semibold flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {comparison.avgTokensPerSecond.toFixed(0)}
                    </div>
                    {comparison.model === mostThroughput.model && (
                      <Award className="h-3 w-3 text-yellow-500 mt-1" />
                    )}
                  </div>
                )}

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Taxa Sucesso</div>
                  <div className="font-semibold flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {comparison.successRate.toFixed(0)}%
                  </div>
                  {comparison.model === mostReliable.model && (
                    <Award className="h-3 w-3 text-yellow-500 mt-1" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
