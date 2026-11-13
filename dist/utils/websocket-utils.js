"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_DELAY = exports.once = exports.WebSocketEvents = void 0;
exports.getWsUrl = getWsUrl;
exports.connectWebSocket = connectWebSocket;
exports.persistentConnectWebSocket = persistentConnectWebSocket;
const ws_1 = __importDefault(require("ws"));
const debug_1 = __importDefault(require("debug"));
const constants_1 = require("../constants");
const index_1 = require("./index");
const eventemitter2_1 = __importDefault(require("eventemitter2"));
const logger = (0, debug_1.default)('monti-apm-core:transport');
exports.WebSocketEvents = new eventemitter2_1.default();
function getWsUrl(url) {
    return url.replace('https://', 'wss://').replace('http://', 'ws://');
}
function connectWebSocket(url, headers, onMessage = () => ({}), agent) {
    return new Promise((resolve, reject) => {
        const errorHandler = (error) => {
            reject(error);
        };
        const closeHandler = (code, reason) => {
            const error = new Error(reason.length > 0
                ? reason.toString()
                : `WebSocket closed before connecting (${code})`);
            Object.assign(error, { code });
            reject(error);
        };
        exports.WebSocketEvents.emit(constants_1.WebSocketEvent.WEBSOCKET_ATTEMPT);
        const ws = new ws_1.default(getWsUrl(url).concat('/websocket'), {
            headers,
            agent,
            perMessageDeflate: false,
        });
        ws.once(constants_1.WebSocketEvent.CLOSE, closeHandler);
        ws.once(constants_1.WebSocketEvent.ERROR, errorHandler);
        ws.on(constants_1.WebSocketEvent.OPEN, () => {
            ws.off(constants_1.WebSocketEvent.CLOSE, closeHandler);
            ws.off(constants_1.WebSocketEvent.ERROR, errorHandler);
            // Errors after a connection is established are followed by a close event,
            // which triggers reconnection. Keep a listener so EventEmitter does not
            // treat the error as uncaught.
            ws.on(constants_1.WebSocketEvent.ERROR, (error) => {
                logger('WebSocket error after connecting: %O', error);
            });
            ws.on(constants_1.WebSocketEvent.MESSAGE, (message) => {
                const data = message.toString();
                if (!data) {
                    return;
                }
                if (data === 'ping') {
                    ws.emit(constants_1.WebSocketEvent.PING);
                    ws.send('pong');
                    return;
                }
                onMessage(data);
            });
            ws.on(constants_1.WebSocketEvent.CLOSE, () => exports.WebSocketEvents.emit(constants_1.WebSocketEvent.WEBSOCKET_CLOSED));
            resolve(ws);
        });
    });
}
const once = async (ws, event) => new Promise((resolve) => {
    ws.once(event, () => resolve());
});
exports.once = once;
exports.MAX_DELAY = 60000;
function persistentConnectWebSocket(endpoint, headers, onMessage = () => undefined, agent, timeFunction = (i) => Math.min(64 * Math.pow(i, 2), exports.MAX_DELAY) * (0.9 + 0.2 * Math.random())) {
    let stopped;
    let ws = null;
    async function connect() {
        stopped = false;
        let attempts = 0;
        while (!stopped) {
            try {
                ws = await connectWebSocket(endpoint, headers, onMessage, agent);
                attempts = 0;
                if (stopped) {
                    ws.close();
                    break;
                }
                exports.WebSocketEvents.emit(constants_1.WebSocketEvent.WEBSOCKET_CONNECTED, ws);
                await (0, exports.once)(ws, 'close');
                ws = null;
            }
            catch (error) {
                // Ignore errors from us closing the client
                if (error.code !== 1006) {
                    // Avoid showing too many errors in the logs. Show the 10th error
                    // and every 100th error
                    if (attempts === 10 || (attempts > 0 && attempts % 100 === 0)) {
                        console.error(`Monti APM: Failed connecting websocket: ${error.message}`);
                    }
                }
                attempts++;
            }
            await (0, index_1.sleep)(timeFunction(attempts));
        }
    }
    connect();
    return {
        disconnect() {
            stopped = true;
            if (ws) {
                ws.close();
            }
        },
    };
}
//# sourceMappingURL=websocket-utils.js.map