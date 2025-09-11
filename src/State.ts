export type State<T> = [get:()=>T, set:(value:T)=>void];
export type Subscription<T> = {
    cb:()=>T;
    reaction:((data:T)=>void)|null;
    iteration:number;
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
    let next = pendingReactor!.first;
    do {
        if (!next.cancelled) {
            runSubscription(next);
        }
        const n = next.next;
        next.next = null;
        next = n!; // ! So we can optimize do/while instead of using just while
    } while (next);
    pendingReactor = null;
}

export function useState<T>(value:T):State<T> {
    const reactors = new Set<Subscription<T>>();
    const getValue = () => {
        const reactor = currentReactor[currentReactor.length - 1];
        if (reactor) {
            reactors.add(reactor);
            reactor.states.set(reactors, reactor.iteration);
        }
        return value;
    };
    const setValue = (newValue:T) => {
        value = newValue;
        for (const reactor of reactors) {
            renderReactor(reactor, reactor.effect);
        }
    };
    return [ getValue, setValue ];
}
export function useEffect<T>(cb:()=>T, reaction:((data:T)=>void)|null = null) {
    return newSubscription(cb, reaction, true);
}
export function useRender<T>(cb:()=>T, reaction:((data:T)=>void)|null = null) {
    return newSubscription(cb, reaction, false);
}
function newSubscription<T>(cb:()=>T, reaction:((data:T)=>void)|null, effect:boolean) {
    const sub:Subscription<T> = {
        cb: cb,
        reaction: reaction,
        iteration: 0,
        states: new Map(),
        next: null,
        effect: effect,
        cancelled: false,
        pending: false
    };
    renderReactor(sub, true);
    if (sub.states.size === 0) {
        cancelSubscription(sub);
        return null;
    }
    return sub;
}
export function cancelSubscription(sub:Subscription<any>) {
    sub.cancelled = true;
    for (const reactors of sub.states.keys()) {
        reactors.delete(sub);
    }
}
function runSubscription<T>(sub:Subscription<T>) {
    sub.pending = false;
    reactor.set(sub);
    const res = sub.cb();
    reactor.reset();
    for (const [state, iteration] of sub.states) {
        if (iteration !== sub.iteration) {
            sub.states.delete(state);
        }
    }
    sub.reaction?.(res);
}

