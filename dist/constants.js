"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportedFeatures = exports.Feature = exports.HttpMethod = exports.HttpHeader = exports.EngineEvent = exports.ContentType = exports.WebSocketEvent = exports.CoreEvent = void 0;
exports.CoreEvent = {
    JOB_CREATED: 'job:created',
    DISCONNECT: 'disconnect',
};
exports.WebSocketEvent = {
    OPEN: 'open',
    CLOSE: 'close',
    MESSAGE: 'message',
    ERROR: 'error',
    PING: 'ping',
    WEBSOCKET_CONNECTED: 'websocket:connected',
    WEBSOCKET_ATTEMPT: 'websocket:attempt',
    WEBSOCKET_CLOSED: 'websocket:closed',
};
var ContentType;
(function (ContentType) {
    ContentType["JSON"] = "application/json";
    ContentType["JSON_LINES"] = "application/jsonlines";
    ContentType["TEXT"] = "text/plain";
    ContentType["STREAM"] = "application/octet-stream";
})(ContentType || (exports.ContentType = ContentType = {}));
var EngineEvent;
(function (EngineEvent) {
    EngineEvent["JOB_CREATED"] = "job:created";
})(EngineEvent || (exports.EngineEvent = EngineEvent = {}));
var HttpHeader;
(function (HttpHeader) {
    HttpHeader["ACCEPT_FEATURES"] = "accept-features";
})(HttpHeader || (exports.HttpHeader = HttpHeader = {}));
var HttpMethod;
(function (HttpMethod) {
    HttpMethod["GET"] = "GET";
    HttpMethod["POST"] = "POST";
    HttpMethod["PUT"] = "PUT";
    HttpMethod["DELETE"] = "DELETE";
    HttpMethod["HEAD"] = "HEAD";
    HttpMethod["OPTIONS"] = "OPTIONS";
})(HttpMethod || (exports.HttpMethod = HttpMethod = {}));
var Feature;
(function (Feature) {
    Feature["WEBSOCKETS"] = "websockets";
    Feature["JSON_LINE_TRACES"] = "json_line_traces";
})(Feature || (exports.Feature = Feature = {}));
exports.SupportedFeatures = {
    [Feature.WEBSOCKETS]: true,
    [Feature.JSON_LINE_TRACES]: true,
};
//# sourceMappingURL=constants.js.map