export type Options = {
    endpoint?: string;
    agent?: any;
};
export default class Clock {
    _options: Options;
    _diff: number;
    ready: boolean;
    constructor(_options?: Options);
    getTime(): number;
    fixTime(timestamp: number): number;
    sync(): Promise<void>;
    _clientTS(): number;
    _syncOnce(): Promise<void>;
    _fetchTime(): Promise<number>;
}
