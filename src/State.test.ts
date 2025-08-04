import * as Assert from "assert";
import { setImmediate } from "timers/promises";

import test from "arrange-act-assert";

import * as State from "./State";

test.describe("State", (test, after) => {
    global.requestAnimationFrame = process.nextTick as any;
    after(null, () => global.requestAnimationFrame = undefined as any);
    function newRenderSub<T>(cb:()=>T, reaction?:(data:T)=>void) {
        let res:T|null = null;
        const sub = State.useRender(cb, v => {
            res = v;
            reaction?.(v);
        });
        return {
            cancelled: !sub,
            cancel() {
                State.cancelSubscription(sub!);
            },
            assert(value:T|null) {
                Assert.deepStrictEqual(res, value);
            }
        };
    }
    function newEffectSub<T>(cb:()=>T, reaction?:(data:T)=>void) {
        let res:T|null = null;
        const sub = State.useEffect(cb, v => {
            res = v;
            reaction?.(v);
        });
        return {
            cancel() {
                State.cancelSubscription(sub!);
            },
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
    test("should not return a subscription if no state was accessed", {
        ACT() {
            return newRenderSub(()=>123);
        },
        ASSERT(sub) {
            Assert.strictEqual(sub.cancelled, true);
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
                const [getCounter, setCounter] = State.useState(0);
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
                const [getCounter, setCounter] = State.useState(0);
                const sub = newRenderSub(getCounter);
                setCounter(1);
                await waitRenderTick();
                return { sub, setCounter };
            },
            async ACT({ sub, setCounter }) {
                sub.cancel();
                setCounter(2); // Should not update to this value
                await waitRenderTick();
            },
            ASSERT(_, { sub }) {
                sub.assert(1);
            }
        });
        test("should queue subscriptions", {
            ARRANGE() {
                const [getCounter, setCounter] = State.useState(0);
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
                const [getCounter, setCounter] = State.useState(0);
                const sub1 = newRenderSub(getCounter);
                const sub2 = newRenderSub(getCounter);
                const sub3 = newRenderSub(getCounter);
                return { sub1, sub2, sub3, setCounter };
            },
            async ACT({ sub2, setCounter }) {
                setCounter(1);
                sub2.cancel();
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
                const [getCounter, setCounter] = State.useState(0);
                const sub1 = newRenderSub(getCounter);
                let first = true;
                const sub2 = newRenderSub(getCounter, () => {
                    if (first) {
                        first = false; // on creation
                    } else {
                        sub2.cancel(); // on first setCounter
                    }
                });
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
                const [getCounter, setCounter] = State.useState(0);
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
                const [getCounter, setCounter] = State.useState(0);
                const sub = newEffectSub(getCounter);
                setCounter(1);
                return { sub, setCounter };
            },
            ACT({ sub, setCounter }) {
                sub.cancel();
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
        ACT([getCounter, setCounter]) {
            let first = true;
            const sub = newEffectSub(getCounter, () => {
                if (first) {
                    first = false; // on creation
                } else {
                    sub.cancel(); // on first setCounter
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
            const [getCounter, setCounter] = State.useState(0);
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
            return { sub1, sub2, sub3, sub4stub, setCounter };
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
            }
        }
    });
});