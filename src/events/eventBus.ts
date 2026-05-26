import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

export class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
    this.setMaxListeners(50);
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) EventBus.instance = new EventBus();
    return EventBus.instance;
  }

  emit(event: string, payload: unknown): boolean {
    logger.debug(`[Event] ${event}`);
    return super.emit(event, payload);
  }
}
