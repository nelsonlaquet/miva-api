export interface CompilerOptions {
	inFile: string
	outFile: string
	builtinsDir: string
	cwd: string,
	defines: string[]
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
