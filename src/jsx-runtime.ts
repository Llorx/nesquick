import { FunctionComponent, ComponentProps, NesquickComponent } from "./NesquickComponent";
import { NesquickFragment } from "./NesquickFragment";

const Fragment = Symbol();
export function functionizeProps(props:ComponentProps) {
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

export type { Fragment };