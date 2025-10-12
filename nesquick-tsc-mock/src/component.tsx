import { Props, useState } from "../../lib/types";

function ok() {
    return 123;
}
const pepe = {
    a: () => 123
};
function Comp(props:{children?:any, a:string, b:string, c:()=>string, d?:any, e?:() => any}) {
    return <>
        <div
            a={props.a}
            b={props.b}
            c-ref={props.c}
            c-call={props.c()}
            expression={123}
            func-call={ok()}
            func-ref={ok}
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
            string-literal="as2"
            string-expression={"as3"}
        >
            {props.d}
            {props.e?.()}
            {"as4"}
            {123}
            {ok() ? "ok": null}
            {(1===1) ? "ok": null}
            {(1===1) ? ok: null}
        </div>
    </>;
}
const p = {a:"a20", b:"a21", c: () => "a22"};
(<Comp
    a="as5"
    b={"as6"}
    c={() => "as7"}
    d={<Comp a="as8" b={"as9"} c={() => "a10"}>
        {() => <span></span>}
    </Comp>}
    e={() => <Comp a="a11" b={"a12"} c={() => "a13"} />}
>
    <span>
        <Comp a="a14" b={"a15"} c={() => "a16"} />
        <Comp {...{a:"a17", b:"a18", c: () => "a19"}} />
        <Comp {...p} />
    </span>
    {<div></div>}
    {() => <a></a>}
</Comp>);