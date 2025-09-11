import * as Assert from "assert";
import { setImmediate } from "timers/promises";

import test from "arrange-act-assert";
import { JSDOM } from "jsdom";

import { For } from "./For";
import { useState } from "./State";
import { VeactElement } from "./VeactElement";

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
    test("should render div", {
        ARRANGE() {
            const element = new VeactElement(For as any, {
                each: () => [0, 1, 2],
                id(item:any) {
                    return item;
                },
                children(item:any) {
                    return new VeactElement("div", {
                        children: [item]
                    })
                }
            });
            const document = newDocument();
            return { element, document };
        },
        ACT({ element, document }) {
            return element.render(document);
        },
        ASSERT(res, { document }) {
            assertHTML(document, res, "<div>0</div><div>1</div><div>2</div><!--Fragment-->");
        }
    });
    test("should render dynamic div", {
        ARRANGE() {
            const [getList, setList] = useState([0, 1, 2]);
            const element = new VeactElement(For as any, {
                each: getList,
                id(item:any) {
                    return item;
                },
                children(item:any) {
                    return new VeactElement("div", {
                        children: [item]
                    })
                }
            });
            const document = newDocument();
            const res = element.render(document);
            return { setList, res, document };
        },
        async ACT({ setList }) {
            setList([1, 2, 3]);
            await waitRenderTick();
        },
        ASSERT(_, { res, document }) {
            assertHTML(document, res, "<div>1</div><div>2</div><div>3</div><!--Fragment-->");
        }
    });
    test("should swap elements", {
        ARRANGE() {
            const [getList, setList] = useState([0, 1, 2]);
            const element = new VeactElement(For as any, {
                each: getList,
                id(item:any) {
                    return item;
                },
                children(item:any) {
                    return new VeactElement("div", {
                        children: [item]
                    })
                }
            });
            const document = newDocument();
            const res = element.render(document);
            return { setList, res, document };
        },
        async ACT({ setList }) {
            setList([1, 2, 0]);
            await waitRenderTick();
        },
        ASSERT(_, { res, document }) {
            assertHTML(document, res, "<div>1</div><div>2</div><div>0</div><!--Fragment-->");
        }
    });
    test("should insert elements", {
        ARRANGE() {
            const [getList, setList] = useState([0, 1, 2]);
            const element = new VeactElement(For as any, {
                each: getList,
                id(item:any) {
                    return item;
                },
                children(item:any) {
                    return new VeactElement("div", {
                        children: [item]
                    })
                }
            });
            const document = newDocument();
            const res = element.render(document);
            return { setList, res, document };
        },
        async ACT({ setList }) {
            setList([0, 3, 1, 2]);
            await waitRenderTick();
        },
        ASSERT(_, { res, document }) {
            assertHTML(document, res, "<div>0</div><div>3</div><div>1</div><div>2</div><!--Fragment-->");
        }
    });
    test("should insert elements at the end", {
        ARRANGE() {
            const [getList, setList] = useState([0, 1, 2]);
            const element = new VeactElement(For as any, {
                each: getList,
                id(item:any) {
                    return item;
                },
                children(item:any) {
                    return new VeactElement("div", {
                        children: [item]
                    })
                }
            });
            const document = newDocument();
            const res = element.render(document);
            return { setList, res, document };
        },
        async ACT({ setList }) {
            setList([0, 1, 2, 3]);
            await waitRenderTick();
        },
        ASSERT(_, { res, document }) {
            assertHTML(document, res, "<div>0</div><div>1</div><div>2</div><div>3</div><!--Fragment-->");
        }
    });
    test("should delete elements", {
        ARRANGE() {
            const [getList, setList] = useState([0, 1, 2]);
            const element = new VeactElement(For as any, {
                each: getList,
                id(item:any) {
                    return item;
                },
                children(item:any) {
                    return new VeactElement("div", {
                        children: [item]
                    })
                }
            });
            const document = newDocument();
            const res = element.render(document);
            return { setList, res, document };
        },
        async ACT({ setList }) {
            setList([0, 2]);
            await waitRenderTick();
        },
        ASSERT(_, { res, document }) {
            assertHTML(document, res, "<div>0</div><div>2</div><!--Fragment-->");
        }
    });
    test("should insert, swap and delete elements", {
        ARRANGE() {
            const [getList, setList] = useState([0, 1, 2, 3, 4, 5, 6, 7]);
            const element = new VeactElement(For as any, {
                each: getList,
                id(item:any) {
                    return item;
                },
                children(item:any) {
                    return new VeactElement("div", {
                        children: [item]
                    })
                }
            });
            const document = newDocument();
            const res = element.render(document);
            return { setList, res, document };
        },
        async ACT({ setList }) {
            setList([7, 8, 9, 10, 2, 6, 5, 4, 11]);
            await waitRenderTick();
        },
        ASSERT(_, { res, document }) {
            assertHTML(document, res, "<div>7</div><div>8</div><div>9</div><div>10</div><div>2</div><div>6</div><div>5</div><div>4</div><div>11</div><!--Fragment-->");
        }
    });
    test("should update again after insert, swap and delete elements", {
        async ARRANGE() {
            const [getList, setList] = useState([0, 1, 2, 3, 4, 5, 6, 7]);
            const element = new VeactElement(For as any, {
                each: getList,
                id(item:any) {
                    return item;
                },
                children(item:any) {
                    return new VeactElement("div", {
                        children: [item]
                    })
                }
            });
            const document = newDocument();
            const res = element.render(document);
            setList([7, 8, 9, 10, 2, 6, 5, 4, 11]);
            await waitRenderTick();
            return { setList, res, document };
        },
        async ACT({ setList }) {
            setList([4, 9, 2, 10, 12, 6, 13, 14, 5]);
            await waitRenderTick();
        },
        ASSERT(_, { res, document }) {
            assertHTML(document, res, "<div>4</div><div>9</div><div>2</div><div>10</div><div>12</div><div>6</div><div>13</div><div>14</div><div>5</div><!--Fragment-->");
        }
    });
});