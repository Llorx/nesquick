import { Fragment, jsx } from "./jsx-runtime";
import { FunctionComponent, Props } from "./NesquickElement";
export * from "./jsx-runtime";

type JsxSource = {
    fileName:string;
    lineNumber:number;
    columnNumber?:number;
};
export function jsxDEV<P extends Props>(type:string|FunctionComponent<P>|typeof Fragment, props:P, key:string|number|null, _isStaticChildren:boolean, source:JsxSource, self:any) {
    return jsx(type, {
        ...props,
        __source: source,
        __self: self
    }, key);
}