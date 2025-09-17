import * as Assert from "assert";
import { setImmediate } from "timers/promises";

import test from "arrange-act-assert";
import { JSDOM } from "jsdom";

import { NesquickComponent } from "./NesquickComponent";
import { useState } from "./State";

// TODO: Test a Dispose
// TODO: Add render NesquickFragment and render state NesquickFragment tests (from and to)
test.describe("NesquickComponent", (test, after) => {
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
    test.describe("render", test => {
        test.describe("different types", test => {
            test("should render div", {
                ARRANGE() {
                    const component = new NesquickComponent("div", {});
                    const document = newDocument();
                    return { component, document };
                },
                ACT({ component, document }) {
                    return component.render(document);
                },
                ASSERT(res, { document }) {
                    assertHTML(document, res, "<div></div>");
                }
            });
            test("should render span", {
                ARRANGE() {
                    const component = new NesquickComponent("span", {});
                    const document = newDocument();
                    return { component, document };
                },
                ACT({ component, document }) {
                    return component.render(document);
                },
                ASSERT(res, { document }) {
                    assertHTML(document, res, "<span></span>");
                }
            });
            test("should render input", {
                ARRANGE() {
                    const component = new NesquickComponent("input", {});
                    const document = newDocument();
                    return { component, document };
                },
                ACT({ component, document }) {
                    return component.render(document);
                },
                ASSERT(res, { document }) {
                    assertHTML(document, res, "<input>");
                }
            });
        });
        test.describe("children", test => {
            test("should render text children", {
                ARRANGE() {
                    const component = new NesquickComponent("div", {
                        children: ["test1", "test2"]
                    });
                    const document = newDocument();
                    return { component, document };
                },
                ACT({ component, document }) {
                    return component.render(document);
                },
                ASSERT(res, { document }) {
                    assertHTML(document, res, "<div>test1test2</div>");
                }
            });
            test("should not render null children", {
                ARRANGE() {
                    const component = new NesquickComponent("div", {
                        children: ["test1", null, "test2"]
                    });
                    const document = newDocument();
                    return { component, document };
                },
                ACT({ component, document }) {
                    return component.render(document);
                },
                ASSERT(res, { document }) {
                    assertHTML(document, res, "<div>test1test2</div>");
                }
            });
            test("should render NesquickComponent children", {
                ARRANGE() {
                    const component = new NesquickComponent("div", {
                        children: [new NesquickComponent("span", {})]
                    });
                    const document = newDocument();
                    return { component, document };
                },
                ACT({ component, document }) {
                    return component.render(document);
                },
                ASSERT(res, { document }) {
                    assertHTML(document, res, "<div><span></span></div>");
                }
            });
            test.describe("state", test => {
                test.describe("from single string", test => {
                    test("should render", {
                        ARRANGE() {
                            const [ getChild ] = useState("test2");
                            const component = new NesquickComponent("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            return { component, document };
                        },
                        ACT({ component, document }) {
                            return component.render(document);
                        },
                        ASSERT(res, { document }) {
                            assertHTML(document, res, "<div>test1test2test3</div>");
                        }
                    });
                    test("should update to single string", {
                        ARRANGE() {
                            const [ getChild, setChild ] = useState("test");
                            const component = new NesquickComponent("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            const div = component.render(document);
                            return { setChild, div, document };
                        },
                        async ACT({ setChild }) {
                            setChild("test2");
                            await waitRenderTick();
                        },
                        ASSERT(_, { div, document }) {
                            assertHTML(document, div, "<div>test1test2test3</div>");
                        }
                    });
                    test("should update to array of strings", {
                        ARRANGE() {
                            const [ getChild, setChild ] = useState<string|string[]>("test");
                            const component = new NesquickComponent("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            const div = component.render(document);
                            return { setChild, div, document };
                        },
                        async ACT({ setChild }) {
                            setChild(["test2", "test22"]);
                            await waitRenderTick();
                        },
                        ASSERT(_, { div, document }) {
                            assertHTML(document, div, "<div>test1test2test22<!--Fragment-->test3</div>");
                        }
                    });
                    test("should update to NesquickComponent", {
                        ARRANGE() {
                            const [ getChild, setChild ] = useState<NesquickComponent|string>("test2");
                            const component = new NesquickComponent("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            const div = component.render(document);
                            return { setChild, div, document };
                        },
                        async ACT({ setChild }) {
                            setChild(new NesquickComponent("div", {}));
                            await waitRenderTick();
                        },
                        ASSERT(_, { div, document }) {
                            assertHTML(document, div, "<div>test1<div></div>test3</div>");
                        }
                    });
                    test("should hide", {
                        ARRANGE() {
                            const [ getChild, setChild ] = useState<string|null>("test");
                            const component = new NesquickComponent("div", {
                                children: ["test1", getChild, "test2"]
                            });
                            const document = newDocument();
                            const div = component.render(document);
                            return { setChild, div, document };
                        },
                        async ACT({ setChild }) {
                            setChild(null);
                            await waitRenderTick();
                        },
                        ASSERT(_, { div, document }) {
                            assertHTML(document, div, "<div>test1test2</div>");
                        }
                    });
                    test("should show", {
                        ARRANGE() {
                            const [ getChild, setChild ] = useState<string|null>(null);
                            const component = new NesquickComponent("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            const div = component.render(document);
                            return { setChild, div, document };
                        },
                        async ACT({ setChild }) {
                            setChild("test2");
                            await waitRenderTick();
                        },
                        ASSERT(_, { div, document }) {
                            assertHTML(document, div, "<div>test1test2test3</div>");
                        }
                    });
                });
                test.describe("from array of strings", test => {
                    test("should render", {
                        ARRANGE() {
                            const [ getChild ] = useState(["test2", "test22"]);
                            const component = new NesquickComponent("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            return { component, document };
                        },
                        ACT({ component, document }) {
                            return component.render(document);
                        },
                        ASSERT(res, { document }) {
                            assertHTML(document, res, "<div>test1test2test22<!--Fragment-->test3</div>");
                        }
                    });
                    test("should update to single string", {
                        ARRANGE() {
                            const [ getChild, setChild ] = useState<string|string[]>(["test2", "test22"]);
                            const component = new NesquickComponent("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            const div = component.render(document);
                            return { setChild, div, document };
                        },
                        async ACT({ setChild }) {
                            setChild("test2");
                            await waitRenderTick();
                        },
                        ASSERT(_, { div, document }) {
                            assertHTML(document, div, "<div>test1test2test3</div>");
                        }
                    });
                    test("should update to array of strings", {
                        ARRANGE() {
                            const [ getChild, setChild ] = useState(["test", "test0"]);
                            const component = new NesquickComponent("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            const div = component.render(document);
                            return { setChild, div, document };
                        },
                        async ACT({ setChild }) {
                            setChild(["test2", "test22"]);
                            await waitRenderTick();
                        },
                        ASSERT(_, { div, document }) {
                            assertHTML(document, div, "<div>test1test2test22<!--Fragment-->test3</div>");
                        }
                    });
                    test("should update to NesquickComponent", {
                        ARRANGE() {
                            const [ getChild, setChild ] = useState<NesquickComponent|string[]>(["test", "test0"]);
                            const component = new NesquickComponent("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            const div = component.render(document);
                            return { setChild, div, document };
                        },
                        async ACT({ setChild }) {
                            setChild(new NesquickComponent("div", {}));
                            await waitRenderTick();
                        },
                        ASSERT(_, { div, document }) {
                            assertHTML(document, div, "<div>test1<div></div>test3</div>");
                        }
                    });
                    test("should hide", {
                        ARRANGE() {
                            const [ getChild, setChild ] = useState<string[]|null>(["test2", "test22"]);
                            const component = new NesquickComponent("div", {
                                children: ["test1", getChild, "test2"]
                            });
                            const document = newDocument();
                            const div = component.render(document);
                            return { setChild, div, document };
                        },
                        async ACT({ setChild }) {
                            setChild(null);
                            await waitRenderTick();
                        },
                        ASSERT(_, { div, document }) {
                            assertHTML(document, div, "<div>test1test2</div>");
                        }
                    });
                    test("should show", {
                        ARRANGE() {
                            const [ getChild, setChild ] = useState<string[]|null>(null);
                            const component = new NesquickComponent("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            const div = component.render(document);
                            return { setChild, div, document };
                        },
                        async ACT({ setChild }) {
                            setChild(["test2", "test22"]);
                            await waitRenderTick();
                        },
                        ASSERT(_, { div, document }) {
                            assertHTML(document, div, "<div>test1test2test22<!--Fragment-->test3</div>");
                        }
                    });
                });
                test.describe("from NesquickComponent", test => {
                    test("should render", {
                        ARRANGE() {
                            const [ getChild ] = useState(new NesquickComponent("span", {}));
                            const component = new NesquickComponent("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            return { component, document };
                        },
                        ACT({ component, document }) {
                            return component.render(document);
                        },
                        ASSERT(res, { document }) {
                            assertHTML(document, res, "<div>test1<span></span>test3</div>");
                        }
                    });
                    test("should update to single string", {
                        ARRANGE() {
                            const [ getChild, setChild ] = useState<NesquickComponent|string>(new NesquickComponent("div", {}));
                            const component = new NesquickComponent("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            const div = component.render(document);
                            return { setChild, div, document };
                        },
                        async ACT({ setChild }) {
                            setChild("test2");
                            await waitRenderTick();
                        },
                        ASSERT(_, { div, document }) {
                            assertHTML(document, div, "<div>test1test2test3</div>");
                        }
                    });
                    test("should update to array of strings", {
                        ARRANGE() {
                            const [ getChild, setChild ] = useState<NesquickComponent|string[]>(new NesquickComponent("div", {}));
                            const component = new NesquickComponent("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            const div = component.render(document);
                            return { setChild, div, document };
                        },
                        async ACT({ setChild }) {
                            setChild(["test2", "test22"]);
                            await waitRenderTick();
                        },
                        ASSERT(_, { div, document }) {
                            assertHTML(document, div, "<div>test1test2test22<!--Fragment-->test3</div>");
                        }
                    });
                    test("should update to NesquickComponent", {
                        ARRANGE() {
                            const [ getChild, setChild ] = useState(new NesquickComponent("span", {}));
                            const component = new NesquickComponent("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            const div = component.render(document);
                            return { setChild, div, document };
                        },
                        async ACT({ setChild }) {
                            setChild(new NesquickComponent("div", {}));
                            await waitRenderTick();
                        },
                        ASSERT(_, { div, document }) {
                            assertHTML(document, div, "<div>test1<div></div>test3</div>");
                        }
                    });
                    test("should hide", {
                        ARRANGE() {
                            const [ getChild, setChild ] = useState<NesquickComponent|null>(new NesquickComponent("span", {}));
                            const component = new NesquickComponent("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            const div = component.render(document);
                            return { setChild, div, document };
                        },
                        async ACT({ setChild }) {
                            setChild(null);
                            await waitRenderTick();
                        },
                        ASSERT(_, { div, document }) {
                            assertHTML(document, div, "<div>test1test3</div>");
                        }
                    });
                    test("should show", {
                        ARRANGE() {
                            const [ getChild, setChild ] = useState<NesquickComponent|null>(null);
                            const component = new NesquickComponent("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            const div = component.render(document);
                            return { setChild, div, document };
                        },
                        async ACT({ setChild }) {
                            setChild(new NesquickComponent("div", {}));
                            await waitRenderTick();
                        },
                        ASSERT(_, { div, document }) {
                            assertHTML(document, div, "<div>test1<div></div>test3</div>");
                        }
                    });
                });
            });
        });
    });
    test.describe("events", test => {
        test("should not run event callbacks on creation", {
            ARRANGE() {
                const obj = {
                    ok: false
                };
                const component = new NesquickComponent("div", {
                    onClick() {
                        obj.ok = true;
                    }
                });
                const document = newDocument();
                return { component, document, obj };
            },
            ACT({ component, document }) {
                return component.render(document);
            },
            ASSERT(_, { obj }) {
                Assert.strictEqual(obj.ok, false);
            }
        });
        test("should run events", {
            ARRANGE() {
                const obj = {
                    ok: false
                };
                const component = new NesquickComponent("div", {
                    onClick() {
                        obj.ok = true;
                    }
                });
                const document = newDocument();
                const node = component.render(document);
                return { node, obj };
            },
            ACT({ node }) {
                const event = new node.ownerDocument!.defaultView!.window.MouseEvent("click", { bubbles: true });
                node.dispatchEvent(event);
            },
            ASSERT(_, { obj }) {
                Assert.strictEqual(obj.ok, true);
            }
        });
    });
});