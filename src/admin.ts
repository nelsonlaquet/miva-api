import { Config } from "./config"
import {CookieJar, RequestAPI} from "request"
import * as request from "request-promise-native"
import { Logger, LogItem, LogItemType } from "./logger"
import { createReadStream } from "fs"
import { basename } from "path"
import $ from "./optional/gulp-util"

export class MivaAdmin {
	public get logger() { return this._logger }

	private _logger: Logger
	private _loggerSignIn: Logger
	private _loggerUpload: Logger
	private _request: RequestAPI<any, any, any>
	
	constructor(
		private _config: Config,
		logger: Logger | null = null
	) {
		this._logger = logger || new Logger("Miva Admin")
		this._loggerSignIn = this._logger.createLogger("Sign In")
		this._loggerUpload = this._logger.createLogger("Module Upload")
		this._request = request.defaults({
			simple: true,
			followAllRedirects: true,
			followRedirect: true
		})
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

	private _doRequest(path: string, querystring: {[name: string]: string}, form: any) {
		const queryStringParts = ["temporarysession=1"]
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
				UserName: this._config.username,
				Password: this._config.password,
				Store_Code: this._config.storeCode,
				Session_Type: "admin",
				...form
			}
		})
	}

	private _doAdminRequest(path: string, querystring: {[name: string]: string}, form: any) {
		return this._doRequest(`/mm5/admin.mvc${path}`, querystring, form)
	}

	private _doJsonRequest(func: string, querystring: {[name: string]: string}, form: any) {
		return this._doRequest(`/mm5/json.mvc?Function=${func}`, querystring, form)
	}
}

export function formatLog(logger: Logger, {type, message}: LogItem) {
	if (type === LogItemType.Info) {
		$.log($.colors.bgBlack(logger.fullName), message)
	} else if (type === LogItemType.Warning) {
		$.log($.colors.bgCyan(logger.fullName), message)
	} else if (type === LogItemType.Error) {
		$.log($.colors.bgRed(logger.fullName), message)
	} else {
		$.log(logger.fullName, message)
	}
}