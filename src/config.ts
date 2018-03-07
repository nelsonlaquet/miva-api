import {readFileSync, existsSync, readSync} from "fs"

export interface ConfigOptions {
	username: string
	password: string
	storeUrl: string
	storeCode: string
}

export class Config {
	public get username() { return this._username }
	public get password() { return this._password }
	public get storeUrl() { return this._storeUrl }
	public get storeCode() { return this._storeCode }

	private _username: string
	private _password: string
	private _storeUrl: string
	private _storeCode: string

	public constructor(config: Partial<ConfigOptions>) {
		this._username = ""
		this._password = ""
		this._storeUrl = ""
		this._storeCode = "1111"
		this.addObject(config)
	}

	public addEnv(prefix: string = "") {
		this._username = process.env[prefix + "USERNAME"] || this._username
		this._password = process.env[prefix + "PASSWORD"] || this._password
		this._storeUrl = process.env[prefix + "STORE_URL"] || this._storeUrl
		this._storeCode = process.env[prefix + "STORE_CODE"] || this._storeUrl
		return this
	}

	public addObject({username, password, storeUrl, storeCode}: Partial<ConfigOptions> = {}) {
		this._username = username || this._username
		this._password = password || this._password
		this._storeUrl = storeUrl || this._storeUrl
		this._storeCode = storeCode || this._storeCode
		return this
	}

	public addFile(file: string, isRequired: boolean = true) {
		if (!existsSync(file)) {
			if (isRequired)
				throw new Error(`Can't read from file "${file}, it doesn't exist!"`)

			return this
		}
		
		return this.addObject(JSON.parse(readFileSync(file).toString()))
	}
}