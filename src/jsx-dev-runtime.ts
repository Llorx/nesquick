import { Fragment, jsx } from "./jsx-runtime";
import { FunctionComponent, Props } from "./NesquickElement";
export * from "./jsx-runtime";

type JsxSource = {
    fileName:string;
    lineNumber:number;
    columnNumber?:number;
};
export function jsxDEV<P extends Props>(type:string|FunctionComponent<P>|typeof Fragment, props:P, key:string|number|null, _isStaticChildren:boolean, _source:JsxSource, _self:any) {
    return jsx(type, props, key);
}