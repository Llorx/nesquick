import { subscriptions, Subscriptions, useRender } from "./State";

export type Child = NesquickComponent<any>|NesquickFragment|string|boolean|number|null|undefined|ChildFunc;
export type Children = Child|Child[];
export type ChildFunc = () => Exclude<Child, ChildFunc>|Exclude<Child, ChildFunc>[];
export type ComponentProps = Record<string, any>;

export type FunctionComponent<P extends ComponentProps = {}> = (props:P) => NesquickComponent<P>;

export type VeactDocument = Pick<Document, "createElement"|"createElementNS"|"createTextNode"|"createDocumentFragment"|"createComment">;

type NesquickChild = {
    node:Node|null;
} & ({
    component:NesquickComponent|null;
    fragment:null;
} | {
    component:null;
    fragment:NesquickFragment|null;
});

export type NesquickParent = {
    appendChild(child:Node):void;
    replaceChild(newChild:Node, oldChild:Node):void;
    insertBefore(node:Node, child:Node|null):void;
}

function functionizeProps(props:Record<string, any>) {
    for (const k in props) {
        if (typeof props[k] !== "function") {
            const v = props[k];
            props[k] = () => v;
        }
    }
}
const SVGNamespaces = new Map([
    ["xlink", "http://www.w3.org/1999/xlink"],
    ["xml", "http://www.w3.org/XML/1998/namespace"]
]);
type XmlNs = {
    ns:string;
    attributes:Map<string, string>|null;
};

