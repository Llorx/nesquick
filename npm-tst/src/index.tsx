/*
// WARN
// TODO: Keep for automatic testing
import { Component, Generic, Props } from "veact/jsx-runtime";

const A2:Component<{n:() => number, children:number}> = (props) => {
    return <div>{props.n()}: {props.children}</div>;
}

const A12:Component<{n:number, children:() => number}> = (props) => {
    return <div>{props.n()}: {props.children}</div>;
}

function A22<T>(props:Props<{n:Generic<T>, m:Generic<T>, children:(thing:Generic<T>) => any}>) {
    let a = props.n();
    a = 123;
    return <div>{props.n()}: {props.children}</div>;
}

function EMPTY() {
    return <div></div>;
}

(<A2 n={123}>{123}</A2>);
(<A2 n={() => 123}>{123}</A2>);
(<A2 n={() => 123}>{() => 123}</A2>);

(<A12 n={123}>{123}</A12>);
(<A12 n={() => 123}>{123}</A12>);
(<A12 n={() => 123}>{() => 123}</A12>);

(<A22 n={123} m={123}>{123}</A22>);
(<A22 n={123} m={123}>{() => 123}</A22>);
(<A22 n={123} m={() => 123}>{() => 123}</A22>);

(<A22 n={() => 123} m={123}>{123}</A22>);
(<A22 n={() => 123} m={123}>{el => Number(el)}</A22>);

(<EMPTY></EMPTY>);
(<EMPTY>{123}</EMPTY>);

(<><div></div></>);
// TODO: Keep for automatic testing
// WARN*/