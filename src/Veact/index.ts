import { VeactState } from "../VeactState";

export { VeactState };
export namespace Veact {
    export interface Props {
        [k:string]:any;
    }
    interface DynamicOptions<T extends Props> {
        key?:(props:T) => any;
    }
    interface DynamicOptionsProps<T extends Props, TReturn extends Props> extends DynamicOptions<T> {
        props:(props:T) => TReturn;
    }
    type N3Constructor<T = any> = new(props:T extends Props ? T : never, children:Children, type?:keyof JSX.IntrinsicElements) => T extends Props ? VeactElement<T> : VeactElement;
    type DynamicElement = {data:any, i:number|null, element:VeactElement<any>};
    type Dynamic = {constructor:N3Constructor, callback:() => any|any[], options:DynamicOptionsProps<any, Props>|DynamicOptions<any>, children:DynamicElement[], keys:Map<any, DynamicElement>|null};
    const dynamic:WeakMap<N3Constructor[], Dynamic> = new WeakMap();
    export type Sub<T> = T extends {[key:string]:any} ? T extends Array<any> ? T|(() => T) : {[K in keyof T]:T[K]|(() => T[K])} : T|(() => T);
    export type SubAll<T> = T extends {[key:string]:any} ? {[K in keyof T]:SubAll<T[K]>} : T|(() => T);
    export type Children = (string|Node|VeactElement|(() => string|Props|Props[]))[];
    export function createElement<T extends JSX.Props>(type:keyof JSX.IntrinsicElements, props?:T, ...children:Children):VeactElement<T>;
    export function createElement<T extends Props>(type:new(props:T, children:Children) => VeactElement<T>, props?:T, ...children:Children):VeactElement<T>;
    export function createElement<T extends Props>(type:(props:T) => VeactElement<any>, props?:T, ...children:Children):VeactElement<T>;
    export function createElement<T extends Props>(type:keyof JSX.IntrinsicElements|(new(props:T, children:Children) => VeactElement<T>)|((props:T) => VeactElement<any>), props?:T, ...children:Children) {
        if (typeof type === "string") {
            return new VeactElement(props, children, type);
        } else if (type.prototype instanceof VeactElement) {
            return new (type as typeof VeactElement)(props, children);
        } else {
            let el = new VeactElement(props, children);
            el.render = type as ((props:T) => VeactElement);
            return el;
        }
    }
    
