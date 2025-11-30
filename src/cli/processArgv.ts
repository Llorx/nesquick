import * as Path from "path";

// TODO: Add more options in the future
export function getProject(argv:string[]) {
    let nextIsProject = false;
    for (let i = 0; i < argv.length; i++) {
        if (argv[i].startsWith("--")) {
            nextIsProject = argv[i].substring(2) === "project";
        } else if (argv[i].startsWith("-")) {
            nextIsProject = argv[i].substring(1) === "p";
        } else if (nextIsProject) {
            return Path.resolve(process.cwd(), argv[i]);
        }
    }
    return null;
}