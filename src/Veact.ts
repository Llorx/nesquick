import { Child, Props, VeactElement } from "./VeactElement";

namespace Veact {
    export function createElement(type:string, props?:Props|null, ...children:Child[]) {
        return new VeactElement(type, props || null, children);
    }
    export function render(element:VeactElement, parent?:HTMLElement|null) {
        if (parent != null) {
            parent.appendChild(element.render(parent.ownerDocument));
        } else {
            document.body.appendChild(element.render(document));
        }
    }
}
export default Veact;