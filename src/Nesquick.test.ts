import * as Assert from "assert";

import test from "arrange-act-assert";
import { JSDOM } from "jsdom";

import Nesquick from "./Nesquick";
import { NesquickElement } from "./NesquickElement";

test.describe("Nesquick", test => {
    function newDocument() {
        return new JSDOM("").window.document;
    }
    function newBody() {
        return newDocument().body;
    }
    test("should render an element", {
        ARRANGE() {
            const element = new NesquickElement("div", {});
            const body = newBody();
            return { element, body };
        },
        ACT({ element, body }) {
            Nesquick.render(element, body);
        },
        ASSERT(_, { body }) {
            Assert.strictEqual(body.innerHTML, "<div></div>");
        }
    });
});