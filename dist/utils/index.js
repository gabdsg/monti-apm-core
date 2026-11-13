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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = void 0;
exports.getAxiosConfig = getAxiosConfig;
exports.axiosRetry = axiosRetry;
exports.parseAllowedFeaturesHeader = parseAllowedFeaturesHeader;
exports.stringifySupportedFeatures = stringifySupportedFeatures;
const retry_1 = __importStar(require("../retry"));
const axios_1 = __importDefault(require("axios"));
const debug_1 = __importDefault(require("debug"));
const constants_1 = require("../constants");
const logger = (0, debug_1.default)('monti-apm-core:transport');
function getAxiosConfig(params) {
    return Object.assign(Object.assign({}, params), { 
        // Axios defaults to 10mb. Increases limit to 3gb
        // (large enough for most heap snapshots).
        maxBodyLength: 3 * 1024 * 1024 * 1024, method: params.method || constants_1.HttpMethod.POST, proxy: false });
}
function axiosRetry(url, params, retryOptions) {
    let retryEnabled = true;
    if (params.noRetry) {
        retryEnabled = false;
        delete params.noRetry;
    }
    return (0, retry_1.default)(() => {
        return new Promise((resolve, reject) => {
            (0, axios_1.default)(url, getAxiosConfig(params))
                .then((res) => {
                return resolve(res);
            })
                .catch((err) => {
                if (err.response && err.response.status) {
                    const status = err.response.status;
                    if (status === 401) {
                        logger('Error: Unauthorized');
                        return reject(new retry_1.ByPassRetryError('Unauthorized'));
                    }
                    else if (status >= 400 && status < 500) {
                        const message = `Agent Error: ${status}`;
                        logger(`Error: ${message}`);
                        const bypassError = new retry_1.ByPassRetryError(message);
                        bypassError.original = err;
                        return reject(bypassError);
                    }
                    const message = `Request failed: ${status}`;
                    const ErrConstructor = retryEnabled ? Error : retry_1.ByPassRetryError;
                    logger(`Error: ${message}`);
                    return reject(new ErrConstructor(message));
                }
                if (!retryEnabled) {
                    const oldErr = err;
                    err = new retry_1.ByPassRetryError(oldErr.message);
                    err.stack = oldErr.stack;
                }
                return reject(err);
            });
        });
    }, retryOptions);
}
function parseAllowedFeaturesHeader(header) {
    const result = Object.create(null);
    if (header) {
        header.split(',').forEach((_feature) => {
            const feature = _feature.trim();
            if (constants_1.SupportedFeatures[feature]) {
                result[feature] = true;
            }
        });
    }
    return result;
}
function stringifySupportedFeatures(features) {
    return Object.entries(features)
        .reduce((acc, [key, value]) => {
        if (value) {
            acc.push(key);
        }
        return acc;
    }, [])
        .join(',');
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
exports.sleep = sleep;
//# sourceMappingURL=index.js.map