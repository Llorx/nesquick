'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

exports.VeactState = void 0;
(function (VeactState) {
    VeactState.IS_PROXY = Symbol("IS_PROXY");
    VeactState.GET_VALUE = Symbol("GET_VALUE");
    let runningSub = null;
    let subs = new WeakMap();
    let animation = null;
    let subsAnimated = new Set();
    let cbsAnimated = new Set();
    function runSub(sub) {
        sub.animated = false;
        sub.oldProps = new Set(sub.props);
        sub.prerunning = runningSub;
        runningSub = sub;
        sub.cb();
        runningSub = sub.prerunning;
        sub.prerunning = null;
        for (let p of sub.oldProps) {
            p.cbs.delete(sub);
            sub.props.delete(p);
            if (p.cbs.size === 0) {
                p.proxified.delete(p.prop);
            }
        }
    }
    function runRender() {
        for (let sub of subsAnimated) {
            subsAnimated.delete(sub);
            runSub(sub);
        }
        for (let cb of cbsAnimated) {
            cbsAnimated.delete(cb);
            cb();
        }
        if (subsAnimated.size > 0) {
            runRender();
        }
        else {
            animation = null;
        }
    }
    function renderSub(sub) {
        if (sub.paused) {
            sub.dirty = true;
        }
        else if (!sub.animated) {
            sub.animated = true;
            subsAnimated.add(sub);
            if (animation === null) {
                animation = requestAnimationFrame(runRender);
            }
        }
    }
    function renderCb(callback) {
        cbsAnimated.add(callback);
        if (animation === null) {
            animation = requestAnimationFrame(runRender);
        }
    }
    function disableSub() {
        let disabledSub = runningSub;
        runningSub = null;
        return disabledSub;
    }
    VeactState.disableSub = disableSub;
    function enableSub(sub) {
        runningSub = sub;
    }
    VeactState.enableSub = enableSub;
    function pause(sub) {
        sub.paused = true;
        if (sub.animated) {
            sub.dirty = true;
            cancelAnimation(sub);
        }
    }
    VeactState.pause = pause;
    function resume(sub) {
        sub.paused = false;
        if (sub.dirty) {
            sub.dirty = false;
            renderSub(sub);
        }
    }
    VeactState.resume = resume;
    function draw(callback) {
        renderCb(callback);
    }
    VeactState.draw = draw;
    function render(callback) {
        let sub = subs.get(callback);
        if (!sub) {
            subs.set(callback, sub = {
                oldProps: new Set(),
                props: new Set(),
                animated: false,
                cb: callback,
                prerunning: null,
                paused: false,
                dirty: false
            });
        }
        renderSub(sub);
        return sub;
    }
    VeactState.render = render;
    function cancelAnimation(sub) {
        sub.animated = false;
        subsAnimated.delete(sub);
        if (subsAnimated.size == 0) {
            cancelAnimationFrame(animation);
            animation = null;
        }
    }
    function cancel(sub) {
        if (sub.animated) {
            cancelAnimation(sub);
        }
        for (let p of sub.props) {
            p.cbs.delete(sub);
        }
    }
    VeactState.cancel = cancel;
    const map = new WeakMap();
    function proxy(obj) {
        return map.get(obj) || obj;
    }
    VeactState.proxy = proxy;
    function value(obj) {
        return (obj && obj[VeactState.IS_PROXY]) ? obj[VeactState.GET_VALUE] : obj;
    }
    VeactState.value = value;
    Object.defineProperties(Function.prototype, {
        val: {
            value() {
                let v = this();
                return v ? v.val() : v;
            },
            enumerable: false
        }
    });
    Object.defineProperties(Object.prototype, {
        val: {
            value() {
                return this;
            },
            enumerable: false
        }
    });
    function stateNoOptions(st) {
        if (st && typeof st === "object" && !st[VeactState.IS_PROXY]) {
            let r = map.get(st);
            if (r) {
                st = r;
            }
            else {
                let proxified = new Map();
                let obj = st;
                st = new Proxy(st, {
                    get: (target, prop) => {
                        if (prop === VeactState.IS_PROXY) {
                            return true;
                        }
                        else if (prop === VeactState.GET_VALUE) {
                            return obj;
                        }
                        else {
                            let p = proxified.get(prop);
                            if (!p) {
                                let v = target[prop];
                                proxified.set(prop, p = {
                                    proxified: proxified,
                                    value: stateNoOptions(v),
                                    realValue: value(v),
                                    dirty: false,
                                    cbs: new Set(),
                                    prop: prop
                                });
                            }
                            else if (p.dirty) {
                                p.dirty = false;
                                p.value = stateNoOptions(p.value);
                            }
                            if (runningSub && !runningSub.oldProps.delete(p)) {
                                p.cbs.add(runningSub);
                                runningSub.props.add(p);
                            }
                            return p.value;
                        }
                    },
                    set: (target, prop, v) => {
                        let p = proxified.get(prop);
                        if (p) {
                            let isProxy = v && v[VeactState.IS_PROXY];
                            let realValue = isProxy ? v[VeactState.GET_VALUE] : v;
                            if (p.realValue !== realValue) {
                                target[prop] = realValue;
                                p.realValue = realValue;
                                p.value = v;
                                if (!isProxy) {
                                    p.dirty = true;
                                }
                                for (let sub of p.cbs) {
                                    renderSub(sub);
                                }
                            }
                        }
                        else {
                            target[prop] = v;
                        }
                        return true;
                    }
                });
                map.set(obj, st);
            }
        }
        return st;
    }
    VeactState.stateNoOptions = stateNoOptions;
    function state(st, options) {
        let ret = stateNoOptions(st);
        return ret;
    }
    VeactState.state = state;
})(exports.VeactState || (exports.VeactState = {}));

