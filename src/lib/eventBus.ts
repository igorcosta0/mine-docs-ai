/**
 * Event Bus - Sistema de comunicação entre componentes
 * Permite que diferentes partes do app se comuniquem sem acoplamento direto
 */

export type EventType = 
  | 'USER_MESSAGE'
  | 'AGENT_RESPONSE'
  | 'DL_ITEM_UPLOADED'
  | 'DL_ITEM_DELETED'
  | 'DOCS_INDEXED'
  | 'PROCESSING_ERROR'
  | 'DUPLICATE_DETECTED'
  | 'SYSTEM_NOTIFICATION';

export type EventPayload = {
  USER_MESSAGE: { message: string; userId?: string };
  AGENT_RESPONSE: { message: string; metadata?: any };
  DL_ITEM_UPLOADED: { itemId: string; title: string; type: string; count: number };
  DL_ITEM_DELETED: { itemId: string; title: string };
  DOCS_INDEXED: { count: number; userId?: string };
  PROCESSING_ERROR: { error: string; context?: any };
  DUPLICATE_DETECTED: { fileName: string; existingFile: string };
  SYSTEM_NOTIFICATION: { title: string; message: string; type: 'info' | 'success' | 'warning' | 'error' };
};

class EventBus {
  private listeners = new Map<EventType, Set<(payload: any) => void>>();

  on<T extends EventType>(event: T, handler: (payload: EventPayload[T]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    
    console.log(`[EventBus] Listener registered for: ${event}`);
  }

  off<T extends EventType>(event: T, handler: (payload: EventPayload[T]) => void) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      console.log(`[EventBus] Listener removed for: ${event}`);
    }
  }

  emit<T extends EventType>(event: T, payload: EventPayload[T]) {
    console.log(`[EventBus] 📡 Emitting: ${event}`, payload);
    
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`[EventBus] ❌ Error in handler for ${event}:`, error);
        }
      });
    }
  }

  clear() {
    this.listeners.clear();
    console.log('[EventBus] All listeners cleared');
  }

  getListenerCount(event: EventType): number {
    return this.listeners.get(event)?.size || 0;
  }
}

// Singleton instance
export const eventBus = new EventBus();
