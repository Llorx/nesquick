import { VeactElement } from "./VeactElement";

//export * from "./useComponent";
export * from "./For/For";

export namespace Veact {
    export function render(element:VeactElement<any>, parent?:HTMLElement|null) {
        if (parent != null) {
            parent.appendChild(element.render(parent.ownerDocument));
        } else {
            document.body.appendChild(element.render(document));
        }
    }
}
export default Veact;