    export class VeactElement<P extends Props = {}> {
        static for<T extends Props|boolean>(this:N3Constructor<T>, callback:() => T|T[]):(typeof this)[];
        static for<T extends Props|boolean>(this:N3Constructor<T>, callback:() => T|T[], options:T extends Props ? DynamicOptions<T> : undefined):(typeof this)[];
        static for<T extends Props, TReturn extends Props>(this:N3Constructor<TReturn>, callback:() => T|T[], options:DynamicOptionsProps<T, TReturn>):(typeof this)[];
        static for<T extends Props, TReturn extends Props>(this:N3Constructor<TReturn>, callback:() => T|T[], options?:DynamicOptionsProps<T, TReturn>) {
            let list:(typeof this)[] = [];
            dynamic.set(list, {
                constructor: this,
                callback: callback,
                options: options || {},
                children: [],
                keys: (options && options.key) ? new Map() : null
            });
            return list;
        };
        private subs:Set<VeactState.Sub> = new Set();
        private displaySub:VeactState.Sub|null = null;
        private childrenElements:Set<VeactElement> = new Set();
        private visible = true;
        private parent:VeactElement|null = null;
        private destroyed = false;
        private parentVisible = true;
        private _content:Element|null = null;
        private onremove:VeactElement[]|null = null;
        state:{[key:string]:any}|null = null;
        constructor(readonly props:P|undefined, protected readonly children:Children = [], protected readonly type?:keyof JSX.IntrinsicElements) {}
        protected draw(callback:() => void) {
            let sub = VeactState.render(callback);
            this.subs.add(sub);
        }
        private drawDisplay(callback:() => void) {
            this.displaySub = VeactState.render(callback);
        }
        onRemove() {
            this.remove();
        }
        remove() {
            if (this._content && this._content.parentNode) {
                this._content.parentNode.removeChild(this._content);
            }
            if (this.onremove) {
                for (let c of this.onremove) {
                    (c.removed as (()=>void))();
                }
            }
        }
        removed?() {}
        private unsubscribe(onremove:(VeactElement)[] = []) {
            if (this.displaySub) {
                VeactState.cancel(this.displaySub);
            }
            for (let s of this.subs) {
                VeactState.cancel(s);
            }
            for (let c of this.childrenElements) {
                c.unsubscribe(onremove);
            }
            if (this.removed) {
                onremove.push(this);
            }
            return onremove;
        }
        appendTo(el:ParentNode) {
            el.append(this.node);
            return this;
        }
        valueOf() {
            return this.node;
        }
        onRender?() {};
        get node():Element {
            if (!this._content) {
                if (this.state) {
                    this.state = VeactState.state(this.state);
                }
                let sub = VeactState.disableSub();
                let el = this.render(this.props);
                if (el) {
                    this.childrenElements.add(el);
                    el.parent = this;
                    this._content = el.node;
                }
                VeactState.enableSub(sub);
                this.onRender && this.onRender();
            }
            return this._content as Element;
        }
        private pause() {
            for (let sub of this.subs) {
                VeactState.pause(sub);
            }
        }
        private resume() {
            for (let sub of this.subs) {
                VeactState.resume(sub);
            }
        }
        private pauseDisplay() {
            if (this.displaySub) {
                VeactState.pause(this.displaySub);
            }
        }
        private resumeDisplay() {
            if (this.displaySub) {
                VeactState.resume(this.displaySub);
            }
        }
        private setParentVisible(v:boolean) {
            if (this.parentVisible !== v) {
                this.parentVisible = v;
                if (v) {
                    this.resumeDisplay();
                    if (this.visible) {
                        this.resume();
                    }
                } else {
                    if (this.visible) {
                        this.pause();
                    }
                    this.pauseDisplay();
                }
                if (this.visible) {
                    for (let c of this.childrenElements) {
                        c.setParentVisible(v);
                    }
                }
            }
        }
        private setVisible(v:boolean) {
            this.visible = v;
            if (this.parentVisible) {
                if (v) {
                    this.resume();
                } else {
                    this.pause();
                }
            }
            for (let c of this.childrenElements) {
                c.setParentVisible(v);
            }
        }
        private setStyle(style:CSSStyleDeclaration, props:Props) {
            for (let [k, v] of Object.entries(props)) {
                if (v instanceof Function) {
                    if (k === "display") {
                        this.drawDisplay(((k:any, v:Function) => {
                            let value = v();
                            style[k] = value;
                            let hidden = value === "none";
                            if (this.visible === hidden) {
                                this.setVisible(!hidden);
                            }
                        }).bind(this, k, v));
                    } else {
                        this.draw(((k:any, v:Function) => {
                            style[k] = v();
                        }).bind(this, k, v));
                    }
                } else {
                    style[k as any] = v;
                }
            }
        }
        render(props?:P):VeactElement|null {
            let el = document.createElement(this.type as keyof JSX.IntrinsicElements);
            this._content = el;
            if (this.props) {
                for (let [k, v] of Object.entries(this.props)) {
                    if (Array.isArray(v)) {
                        let res:string[] = [];
                        let draws:{i:number, cb:Function}[] = [];
                        for (let i = 0; i < v.length; i++) {
                            let vv = v[i];
                            if (typeof vv === "function") {
                                draws.push({
                                    i: i,
                                    cb: vv
                                });
                            } else {
                                res.push(vv)
                            }
                        }
                        if (draws.length) {
                            this.draw(((draws:{i:number, cb:Function}[]) => {
                                for (let v of draws) {
                                    res[v.i] = v.cb();
                                }
                                el.setAttribute(k, (el as any)[k] = res.join(""));
                            }).bind(this, draws));
                        } else {
                            el.setAttribute(k, (el as any)[k] = res.join(""));
                        }
                    } else if (typeof v === "function") {
                        if (k.startsWith("on") && k.charCodeAt(2) >= 65 && k.charCodeAt(2) <= 90) {
                            el.addEventListener(k.substring(2).toLowerCase(), v);
                        } else {
                            this.draw(((k:string, v:Function) => {
                                let value = (el as any)[k] = v();
                                if (typeof value === "string") {
                                    el.setAttribute(k, value);
                                }/* else if (value === true) { // TODO:?
                                    el.setAttribute(k, "true");
                                } else if (value === false) {
                                    el.removeAttribute(k);
                                }*/
                            }).bind(this, k, v));
                        }
                    } else if (k === "style") {
                        this.setStyle(el.style, v);
                    } else {
                        (el as any)[k] = v;
                        if (typeof v === "string") {
                            el.setAttribute(k, v);
                        }
                    }
                }
            }
            this.appendChilds(this.children);
            return null;
        }
        private createDynamicChild(data:Props, array:Dynamic) {
            let p:DynamicElement = {
                data: data,
                i: null,
                element: new array.constructor(array.options && "props" in array.options ? array.options.props(data) : data, [])
            };
            this.childrenElements.add(p.element); // Duplicated
            p.element.parent = this;
            return p;
        }
        private insertDynamicChild(node:Node, array:Dynamic|null, i:number, childrenData:{node:Node|null}[], pos:number) {
            let next = array && array.children[i+1]; // Duplicated code below
            if (next) {
                (this._content as Element).insertBefore(node, next.element._content);
            } else {
                let next:Node|null = null;
                for (let ii = pos+1; ii < childrenData.length && !next; ii++) {
                    next = childrenData[ii].node;
                }
                if (next) {
                    (this._content as Element).insertBefore(node, next);
                } else {
                    (this._content as Element).appendChild(node);
                }
            }
        }
        private removeChild(el:VeactElement) {
            this.childrenElements.delete(el);
        }
        destroy() {
            if (!this.destroyed) {
                this.destroyed = true;
                this.onremove = this.unsubscribe();
                if (this.parent) {
                    this.parent.removeChild(this);
                }
                this.onRemove();
            }
        }
        protected appendChilds(children:Children) {
            let childrenData:{node:Node|null}[] = []; // Object control to insert childs in creation order
            for (let i = 0; i < children.length; i++) {
                let c = children[i];
                if (c instanceof Function) {
                    let n:{node:Node|null} = {node: null};
                    childrenData[i] = n;
                    ((c, pos) => {
                        let lastRes:Node;
                        this.draw(() => {
                            let res = c() as string;
                            if (lastRes) {
                                lastRes.nodeValue = res;
                            } else {
                                lastRes = document.createTextNode(res);
                                n.node = lastRes;
                                this.insertDynamicChild(lastRes, null, 0, childrenData, pos);
                            }
                        });
                    })(c, i);
                } else if (Array.isArray(c)) {
                    let array = dynamic.get(VeactState.value(c));
                    if (array) {
                        let n:{node:Node|null} = {node: null};
                        childrenData[i] = n;
                        ((c, array, pos) => {
                            this.draw(() => {
                                let res = array.callback() as Props[];
                                if (!Array.isArray(res)) {
                                    res = res ? [res] : [];
                                }
                                let keyf = array.options.key;
                                if (keyf) {
                                    let arrayKeys = array.keys as Map<any, DynamicElement>;
                                    let keys = new Map(arrayKeys);
                                    for (let i = 0; i < res.length; i++) {
                                        let data = res[i];
                                        let key = keyf(data);
                                        let p:DynamicElement;
                                        if (!keys.delete(key)) {
                                            p = this.createDynamicChild(data, array);
                                            array.children.push(p);
                                            arrayKeys.set(key, p);
                                            this.insertDynamicChild(p.element.node, array, array.children.length, childrenData, pos); // PUSH. TODO: Allow ordering when using keys
                                        }
                                    }
                                    for (let [key, p] of keys) {
                                        arrayKeys.delete(key);
                                        let el = p.element;
                                        el.destroy();
                                        (p.element as any) = null; // Clean memory
                                    }
                                    for (let i = 0; i < array.children.length; i++) {
                                        let p = array.children[i];
                                        if (!p.element) {
                                            c.splice(i, 1);
                                            array.children.splice(i--, 1);
                                        } else if (p.i === null) {
                                            c.splice(i, 0, p.element);
                                            p.i = i;
                                        }
                                    }
                                } else {
                                    for (let i = 0; i < res.length; i++) {
                                        let data = res[i];
                                        let p = array.children[i];
                                        if (!p) {
                                            p = this.createDynamicChild(data, array);
                                            c[i] = p.element;
                                            array.children[i] = p;
                                            this.insertDynamicChild(p.element.node, array, i, childrenData, pos);
                                        } else {
                                            if (p.data !== data) {
                                                p.element.destroy();
                                                p.data = data;
                                                p.element = new array.constructor(array.options && "props" in array.options ? array.options.props(data) : data, []);
                                                c[i] = p.element;
                                                this.childrenElements.add(p.element);
                                                p.element.parent = this;
                                                this.insertDynamicChild(p.element.node, array, i, childrenData, pos);
                                            }
                                        }
                                    }
                                    if (res.length < array.children.length) {
                                        for (let i = res.length; i < array.children.length; i++) {
                                            let el = array.children[i].element;
                                            el.destroy();
                                        }
                                        array.children.splice(res.length);
                                        c.splice(res.length);
                                    }
                                }
                                n.node = array.children.length > 0 ? array.children[0].element._content : null;
                            });
                        })(c, array, i);
                    } else {
                        childrenData[i] = this.appendChilds(c);
                    }
                } else if (c instanceof VeactElement) {
                    if (!c.destroyed) {
                        this.childrenElements.add(c);
                        c.parent = this;
                        let node = c.node;
                        childrenData[i] = {node:node};
                        (this._content as Element).appendChild(node);
                    } else {
                        childrenData[i] = {node:null};
                    }
                } else if (c != null) {
                    if (!(c instanceof Node)) {
                        c = document.createTextNode(String(c));
                    }
                    childrenData[i] = {node:c};
                    (this._content as Element).appendChild(c);
                }
            }
            return childrenData[0];
        }
    }
    /*class N3SFragment extends N3SElement {
        protected render():N3SElement {
            let el = new DocumentPersistentFragment();
            this.node = el;
            this.appendChilds(this.children);
            return null;
        }
    }*/
}
declare global {
    namespace JSX {
        type JSXEvent<T extends Event, T2 extends EventTarget> = T&{currentTarget:T2};
        type JSXHTMLEvent<T extends EventTarget> = {[K in keyof HTMLElementEventMap as `on${Capitalize<K>}`]?:(e:JSXEvent<HTMLElementEventMap[K], T>) => void};
        type JSXSVGEvent<T extends EventTarget> = {[K in keyof SVGElementEventMap as `on${Capitalize<K>}`]?:(e:JSXEvent<SVGElementEventMap[K], T>) => void};
        interface Props<T extends EventTarget = HTMLElement> extends JSXHTMLEvent<T> {
            [k:string]:any;
            style?:StyleProps;
        }
        type StyleProps = {[K in keyof CSSStyleDeclaration]?:CSSStyleDeclaration[K] extends Function ? never : CSSStyleDeclaration[K]|(()=>CSSStyleDeclaration[K])};
        type HTMLProps<T extends HTMLElement = HTMLElement> = Props<T>;
        type SVGProps<T extends SVGElement = SVGElement> = Props<T>;
        type JSXElements = {[K in keyof HTMLElementTagNameMap]:HTMLProps<HTMLElementTagNameMap[K]>}&{[K in keyof SVGElementTagNameMap]:SVGProps<SVGElementTagNameMap[K]>};

        type Element = Veact.VeactElement;
        //type ElementClass = DOM.N3SElement;
        interface IntrinsicElements extends JSXElements {
            // TODO: fragment
        }
        interface ElementAttributesProperty {
            props: {};
        }
    }
}