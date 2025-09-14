import { NesquickElement, Children, Child } from "./NesquickElement";

export namespace Nesquick {
    export function render(element:NesquickElement<any>, parent?:HTMLElement|null) {
        if (parent != null) {
            parent.appendChild(element.render(parent.ownerDocument));
        } else {
            document.body.appendChild(element.render(document));
        }
    }
}
export { Children, Child };
export default Nesquick;