import { JSX } from "./jsx-runtime";
import { VeactElement, VeactParent } from "./VeactElement";

// TODO: Test when deleting/inserting elements before/after rendering
export class VeactFragment extends VeactElement<{children:any[]}> implements VeactParent { // TODO: any
    private _lastNode:Node|null = null;
    private _fragment:Node|null = null;
    constructor(children:any[]) {
        super("", { children });
    }
    override render(document:Document) {
        this._fragment = document.createDocumentFragment();
        this._renderChildren(document, this, this.props.children);
        this.props = {} as {children:any[]}; // GC unused properties
        this._lastNode = document.createComment("Fragment");
        this._fragment.appendChild(this._lastNode);
        return this._fragment;
    }
    // TODO: Test these public methods
    getDocument() {
        return (this._lastNode?.ownerDocument || this._fragment?.ownerDocument) || null;
    }
    getParent() {
        return this._lastNode?.parentNode || this._fragment;
    }
    appendChild(child:Node) {
        const parent = this.getParent();
        if (parent) {
            parent.insertBefore(child, this._lastNode);
        }
    }
    replaceChild(newChild:Node, oldChild:Node) {
        const parent = this.getParent();
        if (parent) {
            parent.replaceChild(newChild, oldChild);
        }
    }
    insertBefore(node:Node, child:Node|null) {
        const parent = this.getParent();
        if (parent) {
            parent.insertBefore(node, child || this._lastNode);
        }
    }
    appendElement(child:JSX.Element) {
        const document = this.getDocument();
        const parent = this.getParent();
        if (document && parent) {
            const ch = this._pushChild();
            this._renderChild(document, this, ch, child);
        } else {
            this.props.children.push(child);
        }
    }
    swapElements(i1:number, i2:number) {
        const parent = this.getParent();
        if (parent) {
            this._swapChilds(parent, i1, i2);
        }
    }
    removeElement(i:number) {
        this._removeChild(i);
    }
    spliceElement(i:number, child:JSX.Element) {
        const document = this.getDocument();
        const parent = this.getParent();
        if (document && parent) {
            const spliced = this._children[i];
            const ch = this._spliceChild(i);
            ch.node = document.createComment("");
            if (spliced?.node) {
                parent.insertBefore(ch.node, spliced.node);
            }
            this._renderChild(document, this, ch, child);
        } else {
            this.props.children.splice(i, 0, child);
        }
    }
    clear() {
        const parent = this._lastNode?.parentNode || this._fragment;
        if (parent) {
            for (const child of this._children) {
                if (child.node) {
                    parent.removeChild(child.node);
                }
            }
        }
        this.dispose();
    }
}