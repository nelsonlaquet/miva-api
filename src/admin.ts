import Config from "./config"
import { Logger, LogItem, LogItemType } from "./logger"
import { createReadStream } from "fs"
import { basename, dirname } from "path"
import fetch, { Response } from "node-fetch"
import * as FormData from "form-data"

const map = require("lodash/map")

export interface MivaResponse<TResult> {
	success: boolean,
	data: TResult,
	error_code?: string
	error_message?: string
}

export default class MivaAdmin {
	public static ADMIN_PATH = "/mm5/admin.mvc"
	
	public get logger() { return this._logger }
	public get config() { return this._config }

	private _logger: Logger
	private _sessionId?: string
	private _config: Config

	constructor(
		config: Config,
		logger: Logger | null = null
	) {
		this._config = config
		this._logger = logger || new Logger("Miva Admin")
	}

	public setSessionId(sessionId: string) {
		this._sessionId = sessionId
	}

	public async json<ResponseType>(func: string, form?: { [name: string]: string }): Promise<MivaResponse<ResponseType>> {
		const url = this._buildUrl(`/mm5/json.mvc`, {
			Store_Code: this._config.values.storeCode,
			Function: func,
			Session_Type: "admin",
			r: Math.floor(Math.random() * 1000)
		})

		const result = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			credentials: "same-origin",
			body: toUrlEncoded({
				...(form || {}),
				...(this._sessionId ? {Session_Id: this._sessionId} : {})
			})
		} as any)

		const jsonResponse = await result.json()
		return jsonResponse as MivaResponse<ResponseType>
	}

	public async moduleJson<ResponseType>(moduleCode: string, func: string, form?: { [name: string]: string }): Promise<MivaResponse<ResponseType>> {
		return this.json<ResponseType>("Module", {
			Module_Code: moduleCode,
			Module_Function: func,
			Session_Type: "admin",
			...form
		})
	}

	public async post(path: string, form: FormData = new FormData()): Promise<MivaResponse<string>> {
		const url = this._buildUrl(path)
		form.append("Session_Type", "admin")
		form.append("Username", this._config.values.username)
		form.append("Password", this._config.values.password)

		this._logger.info(`POST: "${url}"`)
		const response = await fetch(url, {
			method: "POST",
			body: form
		})
		
		this._logger.info(`POST: "${url}" (${response.status} / ${response.statusText})`)
		const body = await response.text()

		if (body.indexOf("Sign In") !== -1)
			return { success: false, data: body, error_code: "miva-api/admin", error_message: "You were signed out!" }
		else if (/Insufficient Concurrent User Licenses/.test(body))
			return { success: false, data: body, error_code: "miva-api/admin", error_message: "Insufficient Concurrent User Licenses" }

		return { success: true, data: body }
	}

	private _buildUrl(url: string, querystring: { [name: string]: any } = {}) {
		const queryStringParts = this._sessionId ? [] : ["temporarysession=1"]
		for (const queryName in querystring) {
			if (!querystring.hasOwnProperty(queryName))
				continue

			const queryValue = querystring[queryName]
			queryStringParts.push(`${queryName}=${encodeURIComponent(queryValue)}`)
		}

		return url.startsWith("http://") || url.startsWith("https://")
			? `${url}${url.indexOf("?") === -1 ? "?" : ""}${queryStringParts.join("&")}`
			: `${this._config.values.storeUrl}${url}${url.indexOf("?") === -1 ? "?" : ""}${queryStringParts.join("&")}`
	}
}

function toUrlEncoded(form: { [name: string]: string }) {
	return map(form, (value: any, key: any) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&")
}