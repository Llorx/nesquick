import { afterRender, subscriptions, Subscriptions, useRender } from "./State";
import { isEvent } from "./util";

export type Child = NesquickComponent<any>|NesquickFragment|string|boolean|number|null|undefined|ChildFunc;
export type Children = Child|Child[];
export type ChildFunc = () => Exclude<Child, ChildFunc>|Exclude<Child, ChildFunc>[];
export type ComponentProps = Record<string, any>;

export type FunctionComponent<P extends ComponentProps = {}> = (props:P) => NesquickComponent<any>;

export type NesquickDocument = Pick<Document, "createElement"|"createElementNS"|"createTextNode"|"createDocumentFragment"|"createComment">;

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

const SVGNamespaces = new Map([
    ["xlink", "http://www.w3.org/1999/xlink"],
    ["xml", "http://www.w3.org/XML/1998/namespace"]
]);
type XmlNs = {
    ns:string;
    attributes:Map<string, string>|null;
};

function getAttributeNs(attributes:Map<string, string>, k:string) {
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

function getterFromFunctionsSingleChildren<P extends ComponentProps>(props:P) {
    const res = {} as P & {children:Child};
    for (const k in props) {
        if (k === "children") {
            const v = props.children;
            if (typeof v === "function" && !(v instanceof NesquickComponent)) {
                Object.defineProperty(res, "children", {
                    get() {
                        return v();
                    }
                });
            } else {
                res.children = v;
            }
        } else {
            const v = props[k];
            Object.defineProperty(res, k, {
                get() {
                    return v();
                }
            });
        }
    }
    return res as P;
}
function getterFromFunctionsArrayChildren<P extends ComponentProps>(props:P) {
    const res = {} as P & {children:Child[]};
    for (const k in props) {
        if (k === "children") {
            res.children = props.children;
            for (let i = 0; i < props.children.length; i++) {
                const v = props.children[i];
                if (typeof v === "function" && !(v instanceof NesquickComponent)) {
                    Object.defineProperty(res.children, i, {
                        get() {
                            return v();
                        }
                    });
                }
            }
        } else {
            const v = props[k];
            Object.defineProperty(res, k, {
                get() {
                    return v();
                }
            });
        }
    }
    return res as P;
}
export class NesquickComponent<P extends ComponentProps = {}> {
    private _subscriptions = new Subscriptions();
    private _styleSubscriptions:Subscriptions|null = null;
    private _xmlns:XmlNs|null = null;
    private _onUpdate:{
        waiting:boolean;
        element:Element;
        cb:(el:Element)=>void;
    }|null = null;
    protected _children:NesquickChild[] = [];
    constructor(private _render:string|FunctionComponent<P>, protected props:P, protected jsxs = false) {}
    render(document:NesquickDocument):Node {
        subscriptions.set(this._subscriptions);
        if (typeof this._render === "function") {
            this.props = this.jsxs ? getterFromFunctionsArrayChildren(this.props) : getterFromFunctionsSingleChildren(this.props);
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
        if (typeof this.props["nq:ref"] === "function") {
            this.props["nq:ref"](element);
        }
        if (typeof this.props["nq:update"] === "function") {
            this._onUpdate = {
                waiting: true,
                element: element,
                cb: this.props["nq:update"]
            };
        }
        this.props = {} as P; // GC unused properties
        subscriptions.reset();
        return element;
    }
    setXmlns(xmlns:XmlNs|null) {
        this._xmlns = xmlns;
    }
    private _onUpdated() {
        if (this._onUpdate?.waiting) {
            this._onUpdate.waiting = false;
            afterRender(() => {
                this._onUpdate!.waiting = true;
                this._onUpdate!.cb(this._onUpdate!.element);
            });
        }
    }
    private _renderPropsNs(attributes:Map<string, string>, element:Element, props:ComponentProps) {
        for (const k in props) {
            if (k !== "children" && k !== "xmlns" && k !== "nq:ref" && k !== "nq:update") {
                if (k === "style") {
                    this._renderStyle(element as HTMLElement, props[k]);
                } else if (typeof props[k] === "function") {
                    const attribute = getAttributeNs(attributes, k);
                    if (attribute) {
                        useRender(props[k], v => {
                            element.setAttributeNS(attribute.namespace, attribute.name, String(v));
                            this._onUpdated();
                        });
                    } else if (isEvent(k)) {
                        useRender(props[k], v => {
                            // TODO: Validate events
                            (element as any)[k.toLowerCase()] = v;
                        });
                    } else {
                        useRender(props[k], v => {
                            element.setAttribute(k, String(v));
                            this._onUpdated();
                        });
                    }
                } else {
                    const attribute = getAttributeNs(attributes, k);
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
            if (k !== "children" && k !== "xmlns" && k !== "nq:ref" && k !== "nq:update") {
                if (k === "style") {
                    this._renderStyle(element as HTMLElement, props[k]);
                } else if (typeof props[k] === "function") {
                    if (isEvent(k)) {
                        useRender(props[k], v => {
                            // TODO: Validate events
                            (element as any)[k.toLowerCase()] = v;
                        });
                    } else {
                        useRender(props[k], v => {
                            element.setAttribute(k, String(v));
                            this._onUpdated();
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
                    this._onUpdated();
                });
            } else {
                element.style[k] = String(styles[k]);
            }
        }
    }
    private _renderStyle(element:HTMLElement, style:unknown) {
        switch (typeof style) {
            case "function": {
                useRender(style as ()=>unknown, (style, lastReaction) => {
                    if (this._styleSubscriptions != null) {
                        this._styleSubscriptions.dispose();
                        this._styleSubscriptions = null;
                    }
                    switch (typeof style) {
                        case "object": {
                            if (style) {
                                if (lastReaction) {
                                    this._renderStyles(element, style);
                                } else {
                                    element.removeAttribute("style");
                                    this._styleSubscriptions = new Subscriptions();
                                    subscriptions.set(this._styleSubscriptions);
                                    this._renderStyles(element, style);
                                    subscriptions.reset();
                                }
                            }
                            break;
                        }
                        default: {
                            element.setAttribute("style", String(style));
                            break;
                        }
                    }
                    this._onUpdated();
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
    protected _renderChildren(document:NesquickDocument, parent:NesquickParent, children?:Children) {
        if (children != null) {
            if (!Array.isArray(children)) {
                children = [children];
            }
            for (const child of children) {
                if (child instanceof NesquickComponent) {
                    this._renderChild(document, parent, this._pushChild(), child);
                } else if (typeof child === "function") {
                    let ch:NesquickChild|null = null;
                    useRender(child, (children, lastReaction) => {
                        if (lastReaction && ch == null && Array.isArray(children)) {
                            this._renderChildren(document, parent, children);
                        } else {
                            if (ch == null) {
                                ch = this._pushChild();
                            }
                            this._renderChild(document, parent, ch, children);
                        }
                        this._onUpdated();
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
    protected _renderChild(document:NesquickDocument, parent:NesquickParent, nesquickChild:NesquickChild, child:Exclude<Child, ChildFunc>|Exclude<Child, ChildFunc>[]) {
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
import { JSX } from "./Nesquick";
