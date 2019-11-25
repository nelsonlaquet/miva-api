import { CompileError, CompilerErrorType } from "./types";

export enum LogItemType {
	Info,
	Warning,
	Error,
}

export interface LogItem {
	type: LogItemType;
	message: string;
	error: any;
}

export type LoggerListener = (logger: Logger, item: LogItem) => void;

export class Logger {
	public get name() {
		return this._name;
	}
	public get parent() {
		return this._parent;
	}
	public get fullName(): string {
		return this.parent
			? `${this.parent.fullName}: ${this.name}`
			: this.name;
	}

	private _listeners: LoggerListener[];
	private _parent: Logger | null;
	private _name: string;

	public constructor(name: string = "", parent: Logger | null = null) {
		this._listeners = [];
		this._name = name;
		this._parent = parent;
	}

	public addListener(listener: LoggerListener) {
		let isDisposed = false;
		this._listeners.push(listener);
		return () => {
			if (isDisposed) return;

			this._listeners.splice(this._listeners.indexOf(listener), 1);
			isDisposed = true;
		};
	}

	public createLogger(name: string) {
		return new Logger(name, this);
	}

	public log(item: LogItem, from = this) {
		for (const listener of this._listeners) listener(from, item);

		if (this.parent) this.parent.log(item, from);
	}

	public info(message: string, error?: any) {
		this.log({ type: LogItemType.Info, message, error });
	}

	public warn(message: string, error?: any) {
		this.log({ type: LogItemType.Warning, message, error });
	}

	public error(message: string, error?: any) {
		this.log({ type: LogItemType.Error, message, error });
	}
}

export function formatLog(logger: Logger, { type, message, error }: LogItem) {
	if (error && error.kind) {
		if (error.kind === CompilerErrorType.CompileError) {
			const { files, options } = error as CompileError;
			for (const file in files) {
				if (!error.files.hasOwnProperty(file)) continue;

				const errors = files[file];
				for (const errorItem of errors) {
					console.log(
						"Error in",
						file,
						`(${errorItem.line}):`,
						errorItem.code,
						errorItem.message,
					);
				}
			}

			console.log("Failed to compile", options.inFile, message);
			return;
		} else if (error.kind === CompilerErrorType.CompilerRunError) {
			const { options, message: compilerMessage } = error as CompileError;
			console.log("Failed to compile", options.inFile, compilerMessage);
			return;
		}
	}

	if (type === LogItemType.Info) {
		console.log(logger.fullName, message);
	} else if (type === LogItemType.Warning) {
		console.log(logger.fullName, message);
	} else if (type === LogItemType.Error) {
		console.log(logger.fullName, message);
	} else {
		console.log(logger.fullName, message);
	}
}
