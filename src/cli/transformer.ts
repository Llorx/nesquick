import * as TS from "typescript";

type NesquickVisitor = (node:TS.Node) => TS.Node;
function getSingleIdentifier(node:TS.Node) {
    const identifiers:TS.Node[] = [];
    node.forEachChild(node => {
        if (TS.isIdentifier(node)) {
            identifiers.push(node);
        }
    });
    if (identifiers.length === 1) {
        return identifiers[0];
    }
    return null;
}
function getSingleBody(node:TS.Node) {
    const body:TS.Node[] = [];
    node.forEachChild(node => {
        body.push(node);
    });
    if (body.length === 1) {
        return body[0];
    }
    return null;
}
function hasIdentifier(node:TS.Node) {
    let found = false;
    node.forEachChild(node => {
        if (!found && (TS.isIdentifier(node) || hasIdentifier(node))) {
            found = true;
        }
    });
    return found;
}
export const transformer: TS.TransformerFactory<TS.SourceFile> = context => {
    return sourceFile => {
        const visitorGeneric:NesquickVisitor = node => {
            if (TS.isJsxAttribute(node)) {
                return TS.visitEachChild(node, visitorAttribute, context);
            }
            return TS.visitEachChild(node, visitorGeneric, context);
        };
        const visitorAttribute:NesquickVisitor = node => {
            if (TS.isJsxExpression(node)) {
                return TS.visitEachChild(node, visitorExpression, context);
            }
            return TS.visitEachChild(node, visitorGeneric, context);
        };
        const visitorExpression:NesquickVisitor = node => {
            if (TS.isParenthesizedExpression(node)) {
                const body = getSingleBody(node);
                if (body) {
                    return TS.visitNode(body, visitorExpression, TS.isSourceFile);
                }
            } else if (TS.isCallExpression(node)) {
                const identifier = getSingleIdentifier(node);
                if (identifier) {
                    return identifier;
                } else {
                    return TS.factory.createArrowFunction(undefined, undefined, [], undefined, TS.factory.createToken(TS.SyntaxKind.EqualsGreaterThanToken), node);
                }
            } else if (TS.isExpression(node) && hasIdentifier(node)) {
                return TS.factory.createArrowFunction(undefined, undefined, [], undefined, TS.factory.createToken(TS.SyntaxKind.EqualsGreaterThanToken), node);
            }
            return node;
        };
        return TS.visitNode(sourceFile, visitorGeneric, TS.isSourceFile);
    };
};