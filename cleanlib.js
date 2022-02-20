const FS = require("fs");
const PATH = require("path");

FS.rm(PATH.join(__dirname, "lib"), {
    force: true,
    maxRetries: 3,
    retryDelay: 1000,
    recursive: true
}, () => {});