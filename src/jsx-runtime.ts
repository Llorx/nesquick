import { FunctionComponent, Props, VeactElement } from "./VeactElement";
import { VeactFragment } from "./VeactFragment";

export const Fragment = Symbol();
export function jsxs<P extends Props>(type:string|FunctionComponent<P>|typeof Fragment, props:P, key?: string) {
    if (type === Fragment) {
        return new VeactFragment(props.children);
    }
    return new VeactElement(type, props, key);
}
export const jsx = jsxs;

type OmitKey<T> = Omit<T, "key">;
declare const WrappedFunctionType:unique symbol;
type WrappedFunction<T> = T extends undefined ? T : ((() => T) & {readonly [WrappedFunctionType]?:T});
type UserProp<T> = T extends (...args:infer A)=>infer R ? (((...args:A)=>R)|T) : WrappedFunction<T>;
type ComponentProp<T> = T extends {readonly [WrappedFunctionType]?:infer R} ? (T|R) : T extends (...args: any[]) => any ? T : (T|(() => T));
type UnFunction<T> = T extends {readonly [WrappedFunctionType]?:infer R} ? (T|R) : T;
type UserProps<T> = T extends any ? {
    [K in keyof OmitKey<T>]:K extends "children" ? T[K] : UserProp<T[K]>;
} : never;
type ComponentProps<T> = T extends any ? keyof OmitKey<T> extends never ? {} : {
    [K in keyof OmitKey<T>]:K extends "children" ? UnFunction<T[K]> : ComponentProp<T[K]>;
} : never;
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

    export type Element = VeactElement<any>;
    export interface IntrinsicElements extends JSXElements {
        // TODO: fragment
    }

    export type ElementType =
        keyof IntrinsicElements |
        Component<any> |
        typeof VeactElement<any>;

    export interface IntrinsicAttributes {
        //readonly [VeactComponent]:typeof VeactComponent;
        key?:string|number;
    }
    export interface ElementAttributesProperty {
        props: {};
    }
    export interface ElementChildrenAttribute {
        children: {};
    }
    export type LibraryManagedAttributes<_, P> = ComponentProps<P>;
}