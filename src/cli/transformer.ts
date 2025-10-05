import * as TS from "typescript";

type NesquickVisitor = (node:TS.Node, options:{userComponent?:boolean, isJsxAttribute?:boolean}) => TS.Node;
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
        const visitGeneric:NesquickVisitor = (node, options) => {
            if (TS.isJsxOpeningLikeElement(node)) {
                const firstLetter = node.tagName.getText()[0];
                const userComponent = firstLetter !== firstLetter.toLowerCase();
                return TS.visitEachChild(node, node => visitGeneric(node, { userComponent }), context);
            }
            if (TS.isJsxAttribute(node)) {
                return TS.visitEachChild(node, node => visitGeneric(node, { ...options, isJsxAttribute: true }), context);
            } else if (TS.isJsxExpression(node)) {
                return TS.visitEachChild(node, node => visitorExpression(node, { ...options, isJsxAttribute: false }), context);
            } else if (options.isJsxAttribute && TS.isStringLiteral(node)) {
                const returnNode = TS.visitNode(node, node => visitorExpression(node, { ...options, isJsxAttribute: false }));
                if (TS.isExpression(returnNode)) {
                    return TS.factory.createJsxExpression(undefined, returnNode);
                }
                return returnNode;
            }
            return TS.visitEachChild(node, node => visitGeneric(node, { ...options, isJsxAttribute: false }), context);
        };
        const visitorExpression:NesquickVisitor = (node, options) => {
            if (TS.isParenthesizedExpression(node)) {
                const body = getSingleBody(node);
                if (body) {
                    return TS.visitNode(body, node => visitorExpression(node, options));
                }
            } else if (TS.isCallExpression(node)) {
                const identifier = getSingleIdentifier(node);
                if (identifier) {
                    return identifier;
                } else {
                    return TS.factory.createArrowFunction(undefined, undefined, [], undefined, TS.factory.createToken(TS.SyntaxKind.EqualsGreaterThanToken), TS.visitNode(node, node => visitGeneric(node, {}), TS.isConciseBody));
                }
            } else if (!TS.isFunctionLike(node) && TS.isExpression(node) && (options.userComponent || hasIdentifier(node))) {
                return TS.factory.createArrowFunction(undefined, undefined, [], undefined, TS.factory.createToken(TS.SyntaxKind.EqualsGreaterThanToken), TS.visitNode(node, node => visitGeneric(node, {}), TS.isConciseBody));
            }
            return TS.visitNode(node, node => visitGeneric(node, {}));
        };
        return TS.visitNode(sourceFile, node => visitGeneric(node, {}), TS.isSourceFile);
    };
};