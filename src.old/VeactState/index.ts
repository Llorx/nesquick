declare global {
    interface Object {
        val<T>(this:T):NesquickState.ReturnReturnType<T>;
    }
}

export namespace NesquickState {
    export interface Prop {
        proxified:Map<string|number|Symbol, Prop>;
        value:any;
        realValue:any;
        dirty:boolean;
        cbs:Set<Sub>;
        prop:string|number|Symbol;
    }
    export interface Sub {
        oldProps:Set<Prop>;
        props:Set<Prop>;
        animated:boolean;
        cb:() => void;
        prerunning:Sub|null;
        paused:boolean;
        dirty:boolean;
    }

    export const IS_PROXY = Symbol("IS_PROXY");
    export const GET_VALUE = Symbol("GET_VALUE");

    let runningSub:Sub|null = null;
    let subs:WeakMap<() => void, Sub> = new WeakMap();
    let animation:number|null = null;
    let subsAnimated:Set<Sub> = new Set();
    let cbsAnimated:Set<() => void> = new Set();
    function runSub(sub:Sub) {
        sub.animated = false;
        sub.oldProps = new Set(sub.props);
        sub.prerunning = runningSub;
        runningSub = sub;
        sub.cb();
        runningSub = sub.prerunning;
        sub.prerunning = null;
        for (let p of sub.oldProps) {
            p.cbs.delete(sub);
            sub.props.delete(p);
            if (p.cbs.size === 0) {
                p.proxified.delete(p.prop);
            }
        }
    }
    function runRender() {
        for (let sub of subsAnimated) {
            subsAnimated.delete(sub);
            runSub(sub);
        }
        for (let cb of cbsAnimated) {
            cbsAnimated.delete(cb);
            cb();
        }
        if (subsAnimated.size > 0) {
            runRender(); // This runs inside requestAnimationFrame tick
        } else {
            animation = null;
        }
    }
    function renderSub(sub:Sub) {
        if (sub.paused) {
            sub.dirty = true;
        } else if (!sub.animated) {
            sub.animated = true;
            subsAnimated.add(sub);
            if (animation === null) {
                animation = requestAnimationFrame(runRender);
            }
        }
    }
    function renderCb(callback:() => void) {
        cbsAnimated.add(callback);
        if (animation === null) {
            animation = requestAnimationFrame(runRender);
        }
    }

    export function disableSub() {
        let disabledSub = runningSub;
        runningSub = null;
        return disabledSub;
    }
    export function enableSub(sub:Sub|null) { // Always needs to be called after disabling, inside same tick
        runningSub = sub;
    }

    export function pause(sub:Sub) {
        sub.paused = true;
        if (sub.animated) {
            sub.dirty = true;
            cancelAnimation(sub);
        }
    }
    export function resume(sub:Sub) {
        sub.paused = false;
        if (sub.dirty) {
            sub.dirty = false;
            renderSub(sub);
        }
    }

    export function draw(callback:() => void) {
        renderCb(callback);
    }

    export function render(callback:() => void) {
        let sub = subs.get(callback);
        if (!sub) {
            subs.set(callback, sub = {
                oldProps: new Set(),
                props: new Set(),
                animated: false,
                cb: callback,
                prerunning: null,
                paused: false,
                dirty: false
            });
        }
        renderSub(sub);
        return sub;
    }

    function cancelAnimation(sub:Sub) {
        sub.animated = false;
        subsAnimated.delete(sub);
        if (subsAnimated.size == 0) {
            cancelAnimationFrame(animation as number);
            animation = null;
        }
    }

    export function cancel(sub:Sub) {
        if (sub.animated) {
            cancelAnimation(sub);
        }
        for (let p of sub.props) {
            p.cbs.delete(sub);
        }
    }

    const map:WeakMap<any, any> = new WeakMap();
    export function proxy(obj:any) {
        return map.get(obj) || obj;
    }
    export function value(obj:any) {
        return (obj && obj[IS_PROXY]) ? obj[GET_VALUE] : obj; // Not "obj[GET_VALUE] || obj" because the returned value can be falsy
    }

    Object.defineProperties(Function.prototype, {
        val: {
            value() {
                let v = this();
                return v ? v.val() : v;
            },
            enumerable: false
        }
    });
    Object.defineProperties(Object.prototype, {
        val: {
            value() {
                return this
            },
            enumerable: false
        }
    });
    export type ReturnReturnType<T> = T extends (...args:any) => infer R ? ReturnReturnType<R> : T;