export class NesquickComponent<P extends ComponentProps = {}> {
    private _subscriptions = new Subscriptions();
    private _styleSubscriptions:Subscriptions|null = null;
    private _xmlns:XmlNs|null = null;
    protected _children:NesquickChild[] = [];
    constructor(private _render:string|FunctionComponent<P>, protected props:P) {
        this.props = props;
    }
    render(document:VeactDocument):Node {
        subscriptions.set(this._subscriptions);
        if (typeof this._render === "function") {
            functionizeProps(this.props);
            const element = this._render(this.props);
            if (this._xmlns) {
                element.setXmlns(this._xmlns);
            }
            const res = element.render(document);
            subscriptions.reset();
            return res;
        }
        if (this.props.xmlns != null) {
            let namespace = typeof this.props.xmlns === "function" ? this.props.xmlns() : this.props.xmlns;
            if (namespace != null) {
                namespace = String(namespace);
                this._xmlns = {
                    ns: namespace,
                    attributes: namespace === "http://www.w3.org/2000/svg" ? SVGNamespaces : null
                };
            }
        } else if (this._render === "svg") {
            this._xmlns = {
                ns: "http://www.w3.org/2000/svg",
                attributes: SVGNamespaces
            };
        }
        let element;
        if (this._xmlns?.ns) {
            element = document.createElementNS(this._xmlns.ns, this._render);
            if (this.props != null) {
                if (this._xmlns.attributes) {
                    this._renderPropsNs(this._xmlns.attributes, element, this.props);
                } else {
                    this._renderProps(element, this.props);
                }
            }
        } else {
            element = document.createElement(this._render);
            if (this.props != null) {
                this._renderProps(element, this.props);
            }
        }
        this._renderChildren(document, element, this.props.children);
        if (this.props.ref != null) {
            this.props.ref(element);
        }
        this.props = {} as P; // GC unused properties
        subscriptions.reset();
        return element;
    }
    setXmlns(xmlns:XmlNs|null) {
        this._xmlns = xmlns;
    }
    private _getAttributeNs(attributes:Map<string, string>, k:string) {
        const index = k.indexOf(":");
        if (index > -1) {
            const ns = k.substring(0, index);
            const name = k.substring(index + 1);
            const namespace = attributes.get(ns);
            if (namespace != null) {
                return {
                    namespace: namespace,
                    name: name
                };
            }
        }
        return null;
    }
    private _renderPropsNs(attributes:Map<string, string>, element:Element, props:ComponentProps) {
        for (const k in props) {
            if (k !== "children" && k !== "xmlns" && k !== "ref") {
                if (k === "style") {
                    this._renderStyle(element as HTMLElement, props[k]);
                } else if (typeof props[k] === "function") {
                    if (k.startsWith("on")) {
                        // TODO: Validate events
                        (element as any)[k.toLowerCase()] = props[k];
                    } else {
                        const attribute = this._getAttributeNs(attributes, k);
                        if (attribute) {
                            useRender(props[k], v => {
                                element.setAttributeNS(attribute.namespace, attribute.name, String(v));
                            });
                        } else {
                            useRender(props[k], v => {
                                element.setAttribute(k, String(v));
                            });
                        }
                    }
                } else {
                    const attribute = this._getAttributeNs(attributes, k);
                    if (attribute) {
                        element.setAttributeNS(attribute.namespace, attribute.name, String(props[k]));
                    } else {
                        element.setAttribute(k, String(props[k]));
                    }
                }
            }
        }
    };
    private _renderProps(element:Element, props:ComponentProps) {
        for (const k in props) {
            if (k !== "children" && k !== "xmlns" && k !== "ref") {
                if (k === "style") {
                    this._renderStyle(element as HTMLElement, props[k]);
                } else if (typeof props[k] === "function") {
                    if (k.startsWith("on")) {
                        // TODO: Validate events
                        (element as any)[k.toLowerCase()] = props[k];
                    } else {
                        useRender(props[k], v => {
                            element.setAttribute(k, String(v));
                        });
                    }
                } else {
                    element.setAttribute(k, String(props[k]));
                }
            }
        }
    }
    private _renderStyles(element:HTMLElement, styles:JSX.StyleProps) {
        for (const k in styles) {
            if (typeof styles[k] === "function") {
                useRender(styles[k], v => {
                    element.style[k] = String(v);
                });
            } else {
                element.style[k] = String(styles[k]);
            }
        }
    }
    private _renderStyle(element:HTMLElement, style:unknown) {
        switch (typeof style) {
            case "function": {
                useRender(style as ()=>unknown, (style, isState) => {
                    if (this._styleSubscriptions != null) {
                        this._styleSubscriptions.dispose();
                        this._styleSubscriptions = null;
                    }
                    switch (typeof style) {
                        case "object": {
                            if (style) {
                                if (isState) {
                                    element.removeAttribute("style");
                                    this._styleSubscriptions = new Subscriptions();
                                    subscriptions.set(this._styleSubscriptions);
                                    this._renderStyles(element, style);
                                    subscriptions.reset();
                                } else {
                                    this._renderStyles(element, style);
                                }
                            }
                            break;
                        }
                        default: {
                            element.setAttribute("style", String(style));
                            break;
                        }
                    }
                });
                break;
            }
            case "object": {
                if (style) {
                    this._renderStyles(element, style);
                } else {
                    element.removeAttribute("style");
                }
                break;
            }
            default: {
                element.setAttribute("style", String(style));
                break;
            }
        }
    }
    protected _renderChildren(document:VeactDocument, parent:NesquickParent, children?:Children) {
        if (children != null) {
            if (!Array.isArray(children)) {
                children = [children];
            }
            for (const child of children) {
                if (child instanceof NesquickComponent) {
                    this._renderChild(document, parent, this._pushChild(), child);
                } else if (typeof child === "function") {
                    const ch = this._pushChild();
                    useRender(child, children => {
                        this._renderChild(document, parent, ch, children);
                    });
                } else {
                    this._renderChild(document, parent, this._pushChild(), child);
                }
            }
        }
    }
    protected _pushChild():NesquickChild {
        const nesquickChild:NesquickChild = {
            node: null,
            component: null,
            fragment: null
        };
        this._children.push(nesquickChild);
        return nesquickChild;
    }
    protected _spliceChild(i:number):NesquickChild {
        const nesquickChild:NesquickChild = {
            node: null,
            component: null,
            fragment: null
        };
        this._children.splice(i, 0, nesquickChild);
        return nesquickChild;
    }
    protected _swapChilds(parent:NesquickParent, i1:number, i2:number) {
        const ch1 = this._children[i1];
        const ch2 = this._children[i2];
        if (ch1 && ch2) {
            this._children[i1] = ch2;
            this._children[i2] = ch1;
            if (ch1.node && ch2.node) {
                const node2Sibling = ch2.node.nextSibling;
                if (node2Sibling === ch1.node) {
                    parent.insertBefore(ch1.node, ch2.node);
                } else {
                    parent.insertBefore(ch2.node, ch1.node);
                    parent.insertBefore(ch1.node, node2Sibling);
                }
            }
        }
    }
    protected _removeChild(i:number) {
        const ch = this._children[i];
        if (ch) {
            this._children.splice(i, 1);
            if (ch.node) {
                ch.node.parentNode?.removeChild(ch.node);
            }
            if (ch.component != null) {
                ch.component.dispose();
            } else if (ch.fragment != null) {
                ch.fragment.dispose();
            }
        }
    }
    protected _renderChild(document:VeactDocument, parent:NesquickParent, nesquickChild:NesquickChild, child:Exclude<Child, ChildFunc>|Exclude<Child, ChildFunc>[]) {
        if (nesquickChild.component != null) {
            nesquickChild.component.dispose();
        } else if (nesquickChild.fragment != null) {
            nesquickChild.fragment.clear();
        }
        if (child instanceof NesquickFragment || Array.isArray(child)) {
            nesquickChild.component = null;
            nesquickChild.fragment = Array.isArray(child) ? new NesquickFragment(child) : child;
            if (this._xmlns) {
                nesquickChild.fragment.setXmlns(this._xmlns);
            }
            const node = nesquickChild.fragment.render(document);
            const lastChild = node.lastChild;
            if (nesquickChild.node) {
                parent.replaceChild(node, nesquickChild.node);
            } else {
                parent.appendChild(node);
            }
            nesquickChild.node = lastChild;
        } else if (child instanceof NesquickComponent) {
            nesquickChild.component = child;
            nesquickChild.fragment = null;
            if (this._xmlns) {
                child.setXmlns(this._xmlns);
            }
            const node = child.render(document);
            if (nesquickChild.node) {
                parent.replaceChild(node, nesquickChild.node);
            } else {
                parent.appendChild(node);
            }
            nesquickChild.node = node;
        } else {
            const value = child == null ? "" : String(child);
            if (nesquickChild.node == null || nesquickChild.component != null || nesquickChild.fragment != null) {
                nesquickChild.component = null;
                nesquickChild.fragment = null;
                const node = document.createTextNode(value);
                if (nesquickChild.node) {
                    parent.replaceChild(node, nesquickChild.node);
                } else {
                    parent.appendChild(node);
                }
                nesquickChild.node = node;
            } else {
                nesquickChild.node.textContent = value;
            }
        }
    }
    dispose() {
        this._subscriptions.dispose();
        this._styleSubscriptions?.dispose();
        for (const child of this._children) {
            if (child.component) {
                child.component.dispose();
            }
        }
    }
}

// Cyclic dependency fix
import { NesquickFragment } from "./NesquickFragment";
import { JSX } from "./jsx-runtime";
