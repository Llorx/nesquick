import { FunctionComponent, ComponentProps, NesquickComponent } from "../NesquickComponent";
import { NesquickFragment } from "../NesquickFragment";

export const Fragment = Symbol();
function functionizeProps(props:Record<string, any>) {
    for (const k in props) {
        if (typeof props[k] !== "function") {
            const v = props[k];
            props[k] = () => v;
        }
    }
}
export function jsxs<P extends ComponentProps>(type:string|FunctionComponent<P>|typeof Fragment, props:P, key?:string|number|null) {
    if (type === Fragment) {
        return new NesquickFragment(props.children);
    }
    if (typeof type !== "string") {
        functionizeProps(props);
    } else if (key !== undefined) {
        (props as any).key = key;
    }
    return new NesquickComponent(type, props);
}
export const jsx = jsxs;

// exactOptionalPropertyTypes detection for specific optional types
type HasUndefined<T, K extends keyof T> = {[L in K]-?:T[K]|undefined} extends {[L in K]?:T[K]} ? undefined extends T[K] ? true : false : false;

declare const WrappedFunctionType:unique symbol;
type WrappedFunction<T> = (() => T) & {readonly [WrappedFunctionType]?:T};
type UserProp<T> = T extends (...args:infer A)=>infer R ? (((...args:A)=>R)|T) : WrappedFunction<T>;
type UserProps<T> = {
    readonly [K in keyof T]:HasUndefined<T, K> extends true ? UserProp<T[K] | undefined> : UserProp<Exclude<T[K], undefined>>;
};
type JSXProp<T> = T extends {readonly [WrappedFunctionType]?:infer R} ? (T|R) : T extends (...args: any[]) => any ? T : (T|(() => T));
type JSXProps<T> = keyof T extends never ? {} : {
    [K in keyof T]:JSXProp<T[K]>;
};
export type Generic<T> = T extends (...args:any)=>infer R ? R : T;
export { UserProps as Props };
export type Component<P = {}> = (props:UserProps<P>) => JSX.Element;
export namespace JSX {
    export type JSXEvent<T extends Event, T2 extends EventTarget> = T&{currentTarget:T2};
    export type JSXHTMLEvent<T extends EventTarget> = {[K in keyof HTMLElementEventMap as `on${Capitalize<K>}`]?:(e:JSXEvent<HTMLElementEventMap[K], T>) => void};
    export type JSXSVGEvent<T extends EventTarget> = {[K in keyof SVGElementEventMap as `on${Capitalize<K>}`]?:(e:JSXEvent<SVGElementEventMap[K], T>) => void};
    export interface Props<T extends EventTarget = HTMLElement> extends JSXHTMLEvent<T>, JSXSVGEvent<T> {
        [k:string]:any;
        style?:Style;
        xmlns?:string|null;
        ref?:((el:T)=>void)|null;
    }
    export type Style = StyleProps|string;
    export type StyleProps = {[K in keyof CSSStyleDeclaration]?:CSSStyleDeclaration[K] extends Function ? never : CSSStyleDeclaration[K]|(()=>CSSStyleDeclaration[K])};
    export type HTMLProps<T extends HTMLElement = HTMLElement> = Props<T>;
    export type SVGProps<T extends SVGElement = SVGElement> = Props<T>;
    export type JSXElements = {[K in keyof HTMLElementTagNameMap]:HTMLProps<HTMLElementTagNameMap[K]>}&{[K in keyof SVGElementTagNameMap]:SVGProps<SVGElementTagNameMap[K]>};

    export type Element = NesquickComponent<any>;
    export interface IntrinsicElements extends JSXElements {
        // TODO: fragment
    }

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
    export type LibraryManagedAttributes<_, P> = JSXProps<P>;
}