function ok() {
    return 123;
}
const pepe = {
    a: () => 123
}
export function component() {
    return <div asd={123} asd2={ok()} asd3={ok} asd4={pepe.a} asd5={pepe.a()} asd6={() => 123} asd7={1 + 2} asd8={1 === 1 ? 2 : 3} asd9={1 === 1 ? 2 : ok} asd10={1 + ok()}>{"asd"}{123}</div>;
}