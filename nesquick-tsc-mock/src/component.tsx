import { For } from "../../lib/types";

function ok(arg?:any) {
    return 123;
}
const pepe = {
    a: (arg?:any) => 123
};
function Comp(props:{children?:any, a:string, b:string, "b-t"?:string, "b-t-c"?:string, c:()=>string, d?:any, e?:() => any}) {
    return <>
        <div
            nq:ref={() => {}}
            nq:update={() => {}}
            onClick={(_event) => {
                props.c();
            }}
            a={props.a}
            b={props.b}
            b-arrow={(() => props.b)()} // in case props.b is a getter
            c-ref={props.c}
            c-call={props.c()}
            expression={123}
            func-call={ok()}
            func-call-args={ok(1)}
            func-ref={ok}
            self-call={(() => 123)()}
            self-call-func={(() => ok())()}
            attr-call={pepe.a()}
            attr-call-args={pepe.a(1)}
            attr-ref={pepe.a}
            expression-call={() => 123}
            expression-call-args={(v:number) => 123 + v}
            comp={1 + 2}
            simple-ternary={1 === 1 ? 2 : 3}
            ref-ternary={1 === 1 ? 2 : ok}
            call-ternary={1 === 1 ? 2 : ok()}
            comp-call={1 + ok()}
            comp-call-args={1 + ok(1)}
            comp-sub-call={() => ok()}
            comp-sub-call-args={() => ok(1)}
            arrow-return={() => {
                return ok();
            }}
            func={function() {
                return ok();
            }}
            string-literal="as2"
            string-expression={"as3"}
        >
            {ok}
            {ok()}
            {props.d}
            {props.e?.()}
            {props.e()}
            {"as4"}
            {123}
            {ok() ? "ok": null}
            {(1===1) ? "ok": null}
            {(1===1) ? ok: null}
            <div {...{a: 1}}></div>
        </div>
    </>;
}
const p = {a:"a20", b:"a21", c: () => "a22"};
(<Comp
    a="as5"
    b={"as6"}
    b-t={`as6t`}
    b-t-c={`as6tc${1 + 1}`}
    c={() => "as7"}
    d={<Comp a={p.a} b={p.c()} c={p.c}>
        {() => <span></span>}
    </Comp>}
    e={() => <Comp a="a11" b={"a12"} c={() => "a13"} />}
>
    <span>
        <Comp a="a14" b={"a15"} c={() => "a16"} />
        <Comp {...{a:"a17", b:"a18", c: () => "a19", d: <Comp a="a20" b="a20" c={() => "as7"} />}} />
        <Comp {...p} />
    </span>
    {<div></div>}
    {() => <a></a>}
</Comp>);

(<For each={[1,2,3]}>{(item, i) => <span>{item}-{i()}</span>}</For>)