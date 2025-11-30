import * as TS from "typescript";

type Options = {
    userComponent?:boolean;
    isJsxAttribute?:boolean;
};
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

export const transformer: TS.TransformerFactory<TS.SourceFile> = context => {
    return sourceFile => {
        const visitGeneric = (node:TS.Node, options:Options) => {
            let hasSpread = options.userComponent && TS.isJsxSpreadAttribute(node);
            let hasChildIdentifier = false;
            if (TS.isJsxOpeningLikeElement(node)) {
                const firstLetter = node.tagName.getText()[0];
                const userComponent = firstLetter !== firstLetter.toLowerCase();
                node = TS.visitEachChild(node, node => {
                    const res = visitGeneric(node, { userComponent });
                    hasSpread = hasSpread || res.hasSpread;
                    hasChildIdentifier = hasChildIdentifier || res.hasChildIdentifier || TS.isIdentifier(node);
                    return res.node;
                }, context);
                if (userComponent && hasSpread) {
                    const symbol = TS.factory.createCallExpression(TS.factory.createPropertyAccessExpression(TS.factory.createIdentifier("Symbol"), "for"), void 0, [TS.factory.createStringLiteral("$nesquickSpreadProps")]);
                    if (TS.isJsxOpeningLikeElement(node)) {
                        const attributes = TS.factory.updateJsxAttributes(node.attributes, [
                            ...node.attributes.properties,
                            TS.factory.createJsxSpreadAttribute(TS.factory.createObjectLiteralExpression([
                                TS.factory.createPropertyAssignment(TS.factory.createComputedPropertyName(symbol), TS.factory.createTrue())
                            ]))
                        ]);
                        if (TS.isJsxOpeningElement(node)) {
                            node = TS.factory.updateJsxOpeningElement(node, node.tagName, node.typeArguments, attributes);
                        } else if (TS.isJsxSelfClosingElement(node)) {
                            node = TS.factory.updateJsxSelfClosingElement(node, node.tagName, node.typeArguments, attributes);
                        }
                    }
                }
            } else if (TS.isJsxAttribute(node)) {
                node = TS.visitEachChild(node, node => {
                    const res = visitGeneric(node, { ...options, isJsxAttribute: true });
                    hasSpread = hasSpread || res.hasSpread;
                    hasChildIdentifier = hasChildIdentifier || res.hasChildIdentifier || TS.isIdentifier(node);
                    return res.node;
                }, context);
            } else if (TS.isJsxExpression(node)) {
                node = TS.visitEachChild(node, node => {
                    const res = visitorExpression(node, { ...options, isJsxAttribute: false });
                    hasChildIdentifier = hasChildIdentifier || res.hasChildIdentifier || TS.isIdentifier(node);
                    return res.node;
                }, context);
            } else if (options.isJsxAttribute && TS.isStringLiteral(node)) {
                const returnNode = TS.visitNode(node, node => {
                    const res = visitorExpression(node, { ...options, isJsxAttribute: false });
                    hasChildIdentifier = hasChildIdentifier || res.hasChildIdentifier || TS.isIdentifier(node);
                    return res.node;
                }, TS.isExpression);
                if (TS.isStringLiteral(returnNode)) {
                    node = returnNode;
                } else {
                    node = TS.factory.createJsxExpression(undefined, returnNode);
                }
            } else {
                node = TS.visitEachChild(node, node => {
                    const res = visitGeneric(node, { ...options, isJsxAttribute: false });
                    hasSpread = hasSpread || res.hasSpread;
                    hasChildIdentifier = hasChildIdentifier || res.hasChildIdentifier || TS.isIdentifier(node);
                    return res.node;
                }, context);
            }
            return { hasSpread, hasChildIdentifier, node };
        };
        const visitorExpression = (node:TS.Node, options:Options) => {
            let hasChildIdentifier = false;
            if (TS.isParenthesizedExpression(node)) {
                const body = getSingleBody(node);
                if (body) {
                    node = TS.visitNode(body, node => {
                        const res = visitorExpression(node, options);
                        hasChildIdentifier = hasChildIdentifier || res.hasChildIdentifier || TS.isIdentifier(node);
                        return res.node;
                    });
                }
            } else if (TS.isCallExpression(node)) {
                const identifier = getSingleIdentifier(node);
                if (identifier) {
                    node = identifier;
                } else {
                    node = TS.factory.createArrowFunction(undefined, undefined, [], undefined, TS.factory.createToken(TS.SyntaxKind.EqualsGreaterThanToken), TS.visitNode(node, node => {
                        const res = visitGeneric(node, {});
                        hasChildIdentifier = hasChildIdentifier || res.hasChildIdentifier || TS.isIdentifier(node);
                        return res.node;
                    }, TS.isConciseBody));
                }
            } else if (!TS.isFunctionLike(node) && TS.isExpression(node)) {
                node = TS.visitNode(node, node => {
                    const res = visitGeneric(node, {});
                    hasChildIdentifier = hasChildIdentifier || res.hasChildIdentifier;
                    return res.node;
                });
                if ((options.userComponent || hasChildIdentifier) && TS.isConciseBody(node)) {
                    node = TS.factory.createArrowFunction(undefined, undefined, [], undefined, TS.factory.createToken(TS.SyntaxKind.EqualsGreaterThanToken), node);
                }
            } else {
                node = TS.visitNode(node, node => {
                    const res = visitGeneric(node, {});
                    hasChildIdentifier = hasChildIdentifier || res.hasChildIdentifier || TS.isIdentifier(node);
                    return res.node;
                });
            }
            return { hasChildIdentifier, node };
        };
        return TS.visitNode(sourceFile, node => visitGeneric(node, {}).node, TS.isSourceFile);
    };
};