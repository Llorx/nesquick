import { Props, JSX } from "../jsx-runtime";
import { useRender, useState } from "../State";
import { VeactFragment } from "../VeactFragment";
import { getMap, IdMap } from "./getMap";

// hay una propiedad "uniqueIds" que indica
// si se pueden dar ids duplicadas.
// por defecto es false.
// cuando son todo ids únicas, entonces no hay problema.
// cuando se pueden dar ids duplicadas, entonces
// se aplica la lógica del i:
// 
// cambia el elemento en la posición 3
// cómo lo detecta?
// si la id del elemento en la posición 3 es diferente, entonces
// busca el primer elemento con esa ID
// mueve el nodo
// ya está
// es decir, solo cambia que el mapa de elementos es un mapa-array
// entonces es un mapa de ids de 1 elemento, pero múltiple
// es decir, hay push y hay pop

/*

se hace setchild
eso setea el child, tiene que ser en un array, obligatorio
después se hace getchild
eso hace get solo del child, con un offset para hacer get en orden (el primer i, después el segundo i...)
con esto no hace falta detectar duplicados


*/

type ForChild = {
    id:unknown;
    i:number;
    setI:((i:number)=>void)|null;
    element:JSX.Element;
    cycle:boolean;
    childs:ForChilds;
};
type ForChilds = {
    list:ForChild[];
    offset:number;
    cycle:number;
}
type InitialForChild = Omit<ForChild, "element"|"childs"> & {
    element:ForChild["element"]|null;
    childs:ForChild["childs"]|null;
};
type ChildRender<T> = (item:T, i:() => number) => JSX.Element;
export type ForProps<T> = {
    each:T[];
    children:ChildRender<T>;
} & ({
    id?:(item:T, i:number)=>unknown;
} | {
    ids?:(item:T, i:number)=>unknown[];
});

function renderChild<T>(child:InitialForChild, item:T, render:ChildRender<T>) {
    let getI = () => {
        const iState = useState(child.i);
        getI = iState[0];
        child.setI = iState[1];
        return iState[0]();
    };
    child.element = render(item, () => getI());
    return child as ForChild;
};
export function For<T>(props:Props<ForProps<T>>) {
    const children:ForChild[] = [];
    const fragment = new VeactFragment([]);
    let cycle = false;
    let childsCycle = 0;
    const map:IdMap<T, unknown, ForChilds> = getMap(props);
    useRender(() => {
        cycle = !cycle;
        childsCycle = 0;
        const each = props.each().slice(); // slice just in case it returns a reference that is modified somewhere
        if (children.length === 0) {
            for (let i = 0; i < each.length; i++) {
                const item = each[i];
                const id = map.getId(item, i);
                const child = renderChild({
                    id: id,
                    i: i,
                    setI: null,
                    element: null,
                    cycle: cycle,
                    childs: null
                }, item, props.children);
                const childs = map.getChild(id);
                if (childs) {
                    child.childs = childs;
                    childs.list.push(child);
                } else {
                    map.setChild(id, child.childs = {
                        list: [child],
                        offset: 0,
                        cycle: 2
                    });
                }
                children.push(child);
                fragment.appendElement(child.element);
            }
        } else if (each.length === 0) {
            for (let i = 0; i < children.length; i++) {
                fragment.removeElement(i);
            }
            map.clearChilds();
            children.splice(0);
        } else {
            // cycle existing elements to know which ones are deleted
            for (let i = 0; i < each.length; i++) {
                const item = each[i];
                const id = map.getId(item, i);
                const childs = map.getChild(id);
                if (childs) {
                    if (childs.cycle === childsCycle) {
                        if (childs.offset < childs.list.length) {
                            const child = childs.list[childs.offset++];
                            if (child) {
                                child.cycle = cycle;
                            }
                        }
                    } else {
                        childs.cycle = childsCycle;
                        childs.list[0].cycle = cycle;
                        childs.offset = 1;
                    }
                }
            }
            childsCycle++;
            let min = Math.min(children.length, each.length);
            let offset = 0;
            // look for elements and delete/create/swap them
            for (let i = 0; i < min; i++) {
                const item = each[i];
                const id = map.getId(item, i);
                const oldChild = children[i];
                if (!map.equalsId(oldChild.id, id)) {
                    // if the element changed for this position
                    if (oldChild.cycle !== cycle) {
                        // if the old element is not existant in the new array
                        // remove it and repeat the loop
                        fragment.removeElement(i);
                        children.splice(i--, 1);
                        const childs = oldChild.childs;
                        if (childs.list.length === 1) {
                            map.deleteChild(oldChild.id);
                        } else {
                            if (childs.offset === childs.list.length) {
                                childs.offset--;
                            }
                            childs.list.pop();
                        }
                        if (children.length < each.length) {
                            min = children.length;
                        }
                        offset--;
                        continue;
                    } else {
                        let child:ForChild|undefined;
                        const childs = map.getChild(id);
                        if (childs) {
                            if (childs.cycle === childsCycle) {
                                if (childs.offset < childs.list.length) {
                                    child = childs.list[childs.offset++];
                                }
                            } else {
                                childs.cycle = childsCycle;
                                child = childs.list[0];
                                childs.offset = 1;
                            }
                        }
                        if (!child) {
                            // if the element is new, create it in this position
                            child = renderChild({
                                id: id,
                                i: i,
                                setI: null,
                                element: null,
                                cycle: cycle,
                                childs: null
                            }, item, props.children);
                            fragment.spliceElement(i, child.element);
                            const childs = map.getChild(id);
                            if (childs) {
                                child.childs = childs;
                                childs.list.push(child);
                            } else {
                                map.setChild(id, child.childs = {
                                    list: [child],
                                    offset: 0,
                                    cycle: 2
                                });
                            }
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
                            child.setI?.(i);
                            fragment.swapElements(oldChild.i + offset, child.i);
                        }
                    }
                } else {
                    const childs = oldChild.childs;
                    if (childs.cycle === childsCycle) {
                        if (childs.offset < childs.list.length) {
                            childs.offset++;
                        }
                    } else {
                        childs.offset = 1;
                        childs.cycle = childsCycle;
                    }
                    if (oldChild.i !== i) {
                        oldChild.i = i;
                        oldChild.setI?.(i);
                    }
                }
            }
            // the remaining elements at the end of the array are new
            for (let i = min; i < each.length; i++) {
                const item = each[i];
                const id = map.getId(item, i);
                const child = renderChild({
                    id: id,
                    i: i,
                    setI: null,
                    element: null,
                    cycle: cycle,
                    childs: null
                }, item, props.children);
                const childs = map.getChild(id);
                if (childs) {
                    child.childs = childs;
                    childs.list.push(child);
                } else {
                    map.setChild(id, child.childs = {
                        list: [child],
                        offset: 0,
                        cycle: 2
                    });
                }
                children.push(child);
                fragment.appendElement(child.element);
            }
            // delete old elements at the end of the old array
            // (from the end, for performance reasons)
            if (each.length < children.length) {
                for (let i = children.length - 1; i >= each.length; i--) {
                    const oldChild = children[i];
                    fragment.removeElement(i);
                    const childs = oldChild.childs;
                    if (childs.list.length === 1) {
                        map.deleteChild(oldChild.id);
                    } else {
                        if (childs.offset === childs.list.length) {
                            childs.offset--;
                        }
                        childs.list.pop();
                    }
                }
                children.splice(each.length);
            }
        }
    });
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