    export function stateNoOptions<T>(st:T) { // To avoid some branching
        if (st && typeof st === "object") {
            let proto = Object.getPrototypeOf(st);
            if ((proto === Object.prototype || proto === Array.prototype || proto === null) && !(st as any)[IS_PROXY]) {
                let r = map.get(st);
                if (r) {
                    st = r;
                } else {
                    let proxified:Map<string|number|Symbol, Prop> = new Map();
                    let obj = st;
                    st = new Proxy(st as Object, {
                        get: (target, prop) => {
                            if (prop === IS_PROXY) {
                                return true;
                            } else if (prop === GET_VALUE) {
                                return obj;
                            } else {
                                let p = proxified.get(prop);
                                if (!p) {
                                    let v = (target as any)[prop];
                                    proxified.set(prop, p = {
                                        proxified: proxified,
                                        value: stateNoOptions(v),
                                        realValue: value(v),
                                        dirty: false,
                                        cbs: new Set(),
                                        prop: prop
                                    });
                                } else if (p.dirty) {
                                    p.dirty = false;
                                    p.value = stateNoOptions(p.value);
                                }
                                if (runningSub && !runningSub.oldProps.delete(p)) {
                                    p.cbs.add(runningSub);
                                    runningSub.props.add(p);
                                }
                                return p.value;
                            }
                        },
                        set: (target, prop, v) => {
                            let p = proxified.get(prop);
                            if (p) {
                                let isProxy = v && v[IS_PROXY];
                                let realValue = isProxy ? v[GET_VALUE] : v;
                                if (p.realValue !== realValue) {
                                    (target as any)[prop] = realValue;
                                    p.realValue = realValue;
                                    p.value = v;
                                    if (!isProxy) {
                                        p.dirty = true;
                                    }
                                    for (let sub of p.cbs) {
                                        renderSub(sub);
                                    }
                                }
                            } else {
                                (target as any)[prop] = v;
                            }
                            return true;
                        }
                    }) as T;
                    map.set(obj, st);
                }
            }
        }
        return st;
    }

    interface StateOptions<T> {
        saveInterval:number;
    }
    interface StateOptionsLocal<T> extends StateOptions<T> {
        syncKey:string;
        onLoad?(state:T):any;
    }
    interface StateOptionsCustom<T> extends StateOptions<T> {
        load(state:T):any;
        save(state:T):any;
    }

    function JSONstringify(obj:any, objects:Map<any, any> = new Map()) {
        let res = JSON.stringify(obj, (key, v) => {
            let type = typeof v;
            if (type === "function") {
                return undefined;
            }
            return v;
        });
        return res;
    }
    /*function JSONparse<T>(ret:T, obj:any) {
        for (let [k, v] of Object.entries(obj)) {
            if (v && typeof v === "object") {
                if (!ret[k]) {
                    ret[k] = Array.isArray(v) ? [] : {};
                }
                JSONparse(ret[k], v);
            } else {
                ret[k] = v;
            }
        }
    }*/

    export function state<T>(st:T, options?:StateOptionsLocal<T>|StateOptionsCustom<T>) {
        /*let loaded = false;
        if (options) {
            if ("syncKey" in options || "save" in options) {
                let save = async () => {
                    if ("syncKey" in options) {
                        localStorage.setItem(options.syncKey, JSONstringify(ret));
                    }
                    if ("save" in options) {
                        options.save(ret);
                    }
                };
                setInterval(save, options.saveInterval);
                window.addEventListener("unload", save);
                if ("syncKey" in options) {
                    window.addEventListener("storage", (storage) => {
                        if (storage.key === options.syncKey) {
                            try {
                                JSONparse(ret, JSON.parse(storage.newValue));
                            } catch (e) {}
                        }
                    });
                    try {
                        JSONparse(st, JSON.parse(localStorage.getItem(options.syncKey)));
                        loaded = true;
                    } catch (e) {}
                }
            }
        }*/
        let ret = stateNoOptions(st);
        /*if (options) {
            if ("load" in options) {
                options.load(ret);
            }
            if ("syncKey" in options && loaded) {
                if (options.onLoad) {
                    options.onLoad(ret);
                }
            }
        }*/
        return ret;
    }
}