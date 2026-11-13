import WebSocket from 'ws';
import EventEmitter2 from 'eventemitter2';
export declare const WebSocketEvents: EventEmitter2;
export declare function getWsUrl(url: string): string;
export declare function connectWebSocket(url: string, headers: Record<string, string>, onMessage?: (data: string) => void, agent?: any): Promise<WebSocket>;
export declare const once: (ws: WebSocket, event: string) => Promise<void>;
export declare const MAX_DELAY = 60000;
export declare function persistentConnectWebSocket(endpoint: string, headers: Record<string, string>, onMessage?: (data: string) => void, agent?: any, timeFunction?: (i: number) => number): {
    disconnect(): void;
};
