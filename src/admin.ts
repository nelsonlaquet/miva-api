import { Config } from "./config"
import {CookieJar, RequestAPI} from "request"
import * as request from "request-promise-native"
import {Logger} from "./logger"
import { createReadStream } from "fs"
import { basename } from "path"

export class MivaAdmin {
	public get logger() { return this._logger }

	private _logger: Logger
	private _loggerSignIn: Logger
	private _loggerUpload: Logger
	private _request: RequestAPI<any, any, any>
	private _cookies: CookieJar
	private _sessionId: string | undefined
	
	constructor(
		private _config: Config,
		logger: Logger | null = null
	) {
		this._logger = logger || new Logger("Miva Admin")
		this._loggerSignIn = this._logger.createLogger("Sign In")
		this._loggerUpload = this._logger.createLogger("Module Upload")
		this._cookies = request.jar()
		this._request = request.defaults({
			jar: this._cookies,
			simple: true,
			followAllRedirects: true,
			followRedirect: true
		})
	}

	public async login(): Promise<any> {
		this._loggerSignIn.info("Logging in...")
		
		const response = this._request
			.post(this._getAdminUrl("?Screen=LRDR"))
			.form({
				UserName: this._config.username,
				Password: this._config.password
			})

		const body = await response;
		if (body.indexOf("Sign In") !== -1) {
			this._loggerSignIn.error("Could not sign in: invalid username or password")
			throw new Error("Could not sign in: invalid username or password")
		}

		const cookieSearch = this
			._cookies
			.getCookies(`${this._config.storeUrl}/mm5`).filter(cookie => cookie.key === "mm5-admin-session")

		if (cookieSearch.length < 1) {
			this._loggerSignIn.error(`Could not sign in: cookie "mm5-admin-session" not set`)
			throw new Error(`Could not sign in: cookie "mm5-admin-session" not set`)
		}

		const sessionRegex = /var Session_ID = '(.*?)'/.exec(body)
		if (!sessionRegex) {
			this._loggerSignIn.error(`Could not sign in: cookie "Session_ID" not set`)
			throw new Error(`Could not sign in: cookie "Session_ID" not set`)
		}

		this._sessionId = sessionRegex[1]
		this._loggerSignIn.info("Logged in!")
	}

	public async uploadModule(moduleCode: string, modulePath: string): Promise<any> {
		return this._loginRetry(async () => {
			this._loggerUpload.info(`Uploading ${modulePath} to ${moduleCode}...`)
			const response = this._request.post({
				url: this._getAdminUrl(""),
				formData: {
					Screen: "FUPL",
					Action: "FUPL",
					Tab: "",
					Have_Fields: "",
					Session_ID: this._sessionId,
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
				}
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

			this._loggerUpload.info(`Uploaded ${moduleCode}!`)
		})
	}

	public async updateModule(moduleCode: string, modulePath: string) {
		return this._loginRetry(async () => {
			this._loggerUpload.info(`Updating ${moduleCode}...`)
			const body = await this._request
				.post(this._getAdminUrl(`?Screen=MODS&Tab=FILE&Store_Code=${this._config.storeCode}`))
				.form({
					ItemModified: 0,
					Session_ID: this._sessionId,
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
		})
	}

	private async _loginRetry(func: (() => Promise<any>)): Promise<any> {
		try {
			if (!this._sessionId)
				await this.login()

			await func()
		} catch (e) {
			await this.login()
			await func()
		}
	}

	private _getAdminUrl(path: string) {
		return `${this._config.storeUrl}/mm5/admin.mvc${path}`
	}

	private _getJsonUrl(func: string) {
		return `${this._config.storeUrl}/mm5/json.mvc?Store_Code=&Function=${func}`
	}
}