const { spawn } = require("child_process");
process.chdir(__dirname);
spawn("node", ["../node_modules/typescript/lib/tsc.js", "-p", "tsconfig.json"])