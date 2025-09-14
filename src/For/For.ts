import { Props, JSX } from "../jsx-runtime";
import { useRender, useState } from "../State";
import { NesquickFragment } from "../NesquickFragment";
import { getMap, IdMap } from "./getMap";

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
    cycle:boolean;
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
    ids?:never;
    id:(item:T, i:number)=>unknown;
} | {
    ids:(item:T, i:number)=>unknown[];
    id?:never;
} | {
    ids?:never;
    id?:never;
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
function getCycleMap<T>(props:Props<ForProps<T>>) {
    const map:IdMap<T, unknown, ForChilds> = getMap(props);
    let cycle = false;
    return {
        ...map,
        cycle() {
            cycle = !cycle;
        },
        pushChild(id:unknown, child:ForChild) {
            const childs = map.getChild(id);
            if (childs) {
                child.childs = childs;
                childs.list.push(child);
            } else {
                map.setChild(id, child.childs = {
                    list: [child],
                    offset: 0,
                    cycle: cycle
                });
            }
        },
        getChild(id:unknown) {
            const childs = map.getChild(id);
            if (childs) {
                if (childs.cycle === cycle) {
                    if (childs.offset < childs.list.length) {
                        return childs.list[childs.offset++];
                    }
                } else {
                    childs.cycle = cycle;
                    childs.offset = 1;
                    return childs.list[0];
                }
            }
        },
        popChild(child:ForChild) {
            const childs = child.childs;
            if (childs.list.length === 1) {
                map.deleteChild(child.id);
            } else {
                if (childs.offset === childs.list.length) {
                    childs.offset--;
                }
                childs.list.pop();
            }
        },
        skipChild(child:ForChild) {
            const childs = child.childs;
            if (childs.cycle === cycle) {
                if (childs.offset < childs.list.length) {
                    childs.offset++;
                }
            } else {
                childs.offset = 1;
                childs.cycle = cycle;
            }
        }
    };
}
export function For<T>(props:Props<ForProps<T>>) {
    const children:ForChild[] = [];
    const fragment = new NesquickFragment([]);
    let cycle = false;
    const map = getCycleMap(props);
    useRender(() => {
        cycle = !cycle;
        const each = props.each().slice(); // slice just in case it returns a reference that is modified while rendering
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
                map.pushChild(id, child);
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
            map.cycle();
            // cycle existing elements to know which ones are deleted
            for (let i = 0; i < each.length; i++) {
                const item = each[i];
                const id = map.getId(item, i);
                const child = map.getChild(id);
                if (child) {
                    child.cycle = cycle;
                }
            }
            map.cycle();
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
                        map.popChild(oldChild);
                        if (children.length < each.length) {
                            min = children.length;
                        }
                        offset--;
                        continue;
                    } else {
                        let child = map.getChild(id);
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
                            map.pushChild(id, child);
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
                    map.skipChild(oldChild);
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
                map.pushChild(id, child);
                children.push(child);
                fragment.appendElement(child.element);
            }
            // delete old elements at the end of the old array
            // (from the end, for performance reasons)
            if (each.length < children.length) {
                for (let i = children.length - 1; i >= each.length; i--) {
                    const oldChild = children[i];
                    fragment.removeElement(i);
                    map.popChild(oldChild);
                }
                children.splice(each.length);
            }
        }
    });
    return fragment;
}