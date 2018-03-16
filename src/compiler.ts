import {exec} from "child_process"
import {mkdir} from "shelljs"
import {dirname, join} from "path"
import {Logger} from "./logger"

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
	private readonly _logger: Logger
	
	public constructor(logger: Logger)  {
		this._logger = logger.createLogger("MivaCompiler")
	}
	
	public async compile(options: CompilerOptions) {
		const {inFile, outFile, builtinsDir, cwd} = options
		return new Promise((resolve, reject) => {
			const outDir = join(cwd || "./", dirname(outFile))
			this._logger.info(`Creating directory ${outDir}...`)
			mkdir("-p", dirname(join(cwd || "./", outFile)))

			const command = `mvc -o ${outFile} ${builtinsDir ? `-B ${builtinsDir}` : ""} ${inFile}`
			this._logger.info(`Running "${command}" in "${cwd || "./"}"...`)
			exec(command,
				{
					...(cwd ? {cwd} : {})
				},
				(err, stdout, stderr) => {
					if (err) {
						const out = stdout.toString()
						const errorMessages = parseMivaCompilerErrors(stdout)

						if (Object.keys(errorMessages).length) {
							// There was output, so the compiler ran and returned errors...

							const errorData = {
								kind: CompilerErrorType.CompileError,
								options,
								files: errorMessages
							}

							this._logger.error(`Could not compile ${inFile}!`, errorData)
							reject(errorData)
						} else {
							// there was no output, so the compiler failed to run
							const errorData = {
								kind: CompilerErrorType.CompilerRunError,
								message: out || err,
								options
							}

							this._logger.error(`Could not compile ${inFile}!`, errorData)
							reject(errorData)
						}

						return
					}

					this._logger.info(stdout.toString())
					resolve(stdout.toString())
				})
		})
	}
}
