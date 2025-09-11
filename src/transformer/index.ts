/*import * as TS from "typescript";

export default function(_program:TS.Program, _pluginConfig:PluginConfig, { ts }:TransformerExtras) {
    return (ctx:TS.TransformationContext) => {
        return (sourceFile:TS.SourceFile) => {
            function visit(node:TS.Node):TS.Node {
                console.log(node);
                if (ts.isStringLiteral(node) && node.text === 'before') {
                    return ctx.factory.createStringLiteral('after');
                }
                return ts.visitEachChild(node, visit, ctx);
            }
            return ts.visitNode(sourceFile, visit);
        };
    };
}*/