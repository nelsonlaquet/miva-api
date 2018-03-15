import {exec} from "child_process"
import {mkdir} from "shelljs"
import {dirname} from "path"

export interface CompilerOptions {
	inFile: string
	outFile: string
	builtinsDir: string
	cwd: string
}

export enum CompilerErrorType {
	CompilerRunError,
	CompileError
}

export interface CompilerRunError {
	kind: CompilerErrorType.CompilerRunError
	options: CompilerOptions
	message: string
}

export interface CompileError {
	kind: CompilerErrorType.CompileError
	options: CompilerOptions
	files: CompileFiles
	message: string
}

export interface CompileFiles {[file: string]: CompileErrorMessage[]}

export interface CompileErrorMessage {
	file: string
	line: number
	message: string
	code: string
}

const MivaCompilerErrorRegex = /(.*)?\:(\d+): (\w+): (.+?)$/gm
export function parseMivaCompilerErrors(compilerOutput: string): CompileFiles {
	const retVal: CompileFiles = {}

	let matches: RegExpExecArray | null
	while ((matches = MivaCompilerErrorRegex.exec(compilerOutput)) !== null) {
		const [, file, line, code, message] = matches
		const fileObject = retVal[file] || (retVal[file] = [])
		fileObject.push({
			file,
			line: parseInt(line, 10),
			message,
			code
		})
	}

	return retVal
}

export class MivaCompiler {
	public async compile(options: CompilerOptions) {
		const {inFile, outFile, builtinsDir, cwd} = options
		return new Promise((resolve, reject) => {
			mkdir("-p", dirname(outFile))
			exec(
				`mvc -o ${outFile} ${builtinsDir ? `-B ${builtinsDir}` : ""} ${inFile}`,
				{
					...(cwd ? {cwd} : {})
				},
				(err, stdout, stderr) => {
					if (err) {
						const out = stdout.toString()
						const errorMessages = parseMivaCompilerErrors(stdout)

						if (Object.keys(errorMessages).length) {
							// There was output, so the compiler ran and returned errors...
							reject({
								kind: CompilerErrorType.CompileError,
								options,
								files: errorMessages
							})
						} else {
							// there was no output, so the compiler failed to run
							reject({
								kind: CompilerErrorType.CompilerRunError,
								message: out || err,
								options
							})
						}

						return
					}

					resolve(stdout.toString())
				})
		})
	}
}
