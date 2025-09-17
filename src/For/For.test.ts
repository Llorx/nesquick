import * as Assert from "assert";
import { setImmediate } from "timers/promises";

import test from "arrange-act-assert";
import { JSDOM } from "jsdom";

import { For } from "./For";
import { useState } from "../State";
import { NesquickComponent } from "../NesquickComponent";

test.describe("For", (test, after) => {
    global.requestAnimationFrame = process.nextTick as any;
    after(null, () => global.requestAnimationFrame = undefined as any);
    function newDocument() {
        return new JSDOM("").window.document;
    }
    function waitRenderTick() {
        return setImmediate();
    }
    function assertHTML(document:Document, node:Node, html:string) {
        document.body.appendChild(node);
        Assert.strictEqual(document.body.innerHTML, html);
    }
    function getFragmentHTML(arr:any[]) {
        return `${arr.map(el => `<div>${el}</div>`).join("")}<!--Fragment-->`;
    }
    test("should render div", {
        ARRANGE() {
            const component = new NesquickComponent(For as any, {
                each: () => [0, 1, 2],
                id(item:any) {
                    return item;
                },
                children(item:any) {
                    return new NesquickComponent("div", {
                        children: [item]
                    })
                }
            });
            const document = newDocument();
            return { component, document };
        },
        ACT({ component, document }) {
            return component.render(document);
        },
        ASSERT(res, { document }) {
            assertHTML(document, res, getFragmentHTML([0, 1, 2]));
        }
    });
    test("should render dynamic div", {
        ARRANGE() {
            const [getList, setList] = useState([0, 1, 2]);
            const component = new NesquickComponent(For as any, {
                each: getList,
                id(item:any) {
                    return item;
                },
                children(item:any) {
                    return new NesquickComponent("div", {
                        children: [item]
                    })
                }
            });
            const document = newDocument();
            const res = component.render(document);
            return { setList, res, document };
        },
        async ACT({ setList }) {
            setList([1, 2, 3]);
            await waitRenderTick();
        },
        ASSERT(_, { res, document }) {
            assertHTML(document, res, getFragmentHTML([1, 2, 3]));
        }
    });
    test("should swap components", {
        ARRANGE() {
            const [getList, setList] = useState([0, 1, 2]);
            const component = new NesquickComponent(For as any, {
                each: getList,
                id(item:any) {
                    return item;
                },
                children(item:any) {
                    return new NesquickComponent("div", {
                        children: [item]
                    })
                }
            });
            const document = newDocument();
            const res = component.render(document);
            return { setList, res, document };
        },
        async ACT({ setList }) {
            setList([1, 2, 0]);
            await waitRenderTick();
        },
        ASSERT(_, { res, document }) {
            assertHTML(document, res, getFragmentHTML([1, 2, 0]));
        }
    });
    test("should insert components", {
        ARRANGE() {
            const [getList, setList] = useState([0, 1, 2]);
            const component = new NesquickComponent(For as any, {
                each: getList,
                id(item:any) {
                    return item;
                },
                children(item:any) {
                    return new NesquickComponent("div", {
                        children: [item]
                    })
                }
            });
            const document = newDocument();
            const res = component.render(document);
            return { setList, res, document };
        },
        async ACT({ setList }) {
            setList([0, 3, 1, 2]);
            await waitRenderTick();
        },
        ASSERT(_, { res, document }) {
            assertHTML(document, res, getFragmentHTML([0, 3, 1, 2]));
        }
    });
    test("should insert components at the end", {
        ARRANGE() {
            const [getList, setList] = useState([0, 1, 2]);
            const component = new NesquickComponent(For as any, {
                each: getList,
                id(item:any) {
                    return item;
                },
                children(item:any) {
                    return new NesquickComponent("div", {
                        children: [item]
                    })
                }
            });
            const document = newDocument();
            const res = component.render(document);
            return { setList, res, document };
        },
        async ACT({ setList }) {
            setList([0, 1, 2, 3]);
            await waitRenderTick();
        },
        ASSERT(_, { res, document }) {
            assertHTML(document, res, getFragmentHTML([0, 1, 2, 3]));
        }
    });
    test("should delete components", {
        ARRANGE() {
            const [getList, setList] = useState([0, 1, 2]);
            const component = new NesquickComponent(For as any, {
                each: getList,
                id(item:any) {
                    return item;
                },
                children(item:any) {
                    return new NesquickComponent("div", {
                        children: [item]
                    })
                }
            });
            const document = newDocument();
            const res = component.render(document);
            return { setList, res, document };
        },
        async ACT({ setList }) {
            setList([0, 2]);
            await waitRenderTick();
        },
        ASSERT(_, { res, document }) {
            assertHTML(document, res, getFragmentHTML([0, 2]));
        }
    });
    test("should insert, swap and delete components", {
        ARRANGE() {
            const [getList, setList] = useState([0, 1, 2, 3, 4, 5, 6, 7]);
            const component = new NesquickComponent(For as any, {
                each: getList,
                id(item:any) {
                    return item;
                },
                children(item:any) {
                    return new NesquickComponent("div", {
                        children: [item]
                    })
                }
            });
            const document = newDocument();
            const res = component.render(document);
            return { setList, res, document };
        },
        async ACT({ setList }) {
            setList([7, 8, 9, 10, 2, 6, 5, 4, 11]);
            await waitRenderTick();
        },
        ASSERT(_, { res, document }) {
            assertHTML(document, res, getFragmentHTML([7, 8, 9, 10, 2, 6, 5, 4, 11]));
        }
    });
    test("should update again after insert, swap and delete components", {
        async ARRANGE() {
            const [getList, setList] = useState([0, 1, 2, 3, 4, 5, 6, 7]);
            const component = new NesquickComponent(For as any, {
                each: getList,
                id(item:any) {
                    return item;
                },
                children(item:any) {
                    return new NesquickComponent("div", {
                        children: [item]
                    })
                }
            });
            const document = newDocument();
            const res = component.render(document);
            setList([7, 8, 9, 10, 2, 6, 5, 4, 11]);
            await waitRenderTick();
            return { setList, res, document };
        },
        async ACT({ setList }) {
            setList([4, 9, 2, 10, 12, 6, 13, 14, 5]);
            await waitRenderTick();
        },
        ASSERT(_, { res, document }) {
            assertHTML(document, res, getFragmentHTML([4, 9, 2, 10, 12, 6, 13, 14, 5]));
        }
    });
    test.describe("duplicated components", test => {
        test("should render div", {
            ARRANGE() {
                const component = new NesquickComponent(For as any, {
                    each: () => [0, 1, 2, 1, 0, 3, 4, 2, 5, 6],
                    id(item:any) {
                        return item;
                    },
                    children(item:any) {
                        return new NesquickComponent("div", {
                            children: [item]
                        })
                    }
                });
                const document = newDocument();
                return { component, document };
            },
            ACT({ component, document }) {
                return component.render(document);
            },
            ASSERT(res, { document }) {
                assertHTML(document, res, getFragmentHTML([0, 1, 2, 1, 0, 3, 4, 2, 5, 6]));
            }
        });
        test("should render dynamic div", {
            ARRANGE() {
                const [getList, setList] = useState([0, 1, 2]);
                const component = new NesquickComponent(For as any, {
                    each: getList,
                    id(item:any) {
                        return item;
                    },
                    children(item:any) {
                        return new NesquickComponent("div", {
                            children: [item]
                        })
                    }
                });
                const document = newDocument();
                const res = component.render(document);
                return { setList, res, document };
            },
            async ACT({ setList }) {
                setList([0, 1, 2, 1, 0, 3, 4, 2, 5, 6]);
                await waitRenderTick();
            },
            ASSERT(_, { res, document }) {
                assertHTML(document, res, getFragmentHTML([0, 1, 2, 1, 0, 3, 4, 2, 5, 6]));
            }
        });
        test("should swap components", {
            ARRANGE() {
                const [getList, setList] = useState([0, 1, 2, 3, 2]);
                const component = new NesquickComponent(For as any, {
                    each: getList,
                    id(item:any) {
                        return item;
                    },
                    children(item:any) {
                        return new NesquickComponent("div", {
                            children: [item]
                        })
                    }
                });
                const document = newDocument();
                const res = component.render(document);
                return { setList, res, document };
            },
            async ACT({ setList }) {
                setList([1, 2, 3, 0, 2]);
                await waitRenderTick();
            },
            ASSERT(_, { res, document }) {
                assertHTML(document, res, getFragmentHTML([1, 2, 3, 0, 2]));
            }
        });
        test("should insert components", {
            ARRANGE() {
                const [getList, setList] = useState([0, 1, 2]);
                const component = new NesquickComponent(For as any, {
                    each: getList,
                    id(item:any) {
                        return item;
                    },
                    children(item:any) {
                        return new NesquickComponent("div", {
                            children: [item]
                        })
                    }
                });
                const document = newDocument();
                const res = component.render(document);
                return { setList, res, document };
            },
            async ACT({ setList }) {
                setList([0, 1, 3, 1, 2]);
                await waitRenderTick();
            },
            ASSERT(_, { res, document }) {
                assertHTML(document, res, getFragmentHTML([0, 1, 3, 1, 2]));
            }
        });
        test("should insert components at the end", {
            ARRANGE() {
                const [getList, setList] = useState([0, 1, 2]);
                const component = new NesquickComponent(For as any, {
                    each: getList,
                    id(item:any) {
                        return item;
                    },
                    children(item:any) {
                        return new NesquickComponent("div", {
                            children: [item]
                        })
                    }
                });
                const document = newDocument();
                const res = component.render(document);
                return { setList, res, document };
            },
            async ACT({ setList }) {
                setList([0, 1, 2, 1]);
                await waitRenderTick();
            },
            ASSERT(_, { res, document }) {
                assertHTML(document, res, getFragmentHTML([0, 1, 2, 1]));
            }
        });
        test("should delete components", {
            ARRANGE() {
                const [getList, setList] = useState([0, 1, 1, 2, 1]);
                const component = new NesquickComponent(For as any, {
                    each: getList,
                    id(item:any) {
                        return item;
                    },
                    children(item:any) {
                        return new NesquickComponent("div", {
                            children: [item]
                        })
                    }
                });
                const document = newDocument();
                const res = component.render(document);
                return { setList, res, document };
            },
            async ACT({ setList }) {
                setList([0, 1, 2]);
                await waitRenderTick();
            },
            ASSERT(_, { res, document }) {
                assertHTML(document, res, getFragmentHTML([0, 1, 2]));
            }
        });
        test("should swap and delete components", {
            ARRANGE() {
                const [getList, setList] = useState([0, 2, 1, 2, 1, 1, 3, 1]);
                const component = new NesquickComponent(For as any, {
                    each: getList,
                    id(item:any) {
                        return item;
                    },
                    children(item:any) {
                        return new NesquickComponent("div", {
                            children: [item]
                        })
                    }
                });
                const document = newDocument();
                const res = component.render(document);
                return { setList, res, document };
            },
            async ACT({ setList }) {
                setList([0, 1, 2, 1]);
                await waitRenderTick();
            },
            ASSERT(_, { res, document }) {
                assertHTML(document, res, getFragmentHTML([0, 1, 2, 1]));
            }
        });
        test("should insert, swap and delete components", {
            ARRANGE() {
                const [getList, setList] = useState([0, 1, 2, 3, 4, 5, 6, 7]);
                const component = new NesquickComponent(For as any, {
                    each: getList,
                    id(item:any) {
                        return item;
                    },
                    children(item:any) {
                        return new NesquickComponent("div", {
                            children: [item]
                        })
                    }
                });
                const document = newDocument();
                const res = component.render(document);
                return { setList, res, document };
            },
            async ACT({ setList }) {
                setList([7, 8, 9, 10, 2, 6, 5, 4, 11]);
                await waitRenderTick();
            },
            ASSERT(_, { res, document }) {
                assertHTML(document, res, getFragmentHTML([7, 8, 9, 10, 2, 6, 5, 4, 11]));
            }
        });
        test("should update again after insert, swap and delete components", {
            async ARRANGE() {
                const [getList, setList] = useState([0, 1, 2, 3, 4, 5, 6, 7]);
                const component = new NesquickComponent(For as any, {
                    each: getList,
                    id(item:any) {
                        return item;
                    },
                    children(item:any) {
                        return new NesquickComponent("div", {
                            children: [item]
                        })
                    }
                });
                const document = newDocument();
                const res = component.render(document);
                setList([7, 8, 9, 10, 2, 6, 5, 4, 11]);
                await waitRenderTick();
                return { setList, res, document };
            },
            async ACT({ setList }) {
                setList([4, 9, 2, 10, 12, 6, 13, 14, 5]);
                await waitRenderTick();
            },
            ASSERT(_, { res, document }) {
                assertHTML(document, res, getFragmentHTML([4, 9, 2, 10, 12, 6, 13, 14, 5]));
            }
        });
    });
});