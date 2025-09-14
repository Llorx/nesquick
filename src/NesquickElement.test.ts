import * as Assert from "assert";
import { setImmediate } from "timers/promises";

import test from "arrange-act-assert";
import { JSDOM } from "jsdom";

import { NesquickElement } from "./NesquickElement";
import { useState } from "./State";

// TODO: Test a Dispose
// TODO: Add render NesquickFragment and render state NesquickFragment tests (from and to)
test.describe("NesquickElement", (test, after) => {
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
                    const element = new NesquickElement("div", {});
                    const document = newDocument();
                    return { element, document };
                },
                ACT({ element, document }) {
                    return element.render(document);
                },
                ASSERT(res, { document }) {
                    assertHTML(document, res, "<div></div>");
                }
            });
            test("should render span", {
                ARRANGE() {
                    const element = new NesquickElement("span", {});
                    const document = newDocument();
                    return { element, document };
                },
                ACT({ element, document }) {
                    return element.render(document);
                },
                ASSERT(res, { document }) {
                    assertHTML(document, res, "<span></span>");
                }
            });
            test("should render input", {
                ARRANGE() {
                    const element = new NesquickElement("input", {});
                    const document = newDocument();
                    return { element, document };
                },
                ACT({ element, document }) {
                    return element.render(document);
                },
                ASSERT(res, { document }) {
                    assertHTML(document, res, "<input>");
                }
            });
        });
        test.describe("children", test => {
            test("should render text children", {
                ARRANGE() {
                    const element = new NesquickElement("div", {
                        children: ["test1", "test2"]
                    });
                    const document = newDocument();
                    return { element, document };
                },
                ACT({ element, document }) {
                    return element.render(document);
                },
                ASSERT(res, { document }) {
                    assertHTML(document, res, "<div>test1test2</div>");
                }
            });
            test("should not render null children", {
                ARRANGE() {
                    const element = new NesquickElement("div", {
                        children: ["test1", null, "test2"]
                    });
                    const document = newDocument();
                    return { element, document };
                },
                ACT({ element, document }) {
                    return element.render(document);
                },
                ASSERT(res, { document }) {
                    assertHTML(document, res, "<div>test1test2</div>");
                }
            });
            test("should render NesquickElement children", {
                ARRANGE() {
                    const element = new NesquickElement("div", {
                        children: [new NesquickElement("span", {})]
                    });
                    const document = newDocument();
                    return { element, document };
                },
                ACT({ element, document }) {
                    return element.render(document);
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
                            const element = new NesquickElement("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            return { element, document };
                        },
                        ACT({ element, document }) {
                            return element.render(document);
                        },
                        ASSERT(res, { document }) {
                            assertHTML(document, res, "<div>test1test2test3</div>");
                        }
                    });
                    test("should update to single string", {
                        ARRANGE() {
                            const [ getChild, setChild ] = useState("test");
                            const element = new NesquickElement("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            const div = element.render(document);
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
                            const element = new NesquickElement("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            const div = element.render(document);
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
                    test("should update to NesquickElement", {
                        ARRANGE() {
                            const [ getChild, setChild ] = useState<NesquickElement|string>("test2");
                            const element = new NesquickElement("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            const div = element.render(document);
                            return { setChild, div, document };
                        },
                        async ACT({ setChild }) {
                            setChild(new NesquickElement("div", {}));
                            await waitRenderTick();
                        },
                        ASSERT(_, { div, document }) {
                            assertHTML(document, div, "<div>test1<div></div>test3</div>");
                        }
                    });
                    test("should hide", {
                        ARRANGE() {
                            const [ getChild, setChild ] = useState<string|null>("test");
                            const element = new NesquickElement("div", {
                                children: ["test1", getChild, "test2"]
                            });
                            const document = newDocument();
                            const div = element.render(document);
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
                            const element = new NesquickElement("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            const div = element.render(document);
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
                            const element = new NesquickElement("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            return { element, document };
                        },
                        ACT({ element, document }) {
                            return element.render(document);
                        },
                        ASSERT(res, { document }) {
                            assertHTML(document, res, "<div>test1test2test22<!--Fragment-->test3</div>");
                        }
                    });
                    test("should update to single string", {
                        ARRANGE() {
                            const [ getChild, setChild ] = useState<string|string[]>(["test2", "test22"]);
                            const element = new NesquickElement("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            const div = element.render(document);
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
                            const element = new NesquickElement("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            const div = element.render(document);
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
                    test("should update to NesquickElement", {
                        ARRANGE() {
                            const [ getChild, setChild ] = useState<NesquickElement|string[]>(["test", "test0"]);
                            const element = new NesquickElement("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            const div = element.render(document);
                            return { setChild, div, document };
                        },
                        async ACT({ setChild }) {
                            setChild(new NesquickElement("div", {}));
                            await waitRenderTick();
                        },
                        ASSERT(_, { div, document }) {
                            assertHTML(document, div, "<div>test1<div></div>test3</div>");
                        }
                    });
                    test("should hide", {
                        ARRANGE() {
                            const [ getChild, setChild ] = useState<string[]|null>(["test2", "test22"]);
                            const element = new NesquickElement("div", {
                                children: ["test1", getChild, "test2"]
                            });
                            const document = newDocument();
                            const div = element.render(document);
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
                            const element = new NesquickElement("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            const div = element.render(document);
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
                test.describe("from NesquickElement", test => {
                    test("should render", {
                        ARRANGE() {
                            const [ getChild ] = useState(new NesquickElement("span", {}));
                            const element = new NesquickElement("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            return { element, document };
                        },
                        ACT({ element, document }) {
                            return element.render(document);
                        },
                        ASSERT(res, { document }) {
                            assertHTML(document, res, "<div>test1<span></span>test3</div>");
                        }
                    });
                    test("should update to single string", {
                        ARRANGE() {
                            const [ getChild, setChild ] = useState<NesquickElement|string>(new NesquickElement("div", {}));
                            const element = new NesquickElement("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            const div = element.render(document);
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
                            const [ getChild, setChild ] = useState<NesquickElement|string[]>(new NesquickElement("div", {}));
                            const element = new NesquickElement("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            const div = element.render(document);
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
                    test("should update to NesquickElement", {
                        ARRANGE() {
                            const [ getChild, setChild ] = useState(new NesquickElement("span", {}));
                            const element = new NesquickElement("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            const div = element.render(document);
                            return { setChild, div, document };
                        },
                        async ACT({ setChild }) {
                            setChild(new NesquickElement("div", {}));
                            await waitRenderTick();
                        },
                        ASSERT(_, { div, document }) {
                            assertHTML(document, div, "<div>test1<div></div>test3</div>");
                        }
                    });
                    test("should hide", {
                        ARRANGE() {
                            const [ getChild, setChild ] = useState<NesquickElement|null>(new NesquickElement("span", {}));
                            const element = new NesquickElement("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            const div = element.render(document);
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
                            const [ getChild, setChild ] = useState<NesquickElement|null>(null);
                            const element = new NesquickElement("div", {
                                children: ["test1", getChild, "test3"]
                            });
                            const document = newDocument();
                            const div = element.render(document);
                            return { setChild, div, document };
                        },
                        async ACT({ setChild }) {
                            setChild(new NesquickElement("div", {}));
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
});