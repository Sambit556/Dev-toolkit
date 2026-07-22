import { EventEmitter } from 'events';

// In-process pub/sub so the Upload Queue SSE stream (see /api/storage/upload/stream)
// can push a fresh snapshot the instant an upload_sessions row changes, instead of the
// client having to poll on a fixed interval. Single-instance API process (see
// docker/docker-compose.yml — one `api` container), so an in-memory emitter is enough;
// this would need to move to Redis pub/sub if the API is ever scaled horizontally.
const emitter = new EventEmitter();
emitter.setMaxListeners(0);

function channel(userId: string): string {
  return `upload-queue:${userId}`;
}

export function publishUploadQueue(userId: string, data: unknown): void {
  emitter.emit(channel(userId), data);
}

export function subscribeUploadQueue(userId: string, listener: (data: unknown) => void): () => void {
  const event = channel(userId);
  emitter.on(event, listener);
  return () => emitter.off(event, listener);
}
