import * as Assert from "assert";
import { setImmediate } from "timers/promises";

import test from "arrange-act-assert";
import { JSDOM } from "jsdom";

import { VeactElement } from "./VeactElement";
import { useState } from "./State";

test.describe("Veact", (test, after) => {
    global.requestAnimationFrame = process.nextTick as any;
    after(null, () => global.requestAnimationFrame = undefined as any);
    function newDocument() {
        return new JSDOM("").window.document;
    }
    function waitRenderTick() {
        return setImmediate();
    }
    test.describe("render", test => {
        test.describe("different types", test => {
            test("should render div", {
                ARRANGE() {
                    const element = new VeactElement("div", null, []);
                    const document = newDocument();
                    return { element, document };
                },
                ACT({ element, document }) {
                    return element.render(document);
                },
                ASSERT(res) {
                    Assert.strictEqual(res.outerHTML, "<div></div>");
                }
            });
            test("should render span", {
                ARRANGE() {
                    const element = new VeactElement("span", null, []);
                    const document = newDocument();
                    return { element, document };
                },
                ACT({ element, document }) {
                    return element.render(document);
                },
                ASSERT(res) {
                    Assert.strictEqual(res.outerHTML, "<span></span>");
                }
            });
            test("should render input", {
                ARRANGE() {
                    const element = new VeactElement("input", null, []);
                    const document = newDocument();
                    return { element, document };
                },
                ACT({ element, document }) {
                    return element.render(document);
                },
                ASSERT(res) {
                    Assert.strictEqual(res.outerHTML, "<input>");
                }
            });
        });
        test("should render text children", {
            ARRANGE() {
                const element = new VeactElement("div", null, ["test1", "test2"]);
                const document = newDocument();
                return { element, document };
            },
            ACT({ element, document }) {
                return element.render(document);
            },
            ASSERT(res) {
                Assert.strictEqual(res.outerHTML, "<div>test1test2</div>");
            }
        });
        test("should not render null children", {
            ARRANGE() {
                const element = new VeactElement("div", null, ["test1", null, "test2"]);
                const document = newDocument();
                return { element, document };
            },
            ACT({ element, document }) {
                return element.render(document);
            },
            ASSERT(res) {
                Assert.strictEqual(res.outerHTML, "<div>test1test2</div>");
            }
        });
        test("should render VeactElement children", {
            ARRANGE() {
                const element = new VeactElement("div", null, [new VeactElement("span", null, [])]);
                const document = newDocument();
                return { element, document };
            },
            ACT({ element, document }) {
                return element.render(document);
            },
            ASSERT(res) {
                Assert.strictEqual(res.outerHTML, "<div><span></span></div>");
            }
        });
        test("should render a state children", {
            ARRANGE() {
                const [ getChild ] = useState("test");
                const element = new VeactElement("div", null, [getChild]);
                const document = newDocument();
                return { element, document };
            },
            ACT({ element, document }) {
                return element.render(document);
            },
            ASSERT(res) {
                Assert.strictEqual(res.outerHTML, "<div>test</div>");
            }
        });
        test("should update a state children", {
            ARRANGE() {
                const [ getChild, setChild ] = useState("test");
                const element = new VeactElement("div", null, [getChild]);
                const document = newDocument();
                const div = element.render(document);
                return { setChild, div };
            },
            async ACT({ setChild }) {
                setChild("test2");
                await waitRenderTick();
            },
            ASSERT(_, { div }) {
                Assert.strictEqual(div.outerHTML, "<div>test2</div>");
            }
        });
        test("should hide a state children", {
            ARRANGE() {
                const [ getChild, setChild ] = useState<string|null>("test");
                const element = new VeactElement("div", null, ["test1", getChild, "test2"]);
                const document = newDocument();
                const div = element.render(document);
                return { setChild, div };
            },
            async ACT({ setChild }) {
                setChild(null);
                await waitRenderTick();
            },
            ASSERT(_, { div }) {
                Assert.strictEqual(div.outerHTML, "<div>test1test2</div>");
            }
        });
        test("should show a hidden a state children", {
            ARRANGE() {
                const [ getChild, setChild ] = useState<string|null>(null);
                const element = new VeactElement("div", null, ["test1", getChild, "test3"]);
                const document = newDocument();
                const div = element.render(document);
                return { setChild, div };
            },
            async ACT({ setChild }) {
                setChild("test2");
                await waitRenderTick();
            },
            ASSERT(_, { div }) {
                Assert.strictEqual(div.outerHTML, "<div>test1test2test3</div>");
            }
        });
        test("should update a VeactElement", {
            ARRANGE() {
                const [ getChild, setChild ] = useState(new VeactElement("span", null, []));
                const element = new VeactElement("div", null, ["test1", getChild, "test3"]);
                const document = newDocument();
                const div = element.render(document);
                return { setChild, div };
            },
            async ACT({ setChild }) {
                setChild(new VeactElement("div", null, []));
                await waitRenderTick();
            },
            ASSERT(_, { div }) {
                Assert.strictEqual(div.outerHTML, "<div>test1<div></div>test3</div>");
            }
        });
        test("should hide a VeactElement", {
            ARRANGE() {
                const [ getChild, setChild ] = useState<VeactElement|null>(new VeactElement("span", null, []));
                const element = new VeactElement("div", null, ["test1", getChild, "test3"]);
                const document = newDocument();
                const div = element.render(document);
                return { setChild, div };
            },
            async ACT({ setChild }) {
                setChild(null);
                await waitRenderTick();
            },
            ASSERT(_, { div }) {
                Assert.strictEqual(div.outerHTML, "<div>test1test3</div>");
            }
        });
        test("should show a VeactElement", {
            ARRANGE() {
                const [ getChild, setChild ] = useState<VeactElement|null>(null);
                const element = new VeactElement("div", null, ["test1", getChild, "test3"]);
                const document = newDocument();
                const div = element.render(document);
                return { setChild, div };
            },
            async ACT({ setChild }) {
                setChild(new VeactElement("div", null, []));
                await waitRenderTick();
            },
            ASSERT(_, { div }) {
                Assert.strictEqual(div.outerHTML, "<div>test1<div></div>test3</div>");
            }
        });
        test("should change from text to VeactElement", {
            ARRANGE() {
                const [ getChild, setChild ] = useState<VeactElement|string>("test2");
                const element = new VeactElement("div", null, ["test1", getChild, "test3"]);
                const document = newDocument();
                const div = element.render(document);
                return { setChild, div };
            },
            async ACT({ setChild }) {
                setChild(new VeactElement("div", null, []));
                await waitRenderTick();
            },
            ASSERT(_, { div }) {
                Assert.strictEqual(div.outerHTML, "<div>test1<div></div>test3</div>");
            }
        });
        test("should change from VeactElement to text", {
            ARRANGE() {
                const [ getChild, setChild ] = useState<VeactElement|string>(new VeactElement("div", null, []));
                const element = new VeactElement("div", null, ["test1", getChild, "test3"]);
                const document = newDocument();
                const div = element.render(document);
                return { setChild, div };
            },
            async ACT({ setChild }) {
                setChild("test2");
                await waitRenderTick();
            },
            ASSERT(_, { div }) {
                Assert.strictEqual(div.outerHTML, "<div>test1test2test3</div>");
            }
        });
    });
});