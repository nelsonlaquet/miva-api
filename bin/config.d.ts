export interface ConfigOptions {
    username: string;
    password: string;
    storeUrl: string;
    storeCode: string;
    jsonUrl: string;
}
export declare class Config {
    readonly username: string;
    readonly password: string;
    readonly storeUrl: string;
    readonly storeCode: string;
    readonly jsonUrl: string;
    private _username;
    private _password;
    private _storeUrl;
    private _storeCode;
    private _jsonUrl;
    constructor(config: Partial<ConfigOptions>);
    addEnv(prefix?: string): this;
    addObject({username, password, storeUrl, storeCode, jsonUrl}?: Partial<ConfigOptions>): this;
    addFile(file: string, isRequired?: boolean): this;
}
