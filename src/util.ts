export function isEvent(name:string) {
    return name.startsWith("on") && name.length > 2 && name[2] === name[2].toUpperCase();
}