import { CompileError, CompilerErrorType } from "../compiler"
import $ from "../optional/gulp-util"

export default function format(error: CompileError) {
	if (error.kind === CompilerErrorType.CompileError) {
		for (const file in error.files) {
			if (!error.files.hasOwnProperty(file))
				continue
			
			const errors = error.files[file]
			$.log($.colors.bold("Error in"), $.colors.bgRed(file))
			for (const errorItem of errors) {
				$.log($.colors.bold(`(${errorItem.line}):`), $.colors.cyan(errorItem.code), $.colors.bgBlack(errorItem.message))
			}
		}

		throw new $.PluginError("miva", `Failed to compile ${error.options.inFile}!`)
	} else if (error.kind === CompilerErrorType.CompilerRunError) {
		$.log($.colors.bold("Failed to compile"), $.colors.bgRed(error.options.inFile))
		$.log($.colors.bgBlack(error.message))
		throw new $.PluginError("miva", `Failed to compile ${error.options.inFile}!`)
	} else {
		throw new $.PluginError("miva", error)
	}
}