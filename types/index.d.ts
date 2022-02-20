declare global {
    interface Object {
        val<T>(this: T): VeactState.ReturnReturnType<T>;
    }
}
declare namespace VeactState {
    export interface Prop {
        proxified: Map<string | number | Symbol, Prop>;
        value: any;
        realValue: any;
        dirty: boolean;
        cbs: Set<Sub>;
        prop: string | number | Symbol;
    }
    export interface Sub {
        oldProps: Set<Prop>;
        props: Set<Prop>;
        animated: boolean;
        cb: () => void;
        prerunning: Sub | null;
        paused: boolean;
        dirty: boolean;
    }
    export const IS_PROXY: unique symbol;
    export const GET_VALUE: unique symbol;
    export function disableSub(): Sub | null;
    export function enableSub(sub: Sub | null): void;
    export function pause(sub: Sub): void;
    export function resume(sub: Sub): void;
    export function draw(callback: () => void): void;
    export function render(callback: () => void): Sub;
    export function cancel(sub: Sub): void;
    export function proxy(obj: any): any;
    export function value(obj: any): any;
    export type ReturnReturnType<T> = T extends (...args: any) => infer R ? ReturnReturnType<R> : T;
    export function stateNoOptions<T>(st: T): T;
    interface StateOptions<T> {
        saveInterval: number;
    }
    interface StateOptionsLocal<T> extends StateOptions<T> {
        syncKey: string;
        onLoad?(state: T): any;
    }
    interface StateOptionsCustom<T> extends StateOptions<T> {
        load(state: T): any;
        save(state: T): any;
    }
    export function state<T>(st: T, options?: StateOptionsLocal<T> | StateOptionsCustom<T>): T;
    export {};
}

declare namespace Veact {
    export interface Props {
        [k: string]: any;
    }
    interface DynamicOptions<T extends Props> {
        key?: (props: T) => any;
    }
    interface DynamicOptionsProps<T extends Props, TReturn extends Props> extends DynamicOptions<T> {
        props: (props: T) => TReturn;
    }
    type VeactElementConstructor<T = any> = new (props: T extends Props ? T : never, children: Children, type?: keyof JSX.IntrinsicElements) => T extends Props ? VeactElement<T> : VeactElement;
    export type Sub<T> = T extends {
        [key: string]: any;
    } ? T extends Array<any> ? T | (() => T) : {
        [K in keyof T]: T[K] | (() => T[K]);
    } : T | (() => T);
    export type SubAll<T> = T extends {
        [key: string]: any;
    } ? {
        [K in keyof T]: SubAll<T[K]>;
    } : T | (() => T);
    export type Children = (string | Node | VeactElement | (() => string | Props | Props[]))[];
    export function createElement<T extends JSX.Props>(type: keyof JSX.IntrinsicElements, props?: T, ...children: Children): VeactElement<T>;
    export function createElement<T extends Props>(type: new (props: T, children: Children) => VeactElement<T>, props?: T, ...children: Children): VeactElement<T>;
    export function createElement<T extends Props>(type: (props: T) => VeactElement<any>, props?: T, ...children: Children): VeactElement<T>;
    export class VeactElement<P extends Props = {}> {
        readonly props?: P | undefined;
        protected readonly children: Children;
        protected readonly type?: keyof JSX.IntrinsicElements | undefined;
        static for<T extends Props | boolean>(this: VeactElementConstructor<T>, callback: () => T | T[]): VeactElementConstructor<T>[];
        static for<T extends Props | boolean>(this: VeactElementConstructor<T>, callback: () => T | T[], options: T extends Props ? DynamicOptions<T> : undefined): VeactElementConstructor<T>[];
        static for<T extends Props, TReturn extends Props>(this: VeactElementConstructor<TReturn>, callback: () => T | T[], options: DynamicOptionsProps<T, TReturn>): VeactElementConstructor<T>[];
        private subs;
        private displaySub;
        private childrenElements;
        private visible;
        private parent;
        private destroyed;
        private parentVisible;
        private _content;
        private onremove;
        state: {
            [key: string]: any;
        } | null;
        constructor(props?: P | undefined, children?: Children, type?: keyof JSX.IntrinsicElements | undefined);
        protected draw(callback: () => void): void;
        private drawDisplay;
        onRemove(): void;
        remove(): void;
        removed?(): void;
        private unsubscribe;
        appendTo(el: ParentNode): this;
        valueOf(): Element;
        onRender?(): void;
        get node(): Element;
        private pause;
        private resume;
        private pauseDisplay;
        private resumeDisplay;
        private setParentVisible;
        private setVisible;
        private setStyle;
        render(props?: P): VeactElement | null;
        private createDynamicChild;
        private insertDynamicChild;
        private removeChild;
        destroy(): void;
        protected appendChilds(children: Children): {
            node: Node | null;
        };
    }
    export {};
}
declare global {
    namespace JSX {
        type JSXEvent<T extends Event, T2 extends EventTarget> = T & {
            currentTarget: T2;
        };
        type JSXHTMLEvent<T extends EventTarget> = {
            [K in keyof HTMLElementEventMap as `on${Capitalize<K>}`]?: (e: JSXEvent<HTMLElementEventMap[K], T>) => void;
        };
        type JSXSVGEvent<T extends EventTarget> = {
            [K in keyof SVGElementEventMap as `on${Capitalize<K>}`]?: (e: JSXEvent<SVGElementEventMap[K], T>) => void;
        };
        interface Props<T extends EventTarget = HTMLElement> extends JSXHTMLEvent<T> {
            [k: string]: any;
            style?: StyleProps;
        }
        type StyleProps = {
            [K in keyof CSSStyleDeclaration]?: CSSStyleDeclaration[K] extends Function ? never : CSSStyleDeclaration[K] | (() => CSSStyleDeclaration[K]);
        };
        type HTMLProps<T extends HTMLElement = HTMLElement> = Props<T>;
        type SVGProps<T extends SVGElement = SVGElement> = Props<T>;
        type JSXElements = {
            [K in keyof HTMLElementTagNameMap]: HTMLProps<HTMLElementTagNameMap[K]>;
        } & {
            [K in keyof SVGElementTagNameMap]: SVGProps<SVGElementTagNameMap[K]>;
        };
        type Element = Veact.VeactElement;
        interface IntrinsicElements extends JSXElements {
        }
        interface ElementAttributesProperty {
            props: {};
        }
    }
}

export { Veact, VeactState };
