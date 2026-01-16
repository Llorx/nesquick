import { FunctionComponent, ComponentProps, NesquickComponent } from "./NesquickComponent";
import { NesquickFragment } from "./NesquickFragment";

export const Fragment = Symbol();
export function jsxs<P extends ComponentProps>(type:string|FunctionComponent<P>|typeof Fragment, props:P, key?:string|number|null) {
    if (type === Fragment) {
        return new NesquickFragment(props.children);
    }
    if (key !== undefined) {
        (props as any).key = key;
    }
    return new NesquickComponent(type, props);
}
export function jsx<P extends ComponentProps>(type:string|FunctionComponent<P>|typeof Fragment, props:P, key?:string|number|null) {
    if (type === Fragment) {
        return new NesquickFragment([props.children]);
    }
    if (key !== undefined) {
        (props as any).key = key;
    }
    return new NesquickComponent(type, props);
}

export type Component<P extends Record<any, any> = {}> = (props:P) => JSX.Element;
export namespace JSX {
    export type JSXEvent<T extends Event, T2 extends EventTarget> = T&{currentTarget:T2};
    export type JSXHTMLEvent<T extends EventTarget> = {[K in keyof HTMLElementEventMap as `on${Capitalize<K>}`]?:(e:JSXEvent<HTMLElementEventMap[K], T>) => void};
    export type JSXSVGEvent<T extends EventTarget> = {[K in keyof SVGElementEventMap as `on${Capitalize<K>}`]?:(e:JSXEvent<SVGElementEventMap[K], T>) => void};
    export interface Props<T extends EventTarget = HTMLElement> extends JSXHTMLEvent<T>, JSXSVGEvent<T> {
        [k:string]:any;
        style?:Style;
        xmlns?:string|null;
        "nq:ref"?:((el:T)=>void)|null;
        "nq:update"?:((el:T)=>void)|null;
    }
    export type Style = StyleProps|string;
    export type StyleProps = {[K in keyof CSSStyleDeclaration]?:CSSStyleDeclaration[K] extends Function ? never : CSSStyleDeclaration[K]|(()=>CSSStyleDeclaration[K])};
    export type HTMLProps<T extends HTMLElement = HTMLElement> = Props<T>;
    export type SVGProps<T extends SVGElement = SVGElement> = Props<T>;
    export type IntrinsicElements = {[K in keyof HTMLElementTagNameMap]:HTMLProps<HTMLElementTagNameMap[K]>}&{[K in keyof SVGElementTagNameMap]:SVGProps<SVGElementTagNameMap[K]>};

    export type Element = NesquickComponent<any>;

    export type ElementType =
        keyof IntrinsicElements |
        Component<any> |
        typeof NesquickComponent<any>;
    
    declare const NotEmptyObject:unique symbol;
    export type IntrinsicAttributes = {
        [NotEmptyObject]?:typeof NotEmptyObject;
    };
    export interface ElementAttributesProperty {
        props:{};
    }
    export interface ElementChildrenAttribute {
        children:{};
    }
}