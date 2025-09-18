import { generateWithOllama, checkOllama } from "./ollama";
import { supabase } from "@/integrations/supabase/client";

export type AIProvider = 'ollama' | 'openai' | 'claude' | 'auto';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

class AIProviderManager {
  private defaultConfig: AIConfig = {
    provider: 'auto',
    model: 'llama3',
    temperature: 0.7,
    maxTokens: 2000
  };

  async generateText(prompt: string, config?: Partial<AIConfig>): Promise<string> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    try {
      // Auto-detect melhor provider disponível
      if (finalConfig.provider === 'auto') {
        finalConfig.provider = await this.detectBestProvider();
      }

      switch (finalConfig.provider) {
        case 'ollama':
          return await this.generateWithOllama(prompt, finalConfig);
        
        case 'openai':
          return await this.generateWithOpenAI(prompt, finalConfig);
        
        case 'claude':
          return await this.generateWithClaude(prompt, finalConfig);
        
        default:
          throw new Error(`Provider não suportado: ${finalConfig.provider}`);
      }
    } catch (error) {
      console.error(`Erro com provider ${finalConfig.provider}:`, error);
      
      // Fallback para outro provider
      return await this.fallbackGenerate(prompt, finalConfig);
    }
  }

  private async detectBestProvider(): Promise<AIProvider> {
    // Tenta Ollama primeiro (local, gratuito)
    if (await checkOllama()) {
      return 'ollama';
    }

    // Verifica se tem API keys configuradas
    try {
      const { data } = await supabase.functions.invoke('check-ai-availability');
      if (data?.openai) return 'openai';
      if (data?.claude) return 'claude';
    } catch (error) {
      console.warn('Erro ao verificar APIs externas:', error);
    }

    // Default para Ollama se nada mais estiver disponível
    return 'ollama';
  }

  private async generateWithOllama(prompt: string, config: AIConfig): Promise<string> {
    const isAvailable = await checkOllama();
    if (!isAvailable) {
      throw new Error('Ollama não está disponível. Inicie o Ollama em http://localhost:11434');
    }
    
    return await generateWithOllama(config.model, prompt);
  }

  private async generateWithOpenAI(prompt: string, config: AIConfig): Promise<string> {
    const { data, error } = await supabase.functions.invoke('generate-with-openai', {
      body: {
        prompt,
        model: config.model === 'llama3' ? 'gpt-4o-mini' : config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens
      }
    });

    if (error) throw new Error(`Erro OpenAI: ${error.message}`);
    return data.generatedText;
  }

  private async generateWithClaude(prompt: string, config: AIConfig): Promise<string> {
    const { data, error } = await supabase.functions.invoke('generate-with-claude', {
      body: {
        prompt,
        model: config.model === 'llama3' ? 'claude-3-haiku-20240307' : config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens
      }
    });

    if (error) throw new Error(`Erro Claude: ${error.message}`);
    return data.generatedText;
  }

  private async fallbackGenerate(prompt: string, config: AIConfig): Promise<string> {
    const providers: AIProvider[] = ['ollama', 'openai', 'claude'];
    
    for (const provider of providers) {
      if (provider === config.provider) continue; // Pula o que já falhou
      
      try {
        console.log(`Tentando fallback para ${provider}...`);
        return await this.generateText(prompt, { ...config, provider });
      } catch (error) {
        console.warn(`Fallback ${provider} falhou:`, error);
      }
    }
    
    throw new Error('Todos os providers de IA falharam');
  }

  async getAvailableProviders(): Promise<{ provider: AIProvider; available: boolean; models?: string[] }[]> {
    const results = [];
    
    // Verifica Ollama
    const ollamaAvailable = await checkOllama();
    results.push({
      provider: 'ollama' as AIProvider,
      available: ollamaAvailable,
      models: ollamaAvailable ? ['llama3', 'llama2', 'codellama'] : []
    });

    // Verifica APIs externas
    try {
      const { data } = await supabase.functions.invoke('check-ai-availability');
      
      results.push({
        provider: 'openai' as AIProvider,
        available: !!data?.openai,
        models: data?.openai ? ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'] : []
      });

      results.push({
        provider: 'claude' as AIProvider,
        available: !!data?.claude,
        models: data?.claude ? ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'] : []
      });
    } catch (error) {
      console.error('Erro ao verificar APIs:', error);
    }

    return results;
  }
}

export const aiProvider = new AIProviderManager();