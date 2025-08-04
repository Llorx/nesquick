import * as Assert from "assert";

import test from "arrange-act-assert";
import { JSDOM } from "jsdom";

import Veact from "./Veact";

test.describe("Veact", test => {
    function newDocument() {
        return new JSDOM("").window.document;
    }
    function newBody() {
        return newDocument().body;
    }
    test("should render an element", {
        ARRANGE() {
            const element = Veact.createElement("div");
            const body = newBody();
            return { element, body };
        },
        ACT({ element, body }) {
            Veact.render(element, body);
        },
        ASSERT(_, { body }) {
            Assert.strictEqual(body.innerHTML, "<div></div>");
        }
    });
    test.describe("createElement", test => {
        // Test function arguments
        test("should create an element", {
            ARRANGE() {
                return newDocument();
            },
            ACT() {
                return Veact.createElement("div");
            },
            ASSERT(element, document) {
                Assert.strictEqual(element.render(document).outerHTML, "<div></div>");
            }
        });
        test("should create an element with props", {
            ARRANGE() {
                return newDocument();
            },
            ACT() {
                return Veact.createElement("div", { test: "ok" });
            },
            ASSERT(element, document) {
                Assert.strictEqual(element.render(document).outerHTML, '<div test="ok"></div>');
            }
        });
        test("should create an element with children", {
            ARRANGE() {
                return newDocument();
            },
            ACT() {
                return Veact.createElement("div", null, "test1", "test2");
            },
            ASSERT(element, document) {
                Assert.strictEqual(element.render(document).outerHTML, "<div>test1test2</div>");
            }
        });
    });
});