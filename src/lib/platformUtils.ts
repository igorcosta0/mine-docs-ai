/**
 * Utilidades para detecção de plataforma e ambiente
 */

export type Platform = 'lovable' | 'bolt' | 'local' | 'unknown';

export interface PlatformInfo {
  platform: Platform;
  environment: 'development' | 'production';
  hostname: string;
  isBolt: boolean;
  isLovable: boolean;
  isLocal: boolean;
  aiCapabilities: {
    supportsOllama: boolean;
    requiresAPIKeys: boolean;
    recommendedProvider: 'hybrid' | 'cloud-only' | 'local-only';
  };
}

/**
 * Detecta a plataforma atual onde o app está rodando
 */
export const detectPlatform = (): PlatformInfo => {
  const hostname = window.location.hostname;
  const userAgent = navigator.userAgent;
  const isDev = import.meta.env.DEV;
  
  let platform: Platform = 'unknown';
  
  // Detectar Bolt.new
  const isBolt = hostname.includes('bolt.new') || 
                 hostname.includes('stackblitz') ||
                 userAgent.includes('StackBlitz') ||
                 window.location.origin.includes('bolt');
  
  // Detectar Lovable
  const isLovable = hostname.includes('lovable.app') ||
                    hostname.includes('lovable.dev') ||
                    window.location.origin.includes('lovable');
  
  // Detectar desenvolvimento local
  const isLocal = hostname === 'localhost' || 
                  hostname === '127.0.0.1' ||
                  hostname.startsWith('192.168') ||
                  hostname.startsWith('10.');

  if (isBolt) {
    platform = 'bolt';
  } else if (isLovable) {
    platform = 'lovable';
  } else if (isLocal) {
    platform = 'local';
  }

  // Definir capacidades de IA baseadas na plataforma
  let aiCapabilities;
  if (isBolt) {
    // Bolt.new não tem acesso ao Ollama local
    aiCapabilities = {
      supportsOllama: false,
      requiresAPIKeys: true,
      recommendedProvider: 'cloud-only' as const
    };
  } else if (isLovable || isLocal) {
    // Lovable e local podem usar sistema híbrido
    aiCapabilities = {
      supportsOllama: true,
      requiresAPIKeys: false, // opcional
      recommendedProvider: 'hybrid' as const
    };
  } else {
    // Ambiente desconhecido - assumir capacidades limitadas
    aiCapabilities = {
      supportsOllama: false,
      requiresAPIKeys: true,
      recommendedProvider: 'cloud-only' as const
    };
  }

  return {
    platform,
    environment: isDev ? 'development' : 'production',
    hostname,
    isBolt,
    isLovable,
    isLocal,
    aiCapabilities
  };
};

/**
 * Retorna configurações específicas da plataforma
 */
export const getPlatformConfig = (platform: Platform) => {
  switch (platform) {
    case 'bolt':
      return {
        name: 'Bolt.new',
        color: 'bg-blue-500',
        description: 'Rodando em nuvem - IA via OpenAI',
        features: ['Hot Reload', 'Deploy Automático', 'IA Cloud-Only'],
        limitations: ['Sem Ollama Local', 'Requer API Keys']
      };
    case 'lovable':
      return {
        name: 'Lovable',
        color: 'bg-purple-500',
        description: 'Sistema híbrido - Ollama local + OpenAI',
        features: ['GitHub Sync', 'Sistema Híbrido', 'IA Local + Cloud'],
        limitations: []
      };
    case 'local':
      return {
        name: 'Local',
        color: 'bg-green-500',
        description: 'Desenvolvimento local',
        features: ['Sistema Híbrido', 'Desenvolvimento Local', 'IA Local + Cloud'],
        limitations: []
      };
    default:
      return {
        name: 'Desconhecido',
        color: 'bg-gray-500',
        description: 'Plataforma não identificada',
        features: [],
        limitations: ['Capacidades limitadas']
      };
  }
};

/**
 * Verifica se mudanças são aplicadas automaticamente na plataforma
 */
export const hasAutoReload = (platform: Platform, isDev: boolean): boolean => {
  // Em desenvolvimento, todas as plataformas têm hot reload
  if (isDev) return true;
  
  // Em produção, apenas Bolt.new tem auto-reload
  return platform === 'bolt';
};

/**
 * Retorna mensagem explicativa sobre alterações na plataforma
 */
export const getChangesBehavior = (platformInfo: PlatformInfo): string => {
  if (platformInfo.isBolt) {
    return '✅ Alterações aplicadas automaticamente no Bolt.new';
  } else if (platformInfo.isLovable) {
    return '🔄 Alterações sincronizadas automaticamente via GitHub';
  } else if (platformInfo.isLocal) {
    return '💻 Hot reload ativo durante desenvolvimento';
  } else {
    return '❓ Comportamento de alterações desconhecido';
  }
};