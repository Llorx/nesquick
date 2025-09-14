import { subscriptions, Subscriptions, useRender } from "./State";

export type Child = VeactElement<any>|VeactFragment|string|boolean|number|null|undefined|ChildFunc;
export type Children = Child|Child[];
export type ChildFunc = () => Exclude<Child, ChildFunc>|Exclude<Child, ChildFunc>[];
export type Props = Record<string, any>;

export type FunctionComponent<P extends Props = {}> = (props:P) => VeactElement<P>;

type VeactChild = {
    node:Node|null;
} & ({
    element:VeactElement|null;
    fragment:null;
} | {
    element:null;
    fragment:VeactFragment|null;
});

export type VeactParent = {
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
export class VeactElement<P extends Props = {}> {
    private _subscriptions = new Subscriptions();
    protected _children:VeactChild[] = [];
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
    private _renderProps(element:HTMLElement, props:Props) {
        for (const k in props) {
            if (k !== "children") {
                if (typeof props[k] === "function") {
                    useRender(props[k], v => {
                        element.setAttribute(k, String(v));
                    });
                } else {
                    element.setAttribute(k, String(props[k]));
                }
            }
        }
    }
    protected _renderChildren(document:Document, parent:VeactParent, children?:Children) {
        if (children != null) {
            if (!Array.isArray(children)) {
                children = [children];
            }
            for (const child of children) {
                if (child instanceof VeactElement) {
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
    protected _pushChild():VeactChild {
        const veactChild:VeactChild = {
            node: null,
            element: null,
            fragment: null
        };
        this._children.push(veactChild);
        return veactChild;
    }
    protected _spliceChild(i:number):VeactChild {
        const veactChild:VeactChild = {
            node: null,
            element: null,
            fragment: null
        };
        this._children.splice(i, 0, veactChild);
        return veactChild;
    }
    protected _swapChilds(parent:VeactParent, i1:number, i2:number) {
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
            if (ch.element != null) {
                ch.element.dispose();
            } else if (ch.fragment != null) {
                ch.fragment.dispose();
            }
        }
    }
    protected _renderChild(document:Document, parent:VeactParent, veactChild:VeactChild, child:Exclude<Child, ChildFunc>|Exclude<Child, ChildFunc>[]) {
        if (veactChild.element != null) {
            veactChild.element.dispose();
        } else if (veactChild.fragment != null) {
            veactChild.fragment.clear();
        }
        if (child instanceof VeactFragment || Array.isArray(child)) {
            veactChild.element = null;
            veactChild.fragment = Array.isArray(child) ? new VeactFragment(child) : child;
            const node = veactChild.fragment.render(document);
            const lastChild = node.lastChild;
            if (veactChild.node) {
                parent.replaceChild(node, veactChild.node);
            } else {
                parent.appendChild(node);
            }
            veactChild.node = lastChild;
        } else if (child instanceof VeactElement) {
            veactChild.element = child;
            veactChild.fragment = null;
            const node = child.render(document);
            if (veactChild.node) {
                parent.replaceChild(node, veactChild.node);
            } else {
                parent.appendChild(node);
            }
            veactChild.node = node;
        } else {
            const value = child == null ? "" : String(child);
            if (veactChild.node == null || veactChild.element != null || veactChild.fragment != null) {
                veactChild.element = null;
                veactChild.fragment = null;
                const node = document.createTextNode(value);
                if (veactChild.node) {
                    parent.replaceChild(node, veactChild.node);
                } else {
                    parent.appendChild(node);
                }
                veactChild.node = node;
            } else {
                veactChild.node.textContent = value;
            }
        }
    }
    dispose() {
        this._subscriptions.dispose();
        for (const child of this._children) {
            if (child.element) {
                child.element.dispose();
            }
        }
    }
}

// Cyclic dependency fix
import { VeactFragment } from "./VeactFragment";