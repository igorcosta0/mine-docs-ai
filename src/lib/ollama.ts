export interface OllamaModel {
  name: string;
  displayName: string;
  description: string;
  size?: string;
}

export interface OllamaPerformanceMetrics {
  model: string;
  responseTime: number; // ms
  tokensPerSecond?: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export const AVAILABLE_MODELS: OllamaModel[] = [
  {
    name: "llama3",
    displayName: "Llama 3",
    description: "Meta's Llama 3 - Rápido e eficiente",
    size: "4.7GB"
  },
  {
    name: "qwen2.5:14b",
    displayName: "Qwen 2.5 (14B)",
    description: "Alibaba's Qwen 2.5 - Otimizado para tarefas complexas",
    size: "9GB"
  },
  {
    name: "qwen2.5:7b",
    displayName: "Qwen 2.5 (7B)",
    description: "Versão menor e mais rápida do Qwen",
    size: "4.7GB"
  }
];

// Performance tracking in memory
const performanceHistory: OllamaPerformanceMetrics[] = [];
const MAX_HISTORY = 100;

export function getPerformanceMetrics(model?: string): OllamaPerformanceMetrics[] {
  if (model) {
    return performanceHistory.filter(m => m.model === model).slice(-20);
  }
  return performanceHistory.slice(-50);
}

export function getAveragePerformance(model: string): {
  avgResponseTime: number;
  avgTokensPerSecond: number;
  successRate: number;
} {
  const metrics = performanceHistory.filter(m => m.model === model && m.success);
  
  if (metrics.length === 0) {
    return { avgResponseTime: 0, avgTokensPerSecond: 0, successRate: 0 };
  }

  const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
  const avgTokensPerSecond = metrics
    .filter(m => m.tokensPerSecond)
    .reduce((sum, m) => sum + (m.tokensPerSecond || 0), 0) / metrics.length;
  
  const totalAttempts = performanceHistory.filter(m => m.model === model).length;
  const successRate = (metrics.length / totalAttempts) * 100;

  return { avgResponseTime, avgTokensPerSecond, successRate };
}

export async function generateWithOllama(
  model: string, 
  prompt: string,
  trackPerformance = true
): Promise<string> {
  const url = "http://localhost:11434/api/generate";
  const startTime = Date.now();
  
  const body = {
    model: model || "llama3",
    prompt,
    stream: false,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      const error = `Ollama erro ${res.status}: ${txt}`;
      
      if (trackPerformance) {
        performanceHistory.push({
          model,
          responseTime: Date.now() - startTime,
          timestamp: new Date(),
          success: false,
          error
        });
        if (performanceHistory.length > MAX_HISTORY) {
          performanceHistory.shift();
        }
      }
      
      throw new Error(error);
    }

    const data = await res.json();
    const responseTime = Date.now() - startTime;
    
    if (trackPerformance) {
      // Calculate tokens per second if available
      const tokensPerSecond = data.eval_count && data.eval_duration 
        ? (data.eval_count / (data.eval_duration / 1e9)) 
        : undefined;

      performanceHistory.push({
        model,
        responseTime,
        tokensPerSecond,
        timestamp: new Date(),
        success: true
      });
      
      if (performanceHistory.length > MAX_HISTORY) {
        performanceHistory.shift();
      }
    }
    
    return data.response || "";
  } catch (err: any) {
    const responseTime = Date.now() - startTime;
    
    if (trackPerformance) {
      performanceHistory.push({
        model,
        responseTime,
        timestamp: new Date(),
        success: false,
        error: err?.message || String(err)
      });
      if (performanceHistory.length > MAX_HISTORY) {
        performanceHistory.shift();
      }
    }
    
    throw new Error(
      `Falha ao conectar ao Ollama. Verifique se está rodando em http://localhost:11434 e configure CORS: OLLAMA_ORIGINS=*. Detalhe: ${err?.message || err}`
    );
  }
}

export async function checkOllama(): Promise<boolean> {
  try {
    const res = await fetch("http://localhost:11434/api/tags");
    return res.ok;
  } catch {
    return false;
  }
}

export async function listAvailableModels(): Promise<string[]> {
  try {
    const res = await fetch("http://localhost:11434/api/tags");
    if (!res.ok) return [];
    
    const data = await res.json();
    return data.models?.map((m: any) => m.name) || [];
  } catch {
    return [];
  }
}
