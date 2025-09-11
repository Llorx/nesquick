import * as Assert from "assert";

import test from "arrange-act-assert";
import { JSDOM } from "jsdom";

import Veact from "./Veact";
import { VeactElement } from "./VeactElement";

test.describe("Veact", test => {
    function newDocument() {
        return new JSDOM("").window.document;
    }
    function newBody() {
        return newDocument().body;
    }
    test("should render an element", {
        ARRANGE() {
            const element = new VeactElement("div", {});
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
});