import * as TS from "typescript";

export const transformer: TS.TransformerFactory<TS.SourceFile> = context => {
    return sourceFile => {
        const visitor = (node: TS.Node): TS.Node => {
            if (TS.isIdentifier(node)) {
                console.log("node");
                /*switch (node.escapedText) {
                    case 'babel':
                        return TS.factory.createIdentifier('typescript');

                    case 'plugins':
                        return TS.factory.createIdentifier('transformers');
                }*/
            }
            return TS.visitEachChild(node, visitor, context);
        };
        return TS.visitNode(sourceFile, visitor, TS.isSourceFile);
    };
};