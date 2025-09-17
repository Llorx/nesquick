import { subscriptions, Subscriptions, useRender } from "./State";

export type Child = NesquickComponent<any>|NesquickFragment|string|boolean|number|null|undefined|ChildFunc;
export type Children = Child|Child[];
export type ChildFunc = () => Exclude<Child, ChildFunc>|Exclude<Child, ChildFunc>[];
export type ComponentProps = Record<string, any>;

export type FunctionComponent<P extends ComponentProps = {}> = (props:P) => NesquickComponent<P>;

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
export class NesquickComponent<P extends ComponentProps = {}> {
    private _subscriptions = new Subscriptions();
    protected _children:NesquickChild[] = [];
    constructor(private _render:string|FunctionComponent<P>, protected props:P) {
        this.props = props;
    }
    render(document:Document):Node {
        subscriptions.set(this._subscriptions);
        if (typeof this._render === "function") {
            functionizeProps(this.props);
            const res = this._render(this.props).render(document);
            subscriptions.reset();
            return res;
        }
        const element = document.createElement(this._render);
        if (this.props != null) {
            this._renderProps(element, this.props);
        }
        this._renderChildren(document, element, this.props.children);
        this.props = {} as P; // GC unused properties
        subscriptions.reset();
        return element;
    }
    private _renderProps(element:HTMLElement, props:ComponentProps) {
        for (const k in props) {
            if (k !== "children") {
                if (typeof props[k] === "function") {
                    if (k.startsWith("on")) {
                        // TODO: Validate events
                        element[k.toLowerCase() as "onclick"] = props[k];
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
    protected _renderChildren(document:Document, parent:NesquickParent, children?:Children) {
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
    protected _renderChild(document:Document, parent:NesquickParent, nesquickChild:NesquickChild, child:Exclude<Child, ChildFunc>|Exclude<Child, ChildFunc>[]) {
        if (nesquickChild.component != null) {
            nesquickChild.component.dispose();
        } else if (nesquickChild.fragment != null) {
            nesquickChild.fragment.clear();
        }
        if (child instanceof NesquickFragment || Array.isArray(child)) {
            nesquickChild.component = null;
            nesquickChild.fragment = Array.isArray(child) ? new NesquickFragment(child) : child;
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
        for (const child of this._children) {
            if (child.component) {
                child.component.dispose();
            }
        }
    }
}

// Cyclic dependency fix
import { NesquickFragment } from "./NesquickFragment";