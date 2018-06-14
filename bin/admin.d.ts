import { Config } from "./config";
import { Logger } from "./logger";
export interface JsonResponse<TResult> {
    success: boolean;
    data: TResult;
    error_code?: string;
    error_message?: string;
}
export declare class MivaAdmin {
    private static _adminPath;
    readonly logger: Logger;
    private _logger;
    private _loggerSignIn;
    private _sessionId?;
    private _config;
    private _loggerUpload;
    constructor(config: Config, logger?: Logger | null);
    setSessionId(sessionId: string): void;
    uploadModule(moduleCode: string, modulePath: string): Promise<any>;
    updateModule(moduleCode: string, modulePath: string): Promise<void>;
    json<ResponseType>(func: string, querystring?: {
        [name: string]: string;
    }, form?: {
        [name: string]: string;
    }): Promise<JsonResponse<ResponseType>>;
    moduleJson<ResponseType>(moduleCode: string, func: string, querystring?: {
        [name: string]: string;
    }, form?: {
        [name: string]: string;
    }): Promise<JsonResponse<ResponseType>>;
    private _postForm(path, querystring, form, provideCredentials?);
    private _buildUrl(url, querystring);
}
