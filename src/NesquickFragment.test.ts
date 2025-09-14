import * as Assert from "assert";
import { setImmediate } from "timers/promises";

import test from "arrange-act-assert";
import { JSDOM } from "jsdom";

import { NesquickFragment } from "./NesquickFragment";
import { NesquickElement } from "./NesquickElement";
import { useState } from "./State";

test.describe("NesquickFragment", (test, after) => {
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
        test("should render a fragment", {
            ARRANGE() {
                const element = new NesquickFragment(["test1", "test2", "test3"]);
                const document = newDocument();
                return { element, document };
            },
            ACT({ element, document }) {
                return element.render(document);
            },
            ASSERT(res, { document }) {
                assertHTML(document, res, "test1test2test3<!--Fragment-->");
            }
        });
        test.describe("state", test => {
            test("should render", {
                ARRANGE() {
                    const [ getChild ] = useState("test2");
                    const element = new NesquickFragment(["test1", getChild, "test3"]);
                    const document = newDocument();
                    return { element, document };
                },
                ACT({ element, document }) {
                    return element.render(document);
                },
                ASSERT(res, { document }) {
                    assertHTML(document, res, "test1test2test3<!--Fragment-->");
                }
            });
            test("should update", {
                ARRANGE() {
                    const [ getChild, setChild ] = useState("test");
                    const element = new NesquickFragment(["test1", getChild, "test3"]);
                    const document = newDocument();
                    const div = element.render(document);
                    return { setChild, div, document };
                },
                async ACT({ setChild }) {
                    setChild("test2");
                    await waitRenderTick();
                },
                ASSERT(_, { div, document }) {
                    assertHTML(document, div, "test1test2test3<!--Fragment-->");
                }
            });
            test("should update if last element changes", {
                ARRANGE() {
                    const [ getChild, setChild ] = useState("test");
                    const element = new NesquickFragment(["test1", "test2", getChild]);
                    const document = newDocument();
                    const div = element.render(document);
                    return { setChild, div, document };
                },
                async ACT({ setChild }) {
                    setChild("test3");
                    await waitRenderTick();
                },
                ASSERT(_, { div, document }) {
                    assertHTML(document, div, "test1test2test3<!--Fragment-->");
                }
            });
            test("should update if first element changes", {
                ARRANGE() {
                    const [ getChild, setChild ] = useState("test");
                    const element = new NesquickFragment([getChild, "test2", "test3"]);
                    const document = newDocument();
                    const div = element.render(document);
                    return { setChild, div, document };
                },
                async ACT({ setChild }) {
                    setChild("test1");
                    await waitRenderTick();
                },
                ASSERT(_, { div, document }) {
                    assertHTML(document, div, "test1test2test3<!--Fragment-->");
                }
            });
            test.describe("fragment as child", test => {
                test("should update in correct location if child changes and the fragment is updated", {
                    ARRANGE() {
                        // Create a fragment where the last node changes
                        const [ getChild, setChild ] = useState(new NesquickElement("div", { children: "xxx" }));
                        const element = new NesquickFragment([getChild]);

                        // Create an element that accesses this fragment to keet a reference
                        const [ getChild2, setChild2 ] = useState<NesquickFragment|string>(element);
                        const element2 = new NesquickElement("div", {
                            children: [getChild2, "test2"]
                        });

                        const document = newDocument();
                        const div = element2.render(document);
                        return { setChild, setChild2, div, document };
                    },
                    async ACT({ setChild, setChild2 }) {
                        // Update fragment last child to change the last node
                        setChild(new NesquickElement("div", { children: "xxx3" }));
                        await waitRenderTick();

                        // Update element children to render before the fragment last node
                        setChild2("test1");
                        await waitRenderTick();
                    },
                    ASSERT(_, { div, document }) {
                        assertHTML(document, div, "<div>test1test2</div>");
                    }
                });
            });
        });
    });
});