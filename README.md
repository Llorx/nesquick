### Motivation
I like react, but it always bugged me how you need to create a full fake DOM that is going to be compared to a virtual DOM to finally render the updates in the browser. Yes, it will only update the real DOM with the new changes, but the process of creating a full fake DOM and comparing it each time something is updated is incredibly resource wasting. I always thought in a way to link states to HTML elementos directly, so no more virtual DOM is needed, and like so, **N**imble **E**element **S**uper **Quick** (`nesquick`) was born. At first it required for you to define the *subscribers*, so if you forgot to create a subscriber, no state will be linked to an HTML property. Now, with the magic of Typescript, you can link states to HTML elements without taking care of the subscribers, which makes it easier. For example, this is `nesquick`:
```ts
import { useState } from "nesquick";

function MyComp() {
    const [ getNumber, setNumber ] = useState(0);
    return <div>
        <button onClick={() => setNumber(Date.now())}>Update number</button>
        <div>Number: {getNumber()}</div>
    </div>;
}
```
Pretty straightforward. States have getters and setters, and that's it. With this approach, no more virtual DOM is needed.

### Documentation
Just `npm install nesquick`.

[WIP]