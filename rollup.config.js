import dts from "rollup-plugin-dts";
import { terser } from 'rollup-plugin-terser';
import typescript from "@rollup/plugin-typescript";

export default [{
    input: "./src/index.ts",
    output: [{
        file: __dirname + "/lib/Veact.browser.js",
        sourcemap: true,
        format: "umd",
        name: "window",
        extend: true
    }, {
        file: __dirname + "/lib/Veact.browser.min.js",
        format: "umd",
        name: "window",
        extend: true,
        plugins: [terser()]
    }, {
        file: __dirname + "/lib/Veact.mjs",
        sourcemap: true,
        format: "es"
    }, {
        file: __dirname + "/lib/Veact.min.mjs",
        format: "es",
        plugins: [terser()]
    }, {
        file: __dirname + "/lib/Veact.js",
        sourcemap: true,
        format: "cjs"
    }, {
        file: __dirname + "/lib/Veact.min.js",
        format: "cjs",
        plugins: [terser()]
    }],
    plugins: [
        typescript({ tsconfig: "./tsconfig.json" })
    ]
}, {
    input: "./src/index.ts",
    output: {
        file: __dirname + "/types/index.d.ts",
        format: "es"
    },
    plugins: [
        dts()
    ]
}]