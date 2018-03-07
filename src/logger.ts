export enum LogItemType {
	Info,
	Warning,
	Error
}

export interface LogItem {
	type: LogItemType
	message: string
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

	public info(message: string) {
		this.log({type: LogItemType.Info, message})
	}

	public warn(message: string) {
		this.log({type: LogItemType.Warning, message})
	}

	public error(message: string) {
		this.log({type: LogItemType.Error, message})
	}
}