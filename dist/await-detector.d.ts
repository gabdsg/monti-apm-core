export declare class AwaitDetector {
    static OldPromiseConstructor: PromiseConstructor;
    static Symbol: symbol;
    destroyed: boolean;
    private trackingContext;
    private stopHookSet;
    private nextPromiseFromConstructor;
    private onAwaitStart;
    private onAwaitEnd;
    constructor({ onAwaitStart, onAwaitEnd, }: {
        onAwaitStart: () => void;
        onAwaitEnd: () => void;
    });
    destroy(): void;
    detect(fn: () => any, context?: object): any;
    ignore(fn: () => any): any;
    createWrappedPromiseConstructor(OrigPromise: typeof global.Promise): PromiseConstructor;
    registerPromiseConstructor(): void;
}
