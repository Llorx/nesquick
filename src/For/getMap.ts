import { Props } from "../jsx-runtime";
import { ForProps } from "./For";

export type IdMap<T, ID, CHILD> = {
    getId(item:T, i:number):ID;
    equalsId(a:ID, b:ID):boolean;
    getChild(id:ID):CHILD|undefined;
    setChild(id:ID, child:CHILD):void;
    deleteChild(id:ID):void;
    clearChilds():void;
};
type IdMapProps<T> = Props<Pick<Extract<ForProps<T>, {id?:unknown}>, "id">|Pick<Extract<ForProps<T>, {ids?:unknown}>, "ids">>;
export function getMap<T, CHILD>(props:Required<Extract<IdMapProps<T>, {id?:unknown}>>):IdMap<T, unknown, CHILD>;
export function getMap<T, CHILD>(props:Required<Extract<IdMapProps<T>, {ids?:unknown}>>):IdMap<T, unknown[], CHILD>;
export function getMap<T, CHILD>(props:IdMapProps<T>):IdMap<T, { item:T; i:number }, CHILD>;
export function getMap<T, CHILD>(props:IdMapProps<T>) {
    if ("id" in props && props.id) {
        const childrenMap = new Map<unknown, CHILD>();
        return {
            getId(item, i) {
                return props.id!(item, i);
            },
            equalsId(a, b) {
                return a === b;
            },
            getChild(id) {
                return childrenMap.get(id);
            },
            setChild(id, child) {
                childrenMap.set(id, child);
            },
            deleteChild(id) {
                childrenMap.delete(id);
            },
            clearChilds() {
                childrenMap.clear();
            }
        } satisfies IdMap<T, unknown, CHILD>;
    } else if ("ids" in props && props.ids) {
        // TODO: Add pre-amde maps for 1 element in the ids array, 2 elements, etc
        // and return the corresponding map on the first getId
        const childrenMap = new Map<unknown, any>();
        let idLength = 0;
        return {
            getId(item, i) {
                const ids = props.ids!(item, i)
                if (ids.length === 0) {
                    throw new Error(`Invalid ids array length. ids() should not return an empty array`);
                }
                if (idLength === 0) {
                    idLength = ids.length;
                } else if (ids.length !== idLength) {
                    throw new Error(`Invalid ids array length. Expected: ${idLength}. Found: ${ids.length}. Make sure ids() always return the same length`);
                }
                return ids;
            },
            equalsId(a, b) {
                for (let i = 0; i < a.length; i++) {
                    if (a[i] !== b[i]) {
                        return false;
                    }
                }
                return true;
            },
            getChild(ids) {
                let map:CHILD|undefined|any = childrenMap;
                for (let i = 0; i < ids.length; i++) {
                    map = map.get(ids[i]);
                    if (!map) {
                        break;
                    }
                }
                return map as CHILD|undefined;
            },
            setChild(ids, child) {
                let map = childrenMap;
                for (let i = 0; i < ids.length - 1; i++) {
                    const childMap = map.get(ids[i]);
                    if (!childMap) {
                        map.set(ids[i], map = new Map());
                    } else {
                        map = childMap;
                    }
                }
                map.set(ids[ids.length - 1], child);
            },
            deleteChild(ids) {
                let parentMap:Map<unknown, any>|null = null;
                let map:Map<unknown, any>|null|undefined = childrenMap;
                for (let i = 0; i < ids.length - 1; i++) {
                    parentMap = map;
                    map = parentMap.get(ids[i]);
                    if (!map) {
                        return;
                    }
                }
                for (let i = ids.length - 1; i >= 0; i--) {
                    map.delete(ids[i]);
                    if (map.size === 0) {
                        map = parentMap!;
                    } else {
                        break;
                    }
                }
            },
            clearChilds() {
                childrenMap.clear();
            }
        } satisfies IdMap<T, unknown[], CHILD>;
    } else {
        const childrenMap = new Map<T, Map<number, CHILD>>();
        return {
            getId(item, i) {
                return { item, i };
            },
            equalsId(a, b) {
                return a.item === b.item && a.i === b.i;
            },
            getChild(id) {
                const subList = childrenMap.get(id.item);
                if (subList) {
                    return subList.get(id.i);
                }
            },
            setChild(id, child) {
                const subList = childrenMap.get(id.item);
                if (!subList) {
                    childrenMap.set(id.item, new Map([[id.i, child]]));
                } else {
                    subList.set(id.i, child);
                }
            },
            deleteChild(id) {
                const subList = childrenMap.get(id.item);
                if (subList) {
                    subList.delete(id.i);
                    if (subList.size === 0) {
                        childrenMap.delete(id.item);
                    }
                }
            },
            clearChilds() {
                childrenMap.clear();
            }
        } satisfies IdMap<T, { item:T; i:number }, CHILD>;
    }
};