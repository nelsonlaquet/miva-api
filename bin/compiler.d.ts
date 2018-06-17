import { Logger } from "./logger";
import { CompileFiles, CompilerOptions } from "./types";
export declare function parseMivaCompilerErrors(compilerOutput: string): CompileFiles;
export declare class MivaCompiler {
    private readonly _logger;
    constructor(logger: Logger);
    compile(options: CompilerOptions): Promise<{}>;
}
