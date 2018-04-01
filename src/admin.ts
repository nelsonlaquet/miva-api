import { Config } from "./config"
import {CookieJar, RequestAPI, RequestCallback, Response} from "request"
import * as request from "request-promise-native"
import { Logger, LogItem, LogItemType } from "./logger"
import { createReadStream } from "fs"
import { basename } from "path"

export interface JsonResponse<TResult> {
	success: boolean,
	data: TResult
}

export class MivaAdmin {
	public get logger() { return this._logger }

	private _logger: Logger
	private _loggerSignIn: Logger
	private _loggerUpload: Logger
	private _request: RequestAPI<any, any, any>
	private _sessionId?: string
	private _config: Config
	
	constructor(
		config: Config,
		logger: Logger | null = null
	) {
		this._config = config
		this._logger = logger || new Logger("Miva Admin")
		this._loggerSignIn = this._logger.createLogger("Sign In")
		this._loggerUpload = this._logger.createLogger("Module Upload")
		this._request = request.defaults({
			simple: true,
			followAllRedirects: true,
			followRedirect: true
		})
	}

	public setSessionId(sessionId: string) {
		this._sessionId = sessionId
	}

	public async uploadModule(moduleCode: string, modulePath: string): Promise<any> {
		this._loggerUpload.info(`Uploading ${modulePath} to ${moduleCode}...`)
		const response = this._doAdminRequest("", {}, {
			Screen: "FUPL",
			Action: "FUPL",
			Tab: "",
			Have_Fields: "",
			Store_Code: this._config.storeCode,
			FileUpload_Form: "MODS",
			FileUpload_Field: "Module_Module",
			FileUpload_Type: "Module",
			FileUpload_Data: moduleCode,
			FileUpload_Overwrite: "Yes",
			FileUpload_File: {
				value: createReadStream(modulePath),
				options: {
					filename: basename(modulePath),
					contentType: "application/octet-stream"
				}
			},
			mm9_imagepicker_imagepath_path_input: "",
			GeneratedImage_Width: "",
			GeneratedImage_Height: ""
		})

		const body = await response
		const errorMatch = /onload="FieldError\(.*?'\w+', '(.*?)'/.exec(body)
		if (errorMatch) {
			this._loggerUpload.error(`Could not upload module ${moduleCode}: ${errorMatch[1]}`)
			throw new Error(`Could not upload module ${moduleCode}: ${errorMatch[1]}`)
		}

		if (body.indexOf("Sign In") !== -1) {
			this._loggerUpload.warn("You were signed out!")
			throw new Error("You were signed out!")
		}

		if (!/window\.close\(\);\s*\<\/script>/.test(body)) {
			if (/Insufficient Concurrent User Licenses/.test(body)) {
				this._loggerUpload.error(`Could not upload ${modulePath} to ${moduleCode}, Insufficient Concurrent User Licenses!`)
			} else {
				this._loggerUpload.error(`Could not upload ${modulePath} to ${moduleCode}!`)
				console.log(body)
			}
		} else {
			this._loggerUpload.info(`Uploaded ${moduleCode}!`)
		}
	}

	public async updateModule(moduleCode: string, modulePath: string) {
		this._loggerUpload.info(`Updating ${moduleCode}...`)
		const body = await this._doAdminRequest("", {
			Screen: "MODS",
			Tab: "FILE"
		}, {
			ItemModified: 0,
			Have_Fields: "",
			Action: "UMOD",
			Button_AddMultiple: 0,
			Edit_Module: moduleCode,
			Module_Active: 1,
			Module_Module: `modules/util/${basename(modulePath)}`
		})
	
		if (body.indexOf("Sign In") !== -1) {
			this._loggerUpload.warn("You were signed out!")
			throw new Error("You were signed out!")
		}

		this._loggerUpload.info(`Updated ${moduleCode}!`)
	}

	public async json<ResponseType>(func: string, querystring?: {[name: string]: string}, form?: any): Promise<JsonResponse<ResponseType>> {
		return JSON.parse(await this._doRequest(`/mm5/json.mvc?Function=${func}`, querystring || {}, form || {})) as JsonResponse<ResponseType>
	}

	private _doRequest(path: string, querystring: {[name: string]: string}, form: any): Promise<string> {
		const queryStringParts = this._sessionId ? [] : ["temporarysession=1"]
		for (const queryName in querystring) {
			if (!querystring.hasOwnProperty(queryName))
				continue

			const queryValue = querystring[queryName]
			queryStringParts.push(`${queryName}=${encodeURIComponent(queryValue)}`)
		}

		const url = `${this._config.storeUrl}${path}?${queryStringParts.join("&")}`
		this._logger.info(`POST: '${url}' with keys ${Object.keys(form)}`)
		return this._request.post({
			url,
			formData: {
				Session_Type: "admin",
				...(this._sessionId ? {
					Session_ID: this._sessionId
				} : {
					UserName: this._config.username,
					Password: this._config.password
				}),
				Store_Code: this._config.storeCode,
				...form
			}
		})
	}

	private _doAdminRequest(path: string, querystring: {[name: string]: string}, form: any): Promise<string> {
		return this._doRequest(`/mm5/admin.mvc${path}`, querystring, form)
	}
}