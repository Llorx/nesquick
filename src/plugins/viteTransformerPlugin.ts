import * as TS from "typescript";

import { transformer } from "../cli/transformer";

export const viteTransformerPlugin = {
    name: "nesquick-transformer",
    enforce: "pre" as const,
    transform(code:string, id:string) {
        if (id.endsWith(".ts") || id.endsWith(".tsx")) {
            const result = TS.transpileModule(code, {
                compilerOptions: {
                    target: TS.ScriptTarget.ESNext,
                    module: TS.ModuleKind.ESNext,
                    jsx: TS.JsxEmit.Preserve,
                },
                transformers: {
                    before: [ transformer ],
                },
                fileName: id
            });
            return {
                code: result.outputText,
                map: result.sourceMapText ? JSON.parse(result.sourceMapText) : null
            };
        }
    }
};