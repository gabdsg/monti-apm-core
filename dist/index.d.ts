import Clock from './clock';
import EventEmitter2 from 'eventemitter2';
import { HttpsProxyAgent } from 'https-proxy-agent';
export type Job = {
    _id: string;
    [key: string]: any;
};
export type MontiOptions = {
    appId: string;
    appSecret: string;
    agentVersion: string;
    endpoint: string;
    hostname: string;
    clockSyncInterval: number;
    dataFlushInterval: number;
    retryOptions: {
        maxRetries: number;
        authRetryDelay: number;
    };
    proxy?: string;
};
export type MontiInputOptions = Omit<Partial<MontiOptions>, 'retryOptions'> & {
    retryOptions?: Partial<MontiOptions['retryOptions']>;
};
export declare class Monti extends EventEmitter2 {
    _supportedFeatures: {
        websockets: boolean;
        json_line_traces: boolean;
    };
    _allowedFeatures: Record<string, boolean>;
    _options: MontiOptions;
    _headers: Record<string, string>;
    _clock: Clock;
    _clockSyncInterval: NodeJS.Timeout | null;
    _disconnectWebSocket: (() => void) | null;
    _disconnected: boolean;
    _agent: HttpsProxyAgent<string> | undefined;
    constructor(_options?: MontiInputOptions);
    get _agentConfig(): {
        httpAgent: HttpsProxyAgent<string> | undefined;
        httpsAgent: HttpsProxyAgent<string> | undefined;
    };
    get _websocketHeaders(): {
        'monti-supported-features': string;
    };
    featureSupported(feature: string): boolean;
    connect(): Promise<void>;
    disconnect(): void;
    getJob(id: string): Promise<any>;
    updateJob(id: string, diff: Record<string, any>): Promise<any>;
    sendData(_payload: Record<string, any>): Promise<unknown>;
    sendTraces(traces: unknown[], maxRequestSize?: number): Promise<void> | Promise<any[]>;
    get(path: string, options?: {
        noRetry?: boolean;
    }): Promise<any>;
    sendStream(path: string, stream: NodeJS.ReadableStream): Promise<any>;
    _handleJobEvent(job: Job): void;
    _handleMessage(message: string): void;
    _initWebSocket(): void;
    _checkAuth(): Promise<any>;
    _send(url: string, params: Record<string, any>): Promise<any>;
}
export default Monti;
export * from './constants';
