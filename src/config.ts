import {readFileSync, existsSync, readSync} from "fs"

const isNil = require("lodash/isNil")

export interface ConfigOptions {
	username: string
	password: string
	storeUrl: string
	storeCode: string
	jsonUrl: string
}

export default class Config {
	public get values() { return this._config }
	private _config: ConfigOptions

	public constructor(config: Partial<ConfigOptions>) {
		this._config = {
			username: "",
			password: "",
			storeUrl: "",
			storeCode: "",
			jsonUrl: ""
		}
		
		this.addObject(config)
	}

	public addEnv(prefix: string = "") {
		this.addObject({
			username: process.env[prefix + "USERNAME"],
			password: process.env[prefix + "PASSWORD"],
			storeUrl: process.env[prefix + "STORE_URL"],
			storeCode: process.env[prefix + "STORE_CODE"],
			jsonUrl: process.env[prefix + "JSON_URL"]
		})

		return this
	}

	public addObject(options: Partial<ConfigOptions> = {}) {
		this._config = {...this._config, ...options}
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