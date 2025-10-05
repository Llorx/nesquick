function ok() {
    return 123;
}
const pepe = {
    a: () => 123
};
function Comp(props:{a:string, b:()=>string}) {
    return <>
        <div
            asd={123}
            asd2={ok()}
            asd3={ok}
            asd4={pepe.a}
            asd5={pepe.a()}
            asd6={() => 123}
            asd7={1 + 2}
            asd8={1 === 1 ? 2 : 3}
            asd9={1 === 1 ? 2 : ok}
            asd10={1 + ok()}
            asd11={() => ok()}
            asd12={() => {
                return ok();
            }}
            asd13={function() {
                return ok();
            }}
            asd14="asd"
        >
            {"asd"}
            {123}
            {ok() ? "ok": null}
            {(1===1) ? "ok": null}
        </div>
    </>;
}
(<Comp a={"asd"} b={() => "asd"}></Comp>);