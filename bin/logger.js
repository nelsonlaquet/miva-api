"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gulp_util_1 = require("./optional/gulp-util");
const types_1 = require("./types");
var LogItemType;
(function (LogItemType) {
    LogItemType[LogItemType["Info"] = 0] = "Info";
    LogItemType[LogItemType["Warning"] = 1] = "Warning";
    LogItemType[LogItemType["Error"] = 2] = "Error";
})(LogItemType = exports.LogItemType || (exports.LogItemType = {}));
class Logger {
    get name() { return this._name; }
    get parent() { return this._parent; }
    get fullName() {
        return this.parent ? `${this.parent.fullName}: ${this.name}` : this.name;
    }
    constructor(name = "", parent = null) {
        this._listeners = [];
        this._name = name;
        this._parent = parent;
    }
    addListener(listener) {
        let isDisposed = false;
        this._listeners.push(listener);
        return () => {
            if (isDisposed)
                return;
            this._listeners.splice(this._listeners.indexOf(listener), 1);
            isDisposed = true;
        };
    }
    createLogger(name) {
        return new Logger(name, this);
    }
    log(item, from = this) {
        for (const listener of this._listeners)
            listener(from, item);
        if (this.parent)
            this.parent.log(item, from);
    }
    info(message, error) {
        this.log({ type: LogItemType.Info, message, error });
    }
    warn(message, error) {
        this.log({ type: LogItemType.Warning, message, error });
    }
    error(message, error) {
        this.log({ type: LogItemType.Error, message, error });
    }
}
exports.Logger = Logger;
function formatLog(logger, { type, message, error }) {
    if (error && error.kind) {
        if (error.kind === types_1.CompilerErrorType.CompileError) {
            const { files, options } = error;
            for (const file in files) {
                if (!error.files.hasOwnProperty(file))
                    continue;
                const errors = files[file];
                for (const errorItem of errors) {
                    gulp_util_1.default.log(gulp_util_1.default.colors.bold("Error in"), gulp_util_1.default.colors.bgRed(file), gulp_util_1.default.colors.bold(`(${errorItem.line}):`), gulp_util_1.default.colors.cyan(errorItem.code), gulp_util_1.default.colors.bgBlack(errorItem.message));
                }
            }
            gulp_util_1.default.log(gulp_util_1.default.colors.bold("Failed to compile"), gulp_util_1.default.colors.bgRed(options.inFile), gulp_util_1.default.colors.bgBlack(message));
            return;
        }
        else if (error.kind === types_1.CompilerErrorType.CompilerRunError) {
            const { options, message: compilerMessage } = error;
            gulp_util_1.default.log(gulp_util_1.default.colors.bold("Failed to compile"), gulp_util_1.default.colors.bgRed(options.inFile), gulp_util_1.default.colors.bgBlack(compilerMessage));
            return;
        }
    }
    if (type === LogItemType.Info) {
        gulp_util_1.default.log(gulp_util_1.default.colors.bgBlack(logger.fullName), message);
    }
    else if (type === LogItemType.Warning) {
        gulp_util_1.default.log(gulp_util_1.default.colors.bgCyan(logger.fullName), message);
    }
    else if (type === LogItemType.Error) {
        gulp_util_1.default.log(gulp_util_1.default.colors.bgRed(logger.fullName), message);
    }
    else {
        gulp_util_1.default.log(logger.fullName, message);
    }
}
exports.formatLog = formatLog;
//# sourceMappingURL=logger.js.map