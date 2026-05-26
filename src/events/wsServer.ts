import { WebSocketServer, WebSocket } from 'ws';
import { config } from '../config';
import { EventBus } from './eventBus';
import { logger } from '../utils/logger';

const events = EventBus.getInstance();

export function startWsServer() {
  const wss = new WebSocketServer({ port: config.wsPort });
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
  });

  function broadcast(type: string, payload: unknown) {
    const msg = JSON.stringify({ type, payload });
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) client.send(msg);
    }
  }

  events.on('task.created', (task) => broadcast('task.created', task));
  events.on('task.updated', ({ task }) => broadcast('task.updated', task));
  events.on('task.moved', ({ task, from, to }) => broadcast('task.moved', { task, from, to }));

  logger.info(`WebSocket server listening on port ${config.wsPort}`);
  return wss;
}
