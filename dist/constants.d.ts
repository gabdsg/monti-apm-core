export declare const CoreEvent: {
    JOB_CREATED: string;
    DISCONNECT: string;
};
export declare const WebSocketEvent: {
    OPEN: string;
    CLOSE: string;
    MESSAGE: string;
    ERROR: string;
    PING: string;
    WEBSOCKET_CONNECTED: string;
    WEBSOCKET_ATTEMPT: string;
    WEBSOCKET_CLOSED: string;
};
export declare enum ContentType {
    JSON = "application/json",
    JSON_LINES = "application/jsonlines",
    TEXT = "text/plain",
    STREAM = "application/octet-stream"
}
export declare enum EngineEvent {
    JOB_CREATED = "job:created"
}
export declare enum HttpHeader {
    ACCEPT_FEATURES = "accept-features"
}
export declare enum HttpMethod {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE",
    HEAD = "HEAD",
    OPTIONS = "OPTIONS"
}
export declare enum Feature {
    WEBSOCKETS = "websockets",
    JSON_LINE_TRACES = "json_line_traces"
}
export declare const SupportedFeatures: {
    websockets: boolean;
    json_line_traces: boolean;
};
