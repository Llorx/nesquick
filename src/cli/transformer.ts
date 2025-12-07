import * as TS from "typescript";

type Options = {
    userComponent?:boolean;
    isJsxAttribute?:boolean;
};
function getSingleIdentifier(node:TS.Node) {
    let identifier:TS.Node|null = null;
    node.forEachChild(node => {
        if (TS.isIdentifier(node)) {
            if (identifier != null) {
                return node; // break
            }
            identifier = node;
        }
    });
    return identifier;
}
function getSingleBody(node:TS.Node) {
    let body:TS.Node|null = null;
    node.forEachChild(node => {
        if (body != null) {
            return node; // break;
        }
        body = node;
    });
    return body;
}

export function createCheckFunction(fName:TS.Identifier) {
    return TS.factory.createFunctionDeclaration(
        void 0,
        void 0,
        fName,
        void 0,
        [TS.factory.createParameterDeclaration(
            void 0,
            void 0,
            TS.factory.createIdentifier("v")
        )],
        void 0,
        TS.factory.createBlock([
            TS.factory.createReturnStatement(
                TS.factory.createConditionalExpression(
                    TS.factory.createBinaryExpression(
                        TS.factory.createTypeOfExpression(TS.factory.createIdentifier("v")),
                        TS.factory.createToken(TS.SyntaxKind.EqualsEqualsEqualsToken),
                        TS.factory.createStringLiteral("function")
                    ),
                    TS.factory.createToken(TS.SyntaxKind.QuestionToken),
                    TS.factory.createIdentifier("v"),
                    TS.factory.createToken(TS.SyntaxKind.ColonToken),
                    TS.factory.createArrowFunction(
                        void 0,
                        void 0,
                        [],
                        void 0,
                        TS.factory.createToken(TS.SyntaxKind.EqualsGreaterThanToken),
                        TS.factory.createIdentifier("v")
                    )
                )
            )
        ])
    );
}

export const transformer:TS.TransformerFactory<TS.SourceFile> = context => {
    return sourceFile => {
        let hasChecker = false;
        const checkerName = TS.factory.createUniqueName("_check");
        const visitGeneric = (node:TS.Node, options:Options) => {
            let hasSpread = options.userComponent && TS.isJsxSpreadAttribute(node);
            let hasCallExpression = TS.isCallExpression(node);
            if (TS.isJsxOpeningLikeElement(node)) {
                const firstLetter = node.tagName.getText()[0];
                const userComponent = firstLetter !== firstLetter.toLowerCase();
                node = TS.visitEachChild(node, node => {
                    const res = visitGeneric(node, { userComponent });
                    hasSpread = hasSpread || res.hasSpread;
                    hasCallExpression = hasCallExpression || res.hasCallExpression;
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
                    hasCallExpression = hasCallExpression || res.hasCallExpression;
                    return res.node;
                }, context);
            } else if (TS.isJsxExpression(node)) {
                node = TS.visitEachChild(node, node => visitorExpression(node, { ...options, isJsxAttribute: false }), context);
            } else if (options.isJsxAttribute && TS.isStringLiteral(node)) {
                const returnNode = TS.visitNode(node, node => visitorExpression(node, { ...options, isJsxAttribute: false }), TS.isExpression);
                if (TS.isStringLiteral(returnNode)) {
                    node = returnNode;
                } else {
                    node = TS.factory.createJsxExpression(void 0, returnNode);
                }
            } else {
                node = TS.visitEachChild(node, node => {
                    const res = visitGeneric(node, { ...options, isJsxAttribute: false });
                    hasSpread = hasSpread || res.hasSpread;
                    hasCallExpression = hasCallExpression || res.hasCallExpression;
                    return res.node;
                }, context);
            }
            return { hasSpread, hasCallExpression, node };
        };
        const visitorExpression = (node:TS.Node, options:Options) => {
            if (TS.isParenthesizedExpression(node)) {
                const body = getSingleBody(node);
                if (body) {
                    node = body;
                }
            }
            if (TS.isCallExpression(node)) {
                let identifier = null;
                if (node.arguments.length === 0 && (identifier = getSingleIdentifier(node)) != null) {
                    node = identifier;
                } else {
                    node = TS.factory.createArrowFunction(
                        void 0,
                        void 0,
                        [],
                        void 0,
                        TS.factory.createToken(TS.SyntaxKind.EqualsGreaterThanToken),
                        TS.visitNode(node, node => visitGeneric(node, {}).node, TS.isConciseBody)
                    );
                }
            } else {
                const res = visitGeneric(node, {});
                node = res.node;
                if (TS.isExpression(node) && !TS.isFunctionLike(node) && !TS.isJsxElement(node) && !TS.isJsxOpeningLikeElement(node)) {
                    if (res.hasCallExpression) {
                        node = TS.factory.createArrowFunction(
                            void 0,
                            void 0,
                            [],
                            void 0,
                            TS.factory.createToken(TS.SyntaxKind.EqualsGreaterThanToken),
                            TS.visitNode(node, node => visitGeneric(node, {}).node, TS.isConciseBody)
                        );
                    } else if (options.userComponent) {
                        hasChecker = true;
                        node = TS.factory.createCallExpression(
                            checkerName,
                            void 0,
                            [node]
                        );
                    }
                }
            }
            return node;
        };
        sourceFile = TS.visitNode(sourceFile, node => visitGeneric(node, {}).node, TS.isSourceFile);
        if (hasChecker) {
            sourceFile = TS.factory.updateSourceFile(sourceFile, [
                ...sourceFile.statements,
                createCheckFunction(checkerName)
            ]);
        }
        return sourceFile;
    };
};