import { Config } from "./config"
import { Logger, LogItem, LogItemType } from "./logger"
import { createReadStream } from "fs"
import { basename } from "path"
import fetch, {Response} from "node-fetch"
import * as FormData from "form-data"

export interface JsonResponse<TResult> {
	success: boolean,
	data: TResult,
	error_code?: string
	error_message?: string
}

export class MivaAdmin {
	private static _adminPath = "/mm5/admin.mvc"
	
	public get logger() { return this._logger }

	private _logger: Logger
	private _loggerSignIn: Logger
	private _sessionId?: string
	private _config: Config
	private _loggerUpload: Logger

	constructor(
		config: Config,
		logger: Logger | null = null
	) {
		this._config = config
		this._logger = logger || new Logger("Miva Admin")
		this._loggerSignIn = this._logger.createLogger("Sign In")
		this._loggerUpload = this._logger.createLogger("Module Upload")
	}

	public setSessionId(sessionId: string) {
		this._sessionId = sessionId
	}

	public async uploadModule(moduleCode: string, modulePath: string): Promise<any> {
		this._loggerUpload.info(`Uploading ${modulePath} to ${moduleCode}...`)
		const form = new FormData()
		form.append("Screen", "FUPL")
		form.append("Action", "FUPL")
		form.append("Tab", "")
		form.append("Have_Fields", "")
		form.append("Store_Code", this._config.storeCode)
		form.append("FileUpload_Form", "MODS")
		form.append("FileUpload_Field", "Module_Module")
		form.append("FileUpload_Type", "Module")
		form.append("FileUpload_Data", moduleCode)
		form.append("FileUpload_Overwrite", "Yes")
		form.append("mm9_imagepicker_imagepath_path_input", "")
		form.append("GeneratedImage_Width", "")
		form.append("GeneratedImage_Height", "")
		form.append("FileUpload_File", createReadStream(modulePath), {
			filename: basename(modulePath), 
			contentType: "application/octet-stream"
		})
		const response = await this._postForm(MivaAdmin._adminPath, {}, form)
		const body = await response.text()

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
		const form = new FormData()
		form.append("ItemModified", 0)
		form.append("Have_Fields", "")
		form.append("Action", "UMOD")
		form.append("Button_AddMultiple", 0)
		form.append("Edit_Module", moduleCode)
		form.append("Module_Active", 1)
		form.append("Module_Module", `modules/util/${basename(modulePath)}`)
		const response = await this._postForm(MivaAdmin._adminPath, {}, form)
		const body = await response.text()
	
		if (body.indexOf("Sign In") !== -1) {
			this._loggerUpload.warn("You were signed out!")
			throw new Error("You were signed out!")
		}

		this._loggerUpload.info(`Updated ${moduleCode}!`)
	}

	public async getJson<ResponseType>(func: string, querystring?: {[name: string]: string}): Promise<JsonResponse<ResponseType>> {
		const url = this._buildUrl(`/mm5/json.mvc`, {
			...querystring, 
			Store_Code: this._config.storeCode, 
			Function: func,
			Session_Type: "admin"
		})

		const result = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			credentials: "same-origin",
			body: `Session_Id=${this._sessionId}`
		} as any)

		const jsonResponse = await result.json()
		return jsonResponse as JsonResponse<ResponseType>
	}

	public async getModuleJson<ResponseType>(moduleCode: string, func: string, querystring?: {[name: string]: string}): Promise<JsonResponse<ResponseType>> {
		return this.getJson<ResponseType>("Module", {
			Module_Code: moduleCode, 
			Module_Function: func,
			Session_Type: "admin"
		})
	}

	private _postForm(path: string, querystring: {[name: string]: string}, form: FormData): Promise<Response> {
		const url = this._buildUrl(path, querystring)

		if (!this._sessionId) {
			form.append("Username", this._config.username)
			form.append("Password", this._config.password)
		}
		
		this._logger.info(`POST: '${url}' with keys ${Object.keys(form)}`)

		return fetch(url, {
			method: "POST",
			body: form
		})
	}

	private _buildUrl(url: string, querystring: {[name: string]: any}) {
		const queryStringParts = this._sessionId ? [] : ["temporarysession=1"]
		for (const queryName in querystring) {
			if (!querystring.hasOwnProperty(queryName))
				continue

			const queryValue = querystring[queryName]
			queryStringParts.push(`${queryName}=${encodeURIComponent(queryValue)}`)
		}
		
		return url.startsWith("http://") || url.startsWith("https://")
			? `${url}${url.indexOf("?") === -1 ? "?" : ""}${queryStringParts.join("&")}`
			: `${this._config.storeUrl}${url}${url.indexOf("?") === -1 ? "?" : ""}${queryStringParts.join("&")}`
	}
}