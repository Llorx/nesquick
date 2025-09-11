type a<T> = T;
export function mult(n:number) {
    return n * 2;
}
function mult2(n:number) {
    return n * 2 as a<number>;
}

const res = mult2(123);

console.log(res);