"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
const fs_1 = require("fs");
const path_1 = require("path");
const node_fetch_1 = require("node-fetch");
const FormData = require("form-data");
const map = require("lodash/map");
class MivaAdmin {
    constructor(config, logger = null) {
        this._config = config;
        this._logger = logger || new logger_1.Logger("Miva Admin");
        this._loggerSignIn = this._logger.createLogger("Sign In");
        this._loggerUpload = this._logger.createLogger("Module Upload");
    }
    get logger() { return this._logger; }
    setSessionId(sessionId) {
        this._sessionId = sessionId;
    }
    async uploadModule(moduleCode, modulePath) {
        this._loggerUpload.info(`Uploading ${modulePath} to ${moduleCode}...`);
        const form = new FormData();
        form.append("Session_Type", "admin");
        form.append("Username", this._config.username);
        form.append("Password", this._config.password);
        form.append("Screen", "FUPL");
        form.append("Action", "FUPL");
        form.append("Tab", "");
        form.append("Have_Fields", "");
        form.append("FileUpload_Form", "MODS");
        form.append("FileUpload_Field", "Module_Module");
        form.append("FileUpload_Type", "Module");
        form.append("FileUpload_Data", moduleCode);
        form.append("FileUpload_Overwrite", "Yes");
        form.append("FileUpload_File", fs_1.createReadStream(modulePath), {
            filename: path_1.basename(modulePath),
            contentType: "application/octet-stream"
        });
        form.append("mm9_imagepicker_imagepath_path_input", "");
        form.append("GeneratedImage_Width", "");
        form.append("GeneratedImage_Height", "");
        const response = await this._postForm(MivaAdmin._adminPath, {}, form, false);
        const body = await response.text();
        const errorMatch = /onload="FieldError\(.*?'\w+', '(.*?)'/.exec(body);
        if (errorMatch) {
            this._loggerUpload.error(`Could not upload module ${moduleCode}: ${errorMatch[1]}`);
            throw new Error(`Could not upload module ${moduleCode}: ${errorMatch[1]}`);
        }
        if (body.indexOf("Sign In") !== -1) {
            this._loggerUpload.warn("You were signed out!");
            throw new Error("You were signed out!");
        }
        if (!/window\.close\(\);\s*\<\/script>/.test(body)) {
            if (/Insufficient Concurrent User Licenses/.test(body)) {
                this._loggerUpload.error(`Could not upload ${modulePath} to ${moduleCode}, Insufficient Concurrent User Licenses!`);
            }
            else {
                this._loggerUpload.error(`Could not upload ${modulePath} to ${moduleCode}!`);
                console.log(body);
            }
        }
        else {
            this._loggerUpload.info(`Uploaded ${moduleCode}!`);
        }
    }
    async updateModule(moduleCode, modulePath) {
        this._loggerUpload.info(`Updating ${moduleCode}...`);
        const form = new FormData();
        form.append("ItemModified", 0);
        form.append("Have_Fields", "");
        form.append("Action", "UMOD");
        form.append("Button_AddMultiple", 0);
        form.append("Edit_Module", moduleCode);
        form.append("Module_Active", 1);
        form.append("Module_Module", `modules/util/${path_1.basename(modulePath)}`);
        const response = await this._postForm(MivaAdmin._adminPath, {}, form);
        const body = await response.text();
        if (body.indexOf("Sign In") !== -1) {
            this._loggerUpload.warn("You were signed out!");
            throw new Error("You were signed out!");
        }
        this._loggerUpload.info(`Updated ${moduleCode}!`);
    }
    async json(func, querystring, form) {
        const url = this._buildUrl(`/mm5/json.mvc`, Object.assign({}, querystring, { Store_Code: this._config.storeCode, Function: func, Session_Type: "admin", r: Math.floor(Math.random() * 1000) }));
        const result = await node_fetch_1.default(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            credentials: "same-origin",
            body: toUrlEncoded(Object.assign({}, (form || {}), (this._sessionId ? { Session_Id: this._sessionId } : {})))
        });
        const jsonResponse = await result.json();
        return jsonResponse;
    }
    async moduleJson(moduleCode, func, querystring, form) {
        return this.json("Module", Object.assign({}, (querystring || {}), { Module_Code: moduleCode, Module_Function: func, Session_Type: "admin" }), form);
    }
    _postForm(path, querystring, form, provideCredentials = true) {
        const url = this._buildUrl(path, querystring);
        if (!this._sessionId && provideCredentials) {
            form.append("Username", this._config.username);
            form.append("Password", this._config.password);
            form.append("Session_Type", "admin");
        }
        this._logger.info(`POST: '${url}'`);
        return node_fetch_1.default(url, {
            method: "POST",
            body: form
        });
    }
    _buildUrl(url, querystring) {
        const queryStringParts = this._sessionId ? [] : ["temporarysession=1"];
        for (const queryName in querystring) {
            if (!querystring.hasOwnProperty(queryName))
                continue;
            const queryValue = querystring[queryName];
            queryStringParts.push(`${queryName}=${encodeURIComponent(queryValue)}`);
        }
        return url.startsWith("http://") || url.startsWith("https://")
            ? `${url}${url.indexOf("?") === -1 ? "?" : ""}${queryStringParts.join("&")}`
            : `${this._config.storeUrl}${url}${url.indexOf("?") === -1 ? "?" : ""}${queryStringParts.join("&")}`;
    }
}
MivaAdmin._adminPath = "/mm5/admin.mvc";
exports.MivaAdmin = MivaAdmin;
function toUrlEncoded(form) {
    return map(form, (value, key) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
}
//# sourceMappingURL=admin.js.map