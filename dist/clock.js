"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const retry_1 = __importDefault(require("./retry"));
const axios_1 = __importDefault(require("axios"));
const defaultOptions = {
    endpoint: '',
};
class Clock {
    constructor(_options) {
        this._options = {};
        this._diff = 0;
        this.ready = false;
        this._options = Object.assign({}, defaultOptions, _options);
    }
    getTime() {
        // current time on Monti server
        return this._clientTS() + this._diff;
    }
    fixTime(timestamp) {
        // `timestamp` on Monti server
        return timestamp + this._diff;
    }
    sync() {
        // calculate the time difference
        return (0, retry_1.default)(() => this._syncOnce());
    }
    _clientTS() {
        // Get client timestamp while considering time related
        // libraries messing up the Date object. "Y U DO THIS?"
        const now = Date.now();
        if (typeof now === 'number') {
            return now;
        }
        // some time related libraries screw up Date.now()
        // and it returns a Date object instead of a number
        if (now instanceof Date) {
            return now.getTime();
        }
        // final attempt to get time
        return new Date().getTime();
    }
    async _syncOnce() {
        await this._fetchTime();
        const startTS = this._clientTS();
        const serverTS = await this._fetchTime();
        const latency = (this._clientTS() - startTS) / 2;
        this._diff = serverTS - latency - startTS;
        this.ready = true;
    }
    async _fetchTime() {
        if (!this._options.endpoint) {
            throw new Error('endpoint is not set');
        }
        const { data } = await axios_1.default.get(this._options.endpoint, {
            httpAgent: this._options.agent,
            httpsAgent: this._options.agent,
            proxy: false,
            responseType: 'text',
        });
        const timestamp = Number(data);
        if (!Number.isFinite(timestamp) || timestamp <= 0) {
            throw new Error('invalid timestamp response');
        }
        return timestamp;
    }
}
exports.default = Clock;
//# sourceMappingURL=clock.js.map