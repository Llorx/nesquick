import * as Fs from "fs";
import * as Path from "path";

import test, { monad } from "arrange-act-assert";

import { tsc } from "./tsc";
import { transformer } from "./transformer";

test.describe("tsc", test => {
    function clearPath(path:string) {
        return Fs.promises.rm(path, { recursive: true, force: true });
    }
    test("should compile with transforms", {
        async ARRANGE(after) {
            const mockPath = Path.resolve(__dirname, "..", "..", "nesquick-tsc-mock");
            const libPath = after(Path.join(mockPath, "lib"), clearPath);
            try {
                await clearPath(libPath);
            } catch (_) {}
            return { mockPath };
        },
        ACT({ mockPath }) {
            return monad(() => tsc({
                argv: [],
                cwd: mockPath,
                transformers: {
                    before: [transformer]
                }
            }));
        },
        SNAPSHOTS: {
            "file should be transformed"(_, { mockPath }) {
                return Fs.promises.readFile(Path.join(mockPath, "lib", "component.js"), "utf8");
            }
        },
        ASSERTS: {
            "tsc should be ok"(res) {
                res.should.ok();
            },
            "file should be created"(_, { mockPath }) {
                return Fs.promises.stat(Path.join(mockPath, "lib", "component.js"));
            }
        }
    });
});