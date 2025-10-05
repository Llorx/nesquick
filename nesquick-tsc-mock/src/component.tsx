function ok() {
    return 123;
}
const pepe = {
    a: () => 123
};
function Comp(props:{a:string, b:string, c:()=>string, d?:any, e?:() => any}) {
    return <>
        <div
            a={props.a}
            b={props.b}
            c-ref={props.c}
            c-call={props.c()}
            expression={123}
            func-call={ok()}
            func-red={ok}
            attr-ref={pepe.a}
            attr-call={pepe.a()}
            expression-call={() => 123}
            comp={1 + 2}
            simple-ternary={1 === 1 ? 2 : 3}
            ref-ternary={1 === 1 ? 2 : ok}
            comp-ref={1 + ok()}
            comp-call={() => ok()}
            arrow={() => {
                return ok();
            }}
            func={function() {
                return ok();
            }}
            string-literal="asd"
            string-expression={"asd"}
        >
            {props.d}
            {props.e?.()}
            {"asd"}
            {123}
            {ok() ? "ok": null}
            {(1===1) ? "ok": null}
            {(1===1) ? ok: null}
        </div>
    </>;
}
(<Comp
    a="asd"
    b={"asd"}
    c={() => "asd"}
    d={<Comp a="asd" b={"asd"} c={() => "asd"}></Comp>}
    e={() => <Comp a="asd" b={"asd"} c={() => "asd"}></Comp>}
></Comp>);