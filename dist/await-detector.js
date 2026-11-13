"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwaitDetector = void 0;
const node_v8_1 = require("node:v8");
const IS_ASYNC_FUNCTION = 0;
const IS_FROM_ASYNC_FUNCTION_1 = 1;
const IS_FROM_ASYNC_FUNCTION_2 = 2;
const ContextSymbol = Symbol('monti-await-detector-context');
const TypeSymbol = Symbol('monti-await-detector-type');
const nativeHasInstance = Function.prototype[Symbol.hasInstance];
class AwaitDetector {
    constructor({ onAwaitStart = () => { }, onAwaitEnd = () => { }, }) {
        this.onAwaitStart = onAwaitStart;
        this.onAwaitEnd = onAwaitEnd;
        this.destroyed = false;
        this.trackingContext = null;
        this.nextPromiseFromConstructor = false;
        this.stopHookSet = node_v8_1.promiseHooks.createHook({
            init: (_promise, _parent) => {
                const promise = _promise;
                const parent = _parent;
                if (this.nextPromiseFromConstructor) {
                    this.nextPromiseFromConstructor = false;
                    return;
                }
                if (parent === undefined) {
                    if (this.trackingContext) {
                        promise[TypeSymbol] = IS_ASYNC_FUNCTION;
                        promise[ContextSymbol] = this.trackingContext;
                    }
                    return;
                }
                const parentType = parent[TypeSymbol];
                if (parentType === IS_ASYNC_FUNCTION) {
                    promise[TypeSymbol] = IS_FROM_ASYNC_FUNCTION_1;
                    promise[ContextSymbol] = parent[ContextSymbol];
                }
                else if (parentType === IS_FROM_ASYNC_FUNCTION_1) {
                    promise[TypeSymbol] = IS_FROM_ASYNC_FUNCTION_2;
                    promise[ContextSymbol] = parent[ContextSymbol];
                    this.onAwaitStart(promise, parent[ContextSymbol]);
                }
            },
            before: (_promise) => {
                const promise = _promise;
                if (promise[TypeSymbol] !== IS_FROM_ASYNC_FUNCTION_2) {
                    return;
                }
                this.trackingContext = promise[ContextSymbol];
                this.onAwaitEnd(promise, this.trackingContext);
            },
            after: () => {
                this.trackingContext = null;
            },
            settled: () => {
                this.trackingContext = null;
            },
        });
        this.registerPromiseConstructor();
    }
    destroy() {
        this.stopHookSet();
        global.Promise = AwaitDetector.OldPromiseConstructor;
        this.destroyed = true;
    }
    detect(fn, context = {}) {
        if (this.destroyed) {
            return fn();
        }
        const oldContext = this.trackingContext;
        this.trackingContext = context;
        try {
            return fn();
        }
        finally {
            this.trackingContext = oldContext;
        }
    }
    ignore(fn) {
        const oldContext = this.trackingContext;
        this.trackingContext = null;
        try {
            return fn();
        }
        finally {
            this.trackingContext = oldContext;
        }
    }
    createWrappedPromiseConstructor(OrigPromise) {
        const self = this;
        // @ts-ignore
        if (OrigPromise[AwaitDetector.Symbol]) {
            return OrigPromise;
        }
        const wrapped = class Promise extends OrigPromise {
            constructor(executor) {
                self.nextPromiseFromConstructor = true;
                super(executor);
            }
            static [Symbol.hasInstance](obj) {
                return obj instanceof OrigPromise || nativeHasInstance.call(this, obj);
            }
        };
        // @ts-ignore
        wrapped[AwaitDetector.Symbol] = true;
        return wrapped;
    }
    registerPromiseConstructor() {
        global.Promise = this.createWrappedPromiseConstructor(global.Promise);
    }
}
exports.AwaitDetector = AwaitDetector;
AwaitDetector.OldPromiseConstructor = global.Promise;
AwaitDetector.Symbol = Symbol('monti-await-detector-constructor');
//# sourceMappingURL=await-detector.js.map