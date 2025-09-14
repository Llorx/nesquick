import * as Assert from "assert";
import { setImmediate } from "timers/promises";

import test, { After } from "arrange-act-assert";

import * as State from "./State";

test.describe("State", (test, after) => {
    global.requestAnimationFrame = process.nextTick as any;
    after(null, () => global.requestAnimationFrame = undefined as any);
    function newSubscriptions(after:After) {
        const subscriptions = new State.Subscriptions();
        after(State.subscriptions.set(subscriptions), () => State.subscriptions.reset());
        return subscriptions;
    }
    function newRenderSub<T>(cb:()=>T, reaction?:(data:T)=>void) {
        let res:T|null = null;
        State.useRender(cb, v => {
            res = v;
            reaction?.(v);
        });
        return {
            assert(value:T|null) {
                Assert.deepStrictEqual(res, value);
            }
        };
    }
    function newEffectSub<T>(cb:()=>T, reaction?:(data:T)=>void) {
        let res:T|null = null;
        State.useEffect(cb, v => {
            res = v;
            reaction?.(v);
        });
        return {
            assert(value:T|null) {
                Assert.deepStrictEqual(res, value);
            }
        };
    }
    function waitRenderTick() {
        return setImmediate();
    }
    test("should update a state", {
        ARRANGE() {
            return State.useState(0);
        },
        ACT([_, setValue]) {
            setValue(1);
        },
        ASSERT(_, [getValue]) {
            Assert.strictEqual(getValue(), 1);
        }
    });
    test("should register a subscription if a state was accessed", {
        ARRANGE(after) {
            const subscriptions = newSubscriptions(after);
            const [ getCounter ] = State.useState(0);
            return { getCounter, subscriptions };
        },
        ACT({ getCounter }) {
            newRenderSub(getCounter);
        },
        ASSERT(_, { subscriptions }) {
            Assert.strictEqual(subscriptions.list.length, 1);
        }
    });
    test("should not register a subscription if no state was accessed", {
        ARRANGE(after) {
            return newSubscriptions(after);
        },
        ACT() {
            newRenderSub(() => 123);
        },
        ASSERT(_, subscriptions) {
            Assert.strictEqual(subscriptions.list.length, 0);
        }
    });
    test("should register different renders in different subscriptions", {
        ARRANGE() {
            const [ getCounter ] = State.useState(0);
            return { getCounter };
        },
        ACT({ getCounter }) {
            // add 1 element to each subscription
            const subscriptions1 = newSubscriptions(after);
            newRenderSub(getCounter);
            const subscriptions2 = newSubscriptions(after);
            newRenderSub(getCounter);
            const subscriptions3 = newSubscriptions(after);
            newRenderSub(getCounter);

            // pop subscriptions and add extra elements while doing so
            State.subscriptions.reset();
            newRenderSub(getCounter);
            State.subscriptions.reset();
            newRenderSub(getCounter);
            newRenderSub(getCounter);

            return { subscriptions1, subscriptions2, subscriptions3 };
        },
        ASSERTS: {
            "first subscriptions should have 3 elements"({ subscriptions1 }) {
                Assert.strictEqual(subscriptions1.list.length, 3);
            },
            "second subscriptions should have 3 elements"({ subscriptions2 }) {
                Assert.strictEqual(subscriptions2.list.length, 2);
            },
            "third subscriptions should have 3 elements"({ subscriptions3 }) {
                Assert.strictEqual(subscriptions3.list.length, 1);
            }
        }
    });
    test("should call useDispose callback", {
        async ARRANGE() {
            const subscriptions = newSubscriptions(after);
            const called = {
                done: false
            };
            State.useDispose(() => called.done = true);
            return { called, subscriptions };
        },
        async ACT({ subscriptions }) {
            subscriptions.dispose();
        },
        ASSERT(_, { called }) {
            Assert.strictEqual(called.done, true);
        }
    });
    test.describe("useRender", test => {
        test("should get state value on creation", {
            ARRANGE() {
                return State.useState(0);
            },
            async ACT([ getCounter ]) {
                return newRenderSub(getCounter);
            },
            ASSERT(sub) {
                sub.assert(0);
            }
        });
        test("should not run without render tick", {
            ARRANGE() {
                const [ getCounter, setCounter ] = State.useState(0);
                const sub = newRenderSub(getCounter);
                return { sub, setCounter };
            },
            ACT({ setCounter }) {
                setCounter(1); // queue but don't wait for tick
            },
            ASSERT(_ , { sub }) {
                sub.assert(0);
            }
        });
        test("should run after render tick", {
            ARRANGE() {
                const [ getCounter, setCounter ] = State.useState(0);
                const sub = newRenderSub(getCounter);
                return { sub, setCounter };
            },
            async ACT({ setCounter }) {
                setCounter(1);
                await waitRenderTick();
            },
            ASSERT(_, { sub }) {
                sub.assert(1);
            }
        });
        test("should not update a cancelled subscription", {
            async ARRANGE() {
                const subscriptions = newSubscriptions(after);
                const [ getCounter, setCounter ] = State.useState(0);
                const sub = newRenderSub(getCounter);
                setCounter(1);
                await waitRenderTick();
                return { sub, subscriptions, setCounter };
            },
            async ACT({ subscriptions, setCounter }) {
                subscriptions.dispose();
                setCounter(2); // Should not update to this value
                await waitRenderTick();
            },
            ASSERT(_, { sub }) {
                sub.assert(1);
            }
        });
        test("should queue subscriptions", {
            ARRANGE() {
                const [ getCounter, setCounter ] = State.useState(0);
                const sub1 = newRenderSub(getCounter);
                const sub2 = newRenderSub(getCounter);
                const sub3 = newRenderSub(getCounter);
                return { sub1, sub2, sub3, setCounter };
            },
            async ACT({ setCounter }) {
                setCounter(1);
                await waitRenderTick();
            },
            ASSERTS: {
                "first subscription should get the new counter"(_, { sub1 }) {
                    sub1.assert(1);
                },
                "second subscription should get the new counter"(_, { sub2 }) {
                    sub2.assert(1);
                },
                "third subscription should get the new counter"(_, { sub3 }) {
                    sub3.assert(1);
                }
            }
        });
        test("should run a queued subscription after a previous cancelled subscription", {
            ARRANGE() {
                newSubscriptions(after);
                const [ getCounter, setCounter ] = State.useState(0);
                const sub1 = newRenderSub(getCounter);
                const subscriptions2 = newSubscriptions(after);
                const sub2 = newRenderSub(getCounter);
                newSubscriptions(after);
                const sub3 = newRenderSub(getCounter);
                return { subscriptions2, sub1, sub2, sub3, setCounter };
            },
            async ACT({ subscriptions2, setCounter }) {
                setCounter(1);
                subscriptions2.dispose();
                await waitRenderTick();
            },
            ASSERTS: {
                "first subscription should get the new counter"(_, { sub1 }) {
                    sub1.assert(1);
                },
                "second cancelled subscription should not get the new counter"(_, { sub2 }) {
                    sub2.assert(0);
                },
                "third subscription should get the new counter"(_, { sub3 }) {
                    sub3.assert(1);
                }
            }
        });
        test("should run a queued subscription when cancelling a subscription in the reaction callback", {
            ARRANGE() {
                const [ getCounter, setCounter ] = State.useState(0);
                newSubscriptions(after);
                const sub1 = newRenderSub(getCounter);
                let first = true;
                const subscription2 = newSubscriptions(after);
                const sub2 = newRenderSub(getCounter, () => {
                    if (first) {
                        first = false; // on creation
                    } else {
                        subscription2.dispose(); // on first setCounter
                    }
                });
                newSubscriptions(after);
                const sub3 = newRenderSub(getCounter);
                return { sub1, sub2, sub3, setCounter };
            },
            async ACT({ setCounter }) {
                setCounter(1);
                await waitRenderTick();
            },
            ASSERTS: {
                "first subscription should get the new counter"(_, { sub1 }) {
                    sub1.assert(1);
                },
                "second cancelled subscription on reaction should get the new counter"(_, { sub2 }) {
                    sub2.assert(1);
                },
                "third subscription should get the new counter"(_, { sub3 }) {
                    sub3.assert(1);
                }
            }
        });
    });
    test.describe("useEffect", test => {
        test("should run without render callback", {
            ARRANGE() {
                return State.useState(0);
            },
            ACT([ getCounter ]) {
                return newEffectSub(getCounter);
            },
            ASSERT(sub) {
                sub.assert(0);
            }
        });
        test("should update subscription value", {
            ARRANGE() {
                const [ getCounter, setCounter ] = State.useState(0);
                const sub = newEffectSub(getCounter);
                return { sub, setCounter };
            },
            ACT({ setCounter }) {
                setCounter(1);
            },
            ASSERT(_, { sub }) {
                sub.assert(1);
            }
        });
        test("should cancel a subscription with state update", {
            ARRANGE() {
                const [ getCounter, setCounter ] = State.useState(0);
                const subscriptions = newSubscriptions(after);
                const sub = newEffectSub(getCounter);
                setCounter(1);
                return { subscriptions, sub, setCounter };
            },
            ACT({ subscriptions, setCounter }) {
                subscriptions.dispose();
                setCounter(2); // Should not update to this value
            },
            ASSERT(_, { sub }) {
                sub.assert(1);
            }
        });
    });
    test("should cancel a subscription while running a reaction callback", {
        ARRANGE() {
            return State.useState(0);
        },
        ACT([ getCounter, setCounter ]) {
            let first = true;
            const subscriptions = newSubscriptions(after);
            const sub = newEffectSub(getCounter, () => {
                if (first) {
                    first = false; // on creation
                } else {
                    subscriptions.dispose(); // on first setCounter
                }
            });
            setCounter(1); // this will cancel
            setCounter(2); // Should not update to this value
            return sub;
        },
        ASSERT(sub) {
            sub.assert(1);
        }
    });
    test("should run a subscription added while running a reaction callback", {
        ARRANGE() {
            const [ getCounter, setCounter ] = State.useState(0);
            const subscriptions = newSubscriptions(after);
            const sub1 = newRenderSub(getCounter);
            let first = true;
            const sub4stub = {
                sub: null as ReturnType<typeof newRenderSub>|null
            };
            const sub2 = newRenderSub(getCounter, () => {
                if (first) {
                    first = false; // on creation
                } else {
                    sub4stub.sub = newRenderSub(getCounter); // on first setCounter
                }
            });
            const sub3 = newRenderSub(getCounter);
            return { sub1, sub2, sub3, sub4stub, subscriptions, setCounter };
        },
        async ACT({ setCounter }) {
            setCounter(1);
            await waitRenderTick();
        },
        ASSERTS: {
            "first subscription should get the new counter"(_, { sub1 }) {
                sub1.assert(1);
            },
            "second subscription should get the new counter"(_, { sub2 }) {
                sub2.assert(1);
            },
            "third subscription should get the new counter"(_, { sub3 }) {
                sub3.assert(1);
            },
            "fourth subscription should get the new counter"(_, { sub4stub }) {
                sub4stub.sub!.assert(1);
            },
            "subscriptions should have all elements"(_, { subscriptions }) {
                Assert.strictEqual(subscriptions.list.length, 4);
            }
        }
    });
    test("should subscribe to a state inside a reactor", {
        ARRANGE() {
            const [getCounter1] = State.useState(0);
            const [getCounter2, setCounter2] = State.useState(0);
            let s:ReturnType<typeof newRenderSub>|null;
            const sub1 = newRenderSub(() => {
                const c = getCounter1();
                s = newRenderSub(getCounter2);
                return c;
            });
            let sub2 = s!;
            return { sub1, sub2, setCounter2 };
        },
        async ACT({ setCounter2 }) {
            setCounter2(1);
            await waitRenderTick();
        },
        ASSERTS: {
            "first subscription should keep the default counter"(_, { sub1 }) {
                sub1.assert(0);
            },
            "second subscription should get the new counter"(_, { sub2 }) {
                sub2.assert(1);
            }
        }
    });
    test("should not run first callback when nested one is updated", {
        ARRANGE() {
            const [getCounter1] = State.useState(0);
            const [getCounter2, setCounter2] = State.useState(0);
            let s:ReturnType<typeof newRenderSub>|null;
            let extraValue = 0;
            const sub1 = newRenderSub(() => {
                const c = getCounter1();
                s = newRenderSub(() => getCounter2() + extraValue);
                return c + extraValue;
            });
            let sub2 = s!;
            extraValue = 100; // if run again, will get this value
            return { sub1, sub2, setCounter2 };
        },
        async ACT({ setCounter2 }) {
            setCounter2(1);
            await waitRenderTick();
        },
        ASSERTS: {
            "first subscription should keep the default counter"(_, { sub1 }) {
                sub1.assert(0);
            },
            "second subscription should get the new counter"(_, { sub2 }) {
                sub2.assert(101);
            }
        }
    });
    test("should recover previous subscription after running nested one", {
        ARRANGE() {
            const [getCounter1, setCounter1] = State.useState(0);
            const [alwaysEnabled] = State.useState(0);
            const [getCounter2] = State.useState(0);
            let s:ReturnType<typeof newRenderSub>|null;
            let extraValue = 0;
            const sub1 = newRenderSub(() => {
                alwaysEnabled(); // keep the subscription alive with an always existant state
                s = newRenderSub(() => getCounter2() + extraValue);
                return getCounter1() + extraValue; // getCounter1 after nested subscription. Should not subscribe to nested
            });
            let sub2 = s!;
            extraValue = 100; // if run again, will get this value
            return { sub1, sub2, setCounter1 };
        },
        async ACT({ setCounter1 }) {
            setCounter1(1);
            await waitRenderTick();
        },
        ASSERTS: {
            "first subscription should get the new counter"(_, { sub1 }) {
                sub1.assert(101);
            },
            "second subscription should have the default counter"(_, { sub2 }) {
                sub2.assert(0);
            }
        }
    });
});