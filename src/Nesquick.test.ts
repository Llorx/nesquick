import * as Assert from "assert";

import test from "arrange-act-assert";
import { JSDOM } from "jsdom";

import Nesquick from "./Nesquick";
import { NesquickComponent } from "./NesquickComponent";

test.describe("Nesquick", test => {
    function newDocument() {
        return new JSDOM("").window.document;
    }
    function newBody() {
        return newDocument().body;
    }
    test("should render an component", {
        ARRANGE() {
            const component = new NesquickComponent("div", {});
            const body = newBody();
            return { component, body };
        },
        ACT({ component, body }) {
            Nesquick.render(component, body);
        },
        ASSERT(_, { body }) {
            Assert.strictEqual(body.innerHTML, "<div></div>");
        }
    });
});