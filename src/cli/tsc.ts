import * as TS from "typescript";

import { getProject } from "./processArgv";

export type CompileOptions = {
    argv:string[];
    cwd:string;
    transformers?:TS.CustomTransformers;
};

export function tsc(options:CompileOptions) {
    const oldDir = process.cwd();
    try {
        if (options.cwd !== oldDir) {
            process.chdir(options.cwd);
        }
        let project = getProject(options.argv);
        if (project == null) {
            const configPath = TS.findConfigFile(
                options.cwd,
                TS.sys.fileExists,
                "tsconfig.json"
            );
            if (configPath != null) {
                project = configPath;
            }
        }
        if (!project) {
            throw new Error("tsconfig.json not found");
        }
        const res = TS.readConfigFile(project, TS.sys.readFile);
        const formatHost:TS.FormatDiagnosticsHost = {
            getCanonicalFileName: f => f,
            getCurrentDirectory: TS.sys.getCurrentDirectory,
            getNewLine: () => TS.sys.newLine,
        };
        if (res.error) {
            console.error(TS.formatDiagnosticsWithColorAndContext([res.error], formatHost));
            throw new Error(`Error reading ${project}`);
        } else if (res.config == null) {
            throw new Error(`Error reading ${project}`);
        } else {
            const jsonConfig = TS.parseJsonConfigFileContent(res.config, TS.sys, options.cwd, {}, project);
            const program = TS.createProgram({
                options: jsonConfig.options,
                rootNames: jsonConfig.fileNames,
                configFileParsingDiagnostics: jsonConfig.errors
            });
            const preDiagnostics = TS.getPreEmitDiagnostics(program);
            const programEmit = program.emit(void 0, void 0, void 0, void 0, options.transformers);
            const allDiagnostics = [...preDiagnostics, ...programEmit.diagnostics, ...jsonConfig.errors];
            if (allDiagnostics.length) {
                console.error(TS.formatDiagnosticsWithColorAndContext(allDiagnostics, formatHost));
                throw new Error(`Error compiling project`);
            }
        }
    } finally {
        if (options.cwd !== oldDir) {
            process.chdir(oldDir);
        }
    }
}