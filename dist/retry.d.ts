export declare class MaxRetryError extends Error {
    /**
     * Reject the promise with this error when run out of retry attempts.
     */
    constructor(message: string);
}
export declare class ByPassRetryError extends Error {
    original: undefined | Error;
    /**
     * reject the promise with this error (in getPromise) to stop retrying.
     */
    constructor(message: string);
}
export type RetryOptions = {
    maxRetries?: number;
    timeFunction?: (i: number) => number;
};
/**
 * Retry module takes a `getPromise` function as the main argument.
 * The `getPromise` function should return a promise which will be used
 * to decide whether the task ran successfully. If the task failed,
 * it will retry by running the `getPromise` function again. Retry will
 * stop when it has tried `maxRetries` times or if the promise fails
 * with the special error `ERR_ENDRETRY`.
 */
declare function retry<T = any>(getPromise: () => Promise<T>, _options?: Partial<RetryOptions>): Promise<T>;
declare namespace retry {
    var _initialDelay: number;
}
export default retry;
