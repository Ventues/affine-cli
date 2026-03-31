import { io, Socket } from "socket.io-client";
import https from "https";

export type WorkspaceSocket = Socket<any, any>;
const DEFAULT_WS_CLIENT_VERSION = process.env.AFFINE_WS_CLIENT_VERSION || process.env.AFFINE_SERVER_VERSION || '0.26.2';
const WS_CONNECT_TIMEOUT_MS = Number(process.env.AFFINE_WS_CONNECT_TIMEOUT_MS || 10000);
const WS_ACK_TIMEOUT_MS = Number(process.env.AFFINE_WS_ACK_TIMEOUT_MS || 10000);

// Node.js 22+ exposes native WebSocket which doesn't support custom TLS options
// (rejectUnauthorized, agent, etc.). Remove it so socket.io-client falls back to
// the `ws` package which does support them. This is safe — we're a CLI tool, not a browser.
if (typeof (globalThis as any).WebSocket !== 'undefined') {
  delete (globalThis as any).WebSocket;
}

// Derive the original hostname from AFFINE_BASE_URL for SNI when using a tunnel.
const AFFINE_HOSTNAME = (() => {
  try { return new URL(process.env.AFFINE_BASE_URL || '').hostname; }
  catch { return ''; }
})();

export function wsUrlFromGraphQLEndpoint(endpoint: string): string {
  // Support AFFINE_WS_URL override for SSH tunnel / local proxy scenarios
  const wsOverride = process.env.AFFINE_WS_URL;
  if (wsOverride) return wsOverride;
  return endpoint
    .replace('https://', 'wss://')
    .replace('http://', 'ws://')
    .replace(/\/graphql\/?$/, '');
}

export async function connectWorkspaceSocket(wsUrl: string, extraHeaders?: Record<string, string>): Promise<WorkspaceSocket> {
  return new Promise((resolve, reject) => {
    const isLocalTunnel = wsUrl.includes('localhost') || wsUrl.includes('127.0.0.1');

    // When connecting through an SSH tunnel to localhost, Caddy needs the correct
    // SNI servername for TLS and the Host header for routing.
    const agent = isLocalTunnel && AFFINE_HOSTNAME
      ? new https.Agent({ rejectUnauthorized: false, servername: AFFINE_HOSTNAME })
      : undefined;

    const socketOptions: any = {
      transports: ['websocket'],
      path: '/socket.io/',
      autoConnect: true,
      ...(agent && { agent }),
    };
    
    // Add auth token if present in headers
    if (extraHeaders?.Authorization) {
      socketOptions.auth = { token: extraHeaders.Authorization.replace('Bearer ', '') };
    }
    
    // Build extra headers — include Host header for tunnel routing
    const headers: Record<string, string> = { ...(extraHeaders || {}) };
    if (isLocalTunnel && AFFINE_HOSTNAME) {
      headers['Host'] = AFFINE_HOSTNAME;
    }
    if (Object.keys(headers).length > 0) {
      socketOptions.extraHeaders = headers;
    }
    
    const socket = io(wsUrl, socketOptions);
    const timeout = setTimeout(() => {
      cleanup();
      socket.disconnect();
      reject(new Error(`socket connect timeout after ${WS_CONNECT_TIMEOUT_MS}ms`));
    }, WS_CONNECT_TIMEOUT_MS);
    const onError = (err: any) => {
      cleanup();
      socket.disconnect();
      reject(err);
    };
    const onConnect = () => {
      cleanup();
      resolve(socket);
    };
    const cleanup = () => {
      clearTimeout(timeout);
      socket.off('connect', onConnect);
      socket.off('connect_error', onError);
    };
    socket.on('connect', onConnect);
    socket.on('connect_error', onError);
  });
}

export async function joinWorkspace(socket: WorkspaceSocket, workspaceId: string, clientVersion: string = DEFAULT_WS_CLIENT_VERSION) {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`space:join timeout after ${WS_ACK_TIMEOUT_MS}ms`));
    }, WS_ACK_TIMEOUT_MS);
    socket.emit(
      'space:join',
      { spaceType: 'workspace', spaceId: workspaceId, clientVersion },
      (ack: any) => {
        clearTimeout(timeout);
        if (ack?.error) return reject(new Error(ack.error.message || 'join failed'));
        if (ack?.data?.success === false) return reject(new Error('space:join returned success=false (clientVersion mismatch?)'));
        resolve();
      }
    );
  });
}

export async function loadDoc(socket: WorkspaceSocket, workspaceId: string, docId: string): Promise<{ missing?: string; state?: string; timestamp?: number }> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`space:load-doc timeout after ${WS_ACK_TIMEOUT_MS}ms`));
    }, WS_ACK_TIMEOUT_MS);
    socket.emit(
      'space:load-doc',
      { spaceType: 'workspace', spaceId: workspaceId, docId },
      (ack: any) => {
        clearTimeout(timeout);
        if (ack?.error) {
          if (ack.error.name === 'DOC_NOT_FOUND') return resolve({});
          return reject(new Error(ack.error.message || 'load-doc failed'));
        }
        resolve(ack?.data || {});
      }
    );
  });
}

export async function pushDocUpdate(socket: WorkspaceSocket, workspaceId: string, docId: string, updateBase64: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`space:push-doc-update timeout after ${WS_ACK_TIMEOUT_MS}ms`));
    }, WS_ACK_TIMEOUT_MS);
    socket.emit(
      'space:push-doc-update',
      { spaceType: 'workspace', spaceId: workspaceId, docId, update: updateBase64 },
      (ack: any) => {
        clearTimeout(timeout);
        if (ack?.error) return reject(new Error(ack.error.message || 'push-doc-update failed'));
        resolve(ack?.data?.timestamp || Date.now());
      }
    );
  });
}

export function deleteDoc(socket: WorkspaceSocket, workspaceId: string, docId: string) {
  socket.emit('space:delete-doc', { spaceType: 'workspace', spaceId: workspaceId, docId });
}
