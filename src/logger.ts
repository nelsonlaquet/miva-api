import $ from "./optional/gulp-util"
import {CompileError, CompilerErrorType} from "./compiler"

export enum LogItemType {
	Info,
	Warning,
	Error
}

export interface LogItem {
	type: LogItemType
	message: string
	error: any
}

export type LoggerListener = (logger: Logger, item: LogItem) => void

export class Logger {
	public get name() { return this._name }
	public get parent() { return this._parent }
	public get fullName(): string {
		return this.parent ? `${this.parent.fullName}: ${this.name}` : this.name
	}
	
	private _listeners: LoggerListener[]
	private _parent: Logger | null
	private _name: string

	public constructor(name: string = "", parent: Logger | null = null) {
		this._listeners = []
		this._name = name
		this._parent = parent
	}
	
	public addListener(listener: LoggerListener) {
		let isDisposed = false
		this._listeners.push(listener)
		return () => {
			if (isDisposed)
				return

			this._listeners.splice(this._listeners.indexOf(listener), 1)
			isDisposed = true
		}
	}

	public createLogger(name: string) {
		return new Logger(name, this)
	}

	public log(item: LogItem) {
		for (const listener of this._listeners)
			listener(this, item)

		if (this.parent)
			this.parent.log(item)
	}

	public info(message: string, error?: any) {
		this.log({type: LogItemType.Info, message, error})
	}

	public warn(message: string, error?: any) {
		this.log({type: LogItemType.Warning, message, error})
	}

	public error(message: string, error?: any) {
		this.log({type: LogItemType.Error, message, error})
	}
}

export function formatLog(logger: Logger, {type, message, error}: LogItem) {
	if (type === LogItemType.Info) {
		$.log($.colors.bgBlack(logger.fullName), message)
	} else if (type === LogItemType.Warning) {
		$.log($.colors.bgCyan(logger.fullName), message)
	} else if (type === LogItemType.Error) {
		$.log($.colors.bgRed(logger.fullName), message)
	} else {
		if (error.kind) {
			if (error.kind === CompilerErrorType.CompileError) {
				const {files, options} = error as CompileError
				for (const file in files) {
					if (!error.files.hasOwnProperty(file))
						continue
					
					const errors = files[file]
					for (const errorItem of errors) {
						$.log(
							$.colors.bold("Error in"), 
							$.colors.bgRed(file), 
							$.colors.bold(`(${errorItem.line}):`), 
							$.colors.cyan(errorItem.code), 
							$.colors.bgBlack(errorItem.message))
					}
				}
		
				throw new $.PluginError("miva", `Failed to compile ${error.options.inFile}!`)
			} else if (error.kind === CompilerErrorType.CompilerRunError) {
				const {options, message: compilerMessage} = error as CompileError				
				$.log($.colors.bold("Failed to compile"), $.colors.bgRed(options.inFile), $.colors.bgBlack(compilerMessage))
				throw new $.PluginError("miva", `Failed to compile ${options.inFile}!`)
			}		
		}
		
		$.log(logger.fullName, message)
	}
}