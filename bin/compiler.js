"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const shelljs_1 = require("shelljs");
const path_1 = require("path");
const types_1 = require("./types");
const MivaCompilerErrorRegex = /(.*)?\:(\d+): (\w+): (.+?)$/gm;
function parseMivaCompilerErrors(compilerOutput) {
    const retVal = {};
    let matches;
    while ((matches = MivaCompilerErrorRegex.exec(compilerOutput)) !== null) {
        const [, file, line, code, message] = matches;
        const fileObject = retVal[file] || (retVal[file] = []);
        fileObject.push({
            file,
            line: parseInt(line, 10),
            message,
            code
        });
    }
    return retVal;
}
exports.parseMivaCompilerErrors = parseMivaCompilerErrors;
class MivaCompiler {
    constructor(logger) {
        this._logger = logger.createLogger("MivaCompiler");
    }
    async compile(options) {
        const { inFile, outFile, builtinsDir, cwd, defines } = options;
        return new Promise((resolve, reject) => {
            const outDir = path_1.join(cwd || "./", path_1.dirname(outFile));
            this._logger.info(`Creating directory ${outDir}...`);
            shelljs_1.mkdir("-p", path_1.dirname(path_1.join(cwd || "./", outFile)));
            const command = `mvc ${defines ? defines.map(symbol => `-D ${symbol}`).join(" ") : ""} -o ${outFile} ${builtinsDir ? `-B ${builtinsDir}` : ""} ${inFile}`;
            this._logger.info(`Running "${command}" in "${cwd || "./"}"...`);
            child_process_1.exec(command, Object.assign({}, (cwd ? { cwd } : {})), (err, stdout, stderr) => {
                if (err) {
                    const out = stdout.toString();
                    const errorMessages = parseMivaCompilerErrors(stdout);
                    if (Object.keys(errorMessages).length) {
                        // There was output, so the compiler ran and returned errors...
                        const errorData = {
                            kind: types_1.CompilerErrorType.CompileError,
                            options,
                            files: errorMessages
                        };
                        this._logger.error(`Could not compile ${inFile}!`, errorData);
                        reject(new Error(out));
                    }
                    else {
                        // there was no output, so the compiler failed to run
                        const errorData = {
                            kind: types_1.CompilerErrorType.CompilerRunError,
                            message: out || err,
                            options
                        };
                        this._logger.error(`Could not compile ${inFile}!`, errorData);
                        reject(new Error(out));
                    }
                    return;
                }
                this._logger.info(stdout.toString());
                resolve(stdout.toString());
            });
        });
    }
}
exports.MivaCompiler = MivaCompiler;
//# sourceMappingURL=compiler.js.map