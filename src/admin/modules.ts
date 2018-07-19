import * as FormData from "form-data"
import { createReadStream } from "fs"
import { basename } from "path"
import MivaAdmin, {MivaResponse} from "../admin"

export async function upload(admin: MivaAdmin, moduleCode: string, modulePath: string): Promise<MivaResponse<any>> {
	const form = new FormData()
	form.append("Session_Type", "admin")
	form.append("Username", admin.config.values.username)
	form.append("Password", admin.config.values.password)

	form.append("Screen", "FUPL")	
	form.append("Action", "FUPL")
	form.append("Tab", "")
	form.append("Have_Fields", "")
	form.append("FileUpload_Form", "MODS")
	form.append("FileUpload_Field", "Module_Module")
	form.append("FileUpload_Type", "Module")
	form.append("FileUpload_Data", moduleCode)
	form.append("FileUpload_Overwrite", "Yes")
	form.append("FileUpload_File", createReadStream(modulePath), {
		filename: basename(modulePath),
		contentType: "application/octet-stream"
	})
	
	form.append("mm9_imagepicker_imagepath_path_input", "")
	form.append("GeneratedImage_Width", "")
	form.append("GeneratedImage_Height", "")

	const response = await admin.post(MivaAdmin.ADMIN_PATH, form)
	if (!response.success) {
		admin.logger.error(`Could not upload module "${moduleCode}": ${response.error_message}`)
		return response
	}
	
	const {data: body} = response
	const errorMatch = /onload="FieldError\(.*?'\w+', '(.*?)'/.exec(body)
	if (errorMatch) {
		const message = `Could not upload module "${moduleCode}": ${errorMatch[1]}`
		admin.logger.error(message)
		return { success: false, data: null, error_code: "miva-api/admin/uploadModule", error_message: message }
	}

	if (!/window\.close\(\);\s*\<\/script>/.test(body)) {
		const message = `Could not upload module "${moduleCode}": Unknown Error`
		admin.logger.error(message)
		return { success: false, data: null, error_code: "miva-api/admin/uploadModule", error_message: message }
	}

	admin.logger.info(`Uploaded module "${moduleCode}"`)
	return { success: true, data: null }
}

export async function update(admin: MivaAdmin, moduleCode: string, modulePath: string): Promise<MivaResponse<any>> {
	admin.logger.info(`Updating ${moduleCode}...`)

	const form = new FormData()
	form.append("ItemModified", 0)
	form.append("Have_Fields", "")
	form.append("Action", "UMOD")
	form.append("Button_AddMultiple", 0)
	form.append("Edit_Module", moduleCode)
	form.append("Module_Active", 1)
	form.append("Module_Module", `modules/util/${basename(modulePath)}`)
	
	const response = await admin.post(MivaAdmin.ADMIN_PATH, form)
	if (!response.success) {
		admin.logger.error(`Could not update module "${moduleCode}": ${response.error_message}`)
		return response
	}
	
	admin.logger.info(`Updated module "${moduleCode}"`)
	return { success: true, data: null }
}