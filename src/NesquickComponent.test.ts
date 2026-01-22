import * as Assert from "assert";
import { setImmediate } from "timers/promises";

import test from "arrange-act-assert";
import { JSDOM } from "jsdom";

import { NesquickComponent } from "./NesquickComponent";
import { useState } from "./State";
import { JSX } from "./Nesquick";

// TODO: Test a Dispose
// TODO: Add render NesquickFragment and render state NesquickFragment tests (from and to)
test.describe("NesquickComponent", (test, after) => {
    global.requestAnimationFrame = process.nextTick as any;
    after(null, () => global.requestAnimationFrame = void 0 as any);
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
        test.describe("props", test => {
            test("should render props", {
                ARRANGE() {
                    const component = new NesquickComponent("div", {
                        id: "ok"
                    });
                    const document = newDocument();
                    return { component, document };
                },
                ACT({ component, document }) {
                    return component.render(document);
                },
                ASSERT(res, { document }) {
                    assertHTML(document, res, `<div id="ok"></div>`);
                }
            });
            test.describe("state", test => {
                test("should update props", {
                    ARRANGE() {
                        const [ getId, setId ] = useState("ok");
                        const component = new NesquickComponent("div", {
                            id: getId
                        });
                        const document = newDocument();
                        const res = component.render(document);
                        return { setId, res, document };
                    },
                    async ACT({ setId }) {
                        setId("ok2");
                        await waitRenderTick();
                    },
                    ASSERT(_, { res, document }) {
                        assertHTML(document, res, `<div id="ok2"></div>`);
                    }
                });
            });
        });
        test.describe("style", test => {
            test("should render string style", {
                ARRANGE() {
                    const component = new NesquickComponent("div", {
                        style: "color: red;"
                    });
                    const document = newDocument();
                    return { component, document };
                },
                ACT({ component, document }) {
                    return component.render(document);
                },
                ASSERT(res, { document }) {
                    assertHTML(document, res, `<div style="color: red;"></div>`);
                }
            });
            test("should render object style", {
                ARRANGE() {
                    const component = new NesquickComponent("div", {
                        style: {
                            color: "red"
                        }
                    });
                    const document = newDocument();
                    return { component, document };
                },
                ACT({ component, document }) {
                    return component.render(document);
                },
                ASSERT(res, { document }) {
                    assertHTML(document, res, `<div style="color: red;"></div>`);
                }
            });
            test.describe("state", test => {
                test("should update string style", {
                    ARRANGE() {
                        const [ getColor, setColor ] = useState("red");
                        const component = new NesquickComponent("div", {
                            style: () => `color: ${getColor()};`
                        });
                        const document = newDocument();
                        const res = component.render(document);
                        return { setColor, res, document };
                    },
                    async ACT({ setColor }) {
                        setColor("blue");
                        await waitRenderTick();
                    },
                    ASSERT(_, { res, document }) {
                    assertHTML(document, res, `<div style="color: blue;"></div>`);
                    }
                });
                test("should update object style", {
                    ARRANGE() {
                        const [ getStyle, setStyle ] = useState({
                            color: "red"
                        });
                        const component = new NesquickComponent("div", {
                            style: getStyle
                        });
                        const document = newDocument();
                        const res = component.render(document);
                        return { setStyle, res, document };
                    },
                    async ACT({ setStyle }) {
                        setStyle({
                            color: "blue"
                        });
                        await waitRenderTick();
                    },
                    ASSERT(_, { res, document }) {
                        assertHTML(document, res, `<div style="color: blue;"></div>`);
                    }
                });
                test("should remove object style attributes", {
                    ARRANGE() {
                        const [ getStyle, setStyle ] = useState<JSX.StyleProps>({
                            color: "red"
                        });
                        const component = new NesquickComponent("div", {
                            style: getStyle
                        });
                        const document = newDocument();
                        const res = component.render(document);
                        return { setStyle, res, document };
                    },
                    async ACT({ setStyle }) {
                        setStyle({
                            backgroundColor: "blue"
                        });
                        await waitRenderTick();
                    },
                    ASSERT(_, { res, document }) {
                        assertHTML(document, res, `<div style="background-color: blue;"></div>`);
                    }
                });
                test("should switch from text to object", {
                    ARRANGE() {
                        const [ getStyle, setStyle ] = useState<JSX.StyleProps|string>("color: red;");
                        const component = new NesquickComponent("div", {
                            style: getStyle
                        });
                        const document = newDocument();
                        const res = component.render(document);
                        return { setStyle, res, document };
                    },
                    async ACT({ setStyle }) {
                        setStyle({
                            backgroundColor: "blue"
                        });
                        await waitRenderTick();
                    },
                    ASSERT(_, { res, document }) {
                        assertHTML(document, res, `<div style="background-color: blue;"></div>`);
                    }
                });
                test("should switch from object to text", {
                    ARRANGE() {
                        const [ getStyle, setStyle ] = useState<JSX.StyleProps|string>({
                            color: "red"
                        });
                        const component = new NesquickComponent("div", {
                            style: getStyle
                        });
                        const document = newDocument();
                        const res = component.render(document);
                        return { setStyle, res, document };
                    },
                    async ACT({ setStyle }) {
                        setStyle("background-color: blue;");
                        await waitRenderTick();
                    },
                    ASSERT(_, { res, document }) {
                        assertHTML(document, res, `<div style="background-color: blue;"></div>`);
                    }
                });
                test("should update single style properties", {
                    ARRANGE() {
                        const [ getColor, setColor ] = useState("red");
                        const component = new NesquickComponent("div", {
                            style: {
                                color: getColor
                            }
                        });
                        const document = newDocument();
                        const res = component.render(document);
                        return { setColor, res, document };
                    },
                    async ACT({ setColor }) {
                        setColor("blue");
                        await waitRenderTick();
                    },
                    ASSERT(_, { res, document }) {
                        assertHTML(document, res, `<div style="color: blue;"></div>`);
                    }
                });
            });
        });
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
            test("should render children function without fragment", {
                ARRANGE() {
                    const component = new NesquickComponent("div", {
                        children: () => ["test1"]
                    });
                    const document = newDocument();
                    return { component, document };
                },
                ACT({ component, document }) {
                    return component.render(document);
                },
                ASSERT(res, { document }) {
                    assertHTML(document, res, "<div>test1</div>");
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
        test.describe("custom components", test => {
            test.describe("with state in children array", test => {
                test("should render function component with state-linked child", {
                    ARRANGE() {
                        const [ getText, setText ] = useState("initial");
                        const CustomComponent = (props:{children:any[]}) => {
                            return new NesquickComponent("div", {
                                class: "custom",
                                children: () => props.children[1]
                            });
                        };
                        const component = new NesquickComponent(CustomComponent, {
                            children: ["text1", getText, "text2"]
                        }, true);
                        const document = newDocument();
                        return { component, document, setText };
                    },
                    ACT({ component, document }) {
                        return component.render(document);
                    },
                    ASSERT(res, { document }) {
                        assertHTML(document, res, `<div class="custom">initial</div>`);
                    }
                });
                test("should update single string child in function component", {
                    ARRANGE() {
                        const [ getText, setText ] = useState("initial");
                        const CustomComponent = (props:{children:any[]}) => {
                            return new NesquickComponent("div", {
                                class: "custom",
                                children: () => props.children[1]
                            });
                        };
                        const component = new NesquickComponent(CustomComponent, {
                            children: ["text1", getText, "text2"]
                        }, true);
                        const document = newDocument();
                        const div = component.render(document);
                        return { setText, div, document };
                    },
                    async ACT({ setText }) {
                        setText("updated");
                        await waitRenderTick();
                    },
                    ASSERT(_, { div, document }) {
                        assertHTML(document, div, `<div class="custom">updated</div>`);
                    }
                });
                test("should update from string to array of strings", {
                    ARRANGE() {
                        const [ getChild, setChild ] = useState<string|string[]>("initial");
                        const CustomComponent = (props:{children:any[]}) => {
                            return new NesquickComponent("div", {
                                class: "custom",
                                children: () => props.children[1]
                            });
                        };
                        const component = new NesquickComponent(CustomComponent, {
                            children: ["text1", getChild, "text2"]
                        }, true);
                        const document = newDocument();
                        const div = component.render(document);
                        return { setChild, div, document };
                    },
                    async ACT({ setChild }) {
                        setChild(["updated1", "updated2"]);
                        await waitRenderTick();
                    },
                    ASSERT(_, { div, document }) {
                        assertHTML(document, div, `<div class="custom">updated1updated2<!--Fragment--></div>`);
                    }
                });
                test("should update from string to NesquickComponent", {
                    ARRANGE() {
                        const [ getChild, setChild ] = useState<string|NesquickComponent<any>>("initial");
                        const CustomComponent = (props:{children:any[]}) => {
                            return new NesquickComponent("div", {
                                class: "custom",
                                children: () => props.children[1]
                            });
                        };
                        const component = new NesquickComponent(CustomComponent, {
                            children: ["text1", getChild, "text2"]
                        }, true);
                        const document = newDocument();
                        const div = component.render(document);
                        return { setChild, div, document };
                    },
                    async ACT({ setChild }) {
                        setChild(new NesquickComponent("span", { children: ["nested"] }));
                        await waitRenderTick();
                    },
                    ASSERT(_, { div, document }) {
                        assertHTML(document, div, `<div class="custom"><span>nested</span></div>`);
                    }
                });
                test("should handle multiple state-linked children", {
                    ARRANGE() {
                        const [ getText1, setText1 ] = useState("first");
                        const [ getText2, setText2 ] = useState("second");
                        const CustomComponent = (props:{children:any[]}) => {
                            return new NesquickComponent("div", {
                                class: "custom",
                                children: () => props.children[0] + props.children[1] + props.children[2]
                            });
                        };
                        const component = new NesquickComponent(CustomComponent, {
                            children: [getText1, " - ", getText2]
                        }, true);
                        const document = newDocument();
                        const div = component.render(document);
                        return { setText1, setText2, div, document };
                    },
                    async ACT({ setText1, setText2 }) {
                        setText1("updated-first");
                        setText2("updated-second");
                        await waitRenderTick();
                    },
                    ASSERT(_, { div, document }) {
                        assertHTML(document, div, `<div class="custom">updated-first - updated-second</div>`);
                    }
                });
                test("should handle nested custom components with state", {
                    ARRANGE() {
                        const [ getText, setText ] = useState("inner-text");
                        const InnerComponent = (props:{children:any[]}) => {
                            return new NesquickComponent("span", {
                                class: "inner",
                                children: () => props.children[0]
                            });
                        };
                        const OuterComponent = (props:{children:any[]}) => {
                            return new NesquickComponent("div", {
                                class: "outer",
                                children: () => props.children[0]
                            });
                        };
                        const component = new NesquickComponent(OuterComponent, {
                            children: [
                                new NesquickComponent(InnerComponent, {
                                    children: [getText]
                                }, true)
                            ]
                        }, true);
                        const document = newDocument();
                        const div = component.render(document);
                        return { setText, div, document };
                    },
                    async ACT({ setText }) {
                        setText("updated-inner");
                        await waitRenderTick();
                    },
                    ASSERT(_, { div, document }) {
                        assertHTML(document, div, `<div class="outer"><span class="inner">updated-inner</span></div>`);
                    }
                });
                test("should update component with props and state-linked children", {
                    ARRANGE() {
                        const [ getText, setText ] = useState("dynamic");
                        const CustomComponent = (props:{title:string, children:any[]}) => {
                            return new NesquickComponent("div", {
                                title: props.title,
                                children: () => props.children[0] + props.children[1] + props.children[2]
                            });
                        };
                        const component = new NesquickComponent(CustomComponent, {
                            title: (() => "header") as unknown as string,
                            children: ["Start: ", getText, " :End"]
                        }, true);
                        const document = newDocument();
                        const div = component.render(document);
                        return { setText, div, document };
                    },
                    async ACT({ setText }) {
                        setText("changed");
                        await waitRenderTick();
                    },
                    ASSERT(_, { div, document }) {
                        assertHTML(document, div, `<div title="header">Start: changed :End</div>`);
                    }
                });
                test("should hide state-linked child in custom component", {
                    ARRANGE() {
                        const [ getChild, setChild ] = useState<string|null>("visible");
                        const CustomComponent = (props:{children:any[]}) => {
                            return new NesquickComponent("div", {
                                class: "custom",
                                children: () => props.children[1]
                            });
                        };
                        const component = new NesquickComponent(CustomComponent, {
                            children: ["before", getChild, "after"]
                        }, true);
                        const document = newDocument();
                        const div = component.render(document);
                        return { setChild, div, document };
                    },
                    async ACT({ setChild }) {
                        setChild(null);
                        await waitRenderTick();
                    },
                    ASSERT(_, { div, document }) {
                        assertHTML(document, div, `<div class="custom"></div>`);
                    }
                });
                test("should show previously hidden state-linked child", {
                    ARRANGE() {
                        const [ getChild, setChild ] = useState<string|null>(null);
                        const CustomComponent = (props:{children:any[]}) => {
                            return new NesquickComponent("div", {
                                class: "custom",
                                children: () => props.children[0] + props.children[1] + props.children[2]
                            });
                        };
                        const component = new NesquickComponent(CustomComponent, {
                            children: ["before", getChild, "after"]
                        }, true);
                        const document = newDocument();
                        const div = component.render(document);
                        return { setChild, div, document };
                    },
                    async ACT({ setChild }) {
                        setChild("shown");
                        await waitRenderTick();
                    },
                    ASSERT(_, { div, document }) {
                        assertHTML(document, div, `<div class="custom">beforeshownafter</div>`);
                    }
                });
            });
        });
    });
    test.describe("nq:ref", test => {
        test("should call ref with the element", {
            ARRANGE() {
                let refElement:HTMLElement|null = null;
                const component = new NesquickComponent("div", {
                    "nq:ref": (el:HTMLElement) => {
                        refElement = el;
                    }
                });
                const document = newDocument();
                return { component, document, refElement: () => refElement };
            },
            ACT({ component, document }) {
                return component.render(document);
            },
            ASSERT(node, { refElement }) {
                Assert.strictEqual(refElement(), node);
            }
        });
        test("should call ref with the correct element type", {
            ARRANGE() {
                let refElement:HTMLElement|null = null;
                const component = new NesquickComponent("button", {
                    "nq:ref": (el:HTMLElement) => {
                        refElement = el;
                    }
                });
                const document = newDocument();
                return { component, document, refElement: () => refElement };
            },
            ACT({ component, document }) {
                return component.render(document);
            },
            ASSERT(_, { refElement }) {
                Assert.strictEqual(refElement()!.tagName, "BUTTON");
            }
        });
        test("should call ref with element that has props", {
            ARRANGE() {
                let refElement:HTMLElement|null = null;
                const component = new NesquickComponent("div", {
                    id: "test-id",
                    class: "test-class",
                    "nq:ref": (el:HTMLElement) => {
                        refElement = el;
                    }
                });
                const document = newDocument();
                return { component, document, refElement: () => refElement };
            },
            ACT({ component, document }) {
                return component.render(document);
            },
            ASSERTS: {
                "element should have the correct id"(_, { refElement }) {
                    Assert.strictEqual(refElement()!.id, "test-id");
                },
                "element should have the correct class"(_, { refElement }) {
                    Assert.strictEqual(refElement()!.className, "test-class");
                }
            }
        });
        test("should call ref with element that can be modified", {
            ARRANGE() {
                let refElement:HTMLElement|null = null;
                const component = new NesquickComponent("div", {
                    "nq:ref": (el:HTMLElement) => {
                        refElement = el;
                    }
                });
                const document = newDocument();
                return { component, document, refElement: () => refElement };
            },
            ACT({ component, document, refElement }) {
                const node = component.render(document);
                refElement()!.setAttribute("data-test", "modified");
                return node;
            },
            ASSERT(_, { refElement }) {
                Assert.strictEqual(refElement()!.getAttribute("data-test"), "modified");
            }
        });
    });
    test.describe("nq:update", test => {
        test("should call update with the element", {
            ARRANGE() {
                let refElement:HTMLElement|null = null;
                const [ getId, setId ] = useState("initial");
                const component = new NesquickComponent("div", {
                    id: getId,
                    "nq:update": (el:HTMLElement) => {
                        refElement = el;
                    }
                });
                const document = newDocument();
                const node = component.render(document);
                return { node, component, document, setId, refElement: () => refElement };
            },
            async ACT({ setId }) {
                setId("changed");
                await waitRenderTick();
            },
            ASSERT(_, { node, refElement }) {
                Assert.strictEqual(refElement(), node);
            }
        });
        test("should not call update on first render", {
            ARRANGE() {
                let updateCalled = false;
                const component = new NesquickComponent("div", {
                    "nq:update": () => {
                        updateCalled = true;
                    }
                });
                const document = newDocument();
                return { component, document, updateCalled: () => updateCalled };
            },
            async ACT({ component, document }) {
                component.render(document);
                await waitRenderTick();
            },
            ASSERT(_, { updateCalled }) {
                Assert.strictEqual(updateCalled(), false);
            }
        });
        test("should call update after state change", {
            ARRANGE() {
                const [ getId, setId ] = useState("initial");
                let updateCount = 0;
                const component = new NesquickComponent("div", {
                    id: getId,
                    "nq:update": () => {
                        updateCount++;
                    }
                });
                const document = newDocument();
                component.render(document);
                return { setId, updateCount: () => updateCount };
            },
            async ACT({ setId }) {
                setId("changed");
                await waitRenderTick();
            },
            ASSERT(_, { updateCount }) {
                Assert.strictEqual(updateCount(), 1);
            }
        });
        test("should call update once after multiple state changes", {
            ARRANGE() {
                const [ getId, setId ] = useState("initial");
                const [ getClassName, setClassName ] = useState("initial-class");
                let updateCount = 0;
                const component = new NesquickComponent("div", {
                    id: getId,
                    className: getClassName,
                    "nq:update": () => {
                        updateCount++;
                    }
                });
                const document = newDocument();
                component.render(document);
                return { setId, setClassName, updateCount: () => updateCount };
            },
            async ACT({ setId, setClassName }) {
                setId("changed");
                setClassName("changed-class");
                await waitRenderTick();
            },
            ASSERT(_, { updateCount }) {
                Assert.strictEqual(updateCount(), 1);
            }
        });
        test("should call update with the element on state change", {
            ARRANGE() {
                const [ getId, setId ] = useState("initial");
                let updateElement:HTMLElement|null = null;
                const component = new NesquickComponent("div", {
                    id: getId,
                    "nq:update": (el:HTMLElement) => {
                        updateElement = el;
                    }
                });
                const document = newDocument();
                const node = component.render(document);
                return { setId, updateElement: () => updateElement, node };
            },
            async ACT({ setId }) {
                setId("changed");
                await waitRenderTick();
            },
            ASSERT(_, { updateElement, node }) {
                Assert.strictEqual(updateElement(), node);
            }
        });
        test("should call update with element that has updated attributes", {
            ARRANGE() {
                const [ getId, setId ] = useState("initial");
                let capturedId:string|null = null;
                const component = new NesquickComponent("div", {
                    id: getId,
                    "nq:update": (el:HTMLElement) => {
                        capturedId = el.id;
                    }
                });
                const document = newDocument();
                component.render(document);
                return { setId, capturedId: () => capturedId };
            },
            async ACT({ setId }) {
                await waitRenderTick(); // First update
                setId("updated");
                await waitRenderTick(); // Second update
            },
            ASSERT(_, { capturedId }) {
                Assert.strictEqual(capturedId(), "updated");
            }
        });
        test("should not call update if it's null", {
            ARRANGE() {
                const [ getId, setId ] = useState("initial");
                const component = new NesquickComponent("div", {
                    id: getId,
                    "nq:update": null
                });
                const document = newDocument();
                const node = component.render(document) as HTMLElement;
                return { setId, node };
            },
            async ACT({ setId }) {
                await waitRenderTick();
                setId("changed");
                await waitRenderTick();
            },
            ASSERT(_, { node }) {
                Assert.strictEqual(node.id, "changed");
            }
        });
        test("should call update multiple times for separate state changes", {
            ARRANGE() {
                const [ getId, setId ] = useState("initial");
                const updateCalls:string[] = [];
                const component = new NesquickComponent("div", {
                    id: getId,
                    "nq:update": (el:HTMLElement) => {
                        updateCalls.push(el.id);
                    }
                });
                const document = newDocument();
                component.render(document);
                return { setId, updateCalls };
            },
            async ACT({ setId }) {
                setId("first");
                await waitRenderTick();
                setId("second");
                await waitRenderTick();
            },
            ASSERT(_, { updateCalls }) {
                Assert.deepStrictEqual(updateCalls, ["first", "second"]);
            }
        });
    });
    test.describe("events", test => {
        test("should not run event callbacks on creation", {
            ARRANGE() {
                const obj = {
                    ok: false
                };
                const component = new NesquickComponent("div", {
                    onClick: () => () => {
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
                    onClick: () => () => {
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
        test("should receive argument", {
            ARRANGE() {
                const obj = {
                    event: null as MouseEvent|null
                };
                const component = new NesquickComponent("div", {
                    onClick: () => (event:MouseEvent) => {
                        obj.event = event;
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
            ASSERT(_, { node, obj }) {
                Assert.strictEqual(obj.event instanceof node.ownerDocument!.defaultView!.window.MouseEvent, true);
            }
        });
    });
});