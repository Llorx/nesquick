import { NesquickComponent, Children, Child } from "./NesquickComponent";

export namespace Nesquick {
    export function render(component:NesquickComponent<any>, parent?:HTMLElement|null) {
        if (parent != null) {
            parent.appendChild(component.render(parent.ownerDocument));
        } else {
            document.body.appendChild(component.render(document));
        }
    }
}
export { Children, Child };
export default Nesquick;