exports.Veact = void 0;
(function (Veact) {
    const dynamic = new WeakMap();
    function createElement(type, props, ...children) {
        if (typeof type === "string") {
            return new VeactElement(props, children, type);
        }
        else if (type.prototype instanceof VeactElement) {
            return new type(props, children);
        }
        else {
            let el = new VeactElement(props, children);
            el.render = type;
            return el;
        }
    }
    Veact.createElement = createElement;
    class VeactElement {
        props;
        children;
        type;
        static for(callback, options) {
            let list = [];
            dynamic.set(list, {
                constructor: this,
                callback: callback,
                options: options || {},
                children: [],
                keys: (options && options.key) ? new Map() : null
            });
            return list;
        }
        ;
        subs = new Set();
        displaySub = null;
        childrenElements = new Set();
        visible = true;
        parent = null;
        destroyed = false;
        parentVisible = true;
        _content = null;
        onremove = null;
        state = null;
        constructor(props, children = [], type) {
            this.props = props;
            this.children = children;
            this.type = type;
        }
        draw(callback) {
            let sub = exports.VeactState.render(callback);
            this.subs.add(sub);
        }
        drawDisplay(callback) {
            this.displaySub = exports.VeactState.render(callback);
        }
        onRemove() {
            this.remove();
        }
        remove() {
            if (this._content && this._content.parentNode) {
                this._content.parentNode.removeChild(this._content);
            }
            if (this.onremove) {
                for (let c of this.onremove) {
                    c.removed();
                }
            }
        }
        removed() { }
        unsubscribe(onremove = []) {
            if (this.displaySub) {
                exports.VeactState.cancel(this.displaySub);
            }
            for (let s of this.subs) {
                exports.VeactState.cancel(s);
            }
            for (let c of this.childrenElements) {
                c.unsubscribe(onremove);
            }
            if (this.removed) {
                onremove.push(this);
            }
            return onremove;
        }
        appendTo(el) {
            el.append(this.node);
            return this;
        }
        valueOf() {
            return this.node;
        }
        onRender() { }
        ;
        get node() {
            if (!this._content) {
                if (this.state) {
                    this.state = exports.VeactState.state(this.state);
                }
                let sub = exports.VeactState.disableSub();
                let el = this.render(this.props);
                if (el) {
                    this.childrenElements.add(el);
                    el.parent = this;
                    this._content = el.node;
                }
                exports.VeactState.enableSub(sub);
                this.onRender && this.onRender();
            }
            return this._content;
        }
        pause() {
            for (let sub of this.subs) {
                exports.VeactState.pause(sub);
            }
        }
        resume() {
            for (let sub of this.subs) {
                exports.VeactState.resume(sub);
            }
        }
        pauseDisplay() {
            if (this.displaySub) {
                exports.VeactState.pause(this.displaySub);
            }
        }
        resumeDisplay() {
            if (this.displaySub) {
                exports.VeactState.resume(this.displaySub);
            }
        }
        setParentVisible(v) {
            if (this.parentVisible !== v) {
                this.parentVisible = v;
                if (v) {
                    this.resumeDisplay();
                    if (this.visible) {
                        this.resume();
                    }
                }
                else {
                    if (this.visible) {
                        this.pause();
                    }
                    this.pauseDisplay();
                }
                if (this.visible) {
                    for (let c of this.childrenElements) {
                        c.setParentVisible(v);
                    }
                }
            }
        }
        setVisible(v) {
            this.visible = v;
            if (this.parentVisible) {
                if (v) {
                    this.resume();
                }
                else {
                    this.pause();
                }
            }
            for (let c of this.childrenElements) {
                c.setParentVisible(v);
            }
        }
        setStyle(style, props) {
            for (let [k, v] of Object.entries(props)) {
                if (v instanceof Function) {
                    if (k === "display") {
                        this.drawDisplay(((k, v) => {
                            let value = v();
                            style[k] = value;
                            let hidden = value === "none";
                            if (this.visible === hidden) {
                                this.setVisible(!hidden);
                            }
                        }).bind(this, k, v));
                    }
                    else {
                        this.draw(((k, v) => {
                            style[k] = v();
                        }).bind(this, k, v));
                    }
                }
                else {
                    style[k] = v;
                }
            }
        }
        render(props) {
            let el = document.createElement(this.type);
            this._content = el;
            if (this.props) {
                for (let [k, v] of Object.entries(this.props)) {
                    if (Array.isArray(v)) {
                        let res = [];
                        let draws = [];
                        for (let i = 0; i < v.length; i++) {
                            let vv = v[i];
                            if (typeof vv === "function") {
                                draws.push({
                                    i: i,
                                    cb: vv
                                });
                            }
                            else {
                                res.push(vv);
                            }
                        }
                        if (draws.length) {
                            this.draw(((draws) => {
                                for (let v of draws) {
                                    res[v.i] = v.cb();
                                }
                                el.setAttribute(k, el[k] = res.join(""));
                            }).bind(this, draws));
                        }
                        else {
                            el.setAttribute(k, el[k] = res.join(""));
                        }
                    }
                    else if (typeof v === "function") {
                        if (k.startsWith("on") && k.charCodeAt(2) >= 65 && k.charCodeAt(2) <= 90) {
                            el.addEventListener(k.substring(2).toLowerCase(), v);
                        }
                        else {
                            this.draw(((k, v) => {
                                let value = el[k] = v();
                                if (typeof value === "string") {
                                    el.setAttribute(k, value);
                                }
                            }).bind(this, k, v));
                        }
                    }
                    else if (k === "style") {
                        this.setStyle(el.style, v);
                    }
                    else {
                        el[k] = v;
                        if (typeof v === "string") {
                            el.setAttribute(k, v);
                        }
                    }
                }
            }
            this.appendChilds(this.children);
            return null;
        }
        createDynamicChild(data, array) {
            let p = {
                data: data,
                i: null,
                element: new array.constructor(array.options && "props" in array.options ? array.options.props(data) : data, [])
            };
            this.childrenElements.add(p.element);
            p.element.parent = this;
            return p;
        }
        insertDynamicChild(node, array, i, childrenData, pos) {
            let next = array && array.children[i + 1];
            if (next) {
                this._content.insertBefore(node, next.element._content);
            }
            else {
                let next = null;
                for (let ii = pos + 1; ii < childrenData.length && !next; ii++) {
                    next = childrenData[ii].node;
                }
                if (next) {
                    this._content.insertBefore(node, next);
                }
                else {
                    this._content.appendChild(node);
                }
            }
        }
        removeChild(el) {
            this.childrenElements.delete(el);
        }
        destroy() {
            if (!this.destroyed) {
                this.destroyed = true;
                this.onremove = this.unsubscribe();
                if (this.parent) {
                    this.parent.removeChild(this);
                }
                this.onRemove();
            }
        }
        appendChilds(children) {
            let childrenData = [];
            for (let i = 0; i < children.length; i++) {
                let c = children[i];
                if (c instanceof Function) {
                    let n = { node: null };
                    childrenData[i] = n;
                    ((c, pos) => {
                        let lastRes;
                        this.draw(() => {
                            let res = c();
                            if (lastRes) {
                                lastRes.nodeValue = res;
                            }
                            else {
                                lastRes = document.createTextNode(res);
                                n.node = lastRes;
                                this.insertDynamicChild(lastRes, null, 0, childrenData, pos);
                            }
                        });
                    })(c, i);
                }
                else if (Array.isArray(c)) {
                    let array = dynamic.get(exports.VeactState.value(c));
                    if (array) {
                        let n = { node: null };
                        childrenData[i] = n;
                        ((c, array, pos) => {
                            this.draw(() => {
                                let res = array.callback();
                                if (!Array.isArray(res)) {
                                    res = res ? [res] : [];
                                }
                                let keyf = array.options.key;
                                if (keyf) {
                                    let arrayKeys = array.keys;
                                    let keys = new Map(arrayKeys);
                                    for (let i = 0; i < res.length; i++) {
                                        let data = res[i];
                                        let key = keyf(data);
                                        let p;
                                        if (!keys.delete(key)) {
                                            p = this.createDynamicChild(data, array);
                                            array.children.push(p);
                                            arrayKeys.set(key, p);
                                            this.insertDynamicChild(p.element.node, array, array.children.length, childrenData, pos);
                                        }
                                    }
                                    for (let [key, p] of keys) {
                                        arrayKeys.delete(key);
                                        let el = p.element;
                                        el.destroy();
                                        p.element = null;
                                    }
                                    for (let i = 0; i < array.children.length; i++) {
                                        let p = array.children[i];
                                        if (!p.element) {
                                            c.splice(i, 1);
                                            array.children.splice(i--, 1);
                                        }
                                        else if (p.i === null) {
                                            c.splice(i, 0, p.element);
                                            p.i = i;
                                        }
                                    }
                                }
                                else {
                                    for (let i = 0; i < res.length; i++) {
                                        let data = res[i];
                                        let p = array.children[i];
                                        if (!p) {
                                            p = this.createDynamicChild(data, array);
                                            c[i] = p.element;
                                            array.children[i] = p;
                                            this.insertDynamicChild(p.element.node, array, i, childrenData, pos);
                                        }
                                        else {
                                            if (p.data !== data) {
                                                p.element.destroy();
                                                p.data = data;
                                                p.element = new array.constructor(array.options && "props" in array.options ? array.options.props(data) : data, []);
                                                c[i] = p.element;
                                                this.childrenElements.add(p.element);
                                                p.element.parent = this;
                                                this.insertDynamicChild(p.element.node, array, i, childrenData, pos);
                                            }
                                        }
                                    }
                                    if (res.length < array.children.length) {
                                        for (let i = res.length; i < array.children.length; i++) {
                                            let el = array.children[i].element;
                                            el.destroy();
                                        }
                                        array.children.splice(res.length);
                                        c.splice(res.length);
                                    }
                                }
                                n.node = array.children.length > 0 ? array.children[0].element._content : null;
                            });
                        })(c, array, i);
                    }
                    else {
                        childrenData[i] = this.appendChilds(c);
                    }
                }
                else if (c instanceof VeactElement) {
                    if (!c.destroyed) {
                        this.childrenElements.add(c);
                        c.parent = this;
                        let node = c.node;
                        childrenData[i] = { node: node };
                        this._content.appendChild(node);
                    }
                    else {
                        childrenData[i] = { node: null };
                    }
                }
                else if (c != null) {
                    if (!(c instanceof Node)) {
                        c = document.createTextNode(String(c));
                    }
                    childrenData[i] = { node: c };
                    this._content.appendChild(c);
                }
            }
            return childrenData[0];
        }
    }
    Veact.VeactElement = VeactElement;
})(exports.Veact || (exports.Veact = {}));
//# sourceMappingURL=Veact.js.map
