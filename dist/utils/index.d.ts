import { RetryOptions } from '../retry';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
export declare function getAxiosConfig(params: AxiosRequestConfig): AxiosRequestConfig;
export declare function axiosRetry(url: string, params: {
    noRetry?: boolean;
} & AxiosRequestConfig<any>, retryOptions?: RetryOptions): Promise<AxiosResponse>;
export declare function parseAllowedFeaturesHeader(header: string): Record<string, boolean>;
export declare function stringifySupportedFeatures(features: Record<string, boolean>): string;
export declare const sleep: (ms: number) => Promise<unknown>;
