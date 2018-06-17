"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
class Config {
    get username() { return this._username; }
    get password() { return this._password; }
    get storeUrl() { return this._storeUrl; }
    get storeCode() { return this._storeCode; }
    get jsonUrl() { return this._jsonUrl; }
    constructor(config) {
        this._username = "";
        this._password = "";
        this._storeUrl = "";
        this._storeCode = "1111";
        this._jsonUrl = "";
        this.addObject(config);
    }
    addEnv(prefix = "") {
        this._username = process.env[prefix + "USERNAME"] || this._username;
        this._password = process.env[prefix + "PASSWORD"] || this._password;
        this._storeUrl = process.env[prefix + "STORE_URL"] || this._storeUrl;
        this._storeCode = process.env[prefix + "STORE_CODE"] || this._storeCode;
        this._jsonUrl = process.env[prefix + "JSON_URL"] || this._jsonUrl;
        return this;
    }
    addObject({ username, password, storeUrl, storeCode, jsonUrl } = {}) {
        this._username = username || this._username;
        this._password = password || this._password;
        this._storeUrl = storeUrl || this._storeUrl;
        this._storeCode = storeCode || this._storeCode;
        this._jsonUrl = jsonUrl || this._jsonUrl;
        return this;
    }
    addFile(file, isRequired = true) {
        if (!fs_1.existsSync(file)) {
            if (isRequired)
                throw new Error(`Can't read from file "${file}, it doesn't exist!"`);
            return this;
        }
        return this.addObject(JSON.parse(fs_1.readFileSync(file).toString()));
    }
}
exports.Config = Config;
//# sourceMappingURL=config.js.map