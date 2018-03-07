export class Config {
	public get username() { return this._username }
	public get password() { return this._password }
	public get storeUrl() { return this._storeUrl }
	public get storeCode() { return this._storeCode }

	private _username: string
	private _password: string
	private _storeUrl: string
	private _storeCode: string

	public constructor() {
		this._username = ""
		this._password = ""
		this._storeUrl = ""
		this._storeCode = "1111"
	}

	public addEnv(prefix: string = "") {
		this._username = process.env[prefix + "USERNAME"] || this._username
		this._password = process.env[prefix + "PASSWORD"] || this._password
		this._storeUrl = process.env[prefix + "STORE_URL"] || this._storeUrl
		this._storeCode = process.env[prefix + "STORE_CODE"] || this._storeUrl
		return this
	}
}