
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init$7(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.35.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    var query$6 = `{
  stages(sort: "sort") {
    slug
    name
    date_start
    date_end
    link
    best_of
  }
  players(sort: "ranking", limit: -1) {
    id
    seed
    group {
      id
    }
    elite
    username
    discord
    country
    country_code
    avatar
    timezone
    ranking
    pp
    qualifier {
      name
      link
      time
    }
  }
  referees {
    id
    username
    discord
    country
    country_code
    avatar
    timezone
  }
  commentators {
    id
    username
    discord
    country
    country_code
    avatar
    timezone
  }
  streamers {
    id
    username
    discord
    country
    country_code
    avatar
    timezone
  }
}`;

    const { API_URL } = {"env":{"API_URL":"http://local.api.mbs3.fightthe.pw:8055","UI_URL":"http://local.mbs3.fightthe.pw:5000","isProd":false}}.env;
    const me = writable(null);
    const players = writable(null);
    const referees = writable([]);
    const commentators = writable([]);
    const streamers = writable([]);
    const stages = writable([]);
    const page = writable(null);
    const pages = new Set([
        'players',
        'countries',
        'qualifiers',
        'qualifiers!maps',
        'qualifiers!elite',
        'qualifiers!elite!maps',
        'qualifiers!lobbies',
        'groups',
        'groups!results',
        'groups!maps',
        'groups!rolls',
        'ro64',
        'ro64!maps',
        'ro64!rolls',
        'scuffed!drawing',
        'referee!helper'
    ]);
    const onHashChange = () => {
        const { hash } = location;
        const [, query] = hash.split('/');
        if (pages.has(query)) {
            page.set(query);
        }
        else {
            page.set('home');
            if (hash != '#/') {
                location.hash = '#/';
            }
        }
    };
    window.addEventListener('hashchange', onHashChange);
    onHashChange();
    const api = (path, options = { headers: {} }, retry) => fetch(`${API_URL}${path}`, Object.assign(Object.assign({}, options), { headers: Object.assign({ Authorization: access_token ? `Bearer ${access_token}` : undefined }, options.headers) }))
        .then(async (res) => {
        var _a, _b;
        const json = await res.json();
        if (((_b = (_a = json.errors) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) == 'Token expired.' && !retry) {
            const auth = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include'
            });
            if (auth.status == 200) {
                const authJSON = await auth.json();
                access_token = authJSON.data.access_token;
                return api(path, options, true);
            }
        }
        return json;
    });
    let access_token;
    (async () => {
        const { data } = await api('/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: query$6 })
        });
        stages.set(data.stages);
        players.set(data.players);
        const playersMap = new Map(data.players.map(player => [player.id, player]));
        referees.set(data.referees);
        const refereesMap = new Map(data.referees.map(ref => [ref.id, ref]));
        commentators.set(data.commentators);
        const commentatorsMap = new Map(data.commentators.map(commentator => [commentator.id, commentator]));
        streamers.set(data.streamers);
        const streamersMap = new Map(data.streamers.map(streamer => [streamer.id, streamer]));
        const res = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include'
        });
        if (res.status == 200) {
            const json = await res.json();
            access_token = json.data.access_token;
            const { data: { first_name, email, avatar } } = await api('/users/me?fields=first_name,email');
            const mePlayer = playersMap.get(email);
            const meReferee = refereesMap.get(email);
            const meCommentator = commentatorsMap.get(email);
            const meStreamer = streamersMap.get(email);
            let shouldChangeTimezone = false;
            const timezone = -new Date().getTimezoneOffset() / 60;
            if (mePlayer) {
                shouldChangeTimezone = !mePlayer.timezone || !mePlayer.timezone.endsWith(String(timezone));
            }
            if (meReferee && !shouldChangeTimezone) {
                shouldChangeTimezone = !meReferee.timezone || !meReferee.timezone.endsWith(String(timezone));
            }
            if (meCommentator && !shouldChangeTimezone) {
                shouldChangeTimezone = !meCommentator.timezone || !meCommentator.timezone.endsWith(String(timezone));
            }
            if (meStreamer && !shouldChangeTimezone) {
                shouldChangeTimezone = !meStreamer.timezone || !meStreamer.timezone.endsWith(String(timezone));
            }
            // const mockPlayer = data.players.find(player => player.group);
            me.set({
                avatar,
                username: first_name,
                // id: mockPlayer.id,
                // player: mockPlayer,
                id: email,
                player: mePlayer,
                referee: meReferee,
                commentator: meCommentator,
                streamer: meStreamer,
                qualifier: mePlayer === null || mePlayer === void 0 ? void 0 : mePlayer.qualifier
            });
            if (shouldChangeTimezone) {
                await api('/custom/profile/timezone', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ offset: new Date().getTimezoneOffset() })
                });
            }
        }
    })();

    /* src\components\organisms\Banner.svelte generated by Svelte v3.35.0 */
    const file$r = "src\\components\\organisms\\Banner.svelte";

    // (49:31) 
    function create_if_block_5$5(ctx) {
    	let a;
    	let t;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text("Login");
    			attr_dev(a, "href", /*loginUrl*/ ctx[3]);
    			add_location(a, file$r, 49, 6, 2213);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$5.name,
    		type: "if",
    		source: "(49:31) ",
    		ctx
    	});

    	return block;
    }

    // (33:4) {#if $me}
    function create_if_block$j(ctx) {
    	let t0;
    	let b;
    	let t1_value = /*$me*/ ctx[0].username + "";
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let a;
    	let mounted;
    	let dispose;
    	let if_block0 = /*$me*/ ctx[0].player && create_if_block_4$6(ctx);
    	let if_block1 = /*$me*/ ctx[0].referee && create_if_block_3$6(ctx);
    	let if_block2 = /*$me*/ ctx[0].commentator && create_if_block_2$c(ctx);
    	let if_block3 = /*$me*/ ctx[0].streamer && create_if_block_1$g(ctx);

    	const block = {
    		c: function create() {
    			t0 = text("Logged in as\r\n      ");
    			b = element("b");
    			t1 = text(t1_value);
    			t2 = text(" -\r\n      ");
    			if (if_block0) if_block0.c();
    			t3 = space();
    			if (if_block1) if_block1.c();
    			t4 = space();
    			if (if_block2) if_block2.c();
    			t5 = space();
    			if (if_block3) if_block3.c();
    			t6 = space();
    			a = element("a");
    			a.textContent = "Log out";
    			add_location(b, file$r, 34, 6, 1863);
    			attr_dev(a, "href", "#/");
    			add_location(a, file$r, 47, 6, 2130);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, b, anchor);
    			append_dev(b, t1);
    			insert_dev(target, t2, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t3, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t4, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, t5, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*logout*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$me*/ 1 && t1_value !== (t1_value = /*$me*/ ctx[0].username + "")) set_data_dev(t1, t1_value);

    			if (/*$me*/ ctx[0].player) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_4$6(ctx);
    					if_block0.c();
    					if_block0.m(t3.parentNode, t3);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*$me*/ ctx[0].referee) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_3$6(ctx);
    					if_block1.c();
    					if_block1.m(t4.parentNode, t4);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*$me*/ ctx[0].commentator) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block_2$c(ctx);
    					if_block2.c();
    					if_block2.m(t5.parentNode, t5);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*$me*/ ctx[0].streamer) {
    				if (if_block3) ; else {
    					if_block3 = create_if_block_1$g(ctx);
    					if_block3.c();
    					if_block3.m(t6.parentNode, t6);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(b);
    			if (detaching) detach_dev(t2);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t3);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t4);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(t5);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$j.name,
    		type: "if",
    		source: "(33:4) {#if $me}",
    		ctx
    	});

    	return block;
    }

    // (36:6) {#if $me.player}
    function create_if_block_4$6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Player -");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$6.name,
    		type: "if",
    		source: "(36:6) {#if $me.player}",
    		ctx
    	});

    	return block;
    }

    // (39:6) {#if $me.referee}
    function create_if_block_3$6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Referee -");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$6.name,
    		type: "if",
    		source: "(39:6) {#if $me.referee}",
    		ctx
    	});

    	return block;
    }

    // (42:6) {#if $me.commentator}
    function create_if_block_2$c(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Commentator -");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$c.name,
    		type: "if",
    		source: "(42:6) {#if $me.commentator}",
    		ctx
    	});

    	return block;
    }

    // (45:6) {#if $me.streamer}
    function create_if_block_1$g(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Streamer -");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$g.name,
    		type: "if",
    		source: "(45:6) {#if $me.streamer}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$r(ctx) {
    	let div5;
    	let a;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let h1;
    	let img1;
    	let img1_src_value;
    	let t1;
    	let div1;
    	let span;
    	let t3;
    	let div3;
    	let div2;
    	let t5;
    	let t6;
    	let div4;

    	function select_block_type(ctx, dirty) {
    		if (/*$me*/ ctx[0]) return create_if_block$j;
    		if (/*$referees*/ ctx[1].length) return create_if_block_5$5;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			a = element("a");
    			div0 = element("div");
    			img0 = element("img");
    			t0 = space();
    			h1 = element("h1");
    			img1 = element("img");
    			t1 = space();
    			div1 = element("div");
    			span = element("span");
    			span.textContent = "3";
    			t3 = space();
    			div3 = element("div");
    			div2 = element("div");
    			div2.textContent = "Hosted by";
    			t5 = text("\r\n    Paturages & Davvy");
    			t6 = space();
    			div4 = element("div");
    			if (if_block) if_block.c();
    			attr_dev(img0, "alt", "");
    			if (img0.src !== (img0_src_value = "/images/logo.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "class", "svelte-swbai7");
    			add_location(img0, file$r, 20, 6, 1503);
    			attr_dev(div0, "class", "logo svelte-swbai7");
    			add_location(div0, file$r, 19, 4, 1477);
    			attr_dev(img1, "alt", "Mania Beginner's Showdown");
    			if (img1.src !== (img1_src_value = "/images/title.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "class", "svelte-swbai7");
    			add_location(img1, file$r, 23, 6, 1570);
    			attr_dev(span, "class", "svelte-swbai7");
    			add_location(span, file$r, 24, 25, 1660);
    			attr_dev(div1, "class", "three svelte-swbai7");
    			add_location(div1, file$r, 24, 6, 1641);
    			attr_dev(h1, "class", "svelte-swbai7");
    			add_location(h1, file$r, 22, 4, 1558);
    			attr_dev(a, "href", "#/");
    			add_location(a, file$r, 18, 2, 1458);
    			attr_dev(div2, "class", "host-title svelte-swbai7");
    			add_location(div2, file$r, 28, 4, 1728);
    			attr_dev(div3, "class", "hosts svelte-swbai7");
    			add_location(div3, file$r, 27, 2, 1703);
    			attr_dev(div4, "class", "me svelte-swbai7");
    			add_location(div4, file$r, 31, 2, 1804);
    			attr_dev(div5, "class", "banner svelte-swbai7");
    			add_location(div5, file$r, 17, 0, 1434);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, a);
    			append_dev(a, div0);
    			append_dev(div0, img0);
    			append_dev(a, t0);
    			append_dev(a, h1);
    			append_dev(h1, img1);
    			append_dev(h1, t1);
    			append_dev(h1, div1);
    			append_dev(div1, span);
    			append_dev(div5, t3);
    			append_dev(div5, div3);
    			append_dev(div3, div2);
    			append_dev(div3, t5);
    			append_dev(div5, t6);
    			append_dev(div5, div4);
    			if (if_block) if_block.m(div4, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div4, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);

    			if (if_block) {
    				if_block.d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$r.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$r($$self, $$props, $$invalidate) {
    	let $me;
    	let $referees;
    	validate_store(me, "me");
    	component_subscribe($$self, me, $$value => $$invalidate(0, $me = $$value));
    	validate_store(referees, "referees");
    	component_subscribe($$self, referees, $$value => $$invalidate(1, $referees = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Banner", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	const logout = () => __awaiter(void 0, void 0, void 0, function* () {
    		yield fetch(
    			`${({
				"env": {
					"API_URL": "http://local.api.mbs3.fightthe.pw:8055",
					"UI_URL": "http://local.mbs3.fightthe.pw:5000",
					"isProd": false
				}
			}).env.API_URL}/auth/logout`,
    			{ method: "POST", credentials: "include" }
    		);

    		location.reload();
    	});

    	const loginUrl = `${({
		"env": {
			"API_URL": "http://local.api.mbs3.fightthe.pw:8055",
			"UI_URL": "http://local.mbs3.fightthe.pw:5000",
			"isProd": false
		}
	}).env.API_URL}/auth/oauth/osu?redirect=${({
		"env": {
			"API_URL": "http://local.api.mbs3.fightthe.pw:8055",
			"UI_URL": "http://local.mbs3.fightthe.pw:5000",
			"isProd": false
		}
	}).env.UI_URL}`;

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Banner> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		__awaiter,
    		me,
    		referees,
    		logout,
    		loginUrl,
    		$me,
    		$referees
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$me, $referees, logout, loginUrl];
    }

    class Banner extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$7(this, options, instance$r, create_fragment$r, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Banner",
    			options,
    			id: create_fragment$r.name
    		});
    	}
    }

    /* src\components\atoms\Button.svelte generated by Svelte v3.35.0 */

    const file$q = "src\\components\\atoms\\Button.svelte";

    function create_fragment$q(ctx) {
    	let span;
    	let a;
    	let div;
    	let a_href_value;
    	let a_rel_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			span = element("span");
    			a = element("a");
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "text svelte-hih935");
    			add_location(div, file$q, 6, 4, 226);
    			attr_dev(a, "href", a_href_value = /*href*/ ctx[0] || "javascript:void(0)");
    			attr_dev(a, "target", /*target*/ ctx[1]);
    			attr_dev(a, "rel", a_rel_value = /*target*/ ctx[1] === "_blank" ? "noopener" : undefined);
    			attr_dev(a, "class", "link svelte-hih935");
    			add_location(a, file$q, 5, 2, 99);
    			attr_dev(span, "class", "button");
    			add_location(span, file$q, 4, 0, 74);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, a);
    			append_dev(a, div);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*href*/ 1 && a_href_value !== (a_href_value = /*href*/ ctx[0] || "javascript:void(0)")) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (!current || dirty & /*target*/ 2) {
    				attr_dev(a, "target", /*target*/ ctx[1]);
    			}

    			if (!current || dirty & /*target*/ 2 && a_rel_value !== (a_rel_value = /*target*/ ctx[1] === "_blank" ? "noopener" : undefined)) {
    				attr_dev(a, "rel", a_rel_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$q.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$q($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button", slots, ['default']);
    	let { href } = $$props;
    	let { target = "" } = $$props;
    	const writable_props = ["href", "target"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("href" in $$props) $$invalidate(0, href = $$props.href);
    		if ("target" in $$props) $$invalidate(1, target = $$props.target);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ href, target });

    	$$self.$inject_state = $$props => {
    		if ("href" in $$props) $$invalidate(0, href = $$props.href);
    		if ("target" in $$props) $$invalidate(1, target = $$props.target);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [href, target, $$scope, slots, click_handler];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$7(this, options, instance$q, create_fragment$q, safe_not_equal, { href: 0, target: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$q.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*href*/ ctx[0] === undefined && !("href" in props)) {
    			console.warn("<Button> was created without expected prop 'href'");
    		}
    	}

    	get href() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get target() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set target(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\organisms\Nav.svelte generated by Svelte v3.35.0 */
    const file$p = "src\\components\\organisms\\Nav.svelte";

    // (7:6) <Button href="https://osu.ppy.sh/community/forums/topics/1280306" target="_blank">
    function create_default_slot_4$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Forum post");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4$1.name,
    		type: "slot",
    		source: "(7:6) <Button href=\\\"https://osu.ppy.sh/community/forums/topics/1280306\\\" target=\\\"_blank\\\">",
    		ctx
    	});

    	return block;
    }

    // (12:6) <Button href="https://challonge.com/osumbs3" target="_blank">
    function create_default_slot_3$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Challonge");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$1.name,
    		type: "slot",
    		source: "(12:6) <Button href=\\\"https://challonge.com/osumbs3\\\" target=\\\"_blank\\\">",
    		ctx
    	});

    	return block;
    }

    // (17:6) <Button href="https://discord.gg/uNSqksR" target="_blank">
    function create_default_slot_2$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Discord");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$1.name,
    		type: "slot",
    		source: "(17:6) <Button href=\\\"https://discord.gg/uNSqksR\\\" target=\\\"_blank\\\">",
    		ctx
    	});

    	return block;
    }

    // (22:6) <Button href="#/players">
    function create_default_slot_1$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Players");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(22:6) <Button href=\\\"#/players\\\">",
    		ctx
    	});

    	return block;
    }

    // (25:6) <Button href="#/countries">
    function create_default_slot$4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Countries");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(25:6) <Button href=\\\"#/countries\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$p(ctx) {
    	let nav;
    	let ul;
    	let li0;
    	let button0;
    	let t0;
    	let li1;
    	let button1;
    	let t1;
    	let li2;
    	let button2;
    	let t2;
    	let li3;
    	let button3;
    	let t3;
    	let li4;
    	let button4;
    	let current;

    	button0 = new Button({
    			props: {
    				href: "https://osu.ppy.sh/community/forums/topics/1280306",
    				target: "_blank",
    				$$slots: { default: [create_default_slot_4$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1 = new Button({
    			props: {
    				href: "https://challonge.com/osumbs3",
    				target: "_blank",
    				$$slots: { default: [create_default_slot_3$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button2 = new Button({
    			props: {
    				href: "https://discord.gg/uNSqksR",
    				target: "_blank",
    				$$slots: { default: [create_default_slot_2$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button3 = new Button({
    			props: {
    				href: "#/players",
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button4 = new Button({
    			props: {
    				href: "#/countries",
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			ul = element("ul");
    			li0 = element("li");
    			create_component(button0.$$.fragment);
    			t0 = space();
    			li1 = element("li");
    			create_component(button1.$$.fragment);
    			t1 = space();
    			li2 = element("li");
    			create_component(button2.$$.fragment);
    			t2 = space();
    			li3 = element("li");
    			create_component(button3.$$.fragment);
    			t3 = space();
    			li4 = element("li");
    			create_component(button4.$$.fragment);
    			attr_dev(li0, "class", "svelte-rtylg");
    			add_location(li0, file$p, 5, 4, 96);
    			attr_dev(li1, "class", "svelte-rtylg");
    			add_location(li1, file$p, 10, 4, 244);
    			attr_dev(li2, "class", "svelte-rtylg");
    			add_location(li2, file$p, 15, 4, 370);
    			attr_dev(li3, "class", "svelte-rtylg");
    			add_location(li3, file$p, 20, 4, 491);
    			attr_dev(li4, "class", "svelte-rtylg");
    			add_location(li4, file$p, 23, 4, 561);
    			attr_dev(ul, "class", "svelte-rtylg");
    			add_location(ul, file$p, 4, 2, 86);
    			add_location(nav, file$p, 3, 0, 77);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, ul);
    			append_dev(ul, li0);
    			mount_component(button0, li0, null);
    			append_dev(ul, t0);
    			append_dev(ul, li1);
    			mount_component(button1, li1, null);
    			append_dev(ul, t1);
    			append_dev(ul, li2);
    			mount_component(button2, li2, null);
    			append_dev(ul, t2);
    			append_dev(ul, li3);
    			mount_component(button3, li3, null);
    			append_dev(ul, t3);
    			append_dev(ul, li4);
    			mount_component(button4, li4, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    			const button2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				button2_changes.$$scope = { dirty, ctx };
    			}

    			button2.$set(button2_changes);
    			const button3_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				button3_changes.$$scope = { dirty, ctx };
    			}

    			button3.$set(button3_changes);
    			const button4_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				button4_changes.$$scope = { dirty, ctx };
    			}

    			button4.$set(button4_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			transition_in(button3.$$.fragment, local);
    			transition_in(button4.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			transition_out(button3.$$.fragment, local);
    			transition_out(button4.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			destroy_component(button0);
    			destroy_component(button1);
    			destroy_component(button2);
    			destroy_component(button3);
    			destroy_component(button4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$p.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$p($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Nav", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Nav> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Button });
    	return [];
    }

    class Nav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$7(this, options, instance$p, create_fragment$p, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nav",
    			options,
    			id: create_fragment$p.name
    		});
    	}
    }

    /* src\components\organisms\Schedule.svelte generated by Svelte v3.35.0 */

    const file$o = "src\\components\\organisms\\Schedule.svelte";

    function get_each_context$j(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    // (27:2) {:else}
    function create_else_block_1$9(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$9.name,
    		type: "else",
    		source: "(27:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (16:8) {:else}
    function create_else_block$h(ctx) {
    	let t_value = /*stage*/ ctx[3].name + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*stages*/ 1 && t_value !== (t_value = /*stage*/ ctx[3].name + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$h.name,
    		type: "else",
    		source: "(16:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (14:8) {#if stage.link}
    function create_if_block$i(ctx) {
    	let a;
    	let t_value = /*stage*/ ctx[3].name + "";
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = /*stage*/ ctx[3].link);
    			add_location(a, file$o, 14, 10, 450);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*stages*/ 1 && t_value !== (t_value = /*stage*/ ctx[3].name + "")) set_data_dev(t, t_value);

    			if (dirty & /*stages*/ 1 && a_href_value !== (a_href_value = /*stage*/ ctx[3].link)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$i.name,
    		type: "if",
    		source: "(14:8) {#if stage.link}",
    		ctx
    	});

    	return block;
    }

    // (11:2) {#each stages as stage, i (stage.slug)}
    function create_each_block$j(key_1, ctx) {
    	let div3;
    	let div0;
    	let t0;
    	let div1;
    	let t1_value = /*displayDate*/ ctx[2](/*stage*/ ctx[3].date_start) + "";
    	let t1;
    	let t2;
    	let div2;
    	let t3_value = /*displayDate*/ ctx[2](/*stage*/ ctx[3].date_end) + "";
    	let t3;
    	let t4;

    	function select_block_type(ctx, dirty) {
    		if (/*stage*/ ctx[3].link) return create_if_block$i;
    		return create_else_block$h;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			if_block.c();
    			t0 = space();
    			div1 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			div2 = element("div");
    			t3 = text(t3_value);
    			t4 = space();
    			attr_dev(div0, "class", "stage-name svelte-1xzsd");
    			add_location(div0, file$o, 12, 6, 388);
    			attr_dev(div1, "class", "stage-date svelte-1xzsd");
    			add_location(div1, file$o, 19, 6, 565);
    			attr_dev(div2, "class", "stage-date svelte-1xzsd");
    			add_location(div2, file$o, 22, 6, 652);
    			attr_dev(div3, "class", "stage svelte-1xzsd");
    			toggle_class(div3, "active", !/*i*/ ctx[5] || /*stages*/ ctx[0][/*i*/ ctx[5] - 1].date_end < /*now*/ ctx[1]);
    			add_location(div3, file$o, 11, 4, 313);
    			this.first = div3;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			if_block.m(div0, null);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div1, t1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, t3);
    			append_dev(div3, t4);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			}

    			if (dirty & /*stages*/ 1 && t1_value !== (t1_value = /*displayDate*/ ctx[2](/*stage*/ ctx[3].date_start) + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*stages*/ 1 && t3_value !== (t3_value = /*displayDate*/ ctx[2](/*stage*/ ctx[3].date_end) + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*stages, now*/ 3) {
    				toggle_class(div3, "active", !/*i*/ ctx[5] || /*stages*/ ctx[0][/*i*/ ctx[5] - 1].date_end < /*now*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$j.name,
    		type: "each",
    		source: "(11:2) {#each stages as stage, i (stage.slug)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$o(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value = /*stages*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*stage*/ ctx[3].slug;
    	validate_each_keys(ctx, each_value, get_each_context$j, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$j(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$j(key, child_ctx));
    	}

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block_1$9(ctx);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (each_1_else) {
    				each_1_else.c();
    			}

    			attr_dev(div, "class", "schedule svelte-1xzsd");
    			add_location(div, file$o, 9, 0, 242);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			if (each_1_else) {
    				each_1_else.m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*stages, now, displayDate*/ 7) {
    				each_value = /*stages*/ ctx[0];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$j, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, destroy_block, create_each_block$j, null, get_each_context$j);

    				if (each_value.length) {
    					if (each_1_else) {
    						each_1_else.d(1);
    						each_1_else = null;
    					}
    				} else if (!each_1_else) {
    					each_1_else = create_else_block_1$9(ctx);
    					each_1_else.c();
    					each_1_else.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (each_1_else) each_1_else.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$o($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Schedule", slots, []);
    	
    	let { stages = [] } = $$props;
    	const now = new Date().toISOString();

    	const displayDate = dateString => {
    		const date = new Date(dateString);
    		return date.toUTCString().replace(" 00:00:00 GMT", "");
    	};

    	const writable_props = ["stages"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Schedule> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("stages" in $$props) $$invalidate(0, stages = $$props.stages);
    	};

    	$$self.$capture_state = () => ({ stages, now, displayDate });

    	$$self.$inject_state = $$props => {
    		if ("stages" in $$props) $$invalidate(0, stages = $$props.stages);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [stages, now, displayDate];
    }

    class Schedule extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$7(this, options, instance$o, create_fragment$o, safe_not_equal, { stages: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Schedule",
    			options,
    			id: create_fragment$o.name
    		});
    	}

    	get stages() {
    		throw new Error("<Schedule>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set stages(value) {
    		throw new Error("<Schedule>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\pages\Staff.svelte generated by Svelte v3.35.0 */
    const file$n = "src\\pages\\Staff.svelte";

    function get_each_context$i(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    function get_each_context_1$9(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    function get_each_context_2$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    // (7:2) <Button>
    function create_default_slot_6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Hosts");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(7:2) <Button>",
    		ctx
    	});

    	return block;
    }

    // (14:2) <Button>
    function create_default_slot_5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Graphic Designer");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(14:2) <Button>",
    		ctx
    	});

    	return block;
    }

    // (20:2) <Button>
    function create_default_slot_4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Mappool selectors");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(20:2) <Button>",
    		ctx
    	});

    	return block;
    }

    // (32:2) <Button>
    function create_default_slot_3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Donators");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(32:2) <Button>",
    		ctx
    	});

    	return block;
    }

    // (39:2) <Button>
    function create_default_slot_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Referees");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(39:2) <Button>",
    		ctx
    	});

    	return block;
    }

    // (41:2) {#each $referees as ref, i}
    function create_each_block_2$4(ctx) {
    	let a;
    	let t0_value = /*ref*/ ctx[8].username + "";
    	let t0;
    	let a_href_value;
    	let t1;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(a, "href", a_href_value = `https://osu.ppy.sh/users/${/*ref*/ ctx[8].id}`);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noopener");
    			attr_dev(a, "class", "svelte-1psdwt3");
    			add_location(a, file$n, 41, 4, 1821);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t0);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$referees*/ 1 && t0_value !== (t0_value = /*ref*/ ctx[8].username + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*$referees*/ 1 && a_href_value !== (a_href_value = `https://osu.ppy.sh/users/${/*ref*/ ctx[8].id}`)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$4.name,
    		type: "each",
    		source: "(41:2) {#each $referees as ref, i}",
    		ctx
    	});

    	return block;
    }

    // (47:2) <Button>
    function create_default_slot_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Streamers");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(47:2) <Button>",
    		ctx
    	});

    	return block;
    }

    // (49:2) {#each $streamers as streamer, i}
    function create_each_block_1$9(ctx) {
    	let a;
    	let t0_value = /*streamer*/ ctx[6].username + "";
    	let t0;
    	let a_href_value;
    	let t1;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(a, "href", a_href_value = `https://osu.ppy.sh/users/${/*streamer*/ ctx[6].id}`);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noopener");
    			attr_dev(a, "class", "svelte-1psdwt3");
    			add_location(a, file$n, 49, 4, 2073);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t0);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$streamers*/ 2 && t0_value !== (t0_value = /*streamer*/ ctx[6].username + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*$streamers*/ 2 && a_href_value !== (a_href_value = `https://osu.ppy.sh/users/${/*streamer*/ ctx[6].id}`)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$9.name,
    		type: "each",
    		source: "(49:2) {#each $streamers as streamer, i}",
    		ctx
    	});

    	return block;
    }

    // (55:2) <Button>
    function create_default_slot$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Commentators");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(55:2) <Button>",
    		ctx
    	});

    	return block;
    }

    // (57:2) {#each $commentators as commentator, i}
    function create_each_block$i(ctx) {
    	let a;
    	let t0_value = /*commentator*/ ctx[3].username + "";
    	let t0;
    	let a_href_value;
    	let t1;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(a, "href", a_href_value = `https://osu.ppy.sh/users/${/*commentator*/ ctx[3].id}`);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noopener");
    			attr_dev(a, "class", "svelte-1psdwt3");
    			add_location(a, file$n, 57, 4, 2344);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t0);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$commentators*/ 4 && t0_value !== (t0_value = /*commentator*/ ctx[3].username + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*$commentators*/ 4 && a_href_value !== (a_href_value = `https://osu.ppy.sh/users/${/*commentator*/ ctx[3].id}`)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$i.name,
    		type: "each",
    		source: "(57:2) {#each $commentators as commentator, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$n(ctx) {
    	let div1;
    	let button0;
    	let t0;
    	let div0;
    	let a0;
    	let t2;
    	let a1;
    	let t4;
    	let div3;
    	let button1;
    	let t5;
    	let div2;
    	let a2;
    	let t7;
    	let div5;
    	let button2;
    	let t8;
    	let div4;
    	let a3;
    	let t10;
    	let a4;
    	let t12;
    	let a5;
    	let t14;
    	let a6;
    	let t16;
    	let a7;
    	let t18;
    	let a8;
    	let t20;
    	let a9;
    	let t22;
    	let div7;
    	let button3;
    	let t23;
    	let div6;
    	let a10;
    	let t25;
    	let a11;
    	let t27;
    	let div9;
    	let button4;
    	let t28;
    	let div8;
    	let t29;
    	let div11;
    	let button5;
    	let t30;
    	let div10;
    	let t31;
    	let div13;
    	let button6;
    	let t32;
    	let div12;
    	let current;

    	button0 = new Button({
    			props: {
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1 = new Button({
    			props: {
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button2 = new Button({
    			props: {
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button3 = new Button({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button4 = new Button({
    			props: {
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let each_value_2 = /*$referees*/ ctx[0];
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2$4(get_each_context_2$4(ctx, each_value_2, i));
    	}

    	button5 = new Button({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let each_value_1 = /*$streamers*/ ctx[1];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$9(get_each_context_1$9(ctx, each_value_1, i));
    	}

    	button6 = new Button({
    			props: {
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let each_value = /*$commentators*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$i(get_each_context$i(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			create_component(button0.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			a0 = element("a");
    			a0.textContent = "Paturages";
    			t2 = space();
    			a1 = element("a");
    			a1.textContent = "Davvy";
    			t4 = space();
    			div3 = element("div");
    			create_component(button1.$$.fragment);
    			t5 = space();
    			div2 = element("div");
    			a2 = element("a");
    			a2.textContent = "E-M-i";
    			t7 = space();
    			div5 = element("div");
    			create_component(button2.$$.fragment);
    			t8 = space();
    			div4 = element("div");
    			a3 = element("a");
    			a3.textContent = "Paturages";
    			t10 = space();
    			a4 = element("a");
    			a4.textContent = "Davvy";
    			t12 = space();
    			a5 = element("a");
    			a5.textContent = "DannyPX";
    			t14 = space();
    			a6 = element("a");
    			a6.textContent = "guden";
    			t16 = space();
    			a7 = element("a");
    			a7.textContent = "Kamikaze";
    			t18 = space();
    			a8 = element("a");
    			a8.textContent = "-mint-";
    			t20 = space();
    			a9 = element("a");
    			a9.textContent = "Konohana Lucia";
    			t22 = space();
    			div7 = element("div");
    			create_component(button3.$$.fragment);
    			t23 = space();
    			div6 = element("div");
    			a10 = element("a");
    			a10.textContent = "Konohana Lucia";
    			t25 = space();
    			a11 = element("a");
    			a11.textContent = "Syako";
    			t27 = space();
    			div9 = element("div");
    			create_component(button4.$$.fragment);
    			t28 = space();
    			div8 = element("div");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t29 = space();
    			div11 = element("div");
    			create_component(button5.$$.fragment);
    			t30 = space();
    			div10 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t31 = space();
    			div13 = element("div");
    			create_component(button6.$$.fragment);
    			t32 = space();
    			div12 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(a0, "href", "https://osu.ppy.sh/users/1375479");
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "rel", "noopener");
    			attr_dev(a0, "class", "svelte-1psdwt3");
    			add_location(a0, file$n, 8, 4, 233);
    			attr_dev(a1, "href", "https://osu.ppy.sh/users/10047413");
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "rel", "noopener");
    			attr_dev(a1, "class", "svelte-1psdwt3");
    			add_location(a1, file$n, 9, 4, 332);
    			attr_dev(div0, "class", "container svelte-1psdwt3");
    			add_location(div0, file$n, 7, 2, 204);
    			attr_dev(div1, "class", "section svelte-1psdwt3");
    			add_location(div1, file$n, 5, 0, 153);
    			attr_dev(a2, "href", "https://osu.ppy.sh/users/9148286");
    			attr_dev(a2, "target", "_blank");
    			attr_dev(a2, "rel", "noopener");
    			attr_dev(a2, "class", "svelte-1psdwt3");
    			add_location(a2, file$n, 15, 4, 527);
    			attr_dev(div2, "class", "container svelte-1psdwt3");
    			add_location(div2, file$n, 14, 2, 498);
    			attr_dev(div3, "class", "section svelte-1psdwt3");
    			add_location(div3, file$n, 12, 0, 436);
    			attr_dev(a3, "href", "https://osu.ppy.sh/users/1375479");
    			attr_dev(a3, "target", "_blank");
    			attr_dev(a3, "rel", "noopener");
    			attr_dev(a3, "class", "svelte-1psdwt3");
    			add_location(a3, file$n, 21, 4, 722);
    			attr_dev(a4, "href", "https://osu.ppy.sh/users/10047413");
    			attr_dev(a4, "target", "_blank");
    			attr_dev(a4, "rel", "noopener");
    			attr_dev(a4, "class", "svelte-1psdwt3");
    			add_location(a4, file$n, 22, 4, 821);
    			attr_dev(a5, "href", "https://osu.ppy.sh/users/11253722");
    			attr_dev(a5, "target", "_blank");
    			attr_dev(a5, "rel", "noopener");
    			attr_dev(a5, "class", "svelte-1psdwt3");
    			add_location(a5, file$n, 23, 4, 917);
    			attr_dev(a6, "href", "https://osu.ppy.sh/users/11626065");
    			attr_dev(a6, "target", "_blank");
    			attr_dev(a6, "rel", "noopener");
    			attr_dev(a6, "class", "svelte-1psdwt3");
    			add_location(a6, file$n, 24, 4, 1015);
    			attr_dev(a7, "href", "https://osu.ppy.sh/users/2124783");
    			attr_dev(a7, "target", "_blank");
    			attr_dev(a7, "rel", "noopener");
    			attr_dev(a7, "class", "svelte-1psdwt3");
    			add_location(a7, file$n, 25, 4, 1111);
    			attr_dev(a8, "href", "https://osu.ppy.sh/users/8976576");
    			attr_dev(a8, "target", "_blank");
    			attr_dev(a8, "rel", "noopener");
    			attr_dev(a8, "class", "svelte-1psdwt3");
    			add_location(a8, file$n, 26, 4, 1209);
    			attr_dev(a9, "href", "https://osu.ppy.sh/users/8642224");
    			attr_dev(a9, "target", "_blank");
    			attr_dev(a9, "rel", "noopener");
    			attr_dev(a9, "class", "svelte-1psdwt3");
    			add_location(a9, file$n, 27, 4, 1305);
    			attr_dev(div4, "class", "container svelte-1psdwt3");
    			add_location(div4, file$n, 20, 2, 693);
    			attr_dev(div5, "class", "section svelte-1psdwt3");
    			add_location(div5, file$n, 18, 0, 630);
    			attr_dev(a10, "href", "https://osu.ppy.sh/users/8642224");
    			attr_dev(a10, "target", "_blank");
    			attr_dev(a10, "rel", "noopener");
    			attr_dev(a10, "class", "svelte-1psdwt3");
    			add_location(a10, file$n, 33, 4, 1500);
    			attr_dev(a11, "href", "https://osu.ppy.sh/users/8184715");
    			attr_dev(a11, "target", "_blank");
    			attr_dev(a11, "rel", "noopener");
    			attr_dev(a11, "class", "svelte-1psdwt3");
    			add_location(a11, file$n, 34, 4, 1604);
    			attr_dev(div6, "class", "container svelte-1psdwt3");
    			add_location(div6, file$n, 32, 2, 1471);
    			attr_dev(div7, "class", "section svelte-1psdwt3");
    			add_location(div7, file$n, 30, 0, 1417);
    			attr_dev(div8, "class", "container svelte-1psdwt3");
    			add_location(div8, file$n, 39, 2, 1761);
    			attr_dev(div9, "class", "section svelte-1psdwt3");
    			add_location(div9, file$n, 37, 0, 1707);
    			attr_dev(div10, "class", "container svelte-1psdwt3");
    			add_location(div10, file$n, 47, 2, 2007);
    			attr_dev(div11, "class", "section svelte-1psdwt3");
    			add_location(div11, file$n, 45, 0, 1952);
    			attr_dev(div12, "class", "container svelte-1psdwt3");
    			add_location(div12, file$n, 55, 2, 2272);
    			attr_dev(div13, "class", "section svelte-1psdwt3");
    			add_location(div13, file$n, 53, 0, 2214);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			mount_component(button0, div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(div0, t2);
    			append_dev(div0, a1);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div3, anchor);
    			mount_component(button1, div3, null);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, a2);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div5, anchor);
    			mount_component(button2, div5, null);
    			append_dev(div5, t8);
    			append_dev(div5, div4);
    			append_dev(div4, a3);
    			append_dev(div4, t10);
    			append_dev(div4, a4);
    			append_dev(div4, t12);
    			append_dev(div4, a5);
    			append_dev(div4, t14);
    			append_dev(div4, a6);
    			append_dev(div4, t16);
    			append_dev(div4, a7);
    			append_dev(div4, t18);
    			append_dev(div4, a8);
    			append_dev(div4, t20);
    			append_dev(div4, a9);
    			insert_dev(target, t22, anchor);
    			insert_dev(target, div7, anchor);
    			mount_component(button3, div7, null);
    			append_dev(div7, t23);
    			append_dev(div7, div6);
    			append_dev(div6, a10);
    			append_dev(div6, t25);
    			append_dev(div6, a11);
    			insert_dev(target, t27, anchor);
    			insert_dev(target, div9, anchor);
    			mount_component(button4, div9, null);
    			append_dev(div9, t28);
    			append_dev(div9, div8);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(div8, null);
    			}

    			insert_dev(target, t29, anchor);
    			insert_dev(target, div11, anchor);
    			mount_component(button5, div11, null);
    			append_dev(div11, t30);
    			append_dev(div11, div10);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div10, null);
    			}

    			insert_dev(target, t31, anchor);
    			insert_dev(target, div13, anchor);
    			mount_component(button6, div13, null);
    			append_dev(div13, t32);
    			append_dev(div13, div12);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div12, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 1024) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty & /*$$scope*/ 1024) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    			const button2_changes = {};

    			if (dirty & /*$$scope*/ 1024) {
    				button2_changes.$$scope = { dirty, ctx };
    			}

    			button2.$set(button2_changes);
    			const button3_changes = {};

    			if (dirty & /*$$scope*/ 1024) {
    				button3_changes.$$scope = { dirty, ctx };
    			}

    			button3.$set(button3_changes);
    			const button4_changes = {};

    			if (dirty & /*$$scope*/ 1024) {
    				button4_changes.$$scope = { dirty, ctx };
    			}

    			button4.$set(button4_changes);

    			if (dirty & /*$referees*/ 1) {
    				each_value_2 = /*$referees*/ ctx[0];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$4(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2$4(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(div8, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			const button5_changes = {};

    			if (dirty & /*$$scope*/ 1024) {
    				button5_changes.$$scope = { dirty, ctx };
    			}

    			button5.$set(button5_changes);

    			if (dirty & /*$streamers*/ 2) {
    				each_value_1 = /*$streamers*/ ctx[1];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$9(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$9(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div10, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			const button6_changes = {};

    			if (dirty & /*$$scope*/ 1024) {
    				button6_changes.$$scope = { dirty, ctx };
    			}

    			button6.$set(button6_changes);

    			if (dirty & /*$commentators*/ 4) {
    				each_value = /*$commentators*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$i(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$i(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div12, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			transition_in(button3.$$.fragment, local);
    			transition_in(button4.$$.fragment, local);
    			transition_in(button5.$$.fragment, local);
    			transition_in(button6.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			transition_out(button3.$$.fragment, local);
    			transition_out(button4.$$.fragment, local);
    			transition_out(button5.$$.fragment, local);
    			transition_out(button6.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(button0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div3);
    			destroy_component(button1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div5);
    			destroy_component(button2);
    			if (detaching) detach_dev(t22);
    			if (detaching) detach_dev(div7);
    			destroy_component(button3);
    			if (detaching) detach_dev(t27);
    			if (detaching) detach_dev(div9);
    			destroy_component(button4);
    			destroy_each(each_blocks_2, detaching);
    			if (detaching) detach_dev(t29);
    			if (detaching) detach_dev(div11);
    			destroy_component(button5);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t31);
    			if (detaching) detach_dev(div13);
    			destroy_component(button6);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$n($$self, $$props, $$invalidate) {
    	let $referees;
    	let $streamers;
    	let $commentators;
    	validate_store(referees, "referees");
    	component_subscribe($$self, referees, $$value => $$invalidate(0, $referees = $$value));
    	validate_store(streamers, "streamers");
    	component_subscribe($$self, streamers, $$value => $$invalidate(1, $streamers = $$value));
    	validate_store(commentators, "commentators");
    	component_subscribe($$self, commentators, $$value => $$invalidate(2, $commentators = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Staff", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Staff> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		commentators,
    		streamers,
    		referees,
    		Button,
    		$referees,
    		$streamers,
    		$commentators
    	});

    	return [$referees, $streamers, $commentators];
    }

    class Staff extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$7(this, options, instance$n, create_fragment$n, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Staff",
    			options,
    			id: create_fragment$n.name
    		});
    	}
    }

    /* src\components\molecules\Player.svelte generated by Svelte v3.35.0 */

    const file$m = "src\\components\\molecules\\Player.svelte";

    function create_fragment$m(ctx) {
    	let a;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div2;
    	let t1_value = /*player*/ ctx[0].username + "";
    	let t1;
    	let t2;
    	let div1;
    	let t3_value = /*player*/ ctx[0].country + "";
    	let t3;
    	let t4;
    	let div4;
    	let t5_value = /*player*/ ctx[0].ranking + "";
    	let t5;
    	let t6;
    	let div3;
    	let t7;
    	let t8_value = Number(/*player*/ ctx[0].pp).toFixed(2) + "";
    	let t8;
    	let t9;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div2 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			div1 = element("div");
    			t3 = text(t3_value);
    			t4 = space();
    			div4 = element("div");
    			t5 = text(t5_value);
    			t6 = space();
    			div3 = element("div");
    			t7 = text("(");
    			t8 = text(t8_value);
    			t9 = text(" pp)");
    			attr_dev(img, "class", "avatar svelte-18mwkz8");
    			if (img.src !== (img_src_value = /*player*/ ctx[0].avatar)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$m, 6, 4, 180);
    			attr_dev(div0, "class", "avatar svelte-18mwkz8");
    			add_location(div0, file$m, 5, 2, 154);
    			attr_dev(div1, "class", "country svelte-18mwkz8");
    			add_location(div1, file$m, 10, 4, 290);
    			attr_dev(div2, "class", "name svelte-18mwkz8");
    			add_location(div2, file$m, 8, 2, 243);
    			attr_dev(div3, "class", "pp svelte-18mwkz8");
    			add_location(div3, file$m, 14, 4, 396);
    			attr_dev(div4, "class", "ranking svelte-18mwkz8");
    			add_location(div4, file$m, 12, 2, 347);
    			attr_dev(a, "class", "player svelte-18mwkz8");
    			attr_dev(a, "href", a_href_value = `https://osu.ppy.sh/users/${/*player*/ ctx[0].id}`);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noopener");
    			add_location(a, file$m, 4, 0, 54);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, div0);
    			append_dev(div0, img);
    			append_dev(a, t0);
    			append_dev(a, div2);
    			append_dev(div2, t1);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, t3);
    			append_dev(a, t4);
    			append_dev(a, div4);
    			append_dev(div4, t5);
    			append_dev(div4, t6);
    			append_dev(div4, div3);
    			append_dev(div3, t7);
    			append_dev(div3, t8);
    			append_dev(div3, t9);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*player*/ 1 && img.src !== (img_src_value = /*player*/ ctx[0].avatar)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*player*/ 1 && t1_value !== (t1_value = /*player*/ ctx[0].username + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*player*/ 1 && t3_value !== (t3_value = /*player*/ ctx[0].country + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*player*/ 1 && t5_value !== (t5_value = /*player*/ ctx[0].ranking + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*player*/ 1 && t8_value !== (t8_value = Number(/*player*/ ctx[0].pp).toFixed(2) + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*player*/ 1 && a_href_value !== (a_href_value = `https://osu.ppy.sh/users/${/*player*/ ctx[0].id}`)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Player", slots, []);
    	
    	let { player } = $$props;
    	const writable_props = ["player"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Player> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("player" in $$props) $$invalidate(0, player = $$props.player);
    	};

    	$$self.$capture_state = () => ({ player });

    	$$self.$inject_state = $$props => {
    		if ("player" in $$props) $$invalidate(0, player = $$props.player);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [player];
    }

    class Player extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$7(this, options, instance$m, create_fragment$m, safe_not_equal, { player: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Player",
    			options,
    			id: create_fragment$m.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*player*/ ctx[0] === undefined && !("player" in props)) {
    			console.warn("<Player> was created without expected prop 'player'");
    		}
    	}

    	get player() {
    		throw new Error("<Player>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set player(value) {
    		throw new Error("<Player>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\pages\signup\Players.svelte generated by Svelte v3.35.0 */
    const file$l = "src\\pages\\signup\\Players.svelte";

    function get_each_context$h(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (31:0) {#if !$me}
    function create_if_block_1$f(ctx) {
    	let p;
    	let button;
    	let current;

    	button = new Button({
    			props: {
    				href: `${({
					"env": {
						"API_URL": "http://local.api.mbs3.fightthe.pw:8055",
						"UI_URL": "http://local.mbs3.fightthe.pw:5000",
						"isProd": false
					}
				}).env.API_URL}/auth/oauth/osu?redirect=${({
					"env": {
						"API_URL": "http://local.api.mbs3.fightthe.pw:8055",
						"UI_URL": "http://local.mbs3.fightthe.pw:5000",
						"isProd": false
					}
				}).env.UI_URL}`,
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			p = element("p");
    			create_component(button.$$.fragment);
    			attr_dev(p, "class", "register svelte-g74cd1");
    			add_location(p, file$l, 31, 2, 892);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			mount_component(button, p, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$f.name,
    		type: "if",
    		source: "(31:0) {#if !$me}",
    		ctx
    	});

    	return block;
    }

    // (33:4) <Button href={`${{"env":{"API_URL":"http://local.api.mbs3.fightthe.pw:8055","UI_URL":"http://local.mbs3.fightthe.pw:5000","isProd":false}}.env.API_URL}/auth/oauth/osu?redirect=${{"env":{"API_URL":"http://local.api.mbs3.fightthe.pw:8055","UI_URL":"http://local.mbs3.fightthe.pw:5000","isProd":false}}.env.UI_URL}`}>
    function create_default_slot$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Register");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(33:4) <Button href={`${{\\\"env\\\":{\\\"API_URL\\\":\\\"http://local.api.mbs3.fightthe.pw:8055\\\",\\\"UI_URL\\\":\\\"http://local.mbs3.fightthe.pw:5000\\\",\\\"isProd\\\":false}}.env.API_URL}/auth/oauth/osu?redirect=${{\\\"env\\\":{\\\"API_URL\\\":\\\"http://local.api.mbs3.fightthe.pw:8055\\\",\\\"UI_URL\\\":\\\"http://local.mbs3.fightthe.pw:5000\\\",\\\"isProd\\\":false}}.env.UI_URL}`}>",
    		ctx
    	});

    	return block;
    }

    // (53:0) {:else}
    function create_else_block$g(ctx) {
    	let div;
    	let t0;
    	let t1_value = /*$players*/ ctx[1].length + "";
    	let t1;
    	let t2;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*$players*/ ctx[1];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*player*/ ctx[4].id;
    	validate_each_keys(ctx, each_value, get_each_context$h, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$h(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$h(key, child_ctx));
    	}

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block_1$8(ctx);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("Total players: ");
    			t1 = text(t1_value);
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();

    			if (each_1_else) {
    				each_1_else.c();
    			}

    			attr_dev(div, "class", "stats");
    			add_location(div, file$l, 53, 2, 1727);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			insert_dev(target, t2, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);

    			if (each_1_else) {
    				each_1_else.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*$players*/ 2) && t1_value !== (t1_value = /*$players*/ ctx[1].length + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*$players*/ 2) {
    				each_value = /*$players*/ ctx[1];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$h, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block$h, each_1_anchor, get_each_context$h);
    				check_outros();

    				if (each_value.length) {
    					if (each_1_else) {
    						each_1_else.d(1);
    						each_1_else = null;
    					}
    				} else if (!each_1_else) {
    					each_1_else = create_else_block_1$8(ctx);
    					each_1_else.c();
    					each_1_else.m(each_1_anchor.parentNode, each_1_anchor);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    			if (each_1_else) each_1_else.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$g.name,
    		type: "else",
    		source: "(53:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (51:0) {#if !$players}
    function create_if_block$h(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading players...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$h.name,
    		type: "if",
    		source: "(51:0) {#if !$players}",
    		ctx
    	});

    	return block;
    }

    // (57:2) {:else}
    function create_else_block_1$8(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("No players registered yet!");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$8.name,
    		type: "else",
    		source: "(57:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (55:2) {#each $players as player (player.id)}
    function create_each_block$h(key_1, ctx) {
    	let first;
    	let player;
    	let current;

    	player = new Player({
    			props: { player: /*player*/ ctx[4] },
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(player.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(player, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const player_changes = {};
    			if (dirty & /*$players*/ 2) player_changes.player = /*player*/ ctx[4];
    			player.$set(player_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(player.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(player.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(player, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$h.name,
    		type: "each",
    		source: "(55:2) {#each $players as player (player.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$l(ctx) {
    	let t;
    	let p;
    	let current_block_type_index;
    	let if_block1;
    	let current;
    	let if_block0 = !/*$me*/ ctx[0] && create_if_block_1$f(ctx);
    	const if_block_creators = [create_if_block$h, create_else_block$g];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*$players*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			p = element("p");
    			if_block1.c();
    			attr_dev(p, "class", "players svelte-g74cd1");
    			add_location(p, file$l, 49, 0, 1656);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, p, anchor);
    			if_blocks[current_block_type_index].m(p, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*$me*/ ctx[0]) {
    				if (if_block0) {
    					if (dirty & /*$me*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1$f(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(p, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(p);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let $me;
    	let $players;
    	validate_store(me, "me");
    	component_subscribe($$self, me, $$value => $$invalidate(0, $me = $$value));
    	validate_store(players, "players");
    	component_subscribe($$self, players, $$value => $$invalidate(1, $players = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Players", slots, []);
    	let registering = false;

    	const register = async () => {
    		registering = true;
    		const timezone = -new Date().getTimezoneOffset() / 60;

    		const res = await api("/items/players", {
    			method: "POST",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify({
    				id: $me.id,
    				timezone: `UTC${timezone > 0 ? "+" : ""}${timezone}`
    			})
    		});

    		if (res.errors) {
    			alert(res.errors[0].message);
    		} else {
    			me.set({ ...$me, player: res.data });
    			players.set($players.concat([res.data]).sort((a, b) => b.ranking - a.ranking));
    		}

    		registering = false;
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Players> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Button,
    		Player,
    		me,
    		players,
    		api,
    		registering,
    		register,
    		$me,
    		$players
    	});

    	$$self.$inject_state = $$props => {
    		if ("registering" in $$props) registering = $$props.registering;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$me, $players];
    }

    class Players$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$7(this, options, instance$l, create_fragment$l, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Players",
    			options,
    			id: create_fragment$l.name
    		});
    	}
    }

    /* src\pages\signup\Countries.svelte generated by Svelte v3.35.0 */

    const { Object: Object_1$4 } = globals;
    const file$k = "src\\pages\\signup\\Countries.svelte";

    function get_each_context$g(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i].players;
    	child_ctx[6] = list[i].country;
    	return child_ctx;
    }

    function get_each_context_1$8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (29:2) {:else}
    function create_else_block$f(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$f.name,
    		type: "else",
    		source: "(29:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (22:4) {#if selectedCountry == country}
    function create_if_block$g(ctx) {
    	let div;
    	let t;
    	let current;
    	let each_value_1 = /*players*/ ctx[5];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$8(get_each_context_1$8(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "players svelte-1q27u36");
    			add_location(div, file$k, 22, 4, 1026);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*countries*/ 2) {
    				each_value_1 = /*players*/ ctx[5];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$8(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1$8(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, t);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$g.name,
    		type: "if",
    		source: "(22:4) {#if selectedCountry == country}",
    		ctx
    	});

    	return block;
    }

    // (24:6) {#each players as player}
    function create_each_block_1$8(ctx) {
    	let player;
    	let current;

    	player = new Player({
    			props: { player: /*player*/ ctx[9] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(player.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(player, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const player_changes = {};
    			if (dirty & /*countries*/ 2) player_changes.player = /*player*/ ctx[9];
    			player.$set(player_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(player.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(player.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(player, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$8.name,
    		type: "each",
    		source: "(24:6) {#each players as player}",
    		ctx
    	});

    	return block;
    }

    // (15:2) {#each countries as { players, country }
    function create_each_block$g(key_1, ctx) {
    	let div2;
    	let div0;
    	let t0_value = /*country*/ ctx[6] + "";
    	let t0;
    	let t1;
    	let t2_value = /*players*/ ctx[5].length + "";
    	let t2;
    	let t3;
    	let t4_value = (/*players*/ ctx[5].length == 1 ? "" : "s") + "";
    	let t4;
    	let t5;
    	let div1;

    	let t6_value = (/*selectedCountry*/ ctx[0] == /*country*/ ctx[6]
    	? "▼"
    	: "►") + "";

    	let t6;
    	let t7;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[4](/*country*/ ctx[6]);
    	}

    	let if_block = /*selectedCountry*/ ctx[0] == /*country*/ ctx[6] && create_if_block$g(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = text(": ");
    			t2 = text(t2_value);
    			t3 = text(" player");
    			t4 = text(t4_value);
    			t5 = space();
    			div1 = element("div");
    			t6 = text(t6_value);
    			t7 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(div0, "class", "label svelte-1q27u36");
    			add_location(div0, file$k, 16, 6, 786);
    			attr_dev(div1, "class", "pointer");
    			add_location(div1, file$k, 19, 6, 903);
    			attr_dev(div2, "class", "country svelte-1q27u36");
    			add_location(div2, file$k, 15, 4, 717);
    			this.first = div2;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, t3);
    			append_dev(div0, t4);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			append_dev(div1, t6);
    			insert_dev(target, t7, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div2, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*countries*/ 2) && t0_value !== (t0_value = /*country*/ ctx[6] + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*countries*/ 2) && t2_value !== (t2_value = /*players*/ ctx[5].length + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty & /*countries*/ 2) && t4_value !== (t4_value = (/*players*/ ctx[5].length == 1 ? "" : "s") + "")) set_data_dev(t4, t4_value);

    			if ((!current || dirty & /*selectedCountry, countries*/ 3) && t6_value !== (t6_value = (/*selectedCountry*/ ctx[0] == /*country*/ ctx[6]
    			? "▼"
    			: "►") + "")) set_data_dev(t6, t6_value);

    			if (/*selectedCountry*/ ctx[0] == /*country*/ ctx[6]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*selectedCountry, countries*/ 3) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$g(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t7);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$g.name,
    		type: "each",
    		source: "(15:2) {#each countries as { players, country }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*countries*/ ctx[1];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*country*/ ctx[6];
    	validate_each_keys(ctx, each_value, get_each_context$g, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$g(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$g(key, child_ctx));
    	}

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block$f(ctx);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (each_1_else) {
    				each_1_else.c();
    			}

    			attr_dev(div, "class", "countries svelte-1q27u36");
    			add_location(div, file$k, 13, 0, 633);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			if (each_1_else) {
    				each_1_else.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*countries, selectedCountry, selectCountry*/ 7) {
    				each_value = /*countries*/ ctx[1];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$g, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block$g, null, get_each_context$g);
    				check_outros();

    				if (each_value.length) {
    					if (each_1_else) {
    						each_1_else.d(1);
    						each_1_else = null;
    					}
    				} else if (!each_1_else) {
    					each_1_else = create_else_block$f(ctx);
    					each_1_else.c();
    					each_1_else.m(div, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (each_1_else) each_1_else.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let countries;
    	let $players;
    	validate_store(players, "players");
    	component_subscribe($$self, players, $$value => $$invalidate(3, $players = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Countries", slots, []);
    	
    	let selectedCountry;
    	const selectCountry = country => $$invalidate(0, selectedCountry = selectedCountry == country ? null : country);
    	const writable_props = [];

    	Object_1$4.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Countries> was created with unknown prop '${key}'`);
    	});

    	const click_handler = country => selectCountry(country);

    	$$self.$capture_state = () => ({
    		Player,
    		players,
    		selectedCountry,
    		selectCountry,
    		countries,
    		$players
    	});

    	$$self.$inject_state = $$props => {
    		if ("selectedCountry" in $$props) $$invalidate(0, selectedCountry = $$props.selectedCountry);
    		if ("countries" in $$props) $$invalidate(1, countries = $$props.countries);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$players*/ 8) {
    			$$invalidate(1, countries = Object.values(($players === null || $players === void 0
    			? void 0
    			: $players.reduce(
    					(obj, player) => {
    						if (!obj[player.country]) obj[player.country] = { country: player.country, players: [] };
    						obj[player.country].players.push(player);
    						return obj;
    					},
    					{}
    				)) || {}).sort((a, b) => a.players.length < b.players.length ? 1 : -1));
    		}
    	};

    	return [selectedCountry, countries, selectCountry, $players, click_handler];
    }

    class Countries extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$7(this, options, instance$k, create_fragment$k, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Countries",
    			options,
    			id: create_fragment$k.name
    		});
    	}
    }

    /* src\components\molecules\QualifierLobby.svelte generated by Svelte v3.35.0 */
    const file$j = "src\\components\\molecules\\QualifierLobby.svelte";

    function get_each_context$f(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (38:4) {:else}
    function create_else_block_2$2(ctx) {
    	let t0_value = /*lobby*/ ctx[0].name + "";
    	let t0;
    	let t1;
    	let if_block_anchor;
    	let current;
    	let if_block = /*setSchedule*/ ctx[2] && create_if_block_7$3(ctx);

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*lobby*/ 1) && t0_value !== (t0_value = /*lobby*/ ctx[0].name + "")) set_data_dev(t0, t0_value);

    			if (/*setSchedule*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*setSchedule*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_7$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2$2.name,
    		type: "else",
    		source: "(38:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (34:4) {#if lobby.link}
    function create_if_block_6$4(ctx) {
    	let a;
    	let t_value = /*lobby*/ ctx[0].name + "";
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = /*lobby*/ ctx[0].link);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noopener");
    			add_location(a, file$j, 34, 6, 1490);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*lobby*/ 1 && t_value !== (t_value = /*lobby*/ ctx[0].name + "")) set_data_dev(t, t_value);

    			if (dirty & /*lobby*/ 1 && a_href_value !== (a_href_value = /*lobby*/ ctx[0].link)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6$4.name,
    		type: "if",
    		source: "(34:4) {#if lobby.link}",
    		ctx
    	});

    	return block;
    }

    // (40:6) {#if setSchedule}
    function create_if_block_7$3(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_8$3, create_else_block_3$2];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*settingSchedule*/ ctx[4]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7$3.name,
    		type: "if",
    		source: "(40:6) {#if setSchedule}",
    		ctx
    	});

    	return block;
    }

    // (41:32) {:else}
    function create_else_block_3$2(ctx) {
    	let button;
    	let current;

    	button = new Button({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*handleSetSchedule*/ ctx[8]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 16384) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3$2.name,
    		type: "else",
    		source: "(41:32) {:else}",
    		ctx
    	});

    	return block;
    }

    // (41:8) {#if settingSchedule}
    function create_if_block_8$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8$3.name,
    		type: "if",
    		source: "(41:8) {#if settingSchedule}",
    		ctx
    	});

    	return block;
    }

    // (42:8) <Button on:click={handleSetSchedule}>
    function create_default_slot$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Sign up");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(42:8) <Button on:click={handleSetSchedule}>",
    		ctx
    	});

    	return block;
    }

    // (54:6) {:else}
    function create_else_block_1$7(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("To be defined");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$7.name,
    		type: "else",
    		source: "(54:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (52:6) {#if lobby.referee}
    function create_if_block_5$4(ctx) {
    	let a;
    	let t_value = /*lobby*/ ctx[0].referee.username + "";
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = `https://osu.ppy.sh/users/${/*lobby*/ ctx[0].referee.id}`);
    			add_location(a, file$j, 52, 8, 2076);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*lobby*/ 1 && t_value !== (t_value = /*lobby*/ ctx[0].referee.username + "")) set_data_dev(t, t_value);

    			if (dirty & /*lobby*/ 1 && a_href_value !== (a_href_value = `https://osu.ppy.sh/users/${/*lobby*/ ctx[0].referee.id}`)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$4.name,
    		type: "if",
    		source: "(52:6) {#if lobby.referee}",
    		ctx
    	});

    	return block;
    }

    // (57:6) {#if toggleAvailable}
    function create_if_block_2$b(ctx) {
    	let br;
    	let t0;
    	let b;
    	let t2;
    	let t3_value = (/*lobby*/ ctx[0].available_referees.map(func$2).join(", ") || "None") + "";
    	let t3;
    	let t4;
    	let if_block_anchor;

    	function select_block_type_3(ctx, dirty) {
    		if (/*settingAvailable*/ ctx[3]) return create_if_block_3$5;
    		if (/*isAdded*/ ctx[6]) return create_if_block_4$5;
    		return create_else_block$e;
    	}

    	let current_block_type = select_block_type_3(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			br = element("br");
    			t0 = space();
    			b = element("b");
    			b.textContent = "Available referees";
    			t2 = text(":\r\n        ");
    			t3 = text(t3_value);
    			t4 = text(" -\r\n        ");
    			if_block.c();
    			if_block_anchor = empty();
    			add_location(br, file$j, 57, 8, 2251);
    			add_location(b, file$j, 58, 8, 2267);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, br, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, b, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, t4, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*lobby*/ 1 && t3_value !== (t3_value = (/*lobby*/ ctx[0].available_referees.map(func$2).join(", ") || "None") + "")) set_data_dev(t3, t3_value);

    			if (current_block_type === (current_block_type = select_block_type_3(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(b);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(t4);
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$b.name,
    		type: "if",
    		source: "(57:6) {#if toggleAvailable}",
    		ctx
    	});

    	return block;
    }

    // (65:8) {:else}
    function create_else_block$e(ctx) {
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Add yourself as available";
    			attr_dev(a, "href", "javascript:void(0)");
    			add_location(a, file$j, 65, 10, 2598);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*handleToggleAvailable*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$e.name,
    		type: "else",
    		source: "(65:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (63:26) 
    function create_if_block_4$5(ctx) {
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Remove yourself";
    			attr_dev(a, "href", "javascript:void(0)");
    			add_location(a, file$j, 63, 10, 2488);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*handleToggleAvailable*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$5.name,
    		type: "if",
    		source: "(63:26) ",
    		ctx
    	});

    	return block;
    }

    // (61:8) {#if settingAvailable}
    function create_if_block_3$5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Processing...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$5.name,
    		type: "if",
    		source: "(61:8) {#if settingAvailable}",
    		ctx
    	});

    	return block;
    }

    // (74:30) 
    function create_if_block_1$e(ctx) {
    	let a;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Free spot!";
    			attr_dev(a, "class", "free-spot svelte-mwswut");
    			add_location(a, file$j, 74, 10, 2980);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$e.name,
    		type: "if",
    		source: "(74:30) ",
    		ctx
    	});

    	return block;
    }

    // (72:8) {#if lobby.players[i]}
    function create_if_block$f(ctx) {
    	let a;
    	let t_value = /*lobby*/ ctx[0].players[/*i*/ ctx[11]].username + "";
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = `https://osu.ppy.sh/users/${/*lobby*/ ctx[0].players[/*i*/ ctx[11]].id}`);
    			attr_dev(a, "class", "svelte-mwswut");
    			add_location(a, file$j, 72, 10, 2845);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*lobby*/ 1 && t_value !== (t_value = /*lobby*/ ctx[0].players[/*i*/ ctx[11]].username + "")) set_data_dev(t, t_value);

    			if (dirty & /*lobby*/ 1 && a_href_value !== (a_href_value = `https://osu.ppy.sh/users/${/*lobby*/ ctx[0].players[/*i*/ ctx[11]].id}`)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$f.name,
    		type: "if",
    		source: "(72:8) {#if lobby.players[i]}",
    		ctx
    	});

    	return block;
    }

    // (71:6) {#each [0, 1, 2, 3, 4, 5, 6, 7] as i}
    function create_each_block$f(ctx) {
    	let if_block_anchor;

    	function select_block_type_4(ctx, dirty) {
    		if (/*lobby*/ ctx[0].players[/*i*/ ctx[11]]) return create_if_block$f;
    		if (!/*lobby*/ ctx[0].link) return create_if_block_1$e;
    	}

    	let current_block_type = select_block_type_4(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_4(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) {
    				if_block.d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$f.name,
    		type: "each",
    		source: "(71:6) {#each [0, 1, 2, 3, 4, 5, 6, 7] as i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let div6;
    	let div0;
    	let current_block_type_index;
    	let if_block0;
    	let t0;
    	let div5;
    	let div1;
    	let t1_value = /*time*/ ctx[5].toUTCString().replace(":00 GMT", " UTC+0") + "";
    	let t1;
    	let t2;
    	let div2;
    	let t3;
    	let b0;
    	let t4_value = /*time*/ ctx[5].toTimeString().replace(":00 GMT", " UTC") + "";
    	let t4;
    	let t5;
    	let div3;
    	let b1;
    	let t7;
    	let t8;
    	let t9;
    	let div4;
    	let current;
    	const if_block_creators = [create_if_block_6$4, create_else_block_2$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*lobby*/ ctx[0].link) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	function select_block_type_2(ctx, dirty) {
    		if (/*lobby*/ ctx[0].referee) return create_if_block_5$4;
    		return create_else_block_1$7;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block1 = current_block_type(ctx);
    	let if_block2 = /*toggleAvailable*/ ctx[1] && create_if_block_2$b(ctx);
    	let each_value = [0, 1, 2, 3, 4, 5, 6, 7];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < 8; i += 1) {
    		each_blocks[i] = create_each_block$f(get_each_context$f(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div0 = element("div");
    			if_block0.c();
    			t0 = space();
    			div5 = element("div");
    			div1 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			div2 = element("div");
    			t3 = text("Your local time: ");
    			b0 = element("b");
    			t4 = text(t4_value);
    			t5 = space();
    			div3 = element("div");
    			b1 = element("b");
    			b1.textContent = "Referee";
    			t7 = text(":\r\n      ");
    			if_block1.c();
    			t8 = space();
    			if (if_block2) if_block2.c();
    			t9 = space();
    			div4 = element("div");

    			for (let i = 0; i < 8; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "name svelte-mwswut");
    			add_location(div0, file$j, 32, 2, 1442);
    			attr_dev(div1, "class", "utc svelte-mwswut");
    			add_location(div1, file$j, 47, 4, 1815);
    			add_location(b0, file$j, 48, 39, 1928);
    			attr_dev(div2, "class", "time svelte-mwswut");
    			add_location(div2, file$j, 48, 4, 1893);
    			add_location(b1, file$j, 50, 6, 2024);
    			attr_dev(div3, "class", "referee svelte-mwswut");
    			add_location(div3, file$j, 49, 4, 1995);
    			attr_dev(div4, "class", "players svelte-mwswut");
    			add_location(div4, file$j, 69, 4, 2735);
    			attr_dev(div5, "class", "body");
    			add_location(div5, file$j, 46, 2, 1791);
    			attr_dev(div6, "class", "lobby svelte-mwswut");
    			add_location(div6, file$j, 31, 0, 1419);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div0);
    			if_blocks[current_block_type_index].m(div0, null);
    			append_dev(div6, t0);
    			append_dev(div6, div5);
    			append_dev(div5, div1);
    			append_dev(div1, t1);
    			append_dev(div5, t2);
    			append_dev(div5, div2);
    			append_dev(div2, t3);
    			append_dev(div2, b0);
    			append_dev(b0, t4);
    			append_dev(div5, t5);
    			append_dev(div5, div3);
    			append_dev(div3, b1);
    			append_dev(div3, t7);
    			if_block1.m(div3, null);
    			append_dev(div3, t8);
    			if (if_block2) if_block2.m(div3, null);
    			append_dev(div5, t9);
    			append_dev(div5, div4);

    			for (let i = 0; i < 8; i += 1) {
    				each_blocks[i].m(div4, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				} else {
    					if_block0.p(ctx, dirty);
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(div0, null);
    			}

    			if ((!current || dirty & /*time*/ 32) && t1_value !== (t1_value = /*time*/ ctx[5].toUTCString().replace(":00 GMT", " UTC+0") + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*time*/ 32) && t4_value !== (t4_value = /*time*/ ctx[5].toTimeString().replace(":00 GMT", " UTC") + "")) set_data_dev(t4, t4_value);

    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div3, t8);
    				}
    			}

    			if (/*toggleAvailable*/ ctx[1]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_2$b(ctx);
    					if_block2.c();
    					if_block2.m(div3, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (dirty & /*lobby*/ 1) {
    				each_value = [0, 1, 2, 3, 4, 5, 6, 7];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < 8; i += 1) {
    					const child_ctx = get_each_context$f(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$f(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div4, null);
    					}
    				}

    				for (; i < 8; i += 1) {
    					each_blocks[i].d(1);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			if_blocks[current_block_type_index].d();
    			if_block1.d();
    			if (if_block2) if_block2.d();
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func$2 = ({ referee }) => referee.username;

    function instance$j($$self, $$props, $$invalidate) {
    	let time;
    	let isAdded;
    	let $me;
    	validate_store(me, "me");
    	component_subscribe($$self, me, $$value => $$invalidate(9, $me = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("QualifierLobby", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	
    	let { lobby } = $$props;
    	let { toggleAvailable } = $$props;
    	let { setSchedule } = $$props;
    	let settingAvailable;

    	const handleToggleAvailable = () => __awaiter(void 0, void 0, void 0, function* () {
    		$$invalidate(3, settingAvailable = true);
    		yield toggleAvailable();
    		$$invalidate(3, settingAvailable = false);
    	});

    	let settingSchedule;

    	const handleSetSchedule = () => __awaiter(void 0, void 0, void 0, function* () {
    		$$invalidate(4, settingSchedule = true);
    		yield setSchedule();
    		$$invalidate(4, settingSchedule = false);
    	});

    	const writable_props = ["lobby", "toggleAvailable", "setSchedule"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<QualifierLobby> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("lobby" in $$props) $$invalidate(0, lobby = $$props.lobby);
    		if ("toggleAvailable" in $$props) $$invalidate(1, toggleAvailable = $$props.toggleAvailable);
    		if ("setSchedule" in $$props) $$invalidate(2, setSchedule = $$props.setSchedule);
    	};

    	$$self.$capture_state = () => ({
    		__awaiter,
    		Button,
    		me,
    		lobby,
    		toggleAvailable,
    		setSchedule,
    		settingAvailable,
    		handleToggleAvailable,
    		settingSchedule,
    		handleSetSchedule,
    		time,
    		isAdded,
    		$me
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("lobby" in $$props) $$invalidate(0, lobby = $$props.lobby);
    		if ("toggleAvailable" in $$props) $$invalidate(1, toggleAvailable = $$props.toggleAvailable);
    		if ("setSchedule" in $$props) $$invalidate(2, setSchedule = $$props.setSchedule);
    		if ("settingAvailable" in $$props) $$invalidate(3, settingAvailable = $$props.settingAvailable);
    		if ("settingSchedule" in $$props) $$invalidate(4, settingSchedule = $$props.settingSchedule);
    		if ("time" in $$props) $$invalidate(5, time = $$props.time);
    		if ("isAdded" in $$props) $$invalidate(6, isAdded = $$props.isAdded);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*lobby*/ 1) {
    			$$invalidate(5, time = new Date(lobby.time));
    		}

    		if ($$self.$$.dirty & /*toggleAvailable, lobby, $me*/ 515) {
    			$$invalidate(6, isAdded = toggleAvailable && lobby.available_referees.find(({ referee }) => referee.id == $me.id));
    		}
    	};

    	return [
    		lobby,
    		toggleAvailable,
    		setSchedule,
    		settingAvailable,
    		settingSchedule,
    		time,
    		isAdded,
    		handleToggleAvailable,
    		handleSetSchedule,
    		$me
    	];
    }

    class QualifierLobby extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init$7(this, options, instance$j, create_fragment$j, safe_not_equal, {
    			lobby: 0,
    			toggleAvailable: 1,
    			setSchedule: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "QualifierLobby",
    			options,
    			id: create_fragment$j.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*lobby*/ ctx[0] === undefined && !("lobby" in props)) {
    			console.warn("<QualifierLobby> was created without expected prop 'lobby'");
    		}

    		if (/*toggleAvailable*/ ctx[1] === undefined && !("toggleAvailable" in props)) {
    			console.warn("<QualifierLobby> was created without expected prop 'toggleAvailable'");
    		}

    		if (/*setSchedule*/ ctx[2] === undefined && !("setSchedule" in props)) {
    			console.warn("<QualifierLobby> was created without expected prop 'setSchedule'");
    		}
    	}

    	get lobby() {
    		throw new Error("<QualifierLobby>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lobby(value) {
    		throw new Error("<QualifierLobby>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toggleAvailable() {
    		throw new Error("<QualifierLobby>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggleAvailable(value) {
    		throw new Error("<QualifierLobby>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setSchedule() {
    		throw new Error("<QualifierLobby>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set setSchedule(value) {
    		throw new Error("<QualifierLobby>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\molecules\Map.svelte generated by Svelte v3.35.0 */

    const file$i = "src\\components\\molecules\\Map.svelte";

    function create_fragment$i(ctx) {
    	let div6;
    	let div5;
    	let div1;
    	let a0;
    	let t0_value = /*map*/ ctx[0].artist + "";
    	let t0;
    	let t1;
    	let t2_value = /*map*/ ctx[0].name + "";
    	let t2;
    	let br;
    	let t3_value = /*map*/ ctx[0].difficulty + "";
    	let t3;
    	let a0_href_value;
    	let t4;
    	let div0;
    	let t5_value = /*map*/ ctx[0].category + "";
    	let t5;
    	let t6;
    	let div4;
    	let div2;
    	let t7;
    	let a1;
    	let t8_value = /*map*/ ctx[0].charter + "";
    	let t8;
    	let a1_href_value;
    	let t9;
    	let div3;
    	let span0;
    	let t10;
    	let t11_value = /*map*/ ctx[0].sr + "";
    	let t11;
    	let t12;
    	let span1;
    	let t13;
    	let t14_value = /*map*/ ctx[0].length + "";
    	let t14;
    	let t15;
    	let span2;
    	let t16;
    	let t17_value = /*map*/ ctx[0].bpm + "";
    	let t17;
    	let t18;
    	let t19;
    	let span3;
    	let t20;
    	let t21_value = /*map*/ ctx[0].od + "";
    	let t21;
    	let t22;
    	let span4;
    	let t23;
    	let t24_value = /*map*/ ctx[0].hp + "";
    	let t24;
    	let t25;
    	let span5;
    	let t26;
    	let t27_value = /*map*/ ctx[0].weight + "";
    	let t27;
    	let div6_style_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div5 = element("div");
    			div1 = element("div");
    			a0 = element("a");
    			t0 = text(t0_value);
    			t1 = text(" - ");
    			t2 = text(t2_value);
    			br = element("br");
    			t3 = text(t3_value);
    			t4 = space();
    			div0 = element("div");
    			t5 = text(t5_value);
    			t6 = space();
    			div4 = element("div");
    			div2 = element("div");
    			t7 = text("Mapset by ");
    			a1 = element("a");
    			t8 = text(t8_value);
    			t9 = space();
    			div3 = element("div");
    			span0 = element("span");
    			t10 = text("⭐ ");
    			t11 = text(t11_value);
    			t12 = space();
    			span1 = element("span");
    			t13 = text("⏰ ");
    			t14 = text(t14_value);
    			t15 = space();
    			span2 = element("span");
    			t16 = text("🎵 ");
    			t17 = text(t17_value);
    			t18 = text(" BPM");
    			t19 = space();
    			span3 = element("span");
    			t20 = text("🎯 OD ");
    			t21 = text(t21_value);
    			t22 = space();
    			span4 = element("span");
    			t23 = text("❤️ HP ");
    			t24 = text(t24_value);
    			t25 = space();
    			span5 = element("span");
    			t26 = text("⚖️ Weight ");
    			t27 = text(t27_value);
    			add_location(br, file$i, 16, 33, 577);
    			attr_dev(a0, "class", "name svelte-ttf8w6");
    			attr_dev(a0, "href", a0_href_value = `https://osu.ppy.sh/beatmaps/${/*map*/ ctx[0].id}`);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "rel", "noopener");
    			add_location(a0, file$i, 15, 6, 448);
    			attr_dev(div0, "class", "category svelte-ttf8w6");
    			add_location(div0, file$i, 18, 6, 619);
    			attr_dev(div1, "class", "header svelte-ttf8w6");
    			add_location(div1, file$i, 14, 4, 420);
    			attr_dev(a1, "href", a1_href_value = `https://osu.ppy.sh/users/${/*map*/ ctx[0].charter_id}`);
    			attr_dev(a1, "class", "svelte-ttf8w6");
    			add_location(a1, file$i, 22, 18, 745);
    			attr_dev(div2, "class", "mapper");
    			add_location(div2, file$i, 21, 6, 705);
    			attr_dev(span0, "class", "stat-item svelte-ttf8w6");
    			add_location(span0, file$i, 25, 8, 868);
    			attr_dev(span1, "class", "stat-item svelte-ttf8w6");
    			add_location(span1, file$i, 28, 8, 941);
    			attr_dev(span2, "class", "stat-item svelte-ttf8w6");
    			add_location(span2, file$i, 31, 8, 1018);
    			attr_dev(span3, "class", "stat-item svelte-ttf8w6");
    			add_location(span3, file$i, 34, 8, 1097);
    			attr_dev(span4, "class", "stat-item svelte-ttf8w6");
    			add_location(span4, file$i, 37, 8, 1174);
    			attr_dev(span5, "class", "stat-item svelte-ttf8w6");
    			add_location(span5, file$i, 40, 8, 1251);
    			attr_dev(div3, "class", "stats svelte-ttf8w6");
    			add_location(div3, file$i, 24, 6, 839);
    			attr_dev(div4, "class", "body svelte-ttf8w6");
    			add_location(div4, file$i, 20, 4, 679);
    			attr_dev(div5, "class", "container svelte-ttf8w6");
    			add_location(div5, file$i, 13, 2, 391);
    			attr_dev(div6, "class", "map svelte-ttf8w6");
    			attr_dev(div6, "style", div6_style_value = `background-image:url(${/*map*/ ctx[0].cover})`);
    			toggle_class(div6, "rice", /*map*/ ctx[0].category.toLowerCase().match(/rice|tech/));
    			toggle_class(div6, "ln", /*map*/ ctx[0].category.toLowerCase().includes("ln"));
    			toggle_class(div6, "hybrid", /*map*/ ctx[0].category.toLowerCase().includes("hybrid"));
    			toggle_class(div6, "tiebreaker", /*map*/ ctx[0].category.toLowerCase().includes("tiebreaker"));
    			add_location(div6, file$i, 4, 0, 51);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div5);
    			append_dev(div5, div1);
    			append_dev(div1, a0);
    			append_dev(a0, t0);
    			append_dev(a0, t1);
    			append_dev(a0, t2);
    			append_dev(a0, br);
    			append_dev(a0, t3);
    			append_dev(div1, t4);
    			append_dev(div1, div0);
    			append_dev(div0, t5);
    			append_dev(div5, t6);
    			append_dev(div5, div4);
    			append_dev(div4, div2);
    			append_dev(div2, t7);
    			append_dev(div2, a1);
    			append_dev(a1, t8);
    			append_dev(div4, t9);
    			append_dev(div4, div3);
    			append_dev(div3, span0);
    			append_dev(span0, t10);
    			append_dev(span0, t11);
    			append_dev(div3, t12);
    			append_dev(div3, span1);
    			append_dev(span1, t13);
    			append_dev(span1, t14);
    			append_dev(div3, t15);
    			append_dev(div3, span2);
    			append_dev(span2, t16);
    			append_dev(span2, t17);
    			append_dev(span2, t18);
    			append_dev(div3, t19);
    			append_dev(div3, span3);
    			append_dev(span3, t20);
    			append_dev(span3, t21);
    			append_dev(div3, t22);
    			append_dev(div3, span4);
    			append_dev(span4, t23);
    			append_dev(span4, t24);
    			append_dev(div3, t25);
    			append_dev(div3, span5);
    			append_dev(span5, t26);
    			append_dev(span5, t27);

    			if (!mounted) {
    				dispose = listen_dev(div6, "click", /*click_handler*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*map*/ 1 && t0_value !== (t0_value = /*map*/ ctx[0].artist + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*map*/ 1 && t2_value !== (t2_value = /*map*/ ctx[0].name + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*map*/ 1 && t3_value !== (t3_value = /*map*/ ctx[0].difficulty + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*map*/ 1 && a0_href_value !== (a0_href_value = `https://osu.ppy.sh/beatmaps/${/*map*/ ctx[0].id}`)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*map*/ 1 && t5_value !== (t5_value = /*map*/ ctx[0].category + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*map*/ 1 && t8_value !== (t8_value = /*map*/ ctx[0].charter + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*map*/ 1 && a1_href_value !== (a1_href_value = `https://osu.ppy.sh/users/${/*map*/ ctx[0].charter_id}`)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*map*/ 1 && t11_value !== (t11_value = /*map*/ ctx[0].sr + "")) set_data_dev(t11, t11_value);
    			if (dirty & /*map*/ 1 && t14_value !== (t14_value = /*map*/ ctx[0].length + "")) set_data_dev(t14, t14_value);
    			if (dirty & /*map*/ 1 && t17_value !== (t17_value = /*map*/ ctx[0].bpm + "")) set_data_dev(t17, t17_value);
    			if (dirty & /*map*/ 1 && t21_value !== (t21_value = /*map*/ ctx[0].od + "")) set_data_dev(t21, t21_value);
    			if (dirty & /*map*/ 1 && t24_value !== (t24_value = /*map*/ ctx[0].hp + "")) set_data_dev(t24, t24_value);
    			if (dirty & /*map*/ 1 && t27_value !== (t27_value = /*map*/ ctx[0].weight + "")) set_data_dev(t27, t27_value);

    			if (dirty & /*map*/ 1 && div6_style_value !== (div6_style_value = `background-image:url(${/*map*/ ctx[0].cover})`)) {
    				attr_dev(div6, "style", div6_style_value);
    			}

    			if (dirty & /*map*/ 1) {
    				toggle_class(div6, "rice", /*map*/ ctx[0].category.toLowerCase().match(/rice|tech/));
    			}

    			if (dirty & /*map*/ 1) {
    				toggle_class(div6, "ln", /*map*/ ctx[0].category.toLowerCase().includes("ln"));
    			}

    			if (dirty & /*map*/ 1) {
    				toggle_class(div6, "hybrid", /*map*/ ctx[0].category.toLowerCase().includes("hybrid"));
    			}

    			if (dirty & /*map*/ 1) {
    				toggle_class(div6, "tiebreaker", /*map*/ ctx[0].category.toLowerCase().includes("tiebreaker"));
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Map", slots, []);
    	
    	let { map } = $$props;
    	const writable_props = ["map"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Map> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("map" in $$props) $$invalidate(0, map = $$props.map);
    	};

    	$$self.$capture_state = () => ({ map });

    	$$self.$inject_state = $$props => {
    		if ("map" in $$props) $$invalidate(0, map = $$props.map);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [map, click_handler];
    }

    class Map$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$7(this, options, instance$i, create_fragment$i, safe_not_equal, { map: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Map",
    			options,
    			id: create_fragment$i.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*map*/ ctx[0] === undefined && !("map" in props)) {
    			console.warn("<Map> was created without expected prop 'map'");
    		}
    	}

    	get map() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set map(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var query$5 = `{
  maps(
    filter: {
      stage: {
        slug: {
          _eq: "qualifiers"
        }
      }
    }
    sort: "order"
  ) {
    id
    artist
    name
    weight
    difficulty
    charter
    charter_id
    category
    bpm
    length
    od
    hp
    sr
    cover
  }
  qualifier_lobbies(sort: "time") {
    name
    link
    players {
      id
      username
    }
    time
    referee {
      id
      username
    }
    available_referees {
      rel_id: id
      referee: referees_id {
        id
        username
      }
    }
  }
}`;

    const qualifierLobbies = writable(null);
    const qualifierMaps = writable(null);
    const init$6 = async () => {
        const { data } = await api('/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: query$5 })
        });
        qualifierLobbies.set(data.qualifier_lobbies);
        qualifierMaps.set(data.maps);
    };

    /* src\pages\qualifiers\Lobbies.svelte generated by Svelte v3.35.0 */

    const { Map: Map_1$6 } = globals;

    const file$h = "src\\pages\\qualifiers\\Lobbies.svelte";

    function get_each_context$e(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (70:0) {#if $me?.player}
    function create_if_block_1$d(ctx) {
    	let p;

    	function select_block_type(ctx, dirty) {
    		if (/*$me*/ ctx[0].qualifier) return create_if_block_2$a;
    		return create_else_block_1$6;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			p = element("p");
    			if_block.c();
    			attr_dev(p, "class", "intro svelte-1pt4gyt");
    			add_location(p, file$h, 70, 0, 2910);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			if_block.m(p, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(p, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$d.name,
    		type: "if",
    		source: "(70:0) {#if $me?.player}",
    		ctx
    	});

    	return block;
    }

    // (83:2) {:else}
    function create_else_block_1$6(ctx) {
    	let t0;
    	let t1_value = /*$me*/ ctx[0].username + "";
    	let t1;
    	let t2;
    	let br0;
    	let br1;
    	let t3;
    	let br2;
    	let br3;
    	let t4;
    	let br4;
    	let t5;

    	const block = {
    		c: function create() {
    			t0 = text("Welcome, player ");
    			t1 = text(t1_value);
    			t2 = text("!");
    			br0 = element("br");
    			br1 = element("br");
    			t3 = text("\r\n    You can feel free to put yourself in any qualifier with a free spot in it.");
    			br2 = element("br");
    			br3 = element("br");
    			t4 = text("\r\n    If there is no lobby that suits you, please specify a time in the #reschedules channel in the Discord:");
    			br4 = element("br");
    			t5 = text("\r\n    we will try to organize a special extra lobby.");
    			add_location(br0, file$h, 83, 35, 3704);
    			add_location(br1, file$h, 83, 41, 3710);
    			add_location(br2, file$h, 84, 78, 3796);
    			add_location(br3, file$h, 84, 84, 3802);
    			add_location(br4, file$h, 85, 106, 3916);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, br3, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, br4, anchor);
    			insert_dev(target, t5, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$me*/ 1 && t1_value !== (t1_value = /*$me*/ ctx[0].username + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(br3);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(br4);
    			if (detaching) detach_dev(t5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$6.name,
    		type: "else",
    		source: "(83:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (72:2) {#if $me.qualifier}
    function create_if_block_2$a(ctx) {
    	let t0;
    	let b0;
    	let t1;
    	let t2_value = /*$me*/ ctx[0].qualifier.name + "";
    	let t2;
    	let t3;
    	let b1;
    	let t4_value = /*time*/ ctx[2].toUTCString().replace(":00 GMT", " UTC+0") + "";
    	let t4;
    	let br0;
    	let t5;
    	let b2;
    	let t6_value = /*time*/ ctx[2].toTimeString().replace(":00 GMT", " UTC") + "";
    	let t6;
    	let t7;
    	let br1;
    	let br2;
    	let t8;
    	let b3;
    	let t10;
    	let br3;
    	let t11;
    	let b4;
    	let t13;
    	let br4;
    	let br5;
    	let t14;
    	let b5;
    	let t16;
    	let br6;
    	let t17;
    	let br7;
    	let br8;

    	const block = {
    		c: function create() {
    			t0 = text("You are in ");
    			b0 = element("b");
    			t1 = text("Lobby ");
    			t2 = text(t2_value);
    			t3 = text(" happening on\r\n    ");
    			b1 = element("b");
    			t4 = text(t4_value);
    			br0 = element("br");
    			t5 = text("\r\n    (converted to your local time: ");
    			b2 = element("b");
    			t6 = text(t6_value);
    			t7 = text(").\r\n    ");
    			br1 = element("br");
    			br2 = element("br");
    			t8 = text("\r\n    The referee will ping you on Discord (make sure you are in our Discord) ");
    			b3 = element("b");
    			b3.textContent = "15 minutes";
    			t10 = text(" before the time");
    			br3 = element("br");
    			t11 = text("\r\n    and will invite you in the multiplayer lobby ");
    			b4 = element("b");
    			b4.textContent = "5 minutes";
    			t13 = text(" before the time. Make sure you are logged in the game by then!\r\n    ");
    			br4 = element("br");
    			br5 = element("br");
    			t14 = text("\r\n    Once you are in the game, you will play all maps ");
    			b5 = element("b");
    			b5.textContent = "2 times";
    			t16 = text(":");
    			br6 = element("br");
    			t17 = text("\r\n    the best score on each map will count in the final qualifiers leaderboard and determine your seed.\r\n    ");
    			br7 = element("br");
    			br8 = element("br");
    			add_location(b0, file$h, 72, 15, 2967);
    			add_location(b1, file$h, 73, 4, 3019);
    			add_location(br0, file$h, 73, 60, 3075);
    			add_location(b2, file$h, 74, 35, 3118);
    			add_location(br1, file$h, 75, 4, 3181);
    			add_location(br2, file$h, 75, 10, 3187);
    			add_location(b3, file$h, 76, 76, 3271);
    			add_location(br3, file$h, 76, 109, 3304);
    			add_location(b4, file$h, 77, 49, 3361);
    			add_location(br4, file$h, 78, 4, 3446);
    			add_location(br5, file$h, 78, 10, 3452);
    			add_location(b5, file$h, 79, 53, 3513);
    			add_location(br6, file$h, 79, 68, 3528);
    			add_location(br7, file$h, 81, 4, 3644);
    			add_location(br8, file$h, 81, 10, 3650);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, b0, anchor);
    			append_dev(b0, t1);
    			append_dev(b0, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, b1, anchor);
    			append_dev(b1, t4);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, b2, anchor);
    			append_dev(b2, t6);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, b3, anchor);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, br3, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, b4, anchor);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, br4, anchor);
    			insert_dev(target, br5, anchor);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, b5, anchor);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, br6, anchor);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, br7, anchor);
    			insert_dev(target, br8, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$me*/ 1 && t2_value !== (t2_value = /*$me*/ ctx[0].qualifier.name + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*time*/ 4 && t4_value !== (t4_value = /*time*/ ctx[2].toUTCString().replace(":00 GMT", " UTC+0") + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*time*/ 4 && t6_value !== (t6_value = /*time*/ ctx[2].toTimeString().replace(":00 GMT", " UTC") + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(b0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(b1);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(b2);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(b3);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(br3);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(b4);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(br4);
    			if (detaching) detach_dev(br5);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(b5);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(br6);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(br7);
    			if (detaching) detach_dev(br8);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$a.name,
    		type: "if",
    		source: "(72:2) {#if $me.qualifier}",
    		ctx
    	});

    	return block;
    }

    // (93:0) {:else}
    function create_else_block$d(ctx) {
    	let p0;
    	let each_blocks_1 = [];
    	let each0_lookup = new Map_1$6();
    	let t;
    	let p1;
    	let each_blocks = [];
    	let each1_lookup = new Map_1$6();
    	let current;
    	let each_value_1 = /*$qualifierMaps*/ ctx[3];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*map*/ ctx[11].id;
    	validate_each_keys(ctx, each_value_1, get_each_context_1$7, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$7(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each0_lookup.set(key, each_blocks_1[i] = create_each_block_1$7(key, child_ctx));
    	}

    	let each_value = /*$qualifierLobbies*/ ctx[1];
    	validate_each_argument(each_value);
    	const get_key_1 = ctx => /*lobby*/ ctx[8].name;
    	validate_each_keys(ctx, each_value, get_each_context$e, get_key_1);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$e(ctx, each_value, i);
    		let key = get_key_1(child_ctx);
    		each1_lookup.set(key, each_blocks[i] = create_each_block$e(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			p0 = element("p");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();
    			p1 = element("p");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(p0, "class", "maps svelte-1pt4gyt");
    			add_location(p0, file$h, 93, 2, 4090);
    			attr_dev(p1, "class", "lobbies svelte-1pt4gyt");
    			add_location(p1, file$h, 98, 2, 4190);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(p0, null);
    			}

    			insert_dev(target, t, anchor);
    			insert_dev(target, p1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(p1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$qualifierMaps*/ 8) {
    				each_value_1 = /*$qualifierMaps*/ ctx[3];
    				validate_each_argument(each_value_1);
    				group_outros();
    				validate_each_keys(ctx, each_value_1, get_each_context_1$7, get_key);
    				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key, 1, ctx, each_value_1, each0_lookup, p0, outro_and_destroy_block, create_each_block_1$7, null, get_each_context_1$7);
    				check_outros();
    			}

    			if (dirty & /*$qualifierLobbies, $me, toggleAvailable, setSchedule*/ 51) {
    				each_value = /*$qualifierLobbies*/ ctx[1];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$e, get_key_1);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key_1, 1, ctx, each_value, each1_lookup, p1, outro_and_destroy_block, create_each_block$e, null, get_each_context$e);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].d();
    			}

    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(p1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$d.name,
    		type: "else",
    		source: "(93:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (91:0) {#if !$qualifierLobbies}
    function create_if_block$e(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading qualifier lobbies...";
    			attr_dev(p, "class", "lobbies svelte-1pt4gyt");
    			add_location(p, file$h, 91, 2, 4026);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$e.name,
    		type: "if",
    		source: "(91:0) {#if !$qualifierLobbies}",
    		ctx
    	});

    	return block;
    }

    // (95:2) {#each $qualifierMaps as map (map.id)}
    function create_each_block_1$7(key_1, ctx) {
    	let first;
    	let map;
    	let current;

    	map = new Map$1({
    			props: { map: /*map*/ ctx[11] },
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(map.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(map, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const map_changes = {};
    			if (dirty & /*$qualifierMaps*/ 8) map_changes.map = /*map*/ ctx[11];
    			map.$set(map_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(map, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$7.name,
    		type: "each",
    		source: "(95:2) {#each $qualifierMaps as map (map.id)}",
    		ctx
    	});

    	return block;
    }

    // (100:2) {#each $qualifierLobbies as lobby (lobby.name)}
    function create_each_block$e(key_1, ctx) {
    	let first;
    	let qualifierlobby;
    	let current;

    	qualifierlobby = new QualifierLobby({
    			props: {
    				lobby: /*lobby*/ ctx[8],
    				toggleAvailable: /*$me*/ ctx[0]?.referee && /*toggleAvailable*/ ctx[4](/*lobby*/ ctx[8]),
    				setSchedule: /*$me*/ ctx[0]?.player && !/*$me*/ ctx[0]?.qualifier?.link && /*setSchedule*/ ctx[5](/*lobby*/ ctx[8])
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(qualifierlobby.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(qualifierlobby, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const qualifierlobby_changes = {};
    			if (dirty & /*$qualifierLobbies*/ 2) qualifierlobby_changes.lobby = /*lobby*/ ctx[8];
    			if (dirty & /*$me, $qualifierLobbies*/ 3) qualifierlobby_changes.toggleAvailable = /*$me*/ ctx[0]?.referee && /*toggleAvailable*/ ctx[4](/*lobby*/ ctx[8]);
    			if (dirty & /*$me, $qualifierLobbies*/ 3) qualifierlobby_changes.setSchedule = /*$me*/ ctx[0]?.player && !/*$me*/ ctx[0]?.qualifier?.link && /*setSchedule*/ ctx[5](/*lobby*/ ctx[8]);
    			qualifierlobby.$set(qualifierlobby_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(qualifierlobby.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(qualifierlobby.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(qualifierlobby, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$e.name,
    		type: "each",
    		source: "(100:2) {#each $qualifierLobbies as lobby (lobby.name)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let div;
    	let a0;
    	let t1;
    	let a1;
    	let t3;
    	let t4;
    	let current_block_type_index;
    	let if_block1;
    	let if_block1_anchor;
    	let current;
    	let if_block0 = /*$me*/ ctx[0]?.player && create_if_block_1$d(ctx);
    	const if_block_creators = [create_if_block$e, create_else_block$d];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (!/*$qualifierLobbies*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			a0 = element("a");
    			a0.textContent = "Rankings per map";
    			t1 = space();
    			a1 = element("a");
    			a1.textContent = "Player ranking";
    			t3 = space();
    			if (if_block0) if_block0.c();
    			t4 = space();
    			if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(a0, "href", "#/qualifiers!maps");
    			add_location(a0, file$h, 66, 2, 2788);
    			attr_dev(a1, "href", "#/qualifiers");
    			add_location(a1, file$h, 67, 2, 2840);
    			attr_dev(div, "class", "links svelte-1pt4gyt");
    			add_location(div, file$h, 65, 0, 2765);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a0);
    			append_dev(div, t1);
    			append_dev(div, a1);
    			insert_dev(target, t3, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t4, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$me*/ ctx[0]?.player) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$d(ctx);
    					if_block0.c();
    					if_block0.m(t4.parentNode, t4);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t3);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t4);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let time;
    	let $qualifierLobbies;
    	let $me;
    	let $qualifierMaps;
    	validate_store(qualifierLobbies, "qualifierLobbies");
    	component_subscribe($$self, qualifierLobbies, $$value => $$invalidate(1, $qualifierLobbies = $$value));
    	validate_store(me, "me");
    	component_subscribe($$self, me, $$value => $$invalidate(0, $me = $$value));
    	validate_store(qualifierMaps, "qualifierMaps");
    	component_subscribe($$self, qualifierMaps, $$value => $$invalidate(3, $qualifierMaps = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Lobbies", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	var _a;
    	
    	if (!$qualifierLobbies) init$6();

    	const toggleAvailable = lobby => () => __awaiter(void 0, void 0, void 0, function* () {
    		const existingEntry = lobby.available_referees.find(({ referee }) => referee.id == $me.id);

    		const res = yield api(`/items/qualifier_lobbies/${lobby.name}`, {
    			method: "PATCH",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify({
    				available_referees: existingEntry
    				? { delete: [existingEntry.rel_id] }
    				: { create: [{ referees_id: $me.id }] }
    			})
    		});

    		if (res.errors) {
    			alert(res.errors[0].message);
    		} else {
    			qualifierLobbies.set($qualifierLobbies.map(l => {
    				if (l.name != lobby.name) return l;

    				if (existingEntry) {
    					l.available_referees = l.available_referees.filter(({ referee }) => referee.id != $me.id);
    				} else {
    					l.available_referees.push({
    						rel_id: res.data.available_referees.pop(),
    						referee: $me.referee
    					});
    				}

    				return l;
    			}));
    		}
    	});

    	const setSchedule = lobby => () => __awaiter(void 0, void 0, void 0, function* () {
    		const res = yield api(`/custom/qualifiers/schedule`, {
    			method: "POST",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify({ qualifier: lobby.name })
    		});

    		if (res.errors) alert(res.errors[0].message);
    		location.reload();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Lobbies> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		__awaiter,
    		_a,
    		QualifierLobby,
    		Map: Map$1,
    		me,
    		api,
    		qualifierLobbies,
    		qualifierMaps,
    		init: init$6,
    		toggleAvailable,
    		setSchedule,
    		$qualifierLobbies,
    		$me,
    		time,
    		$qualifierMaps
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("_a" in $$props) $$invalidate(6, _a = $$props._a);
    		if ("time" in $$props) $$invalidate(2, time = $$props.time);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$me, _a*/ 65) {
    			$$invalidate(2, time = new Date($$invalidate(6, _a = $me === null || $me === void 0 ? void 0 : $me.qualifier) === null || _a === void 0
    				? void 0
    				: _a.time));
    		}
    	};

    	return [$me, $qualifierLobbies, time, $qualifierMaps, toggleAvailable, setSchedule, _a];
    }

    class Lobbies extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$7(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Lobbies",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    /* src\components\molecules\ScoreRow.svelte generated by Svelte v3.35.0 */
    const file$g = "src\\components\\molecules\\ScoreRow.svelte";

    function create_fragment$g(ctx) {
    	let div11;
    	let div0;
    	let t0_value = /*score*/ ctx[1].position + "";
    	let t0;
    	let t1;
    	let t2;
    	let div1;
    	let a;
    	let t3_value = /*player*/ ctx[0].username + "";
    	let t3;
    	let a_href_value;
    	let t4;
    	let div3;
    	let t5_value = /*score*/ ctx[1].score + "";
    	let t5;
    	let t6;
    	let div2;
    	let t7_value = /*accuracy*/ ctx[3].toFixed(2) + "";
    	let t7;
    	let t8;
    	let t9_value = /*score*/ ctx[1].combo + "";
    	let t9;
    	let t10;
    	let div10;
    	let div4;
    	let t11_value = /*score*/ ctx[1].c320 + "";
    	let t11;
    	let t12;
    	let div5;
    	let t13_value = /*score*/ ctx[1].c300 + "";
    	let t13;
    	let t14;
    	let div6;
    	let t15_value = /*score*/ ctx[1].c200 + "";
    	let t15;
    	let t16;
    	let div7;
    	let t17_value = /*score*/ ctx[1].c100 + "";
    	let t17;
    	let t18;
    	let div8;
    	let t19_value = /*score*/ ctx[1].c50 + "";
    	let t19;
    	let t20;
    	let div9;
    	let t21_value = /*score*/ ctx[1].c0 + "";
    	let t21;

    	const block = {
    		c: function create() {
    			div11 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = text(".");
    			t2 = space();
    			div1 = element("div");
    			a = element("a");
    			t3 = text(t3_value);
    			t4 = space();
    			div3 = element("div");
    			t5 = text(t5_value);
    			t6 = space();
    			div2 = element("div");
    			t7 = text(t7_value);
    			t8 = text("%, x");
    			t9 = text(t9_value);
    			t10 = space();
    			div10 = element("div");
    			div4 = element("div");
    			t11 = text(t11_value);
    			t12 = space();
    			div5 = element("div");
    			t13 = text(t13_value);
    			t14 = space();
    			div6 = element("div");
    			t15 = text(t15_value);
    			t16 = space();
    			div7 = element("div");
    			t17 = text(t17_value);
    			t18 = space();
    			div8 = element("div");
    			t19 = text(t19_value);
    			t20 = space();
    			div9 = element("div");
    			t21 = text(t21_value);
    			attr_dev(div0, "class", "position svelte-1m6wbdm");
    			add_location(div0, file$g, 13, 2, 427);
    			attr_dev(a, "href", a_href_value = `https://osu.ppy.sh/users/${/*player*/ ctx[0].id}`);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noopener");
    			add_location(a, file$g, 15, 4, 502);
    			attr_dev(div1, "class", "player svelte-1m6wbdm");
    			add_location(div1, file$g, 14, 2, 476);
    			attr_dev(div2, "class", "details svelte-1m6wbdm");
    			add_location(div2, file$g, 21, 4, 676);
    			attr_dev(div3, "class", "value svelte-1m6wbdm");
    			add_location(div3, file$g, 19, 2, 632);
    			attr_dev(div4, "class", "judgement svelte-1m6wbdm");
    			add_location(div4, file$g, 26, 4, 799);
    			attr_dev(div5, "class", "judgement svelte-1m6wbdm");
    			add_location(div5, file$g, 29, 4, 860);
    			attr_dev(div6, "class", "judgement svelte-1m6wbdm");
    			add_location(div6, file$g, 32, 4, 921);
    			attr_dev(div7, "class", "judgement svelte-1m6wbdm");
    			add_location(div7, file$g, 35, 4, 982);
    			attr_dev(div8, "class", "judgement svelte-1m6wbdm");
    			add_location(div8, file$g, 38, 4, 1043);
    			attr_dev(div9, "class", "judgement svelte-1m6wbdm");
    			add_location(div9, file$g, 41, 4, 1103);
    			attr_dev(div10, "class", "judgements svelte-1m6wbdm");
    			add_location(div10, file$g, 25, 2, 769);
    			attr_dev(div11, "class", "score svelte-1m6wbdm");
    			toggle_class(div11, "me", /*$me*/ ctx[2]?.id == /*player*/ ctx[0].id);
    			add_location(div11, file$g, 12, 0, 372);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div11, anchor);
    			append_dev(div11, div0);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div11, t2);
    			append_dev(div11, div1);
    			append_dev(div1, a);
    			append_dev(a, t3);
    			append_dev(div11, t4);
    			append_dev(div11, div3);
    			append_dev(div3, t5);
    			append_dev(div3, t6);
    			append_dev(div3, div2);
    			append_dev(div2, t7);
    			append_dev(div2, t8);
    			append_dev(div2, t9);
    			append_dev(div11, t10);
    			append_dev(div11, div10);
    			append_dev(div10, div4);
    			append_dev(div4, t11);
    			append_dev(div10, t12);
    			append_dev(div10, div5);
    			append_dev(div5, t13);
    			append_dev(div10, t14);
    			append_dev(div10, div6);
    			append_dev(div6, t15);
    			append_dev(div10, t16);
    			append_dev(div10, div7);
    			append_dev(div7, t17);
    			append_dev(div10, t18);
    			append_dev(div10, div8);
    			append_dev(div8, t19);
    			append_dev(div10, t20);
    			append_dev(div10, div9);
    			append_dev(div9, t21);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*score*/ 2 && t0_value !== (t0_value = /*score*/ ctx[1].position + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*player*/ 1 && t3_value !== (t3_value = /*player*/ ctx[0].username + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*player*/ 1 && a_href_value !== (a_href_value = `https://osu.ppy.sh/users/${/*player*/ ctx[0].id}`)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*score*/ 2 && t5_value !== (t5_value = /*score*/ ctx[1].score + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*score*/ 2 && t9_value !== (t9_value = /*score*/ ctx[1].combo + "")) set_data_dev(t9, t9_value);
    			if (dirty & /*score*/ 2 && t11_value !== (t11_value = /*score*/ ctx[1].c320 + "")) set_data_dev(t11, t11_value);
    			if (dirty & /*score*/ 2 && t13_value !== (t13_value = /*score*/ ctx[1].c300 + "")) set_data_dev(t13, t13_value);
    			if (dirty & /*score*/ 2 && t15_value !== (t15_value = /*score*/ ctx[1].c200 + "")) set_data_dev(t15, t15_value);
    			if (dirty & /*score*/ 2 && t17_value !== (t17_value = /*score*/ ctx[1].c100 + "")) set_data_dev(t17, t17_value);
    			if (dirty & /*score*/ 2 && t19_value !== (t19_value = /*score*/ ctx[1].c50 + "")) set_data_dev(t19, t19_value);
    			if (dirty & /*score*/ 2 && t21_value !== (t21_value = /*score*/ ctx[1].c0 + "")) set_data_dev(t21, t21_value);

    			if (dirty & /*$me, player*/ 5) {
    				toggle_class(div11, "me", /*$me*/ ctx[2]?.id == /*player*/ ctx[0].id);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div11);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let $me;
    	validate_store(me, "me");
    	component_subscribe($$self, me, $$value => $$invalidate(2, $me = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ScoreRow", slots, []);
    	
    	let { player } = $$props;
    	let { score } = $$props;
    	const totalCount = score.c320 + score.c300 + score.c200 + score.c100 + score.c50 + score.c0;
    	const accuracy = (305 * score.c320 + 300 * score.c300 + 200 * score.c200 + 100 * score.c100 + 50 * score.c50) / (3.05 * totalCount);
    	const writable_props = ["player", "score"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ScoreRow> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("player" in $$props) $$invalidate(0, player = $$props.player);
    		if ("score" in $$props) $$invalidate(1, score = $$props.score);
    	};

    	$$self.$capture_state = () => ({
    		me,
    		player,
    		score,
    		totalCount,
    		accuracy,
    		$me
    	});

    	$$self.$inject_state = $$props => {
    		if ("player" in $$props) $$invalidate(0, player = $$props.player);
    		if ("score" in $$props) $$invalidate(1, score = $$props.score);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [player, score, $me, accuracy];
    }

    class ScoreRow extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$7(this, options, instance$g, create_fragment$g, safe_not_equal, { player: 0, score: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ScoreRow",
    			options,
    			id: create_fragment$g.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*player*/ ctx[0] === undefined && !("player" in props)) {
    			console.warn("<ScoreRow> was created without expected prop 'player'");
    		}

    		if (/*score*/ ctx[1] === undefined && !("score" in props)) {
    			console.warn("<ScoreRow> was created without expected prop 'score'");
    		}
    	}

    	get player() {
    		throw new Error("<ScoreRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set player(value) {
    		throw new Error("<ScoreRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get score() {
    		throw new Error("<ScoreRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set score(value) {
    		throw new Error("<ScoreRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var query$4 = `{
  maps(
    filter: {
      stage: {
        slug: {
          _eq: "qualifiers"
        }
      }
    }
    sort: "order"
  ) {
    id
    artist
    name
    weight
    difficulty
    charter
    charter_id
    category
    bpm
    length
    od
    hp
    sr
    cover
  }
  qualifier_scores(sort: "-score", limit: -1) {
    player {
      id
    }
    map {
      id
    }
    lobby {
      name
      link
    }
    score
    combo
    c320
    c300
    c200
    c100
    c50
    c0
  }
}`;

    const regularMapRanking = writable(null);
    const regularPlayerRanking = writable(null);
    const eliteMapRanking = writable(null);
    const elitePlayerRanking = writable(null);
    const myQualifier = writable(null);
    // This assumes that the list of players has been fetched from stores/core,
    // so players have to be fed in the init.
    const init$5 = async (rawPlayers) => {
        var _a, _b;
        const regularPlayers = rawPlayers.filter(p => !p.elite);
        const elitePlayers = rawPlayers.filter(p => p.elite);
        const { data } = await api('/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: query$4 })
        });
        // there are at least 3 or 4 different meanings of map here please help
        const initMapPlayers = (map) => [
            map.id,
            Object.assign(Object.assign({}, map), { players: new Map() })
        ];
        const regularMapsMap = new Map(data.maps.map(initMapPlayers));
        const eliteMapsMap = new Map(data.maps.map(initMapPlayers));
        const initPlayerScores = (player) => [
            player.id,
            Object.assign(Object.assign({}, player), { totalScore: 0, 
                // Initialize players to bottom ranking
                sumOfPositions: rawPlayers.length * data.maps.length, mapScores: new Map(data.maps.map(map => [
                    map.id,
                    []
                ])) })
        ];
        const regularPlayersMap = new Map(regularPlayers.map(initPlayerScores));
        const elitePlayersMap = new Map(elitePlayers.map(initPlayerScores));
        // The fetched scores are ordered by descending score,
        // so the map leaderboards should be already sorted upon insertion.
        // Settings Map values should conserve order when doing .entries() or .values()
        data.qualifier_scores.forEach((score) => {
            var _a, _b;
            let player;
            if (player = regularPlayersMap.get((_a = score.player) === null || _a === void 0 ? void 0 : _a.id)) {
                if (!regularMapsMap.has(score.map.id))
                    return;
                player.mapScores.get(score.map.id).push(score);
                const mapPlayers = regularMapsMap.get(score.map.id).players;
                if (!mapPlayers.has(score.player.id)) {
                    mapPlayers.set(score.player.id, player);
                }
            }
            else if (player = elitePlayersMap.get((_b = score.player) === null || _b === void 0 ? void 0 : _b.id)) {
                if (!eliteMapsMap.has(score.map.id))
                    return;
                player.mapScores.get(score.map.id).push(score);
                const mapPlayers = eliteMapsMap.get(score.map.id).players;
                if (!mapPlayers.has(score.player.id)) {
                    mapPlayers.set(score.player.id, player);
                }
            }
        });
        // Compute map player positions
        for (const map of regularMapsMap.values()) {
            const mapPlayers = Array.from(map.players.values());
            for (let i = 0; i < mapPlayers.length; ++i) {
                const playerScore = mapPlayers[i].mapScores.get(map.id)[0];
                const previousPlayerScore = (_a = mapPlayers[i - 1]) === null || _a === void 0 ? void 0 : _a.mapScores.get(map.id)[0];
                playerScore.position = playerScore.score == (previousPlayerScore === null || previousPlayerScore === void 0 ? void 0 : previousPlayerScore.score) ? previousPlayerScore.position : i + 1;
            }
        }
        for (const map of eliteMapsMap.values()) {
            const mapPlayers = Array.from(map.players.values());
            for (let i = 0; i < mapPlayers.length; ++i) {
                const playerScore = mapPlayers[i].mapScores.get(map.id)[0];
                const previousPlayerScore = (_b = mapPlayers[i - 1]) === null || _b === void 0 ? void 0 : _b.mapScores.get(map.id)[0];
                playerScore.position = playerScore.score == (previousPlayerScore === null || previousPlayerScore === void 0 ? void 0 : previousPlayerScore.score) ? previousPlayerScore.position : i + 1;
            }
        }
        // Compute player sum of positions and total score
        // and set one's own qualifier
        for (const player of regularPlayersMap.values()) {
            player.sumOfPositions = data.maps.reduce((sum, map) => {
                var _a, _b;
                player.totalScore += (_a = player.mapScores.get(map.id)[0]) === null || _a === void 0 ? void 0 : _a.score;
                return sum + (((_b = player.mapScores.get(map.id)[0]) === null || _b === void 0 ? void 0 : _b.position) || rawPlayers.length);
            }, 0);
        }
        for (const player of elitePlayersMap.values()) {
            player.sumOfPositions = data.maps.reduce((sum, map) => {
                var _a, _b;
                player.totalScore += (_a = player.mapScores.get(map.id)[0]) === null || _a === void 0 ? void 0 : _a.score;
                return sum + (((_b = player.mapScores.get(map.id)[0]) === null || _b === void 0 ? void 0 : _b.position) || rawPlayers.length);
            }, 0);
        }
        const sortPlayers = (a, b) => {
            // Tiebreaker = totalScore
            if (a.sumOfPositions == b.sumOfPositions) {
                return a.totalScore < b.totalScore ? 1 : -1;
            }
            return a.sumOfPositions < b.sumOfPositions ? -1 : 1;
        };
        const regularSortedPlayers = Array.from(regularPlayersMap.values()).sort(sortPlayers);
        const eliteSortedPlayers = Array.from(elitePlayersMap.values()).sort(sortPlayers);
        regularSortedPlayers.forEach((p, i) => p.position = i + 1);
        eliteSortedPlayers.forEach((p, i) => p.position = i + 1);
        regularMapRanking.set(Array.from(regularMapsMap.values()));
        eliteMapRanking.set(Array.from(eliteMapsMap.values()));
        regularPlayerRanking.set(regularSortedPlayers);
        elitePlayerRanking.set(eliteSortedPlayers);
    };
    const initMyQualifier = (playerRanking, me) => {
        const myQualifierIndex = playerRanking.findIndex(player => player.id == (me === null || me === void 0 ? void 0 : me.id));
        if (myQualifierIndex > -1) {
            myQualifier.set(Object.assign(Object.assign({}, playerRanking[myQualifierIndex]), { position: myQualifierIndex + 1 }));
        }
    };

    /* src\pages\qualifiers\Maps.svelte generated by Svelte v3.35.0 */

    const { Map: Map_1$5, Object: Object_1$3 } = globals;

    const file$f = "src\\pages\\qualifiers\\Maps.svelte";

    function get_each_context$d(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (22:0) {:else}
    function create_else_block$c(ctx) {
    	let p;
    	let each_blocks = [];
    	let each_1_lookup = new Map_1$5();
    	let current;
    	let each_value = /*$regularMapRanking*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*map*/ ctx[8].id;
    	validate_each_keys(ctx, each_value, get_each_context$d, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$d(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$d(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			p = element("p");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(p, "class", "maps svelte-1pnvguw");
    			add_location(p, file$f, 22, 2, 935);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(p, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Array, $regularMapRanking, hiddenMaps, toggleHidden, $myQualifier*/ 15) {
    				each_value = /*$regularMapRanking*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$d, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, p, outro_and_destroy_block, create_each_block$d, null, get_each_context$d);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$c.name,
    		type: "else",
    		source: "(22:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (20:0) {#if !$regularMapRanking}
    function create_if_block$d(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading qualifier scores...";
    			attr_dev(p, "class", "lobbies");
    			add_location(p, file$f, 20, 2, 872);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$d.name,
    		type: "if",
    		source: "(20:0) {#if !$regularMapRanking}",
    		ctx
    	});

    	return block;
    }

    // (26:4) {#if $myQualifier}
    function create_if_block_2$9(ctx) {
    	let div;
    	let scorerow;
    	let current;

    	scorerow = new ScoreRow({
    			props: {
    				player: /*$myQualifier*/ ctx[1],
    				score: /*$myQualifier*/ ctx[1].mapScores.get(/*map*/ ctx[8].id)[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(scorerow.$$.fragment);
    			attr_dev(div, "class", "my-qualifier svelte-1pnvguw");
    			add_location(div, file$f, 26, 6, 1048);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(scorerow, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const scorerow_changes = {};
    			if (dirty & /*$myQualifier*/ 2) scorerow_changes.player = /*$myQualifier*/ ctx[1];
    			if (dirty & /*$myQualifier, $regularMapRanking*/ 3) scorerow_changes.score = /*$myQualifier*/ ctx[1].mapScores.get(/*map*/ ctx[8].id)[0];
    			scorerow.$set(scorerow_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(scorerow.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(scorerow.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(scorerow);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$9.name,
    		type: "if",
    		source: "(26:4) {#if $myQualifier}",
    		ctx
    	});

    	return block;
    }

    // (34:4) {#if !hiddenMaps[map.id]}
    function create_if_block_1$c(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map_1$5();
    	let each_1_anchor;
    	let current;
    	let each_value_1 = Array.from(/*map*/ ctx[8].players.values());
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*player*/ ctx[11].id;
    	validate_each_keys(ctx, each_value_1, get_each_context_1$6, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$6(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1$6(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Array, $regularMapRanking*/ 1) {
    				each_value_1 = Array.from(/*map*/ ctx[8].players.values());
    				validate_each_argument(each_value_1);
    				group_outros();
    				validate_each_keys(ctx, each_value_1, get_each_context_1$6, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block_1$6, each_1_anchor, get_each_context_1$6);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$c.name,
    		type: "if",
    		source: "(34:4) {#if !hiddenMaps[map.id]}",
    		ctx
    	});

    	return block;
    }

    // (35:6) {#each Array.from(map.players.values()) as player (player.id)}
    function create_each_block_1$6(key_1, ctx) {
    	let first;
    	let scorerow;
    	let current;

    	scorerow = new ScoreRow({
    			props: {
    				player: /*player*/ ctx[11],
    				score: /*player*/ ctx[11].mapScores.get(/*map*/ ctx[8].id)[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(scorerow.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(scorerow, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const scorerow_changes = {};
    			if (dirty & /*$regularMapRanking*/ 1) scorerow_changes.player = /*player*/ ctx[11];
    			if (dirty & /*$regularMapRanking*/ 1) scorerow_changes.score = /*player*/ ctx[11].mapScores.get(/*map*/ ctx[8].id)[0];
    			scorerow.$set(scorerow_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(scorerow.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(scorerow.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(scorerow, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$6.name,
    		type: "each",
    		source: "(35:6) {#each Array.from(map.players.values()) as player (player.id)}",
    		ctx
    	});

    	return block;
    }

    // (24:2) {#each $regularMapRanking as map (map.id)}
    function create_each_block$d(key_1, ctx) {
    	let first;
    	let map;
    	let t0;
    	let t1;
    	let a;

    	let t2_value = (/*hiddenMaps*/ ctx[2][/*map*/ ctx[8].id]
    	? "Show"
    	: "Hide") + "";

    	let t2;
    	let t3;
    	let t4;
    	let if_block1_anchor;
    	let current;
    	let mounted;
    	let dispose;

    	map = new Map$1({
    			props: { map: /*map*/ ctx[8] },
    			$$inline: true
    		});

    	let if_block0 = /*$myQualifier*/ ctx[1] && create_if_block_2$9(ctx);

    	function click_handler() {
    		return /*click_handler*/ ctx[7](/*map*/ ctx[8]);
    	}

    	let if_block1 = !/*hiddenMaps*/ ctx[2][/*map*/ ctx[8].id] && create_if_block_1$c(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(map.$$.fragment);
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			a = element("a");
    			t2 = text(t2_value);
    			t3 = text(" scores");
    			t4 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(a, "href", "javascript:void(0)");
    			add_location(a, file$f, 30, 4, 1195);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(map, target, anchor);
    			insert_dev(target, t0, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, a, anchor);
    			append_dev(a, t2);
    			append_dev(a, t3);
    			insert_dev(target, t4, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const map_changes = {};
    			if (dirty & /*$regularMapRanking*/ 1) map_changes.map = /*map*/ ctx[8];
    			map.$set(map_changes);

    			if (/*$myQualifier*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*$myQualifier*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2$9(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t1.parentNode, t1);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if ((!current || dirty & /*hiddenMaps, $regularMapRanking*/ 5) && t2_value !== (t2_value = (/*hiddenMaps*/ ctx[2][/*map*/ ctx[8].id]
    			? "Show"
    			: "Hide") + "")) set_data_dev(t2, t2_value);

    			if (!/*hiddenMaps*/ ctx[2][/*map*/ ctx[8].id]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*hiddenMaps, $regularMapRanking*/ 5) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1$c(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(map, detaching);
    			if (detaching) detach_dev(t0);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(t4);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$d.name,
    		type: "each",
    		source: "(24:2) {#each $regularMapRanking as map (map.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let div;
    	let a0;
    	let t1;
    	let a1;
    	let t3;
    	let a2;
    	let t5;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$d, create_else_block$c];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*$regularMapRanking*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			a0 = element("a");
    			a0.textContent = "Player rankings";
    			t1 = space();
    			a1 = element("a");
    			a1.textContent = "Qualifier lobbies";
    			t3 = space();
    			a2 = element("a");
    			a2.textContent = "Elite players";
    			t5 = space();
    			if_block.c();
    			if_block_anchor = empty();
    			attr_dev(a0, "href", "#/qualifiers");
    			add_location(a0, file$f, 15, 2, 680);
    			attr_dev(a1, "href", "#/qualifiers!lobbies");
    			add_location(a1, file$f, 16, 2, 726);
    			attr_dev(a2, "href", "#/qualifiers!elite!maps");
    			add_location(a2, file$f, 17, 2, 782);
    			attr_dev(div, "class", "links svelte-1pnvguw");
    			add_location(div, file$f, 14, 0, 657);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a0);
    			append_dev(div, t1);
    			append_dev(div, a1);
    			append_dev(div, t3);
    			append_dev(div, a2);
    			insert_dev(target, t5, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t5);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let $regularMapRanking;
    	let $players;
    	let $myQualifier;
    	let $regularPlayerRanking;
    	let $me;
    	validate_store(regularMapRanking, "regularMapRanking");
    	component_subscribe($$self, regularMapRanking, $$value => $$invalidate(0, $regularMapRanking = $$value));
    	validate_store(players, "players");
    	component_subscribe($$self, players, $$value => $$invalidate(4, $players = $$value));
    	validate_store(myQualifier, "myQualifier");
    	component_subscribe($$self, myQualifier, $$value => $$invalidate(1, $myQualifier = $$value));
    	validate_store(regularPlayerRanking, "regularPlayerRanking");
    	component_subscribe($$self, regularPlayerRanking, $$value => $$invalidate(5, $regularPlayerRanking = $$value));
    	validate_store(me, "me");
    	component_subscribe($$self, me, $$value => $$invalidate(6, $me = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Maps", slots, []);
    	let hiddenMaps = {};

    	const toggleHidden = map => {
    		$$invalidate(2, hiddenMaps = Object.assign(Object.assign({}, hiddenMaps), { [map.id]: !hiddenMaps[map.id] }));
    	};

    	const writable_props = [];

    	Object_1$3.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Maps> was created with unknown prop '${key}'`);
    	});

    	const click_handler = map => toggleHidden(map);

    	$$self.$capture_state = () => ({
    		Map: Map$1,
    		ScoreRow,
    		me,
    		players,
    		regularMapRanking,
    		regularPlayerRanking,
    		myQualifier,
    		init: init$5,
    		initMyQualifier,
    		hiddenMaps,
    		toggleHidden,
    		$regularMapRanking,
    		$players,
    		$myQualifier,
    		$regularPlayerRanking,
    		$me
    	});

    	$$self.$inject_state = $$props => {
    		if ("hiddenMaps" in $$props) $$invalidate(2, hiddenMaps = $$props.hiddenMaps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$regularMapRanking, $players*/ 17) {
    			if (!$regularMapRanking && $players) init$5($players);
    		}

    		if ($$self.$$.dirty & /*$myQualifier, $regularPlayerRanking, $me*/ 98) {
    			if (!$myQualifier && $regularPlayerRanking && $me) initMyQualifier($regularPlayerRanking, $me);
    		}
    	};

    	return [
    		$regularMapRanking,
    		$myQualifier,
    		hiddenMaps,
    		toggleHidden,
    		$players,
    		$regularPlayerRanking,
    		$me,
    		click_handler
    	];
    }

    class Maps$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$7(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Maps",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* src\components\molecules\QualifierPlayer.svelte generated by Svelte v3.35.0 */

    const file$e = "src\\components\\molecules\\QualifierPlayer.svelte";

    function get_each_context$c(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (26:2) {#each maps as map (map.id)}
    function create_each_block$c(key_1, ctx) {
    	let div;
    	let t0_value = (/*player*/ ctx[1].mapScores.get(/*map*/ ctx[4].id)[0]?.score || "N/A") + "";
    	let t0;
    	let br;
    	let t1;
    	let t2_value = (/*player*/ ctx[1].mapScores.get(/*map*/ ctx[4].id)[0]?.position || "-") + "";
    	let t2;
    	let t3;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			br = element("br");
    			t1 = text("\r\n      (");
    			t2 = text(t2_value);
    			t3 = text(")\r\n    ");
    			add_location(br, file$e, 27, 55, 810);
    			attr_dev(div, "class", "score svelte-nyb024");
    			add_location(div, file$e, 26, 4, 734);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, br);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			append_dev(div, t3);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*player, maps*/ 6 && t0_value !== (t0_value = (/*player*/ ctx[1].mapScores.get(/*map*/ ctx[4].id)[0]?.score || "N/A") + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*player, maps*/ 6 && t2_value !== (t2_value = (/*player*/ ctx[1].mapScores.get(/*map*/ ctx[4].id)[0]?.position || "-") + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$c.name,
    		type: "each",
    		source: "(26:2) {#each maps as map (map.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let a;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div2;
    	let t1;
    	let t2;
    	let t3_value = /*player*/ ctx[1].username + "";
    	let t3;
    	let t4;
    	let t5_value = /*player*/ ctx[1].ranking + "";
    	let t5;
    	let t6;
    	let div1;
    	let t7_value = /*player*/ ctx[1].country + "";
    	let t7;
    	let t8;
    	let div4;
    	let t9_value = /*maps*/ ctx[2].map(/*func*/ ctx[3]).join(" + ") + "";
    	let t9;
    	let t10;
    	let b;
    	let t11_value = /*player*/ ctx[1].sumOfPositions + "";
    	let t11;
    	let t12;
    	let div3;
    	let t13;
    	let t14_value = /*player*/ ctx[1].totalScore + "";
    	let t14;
    	let a_href_value;
    	let t15;
    	let div5;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value = /*maps*/ ctx[2];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*map*/ ctx[4].id;
    	validate_each_keys(ctx, each_value, get_each_context$c, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$c(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$c(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div2 = element("div");
    			t1 = text(/*position*/ ctx[0]);
    			t2 = text(". ");
    			t3 = text(t3_value);
    			t4 = text(" (#");
    			t5 = text(t5_value);
    			t6 = text(")\r\n    ");
    			div1 = element("div");
    			t7 = text(t7_value);
    			t8 = space();
    			div4 = element("div");
    			t9 = text(t9_value);
    			t10 = text("\r\n    =\r\n    ");
    			b = element("b");
    			t11 = text(t11_value);
    			t12 = space();
    			div3 = element("div");
    			t13 = text("Total score: ");
    			t14 = text(t14_value);
    			t15 = space();
    			div5 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(img, "class", "avatar svelte-nyb024");
    			if (img.src !== (img_src_value = /*player*/ ctx[1].avatar)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$e, 9, 4, 223);
    			attr_dev(div0, "class", "avatar svelte-nyb024");
    			add_location(div0, file$e, 8, 2, 197);
    			attr_dev(div1, "class", "country svelte-nyb024");
    			add_location(div1, file$e, 13, 4, 365);
    			attr_dev(div2, "class", "name svelte-nyb024");
    			add_location(div2, file$e, 11, 2, 286);
    			add_location(b, file$e, 18, 4, 545);
    			attr_dev(div3, "class", "total-score svelte-nyb024");
    			add_location(div3, file$e, 19, 4, 581);
    			attr_dev(div4, "class", "positions svelte-nyb024");
    			add_location(div4, file$e, 15, 2, 422);
    			attr_dev(a, "class", "player svelte-nyb024");
    			attr_dev(a, "href", a_href_value = `https://osu.ppy.sh/users/${/*player*/ ctx[1].id}`);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noopener");
    			add_location(a, file$e, 7, 0, 97);
    			attr_dev(div5, "class", "scores svelte-nyb024");
    			add_location(div5, file$e, 24, 0, 676);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, div0);
    			append_dev(div0, img);
    			append_dev(a, t0);
    			append_dev(a, div2);
    			append_dev(div2, t1);
    			append_dev(div2, t2);
    			append_dev(div2, t3);
    			append_dev(div2, t4);
    			append_dev(div2, t5);
    			append_dev(div2, t6);
    			append_dev(div2, div1);
    			append_dev(div1, t7);
    			append_dev(a, t8);
    			append_dev(a, div4);
    			append_dev(div4, t9);
    			append_dev(div4, t10);
    			append_dev(div4, b);
    			append_dev(b, t11);
    			append_dev(div4, t12);
    			append_dev(div4, div3);
    			append_dev(div3, t13);
    			append_dev(div3, t14);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, div5, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div5, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*player*/ 2 && img.src !== (img_src_value = /*player*/ ctx[1].avatar)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*position*/ 1) set_data_dev(t1, /*position*/ ctx[0]);
    			if (dirty & /*player*/ 2 && t3_value !== (t3_value = /*player*/ ctx[1].username + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*player*/ 2 && t5_value !== (t5_value = /*player*/ ctx[1].ranking + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*player*/ 2 && t7_value !== (t7_value = /*player*/ ctx[1].country + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*maps, player*/ 6 && t9_value !== (t9_value = /*maps*/ ctx[2].map(/*func*/ ctx[3]).join(" + ") + "")) set_data_dev(t9, t9_value);
    			if (dirty & /*player*/ 2 && t11_value !== (t11_value = /*player*/ ctx[1].sumOfPositions + "")) set_data_dev(t11, t11_value);
    			if (dirty & /*player*/ 2 && t14_value !== (t14_value = /*player*/ ctx[1].totalScore + "")) set_data_dev(t14, t14_value);

    			if (dirty & /*player*/ 2 && a_href_value !== (a_href_value = `https://osu.ppy.sh/users/${/*player*/ ctx[1].id}`)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*player, maps*/ 6) {
    				each_value = /*maps*/ ctx[2];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$c, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div5, destroy_block, create_each_block$c, null, get_each_context$c);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(div5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("QualifierPlayer", slots, []);
    	
    	
    	let { position } = $$props;
    	let { player } = $$props;
    	let { maps } = $$props;
    	const writable_props = ["position", "player", "maps"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<QualifierPlayer> was created with unknown prop '${key}'`);
    	});

    	const func = map => player.mapScores.get(map.id)[0]?.position || "N/A";

    	$$self.$$set = $$props => {
    		if ("position" in $$props) $$invalidate(0, position = $$props.position);
    		if ("player" in $$props) $$invalidate(1, player = $$props.player);
    		if ("maps" in $$props) $$invalidate(2, maps = $$props.maps);
    	};

    	$$self.$capture_state = () => ({ position, player, maps });

    	$$self.$inject_state = $$props => {
    		if ("position" in $$props) $$invalidate(0, position = $$props.position);
    		if ("player" in $$props) $$invalidate(1, player = $$props.player);
    		if ("maps" in $$props) $$invalidate(2, maps = $$props.maps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [position, player, maps, func];
    }

    class QualifierPlayer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$7(this, options, instance$e, create_fragment$e, safe_not_equal, { position: 0, player: 1, maps: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "QualifierPlayer",
    			options,
    			id: create_fragment$e.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*position*/ ctx[0] === undefined && !("position" in props)) {
    			console.warn("<QualifierPlayer> was created without expected prop 'position'");
    		}

    		if (/*player*/ ctx[1] === undefined && !("player" in props)) {
    			console.warn("<QualifierPlayer> was created without expected prop 'player'");
    		}

    		if (/*maps*/ ctx[2] === undefined && !("maps" in props)) {
    			console.warn("<QualifierPlayer> was created without expected prop 'maps'");
    		}
    	}

    	get position() {
    		throw new Error("<QualifierPlayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error("<QualifierPlayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get player() {
    		throw new Error("<QualifierPlayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set player(value) {
    		throw new Error("<QualifierPlayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get maps() {
    		throw new Error("<QualifierPlayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set maps(value) {
    		throw new Error("<QualifierPlayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\pages\qualifiers\Players.svelte generated by Svelte v3.35.0 */

    const file$d = "src\\pages\\qualifiers\\Players.svelte";

    function get_each_context$b(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (15:0) {#if $myQualifier}
    function create_if_block_6$3(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let qualifierplayer;
    	let current;

    	qualifierplayer = new QualifierPlayer({
    			props: {
    				position: /*$myQualifier*/ ctx[1].position,
    				player: /*$myQualifier*/ ctx[1],
    				maps: /*$regularMapRanking*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Your placement";
    			t1 = space();
    			create_component(qualifierplayer.$$.fragment);
    			add_location(h1, file$d, 16, 2, 697);
    			attr_dev(div, "class", "my-qualifier svelte-buidrs");
    			add_location(div, file$d, 15, 0, 667);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			mount_component(qualifierplayer, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const qualifierplayer_changes = {};
    			if (dirty & /*$myQualifier*/ 2) qualifierplayer_changes.position = /*$myQualifier*/ ctx[1].position;
    			if (dirty & /*$myQualifier*/ 2) qualifierplayer_changes.player = /*$myQualifier*/ ctx[1];
    			if (dirty & /*$regularMapRanking*/ 4) qualifierplayer_changes.maps = /*$regularMapRanking*/ ctx[2];
    			qualifierplayer.$set(qualifierplayer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(qualifierplayer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(qualifierplayer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(qualifierplayer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6$3.name,
    		type: "if",
    		source: "(15:0) {#if $myQualifier}",
    		ctx
    	});

    	return block;
    }

    // (23:0) {:else}
    function create_else_block$b(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*$regularPlayerRanking*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*player*/ ctx[5].id;
    	validate_each_keys(ctx, each_value, get_each_context$b, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$b(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$b(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "players svelte-buidrs");
    			add_location(div, file$d, 23, 2, 936);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$regularPlayerRanking, $regularMapRanking*/ 5) {
    				each_value = /*$regularPlayerRanking*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$b, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block$b, null, get_each_context$b);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$b.name,
    		type: "else",
    		source: "(23:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (21:0) {#if !$regularPlayerRanking}
    function create_if_block$c(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading qualifier scores...";
    			attr_dev(p, "class", "lobbies");
    			add_location(p, file$d, 21, 2, 873);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$c.name,
    		type: "if",
    		source: "(21:0) {#if !$regularPlayerRanking}",
    		ctx
    	});

    	return block;
    }

    // (34:23) 
    function create_if_block_5$3(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Not qualified";
    			add_location(h1, file$d, 34, 6, 1242);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$3.name,
    		type: "if",
    		source: "(34:23) ",
    		ctx
    	});

    	return block;
    }

    // (32:22) 
    function create_if_block_4$4(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Bottom seed";
    			add_location(h1, file$d, 32, 6, 1189);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$4.name,
    		type: "if",
    		source: "(32:22) ",
    		ctx
    	});

    	return block;
    }

    // (30:22) 
    function create_if_block_3$4(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Low seed";
    			add_location(h1, file$d, 30, 6, 1140);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$4.name,
    		type: "if",
    		source: "(30:22) ",
    		ctx
    	});

    	return block;
    }

    // (28:22) 
    function create_if_block_2$8(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "High seed";
    			add_location(h1, file$d, 28, 6, 1090);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$8.name,
    		type: "if",
    		source: "(28:22) ",
    		ctx
    	});

    	return block;
    }

    // (26:4) {#if i == 0}
    function create_if_block_1$b(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Top seed";
    			add_location(h1, file$d, 26, 6, 1041);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$b.name,
    		type: "if",
    		source: "(26:4) {#if i == 0}",
    		ctx
    	});

    	return block;
    }

    // (25:2) {#each $regularPlayerRanking as player, i (player.id)}
    function create_each_block$b(key_1, ctx) {
    	let first;
    	let t;
    	let qualifierplayer;
    	let current;

    	function select_block_type_1(ctx, dirty) {
    		if (/*i*/ ctx[7] == 0) return create_if_block_1$b;
    		if (/*i*/ ctx[7] == 32) return create_if_block_2$8;
    		if (/*i*/ ctx[7] == 64) return create_if_block_3$4;
    		if (/*i*/ ctx[7] == 96) return create_if_block_4$4;
    		if (/*i*/ ctx[7] == 128) return create_if_block_5$3;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	qualifierplayer = new QualifierPlayer({
    			props: {
    				position: /*i*/ ctx[7] + 1,
    				player: /*player*/ ctx[5],
    				maps: /*$regularMapRanking*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (if_block) if_block.c();
    			t = space();
    			create_component(qualifierplayer.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(qualifierplayer, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (current_block_type !== (current_block_type = select_block_type_1(ctx))) {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(t.parentNode, t);
    				}
    			}

    			const qualifierplayer_changes = {};
    			if (dirty & /*$regularPlayerRanking*/ 1) qualifierplayer_changes.position = /*i*/ ctx[7] + 1;
    			if (dirty & /*$regularPlayerRanking*/ 1) qualifierplayer_changes.player = /*player*/ ctx[5];
    			if (dirty & /*$regularMapRanking*/ 4) qualifierplayer_changes.maps = /*$regularMapRanking*/ ctx[2];
    			qualifierplayer.$set(qualifierplayer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(qualifierplayer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(qualifierplayer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);

    			if (if_block) {
    				if_block.d(detaching);
    			}

    			if (detaching) detach_dev(t);
    			destroy_component(qualifierplayer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$b.name,
    		type: "each",
    		source: "(25:2) {#each $regularPlayerRanking as player, i (player.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let div;
    	let a0;
    	let t1;
    	let a1;
    	let t3;
    	let a2;
    	let t5;
    	let t6;
    	let current_block_type_index;
    	let if_block1;
    	let if_block1_anchor;
    	let current;
    	let if_block0 = /*$myQualifier*/ ctx[1] && create_if_block_6$3(ctx);
    	const if_block_creators = [create_if_block$c, create_else_block$b];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*$regularPlayerRanking*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			a0 = element("a");
    			a0.textContent = "Rankings per map";
    			t1 = space();
    			a1 = element("a");
    			a1.textContent = "Qualifier lobbies";
    			t3 = space();
    			a2 = element("a");
    			a2.textContent = "Elite players";
    			t5 = space();
    			if (if_block0) if_block0.c();
    			t6 = space();
    			if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(a0, "href", "#/qualifiers!maps");
    			add_location(a0, file$d, 10, 2, 483);
    			attr_dev(a1, "href", "#/qualifiers!lobbies");
    			add_location(a1, file$d, 11, 2, 535);
    			attr_dev(a2, "href", "#/qualifiers!elite");
    			add_location(a2, file$d, 12, 2, 591);
    			attr_dev(div, "class", "links svelte-buidrs");
    			add_location(div, file$d, 9, 0, 460);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a0);
    			append_dev(div, t1);
    			append_dev(div, a1);
    			append_dev(div, t3);
    			append_dev(div, a2);
    			insert_dev(target, t5, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t6, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$myQualifier*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*$myQualifier*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_6$3(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t6.parentNode, t6);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t5);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t6);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let $regularPlayerRanking;
    	let $players;
    	let $myQualifier;
    	let $me;
    	let $regularMapRanking;
    	validate_store(regularPlayerRanking, "regularPlayerRanking");
    	component_subscribe($$self, regularPlayerRanking, $$value => $$invalidate(0, $regularPlayerRanking = $$value));
    	validate_store(players, "players");
    	component_subscribe($$self, players, $$value => $$invalidate(3, $players = $$value));
    	validate_store(myQualifier, "myQualifier");
    	component_subscribe($$self, myQualifier, $$value => $$invalidate(1, $myQualifier = $$value));
    	validate_store(me, "me");
    	component_subscribe($$self, me, $$value => $$invalidate(4, $me = $$value));
    	validate_store(regularMapRanking, "regularMapRanking");
    	component_subscribe($$self, regularMapRanking, $$value => $$invalidate(2, $regularMapRanking = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Players", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Players> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		QualifierPlayer,
    		me,
    		players,
    		regularMapRanking,
    		regularPlayerRanking,
    		myQualifier,
    		init: init$5,
    		initMyQualifier,
    		$regularPlayerRanking,
    		$players,
    		$myQualifier,
    		$me,
    		$regularMapRanking
    	});

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$regularPlayerRanking, $players*/ 9) {
    			if (!$regularPlayerRanking && $players) init$5($players);
    		}

    		if ($$self.$$.dirty & /*$myQualifier, $regularPlayerRanking, $me*/ 19) {
    			if (!$myQualifier && $regularPlayerRanking && $me) initMyQualifier($regularPlayerRanking, $me);
    		}
    	};

    	return [$regularPlayerRanking, $myQualifier, $regularMapRanking, $players, $me];
    }

    class Players extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$7(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Players",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src\pages\qualifiers\EliteMaps.svelte generated by Svelte v3.35.0 */

    const { Map: Map_1$4, Object: Object_1$2 } = globals;

    const file$c = "src\\pages\\qualifiers\\EliteMaps.svelte";

    function get_each_context$a(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (22:0) {:else}
    function create_else_block$a(ctx) {
    	let p;
    	let each_blocks = [];
    	let each_1_lookup = new Map_1$4();
    	let current;
    	let each_value = /*$eliteMapRanking*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*map*/ ctx[8].id;
    	validate_each_keys(ctx, each_value, get_each_context$a, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$a(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$a(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			p = element("p");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(p, "class", "maps svelte-1pnvguw");
    			add_location(p, file$c, 22, 2, 919);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(p, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Array, $eliteMapRanking, hiddenMaps, toggleHidden, $myQualifier*/ 15) {
    				each_value = /*$eliteMapRanking*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$a, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, p, outro_and_destroy_block, create_each_block$a, null, get_each_context$a);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$a.name,
    		type: "else",
    		source: "(22:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (20:0) {#if !$eliteMapRanking}
    function create_if_block$b(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading qualifier scores...";
    			attr_dev(p, "class", "lobbies");
    			add_location(p, file$c, 20, 2, 856);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$b.name,
    		type: "if",
    		source: "(20:0) {#if !$eliteMapRanking}",
    		ctx
    	});

    	return block;
    }

    // (26:4) {#if $myQualifier}
    function create_if_block_2$7(ctx) {
    	let div;
    	let scorerow;
    	let current;

    	scorerow = new ScoreRow({
    			props: {
    				player: /*$myQualifier*/ ctx[1],
    				score: /*$myQualifier*/ ctx[1].mapScores.get(/*map*/ ctx[8].id)[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(scorerow.$$.fragment);
    			attr_dev(div, "class", "my-qualifier svelte-1pnvguw");
    			add_location(div, file$c, 26, 6, 1030);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(scorerow, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const scorerow_changes = {};
    			if (dirty & /*$myQualifier*/ 2) scorerow_changes.player = /*$myQualifier*/ ctx[1];
    			if (dirty & /*$myQualifier, $eliteMapRanking*/ 3) scorerow_changes.score = /*$myQualifier*/ ctx[1].mapScores.get(/*map*/ ctx[8].id)[0];
    			scorerow.$set(scorerow_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(scorerow.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(scorerow.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(scorerow);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$7.name,
    		type: "if",
    		source: "(26:4) {#if $myQualifier}",
    		ctx
    	});

    	return block;
    }

    // (34:4) {#if !hiddenMaps[map.id]}
    function create_if_block_1$a(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map_1$4();
    	let each_1_anchor;
    	let current;
    	let each_value_1 = Array.from(/*map*/ ctx[8].players.values());
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*player*/ ctx[11].id;
    	validate_each_keys(ctx, each_value_1, get_each_context_1$5, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$5(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1$5(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Array, $eliteMapRanking*/ 1) {
    				each_value_1 = Array.from(/*map*/ ctx[8].players.values());
    				validate_each_argument(each_value_1);
    				group_outros();
    				validate_each_keys(ctx, each_value_1, get_each_context_1$5, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block_1$5, each_1_anchor, get_each_context_1$5);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$a.name,
    		type: "if",
    		source: "(34:4) {#if !hiddenMaps[map.id]}",
    		ctx
    	});

    	return block;
    }

    // (35:6) {#each Array.from(map.players.values()) as player (player.id)}
    function create_each_block_1$5(key_1, ctx) {
    	let first;
    	let scorerow;
    	let current;

    	scorerow = new ScoreRow({
    			props: {
    				player: /*player*/ ctx[11],
    				score: /*player*/ ctx[11].mapScores.get(/*map*/ ctx[8].id)[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(scorerow.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(scorerow, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const scorerow_changes = {};
    			if (dirty & /*$eliteMapRanking*/ 1) scorerow_changes.player = /*player*/ ctx[11];
    			if (dirty & /*$eliteMapRanking*/ 1) scorerow_changes.score = /*player*/ ctx[11].mapScores.get(/*map*/ ctx[8].id)[0];
    			scorerow.$set(scorerow_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(scorerow.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(scorerow.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(scorerow, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$5.name,
    		type: "each",
    		source: "(35:6) {#each Array.from(map.players.values()) as player (player.id)}",
    		ctx
    	});

    	return block;
    }

    // (24:2) {#each $eliteMapRanking as map (map.id)}
    function create_each_block$a(key_1, ctx) {
    	let first;
    	let map;
    	let t0;
    	let t1;
    	let a;

    	let t2_value = (/*hiddenMaps*/ ctx[2][/*map*/ ctx[8].id]
    	? "Show"
    	: "Hide") + "";

    	let t2;
    	let t3;
    	let t4;
    	let if_block1_anchor;
    	let current;
    	let mounted;
    	let dispose;

    	map = new Map$1({
    			props: { map: /*map*/ ctx[8] },
    			$$inline: true
    		});

    	let if_block0 = /*$myQualifier*/ ctx[1] && create_if_block_2$7(ctx);

    	function click_handler() {
    		return /*click_handler*/ ctx[7](/*map*/ ctx[8]);
    	}

    	let if_block1 = !/*hiddenMaps*/ ctx[2][/*map*/ ctx[8].id] && create_if_block_1$a(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(map.$$.fragment);
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			a = element("a");
    			t2 = text(t2_value);
    			t3 = text(" scores");
    			t4 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(a, "href", "javascript:void(0)");
    			add_location(a, file$c, 30, 4, 1177);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(map, target, anchor);
    			insert_dev(target, t0, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, a, anchor);
    			append_dev(a, t2);
    			append_dev(a, t3);
    			insert_dev(target, t4, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const map_changes = {};
    			if (dirty & /*$eliteMapRanking*/ 1) map_changes.map = /*map*/ ctx[8];
    			map.$set(map_changes);

    			if (/*$myQualifier*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*$myQualifier*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2$7(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t1.parentNode, t1);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if ((!current || dirty & /*hiddenMaps, $eliteMapRanking*/ 5) && t2_value !== (t2_value = (/*hiddenMaps*/ ctx[2][/*map*/ ctx[8].id]
    			? "Show"
    			: "Hide") + "")) set_data_dev(t2, t2_value);

    			if (!/*hiddenMaps*/ ctx[2][/*map*/ ctx[8].id]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*hiddenMaps, $eliteMapRanking*/ 5) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1$a(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(map, detaching);
    			if (detaching) detach_dev(t0);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(t4);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$a.name,
    		type: "each",
    		source: "(24:2) {#each $eliteMapRanking as map (map.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let div;
    	let a0;
    	let t1;
    	let a1;
    	let t3;
    	let a2;
    	let t5;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$b, create_else_block$a];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*$eliteMapRanking*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			a0 = element("a");
    			a0.textContent = "Player rankings";
    			t1 = space();
    			a1 = element("a");
    			a1.textContent = "Qualifier lobbies";
    			t3 = space();
    			a2 = element("a");
    			a2.textContent = "Regular players";
    			t5 = space();
    			if_block.c();
    			if_block_anchor = empty();
    			attr_dev(a0, "href", "#/qualifiers");
    			add_location(a0, file$c, 15, 2, 670);
    			attr_dev(a1, "href", "#/qualifiers!lobbies");
    			add_location(a1, file$c, 16, 2, 716);
    			attr_dev(a2, "href", "#/qualifiers!maps");
    			add_location(a2, file$c, 17, 2, 772);
    			attr_dev(div, "class", "links svelte-1pnvguw");
    			add_location(div, file$c, 14, 0, 647);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a0);
    			append_dev(div, t1);
    			append_dev(div, a1);
    			append_dev(div, t3);
    			append_dev(div, a2);
    			insert_dev(target, t5, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t5);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let $eliteMapRanking;
    	let $players;
    	let $myQualifier;
    	let $elitePlayerRanking;
    	let $me;
    	validate_store(eliteMapRanking, "eliteMapRanking");
    	component_subscribe($$self, eliteMapRanking, $$value => $$invalidate(0, $eliteMapRanking = $$value));
    	validate_store(players, "players");
    	component_subscribe($$self, players, $$value => $$invalidate(4, $players = $$value));
    	validate_store(myQualifier, "myQualifier");
    	component_subscribe($$self, myQualifier, $$value => $$invalidate(1, $myQualifier = $$value));
    	validate_store(elitePlayerRanking, "elitePlayerRanking");
    	component_subscribe($$self, elitePlayerRanking, $$value => $$invalidate(5, $elitePlayerRanking = $$value));
    	validate_store(me, "me");
    	component_subscribe($$self, me, $$value => $$invalidate(6, $me = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("EliteMaps", slots, []);
    	let hiddenMaps = {};

    	const toggleHidden = map => {
    		$$invalidate(2, hiddenMaps = Object.assign(Object.assign({}, hiddenMaps), { [map.id]: !hiddenMaps[map.id] }));
    	};

    	const writable_props = [];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<EliteMaps> was created with unknown prop '${key}'`);
    	});

    	const click_handler = map => toggleHidden(map);

    	$$self.$capture_state = () => ({
    		Map: Map$1,
    		ScoreRow,
    		me,
    		players,
    		eliteMapRanking,
    		elitePlayerRanking,
    		myQualifier,
    		init: init$5,
    		initMyQualifier,
    		hiddenMaps,
    		toggleHidden,
    		$eliteMapRanking,
    		$players,
    		$myQualifier,
    		$elitePlayerRanking,
    		$me
    	});

    	$$self.$inject_state = $$props => {
    		if ("hiddenMaps" in $$props) $$invalidate(2, hiddenMaps = $$props.hiddenMaps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$eliteMapRanking, $players*/ 17) {
    			if (!$eliteMapRanking && $players) init$5($players);
    		}

    		if ($$self.$$.dirty & /*$myQualifier, $elitePlayerRanking, $me*/ 98) {
    			if (!$myQualifier && $elitePlayerRanking && $me) initMyQualifier($elitePlayerRanking, $me);
    		}
    	};

    	return [
    		$eliteMapRanking,
    		$myQualifier,
    		hiddenMaps,
    		toggleHidden,
    		$players,
    		$elitePlayerRanking,
    		$me,
    		click_handler
    	];
    }

    class EliteMaps extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$7(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EliteMaps",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src\pages\qualifiers\ElitePlayers.svelte generated by Svelte v3.35.0 */

    const file$b = "src\\pages\\qualifiers\\ElitePlayers.svelte";

    function get_each_context$9(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (15:0) {#if $myQualifier}
    function create_if_block_1$9(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let qualifierplayer;
    	let current;

    	qualifierplayer = new QualifierPlayer({
    			props: {
    				position: /*$myQualifier*/ ctx[1].position,
    				player: /*$myQualifier*/ ctx[1],
    				maps: /*$eliteMapRanking*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Your placement";
    			t1 = space();
    			create_component(qualifierplayer.$$.fragment);
    			add_location(h1, file$b, 16, 2, 683);
    			attr_dev(div, "class", "my-qualifier svelte-buidrs");
    			add_location(div, file$b, 15, 0, 653);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			mount_component(qualifierplayer, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const qualifierplayer_changes = {};
    			if (dirty & /*$myQualifier*/ 2) qualifierplayer_changes.position = /*$myQualifier*/ ctx[1].position;
    			if (dirty & /*$myQualifier*/ 2) qualifierplayer_changes.player = /*$myQualifier*/ ctx[1];
    			if (dirty & /*$eliteMapRanking*/ 4) qualifierplayer_changes.maps = /*$eliteMapRanking*/ ctx[2];
    			qualifierplayer.$set(qualifierplayer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(qualifierplayer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(qualifierplayer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(qualifierplayer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$9.name,
    		type: "if",
    		source: "(15:0) {#if $myQualifier}",
    		ctx
    	});

    	return block;
    }

    // (23:0) {:else}
    function create_else_block$9(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*$elitePlayerRanking*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*player*/ ctx[5].id;
    	validate_each_keys(ctx, each_value, get_each_context$9, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$9(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$9(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Elite players";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h1, file$b, 24, 4, 945);
    			attr_dev(div, "class", "players svelte-buidrs");
    			add_location(div, file$b, 23, 2, 918);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$elitePlayerRanking, $eliteMapRanking*/ 5) {
    				each_value = /*$elitePlayerRanking*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$9, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block$9, null, get_each_context$9);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$9.name,
    		type: "else",
    		source: "(23:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (21:0) {#if !$elitePlayerRanking}
    function create_if_block$a(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading qualifier scores...";
    			attr_dev(p, "class", "lobbies");
    			add_location(p, file$b, 21, 2, 855);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$a.name,
    		type: "if",
    		source: "(21:0) {#if !$elitePlayerRanking}",
    		ctx
    	});

    	return block;
    }

    // (26:2) {#each $elitePlayerRanking as player, i (player.id)}
    function create_each_block$9(key_1, ctx) {
    	let first;
    	let qualifierplayer;
    	let current;

    	qualifierplayer = new QualifierPlayer({
    			props: {
    				position: /*i*/ ctx[7] + 1,
    				player: /*player*/ ctx[5],
    				maps: /*$eliteMapRanking*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(qualifierplayer.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(qualifierplayer, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const qualifierplayer_changes = {};
    			if (dirty & /*$elitePlayerRanking*/ 1) qualifierplayer_changes.position = /*i*/ ctx[7] + 1;
    			if (dirty & /*$elitePlayerRanking*/ 1) qualifierplayer_changes.player = /*player*/ ctx[5];
    			if (dirty & /*$eliteMapRanking*/ 4) qualifierplayer_changes.maps = /*$eliteMapRanking*/ ctx[2];
    			qualifierplayer.$set(qualifierplayer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(qualifierplayer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(qualifierplayer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(qualifierplayer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$9.name,
    		type: "each",
    		source: "(26:2) {#each $elitePlayerRanking as player, i (player.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div;
    	let a0;
    	let t1;
    	let a1;
    	let t3;
    	let a2;
    	let t5;
    	let t6;
    	let current_block_type_index;
    	let if_block1;
    	let if_block1_anchor;
    	let current;
    	let if_block0 = /*$myQualifier*/ ctx[1] && create_if_block_1$9(ctx);
    	const if_block_creators = [create_if_block$a, create_else_block$9];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*$elitePlayerRanking*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			a0 = element("a");
    			a0.textContent = "Rankings per map";
    			t1 = space();
    			a1 = element("a");
    			a1.textContent = "Qualifier lobbies";
    			t3 = space();
    			a2 = element("a");
    			a2.textContent = "Regular players";
    			t5 = space();
    			if (if_block0) if_block0.c();
    			t6 = space();
    			if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(a0, "href", "#/qualifiers!maps");
    			add_location(a0, file$b, 10, 2, 473);
    			attr_dev(a1, "href", "#/qualifiers!lobbies");
    			add_location(a1, file$b, 11, 2, 525);
    			attr_dev(a2, "href", "#/qualifiers");
    			add_location(a2, file$b, 12, 2, 581);
    			attr_dev(div, "class", "links svelte-buidrs");
    			add_location(div, file$b, 9, 0, 450);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a0);
    			append_dev(div, t1);
    			append_dev(div, a1);
    			append_dev(div, t3);
    			append_dev(div, a2);
    			insert_dev(target, t5, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t6, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$myQualifier*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*$myQualifier*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1$9(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t6.parentNode, t6);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t5);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t6);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let $elitePlayerRanking;
    	let $players;
    	let $myQualifier;
    	let $me;
    	let $eliteMapRanking;
    	validate_store(elitePlayerRanking, "elitePlayerRanking");
    	component_subscribe($$self, elitePlayerRanking, $$value => $$invalidate(0, $elitePlayerRanking = $$value));
    	validate_store(players, "players");
    	component_subscribe($$self, players, $$value => $$invalidate(3, $players = $$value));
    	validate_store(myQualifier, "myQualifier");
    	component_subscribe($$self, myQualifier, $$value => $$invalidate(1, $myQualifier = $$value));
    	validate_store(me, "me");
    	component_subscribe($$self, me, $$value => $$invalidate(4, $me = $$value));
    	validate_store(eliteMapRanking, "eliteMapRanking");
    	component_subscribe($$self, eliteMapRanking, $$value => $$invalidate(2, $eliteMapRanking = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ElitePlayers", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ElitePlayers> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		QualifierPlayer,
    		me,
    		players,
    		eliteMapRanking,
    		elitePlayerRanking,
    		myQualifier,
    		init: init$5,
    		initMyQualifier,
    		$elitePlayerRanking,
    		$players,
    		$myQualifier,
    		$me,
    		$eliteMapRanking
    	});

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$elitePlayerRanking, $players*/ 9) {
    			if (!$elitePlayerRanking && $players) init$5($players);
    		}

    		if ($$self.$$.dirty & /*$myQualifier, $elitePlayerRanking, $me*/ 19) {
    			if (!$myQualifier && $elitePlayerRanking && $me) initMyQualifier($elitePlayerRanking, $me);
    		}
    	};

    	return [$elitePlayerRanking, $myQualifier, $eliteMapRanking, $players, $me];
    }

    class ElitePlayers extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$7(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ElitePlayers",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src\components\molecules\GroupsMatch.svelte generated by Svelte v3.35.0 */
    const file$a = "src\\components\\molecules\\GroupsMatch.svelte";

    function get_each_context$8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i].commentator;
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (14:4) {:else}
    function create_else_block_1$5(ctx) {
    	let t0;
    	let t1_value = /*topPlayer*/ ctx[3].group.id + "";
    	let t1;
    	let t2;
    	let t3_value = /*match*/ ctx[0].id + "";
    	let t3;

    	const block = {
    		c: function create() {
    			t0 = text("G");
    			t1 = text(t1_value);
    			t2 = text("-");
    			t3 = text(t3_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, t3, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*match*/ 1 && t3_value !== (t3_value = /*match*/ ctx[0].id + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(t3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$5.name,
    		type: "else",
    		source: "(14:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (10:4) {#if match.link}
    function create_if_block_4$3(ctx) {
    	let a;
    	let t0;
    	let t1_value = /*topPlayer*/ ctx[3].group.id + "";
    	let t1;
    	let t2;
    	let t3_value = /*match*/ ctx[0].id + "";
    	let t3;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t0 = text("G");
    			t1 = text(t1_value);
    			t2 = text("-");
    			t3 = text(t3_value);
    			attr_dev(a, "href", a_href_value = /*match*/ ctx[0].link);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noopener");
    			add_location(a, file$a, 10, 6, 356);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t0);
    			append_dev(a, t1);
    			append_dev(a, t2);
    			append_dev(a, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*match*/ 1 && t3_value !== (t3_value = /*match*/ ctx[0].id + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*match*/ 1 && a_href_value !== (a_href_value = /*match*/ ctx[0].link)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$3.name,
    		type: "if",
    		source: "(10:4) {#if match.link}",
    		ctx
    	});

    	return block;
    }

    // (27:6) {:else}
    function create_else_block$8(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("To be defined");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$8.name,
    		type: "else",
    		source: "(27:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (25:6) {#if match.referee}
    function create_if_block_3$3(ctx) {
    	let a;
    	let t_value = /*match*/ ctx[0].referee.username + "";
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = `https://osu.ppy.sh/users/${/*match*/ ctx[0].referee.id}`);
    			add_location(a, file$a, 25, 8, 844);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*match*/ 1 && t_value !== (t_value = /*match*/ ctx[0].referee.username + "")) set_data_dev(t, t_value);

    			if (dirty & /*match*/ 1 && a_href_value !== (a_href_value = `https://osu.ppy.sh/users/${/*match*/ ctx[0].referee.id}`)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$3.name,
    		type: "if",
    		source: "(25:6) {#if match.referee}",
    		ctx
    	});

    	return block;
    }

    // (30:6) {#if match.streamer}
    function create_if_block_2$6(ctx) {
    	let t0;
    	let b;
    	let t2;
    	let a;
    	let t3_value = /*match*/ ctx[0].streamer.username + "";
    	let t3;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			t0 = text("-\r\n        ");
    			b = element("b");
    			b.textContent = "Streamer";
    			t2 = text(":\r\n        ");
    			a = element("a");
    			t3 = text(t3_value);
    			add_location(b, file$a, 31, 8, 1029);
    			attr_dev(a, "href", a_href_value = `https://osu.ppy.sh/users/${/*match*/ ctx[0].streamer.id}`);
    			add_location(a, file$a, 32, 8, 1055);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, b, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, a, anchor);
    			append_dev(a, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*match*/ 1 && t3_value !== (t3_value = /*match*/ ctx[0].streamer.username + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*match*/ 1 && a_href_value !== (a_href_value = `https://osu.ppy.sh/users/${/*match*/ ctx[0].streamer.id}`)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(b);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$6.name,
    		type: "if",
    		source: "(30:6) {#if match.streamer}",
    		ctx
    	});

    	return block;
    }

    // (35:6) {#if match.commentators.length}
    function create_if_block$9(ctx) {
    	let t0;
    	let b;
    	let t2;
    	let each_1_anchor;
    	let each_value = /*match*/ ctx[0].commentators;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$8(get_each_context$8(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			t0 = text("-\r\n        ");
    			b = element("b");
    			b.textContent = "Commentators";
    			t2 = text(":\r\n        ");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			add_location(b, file$a, 36, 8, 1215);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, b, anchor);
    			insert_dev(target, t2, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*match*/ 1) {
    				each_value = /*match*/ ctx[0].commentators;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$8(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$8(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(b);
    			if (detaching) detach_dev(t2);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(35:6) {#if match.commentators.length}",
    		ctx
    	});

    	return block;
    }

    // (39:10) {#if i}
    function create_if_block_1$8(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(",");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$8.name,
    		type: "if",
    		source: "(39:10) {#if i}",
    		ctx
    	});

    	return block;
    }

    // (38:8) {#each match.commentators as { commentator }
    function create_each_block$8(ctx) {
    	let t0;
    	let a;
    	let t1_value = /*commentator*/ ctx[6].username + "";
    	let t1;
    	let a_href_value;
    	let if_block = /*i*/ ctx[8] && create_if_block_1$8(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			a = element("a");
    			t1 = text(t1_value);
    			attr_dev(a, "href", a_href_value = `https://osu.ppy.sh/users/${/*commentator*/ ctx[6].id}`);
    			add_location(a, file$a, 39, 10, 1331);
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, a, anchor);
    			append_dev(a, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*match*/ 1 && t1_value !== (t1_value = /*commentator*/ ctx[6].username + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*match*/ 1 && a_href_value !== (a_href_value = `https://osu.ppy.sh/users/${/*commentator*/ ctx[6].id}`)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$8.name,
    		type: "each",
    		source: "(38:8) {#each match.commentators as { commentator }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div10;
    	let div0;
    	let t0;
    	let div8;
    	let div2;
    	let b0;
    	let t1_value = /*time*/ ctx[1].toDateString() + "";
    	let t1;
    	let t2;
    	let t3_value = /*time*/ ctx[1].toTimeString().replace(":00 GMT", " UTC") + "";
    	let t3;
    	let t4;
    	let div1;
    	let t5_value = /*time*/ ctx[1].toUTCString().replace(":00 GMT", " UTC+0") + "";
    	let t5;
    	let t6;
    	let div3;
    	let b1;
    	let t8;
    	let t9;
    	let t10;
    	let t11;
    	let div7;
    	let div4;
    	let img0;
    	let img0_src_value;
    	let t12;
    	let a0;
    	let t13_value = /*topPlayer*/ ctx[3].username + "";
    	let t13;
    	let t14;
    	let t15_value = /*topPlayer*/ ctx[3].seed + "";
    	let t15;
    	let t16;
    	let t17;
    	let div5;
    	let t19;
    	let div6;
    	let img1;
    	let img1_src_value;
    	let t20;
    	let a1;
    	let t21_value = /*bottomPlayer*/ ctx[4].username + "";
    	let t21;
    	let t22;
    	let t23_value = /*bottomPlayer*/ ctx[4].seed + "";
    	let t23;
    	let t24;
    	let t25;
    	let div9;
    	let t26_value = (/*match*/ ctx[0].points1 || 0) + "";
    	let t26;
    	let t27;
    	let t28_value = (/*match*/ ctx[0].points2 || 0) + "";
    	let t28;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*match*/ ctx[0].link) return create_if_block_4$3;
    		return create_else_block_1$5;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*match*/ ctx[0].referee) return create_if_block_3$3;
    		return create_else_block$8;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);
    	let if_block2 = /*match*/ ctx[0].streamer && create_if_block_2$6(ctx);
    	let if_block3 = /*match*/ ctx[0].commentators.length && create_if_block$9(ctx);

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div0 = element("div");
    			if_block0.c();
    			t0 = space();
    			div8 = element("div");
    			div2 = element("div");
    			b0 = element("b");
    			t1 = text(t1_value);
    			t2 = space();
    			t3 = text(t3_value);
    			t4 = space();
    			div1 = element("div");
    			t5 = text(t5_value);
    			t6 = space();
    			div3 = element("div");
    			b1 = element("b");
    			b1.textContent = "Referee";
    			t8 = text(":\r\n      ");
    			if_block1.c();
    			t9 = space();
    			if (if_block2) if_block2.c();
    			t10 = space();
    			if (if_block3) if_block3.c();
    			t11 = space();
    			div7 = element("div");
    			div4 = element("div");
    			img0 = element("img");
    			t12 = space();
    			a0 = element("a");
    			t13 = text(t13_value);
    			t14 = text(" (#");
    			t15 = text(t15_value);
    			t16 = text(")");
    			t17 = space();
    			div5 = element("div");
    			div5.textContent = "vs.";
    			t19 = space();
    			div6 = element("div");
    			img1 = element("img");
    			t20 = space();
    			a1 = element("a");
    			t21 = text(t21_value);
    			t22 = text(" (#");
    			t23 = text(t23_value);
    			t24 = text(")");
    			t25 = space();
    			div9 = element("div");
    			t26 = text(t26_value);
    			t27 = text(" - ");
    			t28 = text(t28_value);
    			attr_dev(div0, "class", "name svelte-1tuxpxq");
    			add_location(div0, file$a, 8, 2, 308);
    			add_location(b0, file$a, 19, 6, 590);
    			attr_dev(div1, "class", "utc svelte-1tuxpxq");
    			add_location(div1, file$a, 20, 6, 675);
    			attr_dev(div2, "class", "time svelte-1tuxpxq");
    			add_location(div2, file$a, 18, 4, 564);
    			add_location(b1, file$a, 23, 6, 792);
    			attr_dev(div3, "class", "staff svelte-1tuxpxq");
    			add_location(div3, file$a, 22, 4, 765);
    			attr_dev(img0, "alt", "");
    			if (img0.src !== (img0_src_value = /*topPlayer*/ ctx[3].avatar)) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "class", "svelte-1tuxpxq");
    			add_location(img0, file$a, 45, 8, 1519);
    			attr_dev(a0, "href", `https://osu.ppy.sh/users/${/*topPlayer*/ ctx[3].id}`);
    			add_location(a0, file$a, 46, 8, 1566);
    			attr_dev(div4, "class", "player svelte-1tuxpxq");
    			add_location(div4, file$a, 44, 6, 1489);
    			attr_dev(div5, "class", "vs svelte-1tuxpxq");
    			add_location(div5, file$a, 48, 6, 1685);
    			attr_dev(img1, "alt", "");
    			if (img1.src !== (img1_src_value = /*bottomPlayer*/ ctx[4].avatar)) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "class", "svelte-1tuxpxq");
    			add_location(img1, file$a, 50, 8, 1748);
    			attr_dev(a1, "href", `https://osu.ppy.sh/users/${/*bottomPlayer*/ ctx[4].id}`);
    			add_location(a1, file$a, 51, 8, 1798);
    			attr_dev(div6, "class", "player svelte-1tuxpxq");
    			add_location(div6, file$a, 49, 6, 1718);
    			attr_dev(div7, "class", "players svelte-1tuxpxq");
    			add_location(div7, file$a, 43, 4, 1460);
    			attr_dev(div8, "class", "body svelte-1tuxpxq");
    			add_location(div8, file$a, 17, 2, 540);
    			attr_dev(div9, "class", "score svelte-1tuxpxq");
    			add_location(div9, file$a, 55, 2, 1944);
    			attr_dev(div10, "class", "match svelte-1tuxpxq");
    			toggle_class(div10, "my-match", /*$me*/ ctx[2]?.id == /*topPlayer*/ ctx[3].id || /*$me*/ ctx[2]?.id == /*bottomPlayer*/ ctx[4].id);
    			add_location(div10, file$a, 7, 0, 205);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div0);
    			if_block0.m(div0, null);
    			append_dev(div10, t0);
    			append_dev(div10, div8);
    			append_dev(div8, div2);
    			append_dev(div2, b0);
    			append_dev(b0, t1);
    			append_dev(b0, t2);
    			append_dev(b0, t3);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, t5);
    			append_dev(div8, t6);
    			append_dev(div8, div3);
    			append_dev(div3, b1);
    			append_dev(div3, t8);
    			if_block1.m(div3, null);
    			append_dev(div3, t9);
    			if (if_block2) if_block2.m(div3, null);
    			append_dev(div3, t10);
    			if (if_block3) if_block3.m(div3, null);
    			append_dev(div8, t11);
    			append_dev(div8, div7);
    			append_dev(div7, div4);
    			append_dev(div4, img0);
    			append_dev(div4, t12);
    			append_dev(div4, a0);
    			append_dev(a0, t13);
    			append_dev(a0, t14);
    			append_dev(a0, t15);
    			append_dev(a0, t16);
    			append_dev(div7, t17);
    			append_dev(div7, div5);
    			append_dev(div7, t19);
    			append_dev(div7, div6);
    			append_dev(div6, img1);
    			append_dev(div6, t20);
    			append_dev(div6, a1);
    			append_dev(a1, t21);
    			append_dev(a1, t22);
    			append_dev(a1, t23);
    			append_dev(a1, t24);
    			append_dev(div10, t25);
    			append_dev(div10, div9);
    			append_dev(div9, t26);
    			append_dev(div9, t27);
    			append_dev(div9, t28);

    			if (!mounted) {
    				dispose = listen_dev(div10, "click", /*click_handler*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			}

    			if (dirty & /*time*/ 2 && t1_value !== (t1_value = /*time*/ ctx[1].toDateString() + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*time*/ 2 && t3_value !== (t3_value = /*time*/ ctx[1].toTimeString().replace(":00 GMT", " UTC") + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*time*/ 2 && t5_value !== (t5_value = /*time*/ ctx[1].toUTCString().replace(":00 GMT", " UTC+0") + "")) set_data_dev(t5, t5_value);

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div3, t9);
    				}
    			}

    			if (/*match*/ ctx[0].streamer) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_2$6(ctx);
    					if_block2.c();
    					if_block2.m(div3, t10);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*match*/ ctx[0].commentators.length) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block$9(ctx);
    					if_block3.c();
    					if_block3.m(div3, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (dirty & /*match*/ 1 && t26_value !== (t26_value = (/*match*/ ctx[0].points1 || 0) + "")) set_data_dev(t26, t26_value);
    			if (dirty & /*match*/ 1 && t28_value !== (t28_value = (/*match*/ ctx[0].points2 || 0) + "")) set_data_dev(t28, t28_value);

    			if (dirty & /*$me, topPlayer, bottomPlayer*/ 28) {
    				toggle_class(div10, "my-match", /*$me*/ ctx[2]?.id == /*topPlayer*/ ctx[3].id || /*$me*/ ctx[2]?.id == /*bottomPlayer*/ ctx[4].id);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    			if_block0.d();
    			if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let time;
    	let $me;
    	validate_store(me, "me");
    	component_subscribe($$self, me, $$value => $$invalidate(2, $me = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("GroupsMatch", slots, []);
    	
    	let { match } = $$props;
    	const [topPlayer, bottomPlayer] = match.players.map(({ player }) => player);
    	const writable_props = ["match"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GroupsMatch> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("match" in $$props) $$invalidate(0, match = $$props.match);
    	};

    	$$self.$capture_state = () => ({
    		me,
    		match,
    		topPlayer,
    		bottomPlayer,
    		time,
    		$me
    	});

    	$$self.$inject_state = $$props => {
    		if ("match" in $$props) $$invalidate(0, match = $$props.match);
    		if ("time" in $$props) $$invalidate(1, time = $$props.time);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*match*/ 1) {
    			$$invalidate(1, time = new Date(match.time));
    		}
    	};

    	return [match, time, $me, topPlayer, bottomPlayer, click_handler];
    }

    class GroupsMatch extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$7(this, options, instance$a, create_fragment$a, safe_not_equal, { match: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GroupsMatch",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*match*/ ctx[0] === undefined && !("match" in props)) {
    			console.warn("<GroupsMatch> was created without expected prop 'match'");
    		}
    	}

    	get match() {
    		throw new Error("<GroupsMatch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set match(value) {
    		throw new Error("<GroupsMatch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var query$3 = `{
  maps(
    filter: {
      stage: {
        slug: {
          _eq: "groups"
        }
      }
    }
    sort: "order"
  ) {
    id
    artist
    name
    weight
    difficulty
    charter
    charter_id
    category
    bpm
    length
    od
    hp
    sr
    cover
  }
  matches(
    filter: {
      stage: {
        slug: {
          _eq: "groups"
        }
      }
    }
    sort: "time"
    limit: -1
  ) {
    id
    link
    players {
      player: players_id {
        id
        username
        avatar
        seed
        group {
          id
        }
      }
    }
    time
    referee {
      id
      username
    }
    streamer {
      id
      username
    }
    commentators {
      commentator: commentators_id {
        id
        username
      }
    }

    rolls {
      id
      player { id username }
      value
    }
    protects {
      id
      player { id username }
      map { id name category }
    }
    bans {
      id
      player { id username }
      map { id name category }
    }
    picks {
      id
      player { id username }
      map { id name category }
    }

    scores {
      id
      player { id }
      map { id }
      score
    }
    wbd {
      id
    }
  }
}`;

    const groupsMatches = writable(null);
    const groupsMaps = writable(null);
    const init$4 = async () => {
        const { data } = await api('/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: query$3 })
        });
        data.matches.forEach(match => {
            // Properly display seed order in matches
            match.players = match.players[0].player.seed < match.players[1].player.seed ? match.players : match.players.reverse();
            // Compute match scores
            if (match.wbd) {
                match.points1 = match.wbd.id == match.players[0].player.id ? 'WBD' : 0;
                match.points2 = match.wbd.id == match.players[1].player.id ? 'WBD' : 0;
            }
            else {
                match.points1 = 0;
                match.points2 = 0;
                match.picks.forEach(pick => {
                    var _a, _b;
                    let scores = match.scores.filter(s => s.map.id == pick.map.id) || [];
                    // If there's only one score for the pick, the other player most likely disconnected
                    if (scores.length == 1) {
                        scores.push(Object.assign(Object.assign({}, scores[0]), { player: match.players[((_a = scores[0]) === null || _a === void 0 ? void 0 : _a.player.id) == match.players[0].player.id ? 1 : 0].player, score: 0 }));
                    }
                    if (((_b = scores[0]) === null || _b === void 0 ? void 0 : _b.player.id) != match.players[0].player.id) {
                        scores = scores.reverse();
                    }
                    const [score1, score2] = scores;
                    if (score1 && score2) {
                        if (score1.score > score2.score) {
                            match.points1 += 1;
                        }
                        else {
                            match.points2 += 1;
                        }
                    }
                });
            }
        });
        groupsMatches.set(data.matches);
        groupsMaps.set(data.maps);
    };

    /* src\pages\groups\Matches.svelte generated by Svelte v3.35.0 */

    const { Map: Map_1$3 } = globals;
    const file$9 = "src\\pages\\groups\\Matches.svelte";

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	child_ctx[11] = i;
    	return child_ctx;
    }

    function get_each_context_1$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    function get_each_context_2$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (42:0) {#if $me?.player?.group}
    function create_if_block_2$5(ctx) {
    	let div0;
    	let t0;
    	let br0;
    	let br1;
    	let t1;
    	let b;
    	let t2;
    	let t3_value = /*$me*/ ctx[0].player.group.id + "";
    	let t3;
    	let t4;
    	let br2;
    	let t5;
    	let t6;
    	let div1;
    	let each_blocks = [];
    	let each_1_lookup = new Map_1$3();
    	let current;
    	let each_value_2 = /*myMatches*/ ctx[3];
    	validate_each_argument(each_value_2);
    	const get_key = ctx => /*match*/ ctx[9].id;
    	validate_each_keys(ctx, each_value_2, get_each_context_2$3, get_key);

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		let child_ctx = get_each_context_2$3(ctx, each_value_2, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_2$3(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text("Welcome to the Group Stage!");
    			br0 = element("br");
    			br1 = element("br");
    			t1 = text("\r\n  You will be facing every other player of your group once (");
    			b = element("b");
    			t2 = text("Group ");
    			t3 = text(t3_value);
    			t4 = text(")!");
    			br2 = element("br");
    			t5 = text("\r\n  You can find the list of your own matches just below.");
    			t6 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(br0, file$9, 43, 29, 1732);
    			add_location(br1, file$9, 43, 35, 1738);
    			add_location(b, file$9, 44, 60, 1806);
    			add_location(br2, file$9, 44, 96, 1842);
    			attr_dev(div0, "class", "intro svelte-14l0ba5");
    			add_location(div0, file$9, 42, 0, 1682);
    			attr_dev(div1, "class", "matches svelte-14l0ba5");
    			add_location(div1, file$9, 47, 0, 1915);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			append_dev(div0, br0);
    			append_dev(div0, br1);
    			append_dev(div0, t1);
    			append_dev(div0, b);
    			append_dev(b, t2);
    			append_dev(b, t3);
    			append_dev(div0, t4);
    			append_dev(div0, br2);
    			append_dev(div0, t5);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*$me*/ 1) && t3_value !== (t3_value = /*$me*/ ctx[0].player.group.id + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*myMatches*/ 8) {
    				each_value_2 = /*myMatches*/ ctx[3];
    				validate_each_argument(each_value_2);
    				group_outros();
    				validate_each_keys(ctx, each_value_2, get_each_context_2$3, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_2, each_1_lookup, div1, outro_and_destroy_block, create_each_block_2$3, null, get_each_context_2$3);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$5.name,
    		type: "if",
    		source: "(42:0) {#if $me?.player?.group}",
    		ctx
    	});

    	return block;
    }

    // (49:0) {#each myMatches as match (match.id)}
    function create_each_block_2$3(key_1, ctx) {
    	let first;
    	let groupsmatch;
    	let current;

    	groupsmatch = new GroupsMatch({
    			props: { match: /*match*/ ctx[9] },
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(groupsmatch.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(groupsmatch, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const groupsmatch_changes = {};
    			if (dirty & /*myMatches*/ 8) groupsmatch_changes.match = /*match*/ ctx[9];
    			groupsmatch.$set(groupsmatch_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(groupsmatch.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(groupsmatch.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(groupsmatch, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$3.name,
    		type: "each",
    		source: "(49:0) {#each myMatches as match (match.id)}",
    		ctx
    	});

    	return block;
    }

    // (56:0) {:else}
    function create_else_block$7(ctx) {
    	let div0;
    	let each_blocks_1 = [];
    	let each0_lookup = new Map_1$3();
    	let t0;
    	let div2;
    	let div1;
    	let a0;
    	let t2;
    	let a1;
    	let t4;
    	let each_blocks = [];
    	let each1_lookup = new Map_1$3();
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*$groupsMaps*/ ctx[4];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*map*/ ctx[12].id;
    	validate_each_keys(ctx, each_value_1, get_each_context_1$4, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$4(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each0_lookup.set(key, each_blocks_1[i] = create_each_block_1$4(key, child_ctx));
    	}

    	let each_value = /*displayMatches*/ ctx[2];
    	validate_each_argument(each_value);
    	const get_key_1 = ctx => /*match*/ ctx[9].id;
    	validate_each_keys(ctx, each_value, get_each_context$7, get_key_1);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$7(ctx, each_value, i);
    		let key = get_key_1(child_ctx);
    		each1_lookup.set(key, each_blocks[i] = create_each_block$7(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			a0 = element("a");
    			a0.textContent = "Sort chronologically";
    			t2 = space();
    			a1 = element("a");
    			a1.textContent = "Sort by group";
    			t4 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "maps svelte-14l0ba5");
    			add_location(div0, file$9, 56, 2, 2118);
    			attr_dev(a0, "href", "javascript:void(0)");
    			add_location(a0, file$9, 63, 6, 2281);
    			attr_dev(a1, "href", "javascript:void(0)");
    			add_location(a1, file$9, 64, 6, 2364);
    			attr_dev(div1, "class", "matches-links svelte-14l0ba5");
    			add_location(div1, file$9, 62, 4, 2246);
    			attr_dev(div2, "class", "matches svelte-14l0ba5");
    			add_location(div2, file$9, 61, 2, 2219);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			insert_dev(target, t0, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, a0);
    			append_dev(div1, t2);
    			append_dev(div1, a1);
    			append_dev(div2, t4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(a0, "click", /*sortByTime*/ ctx[6], false, false, false),
    					listen_dev(a1, "click", /*sortByGroup*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$groupsMaps*/ 16) {
    				each_value_1 = /*$groupsMaps*/ ctx[4];
    				validate_each_argument(each_value_1);
    				group_outros();
    				validate_each_keys(ctx, each_value_1, get_each_context_1$4, get_key);
    				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key, 1, ctx, each_value_1, each0_lookup, div0, outro_and_destroy_block, create_each_block_1$4, null, get_each_context_1$4);
    				check_outros();
    			}

    			if (dirty & /*sortedByGroup, displayMatches*/ 6) {
    				each_value = /*displayMatches*/ ctx[2];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$7, get_key_1);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key_1, 1, ctx, each_value, each1_lookup, div2, outro_and_destroy_block, create_each_block$7, null, get_each_context$7);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].d();
    			}

    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$7.name,
    		type: "else",
    		source: "(56:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (54:0) {#if !displayMatches}
    function create_if_block$8(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Loading groups matches...";
    			attr_dev(div, "class", "matches svelte-14l0ba5");
    			add_location(div, file$9, 54, 2, 2053);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(54:0) {#if !displayMatches}",
    		ctx
    	});

    	return block;
    }

    // (58:2) {#each $groupsMaps as map (map.id)}
    function create_each_block_1$4(key_1, ctx) {
    	let first;
    	let map;
    	let current;

    	map = new Map$1({
    			props: { map: /*map*/ ctx[12] },
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(map.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(map, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const map_changes = {};
    			if (dirty & /*$groupsMaps*/ 16) map_changes.map = /*map*/ ctx[12];
    			map.$set(map_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(map, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$4.name,
    		type: "each",
    		source: "(58:2) {#each $groupsMaps as map (map.id)}",
    		ctx
    	});

    	return block;
    }

    // (69:6) {#if sortedByGroup && displayMatches[i+1]?.players[0].player.group.id > match.players[0].player.group.id}
    function create_if_block_1$7(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "group-spacer svelte-14l0ba5");
    			add_location(div, file$9, 69, 8, 2650);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$7.name,
    		type: "if",
    		source: "(69:6) {#if sortedByGroup && displayMatches[i+1]?.players[0].player.group.id > match.players[0].player.group.id}",
    		ctx
    	});

    	return block;
    }

    // (67:4) {#each displayMatches as match, i (match.id)}
    function create_each_block$7(key_1, ctx) {
    	let first;
    	let groupsmatch;
    	let t;
    	let if_block_anchor;
    	let current;

    	groupsmatch = new GroupsMatch({
    			props: { match: /*match*/ ctx[9] },
    			$$inline: true
    		});

    	let if_block = /*sortedByGroup*/ ctx[1] && /*displayMatches*/ ctx[2][/*i*/ ctx[11] + 1]?.players[0].player.group.id > /*match*/ ctx[9].players[0].player.group.id && create_if_block_1$7(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(groupsmatch.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(groupsmatch, target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const groupsmatch_changes = {};
    			if (dirty & /*displayMatches*/ 4) groupsmatch_changes.match = /*match*/ ctx[9];
    			groupsmatch.$set(groupsmatch_changes);

    			if (/*sortedByGroup*/ ctx[1] && /*displayMatches*/ ctx[2][/*i*/ ctx[11] + 1]?.players[0].player.group.id > /*match*/ ctx[9].players[0].player.group.id) {
    				if (if_block) ; else {
    					if_block = create_if_block_1$7(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(groupsmatch.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(groupsmatch.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(groupsmatch, detaching);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$7.name,
    		type: "each",
    		source: "(67:4) {#each displayMatches as match, i (match.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div;
    	let a0;
    	let t1;
    	let a1;
    	let t3;
    	let a2;
    	let t5;
    	let t6;
    	let current_block_type_index;
    	let if_block1;
    	let if_block1_anchor;
    	let current;
    	let if_block0 = /*$me*/ ctx[0]?.player?.group && create_if_block_2$5(ctx);
    	const if_block_creators = [create_if_block$8, create_else_block$7];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*displayMatches*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			a0 = element("a");
    			a0.textContent = "Rankings per map";
    			t1 = space();
    			a1 = element("a");
    			a1.textContent = "Groups results";
    			t3 = space();
    			a2 = element("a");
    			a2.textContent = "Roll leaderboard";
    			t5 = space();
    			if (if_block0) if_block0.c();
    			t6 = space();
    			if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(a0, "href", "#/groups!maps");
    			add_location(a0, file$9, 36, 2, 1502);
    			attr_dev(a1, "href", "#/groups!results");
    			add_location(a1, file$9, 37, 2, 1550);
    			attr_dev(a2, "href", "#/groups!rolls");
    			add_location(a2, file$9, 38, 2, 1599);
    			attr_dev(div, "class", "links svelte-14l0ba5");
    			add_location(div, file$9, 35, 0, 1479);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a0);
    			append_dev(div, t1);
    			append_dev(div, a1);
    			append_dev(div, t3);
    			append_dev(div, a2);
    			insert_dev(target, t5, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t6, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$me*/ ctx[0]?.player?.group) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*$me*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2$5(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t6.parentNode, t6);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t5);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t6);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $groupsMatches;
    	let $me;
    	let $groupsMaps;
    	validate_store(groupsMatches, "groupsMatches");
    	component_subscribe($$self, groupsMatches, $$value => $$invalidate(8, $groupsMatches = $$value));
    	validate_store(me, "me");
    	component_subscribe($$self, me, $$value => $$invalidate(0, $me = $$value));
    	validate_store(groupsMaps, "groupsMaps");
    	component_subscribe($$self, groupsMaps, $$value => $$invalidate(4, $groupsMaps = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Matches", slots, []);
    	var _a;
    	
    	if (!$groupsMatches) init$4();
    	let sortedByGroup = false;

    	const sortByGroup = () => {
    		$$invalidate(1, sortedByGroup = true);

    		$$invalidate(2, displayMatches = displayMatches.sort((a, b) => {
    			if (a.players[0].player.group.id != b.players[0].player.group.id) {
    				return a.players[0].player.group.id < b.players[0].player.group.id
    				? -1
    				: 1;
    			}

    			const [topPlayerA, bottomPlayerA] = a.players.map(({ player }) => player);
    			const [topPlayerB, bottomPlayerB] = b.players.map(({ player }) => player);

    			if (topPlayerA.seed != topPlayerB.seed) {
    				return topPlayerA.seed < topPlayerB.seed ? -1 : 1;
    			}

    			return bottomPlayerA.seed < bottomPlayerB.seed ? -1 : 1;
    		}));
    	};

    	const sortByTime = () => {
    		$$invalidate(1, sortedByGroup = false);
    		$$invalidate(2, displayMatches = displayMatches.sort((a, b) => a.time < b.time ? -1 : 1));
    	};

    	let displayMatches;
    	let myMatches;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Matches> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		_a,
    		GroupsMatch,
    		Map: Map$1,
    		me,
    		groupsMatches,
    		groupsMaps,
    		init: init$4,
    		sortedByGroup,
    		sortByGroup,
    		sortByTime,
    		displayMatches,
    		myMatches,
    		$groupsMatches,
    		$me,
    		$groupsMaps
    	});

    	$$self.$inject_state = $$props => {
    		if ("_a" in $$props) $$invalidate(7, _a = $$props._a);
    		if ("sortedByGroup" in $$props) $$invalidate(1, sortedByGroup = $$props.sortedByGroup);
    		if ("displayMatches" in $$props) $$invalidate(2, displayMatches = $$props.displayMatches);
    		if ("myMatches" in $$props) $$invalidate(3, myMatches = $$props.myMatches);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$groupsMatches, $me, _a*/ 385) {
    			if ($groupsMatches && ($$invalidate(7, _a = $me === null || $me === void 0 ? void 0 : $me.player) === null || _a === void 0
    			? void 0
    			: _a.group)) {
    				$$invalidate(3, myMatches = $groupsMatches.filter(match => match.players.find(({ player }) => player.id == $me.id)));
    			}
    		}

    		if ($$self.$$.dirty & /*$groupsMatches*/ 256) {
    			$$invalidate(2, displayMatches = $groupsMatches);
    		}
    	};

    	return [
    		$me,
    		sortedByGroup,
    		displayMatches,
    		myMatches,
    		$groupsMaps,
    		sortByGroup,
    		sortByTime,
    		_a,
    		$groupsMatches
    	];
    }

    class Matches$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$7(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Matches",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    const results = writable(null);
    const init$3 = async () => {
        const raw = await fetch('/data/groups-results.json');
        const json = await raw.json();
        let groupCount = 1;
        json.forEach((row, i) => {
            var _a;
            if (groupCount < 3)
                row.qualified = true;
            groupCount = ((_a = json[i + 1]) === null || _a === void 0 ? void 0 : _a.group) != row.group ? 1 : groupCount + 1;
        });
        results.set(json);
    };

    /* src\pages\groups\Results.svelte generated by Svelte v3.35.0 */
    const file$8 = "src\\pages\\groups\\Results.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    // (14:0) {:else}
    function create_else_block$6(ctx) {
    	let div7;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let div2;
    	let t5;
    	let div3;
    	let t7;
    	let div4;
    	let t9;
    	let div5;
    	let t11;
    	let div6;
    	let t13;
    	let each_1_anchor;
    	let each_value = /*$results*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div0 = element("div");
    			div0.textContent = "Group";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Player";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "Victories";
    			t5 = space();
    			div3 = element("div");
    			div3.textContent = "pts won - pts lost";
    			t7 = space();
    			div4 = element("div");
    			div4.textContent = "WBDs";
    			t9 = space();
    			div5 = element("div");
    			div5.textContent = "LBDs";
    			t11 = space();
    			div6 = element("div");
    			div6.textContent = "Seed";
    			t13 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(div0, "class", "group svelte-10wq7a2");
    			add_location(div0, file$8, 15, 4, 378);
    			attr_dev(div1, "class", "player svelte-10wq7a2");
    			add_location(div1, file$8, 16, 4, 414);
    			attr_dev(div2, "class", "cell svelte-10wq7a2");
    			add_location(div2, file$8, 17, 4, 452);
    			attr_dev(div3, "class", "points svelte-10wq7a2");
    			add_location(div3, file$8, 18, 4, 491);
    			attr_dev(div4, "class", "cell svelte-10wq7a2");
    			add_location(div4, file$8, 19, 4, 541);
    			attr_dev(div5, "class", "cell svelte-10wq7a2");
    			add_location(div5, file$8, 20, 4, 575);
    			attr_dev(div6, "class", "cell svelte-10wq7a2");
    			add_location(div6, file$8, 21, 4, 609);
    			attr_dev(div7, "class", "row header svelte-10wq7a2");
    			add_location(div7, file$8, 14, 2, 348);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div0);
    			append_dev(div7, t1);
    			append_dev(div7, div1);
    			append_dev(div7, t3);
    			append_dev(div7, div2);
    			append_dev(div7, t5);
    			append_dev(div7, div3);
    			append_dev(div7, t7);
    			append_dev(div7, div4);
    			append_dev(div7, t9);
    			append_dev(div7, div5);
    			append_dev(div7, t11);
    			append_dev(div7, div6);
    			insert_dev(target, t13, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$results*/ 1) {
    				each_value = /*$results*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			if (detaching) detach_dev(t13);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$6.name,
    		type: "else",
    		source: "(14:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (12:0) {#if !$results}
    function create_if_block$7(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading groups results...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(12:0) {#if !$results}",
    		ctx
    	});

    	return block;
    }

    // (26:6) {#if row.qualified}
    function create_if_block_2$4(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "⭐";
    			attr_dev(div, "class", "qualified svelte-10wq7a2");
    			add_location(div, file$8, 25, 25, 727);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$4.name,
    		type: "if",
    		source: "(26:6) {#if row.qualified}",
    		ctx
    	});

    	return block;
    }

    // (49:4) {#if $results[i+1] && $results[i+1].group != row.group}
    function create_if_block_1$6(ctx) {
    	let div0;
    	let t0;
    	let div8;
    	let div1;
    	let t2;
    	let div2;
    	let t4;
    	let div3;
    	let t6;
    	let div4;
    	let t8;
    	let div5;
    	let t10;
    	let div6;
    	let t12;
    	let div7;
    	let t14;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			div8 = element("div");
    			div1 = element("div");
    			div1.textContent = "Group";
    			t2 = space();
    			div2 = element("div");
    			div2.textContent = "Player";
    			t4 = space();
    			div3 = element("div");
    			div3.textContent = "Victories";
    			t6 = space();
    			div4 = element("div");
    			div4.textContent = "pts won - pts lost";
    			t8 = space();
    			div5 = element("div");
    			div5.textContent = "WBDs";
    			t10 = space();
    			div6 = element("div");
    			div6.textContent = "LBDs";
    			t12 = space();
    			div7 = element("div");
    			div7.textContent = "Seed";
    			t14 = space();
    			attr_dev(div0, "class", "spacer svelte-10wq7a2");
    			add_location(div0, file$8, 49, 4, 1412);
    			attr_dev(div1, "class", "group svelte-10wq7a2");
    			add_location(div1, file$8, 51, 6, 1472);
    			attr_dev(div2, "class", "player svelte-10wq7a2");
    			add_location(div2, file$8, 52, 6, 1510);
    			attr_dev(div3, "class", "cell svelte-10wq7a2");
    			add_location(div3, file$8, 53, 6, 1550);
    			attr_dev(div4, "class", "points svelte-10wq7a2");
    			add_location(div4, file$8, 54, 6, 1591);
    			attr_dev(div5, "class", "cell svelte-10wq7a2");
    			add_location(div5, file$8, 55, 6, 1643);
    			attr_dev(div6, "class", "cell svelte-10wq7a2");
    			add_location(div6, file$8, 56, 6, 1679);
    			attr_dev(div7, "class", "cell svelte-10wq7a2");
    			add_location(div7, file$8, 57, 6, 1715);
    			attr_dev(div8, "class", "row header svelte-10wq7a2");
    			add_location(div8, file$8, 50, 4, 1440);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div1);
    			append_dev(div8, t2);
    			append_dev(div8, div2);
    			append_dev(div8, t4);
    			append_dev(div8, div3);
    			append_dev(div8, t6);
    			append_dev(div8, div4);
    			append_dev(div8, t8);
    			append_dev(div8, div5);
    			append_dev(div8, t10);
    			append_dev(div8, div6);
    			append_dev(div8, t12);
    			append_dev(div8, div7);
    			append_dev(div8, t14);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div8);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$6.name,
    		type: "if",
    		source: "(49:4) {#if $results[i+1] && $results[i+1].group != row.group}",
    		ctx
    	});

    	return block;
    }

    // (24:2) {#each $results as row, i}
    function create_each_block$6(ctx) {
    	let div7;
    	let t0;
    	let div0;
    	let t1;
    	let t2_value = /*row*/ ctx[1].group + "";
    	let t2;
    	let t3;
    	let div1;
    	let a;
    	let t4_value = /*row*/ ctx[1].username + "";
    	let t4;
    	let a_href_value;
    	let t5;
    	let div2;
    	let t6_value = /*row*/ ctx[1].victories + "";
    	let t6;
    	let t7;
    	let div3;
    	let t8_value = /*row*/ ctx[1].points_won + "";
    	let t8;
    	let t9;
    	let t10_value = /*row*/ ctx[1].points_lost + "";
    	let t10;
    	let t11;
    	let t12_value = /*row*/ ctx[1].won_minus_lost + "";
    	let t12;
    	let t13;
    	let div4;
    	let t14_value = /*row*/ ctx[1].wbds + "";
    	let t14;
    	let t15;
    	let div5;
    	let t16_value = /*row*/ ctx[1].lbds + "";
    	let t16;
    	let t17;
    	let div6;
    	let t18_value = /*row*/ ctx[1].seed + "";
    	let t18;
    	let t19;
    	let if_block1_anchor;
    	let if_block0 = /*row*/ ctx[1].qualified && create_if_block_2$4(ctx);
    	let if_block1 = /*$results*/ ctx[0][/*i*/ ctx[3] + 1] && /*$results*/ ctx[0][/*i*/ ctx[3] + 1].group != /*row*/ ctx[1].group && create_if_block_1$6(ctx);

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div0 = element("div");
    			t1 = text("G");
    			t2 = text(t2_value);
    			t3 = space();
    			div1 = element("div");
    			a = element("a");
    			t4 = text(t4_value);
    			t5 = space();
    			div2 = element("div");
    			t6 = text(t6_value);
    			t7 = space();
    			div3 = element("div");
    			t8 = text(t8_value);
    			t9 = text(" - ");
    			t10 = text(t10_value);
    			t11 = text(" = ");
    			t12 = text(t12_value);
    			t13 = space();
    			div4 = element("div");
    			t14 = text(t14_value);
    			t15 = space();
    			div5 = element("div");
    			t16 = text(t16_value);
    			t17 = space();
    			div6 = element("div");
    			t18 = text(t18_value);
    			t19 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(div0, "class", "group svelte-10wq7a2");
    			add_location(div0, file$8, 26, 6, 770);
    			attr_dev(a, "href", a_href_value = `https://osu.ppy.sh/users/${/*row*/ ctx[1].id}`);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noopener");
    			add_location(a, file$8, 28, 8, 845);
    			attr_dev(div1, "class", "player svelte-10wq7a2");
    			add_location(div1, file$8, 27, 6, 815);
    			attr_dev(div2, "class", "cell svelte-10wq7a2");
    			add_location(div2, file$8, 32, 6, 985);
    			attr_dev(div3, "class", "points svelte-10wq7a2");
    			add_location(div3, file$8, 35, 6, 1050);
    			attr_dev(div4, "class", "cell svelte-10wq7a2");
    			add_location(div4, file$8, 38, 6, 1161);
    			attr_dev(div5, "class", "cell svelte-10wq7a2");
    			add_location(div5, file$8, 41, 6, 1221);
    			attr_dev(div6, "class", "cell svelte-10wq7a2");
    			add_location(div6, file$8, 44, 6, 1281);
    			attr_dev(div7, "class", "row svelte-10wq7a2");
    			add_location(div7, file$8, 24, 4, 683);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			if (if_block0) if_block0.m(div7, null);
    			append_dev(div7, t0);
    			append_dev(div7, div0);
    			append_dev(div0, t1);
    			append_dev(div0, t2);
    			append_dev(div7, t3);
    			append_dev(div7, div1);
    			append_dev(div1, a);
    			append_dev(a, t4);
    			append_dev(div7, t5);
    			append_dev(div7, div2);
    			append_dev(div2, t6);
    			append_dev(div7, t7);
    			append_dev(div7, div3);
    			append_dev(div3, t8);
    			append_dev(div3, t9);
    			append_dev(div3, t10);
    			append_dev(div3, t11);
    			append_dev(div3, t12);
    			append_dev(div7, t13);
    			append_dev(div7, div4);
    			append_dev(div4, t14);
    			append_dev(div7, t15);
    			append_dev(div7, div5);
    			append_dev(div5, t16);
    			append_dev(div7, t17);
    			append_dev(div7, div6);
    			append_dev(div6, t18);
    			insert_dev(target, t19, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*row*/ ctx[1].qualified) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_2$4(ctx);
    					if_block0.c();
    					if_block0.m(div7, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*$results*/ 1 && t2_value !== (t2_value = /*row*/ ctx[1].group + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*$results*/ 1 && t4_value !== (t4_value = /*row*/ ctx[1].username + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*$results*/ 1 && a_href_value !== (a_href_value = `https://osu.ppy.sh/users/${/*row*/ ctx[1].id}`)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*$results*/ 1 && t6_value !== (t6_value = /*row*/ ctx[1].victories + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*$results*/ 1 && t8_value !== (t8_value = /*row*/ ctx[1].points_won + "")) set_data_dev(t8, t8_value);
    			if (dirty & /*$results*/ 1 && t10_value !== (t10_value = /*row*/ ctx[1].points_lost + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*$results*/ 1 && t12_value !== (t12_value = /*row*/ ctx[1].won_minus_lost + "")) set_data_dev(t12, t12_value);
    			if (dirty & /*$results*/ 1 && t14_value !== (t14_value = /*row*/ ctx[1].wbds + "")) set_data_dev(t14, t14_value);
    			if (dirty & /*$results*/ 1 && t16_value !== (t16_value = /*row*/ ctx[1].lbds + "")) set_data_dev(t16, t16_value);
    			if (dirty & /*$results*/ 1 && t18_value !== (t18_value = /*row*/ ctx[1].seed + "")) set_data_dev(t18, t18_value);

    			if (/*$results*/ ctx[0][/*i*/ ctx[3] + 1] && /*$results*/ ctx[0][/*i*/ ctx[3] + 1].group != /*row*/ ctx[1].group) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_1$6(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			if (if_block0) if_block0.d();
    			if (detaching) detach_dev(t19);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(24:2) {#each $results as row, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div;
    	let a0;
    	let t1;
    	let a1;
    	let t3;
    	let a2;
    	let t5;
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (!/*$results*/ ctx[0]) return create_if_block$7;
    		return create_else_block$6;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			a0 = element("a");
    			a0.textContent = "Groups matches";
    			t1 = space();
    			a1 = element("a");
    			a1.textContent = "Rankings per map";
    			t3 = space();
    			a2 = element("a");
    			a2.textContent = "Roll leaderboard";
    			t5 = space();
    			if_block.c();
    			if_block_anchor = empty();
    			attr_dev(a0, "href", "#/groups");
    			add_location(a0, file$8, 6, 2, 145);
    			attr_dev(a1, "href", "#/groups!maps");
    			add_location(a1, file$8, 7, 2, 186);
    			attr_dev(a2, "href", "#/groups!rolls");
    			add_location(a2, file$8, 8, 2, 234);
    			attr_dev(div, "class", "links svelte-10wq7a2");
    			add_location(div, file$8, 5, 0, 122);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a0);
    			append_dev(div, t1);
    			append_dev(div, a1);
    			append_dev(div, t3);
    			append_dev(div, a2);
    			insert_dev(target, t5, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t5);
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $results;
    	validate_store(results, "results");
    	component_subscribe($$self, results, $$value => $$invalidate(0, $results = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Results", slots, []);
    	if (!$results) init$3();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Results> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ results, init: init$3, $results });
    	return [$results];
    }

    class Results extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$7(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Results",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\components\molecules\Match.svelte generated by Svelte v3.35.0 */
    const file$7 = "src\\components\\molecules\\Match.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i].commentator;
    	child_ctx[21] = i;
    	return child_ctx;
    }

    // (50:4) {:else}
    function create_else_block_4$1(ctx) {
    	let t0;
    	let t1_value = /*match*/ ctx[0].id + "";
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text("M");
    			t1 = text(t1_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*match*/ 1 && t1_value !== (t1_value = /*match*/ ctx[0].id + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_4$1.name,
    		type: "else",
    		source: "(50:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (46:4) {#if match.link}
    function create_if_block_13$2(ctx) {
    	let a;
    	let t0;
    	let t1_value = /*match*/ ctx[0].id + "";
    	let t1;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t0 = text("M");
    			t1 = text(t1_value);
    			attr_dev(a, "href", a_href_value = /*match*/ ctx[0].link);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noopener");
    			add_location(a, file$7, 46, 6, 2378);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t0);
    			append_dev(a, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*match*/ 1 && t1_value !== (t1_value = /*match*/ ctx[0].id + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*match*/ 1 && a_href_value !== (a_href_value = /*match*/ ctx[0].link)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_13$2.name,
    		type: "if",
    		source: "(46:4) {#if match.link}",
    		ctx
    	});

    	return block;
    }

    // (63:6) {:else}
    function create_else_block_3$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("To be defined");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3$1.name,
    		type: "else",
    		source: "(63:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (61:6) {#if match.referee}
    function create_if_block_12$2(ctx) {
    	let a;
    	let t_value = /*match*/ ctx[0].referee.username + "";
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = `https://osu.ppy.sh/users/${/*match*/ ctx[0].referee.id}`);
    			add_location(a, file$7, 61, 8, 2824);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*match*/ 1 && t_value !== (t_value = /*match*/ ctx[0].referee.username + "")) set_data_dev(t, t_value);

    			if (dirty & /*match*/ 1 && a_href_value !== (a_href_value = `https://osu.ppy.sh/users/${/*match*/ ctx[0].referee.id}`)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_12$2.name,
    		type: "if",
    		source: "(61:6) {#if match.referee}",
    		ctx
    	});

    	return block;
    }

    // (66:6) {#if match.streamer}
    function create_if_block_11$2(ctx) {
    	let t0;
    	let b;
    	let t2;
    	let a;
    	let t3_value = /*match*/ ctx[0].streamer.username + "";
    	let t3;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			t0 = text("-\r\n        ");
    			b = element("b");
    			b.textContent = "Streamer";
    			t2 = text(":\r\n        ");
    			a = element("a");
    			t3 = text(t3_value);
    			add_location(b, file$7, 67, 8, 3009);
    			attr_dev(a, "href", a_href_value = `https://osu.ppy.sh/users/${/*match*/ ctx[0].streamer.id}`);
    			add_location(a, file$7, 68, 8, 3035);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, b, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, a, anchor);
    			append_dev(a, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*match*/ 1 && t3_value !== (t3_value = /*match*/ ctx[0].streamer.username + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*match*/ 1 && a_href_value !== (a_href_value = `https://osu.ppy.sh/users/${/*match*/ ctx[0].streamer.id}`)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(b);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_11$2.name,
    		type: "if",
    		source: "(66:6) {#if match.streamer}",
    		ctx
    	});

    	return block;
    }

    // (71:6) {#if match.commentators.length}
    function create_if_block_9$2(ctx) {
    	let t0;
    	let b;
    	let t2;
    	let each_1_anchor;
    	let each_value = /*match*/ ctx[0].commentators;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			t0 = text("-\r\n        ");
    			b = element("b");
    			b.textContent = "Commentators";
    			t2 = text(":\r\n        ");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			add_location(b, file$7, 72, 8, 3195);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, b, anchor);
    			insert_dev(target, t2, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*match*/ 1) {
    				each_value = /*match*/ ctx[0].commentators;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(b);
    			if (detaching) detach_dev(t2);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9$2.name,
    		type: "if",
    		source: "(71:6) {#if match.commentators.length}",
    		ctx
    	});

    	return block;
    }

    // (75:10) {#if i}
    function create_if_block_10$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(",");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10$2.name,
    		type: "if",
    		source: "(75:10) {#if i}",
    		ctx
    	});

    	return block;
    }

    // (74:8) {#each match.commentators as { commentator }
    function create_each_block$5(ctx) {
    	let t0;
    	let a;
    	let t1_value = /*commentator*/ ctx[19].username + "";
    	let t1;
    	let a_href_value;
    	let if_block = /*i*/ ctx[21] && create_if_block_10$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			a = element("a");
    			t1 = text(t1_value);
    			attr_dev(a, "href", a_href_value = `https://osu.ppy.sh/users/${/*commentator*/ ctx[19].id}`);
    			add_location(a, file$7, 75, 10, 3311);
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, a, anchor);
    			append_dev(a, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*match*/ 1 && t1_value !== (t1_value = /*commentator*/ ctx[19].username + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*match*/ 1 && a_href_value !== (a_href_value = `https://osu.ppy.sh/users/${/*commentator*/ ctx[19].id}`)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(74:8) {#each match.commentators as { commentator }",
    		ctx
    	});

    	return block;
    }

    // (80:6) {#if toggleRefereeAvailable}
    function create_if_block_6$2(ctx) {
    	let br;
    	let t0;
    	let b;
    	let t2;
    	let t3_value = (/*match*/ ctx[0].available_referees.map(func$1).join(", ") || "None") + "";
    	let t3;
    	let t4;
    	let if_block_anchor;

    	function select_block_type_2(ctx, dirty) {
    		if (/*settingRefereeAvailable*/ ctx[9]) return create_if_block_7$2;
    		if (/*isRefereeAdded*/ ctx[6]) return create_if_block_8$2;
    		return create_else_block_2$1;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			br = element("br");
    			t0 = space();
    			b = element("b");
    			b.textContent = "Available referees";
    			t2 = text(":\r\n        ");
    			t3 = text(t3_value);
    			t4 = text(" -\r\n        ");
    			if_block.c();
    			if_block_anchor = empty();
    			add_location(br, file$7, 80, 8, 3476);
    			add_location(b, file$7, 81, 8, 3492);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, br, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, b, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, t4, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*match*/ 1 && t3_value !== (t3_value = (/*match*/ ctx[0].available_referees.map(func$1).join(", ") || "None") + "")) set_data_dev(t3, t3_value);

    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(b);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(t4);
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6$2.name,
    		type: "if",
    		source: "(80:6) {#if toggleRefereeAvailable}",
    		ctx
    	});

    	return block;
    }

    // (88:8) {:else}
    function create_else_block_2$1(ctx) {
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Add yourself as available";
    			attr_dev(a, "href", "javascript:void(0)");
    			add_location(a, file$7, 88, 10, 3844);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*handleToggleRefereeAvailable*/ ctx[14], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2$1.name,
    		type: "else",
    		source: "(88:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (86:33) 
    function create_if_block_8$2(ctx) {
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Remove yourself";
    			attr_dev(a, "href", "javascript:void(0)");
    			add_location(a, file$7, 86, 10, 3727);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*handleToggleRefereeAvailable*/ ctx[14], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8$2.name,
    		type: "if",
    		source: "(86:33) ",
    		ctx
    	});

    	return block;
    }

    // (84:8) {#if settingRefereeAvailable}
    function create_if_block_7$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Processing...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7$2.name,
    		type: "if",
    		source: "(84:8) {#if settingRefereeAvailable}",
    		ctx
    	});

    	return block;
    }

    // (92:6) {#if toggleStreamerAvailable}
    function create_if_block_3$2(ctx) {
    	let br;
    	let t0;
    	let b;
    	let t2;
    	let t3_value = (/*match*/ ctx[0].available_streamers.map(func_1$2).join(", ") || "None") + "";
    	let t3;
    	let t4;
    	let if_block_anchor;

    	function select_block_type_3(ctx, dirty) {
    		if (/*settingStreamerAvailable*/ ctx[10]) return create_if_block_4$2;
    		if (/*isStreamerAdded*/ ctx[7]) return create_if_block_5$2;
    		return create_else_block_1$4;
    	}

    	let current_block_type = select_block_type_3(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			br = element("br");
    			t0 = space();
    			b = element("b");
    			b.textContent = "Available streamers";
    			t2 = text(":\r\n        ");
    			t3 = text(t3_value);
    			t4 = text(" -\r\n        ");
    			if_block.c();
    			if_block_anchor = empty();
    			add_location(br, file$7, 92, 8, 4017);
    			add_location(b, file$7, 93, 8, 4033);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, br, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, b, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, t4, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*match*/ 1 && t3_value !== (t3_value = (/*match*/ ctx[0].available_streamers.map(func_1$2).join(", ") || "None") + "")) set_data_dev(t3, t3_value);

    			if (current_block_type === (current_block_type = select_block_type_3(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(b);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(t4);
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$2.name,
    		type: "if",
    		source: "(92:6) {#if toggleStreamerAvailable}",
    		ctx
    	});

    	return block;
    }

    // (100:8) {:else}
    function create_else_block_1$4(ctx) {
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Add yourself as available";
    			attr_dev(a, "href", "javascript:void(0)");
    			add_location(a, file$7, 100, 10, 4392);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*handleToggleStreamerAvailable*/ ctx[15], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$4.name,
    		type: "else",
    		source: "(100:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (98:34) 
    function create_if_block_5$2(ctx) {
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Remove yourself";
    			attr_dev(a, "href", "javascript:void(0)");
    			add_location(a, file$7, 98, 10, 4274);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*handleToggleStreamerAvailable*/ ctx[15], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$2.name,
    		type: "if",
    		source: "(98:34) ",
    		ctx
    	});

    	return block;
    }

    // (96:8) {#if settingStreamerAvailable}
    function create_if_block_4$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Processing...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$2.name,
    		type: "if",
    		source: "(96:8) {#if settingStreamerAvailable}",
    		ctx
    	});

    	return block;
    }

    // (104:6) {#if toggleCommentatorAvailable}
    function create_if_block$6(ctx) {
    	let br;
    	let t0;
    	let b;
    	let t2;
    	let t3_value = (/*match*/ ctx[0].available_commentators.map(func_2$1).join(", ") || "None") + "";
    	let t3;
    	let t4;
    	let if_block_anchor;

    	function select_block_type_4(ctx, dirty) {
    		if (/*settingCommentatorAvailable*/ ctx[11]) return create_if_block_1$5;
    		if (/*isCommentatorAdded*/ ctx[8]) return create_if_block_2$3;
    		return create_else_block$5;
    	}

    	let current_block_type = select_block_type_4(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			br = element("br");
    			t0 = space();
    			b = element("b");
    			b.textContent = "Available commentators";
    			t2 = text(":\r\n        ");
    			t3 = text(t3_value);
    			t4 = text(" -\r\n        ");
    			if_block.c();
    			if_block_anchor = empty();
    			add_location(br, file$7, 104, 8, 4569);
    			add_location(b, file$7, 105, 8, 4585);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, br, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, b, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, t4, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*match*/ 1 && t3_value !== (t3_value = (/*match*/ ctx[0].available_commentators.map(func_2$1).join(", ") || "None") + "")) set_data_dev(t3, t3_value);

    			if (current_block_type === (current_block_type = select_block_type_4(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(b);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(t4);
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(104:6) {#if toggleCommentatorAvailable}",
    		ctx
    	});

    	return block;
    }

    // (112:8) {:else}
    function create_else_block$5(ctx) {
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Add yourself as available";
    			attr_dev(a, "href", "javascript:void(0)");
    			add_location(a, file$7, 112, 10, 4965);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*handleToggleCommentatorAvailable*/ ctx[16], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$5.name,
    		type: "else",
    		source: "(112:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (110:37) 
    function create_if_block_2$3(ctx) {
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Remove yourself";
    			attr_dev(a, "href", "javascript:void(0)");
    			add_location(a, file$7, 110, 10, 4844);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*handleToggleCommentatorAvailable*/ ctx[16], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(110:37) ",
    		ctx
    	});

    	return block;
    }

    // (108:8) {#if settingCommentatorAvailable}
    function create_if_block_1$5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Processing...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(108:8) {#if settingCommentatorAvailable}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div10;
    	let div0;
    	let t0;
    	let div8;
    	let div2;
    	let b0;
    	let t1_value = /*time*/ ctx[5].toDateString() + "";
    	let t1;
    	let t2;
    	let t3_value = /*time*/ ctx[5].toTimeString().replace(":00 GMT", " UTC") + "";
    	let t3;
    	let t4;
    	let div1;
    	let t5_value = /*time*/ ctx[5].toUTCString().replace(":00 GMT", " UTC+0") + "";
    	let t5;
    	let t6;
    	let div3;
    	let b1;
    	let t8;
    	let t9;
    	let t10;
    	let t11;
    	let t12;
    	let t13;
    	let t14;
    	let div7;
    	let div4;
    	let img0;
    	let img0_src_value;
    	let t15;
    	let a0;
    	let t16_value = /*topPlayer*/ ctx[12].username + "";
    	let t16;
    	let t17;
    	let t18_value = /*topPlayer*/ ctx[12].seed + "";
    	let t18;
    	let t19;
    	let t20;
    	let div5;
    	let t22;
    	let div6;
    	let img1;
    	let img1_src_value;
    	let t23;
    	let a1;
    	let t24_value = /*bottomPlayer*/ ctx[13].username + "";
    	let t24;
    	let t25;
    	let t26_value = /*bottomPlayer*/ ctx[13].seed + "";
    	let t26;
    	let t27;
    	let t28;
    	let div9;
    	let t29_value = (/*match*/ ctx[0].points1 || 0) + "";
    	let t29;
    	let t30;
    	let t31_value = (/*match*/ ctx[0].points2 || 0) + "";
    	let t31;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*match*/ ctx[0].link) return create_if_block_13$2;
    		return create_else_block_4$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*match*/ ctx[0].referee) return create_if_block_12$2;
    		return create_else_block_3$1;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);
    	let if_block2 = /*match*/ ctx[0].streamer && create_if_block_11$2(ctx);
    	let if_block3 = /*match*/ ctx[0].commentators.length && create_if_block_9$2(ctx);
    	let if_block4 = /*toggleRefereeAvailable*/ ctx[1] && create_if_block_6$2(ctx);
    	let if_block5 = /*toggleStreamerAvailable*/ ctx[2] && create_if_block_3$2(ctx);
    	let if_block6 = /*toggleCommentatorAvailable*/ ctx[3] && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div0 = element("div");
    			if_block0.c();
    			t0 = space();
    			div8 = element("div");
    			div2 = element("div");
    			b0 = element("b");
    			t1 = text(t1_value);
    			t2 = space();
    			t3 = text(t3_value);
    			t4 = space();
    			div1 = element("div");
    			t5 = text(t5_value);
    			t6 = space();
    			div3 = element("div");
    			b1 = element("b");
    			b1.textContent = "Referee";
    			t8 = text(":\r\n      ");
    			if_block1.c();
    			t9 = space();
    			if (if_block2) if_block2.c();
    			t10 = space();
    			if (if_block3) if_block3.c();
    			t11 = space();
    			if (if_block4) if_block4.c();
    			t12 = space();
    			if (if_block5) if_block5.c();
    			t13 = space();
    			if (if_block6) if_block6.c();
    			t14 = space();
    			div7 = element("div");
    			div4 = element("div");
    			img0 = element("img");
    			t15 = space();
    			a0 = element("a");
    			t16 = text(t16_value);
    			t17 = text(" (#");
    			t18 = text(t18_value);
    			t19 = text(")");
    			t20 = space();
    			div5 = element("div");
    			div5.textContent = "vs.";
    			t22 = space();
    			div6 = element("div");
    			img1 = element("img");
    			t23 = space();
    			a1 = element("a");
    			t24 = text(t24_value);
    			t25 = text(" (#");
    			t26 = text(t26_value);
    			t27 = text(")");
    			t28 = space();
    			div9 = element("div");
    			t29 = text(t29_value);
    			t30 = text(" - ");
    			t31 = text(t31_value);
    			attr_dev(div0, "class", "name svelte-1tuxpxq");
    			add_location(div0, file$7, 44, 2, 2330);
    			add_location(b0, file$7, 55, 6, 2570);
    			attr_dev(div1, "class", "utc svelte-1tuxpxq");
    			add_location(div1, file$7, 56, 6, 2655);
    			attr_dev(div2, "class", "time svelte-1tuxpxq");
    			add_location(div2, file$7, 54, 4, 2544);
    			add_location(b1, file$7, 59, 6, 2772);
    			attr_dev(div3, "class", "staff svelte-1tuxpxq");
    			add_location(div3, file$7, 58, 4, 2745);
    			attr_dev(img0, "alt", "");
    			if (img0.src !== (img0_src_value = /*topPlayer*/ ctx[12].avatar)) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "class", "svelte-1tuxpxq");
    			add_location(img0, file$7, 118, 8, 5172);
    			attr_dev(a0, "href", `https://osu.ppy.sh/users/${/*topPlayer*/ ctx[12].id}`);
    			add_location(a0, file$7, 119, 8, 5219);
    			attr_dev(div4, "class", "player svelte-1tuxpxq");
    			add_location(div4, file$7, 117, 6, 5142);
    			attr_dev(div5, "class", "vs svelte-1tuxpxq");
    			add_location(div5, file$7, 121, 6, 5338);
    			attr_dev(img1, "alt", "");
    			if (img1.src !== (img1_src_value = /*bottomPlayer*/ ctx[13].avatar)) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "class", "svelte-1tuxpxq");
    			add_location(img1, file$7, 123, 8, 5401);
    			attr_dev(a1, "href", `https://osu.ppy.sh/users/${/*bottomPlayer*/ ctx[13].id}`);
    			add_location(a1, file$7, 124, 8, 5451);
    			attr_dev(div6, "class", "player svelte-1tuxpxq");
    			add_location(div6, file$7, 122, 6, 5371);
    			attr_dev(div7, "class", "players svelte-1tuxpxq");
    			add_location(div7, file$7, 116, 4, 5113);
    			attr_dev(div8, "class", "body svelte-1tuxpxq");
    			add_location(div8, file$7, 53, 2, 2520);
    			attr_dev(div9, "class", "score svelte-1tuxpxq");
    			add_location(div9, file$7, 128, 2, 5597);
    			attr_dev(div10, "class", "match svelte-1tuxpxq");
    			toggle_class(div10, "my-match", /*$me*/ ctx[4]?.id == /*topPlayer*/ ctx[12].id || /*$me*/ ctx[4]?.id == /*bottomPlayer*/ ctx[13].id);
    			add_location(div10, file$7, 43, 0, 2227);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div0);
    			if_block0.m(div0, null);
    			append_dev(div10, t0);
    			append_dev(div10, div8);
    			append_dev(div8, div2);
    			append_dev(div2, b0);
    			append_dev(b0, t1);
    			append_dev(b0, t2);
    			append_dev(b0, t3);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, t5);
    			append_dev(div8, t6);
    			append_dev(div8, div3);
    			append_dev(div3, b1);
    			append_dev(div3, t8);
    			if_block1.m(div3, null);
    			append_dev(div3, t9);
    			if (if_block2) if_block2.m(div3, null);
    			append_dev(div3, t10);
    			if (if_block3) if_block3.m(div3, null);
    			append_dev(div3, t11);
    			if (if_block4) if_block4.m(div3, null);
    			append_dev(div3, t12);
    			if (if_block5) if_block5.m(div3, null);
    			append_dev(div3, t13);
    			if (if_block6) if_block6.m(div3, null);
    			append_dev(div8, t14);
    			append_dev(div8, div7);
    			append_dev(div7, div4);
    			append_dev(div4, img0);
    			append_dev(div4, t15);
    			append_dev(div4, a0);
    			append_dev(a0, t16);
    			append_dev(a0, t17);
    			append_dev(a0, t18);
    			append_dev(a0, t19);
    			append_dev(div7, t20);
    			append_dev(div7, div5);
    			append_dev(div7, t22);
    			append_dev(div7, div6);
    			append_dev(div6, img1);
    			append_dev(div6, t23);
    			append_dev(div6, a1);
    			append_dev(a1, t24);
    			append_dev(a1, t25);
    			append_dev(a1, t26);
    			append_dev(a1, t27);
    			append_dev(div10, t28);
    			append_dev(div10, div9);
    			append_dev(div9, t29);
    			append_dev(div9, t30);
    			append_dev(div9, t31);

    			if (!mounted) {
    				dispose = listen_dev(div10, "click", /*click_handler*/ ctx[17], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			}

    			if (dirty & /*time*/ 32 && t1_value !== (t1_value = /*time*/ ctx[5].toDateString() + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*time*/ 32 && t3_value !== (t3_value = /*time*/ ctx[5].toTimeString().replace(":00 GMT", " UTC") + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*time*/ 32 && t5_value !== (t5_value = /*time*/ ctx[5].toUTCString().replace(":00 GMT", " UTC+0") + "")) set_data_dev(t5, t5_value);

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div3, t9);
    				}
    			}

    			if (/*match*/ ctx[0].streamer) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_11$2(ctx);
    					if_block2.c();
    					if_block2.m(div3, t10);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*match*/ ctx[0].commentators.length) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block_9$2(ctx);
    					if_block3.c();
    					if_block3.m(div3, t11);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (/*toggleRefereeAvailable*/ ctx[1]) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);
    				} else {
    					if_block4 = create_if_block_6$2(ctx);
    					if_block4.c();
    					if_block4.m(div3, t12);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}

    			if (/*toggleStreamerAvailable*/ ctx[2]) {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);
    				} else {
    					if_block5 = create_if_block_3$2(ctx);
    					if_block5.c();
    					if_block5.m(div3, t13);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
    			}

    			if (/*toggleCommentatorAvailable*/ ctx[3]) {
    				if (if_block6) {
    					if_block6.p(ctx, dirty);
    				} else {
    					if_block6 = create_if_block$6(ctx);
    					if_block6.c();
    					if_block6.m(div3, null);
    				}
    			} else if (if_block6) {
    				if_block6.d(1);
    				if_block6 = null;
    			}

    			if (dirty & /*match*/ 1 && t29_value !== (t29_value = (/*match*/ ctx[0].points1 || 0) + "")) set_data_dev(t29, t29_value);
    			if (dirty & /*match*/ 1 && t31_value !== (t31_value = (/*match*/ ctx[0].points2 || 0) + "")) set_data_dev(t31, t31_value);

    			if (dirty & /*$me, topPlayer, bottomPlayer*/ 12304) {
    				toggle_class(div10, "my-match", /*$me*/ ctx[4]?.id == /*topPlayer*/ ctx[12].id || /*$me*/ ctx[4]?.id == /*bottomPlayer*/ ctx[13].id);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    			if_block0.d();
    			if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
    			if (if_block6) if_block6.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func$1 = ({ referee }) => referee.username;
    const func_1$2 = ({ streamer }) => streamer.username;
    const func_2$1 = ({ commentator }) => commentator.username;

    function instance$7($$self, $$props, $$invalidate) {
    	let $me;
    	validate_store(me, "me");
    	component_subscribe($$self, me, $$value => $$invalidate(4, $me = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Match", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	
    	let { match } = $$props;
    	let { toggleRefereeAvailable = null } = $$props;
    	let { toggleStreamerAvailable = null } = $$props;
    	let { toggleCommentatorAvailable = null } = $$props;
    	const [topPlayer, bottomPlayer] = match.players.map(({ player }) => player);
    	let time, isRefereeAdded, isStreamerAdded, isCommentatorAdded;
    	let settingRefereeAvailable;

    	const handleToggleRefereeAvailable = () => __awaiter(void 0, void 0, void 0, function* () {
    		$$invalidate(9, settingRefereeAvailable = true);
    		yield toggleRefereeAvailable();
    		$$invalidate(9, settingRefereeAvailable = false);
    	});

    	let settingStreamerAvailable;

    	const handleToggleStreamerAvailable = () => __awaiter(void 0, void 0, void 0, function* () {
    		$$invalidate(10, settingStreamerAvailable = true);
    		yield toggleStreamerAvailable();
    		$$invalidate(10, settingStreamerAvailable = false);
    	});

    	let settingCommentatorAvailable;

    	const handleToggleCommentatorAvailable = () => __awaiter(void 0, void 0, void 0, function* () {
    		$$invalidate(11, settingCommentatorAvailable = true);
    		yield toggleCommentatorAvailable();
    		$$invalidate(11, settingCommentatorAvailable = false);
    	});

    	const writable_props = [
    		"match",
    		"toggleRefereeAvailable",
    		"toggleStreamerAvailable",
    		"toggleCommentatorAvailable"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Match> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("match" in $$props) $$invalidate(0, match = $$props.match);
    		if ("toggleRefereeAvailable" in $$props) $$invalidate(1, toggleRefereeAvailable = $$props.toggleRefereeAvailable);
    		if ("toggleStreamerAvailable" in $$props) $$invalidate(2, toggleStreamerAvailable = $$props.toggleStreamerAvailable);
    		if ("toggleCommentatorAvailable" in $$props) $$invalidate(3, toggleCommentatorAvailable = $$props.toggleCommentatorAvailable);
    	};

    	$$self.$capture_state = () => ({
    		__awaiter,
    		me,
    		match,
    		toggleRefereeAvailable,
    		toggleStreamerAvailable,
    		toggleCommentatorAvailable,
    		topPlayer,
    		bottomPlayer,
    		time,
    		isRefereeAdded,
    		isStreamerAdded,
    		isCommentatorAdded,
    		settingRefereeAvailable,
    		handleToggleRefereeAvailable,
    		settingStreamerAvailable,
    		handleToggleStreamerAvailable,
    		settingCommentatorAvailable,
    		handleToggleCommentatorAvailable,
    		$me
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("match" in $$props) $$invalidate(0, match = $$props.match);
    		if ("toggleRefereeAvailable" in $$props) $$invalidate(1, toggleRefereeAvailable = $$props.toggleRefereeAvailable);
    		if ("toggleStreamerAvailable" in $$props) $$invalidate(2, toggleStreamerAvailable = $$props.toggleStreamerAvailable);
    		if ("toggleCommentatorAvailable" in $$props) $$invalidate(3, toggleCommentatorAvailable = $$props.toggleCommentatorAvailable);
    		if ("time" in $$props) $$invalidate(5, time = $$props.time);
    		if ("isRefereeAdded" in $$props) $$invalidate(6, isRefereeAdded = $$props.isRefereeAdded);
    		if ("isStreamerAdded" in $$props) $$invalidate(7, isStreamerAdded = $$props.isStreamerAdded);
    		if ("isCommentatorAdded" in $$props) $$invalidate(8, isCommentatorAdded = $$props.isCommentatorAdded);
    		if ("settingRefereeAvailable" in $$props) $$invalidate(9, settingRefereeAvailable = $$props.settingRefereeAvailable);
    		if ("settingStreamerAvailable" in $$props) $$invalidate(10, settingStreamerAvailable = $$props.settingStreamerAvailable);
    		if ("settingCommentatorAvailable" in $$props) $$invalidate(11, settingCommentatorAvailable = $$props.settingCommentatorAvailable);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*match, toggleRefereeAvailable, $me, toggleStreamerAvailable, toggleCommentatorAvailable*/ 31) {
    			{
    				$$invalidate(5, time = new Date(match.time));
    				$$invalidate(6, isRefereeAdded = toggleRefereeAvailable && match.available_referees.find(({ referee }) => referee.id == $me.id));
    				$$invalidate(7, isStreamerAdded = toggleStreamerAvailable && match.available_streamers.find(({ streamer }) => streamer.id == $me.id));
    				$$invalidate(8, isCommentatorAdded = toggleCommentatorAvailable && match.available_commentators.find(({ commentator }) => commentator.id == $me.id));
    			}
    		}
    	};

    	return [
    		match,
    		toggleRefereeAvailable,
    		toggleStreamerAvailable,
    		toggleCommentatorAvailable,
    		$me,
    		time,
    		isRefereeAdded,
    		isStreamerAdded,
    		isCommentatorAdded,
    		settingRefereeAvailable,
    		settingStreamerAvailable,
    		settingCommentatorAvailable,
    		topPlayer,
    		bottomPlayer,
    		handleToggleRefereeAvailable,
    		handleToggleStreamerAvailable,
    		handleToggleCommentatorAvailable,
    		click_handler
    	];
    }

    class Match extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init$7(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			match: 0,
    			toggleRefereeAvailable: 1,
    			toggleStreamerAvailable: 2,
    			toggleCommentatorAvailable: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Match",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*match*/ ctx[0] === undefined && !("match" in props)) {
    			console.warn("<Match> was created without expected prop 'match'");
    		}
    	}

    	get match() {
    		throw new Error("<Match>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set match(value) {
    		throw new Error("<Match>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toggleRefereeAvailable() {
    		throw new Error("<Match>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggleRefereeAvailable(value) {
    		throw new Error("<Match>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toggleStreamerAvailable() {
    		throw new Error("<Match>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggleStreamerAvailable(value) {
    		throw new Error("<Match>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toggleCommentatorAvailable() {
    		throw new Error("<Match>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggleCommentatorAvailable(value) {
    		throw new Error("<Match>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var query$2 = `query GetMatches($stage: String!) {
  maps(
    filter: {
      stage: {
        slug: {
          _eq: $stage
        }
      }
    }
    sort: "order"
  ) {
    id
    artist
    name
    weight
    difficulty
    charter
    charter_id
    category
    bpm
    length
    od
    hp
    sr
    cover
  }
  matches(
    filter: {
      stage: {
        slug: {
          _eq: $stage
        }
      }
    }
    sort: "time"
    limit: -1
  ) {
    id
    link
    players {
      player: players_id {
        id
        username
        avatar
        seed
      }
    }
    time
    referee {
      id
      username
    }
    streamer {
      id
      username
    }
    commentators {
      commentator: commentators_id {
        id
        username
      }
    }

    available_referees {
      rel_id: id
      referee: referees_id {
        id
        username
      }
    }
    available_streamers {
      rel_id: id
      streamer: streamers_id {
        id
        username
      }
    }
    available_commentators {
      rel_id: id
      commentator: commentators_id {
        id
        username
      }
    }

    rolls {
      id
      player { id username }
      value
    }
    protects {
      id
      player { id username }
      map { id name category }
    }
    bans {
      id
      player { id username }
      map { id name category }
    }
    picks {
      id
      player { id username }
      map { id name category weight }
    }

    scores {
      id
      player { id }
      map { id }
      score
    }
    wbd {
      id
    }
  }
}`;

    const stage$2 = writable(null);
    const matches = writable(null);
    const maps = writable(null);
    const init$2 = async (newStage) => {
        // Flush between stage transitions
        stage$2.set(newStage);
        matches.set(null);
        maps.set(null);
        const { data } = await api('/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: query$2, variables: { stage: newStage } })
        });
        data.matches.forEach(match => {
            // Properly display seed order in matches
            match.players = match.players[0].player.seed < match.players[1].player.seed ? match.players : match.players.reverse();
            // Compute match scores
            if (match.wbd) {
                match.points1 = match.wbd.id == match.players[0].player.id ? 'WBD' : 0;
                match.points2 = match.wbd.id == match.players[1].player.id ? 'WBD' : 0;
            }
            else {
                match.points1 = 0;
                match.points2 = 0;
                match.picks.forEach(pick => {
                    var _a, _b;
                    let scores = match.scores.filter(s => s.map.id == pick.map.id) || [];
                    // If there's only one score for the pick, the other player most likely disconnected
                    if (scores.length == 1) {
                        scores.push(Object.assign(Object.assign({}, scores[0]), { player: match.players[((_a = scores[0]) === null || _a === void 0 ? void 0 : _a.player.id) == match.players[0].player.id ? 1 : 0].player, score: 0 }));
                    }
                    if (((_b = scores[0]) === null || _b === void 0 ? void 0 : _b.player.id) != match.players[0].player.id) {
                        scores = scores.reverse();
                    }
                    const [score1, score2] = scores;
                    if (score1 && score2) {
                        if (score1.score > score2.score) {
                            match.points1 += 1;
                        }
                        else {
                            match.points2 += 1;
                        }
                    }
                });
            }
        });
        matches.set(data.matches);
        maps.set(data.maps);
    };

    /* src\pages\brackets\Matches.svelte generated by Svelte v3.35.0 */

    const { Map: Map_1$2 } = globals;
    const file$6 = "src\\pages\\brackets\\Matches.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    function get_each_context_1$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    function get_each_context_2$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (61:0) {#if myMatches?.length}
    function create_if_block_1$4(ctx) {
    	let div0;
    	let t0;
    	let br;
    	let t1;
    	let t2;
    	let div1;
    	let each_blocks = [];
    	let each_1_lookup = new Map_1$2();
    	let current;
    	let each_value_2 = /*myMatches*/ ctx[1];
    	validate_each_argument(each_value_2);
    	const get_key = ctx => /*match*/ ctx[8].id;
    	validate_each_keys(ctx, each_value_2, get_each_context_2$2, get_key);

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		let child_ctx = get_each_context_2$2(ctx, each_value_2, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_2$2(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text("You have matches for this stage!");
    			br = element("br");
    			t1 = text("\r\n  You can find the list of your own matches just below.");
    			t2 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(br, file$6, 62, 34, 2657);
    			attr_dev(div0, "class", "intro svelte-jcr45l");
    			add_location(div0, file$6, 61, 0, 2602);
    			attr_dev(div1, "class", "matches svelte-jcr45l");
    			add_location(div1, file$6, 65, 0, 2730);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			append_dev(div0, br);
    			append_dev(div0, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*myMatches*/ 2) {
    				each_value_2 = /*myMatches*/ ctx[1];
    				validate_each_argument(each_value_2);
    				group_outros();
    				validate_each_keys(ctx, each_value_2, get_each_context_2$2, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_2, each_1_lookup, div1, outro_and_destroy_block, create_each_block_2$2, null, get_each_context_2$2);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(61:0) {#if myMatches?.length}",
    		ctx
    	});

    	return block;
    }

    // (67:0) {#each myMatches as match (match.id)}
    function create_each_block_2$2(key_1, ctx) {
    	let first;
    	let match;
    	let current;

    	match = new Match({
    			props: { match: /*match*/ ctx[8] },
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(match.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(match, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const match_changes = {};
    			if (dirty & /*myMatches*/ 2) match_changes.match = /*match*/ ctx[8];
    			match.$set(match_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(match.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(match.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(match, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$2.name,
    		type: "each",
    		source: "(67:0) {#each myMatches as match (match.id)}",
    		ctx
    	});

    	return block;
    }

    // (74:0) {:else}
    function create_else_block$4(ctx) {
    	let div0;
    	let each_blocks_1 = [];
    	let each0_lookup = new Map_1$2();
    	let t;
    	let div1;
    	let each_blocks = [];
    	let each1_lookup = new Map_1$2();
    	let current;
    	let each_value_1 = /*$maps*/ ctx[4];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*map*/ ctx[11].id;
    	validate_each_keys(ctx, each_value_1, get_each_context_1$3, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$3(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each0_lookup.set(key, each_blocks_1[i] = create_each_block_1$3(key, child_ctx));
    	}

    	let each_value = /*$matches*/ ctx[2];
    	validate_each_argument(each_value);
    	const get_key_1 = ctx => /*match*/ ctx[8].id;
    	validate_each_keys(ctx, each_value, get_each_context$4, get_key_1);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$4(ctx, each_value, i);
    		let key = get_key_1(child_ctx);
    		each1_lookup.set(key, each_blocks[i] = create_each_block$4(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "maps svelte-jcr45l");
    			add_location(div0, file$6, 74, 2, 2914);
    			attr_dev(div1, "class", "matches svelte-jcr45l");
    			add_location(div1, file$6, 79, 2, 3009);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$maps*/ 16) {
    				each_value_1 = /*$maps*/ ctx[4];
    				validate_each_argument(each_value_1);
    				group_outros();
    				validate_each_keys(ctx, each_value_1, get_each_context_1$3, get_key);
    				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key, 1, ctx, each_value_1, each0_lookup, div0, outro_and_destroy_block, create_each_block_1$3, null, get_each_context_1$3);
    				check_outros();
    			}

    			if (dirty & /*$matches, $me, toggleAvailable*/ 44) {
    				each_value = /*$matches*/ ctx[2];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$4, get_key_1);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key_1, 1, ctx, each_value, each1_lookup, div1, outro_and_destroy_block, create_each_block$4, null, get_each_context$4);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].d();
    			}

    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(74:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (72:0) {#if !$matches}
    function create_if_block$5(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Loading matches...";
    			attr_dev(div, "class", "matches svelte-jcr45l");
    			add_location(div, file$6, 72, 2, 2856);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(72:0) {#if !$matches}",
    		ctx
    	});

    	return block;
    }

    // (76:2) {#each $maps as map (map.id)}
    function create_each_block_1$3(key_1, ctx) {
    	let first;
    	let map;
    	let current;

    	map = new Map$1({
    			props: { map: /*map*/ ctx[11] },
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(map.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(map, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const map_changes = {};
    			if (dirty & /*$maps*/ 16) map_changes.map = /*map*/ ctx[11];
    			map.$set(map_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(map, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$3.name,
    		type: "each",
    		source: "(76:2) {#each $maps as map (map.id)}",
    		ctx
    	});

    	return block;
    }

    // (81:4) {#each $matches as match, i (match.id)}
    function create_each_block$4(key_1, ctx) {
    	let first;
    	let match;
    	let current;

    	match = new Match({
    			props: {
    				match: /*match*/ ctx[8],
    				toggleRefereeAvailable: /*$me*/ ctx[3]?.referee && /*toggleAvailable*/ ctx[5]("referee", /*match*/ ctx[8]),
    				toggleStreamerAvailable: /*$me*/ ctx[3]?.streamer && /*toggleAvailable*/ ctx[5]("streamer", /*match*/ ctx[8]),
    				toggleCommentatorAvailable: /*$me*/ ctx[3]?.commentator && /*toggleAvailable*/ ctx[5]("commentator", /*match*/ ctx[8])
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(match.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(match, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const match_changes = {};
    			if (dirty & /*$matches*/ 4) match_changes.match = /*match*/ ctx[8];
    			if (dirty & /*$me, $matches*/ 12) match_changes.toggleRefereeAvailable = /*$me*/ ctx[3]?.referee && /*toggleAvailable*/ ctx[5]("referee", /*match*/ ctx[8]);
    			if (dirty & /*$me, $matches*/ 12) match_changes.toggleStreamerAvailable = /*$me*/ ctx[3]?.streamer && /*toggleAvailable*/ ctx[5]("streamer", /*match*/ ctx[8]);
    			if (dirty & /*$me, $matches*/ 12) match_changes.toggleCommentatorAvailable = /*$me*/ ctx[3]?.commentator && /*toggleAvailable*/ ctx[5]("commentator", /*match*/ ctx[8]);
    			match.$set(match_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(match.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(match.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(match, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(81:4) {#each $matches as match, i (match.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;
    	let a0;
    	let t0;
    	let a0_href_value;
    	let t1;
    	let a1;
    	let t2;
    	let a1_href_value;
    	let t3;
    	let t4;
    	let current_block_type_index;
    	let if_block1;
    	let if_block1_anchor;
    	let current;
    	let if_block0 = /*myMatches*/ ctx[1]?.length && create_if_block_1$4(ctx);
    	const if_block_creators = [create_if_block$5, create_else_block$4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*$matches*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			a0 = element("a");
    			t0 = text("Rankings per map");
    			t1 = space();
    			a1 = element("a");
    			t2 = text("Roll leaderboard");
    			t3 = space();
    			if (if_block0) if_block0.c();
    			t4 = space();
    			if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(a0, "href", a0_href_value = `#/${/*stage*/ ctx[0]}!maps`);
    			add_location(a0, file$6, 56, 2, 2464);
    			attr_dev(a1, "href", a1_href_value = `#/${/*stage*/ ctx[0]}!rolls`);
    			add_location(a1, file$6, 57, 2, 2516);
    			attr_dev(div, "class", "links svelte-jcr45l");
    			add_location(div, file$6, 55, 0, 2441);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a0);
    			append_dev(a0, t0);
    			append_dev(div, t1);
    			append_dev(div, a1);
    			append_dev(a1, t2);
    			insert_dev(target, t3, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t4, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*stage*/ 1 && a0_href_value !== (a0_href_value = `#/${/*stage*/ ctx[0]}!maps`)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (!current || dirty & /*stage*/ 1 && a1_href_value !== (a1_href_value = `#/${/*stage*/ ctx[0]}!rolls`)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (/*myMatches*/ ctx[1]?.length) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*myMatches*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1$4(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t4.parentNode, t4);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t3);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t4);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $matches;
    	let $me;
    	let $maps;
    	validate_store(matches, "matches");
    	component_subscribe($$self, matches, $$value => $$invalidate(2, $matches = $$value));
    	validate_store(me, "me");
    	component_subscribe($$self, me, $$value => $$invalidate(3, $me = $$value));
    	validate_store(maps, "maps");
    	component_subscribe($$self, maps, $$value => $$invalidate(4, $maps = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Matches", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	var _a;
    	
    	let { stage } = $$props;
    	if (!$matches) init$2(stage);
    	let myMatches;

    	const toggleAvailable = (entity, match) => () => __awaiter(void 0, void 0, void 0, function* () {
    		const existingEntry = match[`available_${entity}s`].find(x => x[entity].id == $me.id);

    		const res = yield api(`/items/matches/${match.id}`, {
    			method: "PATCH",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify({
    				[`available_${entity}s`]: existingEntry
    				? { delete: [existingEntry.rel_id] }
    				: { create: [{ [`${entity}s_id`]: $me.id }] }
    			})
    		});

    		if (res.errors) {
    			alert(res.errors[0].message);
    		} else {
    			matches.set($matches.map(m => {
    				if (m.id != match.id) return m;

    				if (existingEntry) {
    					m[`available_${entity}s`] = m[`available_${entity}s`].filter(x => x[entity].id != $me.id);
    				} else {
    					m[`available_${entity}s`].push({
    						rel_id: res.data[`available_${entity}s`].pop(),
    						[entity]: $me[entity]
    					});
    				}

    				return m;
    			}));
    		}
    	});

    	const writable_props = ["stage"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Matches> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("stage" in $$props) $$invalidate(0, stage = $$props.stage);
    	};

    	$$self.$capture_state = () => ({
    		__awaiter,
    		_a,
    		Match,
    		Map: Map$1,
    		me,
    		api,
    		matches,
    		maps,
    		init: init$2,
    		stage,
    		myMatches,
    		toggleAvailable,
    		$matches,
    		$me,
    		$maps
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("_a" in $$props) $$invalidate(6, _a = $$props._a);
    		if ("stage" in $$props) $$invalidate(0, stage = $$props.stage);
    		if ("myMatches" in $$props) $$invalidate(1, myMatches = $$props.myMatches);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$matches, $me, _a, myMatches*/ 78) {
    			if ($matches && ($$invalidate(6, _a = $me === null || $me === void 0 ? void 0 : $me.player) === null || _a === void 0
    			? void 0
    			: _a.group) && !myMatches) {
    				$$invalidate(1, myMatches = $matches.filter(match => match.players.find(({ player }) => player.id == $me.id)));
    			}
    		}
    	};

    	return [stage, myMatches, $matches, $me, $maps, toggleAvailable, _a];
    }

    class Matches extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$7(this, options, instance$6, create_fragment$6, safe_not_equal, { stage: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Matches",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*stage*/ ctx[0] === undefined && !("stage" in props)) {
    			console.warn("<Matches> was created without expected prop 'stage'");
    		}
    	}

    	get stage() {
    		throw new Error("<Matches>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set stage(value) {
    		throw new Error("<Matches>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var query$1 = `query GetScores($stage: String!) {
  maps(
    filter: {
      stage: {
        slug: {
          _eq: $stage
        }
      }
    }
    sort: "order"
  ) {
    id
    artist
    name
    weight
    difficulty
    charter
    charter_id
    category
    bpm
    length
    od
    hp
    sr
    cover
    bans {
      player {
        username
      }
    }
    protects {
      player {
        username
      }
    }
  }
  scores(sort: "-score", limit: -1) {
    player {
      id
    }
    map {
      id
    }
    match {
      id
      link
    }
    score
    combo
    c320
    c300
    c200
    c100
    c50
    c0
  }
}`;

    const stage$1 = writable(null);
    const mapRanking = writable(null);
    // This assumes that the list of players has been fetched from stores/core,
    // so players have to be fed in the init.
    const init$1 = async (newStage, rawPlayers) => {
        var _a;
        // Flush between stages
        stage$1.set(newStage);
        mapRanking.set(null);
        const { data } = await api('/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: query$1, variables: { stage: newStage } })
        });
        // there are at least 3 or 4 different meanings of map here please help
        const initMapPlayers = (map) => [
            map.id,
            Object.assign(Object.assign({}, map), { players: new Map() })
        ];
        const mapsMap = new Map(data.maps.map(initMapPlayers));
        const initPlayerScores = (player) => [
            player.id,
            Object.assign(Object.assign({}, player), { mapScores: new Map(data.maps.map(map => [
                    map.id,
                    []
                ])) })
        ];
        const playersMap = new Map(rawPlayers.map(initPlayerScores));
        // The fetched scores are ordered by descending score,
        // so the map leaderboards should be already sorted upon insertion.
        // Settings Map values should conserve order when doing .entries() or .values()
        data.scores.forEach((score) => {
            var _a;
            let player;
            if (player = playersMap.get((_a = score.player) === null || _a === void 0 ? void 0 : _a.id)) {
                if (!mapsMap.has(score.map.id))
                    return;
                player.mapScores.get(score.map.id).push(score);
                const mapPlayers = mapsMap.get(score.map.id).players;
                if (!mapPlayers.has(score.player.id)) {
                    mapPlayers.set(score.player.id, player);
                }
            }
        });
        // Compute map player positions
        for (const map of mapsMap.values()) {
            const mapPlayers = Array.from(map.players.values());
            for (let i = 0; i < mapPlayers.length; ++i) {
                const playerScore = mapPlayers[i].mapScores.get(map.id)[0];
                const previousPlayerScore = (_a = mapPlayers[i - 1]) === null || _a === void 0 ? void 0 : _a.mapScores.get(map.id)[0];
                playerScore.position = playerScore.score == (previousPlayerScore === null || previousPlayerScore === void 0 ? void 0 : previousPlayerScore.score) ? previousPlayerScore.position : i + 1;
            }
        }
        mapRanking.set(Array.from(mapsMap.values()));
    };

    /* src\pages\brackets\Maps.svelte generated by Svelte v3.35.0 */

    const { Map: Map_1$1, Object: Object_1$1 } = globals;

    const file$5 = "src\\pages\\brackets\\Maps.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (18:2) {:else}
    function create_else_block_1$3(ctx) {
    	let a;
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text("Matches");
    			attr_dev(a, "href", a_href_value = `#/${/*stage*/ ctx[0]}`);
    			add_location(a, file$5, 18, 4, 716);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*stage*/ 1 && a_href_value !== (a_href_value = `#/${/*stage*/ ctx[0]}`)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$3.name,
    		type: "else",
    		source: "(18:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (15:2) {#if stage == 'groups'}
    function create_if_block_2$2(ctx) {
    	let a0;
    	let t1;
    	let a1;

    	const block = {
    		c: function create() {
    			a0 = element("a");
    			a0.textContent = "Groups matches";
    			t1 = space();
    			a1 = element("a");
    			a1.textContent = "Groups results";
    			attr_dev(a0, "href", "#/groups");
    			add_location(a0, file$5, 15, 4, 611);
    			attr_dev(a1, "href", "#/groups!results");
    			add_location(a1, file$5, 16, 4, 654);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, a1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(a1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(15:2) {#if stage == 'groups'}",
    		ctx
    	});

    	return block;
    }

    // (25:0) {:else}
    function create_else_block$3(ctx) {
    	let p;
    	let each_blocks = [];
    	let each_1_lookup = new Map_1$1();
    	let current;
    	let each_value = /*$mapRanking*/ ctx[1];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*map*/ ctx[7].id;
    	validate_each_keys(ctx, each_value, get_each_context$3, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$3(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$3(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			p = element("p");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(p, "class", "maps svelte-1xsxcbi");
    			add_location(p, file$5, 25, 2, 897);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(p, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Array, $mapRanking, hiddenMaps, toggleHidden*/ 14) {
    				each_value = /*$mapRanking*/ ctx[1];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$3, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, p, outro_and_destroy_block, create_each_block$3, null, get_each_context$3);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(25:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (23:0) {#if !$mapRanking}
    function create_if_block$4(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading scores...";
    			attr_dev(p, "class", "lobbies");
    			add_location(p, file$5, 23, 2, 844);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(23:0) {#if !$mapRanking}",
    		ctx
    	});

    	return block;
    }

    // (39:4) {#if !hiddenMaps[map.id]}
    function create_if_block_1$3(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map_1$1();
    	let each_1_anchor;
    	let current;
    	let each_value_1 = Array.from(/*map*/ ctx[7].players.values());
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*player*/ ctx[10].id;
    	validate_each_keys(ctx, each_value_1, get_each_context_1$2, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$2(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1$2(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Array, $mapRanking*/ 2) {
    				each_value_1 = Array.from(/*map*/ ctx[7].players.values());
    				validate_each_argument(each_value_1);
    				group_outros();
    				validate_each_keys(ctx, each_value_1, get_each_context_1$2, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block_1$2, each_1_anchor, get_each_context_1$2);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(39:4) {#if !hiddenMaps[map.id]}",
    		ctx
    	});

    	return block;
    }

    // (40:6) {#each Array.from(map.players.values()) as player (player.id)}
    function create_each_block_1$2(key_1, ctx) {
    	let first;
    	let scorerow;
    	let current;

    	scorerow = new ScoreRow({
    			props: {
    				player: /*player*/ ctx[10],
    				score: /*player*/ ctx[10].mapScores.get(/*map*/ ctx[7].id)[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(scorerow.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(scorerow, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const scorerow_changes = {};
    			if (dirty & /*$mapRanking*/ 2) scorerow_changes.player = /*player*/ ctx[10];
    			if (dirty & /*$mapRanking*/ 2) scorerow_changes.score = /*player*/ ctx[10].mapScores.get(/*map*/ ctx[7].id)[0];
    			scorerow.$set(scorerow_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(scorerow.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(scorerow.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(scorerow, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(40:6) {#each Array.from(map.players.values()) as player (player.id)}",
    		ctx
    	});

    	return block;
    }

    // (27:2) {#each $mapRanking as map (map.id)}
    function create_each_block$3(key_1, ctx) {
    	let first;
    	let map;
    	let t0;
    	let div0;
    	let b0;
    	let t1_value = /*map*/ ctx[7].protects.length + "";
    	let t1;
    	let t2;
    	let t3_value = /*map*/ ctx[7].protects.map(func).join(", ") + "";
    	let t3;
    	let br0;
    	let t4;
    	let div1;
    	let b1;
    	let t5_value = /*map*/ ctx[7].bans.length + "";
    	let t5;
    	let t6;
    	let t7_value = /*map*/ ctx[7].bans.map(func_1$1).join(", ") + "";
    	let t7;
    	let t8;
    	let br1;
    	let t9;
    	let a;

    	let t10_value = (/*hiddenMaps*/ ctx[2][/*map*/ ctx[7].id]
    	? "Show"
    	: "Hide") + "";

    	let t10;
    	let t11;
    	let t12;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;

    	map = new Map$1({
    			props: { map: /*map*/ ctx[7] },
    			$$inline: true
    		});

    	function click_handler() {
    		return /*click_handler*/ ctx[6](/*map*/ ctx[7]);
    	}

    	let if_block = !/*hiddenMaps*/ ctx[2][/*map*/ ctx[7].id] && create_if_block_1$3(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(map.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			b0 = element("b");
    			t1 = text(t1_value);
    			t2 = text(" protects: ");
    			t3 = text(t3_value);
    			br0 = element("br");
    			t4 = space();
    			div1 = element("div");
    			b1 = element("b");
    			t5 = text(t5_value);
    			t6 = text(" bans: ");
    			t7 = text(t7_value);
    			t8 = space();
    			br1 = element("br");
    			t9 = space();
    			a = element("a");
    			t10 = text(t10_value);
    			t11 = text(" scores");
    			t12 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(b0, file$5, 29, 6, 1007);
    			add_location(br0, file$5, 29, 98, 1099);
    			attr_dev(div0, "class", "protects svelte-1xsxcbi");
    			add_location(div0, file$5, 28, 4, 977);
    			add_location(b1, file$5, 32, 6, 1149);
    			attr_dev(div1, "class", "bans svelte-1xsxcbi");
    			add_location(div1, file$5, 31, 4, 1123);
    			add_location(br1, file$5, 34, 4, 1247);
    			attr_dev(a, "href", "javascript:void(0)");
    			add_location(a, file$5, 35, 4, 1259);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(map, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, b0);
    			append_dev(b0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, t3);
    			append_dev(div0, br0);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, b1);
    			append_dev(b1, t5);
    			append_dev(div1, t6);
    			append_dev(div1, t7);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, a, anchor);
    			append_dev(a, t10);
    			append_dev(a, t11);
    			insert_dev(target, t12, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const map_changes = {};
    			if (dirty & /*$mapRanking*/ 2) map_changes.map = /*map*/ ctx[7];
    			map.$set(map_changes);
    			if ((!current || dirty & /*$mapRanking*/ 2) && t1_value !== (t1_value = /*map*/ ctx[7].protects.length + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*$mapRanking*/ 2) && t3_value !== (t3_value = /*map*/ ctx[7].protects.map(func).join(", ") + "")) set_data_dev(t3, t3_value);
    			if ((!current || dirty & /*$mapRanking*/ 2) && t5_value !== (t5_value = /*map*/ ctx[7].bans.length + "")) set_data_dev(t5, t5_value);
    			if ((!current || dirty & /*$mapRanking*/ 2) && t7_value !== (t7_value = /*map*/ ctx[7].bans.map(func_1$1).join(", ") + "")) set_data_dev(t7, t7_value);

    			if ((!current || dirty & /*hiddenMaps, $mapRanking*/ 6) && t10_value !== (t10_value = (/*hiddenMaps*/ ctx[2][/*map*/ ctx[7].id]
    			? "Show"
    			: "Hide") + "")) set_data_dev(t10, t10_value);

    			if (!/*hiddenMaps*/ ctx[2][/*map*/ ctx[7].id]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*hiddenMaps, $mapRanking*/ 6) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(map, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(t12);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(27:2) {#each $mapRanking as map (map.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let t0;
    	let a;
    	let t1;
    	let a_href_value;
    	let t2;
    	let current_block_type_index;
    	let if_block1;
    	let if_block1_anchor;
    	let current;

    	function select_block_type(ctx, dirty) {
    		if (/*stage*/ ctx[0] == "groups") return create_if_block_2$2;
    		return create_else_block_1$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	const if_block_creators = [create_if_block$4, create_else_block$3];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (!/*$mapRanking*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block0.c();
    			t0 = space();
    			a = element("a");
    			t1 = text("Roll leaderboard");
    			t2 = space();
    			if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(a, "href", a_href_value = `#/${/*stage*/ ctx[0]}!rolls`);
    			add_location(a, file$5, 20, 2, 763);
    			attr_dev(div, "class", "links svelte-1xsxcbi");
    			add_location(div, file$5, 13, 0, 559);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block0.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, a);
    			append_dev(a, t1);
    			insert_dev(target, t2, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div, t0);
    				}
    			}

    			if (!current || dirty & /*stage*/ 1 && a_href_value !== (a_href_value = `#/${/*stage*/ ctx[0]}!rolls`)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block0.d();
    			if (detaching) detach_dev(t2);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func = b => b.player.username;
    const func_1$1 = b => b.player.username;

    function instance$5($$self, $$props, $$invalidate) {
    	let $currentStage;
    	let $mapRanking;
    	let $players;
    	validate_store(stage$1, "currentStage");
    	component_subscribe($$self, stage$1, $$value => $$invalidate(4, $currentStage = $$value));
    	validate_store(mapRanking, "mapRanking");
    	component_subscribe($$self, mapRanking, $$value => $$invalidate(1, $mapRanking = $$value));
    	validate_store(players, "players");
    	component_subscribe($$self, players, $$value => $$invalidate(5, $players = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Maps", slots, []);
    	let { stage } = $$props;
    	let hiddenMaps = {};

    	const toggleHidden = map => {
    		$$invalidate(2, hiddenMaps = Object.assign(Object.assign({}, hiddenMaps), { [map.id]: !hiddenMaps[map.id] }));
    	};

    	const writable_props = ["stage"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Maps> was created with unknown prop '${key}'`);
    	});

    	const click_handler = map => toggleHidden(map);

    	$$self.$$set = $$props => {
    		if ("stage" in $$props) $$invalidate(0, stage = $$props.stage);
    	};

    	$$self.$capture_state = () => ({
    		Map: Map$1,
    		ScoreRow,
    		players,
    		currentStage: stage$1,
    		mapRanking,
    		init: init$1,
    		stage,
    		hiddenMaps,
    		toggleHidden,
    		$currentStage,
    		$mapRanking,
    		$players
    	});

    	$$self.$inject_state = $$props => {
    		if ("stage" in $$props) $$invalidate(0, stage = $$props.stage);
    		if ("hiddenMaps" in $$props) $$invalidate(2, hiddenMaps = $$props.hiddenMaps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$currentStage, stage, $mapRanking, $players*/ 51) {
    			if (($currentStage != stage || !$mapRanking) && $players) init$1(stage, $players);
    		}
    	};

    	return [
    		stage,
    		$mapRanking,
    		hiddenMaps,
    		toggleHidden,
    		$currentStage,
    		$players,
    		click_handler
    	];
    }

    class Maps extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$7(this, options, instance$5, create_fragment$5, safe_not_equal, { stage: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Maps",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*stage*/ ctx[0] === undefined && !("stage" in props)) {
    			console.warn("<Maps> was created without expected prop 'stage'");
    		}
    	}

    	get stage() {
    		throw new Error("<Maps>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set stage(value) {
    		throw new Error("<Maps>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var query = `query GetRolls($stage: String!) {
  rolls(
    filter: {
      match: {
        stage: {
          slug: {
            _eq: $stage
          }
        }
      }
    }
    sort: "-value"
    limit: -1
  ) {
    player {
      id
      username
    }
    value
  }
}`;

    const stage = writable(null);
    const rolls = writable(null);
    const init = async (newStage) => {
        const { data } = await api('/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query, variables: { stage: newStage } })
        });
        rolls.set(data.rolls);
    };

    /* src\pages\brackets\Rolls.svelte generated by Svelte v3.35.0 */
    const file$4 = "src\\pages\\brackets\\Rolls.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (11:2) {:else}
    function create_else_block_1$2(ctx) {
    	let a;
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text("Matches");
    			attr_dev(a, "href", a_href_value = `#/${/*stage*/ ctx[0]}`);
    			add_location(a, file$4, 11, 4, 350);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*stage*/ 1 && a_href_value !== (a_href_value = `#/${/*stage*/ ctx[0]}`)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$2.name,
    		type: "else",
    		source: "(11:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (8:2) {#if stage == 'groups'}
    function create_if_block_1$2(ctx) {
    	let a0;
    	let t1;
    	let a1;

    	const block = {
    		c: function create() {
    			a0 = element("a");
    			a0.textContent = "Groups matches";
    			t1 = space();
    			a1 = element("a");
    			a1.textContent = "Groups results";
    			attr_dev(a0, "href", "#/groups");
    			add_location(a0, file$4, 8, 4, 245);
    			attr_dev(a1, "href", "#/groups!results");
    			add_location(a1, file$4, 9, 4, 288);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, a1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(a1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(8:2) {#if stage == 'groups'}",
    		ctx
    	});

    	return block;
    }

    // (19:0) {:else}
    function create_else_block$2(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let each_1_anchor;
    	let each_value = /*$rolls*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Player";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Roll";
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(div0, "class", "player svelte-gqvsl7");
    			add_location(div0, file$4, 20, 4, 533);
    			attr_dev(div1, "class", "cell svelte-gqvsl7");
    			add_location(div1, file$4, 21, 4, 571);
    			attr_dev(div2, "class", "row header svelte-gqvsl7");
    			add_location(div2, file$4, 19, 2, 503);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			insert_dev(target, t3, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$rolls*/ 2) {
    				each_value = /*$rolls*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t3);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(19:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (17:0) {#if !$rolls}
    function create_if_block$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading rolls...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(17:0) {#if !$rolls}",
    		ctx
    	});

    	return block;
    }

    // (24:2) {#each $rolls as roll}
    function create_each_block$2(ctx) {
    	let div2;
    	let div0;
    	let a;
    	let t0_value = /*roll*/ ctx[3].player.username + "";
    	let t0;
    	let a_href_value;
    	let t1;
    	let div1;
    	let t2_value = /*roll*/ ctx[3].value + "";
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			t2 = text(t2_value);
    			t3 = space();
    			attr_dev(a, "href", a_href_value = `https://osu.ppy.sh/users/${/*roll*/ ctx[3].player.id}`);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noopener");
    			add_location(a, file$4, 26, 8, 696);
    			attr_dev(div0, "class", "player svelte-gqvsl7");
    			add_location(div0, file$4, 25, 6, 666);
    			attr_dev(div1, "class", "cell svelte-gqvsl7");
    			add_location(div1, file$4, 30, 6, 852);
    			attr_dev(div2, "class", "row svelte-gqvsl7");
    			add_location(div2, file$4, 24, 4, 641);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, a);
    			append_dev(a, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, t2);
    			append_dev(div2, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$rolls*/ 2 && t0_value !== (t0_value = /*roll*/ ctx[3].player.username + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*$rolls*/ 2 && a_href_value !== (a_href_value = `https://osu.ppy.sh/users/${/*roll*/ ctx[3].player.id}`)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*$rolls*/ 2 && t2_value !== (t2_value = /*roll*/ ctx[3].value + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(24:2) {#each $rolls as roll}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let t0;
    	let a;
    	let t1;
    	let a_href_value;
    	let t2;
    	let if_block1_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*stage*/ ctx[0] == "groups") return create_if_block_1$2;
    		return create_else_block_1$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (!/*$rolls*/ ctx[1]) return create_if_block$3;
    		return create_else_block$2;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block0.c();
    			t0 = space();
    			a = element("a");
    			t1 = text("Rankings per map");
    			t2 = space();
    			if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(a, "href", a_href_value = `#/${/*stage*/ ctx[0]}!maps`);
    			add_location(a, file$4, 13, 2, 397);
    			attr_dev(div, "class", "links svelte-gqvsl7");
    			add_location(div, file$4, 6, 0, 193);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block0.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, a);
    			append_dev(a, t1);
    			insert_dev(target, t2, anchor);
    			if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div, t0);
    				}
    			}

    			if (dirty & /*stage*/ 1 && a_href_value !== (a_href_value = `#/${/*stage*/ ctx[0]}!maps`)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block0.d();
    			if (detaching) detach_dev(t2);
    			if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $rolls;
    	let $currentStage;
    	validate_store(rolls, "rolls");
    	component_subscribe($$self, rolls, $$value => $$invalidate(1, $rolls = $$value));
    	validate_store(stage, "currentStage");
    	component_subscribe($$self, stage, $$value => $$invalidate(2, $currentStage = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Rolls", slots, []);
    	let { stage: stage$1 } = $$props;
    	if (!$rolls || $currentStage != stage$1) init(stage$1);
    	const writable_props = ["stage"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Rolls> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("stage" in $$props) $$invalidate(0, stage$1 = $$props.stage);
    	};

    	$$self.$capture_state = () => ({
    		currentStage: stage,
    		rolls,
    		init,
    		stage: stage$1,
    		$rolls,
    		$currentStage
    	});

    	$$self.$inject_state = $$props => {
    		if ("stage" in $$props) $$invalidate(0, stage$1 = $$props.stage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [stage$1, $rolls];
    }

    class Rolls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$7(this, options, instance$4, create_fragment$4, safe_not_equal, { stage: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Rolls",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*stage*/ ctx[0] === undefined && !("stage" in props)) {
    			console.warn("<Rolls> was created without expected prop 'stage'");
    		}
    	}

    	get stage() {
    		throw new Error("<Rolls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set stage(value) {
    		throw new Error("<Rolls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\pages\staff\ScuffedDrawing.svelte generated by Svelte v3.35.0 */

    const file$3 = "src\\pages\\staff\\ScuffedDrawing.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[13] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    function get_each_context_2$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	child_ctx[13] = i;
    	return child_ctx;
    }

    function get_each_context_3$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	child_ctx[20] = i;
    	return child_ctx;
    }

    // (52:6) {#each group as player, j}
    function create_each_block_3$1(ctx) {
    	let div;
    	let t_value = /*player*/ ctx[14].username + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "player");
    			add_location(div, file$3, 52, 8, 2486);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*groups*/ 1 && t_value !== (t_value = /*player*/ ctx[14].username + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3$1.name,
    		type: "each",
    		source: "(52:6) {#each group as player, j}",
    		ctx
    	});

    	return block;
    }

    // (49:2) {#each groups as group, i}
    function create_each_block_2$1(ctx) {
    	let div;
    	let h3;
    	let t0;
    	let t1_value = /*i*/ ctx[13] + 1 + "";
    	let t1;
    	let t2;
    	let t3;
    	let each_value_3 = /*group*/ ctx[17];
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3$1(get_each_context_3$1(ctx, each_value_3, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			t0 = text("Group ");
    			t1 = text(t1_value);
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			add_location(h3, file$3, 50, 6, 2422);
    			attr_dev(div, "class", "group svelte-c6gifs");
    			toggle_class(div, "active", /*currentGroup*/ ctx[2] == /*i*/ ctx[13]);
    			add_location(div, file$3, 49, 4, 2362);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			append_dev(div, t2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*groups*/ 1) {
    				each_value_3 = /*group*/ ctx[17];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3$1(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t3);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}

    			if (dirty & /*currentGroup*/ 4) {
    				toggle_class(div, "active", /*currentGroup*/ ctx[2] == /*i*/ ctx[13]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$1.name,
    		type: "each",
    		source: "(49:2) {#each groups as group, i}",
    		ctx
    	});

    	return block;
    }

    // (61:2) {#if spotlight}
    function create_if_block$2(ctx) {
    	let qualifierplayer;
    	let current;

    	qualifierplayer = new QualifierPlayer({
    			props: {
    				position: /*spotlight*/ ctx[1].position,
    				player: /*spotlight*/ ctx[1],
    				maps: /*$regularMapRanking*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(qualifierplayer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(qualifierplayer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const qualifierplayer_changes = {};
    			if (dirty & /*spotlight*/ 2) qualifierplayer_changes.position = /*spotlight*/ ctx[1].position;
    			if (dirty & /*spotlight*/ 2) qualifierplayer_changes.player = /*spotlight*/ ctx[1];
    			if (dirty & /*$regularMapRanking*/ 16) qualifierplayer_changes.maps = /*$regularMapRanking*/ ctx[4];
    			qualifierplayer.$set(qualifierplayer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(qualifierplayer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(qualifierplayer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(qualifierplayer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(61:2) {#if spotlight}",
    		ctx
    	});

    	return block;
    }

    // (64:2) <Button on:click={roll}>
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Roll");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(64:2) <Button on:click={roll}>",
    		ctx
    	});

    	return block;
    }

    // (71:6) {#each seed as player (player.id)}
    function create_each_block_1$1(key_1, ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "alt", "");
    			if (img.src !== (img_src_value = /*player*/ ctx[14].avatar)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-c6gifs");
    			add_location(img, file$3, 71, 8, 3013);
    			this.first = img;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*seeds*/ 8 && img.src !== (img_src_value = /*player*/ ctx[14].avatar)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(71:6) {#each seed as player (player.id)}",
    		ctx
    	});

    	return block;
    }

    // (68:2) {#each seeds as seed, i}
    function create_each_block$1(ctx) {
    	let div;
    	let h3;
    	let t0_value = ["Top", "High", "Low", "Bottom"][/*i*/ ctx[13]] + "";
    	let t0;
    	let t1;
    	let t2;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t3;
    	let each_value_1 = /*seed*/ ctx[11];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*player*/ ctx[14].id;
    	validate_each_keys(ctx, each_value_1, get_each_context_1$1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = text(" seed");
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			add_location(h3, file$3, 69, 6, 2910);
    			attr_dev(div, "class", "seed svelte-c6gifs");
    			add_location(div, file$3, 68, 4, 2884);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			append_dev(div, t2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*seeds*/ 8) {
    				each_value_1 = /*seed*/ ctx[11];
    				validate_each_argument(each_value_1);
    				validate_each_keys(ctx, each_value_1, get_each_context_1$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, div, destroy_block, create_each_block_1$1, t3, get_each_context_1$1);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(68:2) {#each seeds as seed, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let b;
    	let t2;
    	let t3_value = /*currentGroup*/ ctx[2] + 1 + "";
    	let t3;
    	let t4;
    	let t5;
    	let button0;
    	let t6;
    	let div2;
    	let t7;
    	let button1;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_2 = /*groups*/ ctx[0];
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2$1(get_each_context_2$1(ctx, each_value_2, i));
    	}

    	let if_block = /*spotlight*/ ctx[1] && create_if_block$2(ctx);

    	button0 = new Button({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*roll*/ ctx[5]);
    	let each_value = /*seeds*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t0 = space();
    			div1 = element("div");
    			t1 = text("Current group: ");
    			b = element("b");
    			t2 = text("Group ");
    			t3 = text(t3_value);
    			t4 = space();
    			if (if_block) if_block.c();
    			t5 = space();
    			create_component(button0.$$.fragment);
    			t6 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t7 = space();
    			button1 = element("button");
    			button1.textContent = "panic";
    			attr_dev(div0, "class", "groups svelte-c6gifs");
    			add_location(div0, file$3, 47, 0, 2306);
    			add_location(b, file$3, 59, 17, 2621);
    			attr_dev(div1, "class", "spotlight svelte-c6gifs");
    			add_location(div1, file$3, 58, 0, 2579);
    			attr_dev(div2, "class", "seeds svelte-c6gifs");
    			add_location(div2, file$3, 66, 0, 2831);
    			add_location(button1, file$3, 77, 0, 3097);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t1);
    			append_dev(div1, b);
    			append_dev(b, t2);
    			append_dev(b, t3);
    			append_dev(div1, t4);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t5);
    			mount_component(button0, div1, null);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div2, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			insert_dev(target, t7, anchor);
    			insert_dev(target, button1, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button1, "click", /*click_handler*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*currentGroup, groups*/ 5) {
    				each_value_2 = /*groups*/ ctx[0];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$1(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if ((!current || dirty & /*currentGroup*/ 4) && t3_value !== (t3_value = /*currentGroup*/ ctx[2] + 1 + "")) set_data_dev(t3, t3_value);

    			if (/*spotlight*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*spotlight*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div1, t5);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 2097152) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);

    			if (dirty & /*seeds*/ 8) {
    				each_value = /*seeds*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(button0.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(button0.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			destroy_component(button0);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(button1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let seeds;
    	let $regularPlayerRanking;
    	let $players;
    	let $regularMapRanking;
    	validate_store(regularPlayerRanking, "regularPlayerRanking");
    	component_subscribe($$self, regularPlayerRanking, $$value => $$invalidate(7, $regularPlayerRanking = $$value));
    	validate_store(players, "players");
    	component_subscribe($$self, players, $$value => $$invalidate(8, $players = $$value));
    	validate_store(regularMapRanking, "regularMapRanking");
    	component_subscribe($$self, regularMapRanking, $$value => $$invalidate(4, $regularMapRanking = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ScuffedDrawing", slots, []);

    	let groups = new Array(32).fill(0).map(() => [
    		{ id: "", username: "-" },
    		{ id: "", username: "-" },
    		{ id: "", username: "-" },
    		{ id: "", username: "-" }
    	]);

    	let selectedPlayers = new Set();
    	let spotlight;
    	let currentGroup = 0;

    	const roll = () => {
    		const seed = seeds.find(s => s.length);
    		const player = seed[Math.random() * seed.length >> 0];
    		$$invalidate(1, spotlight = player);
    		$$invalidate(6, selectedPlayers = new Set([...selectedPlayers, player.id]));
    		$$invalidate(0, groups[currentGroup][groups[currentGroup].findIndex(x => x.username == "-")] = { id: player.id, username: player.username }, groups);
    		localStorage.setItem("groups", JSON.stringify(groups));
    		localStorage.setItem("selectedPlayers", JSON.stringify(Array.from(selectedPlayers.values())));
    		$$invalidate(2, currentGroup = currentGroup == 31 ? 0 : currentGroup + 1);
    	};

    	const removePlayer = (i, j) => {
    		selectedPlayers.delete(groups[i][j].id);
    		$$invalidate(6, selectedPlayers = new Set([...selectedPlayers]));
    		$$invalidate(0, groups[i][j] = { id: "", username: "-" }, groups);
    		localStorage.setItem("groups", JSON.stringify(groups));
    		localStorage.setItem("selectedPlayers", JSON.stringify(Array.from(selectedPlayers.values())));
    	};

    	onMount(() => {
    		const storedGroups = localStorage.getItem("groups");

    		if (storedGroups) {
    			$$invalidate(0, groups = JSON.parse(storedGroups));
    		}

    		const storedPlayers = localStorage.getItem("selectedPlayers");

    		if (storedPlayers) {
    			const players = JSON.parse(storedPlayers);
    			players.forEach(p => selectedPlayers.add(p));
    		}
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ScuffedDrawing> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		localStorage.clear();
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Button,
    		QualifierPlayer,
    		players,
    		regularMapRanking,
    		regularPlayerRanking,
    		init: init$5,
    		groups,
    		selectedPlayers,
    		spotlight,
    		currentGroup,
    		roll,
    		removePlayer,
    		$regularPlayerRanking,
    		$players,
    		seeds,
    		$regularMapRanking
    	});

    	$$self.$inject_state = $$props => {
    		if ("groups" in $$props) $$invalidate(0, groups = $$props.groups);
    		if ("selectedPlayers" in $$props) $$invalidate(6, selectedPlayers = $$props.selectedPlayers);
    		if ("spotlight" in $$props) $$invalidate(1, spotlight = $$props.spotlight);
    		if ("currentGroup" in $$props) $$invalidate(2, currentGroup = $$props.currentGroup);
    		if ("seeds" in $$props) $$invalidate(3, seeds = $$props.seeds);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$regularPlayerRanking, $players*/ 384) {
    			if (!$regularPlayerRanking && $players) init$5($players);
    		}

    		if ($$self.$$.dirty & /*$regularPlayerRanking, selectedPlayers*/ 192) {
    			$$invalidate(3, seeds = $regularPlayerRanking
    			? [
    					$regularPlayerRanking.slice(0, 32).filter(p => !selectedPlayers.has(p.id)),
    					$regularPlayerRanking.slice(32, 64).filter(p => !selectedPlayers.has(p.id)),
    					$regularPlayerRanking.slice(64, 96).filter(p => !selectedPlayers.has(p.id)),
    					$regularPlayerRanking.slice(96, 128).filter(p => !selectedPlayers.has(p.id))
    				]
    			: []);
    		}
    	};

    	return [
    		groups,
    		spotlight,
    		currentGroup,
    		seeds,
    		$regularMapRanking,
    		roll,
    		selectedPlayers,
    		$regularPlayerRanking,
    		$players,
    		click_handler
    	];
    }

    class ScuffedDrawing extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$7(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ScuffedDrawing",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\components\atoms\MatchFeed.svelte generated by Svelte v3.35.0 */

    const file$2 = "src\\components\\atoms\\MatchFeed.svelte";

    function create_fragment$2(ctx) {
    	let textarea;
    	let textarea_value_value;

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			textarea.readOnly = true;

    			textarea.value = textarea_value_value = `${/*stage*/ ctx[1].name}: M${/*match*/ ctx[0].id}
${/*boldIf*/ ctx[2](`${/*match*/ ctx[0].players[0].player.username} ${/*match*/ ctx[0].points1}`, /*match*/ ctx[0].points1 == /*winCondition*/ ctx[3])} | ${/*boldIf*/ ctx[2](`${/*match*/ ctx[0].points2} ${/*match*/ ctx[0].players[1].player.username}`, /*match*/ ctx[0].points2 == /*winCondition*/ ctx[3])}
Rolls: ${/*match*/ ctx[0].rolls.map(/*func*/ ctx[4]).join(" | ")}

Protects:
${/*match*/ ctx[0].protects.map(func_1).join("\n")}

Bans:
${/*match*/ ctx[0].bans.map(func_2).join("\n")}

MP Link: ${/*match*/ ctx[0].link}`;

    			attr_dev(textarea, "class", "svelte-1you0l4");
    			add_location(textarea, file$2, 7, 0, 192);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, textarea, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*stage, match*/ 3 && textarea_value_value !== (textarea_value_value = `${/*stage*/ ctx[1].name}: M${/*match*/ ctx[0].id}
${/*boldIf*/ ctx[2](`${/*match*/ ctx[0].players[0].player.username} ${/*match*/ ctx[0].points1}`, /*match*/ ctx[0].points1 == /*winCondition*/ ctx[3])} | ${/*boldIf*/ ctx[2](`${/*match*/ ctx[0].points2} ${/*match*/ ctx[0].players[1].player.username}`, /*match*/ ctx[0].points2 == /*winCondition*/ ctx[3])}
Rolls: ${/*match*/ ctx[0].rolls.map(/*func*/ ctx[4]).join(" | ")}

Protects:
${/*match*/ ctx[0].protects.map(func_1).join("\n")}

Bans:
${/*match*/ ctx[0].bans.map(func_2).join("\n")}

MP Link: ${/*match*/ ctx[0].link}`)) {
    				prop_dev(textarea, "value", textarea_value_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(textarea);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func_1 = protect => `${protect.player.username}: [${protect.map.category}] ${protect.map.name}`;
    const func_2 = ban => `${ban.player.username}: [${ban.map.category}] ${ban.map.name}`;

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("MatchFeed", slots, []);
    	
    	let { match } = $$props;
    	let { stage } = $$props;
    	const boldIf = (str, condition) => condition ? `**${str}**` : str;
    	const winCondition = 1 + (stage.best_of / 2 >> 0);
    	const writable_props = ["match", "stage"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MatchFeed> was created with unknown prop '${key}'`);
    	});

    	const func = (roll, i) => boldIf(roll.value, roll.value > match.rolls[(i + 1) % 2]?.value);

    	$$self.$$set = $$props => {
    		if ("match" in $$props) $$invalidate(0, match = $$props.match);
    		if ("stage" in $$props) $$invalidate(1, stage = $$props.stage);
    	};

    	$$self.$capture_state = () => ({ match, stage, boldIf, winCondition });

    	$$self.$inject_state = $$props => {
    		if ("match" in $$props) $$invalidate(0, match = $$props.match);
    		if ("stage" in $$props) $$invalidate(1, stage = $$props.stage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [match, stage, boldIf, winCondition, func];
    }

    class MatchFeed extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$7(this, options, instance$2, create_fragment$2, safe_not_equal, { match: 0, stage: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MatchFeed",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*match*/ ctx[0] === undefined && !("match" in props)) {
    			console.warn("<MatchFeed> was created without expected prop 'match'");
    		}

    		if (/*stage*/ ctx[1] === undefined && !("stage" in props)) {
    			console.warn("<MatchFeed> was created without expected prop 'stage'");
    		}
    	}

    	get match() {
    		throw new Error("<MatchFeed>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set match(value) {
    		throw new Error("<MatchFeed>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get stage() {
    		throw new Error("<MatchFeed>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set stage(value) {
    		throw new Error("<MatchFeed>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\pages\staff\RefereeHelper.svelte generated by Svelte v3.35.0 */

    const { Map: Map_1, Object: Object_1 } = globals;
    const file$1 = "src\\pages\\staff\\RefereeHelper.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[113] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[44] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[113] = list[i];
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[113] = list[i];
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[113] = list[i];
    	return child_ctx;
    }

    function get_each_context_6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[113] = list[i];
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[110] = list[i];
    	return child_ctx;
    }

    // (299:0) {:else}
    function create_else_block$1(ctx) {
    	let div19;
    	let a0;
    	let t1;
    	let center0;
    	let matchfeed;
    	let t2;
    	let center1;
    	let br0;
    	let br1;
    	let t3;
    	let a1;
    	let t4;
    	let a1_href_value;
    	let t5;
    	let br2;
    	let br3;
    	let t6;
    	let div5;
    	let div0;
    	let t7;
    	let t8;
    	let div1;
    	let img0;
    	let img0_src_value;
    	let t9;
    	let a2;
    	let t10_value = /*selectedMatch*/ ctx[3].players[0].player.username + "";
    	let t10;
    	let t11;
    	let t12_value = /*selectedMatch*/ ctx[3].players[0].player.seed + "";
    	let t12;
    	let t13;
    	let a2_href_value;
    	let t14;
    	let div2;
    	let t16;
    	let div3;
    	let img1;
    	let img1_src_value;
    	let t17;
    	let a3;
    	let t18_value = /*selectedMatch*/ ctx[3].players[1].player.username + "";
    	let t18;
    	let t19;
    	let t20_value = /*selectedMatch*/ ctx[3].players[1].player.seed + "";
    	let t20;
    	let t21;
    	let a3_href_value;
    	let t22;
    	let div4;
    	let t23;
    	let t24;
    	let center2;
    	let t25;
    	let t26;
    	let t27;
    	let t28;
    	let t29;
    	let br4;
    	let t30;

    	let t31_value = (/*riceCount*/ ctx[33] < /*lnCount*/ ctx[34]
    	? "Tiebreaker (rice)"
    	: "Tiebreaker (hybrid)") + "";

    	let t31;
    	let t32;
    	let div12;
    	let t33;
    	let div6;
    	let input0;
    	let input0_value_value;
    	let t34;
    	let a4;
    	let t36;
    	let div7;
    	let input1;
    	let t37;
    	let a5;
    	let t39;
    	let div8;
    	let input2;
    	let t40;
    	let a6;
    	let t42;
    	let div9;
    	let input3;
    	let input3_value_value;
    	let t43;
    	let a7;
    	let t45;
    	let div10;
    	let input4;
    	let input4_value_value;
    	let t46;
    	let a8;
    	let t48;
    	let div11;
    	let input5;
    	let input5_value_value;
    	let t49;
    	let a9;
    	let t51;
    	let t52;
    	let div16;
    	let center3;
    	let t53;
    	let br5;
    	let t54;
    	let t55;
    	let div13;
    	let input6;
    	let t56;
    	let input7;
    	let t57;
    	let div14;
    	let input8;
    	let input8_value_value;
    	let t58;
    	let a10;
    	let t60;
    	let div15;
    	let input9;
    	let input9_value_value;
    	let t61;
    	let a11;
    	let t63;
    	let div18;
    	let t64;
    	let div17;
    	let input10;
    	let t65;
    	let a12;
    	let t67;
    	let t68;
    	let current_block_type_index;
    	let if_block2;
    	let t69;
    	let current_block_type_index_1;
    	let if_block3;
    	let t70;
    	let hr0;
    	let t71;
    	let current_block_type_index_2;
    	let if_block4;
    	let t72;
    	let current_block_type_index_3;
    	let if_block5;
    	let t73;
    	let hr1;
    	let t74;
    	let t75;
    	let t76;
    	let t77;
    	let current;
    	let mounted;
    	let dispose;

    	matchfeed = new MatchFeed({
    			props: {
    				match: /*selectedMatch*/ ctx[3],
    				stage: /*stage*/ ctx[0]
    			},
    			$$inline: true
    		});

    	function select_block_type_1(ctx, dirty) {
    		if (/*selectedMatch*/ ctx[3].link) return create_if_block_30;
    		return create_else_block_5;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_2(ctx, dirty) {
    		if (/*selectedMatch*/ ctx[3].rolls.length) return create_if_block_29;
    		return create_else_block_4;
    	}

    	let current_block_type_1 = select_block_type_2(ctx);
    	let if_block1 = current_block_type_1(ctx);
    	const if_block_creators = [create_if_block_26, create_if_block_27];
    	const if_blocks = [];

    	function select_block_type_3(ctx, dirty) {
    		if (/*selectedMatch*/ ctx[3].protects[0]) return 0;
    		if (/*selectedMatch*/ ctx[3].rolls[1]) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type_3(ctx))) {
    		if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const if_block_creators_1 = [create_if_block_22, create_if_block_23];
    	const if_blocks_1 = [];

    	function select_block_type_4(ctx, dirty) {
    		if (/*selectedMatch*/ ctx[3].protects[1]) return 0;
    		if (/*selectedMatch*/ ctx[3].protects[0]) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index_1 = select_block_type_4(ctx))) {
    		if_block3 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    	}

    	const if_block_creators_2 = [create_if_block_18, create_if_block_19];
    	const if_blocks_2 = [];

    	function select_block_type_6(ctx, dirty) {
    		if (/*selectedMatch*/ ctx[3].bans[0]) return 0;
    		if (/*selectedMatch*/ ctx[3].protects[1]) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index_2 = select_block_type_6(ctx))) {
    		if_block4 = if_blocks_2[current_block_type_index_2] = if_block_creators_2[current_block_type_index_2](ctx);
    	}

    	const if_block_creators_3 = [create_if_block_14$1, create_if_block_15$1];
    	const if_blocks_3 = [];

    	function select_block_type_8(ctx, dirty) {
    		if (/*selectedMatch*/ ctx[3].bans[1]) return 0;
    		if (/*selectedMatch*/ ctx[3].bans[0]) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index_3 = select_block_type_8(ctx))) {
    		if_block5 = if_blocks_3[current_block_type_index_3] = if_block_creators_3[current_block_type_index_3](ctx);
    	}

    	let if_block6 = /*selectedMatch*/ ctx[3].bans[1] && create_if_block_8$1(ctx);
    	let if_block7 = /*points1*/ ctx[4] == /*winCondition*/ ctx[1] - 1 && /*points2*/ ctx[5] == /*winCondition*/ ctx[1] - 1 && !/*scorePending*/ ctx[35] && create_if_block_6$1(ctx);
    	let if_block8 = /*points1*/ ctx[4] >= /*winCondition*/ ctx[1] && create_if_block_5$1(ctx);
    	let if_block9 = /*points2*/ ctx[5] >= /*winCondition*/ ctx[1] && create_if_block_4$1(ctx);

    	const block = {
    		c: function create() {
    			div19 = element("div");
    			a0 = element("a");
    			a0.textContent = "Back to matches";
    			t1 = space();
    			center0 = element("center");
    			create_component(matchfeed.$$.fragment);
    			t2 = space();
    			center1 = element("center");
    			br0 = element("br");
    			br1 = element("br");
    			t3 = space();
    			a1 = element("a");
    			t4 = text("Emergency match editing link if you make a tremendous mistake");
    			t5 = space();
    			br2 = element("br");
    			br3 = element("br");
    			t6 = space();
    			div5 = element("div");
    			div0 = element("div");
    			t7 = text(/*points1*/ ctx[4]);
    			t8 = space();
    			div1 = element("div");
    			img0 = element("img");
    			t9 = space();
    			a2 = element("a");
    			t10 = text(t10_value);
    			t11 = text(" (#");
    			t12 = text(t12_value);
    			t13 = text(")");
    			t14 = space();
    			div2 = element("div");
    			div2.textContent = "vs.";
    			t16 = space();
    			div3 = element("div");
    			img1 = element("img");
    			t17 = space();
    			a3 = element("a");
    			t18 = text(t18_value);
    			t19 = text(" (#");
    			t20 = text(t20_value);
    			t21 = text(")");
    			t22 = space();
    			div4 = element("div");
    			t23 = text(/*points2*/ ctx[5]);
    			t24 = space();
    			center2 = element("center");
    			t25 = text("Weighted counts: ");
    			t26 = text(/*riceCount*/ ctx[33]);
    			t27 = text(" rice vs. ");
    			t28 = text(/*lnCount*/ ctx[34]);
    			t29 = text(" LN+Hybrid");
    			br4 = element("br");
    			t30 = text("\r\n    Current tiebreaker: ");
    			t31 = text(t31_value);
    			t32 = space();
    			div12 = element("div");
    			t33 = text("Create and prepare your lobby\r\n    ");
    			div6 = element("div");
    			input0 = element("input");
    			t34 = space();
    			a4 = element("a");
    			a4.textContent = "📝 Copy";
    			t36 = space();
    			div7 = element("div");
    			input1 = element("input");
    			t37 = space();
    			a5 = element("a");
    			a5.textContent = "📝 Copy";
    			t39 = space();
    			div8 = element("div");
    			input2 = element("input");
    			t40 = space();
    			a6 = element("a");
    			a6.textContent = "📝 Copy";
    			t42 = space();
    			div9 = element("div");
    			input3 = element("input");
    			t43 = space();
    			a7 = element("a");
    			a7.textContent = "📝 Copy";
    			t45 = space();
    			div10 = element("div");
    			input4 = element("input");
    			t46 = space();
    			a8 = element("a");
    			a8.textContent = "📝 Copy";
    			t48 = space();
    			div11 = element("div");
    			input5 = element("input");
    			t49 = space();
    			a9 = element("a");
    			a9.textContent = "📝 Copy";
    			t51 = space();
    			if_block0.c();
    			t52 = space();
    			div16 = element("div");
    			center3 = element("center");
    			t53 = text("Warmup rules: 4 minutes max, non-offensive");
    			br5 = element("br");
    			t54 = text("\r\n      Ask for them 30 minutes in advance");
    			t55 = space();
    			div13 = element("div");
    			input6 = element("input");
    			t56 = space();
    			input7 = element("input");
    			t57 = space();
    			div14 = element("div");
    			input8 = element("input");
    			t58 = space();
    			a10 = element("a");
    			a10.textContent = "📝 Copy";
    			t60 = space();
    			div15 = element("div");
    			input9 = element("input");
    			t61 = space();
    			a11 = element("a");
    			a11.textContent = "📝 Copy";
    			t63 = space();
    			div18 = element("div");
    			t64 = text("Rolls\r\n    ");
    			div17 = element("div");
    			input10 = element("input");
    			t65 = space();
    			a12 = element("a");
    			a12.textContent = "📝 Copy";
    			t67 = space();
    			if_block1.c();
    			t68 = space();
    			if (if_block2) if_block2.c();
    			t69 = space();
    			if (if_block3) if_block3.c();
    			t70 = space();
    			hr0 = element("hr");
    			t71 = space();
    			if (if_block4) if_block4.c();
    			t72 = space();
    			if (if_block5) if_block5.c();
    			t73 = space();
    			hr1 = element("hr");
    			t74 = space();
    			if (if_block6) if_block6.c();
    			t75 = space();
    			if (if_block7) if_block7.c();
    			t76 = space();
    			if (if_block8) if_block8.c();
    			t77 = space();
    			if (if_block9) if_block9.c();
    			attr_dev(a0, "href", "#/referee!helper");
    			add_location(a0, file$1, 300, 2, 11269);
    			add_location(center0, file$1, 302, 2, 11362);
    			add_location(br0, file$1, 307, 4, 11452);
    			add_location(br1, file$1, 307, 10, 11458);
    			attr_dev(a1, "href", a1_href_value = `https://api.mbs3.fightthe.pw/admin/collections/matches/${/*selectedMatch*/ ctx[3].id}`);
    			attr_dev(a1, "target", "_blank");
    			add_location(a1, file$1, 308, 4, 11470);
    			add_location(br2, file$1, 309, 4, 11644);
    			add_location(br3, file$1, 309, 10, 11650);
    			add_location(center1, file$1, 306, 2, 11438);
    			attr_dev(div0, "class", "points svelte-htbg4y");
    			add_location(div0, file$1, 313, 4, 11702);
    			attr_dev(img0, "alt", "");
    			if (img0.src !== (img0_src_value = /*selectedMatch*/ ctx[3].players[0].player.avatar)) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "class", "svelte-htbg4y");
    			add_location(img0, file$1, 315, 6, 11771);
    			attr_dev(a2, "href", a2_href_value = `https://osu.ppy.sh/users/${/*selectedMatch*/ ctx[3].players[0].player.id}`);
    			add_location(a2, file$1, 316, 6, 11838);
    			attr_dev(div1, "class", "player svelte-htbg4y");
    			add_location(div1, file$1, 314, 4, 11743);
    			attr_dev(div2, "class", "vs svelte-htbg4y");
    			add_location(div2, file$1, 318, 4, 12019);
    			attr_dev(img1, "alt", "");
    			if (img1.src !== (img1_src_value = /*selectedMatch*/ ctx[3].players[1].player.avatar)) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "class", "svelte-htbg4y");
    			add_location(img1, file$1, 320, 6, 12078);
    			attr_dev(a3, "href", a3_href_value = `https://osu.ppy.sh/users/${/*selectedMatch*/ ctx[3].players[1].player.id}`);
    			add_location(a3, file$1, 321, 6, 12145);
    			attr_dev(div3, "class", "player svelte-htbg4y");
    			add_location(div3, file$1, 319, 4, 12050);
    			attr_dev(div4, "class", "points svelte-htbg4y");
    			add_location(div4, file$1, 323, 4, 12326);
    			attr_dev(div5, "class", "players svelte-htbg4y");
    			add_location(div5, file$1, 312, 2, 11675);
    			add_location(br4, file$1, 327, 61, 12462);
    			attr_dev(center2, "class", "picks svelte-htbg4y");
    			add_location(center2, file$1, 326, 2, 12377);
    			input0.readOnly = true;
    			input0.value = input0_value_value = `!mp make MBS3: (${/*selectedMatch*/ ctx[3].players[0].player.username}) vs. (${/*selectedMatch*/ ctx[3].players[1].player.username})`;
    			attr_dev(input0, "class", "svelte-htbg4y");
    			add_location(input0, file$1, 334, 6, 12652);
    			attr_dev(a4, "href", "#/referee!helper");
    			attr_dev(a4, "class", "copy");
    			add_location(a4, file$1, 335, 6, 12817);
    			add_location(div6, file$1, 333, 4, 12639);
    			input1.readOnly = true;
    			input1.value = "!mp set 0 3 3";
    			attr_dev(input1, "class", "svelte-htbg4y");
    			add_location(input1, file$1, 338, 6, 12928);
    			attr_dev(a5, "href", "#/referee!helper");
    			attr_dev(a5, "class", "copy");
    			add_location(a5, file$1, 339, 6, 12994);
    			add_location(div7, file$1, 337, 4, 12915);
    			input2.readOnly = true;
    			input2.value = "!mp mods Freemod";
    			attr_dev(input2, "class", "svelte-htbg4y");
    			add_location(input2, file$1, 342, 6, 13105);
    			attr_dev(a6, "href", "#/referee!helper");
    			attr_dev(a6, "class", "copy");
    			add_location(a6, file$1, 343, 6, 13174);
    			add_location(div8, file$1, 341, 4, 13092);
    			input3.readOnly = true;
    			input3.value = input3_value_value = `!mp addref ${/*selectedMatch*/ ctx[3].streamer?.username || "whoever's currently streaming"}`;
    			attr_dev(input3, "class", "svelte-htbg4y");
    			add_location(input3, file$1, 346, 6, 13285);
    			attr_dev(a7, "href", "#/referee!helper");
    			attr_dev(a7, "class", "copy");
    			add_location(a7, file$1, 347, 6, 13421);
    			add_location(div9, file$1, 345, 4, 13272);
    			input4.readOnly = true;
    			input4.value = input4_value_value = `!mp invite #${/*selectedMatch*/ ctx[3].players[0].player.id}`;
    			attr_dev(input4, "class", "svelte-htbg4y");
    			add_location(input4, file$1, 350, 6, 13532);
    			attr_dev(a8, "href", "#/referee!helper");
    			attr_dev(a8, "class", "copy");
    			add_location(a8, file$1, 351, 6, 13636);
    			add_location(div10, file$1, 349, 4, 13519);
    			input5.readOnly = true;
    			input5.value = input5_value_value = `!mp invite #${/*selectedMatch*/ ctx[3].players[1].player.id}`;
    			attr_dev(input5, "class", "svelte-htbg4y");
    			add_location(input5, file$1, 354, 6, 13747);
    			attr_dev(a9, "href", "#/referee!helper");
    			attr_dev(a9, "class", "copy");
    			add_location(a9, file$1, 355, 6, 13851);
    			add_location(div11, file$1, 353, 4, 13734);
    			attr_dev(div12, "class", "init svelte-htbg4y");
    			add_location(div12, file$1, 331, 2, 12580);
    			add_location(br5, file$1, 374, 48, 14332);
    			add_location(center3, file$1, 373, 4, 14274);
    			attr_dev(input6, "placeholder", "Beatmap link 1");
    			attr_dev(input6, "class", "svelte-htbg4y");
    			add_location(input6, file$1, 378, 6, 14429);
    			attr_dev(input7, "placeholder", "Beatmap link 2");
    			attr_dev(input7, "class", "svelte-htbg4y");
    			add_location(input7, file$1, 379, 6, 14496);
    			attr_dev(div13, "class", "values svelte-htbg4y");
    			add_location(div13, file$1, 377, 4, 14401);
    			input8.readOnly = true;
    			input8.value = input8_value_value = `!mp map ${/*warmup1*/ ctx[28].split("/").pop()} 3 ${/*selectedMatch*/ ctx[3].players[0].player.username}'s warmup`;
    			attr_dev(input8, "class", "svelte-htbg4y");
    			add_location(input8, file$1, 382, 6, 14601);
    			attr_dev(a10, "href", "#/referee!helper");
    			attr_dev(a10, "class", "copy");
    			add_location(a10, file$1, 383, 6, 14751);
    			attr_dev(div14, "class", "warmup svelte-htbg4y");
    			add_location(div14, file$1, 381, 4, 14573);
    			input9.readOnly = true;
    			input9.value = input9_value_value = `!mp map ${/*warmup2*/ ctx[29].split("/").pop()} 3 ${/*selectedMatch*/ ctx[3].players[1].player.username}'s warmup`;
    			attr_dev(input9, "class", "svelte-htbg4y");
    			add_location(input9, file$1, 386, 6, 14882);
    			attr_dev(a11, "href", "#/referee!helper");
    			attr_dev(a11, "class", "copy");
    			add_location(a11, file$1, 387, 6, 15032);
    			attr_dev(div15, "class", "warmup svelte-htbg4y");
    			add_location(div15, file$1, 385, 4, 14854);
    			attr_dev(div16, "class", "warmups svelte-htbg4y");
    			add_location(div16, file$1, 372, 2, 14247);
    			input10.readOnly = true;
    			input10.value = "Time to roll: each player will !roll, the highest one will protect first and ban second!";
    			attr_dev(input10, "class", "svelte-htbg4y");
    			add_location(input10, file$1, 394, 6, 15207);
    			attr_dev(a12, "href", "#/referee!helper");
    			attr_dev(a12, "class", "copy");
    			add_location(a12, file$1, 395, 6, 15350);
    			attr_dev(div17, "class", "call svelte-htbg4y");
    			add_location(div17, file$1, 393, 4, 15181);
    			attr_dev(div18, "class", "rolls svelte-htbg4y");
    			add_location(div18, file$1, 391, 2, 15145);
    			add_location(hr0, file$1, 458, 2, 17894);
    			add_location(hr1, file$1, 509, 2, 20256);
    			attr_dev(div19, "class", "match");
    			add_location(div19, file$1, 299, 0, 11246);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div19, anchor);
    			append_dev(div19, a0);
    			append_dev(div19, t1);
    			append_dev(div19, center0);
    			mount_component(matchfeed, center0, null);
    			append_dev(div19, t2);
    			append_dev(div19, center1);
    			append_dev(center1, br0);
    			append_dev(center1, br1);
    			append_dev(center1, t3);
    			append_dev(center1, a1);
    			append_dev(a1, t4);
    			append_dev(center1, t5);
    			append_dev(center1, br2);
    			append_dev(center1, br3);
    			append_dev(div19, t6);
    			append_dev(div19, div5);
    			append_dev(div5, div0);
    			append_dev(div0, t7);
    			append_dev(div5, t8);
    			append_dev(div5, div1);
    			append_dev(div1, img0);
    			append_dev(div1, t9);
    			append_dev(div1, a2);
    			append_dev(a2, t10);
    			append_dev(a2, t11);
    			append_dev(a2, t12);
    			append_dev(a2, t13);
    			append_dev(div5, t14);
    			append_dev(div5, div2);
    			append_dev(div5, t16);
    			append_dev(div5, div3);
    			append_dev(div3, img1);
    			append_dev(div3, t17);
    			append_dev(div3, a3);
    			append_dev(a3, t18);
    			append_dev(a3, t19);
    			append_dev(a3, t20);
    			append_dev(a3, t21);
    			append_dev(div5, t22);
    			append_dev(div5, div4);
    			append_dev(div4, t23);
    			append_dev(div19, t24);
    			append_dev(div19, center2);
    			append_dev(center2, t25);
    			append_dev(center2, t26);
    			append_dev(center2, t27);
    			append_dev(center2, t28);
    			append_dev(center2, t29);
    			append_dev(center2, br4);
    			append_dev(center2, t30);
    			append_dev(center2, t31);
    			append_dev(div19, t32);
    			append_dev(div19, div12);
    			append_dev(div12, t33);
    			append_dev(div12, div6);
    			append_dev(div6, input0);
    			/*input0_binding*/ ctx[54](input0);
    			append_dev(div6, t34);
    			append_dev(div6, a4);
    			append_dev(div12, t36);
    			append_dev(div12, div7);
    			append_dev(div7, input1);
    			/*input1_binding*/ ctx[56](input1);
    			append_dev(div7, t37);
    			append_dev(div7, a5);
    			append_dev(div12, t39);
    			append_dev(div12, div8);
    			append_dev(div8, input2);
    			/*input2_binding*/ ctx[58](input2);
    			append_dev(div8, t40);
    			append_dev(div8, a6);
    			append_dev(div12, t42);
    			append_dev(div12, div9);
    			append_dev(div9, input3);
    			/*input3_binding*/ ctx[60](input3);
    			append_dev(div9, t43);
    			append_dev(div9, a7);
    			append_dev(div12, t45);
    			append_dev(div12, div10);
    			append_dev(div10, input4);
    			/*input4_binding*/ ctx[62](input4);
    			append_dev(div10, t46);
    			append_dev(div10, a8);
    			append_dev(div12, t48);
    			append_dev(div12, div11);
    			append_dev(div11, input5);
    			/*input5_binding*/ ctx[64](input5);
    			append_dev(div11, t49);
    			append_dev(div11, a9);
    			append_dev(div19, t51);
    			if_block0.m(div19, null);
    			append_dev(div19, t52);
    			append_dev(div19, div16);
    			append_dev(div16, center3);
    			append_dev(center3, t53);
    			append_dev(center3, br5);
    			append_dev(center3, t54);
    			append_dev(div16, t55);
    			append_dev(div16, div13);
    			append_dev(div13, input6);
    			set_input_value(input6, /*warmup1*/ ctx[28]);
    			append_dev(div13, t56);
    			append_dev(div13, input7);
    			set_input_value(input7, /*warmup2*/ ctx[29]);
    			append_dev(div16, t57);
    			append_dev(div16, div14);
    			append_dev(div14, input8);
    			/*input8_binding*/ ctx[69](input8);
    			append_dev(div14, t58);
    			append_dev(div14, a10);
    			append_dev(div16, t60);
    			append_dev(div16, div15);
    			append_dev(div15, input9);
    			/*input9_binding*/ ctx[71](input9);
    			append_dev(div15, t61);
    			append_dev(div15, a11);
    			append_dev(div19, t63);
    			append_dev(div19, div18);
    			append_dev(div18, t64);
    			append_dev(div18, div17);
    			append_dev(div17, input10);
    			/*input10_binding*/ ctx[73](input10);
    			append_dev(div17, t65);
    			append_dev(div17, a12);
    			append_dev(div18, t67);
    			if_block1.m(div18, null);
    			append_dev(div19, t68);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div19, null);
    			}

    			append_dev(div19, t69);

    			if (~current_block_type_index_1) {
    				if_blocks_1[current_block_type_index_1].m(div19, null);
    			}

    			append_dev(div19, t70);
    			append_dev(div19, hr0);
    			append_dev(div19, t71);

    			if (~current_block_type_index_2) {
    				if_blocks_2[current_block_type_index_2].m(div19, null);
    			}

    			append_dev(div19, t72);

    			if (~current_block_type_index_3) {
    				if_blocks_3[current_block_type_index_3].m(div19, null);
    			}

    			append_dev(div19, t73);
    			append_dev(div19, hr1);
    			append_dev(div19, t74);
    			if (if_block6) if_block6.m(div19, null);
    			append_dev(div19, t75);
    			if (if_block7) if_block7.m(div19, null);
    			append_dev(div19, t76);
    			if (if_block8) if_block8.m(div19, null);
    			append_dev(div19, t77);
    			if (if_block9) if_block9.m(div19, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(a0, "click", /*click_handler_3*/ ctx[53], false, false, false),
    					listen_dev(a4, "click", /*click_handler_4*/ ctx[55], false, false, false),
    					listen_dev(a5, "click", /*click_handler_5*/ ctx[57], false, false, false),
    					listen_dev(a6, "click", /*click_handler_6*/ ctx[59], false, false, false),
    					listen_dev(a7, "click", /*click_handler_7*/ ctx[61], false, false, false),
    					listen_dev(a8, "click", /*click_handler_8*/ ctx[63], false, false, false),
    					listen_dev(a9, "click", /*click_handler_9*/ ctx[65], false, false, false),
    					listen_dev(input6, "input", /*input6_input_handler*/ ctx[67]),
    					listen_dev(input7, "input", /*input7_input_handler*/ ctx[68]),
    					listen_dev(a10, "click", /*click_handler_10*/ ctx[70], false, false, false),
    					listen_dev(a11, "click", /*click_handler_11*/ ctx[72], false, false, false),
    					listen_dev(a12, "click", /*click_handler_12*/ ctx[74], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const matchfeed_changes = {};
    			if (dirty[0] & /*selectedMatch*/ 8) matchfeed_changes.match = /*selectedMatch*/ ctx[3];
    			if (dirty[0] & /*stage*/ 1) matchfeed_changes.stage = /*stage*/ ctx[0];
    			matchfeed.$set(matchfeed_changes);

    			if (!current || dirty[0] & /*selectedMatch*/ 8 && a1_href_value !== (a1_href_value = `https://api.mbs3.fightthe.pw/admin/collections/matches/${/*selectedMatch*/ ctx[3].id}`)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (!current || dirty[0] & /*points1*/ 16) set_data_dev(t7, /*points1*/ ctx[4]);

    			if (!current || dirty[0] & /*selectedMatch*/ 8 && img0.src !== (img0_src_value = /*selectedMatch*/ ctx[3].players[0].player.avatar)) {
    				attr_dev(img0, "src", img0_src_value);
    			}

    			if ((!current || dirty[0] & /*selectedMatch*/ 8) && t10_value !== (t10_value = /*selectedMatch*/ ctx[3].players[0].player.username + "")) set_data_dev(t10, t10_value);
    			if ((!current || dirty[0] & /*selectedMatch*/ 8) && t12_value !== (t12_value = /*selectedMatch*/ ctx[3].players[0].player.seed + "")) set_data_dev(t12, t12_value);

    			if (!current || dirty[0] & /*selectedMatch*/ 8 && a2_href_value !== (a2_href_value = `https://osu.ppy.sh/users/${/*selectedMatch*/ ctx[3].players[0].player.id}`)) {
    				attr_dev(a2, "href", a2_href_value);
    			}

    			if (!current || dirty[0] & /*selectedMatch*/ 8 && img1.src !== (img1_src_value = /*selectedMatch*/ ctx[3].players[1].player.avatar)) {
    				attr_dev(img1, "src", img1_src_value);
    			}

    			if ((!current || dirty[0] & /*selectedMatch*/ 8) && t18_value !== (t18_value = /*selectedMatch*/ ctx[3].players[1].player.username + "")) set_data_dev(t18, t18_value);
    			if ((!current || dirty[0] & /*selectedMatch*/ 8) && t20_value !== (t20_value = /*selectedMatch*/ ctx[3].players[1].player.seed + "")) set_data_dev(t20, t20_value);

    			if (!current || dirty[0] & /*selectedMatch*/ 8 && a3_href_value !== (a3_href_value = `https://osu.ppy.sh/users/${/*selectedMatch*/ ctx[3].players[1].player.id}`)) {
    				attr_dev(a3, "href", a3_href_value);
    			}

    			if (!current || dirty[0] & /*points2*/ 32) set_data_dev(t23, /*points2*/ ctx[5]);
    			if (!current || dirty[1] & /*riceCount*/ 4) set_data_dev(t26, /*riceCount*/ ctx[33]);
    			if (!current || dirty[1] & /*lnCount*/ 8) set_data_dev(t28, /*lnCount*/ ctx[34]);

    			if ((!current || dirty[1] & /*riceCount, lnCount*/ 12) && t31_value !== (t31_value = (/*riceCount*/ ctx[33] < /*lnCount*/ ctx[34]
    			? "Tiebreaker (rice)"
    			: "Tiebreaker (hybrid)") + "")) set_data_dev(t31, t31_value);

    			if (!current || dirty[0] & /*selectedMatch*/ 8 && input0_value_value !== (input0_value_value = `!mp make MBS3: (${/*selectedMatch*/ ctx[3].players[0].player.username}) vs. (${/*selectedMatch*/ ctx[3].players[1].player.username})`) && input0.value !== input0_value_value) {
    				prop_dev(input0, "value", input0_value_value);
    			}

    			if (!current || dirty[0] & /*selectedMatch*/ 8 && input3_value_value !== (input3_value_value = `!mp addref ${/*selectedMatch*/ ctx[3].streamer?.username || "whoever's currently streaming"}`) && input3.value !== input3_value_value) {
    				prop_dev(input3, "value", input3_value_value);
    			}

    			if (!current || dirty[0] & /*selectedMatch*/ 8 && input4_value_value !== (input4_value_value = `!mp invite #${/*selectedMatch*/ ctx[3].players[0].player.id}`) && input4.value !== input4_value_value) {
    				prop_dev(input4, "value", input4_value_value);
    			}

    			if (!current || dirty[0] & /*selectedMatch*/ 8 && input5_value_value !== (input5_value_value = `!mp invite #${/*selectedMatch*/ ctx[3].players[1].player.id}`) && input5.value !== input5_value_value) {
    				prop_dev(input5, "value", input5_value_value);
    			}

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div19, t52);
    				}
    			}

    			if (dirty[0] & /*warmup1*/ 268435456 && input6.value !== /*warmup1*/ ctx[28]) {
    				set_input_value(input6, /*warmup1*/ ctx[28]);
    			}

    			if (dirty[0] & /*warmup2*/ 536870912 && input7.value !== /*warmup2*/ ctx[29]) {
    				set_input_value(input7, /*warmup2*/ ctx[29]);
    			}

    			if (!current || dirty[0] & /*warmup1, selectedMatch*/ 268435464 && input8_value_value !== (input8_value_value = `!mp map ${/*warmup1*/ ctx[28].split("/").pop()} 3 ${/*selectedMatch*/ ctx[3].players[0].player.username}'s warmup`) && input8.value !== input8_value_value) {
    				prop_dev(input8, "value", input8_value_value);
    			}

    			if (!current || dirty[0] & /*warmup2, selectedMatch*/ 536870920 && input9_value_value !== (input9_value_value = `!mp map ${/*warmup2*/ ctx[29].split("/").pop()} 3 ${/*selectedMatch*/ ctx[3].players[1].player.username}'s warmup`) && input9.value !== input9_value_value) {
    				prop_dev(input9, "value", input9_value_value);
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_2(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div18, null);
    				}
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_3(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block2) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block2 = if_blocks[current_block_type_index];

    					if (!if_block2) {
    						if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block2.c();
    					} else {
    						if_block2.p(ctx, dirty);
    					}

    					transition_in(if_block2, 1);
    					if_block2.m(div19, t69);
    				} else {
    					if_block2 = null;
    				}
    			}

    			let previous_block_index_1 = current_block_type_index_1;
    			current_block_type_index_1 = select_block_type_4(ctx);

    			if (current_block_type_index_1 === previous_block_index_1) {
    				if (~current_block_type_index_1) {
    					if_blocks_1[current_block_type_index_1].p(ctx, dirty);
    				}
    			} else {
    				if (if_block3) {
    					group_outros();

    					transition_out(if_blocks_1[previous_block_index_1], 1, 1, () => {
    						if_blocks_1[previous_block_index_1] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index_1) {
    					if_block3 = if_blocks_1[current_block_type_index_1];

    					if (!if_block3) {
    						if_block3 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    						if_block3.c();
    					} else {
    						if_block3.p(ctx, dirty);
    					}

    					transition_in(if_block3, 1);
    					if_block3.m(div19, t70);
    				} else {
    					if_block3 = null;
    				}
    			}

    			let previous_block_index_2 = current_block_type_index_2;
    			current_block_type_index_2 = select_block_type_6(ctx);

    			if (current_block_type_index_2 === previous_block_index_2) {
    				if (~current_block_type_index_2) {
    					if_blocks_2[current_block_type_index_2].p(ctx, dirty);
    				}
    			} else {
    				if (if_block4) {
    					group_outros();

    					transition_out(if_blocks_2[previous_block_index_2], 1, 1, () => {
    						if_blocks_2[previous_block_index_2] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index_2) {
    					if_block4 = if_blocks_2[current_block_type_index_2];

    					if (!if_block4) {
    						if_block4 = if_blocks_2[current_block_type_index_2] = if_block_creators_2[current_block_type_index_2](ctx);
    						if_block4.c();
    					} else {
    						if_block4.p(ctx, dirty);
    					}

    					transition_in(if_block4, 1);
    					if_block4.m(div19, t72);
    				} else {
    					if_block4 = null;
    				}
    			}

    			let previous_block_index_3 = current_block_type_index_3;
    			current_block_type_index_3 = select_block_type_8(ctx);

    			if (current_block_type_index_3 === previous_block_index_3) {
    				if (~current_block_type_index_3) {
    					if_blocks_3[current_block_type_index_3].p(ctx, dirty);
    				}
    			} else {
    				if (if_block5) {
    					group_outros();

    					transition_out(if_blocks_3[previous_block_index_3], 1, 1, () => {
    						if_blocks_3[previous_block_index_3] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index_3) {
    					if_block5 = if_blocks_3[current_block_type_index_3];

    					if (!if_block5) {
    						if_block5 = if_blocks_3[current_block_type_index_3] = if_block_creators_3[current_block_type_index_3](ctx);
    						if_block5.c();
    					} else {
    						if_block5.p(ctx, dirty);
    					}

    					transition_in(if_block5, 1);
    					if_block5.m(div19, t73);
    				} else {
    					if_block5 = null;
    				}
    			}

    			if (/*selectedMatch*/ ctx[3].bans[1]) {
    				if (if_block6) {
    					if_block6.p(ctx, dirty);

    					if (dirty[0] & /*selectedMatch*/ 8) {
    						transition_in(if_block6, 1);
    					}
    				} else {
    					if_block6 = create_if_block_8$1(ctx);
    					if_block6.c();
    					transition_in(if_block6, 1);
    					if_block6.m(div19, t75);
    				}
    			} else if (if_block6) {
    				group_outros();

    				transition_out(if_block6, 1, 1, () => {
    					if_block6 = null;
    				});

    				check_outros();
    			}

    			if (/*points1*/ ctx[4] == /*winCondition*/ ctx[1] - 1 && /*points2*/ ctx[5] == /*winCondition*/ ctx[1] - 1 && !/*scorePending*/ ctx[35]) {
    				if (if_block7) {
    					if_block7.p(ctx, dirty);

    					if (dirty[0] & /*points1, winCondition, points2*/ 50 | dirty[1] & /*scorePending*/ 16) {
    						transition_in(if_block7, 1);
    					}
    				} else {
    					if_block7 = create_if_block_6$1(ctx);
    					if_block7.c();
    					transition_in(if_block7, 1);
    					if_block7.m(div19, t76);
    				}
    			} else if (if_block7) {
    				group_outros();

    				transition_out(if_block7, 1, 1, () => {
    					if_block7 = null;
    				});

    				check_outros();
    			}

    			if (/*points1*/ ctx[4] >= /*winCondition*/ ctx[1]) {
    				if (if_block8) {
    					if_block8.p(ctx, dirty);
    				} else {
    					if_block8 = create_if_block_5$1(ctx);
    					if_block8.c();
    					if_block8.m(div19, t77);
    				}
    			} else if (if_block8) {
    				if_block8.d(1);
    				if_block8 = null;
    			}

    			if (/*points2*/ ctx[5] >= /*winCondition*/ ctx[1]) {
    				if (if_block9) {
    					if_block9.p(ctx, dirty);
    				} else {
    					if_block9 = create_if_block_4$1(ctx);
    					if_block9.c();
    					if_block9.m(div19, null);
    				}
    			} else if (if_block9) {
    				if_block9.d(1);
    				if_block9 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(matchfeed.$$.fragment, local);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(if_block4);
    			transition_in(if_block5);
    			transition_in(if_block6);
    			transition_in(if_block7);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(matchfeed.$$.fragment, local);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			transition_out(if_block5);
    			transition_out(if_block6);
    			transition_out(if_block7);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div19);
    			destroy_component(matchfeed);
    			/*input0_binding*/ ctx[54](null);
    			/*input1_binding*/ ctx[56](null);
    			/*input2_binding*/ ctx[58](null);
    			/*input3_binding*/ ctx[60](null);
    			/*input4_binding*/ ctx[62](null);
    			/*input5_binding*/ ctx[64](null);
    			if_block0.d();
    			/*input8_binding*/ ctx[69](null);
    			/*input9_binding*/ ctx[71](null);
    			/*input10_binding*/ ctx[73](null);
    			if_block1.d();

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			if (~current_block_type_index_1) {
    				if_blocks_1[current_block_type_index_1].d();
    			}

    			if (~current_block_type_index_2) {
    				if_blocks_2[current_block_type_index_2].d();
    			}

    			if (~current_block_type_index_3) {
    				if_blocks_3[current_block_type_index_3].d();
    			}

    			if (if_block6) if_block6.d();
    			if (if_block7) if_block7.d();
    			if (if_block8) if_block8.d();
    			if (if_block9) if_block9.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(299:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (271:25) 
    function create_if_block_2$1(ctx) {
    	let a0;

    	let t0_value = (/*onlyMyMatches*/ ctx[25]
    	? "Show all matches"
    	: "Show only my matches") + "";

    	let t0;
    	let t1;
    	let a1;

    	let t2_value = (/*showPastMatches*/ ctx[26]
    	? "Hide past matches"
    	: "Show past matches") + "";

    	let t2;
    	let t3;
    	let div;
    	let center;
    	let t5;
    	let each_blocks = [];
    	let each_1_lookup = new Map_1();
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*$matches*/ ctx[7];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*match*/ ctx[110].id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			a0 = element("a");
    			t0 = text(t0_value);
    			t1 = text("\r\n   \r\n");
    			a1 = element("a");
    			t2 = text(t2_value);
    			t3 = space();
    			div = element("div");
    			center = element("center");
    			center.textContent = "Select a match";
    			t5 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(a0, "href", "#/referee!helper");
    			add_location(a0, file$1, 271, 0, 10309);
    			attr_dev(a1, "href", "#/referee!helper");
    			add_location(a1, file$1, 275, 0, 10477);
    			add_location(center, file$1, 279, 2, 10654);
    			attr_dev(div, "class", "matches svelte-htbg4y");
    			add_location(div, file$1, 278, 0, 10629);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a0, anchor);
    			append_dev(a0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, a1, anchor);
    			append_dev(a1, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, center);
    			append_dev(div, t5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(a0, "click", /*click_handler*/ ctx[50], false, false, false),
    					listen_dev(a1, "click", /*click_handler_1*/ ctx[51], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[0] & /*onlyMyMatches*/ 33554432) && t0_value !== (t0_value = (/*onlyMyMatches*/ ctx[25]
    			? "Show all matches"
    			: "Show only my matches") + "")) set_data_dev(t0, t0_value);

    			if ((!current || dirty[0] & /*showPastMatches*/ 67108864) && t2_value !== (t2_value = (/*showPastMatches*/ ctx[26]
    			? "Hide past matches"
    			: "Show past matches") + "")) set_data_dev(t2, t2_value);

    			if (dirty[0] & /*$matches, onlyMyMatches, $me, showPastMatches, winCondition*/ 100663490 | dirty[1] & /*selectMatch*/ 32) {
    				each_value = /*$matches*/ ctx[7];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block, null, get_each_context);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(a1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(271:25) ",
    		ctx
    	});

    	return block;
    }

    // (269:20) 
    function create_if_block_1$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading matches...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(269:20) ",
    		ctx
    	});

    	return block;
    }

    // (267:0) {#if !$me}
    function create_if_block$1(ctx) {
    	let a;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Login";

    			attr_dev(a, "href", `${({
				"env": {
					"API_URL": "http://local.api.mbs3.fightthe.pw:8055",
					"UI_URL": "http://local.mbs3.fightthe.pw:5000",
					"isProd": false
				}
			}).env.API_URL}/auth/oauth/osu?redirect=${({
				"env": {
					"API_URL": "http://local.api.mbs3.fightthe.pw:8055",
					"UI_URL": "http://local.mbs3.fightthe.pw:5000",
					"isProd": false
				}
			}).env.UI_URL}`);

    			add_location(a, file$1, 267, 0, 9920);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(267:0) {#if !$me}",
    		ctx
    	});

    	return block;
    }

    // (364:2) {:else}
    function create_else_block_5(ctx) {
    	let div1;
    	let t;
    	let div0;
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			t = text("Paste your MP link here\r\n    ");
    			div0 = element("div");
    			input = element("input");
    			attr_dev(input, "placeholder", "MP Link");
    			attr_dev(input, "class", "svelte-htbg4y");
    			add_location(input, file$1, 367, 6, 14159);
    			attr_dev(div0, "class", "values svelte-htbg4y");
    			add_location(div0, file$1, 366, 4, 14131);
    			attr_dev(div1, "class", "init svelte-htbg4y");
    			add_location(div1, file$1, 364, 2, 14078);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t);
    			append_dev(div1, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*mpLink*/ ctx[27]);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[66]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*mpLink*/ 134217728 && input.value !== /*mpLink*/ ctx[27]) {
    				set_input_value(input, /*mpLink*/ ctx[27]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_5.name,
    		type: "else",
    		source: "(364:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (360:2) {#if selectedMatch.link}
    function create_if_block_30(ctx) {
    	let center;
    	let h1;
    	let a;
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			center = element("center");
    			h1 = element("h1");
    			a = element("a");
    			t = text("MP Link");
    			attr_dev(a, "href", a_href_value = /*selectedMatch*/ ctx[3].link);
    			add_location(a, file$1, 361, 4, 14005);
    			add_location(h1, file$1, 360, 10, 13995);
    			add_location(center, file$1, 360, 2, 13987);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, center, anchor);
    			append_dev(center, h1);
    			append_dev(h1, a);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*selectedMatch*/ 8 && a_href_value !== (a_href_value = /*selectedMatch*/ ctx[3].link)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(center);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_30.name,
    		type: "if",
    		source: "(360:2) {#if selectedMatch.link}",
    		ctx
    	});

    	return block;
    }

    // (403:4) {:else}
    function create_else_block_4(ctx) {
    	let div;
    	let input0;
    	let t0;
    	let input1;
    	let t1;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			input0 = element("input");
    			t0 = space();
    			input1 = element("input");
    			t1 = space();
    			button = element("button");
    			button.textContent = "Confirm rolls";
    			attr_dev(input0, "placeholder", "Roll 1");
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "class", "svelte-htbg4y");
    			add_location(input0, file$1, 404, 6, 15661);
    			attr_dev(input1, "placeholder", "Roll 2");
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "class", "svelte-htbg4y");
    			add_location(input1, file$1, 405, 6, 15732);
    			attr_dev(div, "class", "values svelte-htbg4y");
    			add_location(div, file$1, 403, 4, 15633);
    			add_location(button, file$1, 407, 4, 15813);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input0);
    			set_input_value(input0, /*roll1*/ ctx[30]);
    			append_dev(div, t0);
    			append_dev(div, input1);
    			set_input_value(input1, /*roll2*/ ctx[31]);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[75]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[76]),
    					listen_dev(button, "click", /*click_handler_13*/ ctx[77], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*roll1*/ 1073741824 && to_number(input0.value) !== /*roll1*/ ctx[30]) {
    				set_input_value(input0, /*roll1*/ ctx[30]);
    			}

    			if (dirty[1] & /*roll2*/ 1 && to_number(input1.value) !== /*roll2*/ ctx[31]) {
    				set_input_value(input1, /*roll2*/ ctx[31]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_4.name,
    		type: "else",
    		source: "(403:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (398:4) {#if selectedMatch.rolls.length}
    function create_if_block_29(ctx) {
    	let div;
    	let b0;
    	let t0_value = /*selectedMatch*/ ctx[3].rolls[0].value + "";
    	let t0;
    	let t1;
    	let b1;
    	let t2_value = /*selectedMatch*/ ctx[3].rolls[1].value + "";
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			b0 = element("b");
    			t0 = text(t0_value);
    			t1 = text(" vs.\r\n      ");
    			b1 = element("b");
    			t2 = text(t2_value);
    			add_location(b0, file$1, 399, 6, 15516);
    			add_location(b1, file$1, 400, 6, 15565);
    			attr_dev(div, "class", "values svelte-htbg4y");
    			add_location(div, file$1, 398, 4, 15488);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, b0);
    			append_dev(b0, t0);
    			append_dev(div, t1);
    			append_dev(div, b1);
    			append_dev(b1, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*selectedMatch*/ 8 && t0_value !== (t0_value = /*selectedMatch*/ ctx[3].rolls[0].value + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*selectedMatch*/ 8 && t2_value !== (t2_value = /*selectedMatch*/ ctx[3].rolls[1].value + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_29.name,
    		type: "if",
    		source: "(398:4) {#if selectedMatch.rolls.length}",
    		ctx
    	});

    	return block;
    }

    // (417:35) 
    function create_if_block_27(ctx) {
    	let div2;
    	let center;
    	let t0;
    	let br;
    	let t1;
    	let t2;
    	let div0;
    	let input;
    	let input_value_value;
    	let t3;
    	let a;
    	let t5;
    	let div1;
    	let each_blocks = [];
    	let each_1_lookup = new Map_1();
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_6 = /*$maps*/ ctx[8];
    	validate_each_argument(each_value_6);
    	const get_key = ctx => /*map*/ ctx[113].id;
    	validate_each_keys(ctx, each_value_6, get_each_context_6, get_key);

    	for (let i = 0; i < each_value_6.length; i += 1) {
    		let child_ctx = get_each_context_6(ctx, each_value_6, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_6(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			center = element("center");
    			t0 = text("Protects");
    			br = element("br");
    			t1 = text("\r\n      Roll winner protects first");
    			t2 = space();
    			div0 = element("div");
    			input = element("input");
    			t3 = space();
    			a = element("a");
    			a.textContent = "📝 Copy";
    			t5 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(br, file$1, 419, 14, 16203);
    			add_location(center, file$1, 418, 4, 16179);
    			input.readOnly = true;
    			input.value = input_value_value = `${/*getPlayerByRoll*/ ctx[43](/*selectedMatch*/ ctx[3], "winner").username} wins the roll and protects first! Pick a map to protect: this map will not be able to be banned.`;
    			attr_dev(input, "class", "svelte-htbg4y");
    			add_location(input, file$1, 423, 6, 16290);
    			attr_dev(a, "href", "#/referee!helper");
    			attr_dev(a, "class", "copy");
    			add_location(a, file$1, 424, 6, 16499);
    			attr_dev(div0, "class", "call svelte-htbg4y");
    			add_location(div0, file$1, 422, 4, 16264);
    			attr_dev(div1, "class", "maps svelte-htbg4y");
    			add_location(div1, file$1, 426, 4, 16602);
    			attr_dev(div2, "class", "protects svelte-htbg4y");
    			add_location(div2, file$1, 417, 2, 16151);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, center);
    			append_dev(center, t0);
    			append_dev(center, br);
    			append_dev(center, t1);
    			append_dev(div2, t2);
    			append_dev(div2, div0);
    			append_dev(div0, input);
    			/*input_binding*/ ctx[79](input);
    			append_dev(div0, t3);
    			append_dev(div0, a);
    			append_dev(div2, t5);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler_14*/ ctx[80], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*selectedMatch*/ 8 && input_value_value !== (input_value_value = `${/*getPlayerByRoll*/ ctx[43](/*selectedMatch*/ ctx[3], "winner").username} wins the roll and protects first! Pick a map to protect: this map will not be able to be banned.`) && input.value !== input_value_value) {
    				prop_dev(input, "value", input_value_value);
    			}

    			if (dirty[0] & /*$maps, selectedMatch*/ 264 | dirty[1] & /*protect, getPlayerByRoll*/ 4352) {
    				each_value_6 = /*$maps*/ ctx[8];
    				validate_each_argument(each_value_6);
    				group_outros();
    				validate_each_keys(ctx, each_value_6, get_each_context_6, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_6, each_1_lookup, div1, outro_and_destroy_block, create_each_block_6, null, get_each_context_6);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_6.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			/*input_binding*/ ctx[79](null);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_27.name,
    		type: "if",
    		source: "(417:35) ",
    		ctx
    	});

    	return block;
    }

    // (412:2) {#if selectedMatch.protects[0]}
    function create_if_block_26(ctx) {
    	let div;
    	let t0_value = /*getPlayerByRoll*/ ctx[43](/*selectedMatch*/ ctx[3], "winner").username + "";
    	let t0;
    	let t1;
    	let map;
    	let current;

    	map = new Map$1({
    			props: {
    				map: /*$maps*/ ctx[8].find(/*func_3*/ ctx[78])
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = text("'s protect\r\n    ");
    			create_component(map.$$.fragment);
    			attr_dev(div, "class", "protects svelte-htbg4y");
    			add_location(div, file$1, 412, 2, 15934);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			mount_component(map, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[0] & /*selectedMatch*/ 8) && t0_value !== (t0_value = /*getPlayerByRoll*/ ctx[43](/*selectedMatch*/ ctx[3], "winner").username + "")) set_data_dev(t0, t0_value);
    			const map_changes = {};
    			if (dirty[0] & /*$maps, selectedMatch*/ 264) map_changes.map = /*$maps*/ ctx[8].find(/*func_3*/ ctx[78]);
    			map.$set(map_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(map);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_26.name,
    		type: "if",
    		source: "(412:2) {#if selectedMatch.protects[0]}",
    		ctx
    	});

    	return block;
    }

    // (429:8) {#if !map.category.startsWith('Tiebreaker')}
    function create_if_block_28(ctx) {
    	let map;
    	let current;

    	function click_handler_15(...args) {
    		return /*click_handler_15*/ ctx[81](/*map*/ ctx[113], ...args);
    	}

    	map = new Map$1({
    			props: { map: /*map*/ ctx[113] },
    			$$inline: true
    		});

    	map.$on("click", click_handler_15);

    	const block = {
    		c: function create() {
    			create_component(map.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(map, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const map_changes = {};
    			if (dirty[0] & /*$maps*/ 256) map_changes.map = /*map*/ ctx[113];
    			map.$set(map_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(map, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_28.name,
    		type: "if",
    		source: "(429:8) {#if !map.category.startsWith('Tiebreaker')}",
    		ctx
    	});

    	return block;
    }

    // (428:6) {#each $maps as map (map.id)}
    function create_each_block_6(key_1, ctx) {
    	let first;
    	let show_if = !/*map*/ ctx[113].category.startsWith("Tiebreaker");
    	let if_block_anchor;
    	let current;
    	let if_block = show_if && create_if_block_28(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*$maps*/ 256) show_if = !/*map*/ ctx[113].category.startsWith("Tiebreaker");

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*$maps*/ 256) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_28(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_6.name,
    		type: "each",
    		source: "(428:6) {#each $maps as map (map.id)}",
    		ctx
    	});

    	return block;
    }

    // (441:38) 
    function create_if_block_23(ctx) {
    	let div2;
    	let div0;
    	let input;
    	let input_value_value;
    	let t0;
    	let a;
    	let t2;
    	let div1;
    	let each_blocks = [];
    	let each_1_lookup = new Map_1();
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_5 = /*$maps*/ ctx[8];
    	validate_each_argument(each_value_5);
    	const get_key = ctx => /*map*/ ctx[113].id;
    	validate_each_keys(ctx, each_value_5, get_each_context_5, get_key);

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		let child_ctx = get_each_context_5(ctx, each_value_5, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_5(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			a = element("a");
    			a.textContent = "📝 Copy";
    			t2 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			input.readOnly = true;
    			input.value = input_value_value = `${/*getPlayerByRoll*/ ctx[43](/*selectedMatch*/ ctx[3], "loser").username} protects second: pick a map to protect`;
    			attr_dev(input, "class", "svelte-htbg4y");
    			add_location(input, file$1, 443, 6, 17193);
    			attr_dev(a, "href", "#/referee!helper");
    			attr_dev(a, "class", "copy");
    			add_location(a, file$1, 444, 6, 17343);
    			attr_dev(div0, "class", "call svelte-htbg4y");
    			add_location(div0, file$1, 442, 4, 17167);
    			attr_dev(div1, "class", "maps svelte-htbg4y");
    			add_location(div1, file$1, 446, 4, 17446);
    			attr_dev(div2, "class", "protects svelte-htbg4y");
    			add_location(div2, file$1, 441, 2, 17139);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, input);
    			/*input_binding_1*/ ctx[83](input);
    			append_dev(div0, t0);
    			append_dev(div0, a);
    			append_dev(div2, t2);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler_16*/ ctx[84], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*selectedMatch*/ 8 && input_value_value !== (input_value_value = `${/*getPlayerByRoll*/ ctx[43](/*selectedMatch*/ ctx[3], "loser").username} protects second: pick a map to protect`) && input.value !== input_value_value) {
    				prop_dev(input, "value", input_value_value);
    			}

    			if (dirty[0] & /*$maps, selectedMatch*/ 264 | dirty[1] & /*protect, getPlayerByRoll*/ 4352) {
    				each_value_5 = /*$maps*/ ctx[8];
    				validate_each_argument(each_value_5);
    				group_outros();
    				validate_each_keys(ctx, each_value_5, get_each_context_5, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_5, each_1_lookup, div1, outro_and_destroy_block, create_each_block_5, null, get_each_context_5);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_5.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			/*input_binding_1*/ ctx[83](null);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_23.name,
    		type: "if",
    		source: "(441:38) ",
    		ctx
    	});

    	return block;
    }

    // (436:2) {#if selectedMatch.protects[1]}
    function create_if_block_22(ctx) {
    	let div;
    	let t0_value = /*getPlayerByRoll*/ ctx[43](/*selectedMatch*/ ctx[3], "loser").username + "";
    	let t0;
    	let t1;
    	let map;
    	let current;

    	map = new Map$1({
    			props: {
    				map: /*$maps*/ ctx[8].find(/*func_4*/ ctx[82])
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = text("'s protect\r\n    ");
    			create_component(map.$$.fragment);
    			attr_dev(div, "class", "protects svelte-htbg4y");
    			add_location(div, file$1, 436, 2, 16920);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			mount_component(map, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[0] & /*selectedMatch*/ 8) && t0_value !== (t0_value = /*getPlayerByRoll*/ ctx[43](/*selectedMatch*/ ctx[3], "loser").username + "")) set_data_dev(t0, t0_value);
    			const map_changes = {};
    			if (dirty[0] & /*$maps, selectedMatch*/ 264) map_changes.map = /*$maps*/ ctx[8].find(/*func_4*/ ctx[82]);
    			map.$set(map_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(map);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_22.name,
    		type: "if",
    		source: "(436:2) {#if selectedMatch.protects[1]}",
    		ctx
    	});

    	return block;
    }

    // (451:62) 
    function create_if_block_25(ctx) {
    	let div;
    	let map;
    	let current;

    	map = new Map$1({
    			props: { map: /*map*/ ctx[113] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(map.$$.fragment);
    			attr_dev(div, "class", "disabled svelte-htbg4y");
    			add_location(div, file$1, 451, 10, 17786);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(map, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const map_changes = {};
    			if (dirty[0] & /*$maps*/ 256) map_changes.map = /*map*/ ctx[113];
    			map.$set(map_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(map);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_25.name,
    		type: "if",
    		source: "(451:62) ",
    		ctx
    	});

    	return block;
    }

    // (449:8) {#if !map.category.startsWith('Tiebreaker') && selectedMatch.protects[0]?.map.id != map.id}
    function create_if_block_24(ctx) {
    	let map;
    	let current;

    	function click_handler_17(...args) {
    		return /*click_handler_17*/ ctx[85](/*map*/ ctx[113], ...args);
    	}

    	map = new Map$1({
    			props: { map: /*map*/ ctx[113] },
    			$$inline: true
    		});

    	map.$on("click", click_handler_17);

    	const block = {
    		c: function create() {
    			create_component(map.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(map, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const map_changes = {};
    			if (dirty[0] & /*$maps*/ 256) map_changes.map = /*map*/ ctx[113];
    			map.$set(map_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(map, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_24.name,
    		type: "if",
    		source: "(449:8) {#if !map.category.startsWith('Tiebreaker') && selectedMatch.protects[0]?.map.id != map.id}",
    		ctx
    	});

    	return block;
    }

    // (448:6) {#each $maps as map (map.id)}
    function create_each_block_5(key_1, ctx) {
    	let first;
    	let show_if;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_24, create_if_block_25];
    	const if_blocks = [];

    	function select_block_type_5(ctx, dirty) {
    		if (dirty[0] & /*$maps, selectedMatch*/ 264) show_if = !!(!/*map*/ ctx[113].category.startsWith("Tiebreaker") && /*selectedMatch*/ ctx[3].protects[0]?.map.id != /*map*/ ctx[113].id);
    		if (show_if) return 0;
    		if (/*selectedMatch*/ ctx[3].protects[0]?.map.id == /*map*/ ctx[113].id) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type_5(ctx, [-1]))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_5(ctx, dirty);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5.name,
    		type: "each",
    		source: "(448:6) {#each $maps as map (map.id)}",
    		ctx
    	});

    	return block;
    }

    // (466:38) 
    function create_if_block_19(ctx) {
    	let div2;
    	let center;
    	let t0;
    	let br;
    	let t1;
    	let t2;
    	let div0;
    	let input;
    	let input_value_value;
    	let t3;
    	let a;
    	let t5;
    	let div1;
    	let each_blocks = [];
    	let each_1_lookup = new Map_1();
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_4 = /*$maps*/ ctx[8];
    	validate_each_argument(each_value_4);
    	const get_key = ctx => /*map*/ ctx[113].id;
    	validate_each_keys(ctx, each_value_4, get_each_context_4, get_key);

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		let child_ctx = get_each_context_4(ctx, each_value_4, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_4(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			center = element("center");
    			t0 = text("Bans");
    			br = element("br");
    			t1 = text("\r\n      Roll loser bans first");
    			t2 = space();
    			div0 = element("div");
    			input = element("input");
    			t3 = space();
    			a = element("a");
    			a.textContent = "📝 Copy";
    			t5 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(br, file$1, 468, 10, 18188);
    			add_location(center, file$1, 467, 4, 18168);
    			input.readOnly = true;
    			input.value = input_value_value = `${/*getPlayerByRoll*/ ctx[43](/*selectedMatch*/ ctx[3], "loser").username} bans first! Pick a map to ban: this map will not be able to be picked in the match.`;
    			attr_dev(input, "class", "svelte-htbg4y");
    			add_location(input, file$1, 472, 6, 18270);
    			attr_dev(a, "href", "#/referee!helper");
    			attr_dev(a, "class", "copy");
    			add_location(a, file$1, 473, 6, 18461);
    			attr_dev(div0, "class", "call svelte-htbg4y");
    			add_location(div0, file$1, 471, 4, 18244);
    			attr_dev(div1, "class", "maps svelte-htbg4y");
    			add_location(div1, file$1, 475, 4, 18560);
    			attr_dev(div2, "class", "bans svelte-htbg4y");
    			add_location(div2, file$1, 466, 2, 18144);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, center);
    			append_dev(center, t0);
    			append_dev(center, br);
    			append_dev(center, t1);
    			append_dev(div2, t2);
    			append_dev(div2, div0);
    			append_dev(div0, input);
    			/*input_binding_2*/ ctx[87](input);
    			append_dev(div0, t3);
    			append_dev(div0, a);
    			append_dev(div2, t5);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler_18*/ ctx[88], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*selectedMatch*/ 8 && input_value_value !== (input_value_value = `${/*getPlayerByRoll*/ ctx[43](/*selectedMatch*/ ctx[3], "loser").username} bans first! Pick a map to ban: this map will not be able to be picked in the match.`) && input.value !== input_value_value) {
    				prop_dev(input, "value", input_value_value);
    			}

    			if (dirty[0] & /*$maps, selectedMatch*/ 264 | dirty[1] & /*ban, getPlayerByRoll*/ 4608) {
    				each_value_4 = /*$maps*/ ctx[8];
    				validate_each_argument(each_value_4);
    				group_outros();
    				validate_each_keys(ctx, each_value_4, get_each_context_4, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_4, each_1_lookup, div1, outro_and_destroy_block, create_each_block_4, null, get_each_context_4);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_4.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			/*input_binding_2*/ ctx[87](null);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_19.name,
    		type: "if",
    		source: "(466:38) ",
    		ctx
    	});

    	return block;
    }

    // (461:2) {#if selectedMatch.bans[0]}
    function create_if_block_18(ctx) {
    	let div;
    	let t0_value = /*getPlayerByRoll*/ ctx[43](/*selectedMatch*/ ctx[3], "loser").username + "";
    	let t0;
    	let t1;
    	let map;
    	let current;

    	map = new Map$1({
    			props: {
    				map: /*$maps*/ ctx[8].find(/*func_5*/ ctx[86])
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = text("'s ban\r\n    ");
    			create_component(map.$$.fragment);
    			attr_dev(div, "class", "bans svelte-htbg4y");
    			add_location(div, file$1, 461, 2, 17937);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			mount_component(map, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[0] & /*selectedMatch*/ 8) && t0_value !== (t0_value = /*getPlayerByRoll*/ ctx[43](/*selectedMatch*/ ctx[3], "loser").username + "")) set_data_dev(t0, t0_value);
    			const map_changes = {};
    			if (dirty[0] & /*$maps, selectedMatch*/ 264) map_changes.map = /*$maps*/ ctx[8].find(/*func_5*/ ctx[86]);
    			map.$set(map_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(map);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_18.name,
    		type: "if",
    		source: "(461:2) {#if selectedMatch.bans[0]}",
    		ctx
    	});

    	return block;
    }

    // (480:111) 
    function create_if_block_21(ctx) {
    	let div;
    	let map;
    	let current;

    	map = new Map$1({
    			props: { map: /*map*/ ctx[113] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(map.$$.fragment);
    			attr_dev(div, "class", "disabled svelte-htbg4y");
    			add_location(div, file$1, 480, 10, 18994);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(map, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const map_changes = {};
    			if (dirty[0] & /*$maps*/ 256) map_changes.map = /*map*/ ctx[113];
    			map.$set(map_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(map);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_21.name,
    		type: "if",
    		source: "(480:111) ",
    		ctx
    	});

    	return block;
    }

    // (478:8) {#if !map.category.startsWith('Tiebreaker') && selectedMatch.protects[0]?.map?.id != map.id && selectedMatch.protects[1]?.map?.id != map.id}
    function create_if_block_20(ctx) {
    	let map;
    	let current;

    	function click_handler_19(...args) {
    		return /*click_handler_19*/ ctx[89](/*map*/ ctx[113], ...args);
    	}

    	map = new Map$1({
    			props: { map: /*map*/ ctx[113] },
    			$$inline: true
    		});

    	map.$on("click", click_handler_19);

    	const block = {
    		c: function create() {
    			create_component(map.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(map, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const map_changes = {};
    			if (dirty[0] & /*$maps*/ 256) map_changes.map = /*map*/ ctx[113];
    			map.$set(map_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(map, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_20.name,
    		type: "if",
    		source: "(478:8) {#if !map.category.startsWith('Tiebreaker') && selectedMatch.protects[0]?.map?.id != map.id && selectedMatch.protects[1]?.map?.id != map.id}",
    		ctx
    	});

    	return block;
    }

    // (477:6) {#each $maps as map (map.id)}
    function create_each_block_4(key_1, ctx) {
    	let first;
    	let show_if;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_20, create_if_block_21];
    	const if_blocks = [];

    	function select_block_type_7(ctx, dirty) {
    		if (dirty[0] & /*$maps, selectedMatch*/ 264) show_if = !!(!/*map*/ ctx[113].category.startsWith("Tiebreaker") && /*selectedMatch*/ ctx[3].protects[0]?.map?.id != /*map*/ ctx[113].id && /*selectedMatch*/ ctx[3].protects[1]?.map?.id != /*map*/ ctx[113].id);
    		if (show_if) return 0;
    		if (/*selectedMatch*/ ctx[3].protects[0]?.map?.id == /*map*/ ctx[113].id || /*selectedMatch*/ ctx[3].protects[1]?.map?.id == /*map*/ ctx[113].id) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type_7(ctx, [-1]))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_7(ctx, dirty);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(477:6) {#each $maps as map (map.id)}",
    		ctx
    	});

    	return block;
    }

    // (492:34) 
    function create_if_block_15$1(ctx) {
    	let div2;
    	let div0;
    	let input;
    	let input_value_value;
    	let t0;
    	let a;
    	let t2;
    	let div1;
    	let each_blocks = [];
    	let each_1_lookup = new Map_1();
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_3 = /*$maps*/ ctx[8];
    	validate_each_argument(each_value_3);
    	const get_key = ctx => /*map*/ ctx[113].id;
    	validate_each_keys(ctx, each_value_3, get_each_context_3, get_key);

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		let child_ctx = get_each_context_3(ctx, each_value_3, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_3(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			a = element("a");
    			a.textContent = "📝 Copy";
    			t2 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			input.readOnly = true;
    			input.value = input_value_value = `${/*getPlayerByRoll*/ ctx[43](/*selectedMatch*/ ctx[3], "winner").username}'s turn to ban: pick a map to ban`;
    			attr_dev(input, "class", "svelte-htbg4y");
    			add_location(input, file$1, 494, 6, 19385);
    			attr_dev(a, "href", "#/referee!helper");
    			attr_dev(a, "class", "copy");
    			add_location(a, file$1, 495, 6, 19526);
    			attr_dev(div0, "class", "call svelte-htbg4y");
    			add_location(div0, file$1, 493, 4, 19359);
    			attr_dev(div1, "class", "maps svelte-htbg4y");
    			add_location(div1, file$1, 497, 4, 19625);
    			attr_dev(div2, "class", "bans svelte-htbg4y");
    			add_location(div2, file$1, 492, 2, 19335);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, input);
    			/*input_binding_3*/ ctx[91](input);
    			append_dev(div0, t0);
    			append_dev(div0, a);
    			append_dev(div2, t2);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler_20*/ ctx[92], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*selectedMatch*/ 8 && input_value_value !== (input_value_value = `${/*getPlayerByRoll*/ ctx[43](/*selectedMatch*/ ctx[3], "winner").username}'s turn to ban: pick a map to ban`) && input.value !== input_value_value) {
    				prop_dev(input, "value", input_value_value);
    			}

    			if (dirty[0] & /*$maps, selectedMatch*/ 264 | dirty[1] & /*ban, getPlayerByRoll*/ 4608) {
    				each_value_3 = /*$maps*/ ctx[8];
    				validate_each_argument(each_value_3);
    				group_outros();
    				validate_each_keys(ctx, each_value_3, get_each_context_3, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_3, each_1_lookup, div1, outro_and_destroy_block, create_each_block_3, null, get_each_context_3);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_3.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			/*input_binding_3*/ ctx[91](null);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_15$1.name,
    		type: "if",
    		source: "(492:34) ",
    		ctx
    	});

    	return block;
    }

    // (487:2) {#if selectedMatch.bans[1]}
    function create_if_block_14$1(ctx) {
    	let div;
    	let t0_value = /*getPlayerByRoll*/ ctx[43](/*selectedMatch*/ ctx[3], "winner").username + "";
    	let t0;
    	let t1;
    	let map;
    	let current;

    	map = new Map$1({
    			props: {
    				map: /*$maps*/ ctx[8].find(/*func_6*/ ctx[90])
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = text("'s ban\r\n    ");
    			create_component(map.$$.fragment);
    			attr_dev(div, "class", "bans svelte-htbg4y");
    			add_location(div, file$1, 487, 2, 19131);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			mount_component(map, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[0] & /*selectedMatch*/ 8) && t0_value !== (t0_value = /*getPlayerByRoll*/ ctx[43](/*selectedMatch*/ ctx[3], "winner").username + "")) set_data_dev(t0, t0_value);
    			const map_changes = {};
    			if (dirty[0] & /*$maps, selectedMatch*/ 264) map_changes.map = /*$maps*/ ctx[8].find(/*func_6*/ ctx[90]);
    			map.$set(map_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(map);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_14$1.name,
    		type: "if",
    		source: "(487:2) {#if selectedMatch.bans[1]}",
    		ctx
    	});

    	return block;
    }

    // (502:154) 
    function create_if_block_17(ctx) {
    	let div;
    	let map;
    	let current;

    	map = new Map$1({
    			props: { map: /*map*/ ctx[113] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(map.$$.fragment);
    			attr_dev(div, "class", "disabled svelte-htbg4y");
    			add_location(div, file$1, 502, 10, 20146);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(map, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const map_changes = {};
    			if (dirty[0] & /*$maps*/ 256) map_changes.map = /*map*/ ctx[113];
    			map.$set(map_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(map);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_17.name,
    		type: "if",
    		source: "(502:154) ",
    		ctx
    	});

    	return block;
    }

    // (500:8) {#if !map.category.startsWith('Tiebreaker') && selectedMatch.protects[0]?.map?.id != map.id && selectedMatch.protects[1]?.map?.id != map.id && selectedMatch.bans[0]?.map.id != map.id}
    function create_if_block_16(ctx) {
    	let map;
    	let current;

    	function click_handler_21(...args) {
    		return /*click_handler_21*/ ctx[93](/*map*/ ctx[113], ...args);
    	}

    	map = new Map$1({
    			props: { map: /*map*/ ctx[113] },
    			$$inline: true
    		});

    	map.$on("click", click_handler_21);

    	const block = {
    		c: function create() {
    			create_component(map.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(map, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const map_changes = {};
    			if (dirty[0] & /*$maps*/ 256) map_changes.map = /*map*/ ctx[113];
    			map.$set(map_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(map, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_16.name,
    		type: "if",
    		source: "(500:8) {#if !map.category.startsWith('Tiebreaker') && selectedMatch.protects[0]?.map?.id != map.id && selectedMatch.protects[1]?.map?.id != map.id && selectedMatch.bans[0]?.map.id != map.id}",
    		ctx
    	});

    	return block;
    }

    // (499:6) {#each $maps as map (map.id)}
    function create_each_block_3(key_1, ctx) {
    	let first;
    	let show_if;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_16, create_if_block_17];
    	const if_blocks = [];

    	function select_block_type_9(ctx, dirty) {
    		if (dirty[0] & /*$maps, selectedMatch*/ 264) show_if = !!(!/*map*/ ctx[113].category.startsWith("Tiebreaker") && /*selectedMatch*/ ctx[3].protects[0]?.map?.id != /*map*/ ctx[113].id && /*selectedMatch*/ ctx[3].protects[1]?.map?.id != /*map*/ ctx[113].id && /*selectedMatch*/ ctx[3].bans[0]?.map.id != /*map*/ ctx[113].id);
    		if (show_if) return 0;
    		if (/*selectedMatch*/ ctx[3].protects[0]?.map?.id == /*map*/ ctx[113].id || /*selectedMatch*/ ctx[3].protects[1]?.map?.id == /*map*/ ctx[113].id || /*selectedMatch*/ ctx[3].bans[0]?.map.id == /*map*/ ctx[113].id) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type_9(ctx, [-1]))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_9(ctx, dirty);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(499:6) {#each $maps as map (map.id)}",
    		ctx
    	});

    	return block;
    }

    // (512:2) {#if selectedMatch.bans[1]}
    function create_if_block_8$1(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map_1();
    	let t;
    	let if_block_anchor;
    	let current;
    	let each_value_2 = /*picks*/ ctx[32];
    	validate_each_argument(each_value_2);
    	const get_key = ctx => /*pick*/ ctx[44].id;
    	validate_each_keys(ctx, each_value_2, get_each_context_2, get_key);

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		let child_ctx = get_each_context_2(ctx, each_value_2, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_2(key, child_ctx));
    	}

    	let if_block = !/*scorePending*/ ctx[35] && /*points1*/ ctx[4] < /*winCondition*/ ctx[1] && /*points2*/ ctx[5] < /*winCondition*/ ctx[1] && !(/*points1*/ ctx[4] == /*winCondition*/ ctx[1] - 1 && /*points2*/ ctx[5] == /*winCondition*/ ctx[1] - 1) && create_if_block_9$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(div, "class", "picks svelte-htbg4y");
    			add_location(div, file$1, 512, 2, 20299);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*selectedMatch, fetchingScores, actionelt, $maps*/ 4195080 | dirty[1] & /*picks, overrideScores, refreshScores, copy*/ 3138) {
    				each_value_2 = /*picks*/ ctx[32];
    				validate_each_argument(each_value_2);
    				group_outros();
    				validate_each_keys(ctx, each_value_2, get_each_context_2, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_2, each_1_lookup, div, outro_and_destroy_block, create_each_block_2, null, get_each_context_2);
    				check_outros();
    			}

    			if (!/*scorePending*/ ctx[35] && /*points1*/ ctx[4] < /*winCondition*/ ctx[1] && /*points2*/ ctx[5] < /*winCondition*/ ctx[1] && !(/*points1*/ ctx[4] == /*winCondition*/ ctx[1] - 1 && /*points2*/ ctx[5] == /*winCondition*/ ctx[1] - 1)) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*points1, winCondition, points2*/ 50 | dirty[1] & /*scorePending*/ 16) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_9$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8$1.name,
    		type: "if",
    		source: "(512:2) {#if selectedMatch.bans[1]}",
    		ctx
    	});

    	return block;
    }

    // (522:6) {:else}
    function create_else_block_2(ctx) {
    	let div0;
    	let input;
    	let input_value_value;
    	let t0;
    	let a;
    	let t2;
    	let div1;
    	let t3;
    	let p0;
    	let t5;
    	let p1;
    	let button0;
    	let t6_value = /*selectedMatch*/ ctx[3].players[0].player.username + "";
    	let t6;
    	let t7;
    	let button1;
    	let t8_value = /*selectedMatch*/ ctx[3].players[1].player.username + "";
    	let t8;
    	let t9;
    	let mounted;
    	let dispose;

    	function select_block_type_11(ctx, dirty) {
    		if (/*fetchingScores*/ ctx[9]) return create_if_block_13$1;
    		return create_else_block_3;
    	}

    	let current_block_type = select_block_type_11(ctx);
    	let if_block = current_block_type(ctx);

    	function click_handler_24() {
    		return /*click_handler_24*/ ctx[98](/*pick*/ ctx[44]);
    	}

    	function click_handler_25() {
    		return /*click_handler_25*/ ctx[99](/*pick*/ ctx[44]);
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			a = element("a");
    			a.textContent = "📝 Copy";
    			t2 = space();
    			div1 = element("div");
    			if_block.c();
    			t3 = space();
    			p0 = element("p");
    			p0.textContent = "If it doesn't work or lags (likely to happen if osu doesn't cooperate), bypass this thing by manually selecting the winner. If it's totally broken, refresh the page lol";
    			t5 = space();
    			p1 = element("p");
    			button0 = element("button");
    			t6 = text(t6_value);
    			t7 = space();
    			button1 = element("button");
    			t8 = text(t8_value);
    			t9 = space();
    			input.readOnly = true;
    			input.value = input_value_value = `!mp map ${/*pick*/ ctx[44].map.id} 3`;
    			attr_dev(input, "class", "svelte-htbg4y");
    			add_location(input, file$1, 523, 8, 20813);
    			attr_dev(a, "href", "#/referee!helper");
    			attr_dev(a, "class", "copy");
    			add_location(a, file$1, 524, 8, 20898);
    			attr_dev(div0, "class", "call svelte-htbg4y");
    			add_location(div0, file$1, 522, 6, 20785);
    			add_location(p0, file$1, 532, 8, 21273);
    			add_location(button0, file$1, 536, 10, 21495);
    			add_location(button1, file$1, 537, 10, 21641);
    			add_location(p1, file$1, 535, 8, 21480);
    			attr_dev(div1, "class", "fetcher svelte-htbg4y");
    			add_location(div1, file$1, 526, 6, 21004);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, input);
    			/*input_binding_4*/ ctx[95](input);
    			append_dev(div0, t0);
    			append_dev(div0, a);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			if_block.m(div1, null);
    			append_dev(div1, t3);
    			append_dev(div1, p0);
    			append_dev(div1, t5);
    			append_dev(div1, p1);
    			append_dev(p1, button0);
    			append_dev(button0, t6);
    			append_dev(p1, t7);
    			append_dev(p1, button1);
    			append_dev(button1, t8);
    			append_dev(div1, t9);

    			if (!mounted) {
    				dispose = [
    					listen_dev(a, "click", /*click_handler_22*/ ctx[96], false, false, false),
    					listen_dev(button0, "click", click_handler_24, false, false, false),
    					listen_dev(button1, "click", click_handler_25, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[1] & /*picks*/ 2 && input_value_value !== (input_value_value = `!mp map ${/*pick*/ ctx[44].map.id} 3`) && input.value !== input_value_value) {
    				prop_dev(input, "value", input_value_value);
    			}

    			if (current_block_type === (current_block_type = select_block_type_11(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, t3);
    				}
    			}

    			if (dirty[0] & /*selectedMatch*/ 8 && t6_value !== (t6_value = /*selectedMatch*/ ctx[3].players[0].player.username + "")) set_data_dev(t6, t6_value);
    			if (dirty[0] & /*selectedMatch*/ 8 && t8_value !== (t8_value = /*selectedMatch*/ ctx[3].players[1].player.username + "")) set_data_dev(t8, t8_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			/*input_binding_4*/ ctx[95](null);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(522:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (517:6) {#if pick.scores.length}
    function create_if_block_12$1(ctx) {
    	let div;

    	let t0_value = (/*pick*/ ctx[44].scores[0].score > /*pick*/ ctx[44].scores[1].score
    	? /*selectedMatch*/ ctx[3].players[0].player.username
    	: /*selectedMatch*/ ctx[3].players[1].player.username) + "";

    	let t0;
    	let t1;
    	let t2_value = /*pick*/ ctx[44].scores[0].score + "";
    	let t2;
    	let t3;
    	let t4_value = /*pick*/ ctx[44].scores[1].score + "";
    	let t4;
    	let t5;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = text("\r\n          won the pick! (");
    			t2 = text(t2_value);
    			t3 = text(" vs. ");
    			t4 = text(t4_value);
    			t5 = text(")\r\n        ");
    			attr_dev(div, "class", "win svelte-htbg4y");
    			add_location(div, file$1, 517, 8, 20509);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			append_dev(div, t3);
    			append_dev(div, t4);
    			append_dev(div, t5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*selectedMatch*/ 8 | dirty[1] & /*picks*/ 2 && t0_value !== (t0_value = (/*pick*/ ctx[44].scores[0].score > /*pick*/ ctx[44].scores[1].score
    			? /*selectedMatch*/ ctx[3].players[0].player.username
    			: /*selectedMatch*/ ctx[3].players[1].player.username) + "")) set_data_dev(t0, t0_value);

    			if (dirty[1] & /*picks*/ 2 && t2_value !== (t2_value = /*pick*/ ctx[44].scores[0].score + "")) set_data_dev(t2, t2_value);
    			if (dirty[1] & /*picks*/ 2 && t4_value !== (t4_value = /*pick*/ ctx[44].scores[1].score + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_12$1.name,
    		type: "if",
    		source: "(517:6) {#if pick.scores.length}",
    		ctx
    	});

    	return block;
    }

    // (530:8) {:else}
    function create_else_block_3(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	function click_handler_23() {
    		return /*click_handler_23*/ ctx[97](/*pick*/ ctx[44]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "After the song is done (scores show up in chat), click to refresh the scores";
    			add_location(button, file$1, 530, 10, 21114);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_23, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3.name,
    		type: "else",
    		source: "(530:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (528:8) {#if fetchingScores}
    function create_if_block_13$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Fetching scores...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_13$1.name,
    		type: "if",
    		source: "(528:8) {#if fetchingScores}",
    		ctx
    	});

    	return block;
    }

    // (514:4) {#each picks as pick (pick.id)}
    function create_each_block_2(key_1, ctx) {
    	let t0_value = (/*pick*/ ctx[44].player?.username || "Tiebreaker") + "";
    	let t0;
    	let t1;
    	let map;
    	let t2;
    	let if_block_anchor;
    	let current;

    	function func_7(...args) {
    		return /*func_7*/ ctx[94](/*pick*/ ctx[44], ...args);
    	}

    	map = new Map$1({
    			props: { map: /*$maps*/ ctx[8].find(func_7) },
    			$$inline: true
    		});

    	function select_block_type_10(ctx, dirty) {
    		if (/*pick*/ ctx[44].scores.length) return create_if_block_12$1;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type_10(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = text(" picked\r\n      ");
    			create_component(map.$$.fragment);
    			t2 = space();
    			if_block.c();
    			if_block_anchor = empty();
    			this.first = t0;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(map, target, anchor);
    			insert_dev(target, t2, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty[1] & /*picks*/ 2) && t0_value !== (t0_value = (/*pick*/ ctx[44].player?.username || "Tiebreaker") + "")) set_data_dev(t0, t0_value);
    			const map_changes = {};
    			if (dirty[0] & /*$maps*/ 256 | dirty[1] & /*picks*/ 2) map_changes.map = /*$maps*/ ctx[8].find(func_7);
    			map.$set(map_changes);

    			if (current_block_type === (current_block_type = select_block_type_10(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			destroy_component(map, detaching);
    			if (detaching) detach_dev(t2);
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(514:4) {#each picks as pick (pick.id)}",
    		ctx
    	});

    	return block;
    }

    // (544:2) {#if !scorePending && points1 < winCondition && points2 < winCondition && !(points1 == winCondition-1 && points2 == winCondition-1)}
    function create_if_block_9$1(ctx) {
    	let div2;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;

    	let t5_value = (/*riceCount*/ ctx[33] < /*lnCount*/ ctx[34]
    	? "Tiebreaker (rice)"
    	: "Tiebreaker (hybrid)") + "";

    	let t5;
    	let t6;
    	let div0;
    	let input;
    	let input_value_value;
    	let t7;
    	let a;
    	let t9;
    	let div1;
    	let each_blocks = [];
    	let each_1_lookup = new Map_1();
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*$maps*/ ctx[8];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*map*/ ctx[113].id;
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			t0 = text("Picks (Picked: ");
    			t1 = text(/*riceCount*/ ctx[33]);
    			t2 = text(" rice, ");
    			t3 = text(/*lnCount*/ ctx[34]);
    			t4 = text(" LN/Hybrid; current TB = ");
    			t5 = text(t5_value);
    			t6 = text(")\r\n    ");
    			div0 = element("div");
    			input = element("input");
    			t7 = space();
    			a = element("a");
    			a.textContent = "📝 Copy";
    			t9 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			input.readOnly = true;

    			input.value = input_value_value = /*selectedMatch*/ ctx[3].picks.length
    			? `${/*selectedMatch*/ ctx[3].players[0].player.username} ${/*points1*/ ctx[4]} - ${/*points2*/ ctx[5]} ${/*selectedMatch*/ ctx[3].players[1].player.username} | Loser's turn to pick: ${/*picker*/ ctx[2].username}, please pick a map!`
    			: `${/*selectedMatch*/ ctx[3].players[0].player.username} ${/*points1*/ ctx[4]} - ${/*points2*/ ctx[5]} ${/*selectedMatch*/ ctx[3].players[1].player.username} | ${/*picker*/ ctx[2].username} picks first: please pick a map!`;

    			attr_dev(input, "class", "svelte-htbg4y");
    			add_location(input, file$1, 547, 6, 22171);
    			attr_dev(a, "href", "#/referee!helper");
    			attr_dev(a, "class", "copy");
    			add_location(a, file$1, 551, 6, 22629);
    			attr_dev(div0, "class", "call svelte-htbg4y");
    			add_location(div0, file$1, 546, 4, 22145);
    			attr_dev(div1, "class", "maps svelte-htbg4y");
    			add_location(div1, file$1, 553, 4, 22729);
    			attr_dev(div2, "class", "picks svelte-htbg4y");
    			add_location(div2, file$1, 544, 2, 21979);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, t0);
    			append_dev(div2, t1);
    			append_dev(div2, t2);
    			append_dev(div2, t3);
    			append_dev(div2, t4);
    			append_dev(div2, t5);
    			append_dev(div2, t6);
    			append_dev(div2, div0);
    			append_dev(div0, input);
    			/*input_binding_5*/ ctx[100](input);
    			append_dev(div0, t7);
    			append_dev(div0, a);
    			append_dev(div2, t9);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler_26*/ ctx[101], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[1] & /*riceCount*/ 4) set_data_dev(t1, /*riceCount*/ ctx[33]);
    			if (!current || dirty[1] & /*lnCount*/ 8) set_data_dev(t3, /*lnCount*/ ctx[34]);

    			if ((!current || dirty[1] & /*riceCount, lnCount*/ 12) && t5_value !== (t5_value = (/*riceCount*/ ctx[33] < /*lnCount*/ ctx[34]
    			? "Tiebreaker (rice)"
    			: "Tiebreaker (hybrid)") + "")) set_data_dev(t5, t5_value);

    			if (!current || dirty[0] & /*selectedMatch, points1, points2, picker*/ 60 && input_value_value !== (input_value_value = /*selectedMatch*/ ctx[3].picks.length
    			? `${/*selectedMatch*/ ctx[3].players[0].player.username} ${/*points1*/ ctx[4]} - ${/*points2*/ ctx[5]} ${/*selectedMatch*/ ctx[3].players[1].player.username} | Loser's turn to pick: ${/*picker*/ ctx[2].username}, please pick a map!`
    			: `${/*selectedMatch*/ ctx[3].players[0].player.username} ${/*points1*/ ctx[4]} - ${/*points2*/ ctx[5]} ${/*selectedMatch*/ ctx[3].players[1].player.username} | ${/*picker*/ ctx[2].username} picks first: please pick a map!`) && input.value !== input_value_value) {
    				prop_dev(input, "value", input_value_value);
    			}

    			if (dirty[0] & /*$maps, selectedMatch*/ 264 | dirty[1] & /*pick, picks*/ 8194) {
    				each_value_1 = /*$maps*/ ctx[8];
    				validate_each_argument(each_value_1);
    				group_outros();
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, div1, outro_and_destroy_block, create_each_block_1, null, get_each_context_1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			/*input_binding_5*/ ctx[100](null);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9$1.name,
    		type: "if",
    		source: "(544:2) {#if !scorePending && points1 < winCondition && points2 < winCondition && !(points1 == winCondition-1 && points2 == winCondition-1)}",
    		ctx
    	});

    	return block;
    }

    // (558:142) 
    function create_if_block_11$1(ctx) {
    	let div;
    	let map;
    	let current;

    	map = new Map$1({
    			props: { map: /*map*/ ctx[113] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(map.$$.fragment);
    			attr_dev(div, "class", "disabled svelte-htbg4y");
    			add_location(div, file$1, 558, 10, 23186);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(map, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const map_changes = {};
    			if (dirty[0] & /*$maps*/ 256) map_changes.map = /*map*/ ctx[113];
    			map.$set(map_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(map);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_11$1.name,
    		type: "if",
    		source: "(558:142) ",
    		ctx
    	});

    	return block;
    }

    // (556:8) {#if !map.category.startsWith('Tiebreaker') && selectedMatch.bans[0]?.map?.id != map.id && selectedMatch.bans[1]?.map?.id != map.id && !picks.find(p => p.map.id == map.id)}
    function create_if_block_10$1(ctx) {
    	let map;
    	let current;

    	function click_handler_27(...args) {
    		return /*click_handler_27*/ ctx[102](/*map*/ ctx[113], ...args);
    	}

    	map = new Map$1({
    			props: { map: /*map*/ ctx[113] },
    			$$inline: true
    		});

    	map.$on("click", click_handler_27);

    	const block = {
    		c: function create() {
    			create_component(map.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(map, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const map_changes = {};
    			if (dirty[0] & /*$maps*/ 256) map_changes.map = /*map*/ ctx[113];
    			map.$set(map_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(map, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10$1.name,
    		type: "if",
    		source: "(556:8) {#if !map.category.startsWith('Tiebreaker') && selectedMatch.bans[0]?.map?.id != map.id && selectedMatch.bans[1]?.map?.id != map.id && !picks.find(p => p.map.id == map.id)}",
    		ctx
    	});

    	return block;
    }

    // (555:6) {#each $maps as map (map.id)}
    function create_each_block_1(key_1, ctx) {
    	let first;
    	let show_if;
    	let show_if_1;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;

    	function func_1(...args) {
    		return /*func_1*/ ctx[48](/*map*/ ctx[113], ...args);
    	}

    	function func_2(...args) {
    		return /*func_2*/ ctx[49](/*map*/ ctx[113], ...args);
    	}

    	const if_block_creators = [create_if_block_10$1, create_if_block_11$1];
    	const if_blocks = [];

    	function select_block_type_12(ctx, dirty) {
    		if (dirty[0] & /*$maps, selectedMatch*/ 264 | dirty[1] & /*picks*/ 2) show_if = !!(!/*map*/ ctx[113].category.startsWith("Tiebreaker") && /*selectedMatch*/ ctx[3].bans[0]?.map?.id != /*map*/ ctx[113].id && /*selectedMatch*/ ctx[3].bans[1]?.map?.id != /*map*/ ctx[113].id && !/*picks*/ ctx[32].find(func_1));
    		if (show_if) return 0;
    		if (dirty[0] & /*selectedMatch, $maps*/ 264 | dirty[1] & /*picks*/ 2) show_if_1 = !!(/*selectedMatch*/ ctx[3].bans[0]?.map?.id == /*map*/ ctx[113].id || /*selectedMatch*/ ctx[3].bans[1]?.map?.id == /*map*/ ctx[113].id || /*picks*/ ctx[32].find(func_2));
    		if (show_if_1) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type_12(ctx, [-1]))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_12(ctx, dirty);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(555:6) {#each $maps as map (map.id)}",
    		ctx
    	});

    	return block;
    }

    // (567:2) {#if points1 == winCondition-1 && points2 == winCondition-1 && !scorePending}
    function create_if_block_6$1(ctx) {
    	let div1;
    	let center;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;

    	let t5_value = (/*riceCount*/ ctx[33] < /*lnCount*/ ctx[34]
    	? "Tiebreaker (rice)"
    	: "Tiebreaker (hybrid)") + "";

    	let t5;
    	let br;
    	let t6;
    	let t7;
    	let div0;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block_7$1, create_else_block_1$1];
    	const if_blocks = [];

    	function select_block_type_13(ctx, dirty) {
    		if (/*riceCount*/ ctx[33] < /*lnCount*/ ctx[34]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_13(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			center = element("center");
    			t0 = text("Woah, that's a tiebreaker situation! ");
    			t1 = text(/*riceCount*/ ctx[33]);
    			t2 = text(" rice, ");
    			t3 = text(/*lnCount*/ ctx[34]);
    			t4 = text(" LN/Hybrid, TB = ");
    			t5 = text(t5_value);
    			br = element("br");
    			t6 = text("\r\n      (Click on the tiebreaker to confirm it)");
    			t7 = space();
    			div0 = element("div");
    			if_block.c();
    			add_location(br, file$1, 569, 154, 23573);
    			add_location(center, file$1, 568, 4, 23409);
    			attr_dev(div0, "class", "maps svelte-htbg4y");
    			add_location(div0, file$1, 572, 4, 23647);
    			attr_dev(div1, "class", "picks svelte-htbg4y");
    			add_location(div1, file$1, 567, 2, 23384);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, center);
    			append_dev(center, t0);
    			append_dev(center, t1);
    			append_dev(center, t2);
    			append_dev(center, t3);
    			append_dev(center, t4);
    			append_dev(center, t5);
    			append_dev(center, br);
    			append_dev(center, t6);
    			append_dev(div1, t7);
    			append_dev(div1, div0);
    			if_blocks[current_block_type_index].m(div0, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[1] & /*riceCount*/ 4) set_data_dev(t1, /*riceCount*/ ctx[33]);
    			if (!current || dirty[1] & /*lnCount*/ 8) set_data_dev(t3, /*lnCount*/ ctx[34]);

    			if ((!current || dirty[1] & /*riceCount, lnCount*/ 12) && t5_value !== (t5_value = (/*riceCount*/ ctx[33] < /*lnCount*/ ctx[34]
    			? "Tiebreaker (rice)"
    			: "Tiebreaker (hybrid)") + "")) set_data_dev(t5, t5_value);

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_13(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div0, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6$1.name,
    		type: "if",
    		source: "(567:2) {#if points1 == winCondition-1 && points2 == winCondition-1 && !scorePending}",
    		ctx
    	});

    	return block;
    }

    // (576:4) {:else}
    function create_else_block_1$1(ctx) {
    	let map;
    	let current;

    	map = new Map$1({
    			props: { map: /*hybridTiebreaker*/ ctx[24] },
    			$$inline: true
    		});

    	map.$on("click", /*click_handler_29*/ ctx[104]);

    	const block = {
    		c: function create() {
    			create_component(map.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(map, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const map_changes = {};
    			if (dirty[0] & /*hybridTiebreaker*/ 16777216) map_changes.map = /*hybridTiebreaker*/ ctx[24];
    			map.$set(map_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(map, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(576:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (574:4) {#if riceCount < lnCount}
    function create_if_block_7$1(ctx) {
    	let map;
    	let current;

    	map = new Map$1({
    			props: { map: /*riceTiebreaker*/ ctx[23] },
    			$$inline: true
    		});

    	map.$on("click", /*click_handler_28*/ ctx[103]);

    	const block = {
    		c: function create() {
    			create_component(map.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(map, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const map_changes = {};
    			if (dirty[0] & /*riceTiebreaker*/ 8388608) map_changes.map = /*riceTiebreaker*/ ctx[23];
    			map.$set(map_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(map.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(map.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(map, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7$1.name,
    		type: "if",
    		source: "(574:4) {#if riceCount < lnCount}",
    		ctx
    	});

    	return block;
    }

    // (583:2) {#if points1 >= winCondition}
    function create_if_block_5$1(ctx) {
    	let div1;
    	let div0;
    	let input;
    	let input_value_value;
    	let t0;
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			a = element("a");
    			a.textContent = "📝 Copy";
    			input.readOnly = true;
    			input.value = input_value_value = `${/*selectedMatch*/ ctx[3].players[0].player.username} ${/*points1*/ ctx[4]} - ${/*points2*/ ctx[5]} ${/*selectedMatch*/ ctx[3].players[1].player.username} | ${/*selectedMatch*/ ctx[3].players[0].player.username} wins the match! Congratulations!`;
    			attr_dev(input, "class", "svelte-htbg4y");
    			add_location(input, file$1, 585, 6, 24018);
    			attr_dev(a, "href", "#/referee!helper");
    			attr_dev(a, "class", "copy");
    			add_location(a, file$1, 586, 6, 24267);
    			attr_dev(div0, "class", "call svelte-htbg4y");
    			add_location(div0, file$1, 584, 4, 23992);
    			attr_dev(div1, "class", "winner svelte-htbg4y");
    			add_location(div1, file$1, 583, 2, 23966);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, input);
    			/*input_binding_6*/ ctx[105](input);
    			append_dev(div0, t0);
    			append_dev(div0, a);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler_30*/ ctx[106], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*selectedMatch, points1, points2*/ 56 && input_value_value !== (input_value_value = `${/*selectedMatch*/ ctx[3].players[0].player.username} ${/*points1*/ ctx[4]} - ${/*points2*/ ctx[5]} ${/*selectedMatch*/ ctx[3].players[1].player.username} | ${/*selectedMatch*/ ctx[3].players[0].player.username} wins the match! Congratulations!`) && input.value !== input_value_value) {
    				prop_dev(input, "value", input_value_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			/*input_binding_6*/ ctx[105](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$1.name,
    		type: "if",
    		source: "(583:2) {#if points1 >= winCondition}",
    		ctx
    	});

    	return block;
    }

    // (591:2) {#if points2 >= winCondition}
    function create_if_block_4$1(ctx) {
    	let div1;
    	let div0;
    	let input;
    	let input_value_value;
    	let t0;
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			a = element("a");
    			a.textContent = "📝 Copy";
    			input.readOnly = true;
    			input.value = input_value_value = `${/*selectedMatch*/ ctx[3].players[0].player.username} ${/*points1*/ ctx[4]} - ${/*points2*/ ctx[5]} ${/*selectedMatch*/ ctx[3].players[1].player.username} | ${/*selectedMatch*/ ctx[3].players[1].player.username} wins the match! Congratulations!`;
    			attr_dev(input, "class", "svelte-htbg4y");
    			add_location(input, file$1, 593, 6, 24471);
    			attr_dev(a, "href", "#/referee!helper");
    			attr_dev(a, "class", "copy");
    			add_location(a, file$1, 594, 6, 24720);
    			attr_dev(div0, "class", "call svelte-htbg4y");
    			add_location(div0, file$1, 592, 4, 24445);
    			attr_dev(div1, "class", "winner svelte-htbg4y");
    			add_location(div1, file$1, 591, 2, 24419);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, input);
    			/*input_binding_7*/ ctx[107](input);
    			append_dev(div0, t0);
    			append_dev(div0, a);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler_31*/ ctx[108], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*selectedMatch, points1, points2*/ 56 && input_value_value !== (input_value_value = `${/*selectedMatch*/ ctx[3].players[0].player.username} ${/*points1*/ ctx[4]} - ${/*points2*/ ctx[5]} ${/*selectedMatch*/ ctx[3].players[1].player.username} | ${/*selectedMatch*/ ctx[3].players[1].player.username} wins the match! Congratulations!`) && input.value !== input_value_value) {
    				prop_dev(input, "value", input_value_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			/*input_binding_7*/ ctx[107](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(591:2) {#if points2 >= winCondition}",
    		ctx
    	});

    	return block;
    }

    // (282:4) {#if        (          !onlyMyMatches ||          match.referee?.id == $me?.id ||          match.streamer?.id == $me?.id ||          match.commentators.find(({ commentator }) => commentator.id == $me?.id)        ) && (          showPastMatches ||          (match.points1 < winCondition && match.points2 < winCondition && !match.wbd)        )      }
    function create_if_block_3$1(ctx) {
    	let div;
    	let match;
    	let t;
    	let current;

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[52](/*match*/ ctx[110], ...args);
    	}

    	match = new Match({
    			props: { match: /*match*/ ctx[110] },
    			$$inline: true
    		});

    	match.$on("click", click_handler_2);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(match.$$.fragment);
    			t = space();
    			attr_dev(div, "class", "match-container");
    			add_location(div, file$1, 292, 6, 11087);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(match, div, null);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const match_changes = {};
    			if (dirty[0] & /*$matches*/ 128) match_changes.match = /*match*/ ctx[110];
    			match.$set(match_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(match.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(match.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(match);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(282:4) {#if        (          !onlyMyMatches ||          match.referee?.id == $me?.id ||          match.streamer?.id == $me?.id ||          match.commentators.find(({ commentator }) => commentator.id == $me?.id)        ) && (          showPastMatches ||          (match.points1 < winCondition && match.points2 < winCondition && !match.wbd)        )      }",
    		ctx
    	});

    	return block;
    }

    // (281:2) {#each $matches as match (match.id)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let show_if = (!/*onlyMyMatches*/ ctx[25] || /*match*/ ctx[110].referee?.id == /*$me*/ ctx[6]?.id || /*match*/ ctx[110].streamer?.id == /*$me*/ ctx[6]?.id || /*match*/ ctx[110].commentators.find(/*func*/ ctx[47])) && (/*showPastMatches*/ ctx[26] || /*match*/ ctx[110].points1 < /*winCondition*/ ctx[1] && /*match*/ ctx[110].points2 < /*winCondition*/ ctx[1] && !/*match*/ ctx[110].wbd);
    	let if_block_anchor;
    	let current;
    	let if_block = show_if && create_if_block_3$1(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*onlyMyMatches, $matches, $me, showPastMatches, winCondition*/ 100663490) show_if = (!/*onlyMyMatches*/ ctx[25] || /*match*/ ctx[110].referee?.id == /*$me*/ ctx[6]?.id || /*match*/ ctx[110].streamer?.id == /*$me*/ ctx[6]?.id || /*match*/ ctx[110].commentators.find(/*func*/ ctx[47])) && (/*showPastMatches*/ ctx[26] || /*match*/ ctx[110].points1 < /*winCondition*/ ctx[1] && /*match*/ ctx[110].points2 < /*winCondition*/ ctx[1] && !/*match*/ ctx[110].wbd);

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*onlyMyMatches, $matches, $me, showPastMatches, winCondition*/ 100663490) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_3$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(281:2) {#each $matches as match (match.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$1, create_if_block_1$1, create_if_block_2$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*$me*/ ctx[6]) return 0;
    		if (!/*$matches*/ ctx[7]) return 1;
    		if (!/*selectedMatch*/ ctx[3]) return 2;
    		return 3;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "container svelte-htbg4y");
    			add_location(div, file$1, 265, 0, 9883);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $me;
    	let $stages;
    	let $matches;
    	let $maps;
    	validate_store(me, "me");
    	component_subscribe($$self, me, $$value => $$invalidate(6, $me = $$value));
    	validate_store(stages, "stages");
    	component_subscribe($$self, stages, $$value => $$invalidate(46, $stages = $$value));
    	validate_store(matches, "matches");
    	component_subscribe($$self, matches, $$value => $$invalidate(7, $matches = $$value));
    	validate_store(maps, "maps");
    	component_subscribe($$self, maps, $$value => $$invalidate(8, $maps = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("RefereeHelper", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	var _a;
    	
    	let stage;
    	let winCondition;

    	const selectMatch = ($event, match) => {
    		$event.preventDefault();
    		$$invalidate(3, selectedMatch = match);

    		if (match) {
    			localStorage.setItem("referee:match", String(match.id));
    		} else {
    			localStorage.removeItem("referee:match");
    			init$2(stage.slug); // Refresh matches
    		}
    	};

    	const copy = elt => {
    		elt.select();
    		elt.setSelectionRange(0, 99999);
    		document.execCommand("copy");
    	};

    	const saveRolls = () => __awaiter(void 0, void 0, void 0, function* () {
    		if (!mpLink && !selectedMatch.link) return alert("Please fill the MP link!");
    		if (!roll1 || !roll2) return alert("Please set the rolls!");

    		// Optimistic update
    		$$invalidate(3, selectedMatch = Object.assign(Object.assign({}, selectedMatch), {
    			rolls: [
    				{
    					player: selectedMatch.players[0].player,
    					value: roll1
    				},
    				{
    					player: selectedMatch.players[1].player,
    					value: roll2
    				}
    			]
    		}));

    		const res = yield api("/items/rolls", {
    			method: "POST",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify([
    				{
    					match: selectedMatch.id,
    					player: selectedMatch.players[0].player.id,
    					value: roll1
    				},
    				{
    					match: selectedMatch.id,
    					player: selectedMatch.players[1].player.id,
    					value: roll2
    				}
    			])
    		});

    		if (!selectedMatch.link) {
    			yield api(`/items/matches/${selectedMatch.id}`, {
    				method: "PATCH",
    				headers: { "Content-Type": "application/json" },
    				body: JSON.stringify({ link: mpLink })
    			});
    		}

    		if (res.errors) {
    			alert(res.errors[0].message);
    		} else {
    			$$invalidate(3, selectedMatch = Object.assign(Object.assign({}, selectedMatch), { link: mpLink, rolls: res.data }));
    		}
    	});

    	const protect = ($event, map, player) => __awaiter(void 0, void 0, void 0, function* () {
    		$event.preventDefault();

    		// Optimistic update
    		$$invalidate(3, selectedMatch = Object.assign(Object.assign({}, selectedMatch), {
    			protects: [...selectedMatch.protects || [], { player, map }]
    		}));

    		const res = yield api("/items/protects", {
    			method: "POST",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify({
    				match: selectedMatch.id,
    				player: player.id,
    				map: map.id
    			})
    		});

    		if (res.errors) {
    			alert(res.errors[0].message);
    		} else {
    			$$invalidate(3, selectedMatch.protects[selectedMatch.protects.length - 1].id = res.data.id, selectedMatch);
    		}
    	});

    	const ban = ($event, map, player) => __awaiter(void 0, void 0, void 0, function* () {
    		$event.preventDefault();

    		// Optimistic update
    		$$invalidate(3, selectedMatch = Object.assign(Object.assign({}, selectedMatch), {
    			bans: [...selectedMatch.bans || [], { player, map }]
    		}));

    		const res = yield api("/items/bans", {
    			method: "POST",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify({
    				match: selectedMatch.id,
    				player: player.id,
    				map: map.id
    			})
    		});

    		if (res.errors) {
    			alert(res.errors[0].message);
    		} else {
    			$$invalidate(3, selectedMatch.bans[selectedMatch.bans.length - 1].id = res.data.id, selectedMatch);
    		}
    	});

    	const pick = ($event, map) => __awaiter(void 0, void 0, void 0, function* () {
    		$event.preventDefault();

    		// Optimistic update
    		$$invalidate(3, selectedMatch = Object.assign(Object.assign({}, selectedMatch), {
    			picks: [...selectedMatch.picks || [], { player: picker, map }]
    		}));

    		const res = yield api("/items/picks", {
    			method: "POST",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify({
    				match: selectedMatch.id,
    				player: picker === null || picker === void 0
    				? void 0
    				: picker.id,
    				map: map.id
    			})
    		});

    		if (res.errors) {
    			alert(res.errors[0].message);
    		} else {
    			$$invalidate(3, selectedMatch.picks[selectedMatch.picks.length - 1].id = res.data.id, selectedMatch);
    		}
    	});

    	let fetchingScores = false;

    	const refreshScores = map => __awaiter(void 0, void 0, void 0, function* () {
    		$$invalidate(9, fetchingScores = true);

    		const res = yield api("/custom/matches/scores", {
    			method: "POST",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify({ match: selectedMatch.id, map: map.id })
    		});

    		$$invalidate(9, fetchingScores = false);

    		if (res.errors) {
    			alert(res.errors[0].message);
    		} else {
    			$$invalidate(3, selectedMatch = Object.assign(Object.assign({}, selectedMatch), { scores: res }));
    		}
    	});

    	const overrideScores = (map, player) => __awaiter(void 0, void 0, void 0, function* () {
    		const loser = player.id == selectedMatch.players[0].player.id ? 1 : 0;

    		$$invalidate(3, selectedMatch = Object.assign(Object.assign({}, selectedMatch), {
    			scores: [
    				...selectedMatch.scores,
    				{ map, player, score: 1 },
    				{
    					map,
    					player: selectedMatch.players[loser].player,
    					score: 0
    				}
    			]
    		}));
    	});

    	let picker;
    	let selectedMatch;
    	let init1, init2, init3, init4, init5, init6;
    	let warmup1elt, warmup2elt;
    	let rollelt, protectelt, banelt, pickelt, actionelt;
    	let riceTiebreaker, hybridTiebreaker;
    	let onlyMyMatches = true;
    	let showPastMatches = false;
    	let mpLink = "";
    	let warmup1 = "", warmup2 = "";
    	let roll1, roll2;
    	let picks = [];
    	let points1 = 0, points2 = 0;
    	let riceCount = 0, lnCount = 0;
    	let scorePending;

    	const getPlayerByRoll = (match, which) => {
    		if (!match) return null;
    		const [roll1, roll2] = match.rolls;
    		if (!roll1 || !roll2) return null;
    		const [player1, player2] = match.players;

    		if (roll1.value > roll2.value) {
    			return which == "winner" ? player1.player : player2.player;
    		}

    		return which == "winner" ? player2.player : player1.player;
    	};

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<RefereeHelper> was created with unknown prop '${key}'`);
    	});

    	const func = ({ commentator }) => commentator.id == $me?.id;
    	const func_1 = (map, p) => p.map.id == map.id;
    	const func_2 = (map, p) => p.map.id == map.id;
    	const click_handler = () => $$invalidate(25, onlyMyMatches = !onlyMyMatches);
    	const click_handler_1 = () => $$invalidate(26, showPastMatches = !showPastMatches);
    	const click_handler_2 = (match, $event) => selectMatch($event, match);
    	const click_handler_3 = $event => selectMatch($event);

    	function input0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			init1 = $$value;
    			$$invalidate(10, init1);
    		});
    	}

    	const click_handler_4 = () => copy(init1);

    	function input1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			init2 = $$value;
    			$$invalidate(11, init2);
    		});
    	}

    	const click_handler_5 = () => copy(init2);

    	function input2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			init3 = $$value;
    			$$invalidate(12, init3);
    		});
    	}

    	const click_handler_6 = () => copy(init3);

    	function input3_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			init4 = $$value;
    			$$invalidate(13, init4);
    		});
    	}

    	const click_handler_7 = () => copy(init4);

    	function input4_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			init5 = $$value;
    			$$invalidate(14, init5);
    		});
    	}

    	const click_handler_8 = () => copy(init5);

    	function input5_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			init6 = $$value;
    			$$invalidate(15, init6);
    		});
    	}

    	const click_handler_9 = () => copy(init6);

    	function input_input_handler() {
    		mpLink = this.value;
    		$$invalidate(27, mpLink);
    	}

    	function input6_input_handler() {
    		warmup1 = this.value;
    		$$invalidate(28, warmup1);
    	}

    	function input7_input_handler() {
    		warmup2 = this.value;
    		$$invalidate(29, warmup2);
    	}

    	function input8_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			warmup1elt = $$value;
    			$$invalidate(16, warmup1elt);
    		});
    	}

    	const click_handler_10 = () => copy(warmup1elt);

    	function input9_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			warmup2elt = $$value;
    			$$invalidate(17, warmup2elt);
    		});
    	}

    	const click_handler_11 = () => copy(warmup2elt);

    	function input10_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			rollelt = $$value;
    			$$invalidate(18, rollelt);
    		});
    	}

    	const click_handler_12 = () => copy(rollelt);

    	function input0_input_handler() {
    		roll1 = to_number(this.value);
    		$$invalidate(30, roll1);
    	}

    	function input1_input_handler() {
    		roll2 = to_number(this.value);
    		$$invalidate(31, roll2);
    	}

    	const click_handler_13 = () => saveRolls();
    	const func_3 = m => m.id == selectedMatch.protects[0].map.id;

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			protectelt = $$value;
    			$$invalidate(19, protectelt);
    		});
    	}

    	const click_handler_14 = () => copy(protectelt);
    	const click_handler_15 = (map, $event) => protect($event, map, getPlayerByRoll(selectedMatch, "winner"));
    	const func_4 = m => m.id == selectedMatch.protects[1].map.id;

    	function input_binding_1($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			protectelt = $$value;
    			$$invalidate(19, protectelt);
    		});
    	}

    	const click_handler_16 = () => copy(protectelt);
    	const click_handler_17 = (map, $event) => protect($event, map, getPlayerByRoll(selectedMatch, "loser"));
    	const func_5 = m => m.id == selectedMatch.bans[0].map.id;

    	function input_binding_2($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			banelt = $$value;
    			$$invalidate(20, banelt);
    		});
    	}

    	const click_handler_18 = () => copy(banelt);
    	const click_handler_19 = (map, $event) => ban($event, map, getPlayerByRoll(selectedMatch, "loser"));
    	const func_6 = m => m.id == selectedMatch.bans[1].map.id;

    	function input_binding_3($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			banelt = $$value;
    			$$invalidate(20, banelt);
    		});
    	}

    	const click_handler_20 = () => copy(banelt);
    	const click_handler_21 = (map, $event) => ban($event, map, getPlayerByRoll(selectedMatch, "winner"));
    	const func_7 = (pick, m) => m.id == pick.map.id;

    	function input_binding_4($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			actionelt = $$value;
    			$$invalidate(22, actionelt);
    		});
    	}

    	const click_handler_22 = () => copy(actionelt);
    	const click_handler_23 = pick => refreshScores(pick.map);
    	const click_handler_24 = pick => overrideScores(pick.map, selectedMatch.players[0].player);
    	const click_handler_25 = pick => overrideScores(pick.map, selectedMatch.players[1].player);

    	function input_binding_5($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			pickelt = $$value;
    			$$invalidate(21, pickelt);
    		});
    	}

    	const click_handler_26 = () => copy(pickelt);
    	const click_handler_27 = (map, $event) => pick($event, map);
    	const click_handler_28 = $event => pick($event, riceTiebreaker);
    	const click_handler_29 = $event => pick($event, hybridTiebreaker);

    	function input_binding_6($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			actionelt = $$value;
    			$$invalidate(22, actionelt);
    		});
    	}

    	const click_handler_30 = () => copy(actionelt);

    	function input_binding_7($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			actionelt = $$value;
    			$$invalidate(22, actionelt);
    		});
    	}

    	const click_handler_31 = () => copy(actionelt);

    	$$self.$capture_state = () => ({
    		__awaiter,
    		_a,
    		me,
    		stages,
    		api,
    		matches,
    		maps,
    		init: init$2,
    		MatchFeed,
    		Match,
    		Map: Map$1,
    		stage,
    		winCondition,
    		selectMatch,
    		copy,
    		saveRolls,
    		protect,
    		ban,
    		pick,
    		fetchingScores,
    		refreshScores,
    		overrideScores,
    		picker,
    		selectedMatch,
    		init1,
    		init2,
    		init3,
    		init4,
    		init5,
    		init6,
    		warmup1elt,
    		warmup2elt,
    		rollelt,
    		protectelt,
    		banelt,
    		pickelt,
    		actionelt,
    		riceTiebreaker,
    		hybridTiebreaker,
    		onlyMyMatches,
    		showPastMatches,
    		mpLink,
    		warmup1,
    		warmup2,
    		roll1,
    		roll2,
    		picks,
    		points1,
    		points2,
    		riceCount,
    		lnCount,
    		scorePending,
    		getPlayerByRoll,
    		$me,
    		$stages,
    		$matches,
    		$maps
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("_a" in $$props) $$invalidate(45, _a = $$props._a);
    		if ("stage" in $$props) $$invalidate(0, stage = $$props.stage);
    		if ("winCondition" in $$props) $$invalidate(1, winCondition = $$props.winCondition);
    		if ("fetchingScores" in $$props) $$invalidate(9, fetchingScores = $$props.fetchingScores);
    		if ("picker" in $$props) $$invalidate(2, picker = $$props.picker);
    		if ("selectedMatch" in $$props) $$invalidate(3, selectedMatch = $$props.selectedMatch);
    		if ("init1" in $$props) $$invalidate(10, init1 = $$props.init1);
    		if ("init2" in $$props) $$invalidate(11, init2 = $$props.init2);
    		if ("init3" in $$props) $$invalidate(12, init3 = $$props.init3);
    		if ("init4" in $$props) $$invalidate(13, init4 = $$props.init4);
    		if ("init5" in $$props) $$invalidate(14, init5 = $$props.init5);
    		if ("init6" in $$props) $$invalidate(15, init6 = $$props.init6);
    		if ("warmup1elt" in $$props) $$invalidate(16, warmup1elt = $$props.warmup1elt);
    		if ("warmup2elt" in $$props) $$invalidate(17, warmup2elt = $$props.warmup2elt);
    		if ("rollelt" in $$props) $$invalidate(18, rollelt = $$props.rollelt);
    		if ("protectelt" in $$props) $$invalidate(19, protectelt = $$props.protectelt);
    		if ("banelt" in $$props) $$invalidate(20, banelt = $$props.banelt);
    		if ("pickelt" in $$props) $$invalidate(21, pickelt = $$props.pickelt);
    		if ("actionelt" in $$props) $$invalidate(22, actionelt = $$props.actionelt);
    		if ("riceTiebreaker" in $$props) $$invalidate(23, riceTiebreaker = $$props.riceTiebreaker);
    		if ("hybridTiebreaker" in $$props) $$invalidate(24, hybridTiebreaker = $$props.hybridTiebreaker);
    		if ("onlyMyMatches" in $$props) $$invalidate(25, onlyMyMatches = $$props.onlyMyMatches);
    		if ("showPastMatches" in $$props) $$invalidate(26, showPastMatches = $$props.showPastMatches);
    		if ("mpLink" in $$props) $$invalidate(27, mpLink = $$props.mpLink);
    		if ("warmup1" in $$props) $$invalidate(28, warmup1 = $$props.warmup1);
    		if ("warmup2" in $$props) $$invalidate(29, warmup2 = $$props.warmup2);
    		if ("roll1" in $$props) $$invalidate(30, roll1 = $$props.roll1);
    		if ("roll2" in $$props) $$invalidate(31, roll2 = $$props.roll2);
    		if ("picks" in $$props) $$invalidate(32, picks = $$props.picks);
    		if ("points1" in $$props) $$invalidate(4, points1 = $$props.points1);
    		if ("points2" in $$props) $$invalidate(5, points2 = $$props.points2);
    		if ("riceCount" in $$props) $$invalidate(33, riceCount = $$props.riceCount);
    		if ("lnCount" in $$props) $$invalidate(34, lnCount = $$props.lnCount);
    		if ("scorePending" in $$props) $$invalidate(35, scorePending = $$props.scorePending);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*$me, $matches, stage, $maps*/ 449 | $$self.$$.dirty[1] & /*$stages*/ 32768) {
    			if ($me && $stages && !$matches) {
    				let storedMatchId = localStorage.getItem("referee:match");

    				// Subtract one day to account for "overtime", i.e. matches that technically happen on monday
    				const nowMinusOne = new Date(Date.now() - 3600 * 24 * 1000).toISOString();

    				$$invalidate(0, stage = $stages.find(s => s.date_end > nowMinusOne));
    				$$invalidate(1, winCondition = 1 + (stage.best_of / 2 >> 0));

    				init$2(stage.slug).then(() => {
    					$$invalidate(3, selectedMatch = $matches.find(m => String(m.id) == storedMatchId));
    					$$invalidate(23, riceTiebreaker = $maps.find(m => m.category == "Tiebreaker (rice)"));
    					$$invalidate(24, hybridTiebreaker = $maps.find(m => m.category == "Tiebreaker (hybrid)"));
    				});
    			}
    		}

    		if ($$self.$$.dirty[0] & /*selectedMatch, points1, points2, winCondition, picker*/ 62 | $$self.$$.dirty[1] & /*_a, riceCount, lnCount*/ 16396) {
    			{
    				$$invalidate(2, picker = getPlayerByRoll(selectedMatch, "winner"));
    				$$invalidate(4, points1 = 0);
    				$$invalidate(5, points2 = 0);
    				$$invalidate(33, riceCount = 0);
    				$$invalidate(34, lnCount = 0);

    				$$invalidate(32, picks = $$invalidate(45, _a = selectedMatch === null || selectedMatch === void 0
    				? void 0
    				: selectedMatch.picks) === null || _a === void 0
    				? void 0
    				: _a.map(pick => {
    						var _a, _b, _c;

    						const res = Object.assign(Object.assign({}, pick), {
    							scores: ((_a = selectedMatch.scores) === null || _a === void 0
    							? void 0
    							: _a.filter(s => s.map.id == pick.map.id)) || []
    						});

    						// If there's only one score for the pick, the other player most likely disconnected
    						if (res.scores.length == 1) {
    							res.scores.push(Object.assign(Object.assign({}, res.scores[0]), {
    								player: selectedMatch.players[((_b = res.scores[0]) === null || _b === void 0
    								? void 0
    								: _b.player.id) == selectedMatch.players[0].player.id
    								? 1
    								: 0].player,
    								score: 0
    							}));
    						}

    						if (((_c = res.scores[0]) === null || _c === void 0
    						? void 0
    						: _c.player.id) != selectedMatch.players[0].player.id) {
    							res.scores = res.scores.reverse();
    						}

    						const [score1, score2] = res.scores;

    						if (score1 && score2) {
    							$$invalidate(35, scorePending = false);

    							if (score1.score > score2.score) {
    								$$invalidate(4, points1 += 1);
    								$$invalidate(2, picker = selectedMatch.players[1].player);
    							} else {
    								$$invalidate(5, points2 += 1);
    								$$invalidate(2, picker = selectedMatch.players[0].player);
    							}
    						} else {
    							$$invalidate(35, scorePending = true);
    						}

    						if (pick.map.category == "Rice") {
    							$$invalidate(33, riceCount += pick.map.weight);
    						} else {
    							$$invalidate(34, lnCount += pick.map.weight);
    						}

    						return res;
    					}));
    			}
    		}
    	};

    	return [
    		stage,
    		winCondition,
    		picker,
    		selectedMatch,
    		points1,
    		points2,
    		$me,
    		$matches,
    		$maps,
    		fetchingScores,
    		init1,
    		init2,
    		init3,
    		init4,
    		init5,
    		init6,
    		warmup1elt,
    		warmup2elt,
    		rollelt,
    		protectelt,
    		banelt,
    		pickelt,
    		actionelt,
    		riceTiebreaker,
    		hybridTiebreaker,
    		onlyMyMatches,
    		showPastMatches,
    		mpLink,
    		warmup1,
    		warmup2,
    		roll1,
    		roll2,
    		picks,
    		riceCount,
    		lnCount,
    		scorePending,
    		selectMatch,
    		copy,
    		saveRolls,
    		protect,
    		ban,
    		refreshScores,
    		overrideScores,
    		getPlayerByRoll,
    		pick,
    		_a,
    		$stages,
    		func,
    		func_1,
    		func_2,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		input0_binding,
    		click_handler_4,
    		input1_binding,
    		click_handler_5,
    		input2_binding,
    		click_handler_6,
    		input3_binding,
    		click_handler_7,
    		input4_binding,
    		click_handler_8,
    		input5_binding,
    		click_handler_9,
    		input_input_handler,
    		input6_input_handler,
    		input7_input_handler,
    		input8_binding,
    		click_handler_10,
    		input9_binding,
    		click_handler_11,
    		input10_binding,
    		click_handler_12,
    		input0_input_handler,
    		input1_input_handler,
    		click_handler_13,
    		func_3,
    		input_binding,
    		click_handler_14,
    		click_handler_15,
    		func_4,
    		input_binding_1,
    		click_handler_16,
    		click_handler_17,
    		func_5,
    		input_binding_2,
    		click_handler_18,
    		click_handler_19,
    		func_6,
    		input_binding_3,
    		click_handler_20,
    		click_handler_21,
    		func_7,
    		input_binding_4,
    		click_handler_22,
    		click_handler_23,
    		click_handler_24,
    		click_handler_25,
    		input_binding_5,
    		click_handler_26,
    		click_handler_27,
    		click_handler_28,
    		click_handler_29,
    		input_binding_6,
    		click_handler_30,
    		input_binding_7,
    		click_handler_31
    	];
    }

    class RefereeHelper extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$7(this, options, instance$1, create_fragment$1, safe_not_equal, {}, [-1, -1, -1, -1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RefereeHelper",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.35.0 */
    const file = "src\\App.svelte";

    // (26:0) {:else}
    function create_else_block(ctx) {
    	let banner;
    	let t0;
    	let div1;
    	let nav;
    	let t1;
    	let schedule;
    	let t2;
    	let div0;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	banner = new Banner({ $$inline: true });
    	nav = new Nav({ $$inline: true });

    	schedule = new Schedule({
    			props: { stages: /*$stages*/ ctx[1] },
    			$$inline: true
    		});

    	const if_block_creators = [
    		create_if_block_2,
    		create_if_block_3,
    		create_if_block_4,
    		create_if_block_5,
    		create_if_block_6,
    		create_if_block_7,
    		create_if_block_8,
    		create_if_block_9,
    		create_if_block_10,
    		create_if_block_11,
    		create_if_block_12,
    		create_if_block_13,
    		create_if_block_14,
    		create_if_block_15,
    		create_else_block_1
    	];

    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*$page*/ ctx[0] == "players") return 0;
    		if (/*$page*/ ctx[0] == "countries") return 1;
    		if (/*$page*/ ctx[0] == "qualifiers") return 2;
    		if (/*$page*/ ctx[0] == "qualifiers!maps") return 3;
    		if (/*$page*/ ctx[0] == "qualifiers!elite") return 4;
    		if (/*$page*/ ctx[0] == "qualifiers!elite!maps") return 5;
    		if (/*$page*/ ctx[0] == "qualifiers!lobbies") return 6;
    		if (/*$page*/ ctx[0] == "groups") return 7;
    		if (/*$page*/ ctx[0] == "groups!results") return 8;
    		if (/*$page*/ ctx[0] == "groups!maps") return 9;
    		if (/*$page*/ ctx[0] == "groups!rolls") return 10;
    		if (/*$page*/ ctx[0] == "ro64") return 11;
    		if (/*$page*/ ctx[0] == "ro64!maps") return 12;
    		if (/*$page*/ ctx[0] == "ro64!rolls") return 13;
    		return 14;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			create_component(banner.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			create_component(nav.$$.fragment);
    			t1 = space();
    			create_component(schedule.$$.fragment);
    			t2 = space();
    			div0 = element("div");
    			if_block.c();
    			attr_dev(div0, "class", "page svelte-ucquck");
    			add_location(div0, file, 30, 1, 1382);
    			attr_dev(div1, "class", "body svelte-ucquck");
    			add_location(div1, file, 27, 0, 1319);
    		},
    		m: function mount(target, anchor) {
    			mount_component(banner, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(nav, div1, null);
    			append_dev(div1, t1);
    			mount_component(schedule, div1, null);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			if_blocks[current_block_type_index].m(div0, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const schedule_changes = {};
    			if (dirty & /*$stages*/ 2) schedule_changes.stages = /*$stages*/ ctx[1];
    			schedule.$set(schedule_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div0, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(banner.$$.fragment, local);
    			transition_in(nav.$$.fragment, local);
    			transition_in(schedule.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(banner.$$.fragment, local);
    			transition_out(nav.$$.fragment, local);
    			transition_out(schedule.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(banner, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			destroy_component(nav);
    			destroy_component(schedule);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(26:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (24:36) 
    function create_if_block_1(ctx) {
    	let refereehelper;
    	let current;
    	refereehelper = new RefereeHelper({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(refereehelper.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(refereehelper, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(refereehelper.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(refereehelper.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(refereehelper, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(24:36) ",
    		ctx
    	});

    	return block;
    }

    // (22:0) {#if $page == 'scuffed!drawing'}
    function create_if_block(ctx) {
    	let scuffeddrawing;
    	let current;
    	scuffeddrawing = new ScuffedDrawing({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(scuffeddrawing.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(scuffeddrawing, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(scuffeddrawing.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(scuffeddrawing.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(scuffeddrawing, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(22:0) {#if $page == 'scuffed!drawing'}",
    		ctx
    	});

    	return block;
    }

    // (64:2) {:else}
    function create_else_block_1(ctx) {
    	let staff;
    	let current;
    	staff = new Staff({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(staff.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(staff, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(staff.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(staff.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(staff, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(64:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (61:34) 
    function create_if_block_15(ctx) {
    	let bracketrolls;
    	let current;
    	bracketrolls = new Rolls({ props: { stage: "ro64" }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(bracketrolls.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(bracketrolls, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bracketrolls.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bracketrolls.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(bracketrolls, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_15.name,
    		type: "if",
    		source: "(61:34) ",
    		ctx
    	});

    	return block;
    }

    // (59:33) 
    function create_if_block_14(ctx) {
    	let bracketmaps;
    	let current;
    	bracketmaps = new Maps({ props: { stage: "ro64" }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(bracketmaps.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(bracketmaps, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bracketmaps.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bracketmaps.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(bracketmaps, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_14.name,
    		type: "if",
    		source: "(59:33) ",
    		ctx
    	});

    	return block;
    }

    // (57:28) 
    function create_if_block_13(ctx) {
    	let bracketmatches;
    	let current;
    	bracketmatches = new Matches({ props: { stage: "ro64" }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(bracketmatches.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(bracketmatches, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bracketmatches.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bracketmatches.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(bracketmatches, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_13.name,
    		type: "if",
    		source: "(57:28) ",
    		ctx
    	});

    	return block;
    }

    // (54:36) 
    function create_if_block_12(ctx) {
    	let bracketrolls;
    	let current;

    	bracketrolls = new Rolls({
    			props: { stage: "groups" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(bracketrolls.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(bracketrolls, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bracketrolls.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bracketrolls.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(bracketrolls, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_12.name,
    		type: "if",
    		source: "(54:36) ",
    		ctx
    	});

    	return block;
    }

    // (52:35) 
    function create_if_block_11(ctx) {
    	let bracketmaps;
    	let current;

    	bracketmaps = new Maps({
    			props: { stage: "groups" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(bracketmaps.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(bracketmaps, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bracketmaps.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bracketmaps.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(bracketmaps, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_11.name,
    		type: "if",
    		source: "(52:35) ",
    		ctx
    	});

    	return block;
    }

    // (50:38) 
    function create_if_block_10(ctx) {
    	let groupsresults;
    	let current;
    	groupsresults = new Results({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(groupsresults.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(groupsresults, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(groupsresults.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(groupsresults.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(groupsresults, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(50:38) ",
    		ctx
    	});

    	return block;
    }

    // (48:30) 
    function create_if_block_9(ctx) {
    	let groupsmatches;
    	let current;
    	groupsmatches = new Matches$1({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(groupsmatches.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(groupsmatches, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(groupsmatches.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(groupsmatches.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(groupsmatches, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(48:30) ",
    		ctx
    	});

    	return block;
    }

    // (45:42) 
    function create_if_block_8(ctx) {
    	let qualifierlobbies;
    	let current;
    	qualifierlobbies = new Lobbies({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(qualifierlobbies.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(qualifierlobbies, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(qualifierlobbies.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(qualifierlobbies.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(qualifierlobbies, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(45:42) ",
    		ctx
    	});

    	return block;
    }

    // (43:45) 
    function create_if_block_7(ctx) {
    	let elitequalifiermaps;
    	let current;
    	elitequalifiermaps = new EliteMaps({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(elitequalifiermaps.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(elitequalifiermaps, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(elitequalifiermaps.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(elitequalifiermaps.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(elitequalifiermaps, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(43:45) ",
    		ctx
    	});

    	return block;
    }

    // (41:40) 
    function create_if_block_6(ctx) {
    	let elitequalifierplayers;
    	let current;
    	elitequalifierplayers = new ElitePlayers({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(elitequalifierplayers.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(elitequalifierplayers, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(elitequalifierplayers.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(elitequalifierplayers.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(elitequalifierplayers, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(41:40) ",
    		ctx
    	});

    	return block;
    }

    // (39:39) 
    function create_if_block_5(ctx) {
    	let qualifiermaps;
    	let current;
    	qualifiermaps = new Maps$1({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(qualifiermaps.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(qualifiermaps, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(qualifiermaps.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(qualifiermaps.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(qualifiermaps, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(39:39) ",
    		ctx
    	});

    	return block;
    }

    // (37:34) 
    function create_if_block_4(ctx) {
    	let qualifierplayers;
    	let current;
    	qualifierplayers = new Players({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(qualifierplayers.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(qualifierplayers, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(qualifierplayers.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(qualifierplayers.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(qualifierplayers, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(37:34) ",
    		ctx
    	});

    	return block;
    }

    // (34:33) 
    function create_if_block_3(ctx) {
    	let countries;
    	let current;
    	countries = new Countries({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(countries.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(countries, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(countries.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(countries.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(countries, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(34:33) ",
    		ctx
    	});

    	return block;
    }

    // (32:2) {#if $page == 'players'}
    function create_if_block_2(ctx) {
    	let players;
    	let current;
    	players = new Players$1({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(players.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(players, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(players.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(players.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(players, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(32:2) {#if $page == 'players'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$page*/ ctx[0] == "scuffed!drawing") return 0;
    		if (/*$page*/ ctx[0] == "referee!helper") return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $page;
    	let $stages;
    	validate_store(page, "page");
    	component_subscribe($$self, page, $$value => $$invalidate(0, $page = $$value));
    	validate_store(stages, "stages");
    	component_subscribe($$self, stages, $$value => $$invalidate(1, $stages = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Banner,
    		Nav,
    		Schedule,
    		Staff,
    		Players: Players$1,
    		Countries,
    		QualifierLobbies: Lobbies,
    		QualifierMaps: Maps$1,
    		QualifierPlayers: Players,
    		EliteQualifierMaps: EliteMaps,
    		EliteQualifierPlayers: ElitePlayers,
    		GroupsMatches: Matches$1,
    		GroupsResults: Results,
    		BracketMatches: Matches,
    		BracketMaps: Maps,
    		BracketRolls: Rolls,
    		ScuffedDrawing,
    		RefereeHelper,
    		page,
    		stages,
    		$page,
    		$stages
    	});

    	return [$page, $stages];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$7(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({ target: document.body });

    return app;

}());
//# sourceMappingURL=bundle.js.map
