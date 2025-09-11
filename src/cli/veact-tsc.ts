import { tsc } from "./tsc";
import { transformer } from "./transformer";

tsc({
    argv: process.argv,
    cwd: process.cwd(),
    transformers: {
        before: [transformer]
    }
});