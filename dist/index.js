"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Monti = void 0;
const clock_1 = __importDefault(require("./clock"));
const debug_1 = __importDefault(require("debug"));
const constants_1 = require("./constants");
const utils_1 = require("./utils");
const os_1 = require("os");
const eventemitter2_1 = __importDefault(require("eventemitter2"));
const websocket_utils_1 = require("./utils/websocket-utils");
const https_proxy_agent_1 = require("https-proxy-agent");
const proxy_from_env_1 = require("proxy-from-env");
const logger = (0, debug_1.default)('monti-apm-core:transport');
const jobLogger = (0, debug_1.default)('monti-apm-core:jobs');
const defaultOptions = {
    appId: '',
    appSecret: '',
    agentVersion: 'unknown',
    endpoint: 'https://engine.montiapm.com',
    hostname: (0, os_1.hostname)(),
    clockSyncInterval: 1000 * 60,
    dataFlushInterval: 1000 * 10,
    retryOptions: {
        maxRetries: 3, // Same as the previous 4 not counting the first try.
        authRetryDelay: 1000 * 30,
    },
};
// exporting this for if we need to get this as a NPM module.
class Monti extends eventemitter2_1.default {
    constructor(_options) {
        super();
        this._supportedFeatures = constants_1.SupportedFeatures;
        this._allowedFeatures = Object.create(null);
        this._headers = {};
        this._disconnectWebSocket = null;
        this._disconnected = false;
        const instanceId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        this._options = Object.assign(Object.assign(Object.assign({}, defaultOptions), _options), { retryOptions: Object.assign(Object.assign({}, defaultOptions.retryOptions), _options === null || _options === void 0 ? void 0 : _options.retryOptions) });
        this._headers = {
            'content-type': constants_1.ContentType.JSON,
            accepts: constants_1.ContentType.JSON,
            'kadira-app-id': this._options.appId,
            'kadira-app-secret': this._options.appSecret,
            'monti-agent-version': this._options.agentVersion,
            'monti-agent-hostname': this._options.hostname,
            'monti-instance-id': instanceId,
        };
        this._clockSyncInterval = null;
        const proxyUrl = this._options.proxy || (0, proxy_from_env_1.getProxyForUrl)(this._options.endpoint);
        if (proxyUrl) {
            this._agent = new https_proxy_agent_1.HttpsProxyAgent(proxyUrl);
        }
        this._clock = new clock_1.default({
            endpoint: this._options.endpoint + '/simplentp/sync',
            agent: this._agent,
        });
    }
    get _agentConfig() {
        return { httpAgent: this._agent, httpsAgent: this._agent };
    }
    get _websocketHeaders() {
        return Object.assign(Object.assign({}, this._headers), { 'monti-supported-features': (0, utils_1.stringifySupportedFeatures)(this._supportedFeatures) });
    }
    featureSupported(feature) {
        return Boolean(this._allowedFeatures[feature]);
    }
    async connect() {
        this._disconnected = false;
        logger('connecting with', this._options);
        await this._checkAuth();
        if (this._disconnected) {
            return;
        }
        this._clockSyncInterval = setInterval(() => this._clock.sync().catch((err) => {
            logger(`Failed syncing clock: ${err}`);
        }), this._options.clockSyncInterval);
        await this._clock.sync();
        if (this._disconnected) {
            return;
        }
        this._initWebSocket();
    }
    disconnect() {
        var _a;
        logger('disconnect');
        this._disconnected = true;
        if (this._clockSyncInterval) {
            clearInterval(this._clockSyncInterval);
        }
        (_a = this._disconnectWebSocket) === null || _a === void 0 ? void 0 : _a.call(this);
    }
    getJob(id) {
        const data = { action: 'get', params: {} };
        Object.assign(data.params, { id });
        const url = this._options.endpoint + '/jobs';
        const params = {
            data,
            headers: this._headers,
        };
        logger('get job', id);
        return this._send(url, params);
    }
    updateJob(id, diff) {
        const data = { action: 'set', params: {} };
        Object.assign(data.params, diff, { id });
        const url = this._options.endpoint + '/jobs';
        const params = {
            data,
            headers: this._headers,
        };
        logger('update job', id);
        return this._send(url, params);
    }
    sendData(_payload) {
        // Needs to be inside a promise so the errors thrown below it
        // are properly caught.
        return new Promise((resolve) => {
            const payload = Object.assign(Object.assign({}, _payload), { host: this._options.hostname });
            const json = JSON.stringify(payload);
            const url = this._options.endpoint;
            logger('sending data', json.slice(0, 100));
            const params = {
                data: Buffer.from(json),
                headers: {
                    'content-type': constants_1.ContentType.JSON,
                },
            };
            return resolve(this._send(url, params));
        });
    }
    sendTraces(traces, maxRequestSize = 1024 * 1024 * 5) {
        if (traces.length === 0) {
            return Promise.resolve();
        }
        const bodies = [];
        let currentRequestSize = 0;
        const currentRequestLines = [];
        function createBody() {
            bodies.push(Buffer.from(currentRequestLines.join('')));
            currentRequestLines.length = 0;
            currentRequestSize = 0;
        }
        for (let i = 0; i < traces.length; i++) {
            const stringified = JSON.stringify(traces[i]) + '\n';
            const size = Buffer.byteLength(stringified, 'utf-8');
            if (currentRequestSize > 0 &&
                currentRequestSize + size > maxRequestSize) {
                createBody();
            }
            currentRequestSize += size;
            currentRequestLines.push(stringified);
        }
        if (currentRequestSize > 0) {
            createBody();
        }
        return Promise.all(bodies.map((body) => {
            const url = this._options.endpoint + '/traces';
            return this._send(url, {
                data: body,
                headers: {
                    'content-type': constants_1.ContentType.JSON_LINES,
                },
            });
        }));
    }
    get(path, options = {}) {
        const url = this._options.endpoint + path;
        const params = {
            method: 'GET',
            headers: Object.assign({}, this._headers),
            noRetry: options.noRetry,
        };
        logger(`get request to ${url}`);
        return this._send(url, params);
    }
    sendStream(path, stream) {
        const url = this._options.endpoint + path;
        const params = {
            data: stream,
            headers: Object.assign(Object.assign({}, this._headers), { 'content-type': constants_1.ContentType.STREAM }),
            // Prevent full stream being buffered in-memory
            maxRedirects: 0,
            // Streams cannot be safely replayed after a request starts consuming
            // them. Retrying the same stream would send an empty or partial body.
            noRetry: true,
        };
        logger(`send stream to ${url}`);
        return this._send(url, params);
    }
    _handleJobEvent(job) {
        this.emit(constants_1.CoreEvent.JOB_CREATED, job);
    }
    _handleMessage(message) {
        try {
            const { event, data } = JSON.parse(message);
            switch (event) {
                case constants_1.EngineEvent.JOB_CREATED:
                    return this._handleJobEvent(data);
                default:
                    jobLogger(`unknown event ${event}`);
            }
        }
        catch (error) {
            console.error('Monti APM: Failed to parse message', message);
            console.error(error.stack);
        }
    }
    _initWebSocket() {
        if (!this.featureSupported(constants_1.Feature.WEBSOCKETS)) {
            return;
        }
        const { disconnect } = (0, websocket_utils_1.persistentConnectWebSocket)(this._options.endpoint, this._websocketHeaders, this._handleMessage.bind(this), this._agent);
        this._disconnectWebSocket = disconnect;
    }
    // ping the server to check whether appId and appSecret
    // are valid and correct. Data sent inside http headers.
    async _checkAuth() {
        const uri = this._options.endpoint + '/ping';
        const params = Object.assign({ headers: this._headers }, this._agentConfig);
        const baseDelay = this._options.retryOptions.authRetryDelay || 1000 * 30;
        const retryOptions = {
            maxRetries: 100,
            // with the defaults, retry every 30 - 60 seconds
            timeFunction: (i) => {
                if (i === 0) {
                    return 0;
                }
                return baseDelay + Math.random() * baseDelay;
            },
        };
        const res = await (0, utils_1.axiosRetry)(uri, params, retryOptions);
        this._allowedFeatures = (0, utils_1.parseAllowedFeaturesHeader)(res.headers[constants_1.HttpHeader.ACCEPT_FEATURES]);
        return res.data;
    }
    // communicates with the server with http
    // Also handles response http status codes and retries
    async _send(url, params) {
        const res = await (0, utils_1.axiosRetry)(url, Object.assign(Object.assign(Object.assign({}, params), { headers: Object.assign(Object.assign({}, this._headers), params.headers) }), this._agentConfig), this._options.retryOptions);
        return res.data;
    }
}
exports.Monti = Monti;
exports.default = Monti;
__exportStar(require("./constants"), exports);
//# sourceMappingURL=index.js.map