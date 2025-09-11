import { Props, JSX } from "./jsx-runtime";
import { useRender } from "./State";
import { VeactFragment } from "./VeactFragment";


type ForChild = {
    id:number;
    i:number;
    element:JSX.Element;
    cycle:boolean;
};
export function For<T>(props:Props<{each:T[], id?:(item:T, i:number)=>any, children:(item:T, i:number)=>JSX.Element}>) {
    const children:ForChild[] = [];
    const fragment = new VeactFragment([]);
    let cycle = false;
    if (props.id) {
        const childrenMap = new Map<any, ForChild>();
        useRender(() => {
            cycle = !cycle;
            const each = props.each().slice(); // slice just in case it returns a reference that is modified somewhere
            if (childrenMap.size === 0) {
                for (let i = 0; i < each.length; i++) {
                    const item = each[i];
                    const id = props.id!(item, i);
                    const child:ForChild = {
                        id: id,
                        i: i,
                        element: props.children(item, i),
                        cycle: cycle
                    };
                    childrenMap.set(id, child);
                    children.push(child);
                    fragment.appendElement(child.element);
                }
            } else if (each.length === 0) {
                for (let i = 0; i < children.length; i++) {
                    fragment.removeElement(i);
                }
                childrenMap.clear();
                children.splice(0);
            } else {
                // cycle existing elements to know which ones are deleted
                for (let i = 0; i < each.length; i++) {
                    const item = each[i];
                    const id = props.id!(item, i);
                    const child = childrenMap.get(id);
                    if (child) {
                        child.cycle = cycle;
                    }
                }
                let min = Math.min(children.length, each.length);
                let offset = 0;
                // look for elements and delete/create/swap them
                for (let i = 0; i < min; i++) {
                    const item = each[i];
                    const id = props.id!(item, i);
                    const oldChild = children[i];
                    oldChild.i = i;
                    if (oldChild.id !== id) {
                        // if the element changed for this position
                        if (oldChild.cycle !== cycle) {
                            // if the old element is not existant in the new array
                            // remove it and repeat the loop
                            fragment.removeElement(i);
                            children.splice(i--, 1);
                            childrenMap.delete(oldChild.id);
                            if (children.length < each.length) {
                                min = children.length;
                            }
                            offset--;
                            continue;
                        } else {
                            let child = childrenMap.get(id);
                            if (!child) {
                                // if the element is new, create it in this position
                                child = {
                                    id: id,
                                    i: i,
                                    element: props.children(item, i),
                                    cycle: cycle
                                };
                                fragment.spliceElement(i, child.element);
                                childrenMap.set(id, child);
                                children.splice(i, 0, child);
                                if (children.length <= each.length) {
                                    min = children.length;
                                }
                                offset++;
                            } else {
                                // if is not new, swap it
                                children[child.i + offset] = oldChild;
                                children[i] = child;
                                oldChild.i = child.i;
                                child.i = i;
                                fragment.swapElements(oldChild.i + offset, child.i);
                            }
                        }
                    }
                }
                // the remaining elements at the end of the array are new
                for (let i = min; i < each.length; i++) {
                    const item = each[i];
                    const id = props.id!(item, i);
                    const child:ForChild = {
                        id: id,
                        i: i,
                        element: props.children(item, i),
                        cycle: cycle
                    };
                    childrenMap.set(id, child);
                    children.push(child);
                    fragment.appendElement(child.element);
                }
                // delete old elements at the end of the old array
                // (from the end, for performance reasons)
                if (each.length < children.length) {
                    for (let i = children.length - 1; i >= each.length; i--) {
                        const oldChild = children[i];
                        fragment.removeElement(i);
                        childrenMap.delete(oldChild.id);
                    }
                    children.splice(each.length);
                }
            }
        });
    } else {

    }
    return fragment;
}
/*
Para poder tener control de los hijos, un componente veactelement necesita saber de este array de hijos
El problema es que un componente de este tipo no tiene padre donde colocarlos

si se hiciera lo de los hijos en un componente, como el render obliga a tener un parent, ya estaría hecho
es decir, si mi componente recibe hijos, tengo que meter esos hijos en un componente
PERO si hago un For, entonces no tengo componente padre
sino que el resultado del for es lo que se mete en el componente padre
entonces es peor de rendimiento

En qué momento un componente tiene padre?
cuando se llama a render.
Es decir, cuando se llama a render es porque tiene un componente donde colocar el elemento
así que lo que habría que hacer es:
- de alguna forma tener un append que llama a un método donde se le pasa el padre donde se va a hacer append
- así el for puede saber dónde se va a colocar
- y del mismo modo el resto de elementos lo pueden saber
*/