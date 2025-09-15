import { FunctionComponent, Props, NesquickElement } from "./NesquickElement";
import { NesquickFragment } from "./NesquickFragment";

export const Fragment = Symbol();
export function jsxs<P extends Props>(type:string|FunctionComponent<P>|typeof Fragment, props:P, key?:string|number|null) {
    if (type === Fragment) {
        return new NesquickFragment(props.children);
    }
    if (key !== undefined) {
        (props as any).key = key;
    }
    return new NesquickElement(type, props);
}
export const jsx = jsxs;

declare const WrappedFunctionType:unique symbol;
type WrappedFunction<T> = (() => T) & {readonly [WrappedFunctionType]?:T};
type UserProp<T> = T extends (...args:infer A)=>infer R ? (((...args:A)=>R)|T) : WrappedFunction<T>;
type ComponentProp<T> = T extends {readonly [WrappedFunctionType]?:infer R} ? (T|R) : T extends (...args: any[]) => any ? T : (T|(() => T));
type UnFunction<T> = T extends {readonly [WrappedFunctionType]?:infer R} ? (T|R) : T;
type UserProps<T> = {
    [K in keyof T]:K extends "children" ? T[K] : UserProp<T[K]>;
};
type ComponentProps<T> = keyof T extends never ? {} : {
    [K in keyof T]:K extends "children" ? UnFunction<T[K]> : ComponentProp<T[K]>;
};
export type Generic<T> = T extends (...args:any)=>infer R ? R : T;
export { UserProps as Props };
export type Component<P = {}> = (props:UserProps<P>) => JSX.Element;
export namespace JSX {
    export type JSXEvent<T extends Event, T2 extends EventTarget> = T&{currentTarget:T2};
    export type JSXHTMLEvent<T extends EventTarget> = {[K in keyof HTMLElementEventMap as `on${Capitalize<K>}`]?:(e:JSXEvent<HTMLElementEventMap[K], T>) => void};
    export type JSXSVGEvent<T extends EventTarget> = {[K in keyof SVGElementEventMap as `on${Capitalize<K>}`]?:(e:JSXEvent<SVGElementEventMap[K], T>) => void};
    export interface Props<T extends EventTarget = HTMLElement> extends JSXHTMLEvent<T> {
        [k:string]:any;
        style?:StyleProps;
    }
    export type StyleProps = {[K in keyof CSSStyleDeclaration]?:CSSStyleDeclaration[K] extends Function ? never : CSSStyleDeclaration[K]|(()=>CSSStyleDeclaration[K])};
    export type HTMLProps<T extends HTMLElement = HTMLElement> = Props<T>;
    export type SVGProps<T extends SVGElement = SVGElement> = Props<T>;
    export type JSXElements = {[K in keyof HTMLElementTagNameMap]:HTMLProps<HTMLElementTagNameMap[K]>}&{[K in keyof SVGElementTagNameMap]:SVGProps<SVGElementTagNameMap[K]>};

    export type Element = NesquickElement<any>;
    export interface IntrinsicElements extends JSXElements {
        // TODO: fragment
    }

    export type ElementType =
        keyof IntrinsicElements |
        Component<any> |
        typeof NesquickElement<any>;
    
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
    export type LibraryManagedAttributes<_, P> = ComponentProps<P>;
}