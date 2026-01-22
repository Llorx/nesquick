import * as TS from "typescript";
import { isEvent } from "../util";

type Options = {
    readonly userComponent?:boolean;
    readonly isJsxAttribute?:boolean;
    readonly isEvent?:boolean;
};
function getSingleIdentifier(node:TS.Node) {
    let identifier:TS.Node|null = null;
    node.forEachChild(node => {
        if (TS.isIdentifier(node)) {
            if (identifier != null) {
                identifier = null;
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

function createSpreadCheckFunction(fName:TS.Identifier) {
    /*
    function(obj, check) {
        if (!obj) {
            return obj;
        }
        const res = Object.create(null);
        for (const k in obj) {
            const v = obj[k];
            if (!check || typeof v !== "function") {
                res[k] = () => v;
            } else {
                res[k] = v;
            }
        }
        return res;
    }
    */
    const obj = TS.factory.createIdentifier("obj");
    const check = TS.factory.createIdentifier("check");
    const res = TS.factory.createIdentifier("res");
    const k = TS.factory.createIdentifier("k");
    const v = TS.factory.createIdentifier("v");

    return TS.factory.createFunctionDeclaration(
        void 0,
        void 0,
        fName,
        void 0,
        [
            TS.factory.createParameterDeclaration(void 0, void 0, obj),
            TS.factory.createParameterDeclaration(void 0, void 0, check)
        ],
        void 0,
        TS.factory.createBlock(
            [
                // if (!obj) { return obj; }
                TS.factory.createIfStatement(
                    TS.factory.createPrefixUnaryExpression(
                        TS.SyntaxKind.ExclamationToken,
                        obj
                    ),
                    TS.factory.createBlock([
                        TS.factory.createReturnStatement(obj)
                    ], true),
                    void 0
                ),
                // const res = Object.create(null);
                TS.factory.createVariableStatement(
                    void 0,
                    TS.factory.createVariableDeclarationList(
                        [
                            TS.factory.createVariableDeclaration(
                                res,
                                void 0,
                                void 0,
                                TS.factory.createCallExpression(
                                    TS.factory.createPropertyAccessExpression(
                                        TS.factory.createIdentifier("Object"),
                                        "create"
                                    ),
                                    void 0,
                                    [TS.factory.createNull()]
                                )
                            )
                        ],
                        TS.NodeFlags.Const
                    )
                ),

                // for (const k in obj) { ... }
                TS.factory.createForInStatement(
                    TS.factory.createVariableDeclarationList(
                        [TS.factory.createVariableDeclaration(k)],
                        TS.NodeFlags.Const
                    ),
                    obj,
                    TS.factory.createBlock(
                        [
                            // const v = obj[k];
                            TS.factory.createVariableStatement(
                                void 0,
                                TS.factory.createVariableDeclarationList(
                                    [
                                        TS.factory.createVariableDeclaration(
                                            v,
                                            void 0,
                                            void 0,
                                            TS.factory.createElementAccessExpression(obj, k)
                                        )
                                    ],
                                    TS.NodeFlags.Const
                                )
                            ),

                            // if (!check || typeof v !== "function") { ... } else { ... }
                            TS.factory.createIfStatement(
                                TS.factory.createBinaryExpression(
                                    TS.factory.createPrefixUnaryExpression(
                                        TS.SyntaxKind.ExclamationToken,
                                        check
                                    ),
                                    TS.factory.createToken(TS.SyntaxKind.BarBarToken),
                                    TS.factory.createBinaryExpression(
                                        TS.factory.createTypeOfExpression(v),
                                        TS.factory.createToken(TS.SyntaxKind.ExclamationEqualsEqualsToken),
                                        TS.factory.createStringLiteral("function")
                                    )
                                ),
                                // then
                                TS.factory.createBlock(
                                    [
                                        TS.factory.createExpressionStatement(
                                            TS.factory.createBinaryExpression(
                                                TS.factory.createElementAccessExpression(res, k),
                                                TS.factory.createToken(TS.SyntaxKind.EqualsToken),
                                                TS.factory.createArrowFunction(
                                                    void 0,
                                                    void 0,
                                                    [],
                                                    void 0,
                                                    TS.factory.createToken(TS.SyntaxKind.EqualsGreaterThanToken),
                                                    v
                                                )
                                            )
                                        )
                                    ],
                                    true
                                ),
                                // else
                                TS.factory.createBlock(
                                    [
                                        TS.factory.createExpressionStatement(
                                            TS.factory.createBinaryExpression(
                                                TS.factory.createElementAccessExpression(res, k),
                                                TS.factory.createToken(TS.SyntaxKind.EqualsToken),
                                                v
                                            )
                                        )
                                    ],
                                    true
                                )
                            )
                        ],
                        true
                    )
                ),

                // return res;
                TS.factory.createReturnStatement(res)
            ],
            true
        )
    );
}
function arrowify(node:TS.ConciseBody) {
    return TS.factory.createArrowFunction(
        void 0,
        void 0,
        [],
        void 0,
        TS.factory.createToken(TS.SyntaxKind.EqualsGreaterThanToken),
        node
    );
}

export const transformer:TS.TransformerFactory<TS.SourceFile> = context => {
    return sourceFile => {
        let hasSpreadChecker = false;
        const spreadCheckerName = TS.factory.createUniqueName("_spread");
        const processNode = (node:TS.Node, options:Options) => {
            let hasCallExpression = false;
            node = TS.visitEachChild(node, node => {
                const res = visitGeneric(node, options);
                hasCallExpression = hasCallExpression || res.hasCallExpression;
                return res.node;
            }, context);
            return { node, hasCallExpression };
        };
        const visitGeneric = (node:TS.Node, options:Options) => {
            // hasCallExpression is anything that could call a function, like getters or direct calls
            let hasCallExpression = TS.isCallExpression(node) || TS.isElementAccessExpression(node) || TS.isPropertyAccessExpression(node);
            if (TS.isJsxSpreadAttribute(node)) {
                hasSpreadChecker = true;
                const expression = visitGeneric(node.expression, {}).node;
                if (TS.isExpression(expression)) {
                    const callExpression = TS.factory.createCallExpression(
                        spreadCheckerName,
                        void 0,
                        [expression, options.userComponent ? TS.factory.createFalse() : TS.factory.createTrue()]
                    );
                    node = TS.factory.updateJsxSpreadAttribute(node, callExpression);
                }
            } else if (TS.isJsxElement(node) || TS.isJsxSelfClosingElement(node)) {
                const firstLetter = TS.isJsxSelfClosingElement(node) ? node.tagName.getText()[0] : node.openingElement.tagName.getText()[0];
                const userComponent = firstLetter !== firstLetter.toLowerCase(); // JSX user components always start with a capital letter
                const res = processNode(node, { userComponent });
                node = res.node;
            } else if (TS.isJsxAttribute(node)) {
                const propIsEvent = TS.isIdentifier(node.name) && isEvent(node.name.text);
                node = TS.visitEachChild(node, node => {
                    const res = visitGeneric(node, { ...options, isJsxAttribute: true, isEvent: propIsEvent});
                    hasCallExpression = hasCallExpression || res.hasCallExpression;
                    return res.node;
                }, context);
            } else if (TS.isJsxExpression(node)) {
                node = TS.visitEachChild(node, node => visitorExpression(node, { ...options, isJsxAttribute: false }), context);
            } else if (options.isJsxAttribute && TS.isStringLiteral(node)) {
                const returnNode = TS.visitNode(node, node => visitorExpression(node, { ...options, isJsxAttribute: false, isEvent: false }), TS.isExpression);
                if (TS.isStringLiteral(returnNode)) {
                    node = returnNode;
                } else {
                    node = TS.factory.createJsxExpression(void 0, returnNode);
                }
            } else if (TS.isFunctionLike(node)) {
                node = TS.visitEachChild(node, node => {
                    const res = visitGeneric(node, { ...options, isJsxAttribute: false, isEvent: false });
                    return res.node;
                }, context);
            } else {
                node = TS.visitEachChild(node, node => {
                    const res = visitGeneric(node, { ...options, isJsxAttribute: false, isEvent: false });
                    hasCallExpression = hasCallExpression || res.hasCallExpression;
                    return res.node;
                }, context);
            }
            if (TS.isJsxChild(node) && !TS.isJsxText(node) && !TS.isJsxExpression(node) && options.userComponent) {
                node = TS.factory.createJsxExpression(void 0, arrowify(node));
            }
            return { node, hasCallExpression };
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
                    return visitGeneric(identifier, {}).node;
                }
            }
            const res = visitGeneric(node, {});
            node = res.node;
            if (TS.isConciseBody(node) && (options.userComponent || res.hasCallExpression || options.isEvent)) {
                node = arrowify(node);
            }
            return node;
        };
        sourceFile = TS.visitNode(sourceFile, node => visitGeneric(node, {}).node, TS.isSourceFile);
        if (hasSpreadChecker) {
            sourceFile = TS.factory.updateSourceFile(sourceFile, [
                ...sourceFile.statements,
                createSpreadCheckFunction(spreadCheckerName)
            ]);
        }
        return sourceFile;
    };
};