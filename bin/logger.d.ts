export declare enum LogItemType {
    Info = 0,
    Warning = 1,
    Error = 2,
}
export interface LogItem {
    type: LogItemType;
    message: string;
    error: any;
}
export declare type LoggerListener = (logger: Logger, item: LogItem) => void;
export declare class Logger {
    readonly name: string;
    readonly parent: Logger | null;
    readonly fullName: string;
    private _listeners;
    private _parent;
    private _name;
    constructor(name?: string, parent?: Logger | null);
    addListener(listener: LoggerListener): () => void;
    createLogger(name: string): Logger;
    log(item: LogItem, from?: this): void;
    info(message: string, error?: any): void;
    warn(message: string, error?: any): void;
    error(message: string, error?: any): void;
}
export declare function formatLog(logger: Logger, {type, message, error}: LogItem): void;
