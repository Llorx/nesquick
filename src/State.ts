export type Getter<T> = () => T;
export type Setter<T> = (value:T) => void;
export type Updater<T> = (cb:(value:T)=>T) => void;
export type State<T> = [get:Getter<T>, set:Setter<T>, update:Updater<T>];
type Subscription<T> = {
    cb:()=>T;
    iteration:number;
    lastValue:T|null;
    firstRun:boolean;
    reaction:((data:T, lastReaction:boolean)=>void)|null;
    states:Map<Set<Subscription<any>>, number>;
    next:Subscription<T>|null;
    effect:boolean;
    cancelled:boolean;
    pending:boolean;
};

let currentReactor:Subscription<any>[] = [];
namespace reactor {
    export function set(reactor:Subscription<any>) {
        currentReactor.push(reactor);
    }
    export function reset() {
        currentReactor.pop();
    }
}
let pendingReactor:{
    first:Subscription<any>;
    last:Subscription<any>;
}|null = null;
const onRenders:(()=>void)[] = [];
function renderReactor(reactor:Subscription<any>, instant:boolean) {
    if (instant) {
        runSubscription(reactor);
    } else if (!reactor.pending) {
        reactor.pending = true;
        if (pendingReactor == null) {
            pendingReactor = {
                first: reactor,
                last: reactor
            };
            requestAnimationFrame(renderReactors);
        } else {
            pendingReactor.last.next = reactor;
            pendingReactor.last = reactor;
        }
    }
}
function renderReactors() {
    // '!' So we can optimize do/while instead of using just while
    let next = pendingReactor!.first;
    do {
        if (!next.cancelled) {
            runSubscription(next);
        }
        const n = next.next;
        next.next = null;
        next = n!;
    } while (next);
    pendingReactor = null;
    for (const cb of onRenders.splice(0)) {
        cb();
    }
}

export class Subscriptions {
    list:Subscription<any>[] = [];
    onDispose:(()=>void)[] = [];
    dispose() {
        for (const sub of this.list) {
            cancelSubscription(sub);
        }
        for (const cb of this.onDispose) {
            cb();
        }
    }
}
let currentSubscriptions:Subscriptions[] = [];
export namespace subscriptions {
    export function set(container:Subscriptions) {
        currentSubscriptions.push(container);
    }
    export function reset() {
        currentSubscriptions.pop();
    }
}
export function useState<T>(value:T):State<T> {
    const reactors = new Set<Subscription<T>>();
    function getValue() {
        const reactor = currentReactor[currentReactor.length - 1];
        if (reactor) {
            reactors.add(reactor);
            reactor.states.set(reactors, reactor.iteration);
        }
        return value;
    };
    function setValue(newValue:T) {
        if (value !== newValue) {
            value = newValue;
            for (const reactor of reactors) {
                renderReactor(reactor, reactor.effect);
            }
        }
    };
    return [ getValue, setValue, cb => { // update
        setValue(cb(value));
    }];
}
export function useEffect<T>(cb:()=>T, reaction:((data:T, lastReaction:boolean)=>void)|null = null) {
    const sub = newSubscription(cb, reaction, true);
    runSubscription(sub);
}
export function useRender<T>(cb:()=>T, reaction:((data:T, lastReaction:boolean)=>void)|null = null) {
    const sub = newSubscription(cb, reaction, false);
    runSubscription(sub);
}

const NopSubscription = newSubscription(() => {}, null, false);
cancelSubscription(NopSubscription);
export function afterRender(cb:()=>void) {
    onRenders.push(cb);
    if (pendingReactor == null) {
        // dummy reactor to defer afterRender after all possible future renders finish
        NopSubscription.pending = false;
        renderReactor(NopSubscription, false);
    }
}
const enum MemoState {
    NOTIFIED,
    DIRTY,
    CLEAN
}
export function useMemo<T>(cb:()=>T):Getter<T> {
    const reactors = new Set<Subscription<T>>();
    let state = MemoState.NOTIFIED;
    let value:T;
    const sub = newSubscription(() => {
        if (state === MemoState.NOTIFIED) {
            // keep states like cb was called again
            sub.iteration--;
        } else if (state === MemoState.DIRTY) {
            state = MemoState.CLEAN;
            value = cb();
        } else {
            sub.iteration--;
            state = MemoState.NOTIFIED;
            for (const reactor of reactors) {
                renderReactor(reactor, reactor.effect);
            }
        }
    }, null, true);
    return () => {
        if (state === MemoState.NOTIFIED) {
            state = MemoState.DIRTY;
            runSubscription(sub);
        }
        if (!sub.cancelled) {
            const reactor = currentReactor[currentReactor.length - 1];
            if (reactor) {
                reactors.add(reactor);
                reactor.states.set(reactors, reactor.iteration);
            }
        }
        return value;
    };
}
export function useDispose(cb:()=>void) {
    const container = currentSubscriptions[currentSubscriptions.length - 1];
    if (container) {
        container.onDispose.push(cb);
    }
}
function newSubscription<T>(cb:()=>T, reaction:((data:T, lastReaction:boolean)=>void)|null, effect:boolean):Subscription<T> {
    return {
        cb: cb,
        firstRun: true,
        lastValue: null,
        reaction: reaction,
        iteration: 0,
        states: new Map(),
        next: null,
        effect: effect,
        cancelled: false,
        pending: false
    };
}
function cancelSubscription(sub:Subscription<any>) {
    sub.cancelled = true;
    for (const reactors of sub.states.keys()) {
        reactors.delete(sub);
    }
}
function runSubscription<T>(sub:Subscription<T>) {
    sub.pending = false;
    sub.iteration++;
    reactor.set(sub);
    const res = sub.cb();
    reactor.reset();
    for (const [state, iteration] of sub.states) {
        if (iteration !== sub.iteration) {
            sub.states.delete(state);
        }
    }
    if (sub.states.size === 0) {
        cancelSubscription(sub);
    }
    if (sub.firstRun) {
        sub.firstRun = false;
        if (sub.states.size > 0) {
            const container = currentSubscriptions[currentSubscriptions.length - 1];
            if (container) {
                container.list.push(sub);
            }
        }
        if (sub.reaction) {
            sub.lastValue = res;
            sub.reaction(res, sub.cancelled);
        }
    } else if (sub.reaction && sub.lastValue !== res) {
        sub.lastValue = res;
        sub.reaction(res, sub.cancelled);
    }
}