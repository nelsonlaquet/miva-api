import * as FormData from "form-data"
import { createReadStream } from "fs"
import { basename } from "path"
import MivaAdmin, { MivaResponse } from "../admin"

export async function upload(
	admin: MivaAdmin,
	moduleCode: string,
	modulePath: string
): Promise<MivaResponse<any>> {
	const form = new FormData()

	form.append("FileUpload_File", createReadStream(modulePath), {
		filename: basename(modulePath)
	})

	const response = await admin.moduleFile(
		"UploadModule",
		"spocustom",
		{
			TargetModule: moduleCode
		},
		form
	)
	if (!response.success)
		admin.logger.error(
			`Uploaded module "${moduleCode}" failed: [${response.error_code}] ${
				response.error_message
			}`
		)
	else admin.logger.info(`Uploaded module "${moduleCode}"`)

	return { success: true, data: null }
}

export function update(): Promise<MivaResponse<any>> {
	return Promise.resolve({ success: true, data: null })
}
