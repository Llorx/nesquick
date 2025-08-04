import { cancelSubscription, Subscription, useRender } from "./State";

export type Child = VeactElement|string|null|void|ChildFunc;
export type ChildFunc = () => Exclude<Child, ChildFunc>;
export type Prop = string|number|boolean|null|undefined|PropFunc;
export type PropFunc = () => Exclude<Prop, PropFunc>;
export type Props = Record<string, Prop>;
export type PropsFunc = Record<string, PropFunc>;

type VeactChild = {
    node:Node|null;
    element:null;
} | {
    node:Node|null;
    element:VeactElement;
};
type PropFuncTransform<T extends Prop> = T extends ()=>void ? T : () => T;
type PropsFuncTransform<T extends Props> = {[K in keyof T]:PropFuncTransform<T[K]>};

function propsFunc<T extends Props>(props:T) {
    for (const k in props) {
        if (typeof props[k] !== "function") {
            const v = props[k];
            props[k] = (() => v) as any; // TODO: "as any". Think about it.
        }
    }
    return props as PropsFuncTransform<T>;
}

// VeactElement puede recibir un render
// Si recibe un render externo, entonces usa ese render pasándole los props en el argumento del render
// Esos props tienen que ser de tipo PropsFunc siempre (a ver cómo lo hago, posiblemente un genérico que en el arg se aplica la transformación del genérico)

export class VeactElement {
    private _subscriptions:Subscription<any>[] = [];
    private _children:VeactChild[] = [];
    constructor(readonly type:string, readonly props:Props|null, readonly children:Child[]) {}
    render(document:Document) {
        const element = document.createElement(this.type);
        if (this.props != null) {
            this._renderProps(element, this.props);
        }
        this._renderChildren(document, element, this.children);
        return element;
    }
    private _renderProps(element:HTMLElement, props:Props) {
        for (const k in props) {
            if (typeof props[k] === "function") {
                const sub = useRender(props[k], v => {
                    element.setAttribute(k, String(v));
                });
                if (sub) {
                    this._subscriptions.push(sub);
                }
            } else {
                element.setAttribute(k, String(props[k]));
            }
        }
    }
    private _renderChildren(document:Document, parent:HTMLElement, children:Child[]) {
        for (const child of children) {
            if (child instanceof VeactElement) {
                this._renderChild(document, parent, this._newChild(), child);
            } else if (typeof child === "function") {
                const veactChild = this._newChild();
                const sub = useRender(child, child => {
                    this._renderChild(document, parent, veactChild, child);
                });
                if (sub) {
                    this._subscriptions.push(sub);
                }
            } else {
                this._renderChild(document, parent, this._newChild(), child);
            }
        }
    }
    private _newChild() {
        const veactChild:VeactChild = {
            node: null,
            element: null
        };
        this._children.push(veactChild);
        return veactChild;
    }
    private _renderChild(document:Document, parent:HTMLElement, veactChild:VeactChild, child:Exclude<Child, ChildFunc>) {
        const sibling = veactChild.node ? veactChild.node.nextSibling : null;
        if (veactChild.element) {
            veactChild.element.dispose();
            parent.removeChild(veactChild.node!);
            veactChild.element = null!;
            veactChild.node = null;
        }
        if (child instanceof VeactElement) {
            if (veactChild.node) {
                parent.removeChild(veactChild.node!);
            }
            veactChild.element = child;
            veactChild.node = child.render(document);
            parent.insertBefore(veactChild.node, sibling);
        } else {
            const value = child == null ? "" : String(child);
            if (!veactChild.node) {
                veactChild.node = document.createTextNode(value);
                parent.insertBefore(veactChild.node, sibling);
            } else {
                veactChild.node.textContent = value;
            }
        }
    }
    dispose() {
        for (const sub of this._subscriptions) {
            cancelSubscription(sub);
        }
        for (const child of this._children) {
            if (child.element) {
                child.element.dispose();
            }
        }
    }
}
