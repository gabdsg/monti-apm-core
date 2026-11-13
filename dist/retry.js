"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ByPassRetryError = exports.MaxRetryError = void 0;
exports.default = retry;
const utils_1 = require("./utils");
class MaxRetryError extends Error {
    /**
     * Reject the promise with this error when run out of retry attempts.
     */
    constructor(message) {
        super(message);
        this.message = message;
    }
}
exports.MaxRetryError = MaxRetryError;
class ByPassRetryError extends Error {
    /**
     * reject the promise with this error (in getPromise) to stop retrying.
     */
    constructor(message) {
        super(message);
        this.message = message;
    }
}
exports.ByPassRetryError = ByPassRetryError;
/**
 * Retry module takes a `getPromise` function as the main argument.
 * The `getPromise` function should return a promise which will be used
 * to decide whether the task ran successfully. If the task failed,
 * it will retry by running the `getPromise` function again. Retry will
 * stop when it has tried `maxRetries` times or if the promise fails
 * with the special error `ERR_ENDRETRY`.
 */
function retry(getPromise, _options) {
    const options = Object.assign({
        maxRetries: 3,
        timeFunction: (i) => retry._initialDelay * Math.pow(i, 2),
    }, _options);
    // The retry module returns a promise which will end when the task
    // is successful or when the retry fails by retry count or by user.
    // It will also collect start/end times for each retry attempt.
    return new Promise(function (resolve, reject) {
        let count = 0;
        const onError = function (err) {
            if (err instanceof ByPassRetryError) {
                reject(err);
            }
            else {
                attempt(err);
            }
        };
        const attempt = function (lastError = null) {
            var _a;
            // Does not include the first attempt to avoid confusion as the
            // option is `max[Re]tries`.
            if (count > options.maxRetries) {
                const message = `Reached maximum retry limit for ${(_a = lastError === null || lastError === void 0 ? void 0 : lastError.message) !== null && _a !== void 0 ? _a : 'unknown error'}`;
                const err = new MaxRetryError(message);
                return reject(err);
            }
            // stop a few milliseconds between retries
            const millis = options.timeFunction(count);
            count++;
            (0, utils_1.sleep)(millis)
                .then(() => {
                return getPromise();
            })
                .then(resolve, onError);
        };
        // start!
        attempt();
    });
}
retry._initialDelay = 5000;
//# sourceMappingURL=retry.js.map