
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
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
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
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
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
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
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
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
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
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
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

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
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
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
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
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
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

    function forwardEventsBuilder(component, additionalEvents = []) {
      const events = [
        'focus', 'blur',
        'fullscreenchange', 'fullscreenerror', 'scroll',
        'cut', 'copy', 'paste',
        'keydown', 'keypress', 'keyup',
        'auxclick', 'click', 'contextmenu', 'dblclick', 'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'mouseover', 'mouseout', 'mouseup', 'pointerlockchange', 'pointerlockerror', 'select', 'wheel',
        'drag', 'dragend', 'dragenter', 'dragstart', 'dragleave', 'dragover', 'drop',
        'touchcancel', 'touchend', 'touchmove', 'touchstart',
        'pointerover', 'pointerenter', 'pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'pointerout', 'pointerleave', 'gotpointercapture', 'lostpointercapture',
        ...additionalEvents
      ];

      function forward(e) {
        bubble(component, e);
      }

      return node => {
        const destructors = [];

        for (let i = 0; i < events.length; i++) {
          destructors.push(listen(node, events[i], forward));
        }

        return {
          destroy: () => {
            for (let i = 0; i < destructors.length; i++) {
              destructors[i]();
            }
          }
        }
      };
    }

    function exclude(obj, keys) {
      let names = Object.getOwnPropertyNames(obj);
      const newObj = {};

      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        const cashIndex = name.indexOf('$');
        if (cashIndex !== -1 && keys.indexOf(name.substring(0, cashIndex + 1)) !== -1) {
          continue;
        }
        if (keys.indexOf(name) !== -1) {
          continue;
        }
        newObj[name] = obj[name];
      }

      return newObj;
    }

    function useActions(node, actions) {
      let objects = [];

      if (actions) {
        for (let i = 0; i < actions.length; i++) {
          const isArray = Array.isArray(actions[i]);
          const action = isArray ? actions[i][0] : actions[i];
          if (isArray && actions[i].length > 1) {
            objects.push(action(node, actions[i][1]));
          } else {
            objects.push(action(node));
          }
        }
      }

      return {
        update(actions) {
          if ((actions && actions.length || 0) != objects.length) {
            throw new Error('You must not change the length of an actions array.');
          }

          if (actions) {
            for (let i = 0; i < actions.length; i++) {
              if (objects[i] && 'update' in objects[i]) {
                const isArray = Array.isArray(actions[i]);
                if (isArray && actions[i].length > 1) {
                  objects[i].update(actions[i][1]);
                } else {
                  objects[i].update();
                }
              }
            }
          }
        },

        destroy() {
          for (let i = 0; i < objects.length; i++) {
            if (objects[i] && 'destroy' in objects[i]) {
              objects[i].destroy();
            }
          }
        }
      }
    }

    /* node_modules/@smui/common/A.svelte generated by Svelte v3.38.2 */
    const file$a = "node_modules/@smui/common/A.svelte";

    function create_fragment$b(ctx) {
    	let a;
    	let useActions_action;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

    	let a_levels = [
    		{ href: /*href*/ ctx[1] },
    		exclude(/*$$props*/ ctx[4], ["element", "use", "forwardEvents", "href"])
    	];

    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (default_slot) default_slot.c();
    			set_attributes(a, a_data);
    			add_location(a, file$a, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			/*a_binding*/ ctx[8](a);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(useActions_action = useActions.call(null, a, /*use*/ ctx[2])),
    					action_destroyer(/*forwardEvents*/ ctx[3].call(null, a))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 64)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[6], dirty, null, null);
    				}
    			}

    			set_attributes(a, a_data = get_spread_update(a_levels, [
    				(!current || dirty & /*href*/ 2) && { href: /*href*/ ctx[1] },
    				dirty & /*$$props*/ 16 && exclude(/*$$props*/ ctx[4], ["element", "use", "forwardEvents", "href"])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 4) useActions_action.update.call(null, /*use*/ ctx[2]);
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
    			if (detaching) detach_dev(a);
    			if (default_slot) default_slot.d(detaching);
    			/*a_binding*/ ctx[8](null);
    			mounted = false;
    			run_all(dispose);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("A", slots, ['default']);
    	let { href = "javascript:void(0);" } = $$props;
    	let { element = null } = $$props;
    	let { use = [] } = $$props;
    	let { forwardEvents: forwardEventsAdditional = [] } = $$props;
    	const forwardEvents = forwardEventsBuilder(get_current_component(), forwardEventsAdditional);

    	function a_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			element = $$value;
    			$$invalidate(0, element);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(4, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("href" in $$new_props) $$invalidate(1, href = $$new_props.href);
    		if ("element" in $$new_props) $$invalidate(0, element = $$new_props.element);
    		if ("use" in $$new_props) $$invalidate(2, use = $$new_props.use);
    		if ("forwardEvents" in $$new_props) $$invalidate(5, forwardEventsAdditional = $$new_props.forwardEvents);
    		if ("$$scope" in $$new_props) $$invalidate(6, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		get_current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		href,
    		element,
    		use,
    		forwardEventsAdditional,
    		forwardEvents
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(4, $$props = assign(assign({}, $$props), $$new_props));
    		if ("href" in $$props) $$invalidate(1, href = $$new_props.href);
    		if ("element" in $$props) $$invalidate(0, element = $$new_props.element);
    		if ("use" in $$props) $$invalidate(2, use = $$new_props.use);
    		if ("forwardEventsAdditional" in $$props) $$invalidate(5, forwardEventsAdditional = $$new_props.forwardEventsAdditional);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);

    	return [
    		element,
    		href,
    		use,
    		forwardEvents,
    		$$props,
    		forwardEventsAdditional,
    		$$scope,
    		slots,
    		a_binding
    	];
    }

    class A extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			href: 1,
    			element: 0,
    			use: 2,
    			forwardEvents: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "A",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get href() {
    		throw new Error("<A>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<A>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get element() {
    		throw new Error("<A>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set element(value) {
    		throw new Error("<A>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get use() {
    		throw new Error("<A>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<A>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get forwardEvents() {
    		throw new Error("<A>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set forwardEvents(value) {
    		throw new Error("<A>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@smui/common/Button.svelte generated by Svelte v3.38.2 */
    const file$9 = "node_modules/@smui/common/Button.svelte";

    function create_fragment$a(ctx) {
    	let button;
    	let useActions_action;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);
    	let button_levels = [exclude(/*$$props*/ ctx[3], ["element", "use", "forwardEvents"])];
    	let button_data = {};

    	for (let i = 0; i < button_levels.length; i += 1) {
    		button_data = assign(button_data, button_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			set_attributes(button, button_data);
    			add_location(button, file$9, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			/*button_binding*/ ctx[7](button);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(useActions_action = useActions.call(null, button, /*use*/ ctx[1])),
    					action_destroyer(/*forwardEvents*/ ctx[2].call(null, button))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 32)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[5], dirty, null, null);
    				}
    			}

    			set_attributes(button, button_data = get_spread_update(button_levels, [
    				dirty & /*$$props*/ 8 && exclude(/*$$props*/ ctx[3], ["element", "use", "forwardEvents"])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 2) useActions_action.update.call(null, /*use*/ ctx[1]);
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
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    			/*button_binding*/ ctx[7](null);
    			mounted = false;
    			run_all(dispose);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button", slots, ['default']);
    	let { element = null } = $$props;
    	let { use = [] } = $$props;
    	let { forwardEvents: forwardEventsAdditional = [] } = $$props;
    	const forwardEvents = forwardEventsBuilder(get_current_component(), forwardEventsAdditional);

    	function button_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			element = $$value;
    			$$invalidate(0, element);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(3, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("element" in $$new_props) $$invalidate(0, element = $$new_props.element);
    		if ("use" in $$new_props) $$invalidate(1, use = $$new_props.use);
    		if ("forwardEvents" in $$new_props) $$invalidate(4, forwardEventsAdditional = $$new_props.forwardEvents);
    		if ("$$scope" in $$new_props) $$invalidate(5, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		get_current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		element,
    		use,
    		forwardEventsAdditional,
    		forwardEvents
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(3, $$props = assign(assign({}, $$props), $$new_props));
    		if ("element" in $$props) $$invalidate(0, element = $$new_props.element);
    		if ("use" in $$props) $$invalidate(1, use = $$new_props.use);
    		if ("forwardEventsAdditional" in $$props) $$invalidate(4, forwardEventsAdditional = $$new_props.forwardEventsAdditional);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);

    	return [
    		element,
    		use,
    		forwardEvents,
    		$$props,
    		forwardEventsAdditional,
    		$$scope,
    		slots,
    		button_binding
    	];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { element: 0, use: 1, forwardEvents: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get element() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set element(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get use() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get forwardEvents() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set forwardEvents(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * Stores result from supportsCssVariables to avoid redundant processing to
     * detect CSS custom variable support.
     */
    var supportsCssVariables_;
    function detectEdgePseudoVarBug(windowObj) {
        // Detect versions of Edge with buggy var() support
        // See: https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/11495448/
        var document = windowObj.document;
        var node = document.createElement('div');
        node.className = 'mdc-ripple-surface--test-edge-var-bug';
        // Append to head instead of body because this script might be invoked in the
        // head, in which case the body doesn't exist yet. The probe works either way.
        document.head.appendChild(node);
        // The bug exists if ::before style ends up propagating to the parent element.
        // Additionally, getComputedStyle returns null in iframes with display: "none" in Firefox,
        // but Firefox is known to support CSS custom properties correctly.
        // See: https://bugzilla.mozilla.org/show_bug.cgi?id=548397
        var computedStyle = windowObj.getComputedStyle(node);
        var hasPseudoVarBug = computedStyle !== null && computedStyle.borderTopStyle === 'solid';
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
        return hasPseudoVarBug;
    }
    function supportsCssVariables(windowObj, forceRefresh) {
        if (forceRefresh === void 0) { forceRefresh = false; }
        var CSS = windowObj.CSS;
        var supportsCssVars = supportsCssVariables_;
        if (typeof supportsCssVariables_ === 'boolean' && !forceRefresh) {
            return supportsCssVariables_;
        }
        var supportsFunctionPresent = CSS && typeof CSS.supports === 'function';
        if (!supportsFunctionPresent) {
            return false;
        }
        var explicitlySupportsCssVars = CSS.supports('--css-vars', 'yes');
        // See: https://bugs.webkit.org/show_bug.cgi?id=154669
        // See: README section on Safari
        var weAreFeatureDetectingSafari10plus = (CSS.supports('(--css-vars: yes)') &&
            CSS.supports('color', '#00000000'));
        if (explicitlySupportsCssVars || weAreFeatureDetectingSafari10plus) {
            supportsCssVars = !detectEdgePseudoVarBug(windowObj);
        }
        else {
            supportsCssVars = false;
        }
        if (!forceRefresh) {
            supportsCssVariables_ = supportsCssVars;
        }
        return supportsCssVars;
    }
    function getNormalizedEventCoords(evt, pageOffset, clientRect) {
        if (!evt) {
            return { x: 0, y: 0 };
        }
        var x = pageOffset.x, y = pageOffset.y;
        var documentX = x + clientRect.left;
        var documentY = y + clientRect.top;
        var normalizedX;
        var normalizedY;
        // Determine touch point relative to the ripple container.
        if (evt.type === 'touchstart') {
            var touchEvent = evt;
            normalizedX = touchEvent.changedTouches[0].pageX - documentX;
            normalizedY = touchEvent.changedTouches[0].pageY - documentY;
        }
        else {
            var mouseEvent = evt;
            normalizedX = mouseEvent.pageX - documentX;
            normalizedY = mouseEvent.pageY - documentY;
        }
        return { x: normalizedX, y: normalizedY };
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCFoundation = /** @class */ (function () {
        function MDCFoundation(adapter) {
            if (adapter === void 0) { adapter = {}; }
            this.adapter_ = adapter;
        }
        Object.defineProperty(MDCFoundation, "cssClasses", {
            get: function () {
                // Classes extending MDCFoundation should implement this method to return an object which exports every
                // CSS class the foundation class needs as a property. e.g. {ACTIVE: 'mdc-component--active'}
                return {};
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCFoundation, "strings", {
            get: function () {
                // Classes extending MDCFoundation should implement this method to return an object which exports all
                // semantic strings as constants. e.g. {ARIA_ROLE: 'tablist'}
                return {};
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCFoundation, "numbers", {
            get: function () {
                // Classes extending MDCFoundation should implement this method to return an object which exports all
                // of its semantic numbers as constants. e.g. {ANIMATION_DELAY_MS: 350}
                return {};
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCFoundation, "defaultAdapter", {
            get: function () {
                // Classes extending MDCFoundation may choose to implement this getter in order to provide a convenient
                // way of viewing the necessary methods of an adapter. In the future, this could also be used for adapter
                // validation.
                return {};
            },
            enumerable: true,
            configurable: true
        });
        MDCFoundation.prototype.init = function () {
            // Subclasses should override this method to perform initialization routines (registering events, etc.)
        };
        MDCFoundation.prototype.destroy = function () {
            // Subclasses should override this method to perform de-initialization routines (de-registering events, etc.)
        };
        return MDCFoundation;
    }());

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCComponent = /** @class */ (function () {
        function MDCComponent(root, foundation) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            this.root_ = root;
            this.initialize.apply(this, __spread(args));
            // Note that we initialize foundation here and not within the constructor's default param so that
            // this.root_ is defined and can be used within the foundation class.
            this.foundation_ = foundation === undefined ? this.getDefaultFoundation() : foundation;
            this.foundation_.init();
            this.initialSyncWithDOM();
        }
        MDCComponent.attachTo = function (root) {
            // Subclasses which extend MDCBase should provide an attachTo() method that takes a root element and
            // returns an instantiated component with its root set to that element. Also note that in the cases of
            // subclasses, an explicit foundation class will not have to be passed in; it will simply be initialized
            // from getDefaultFoundation().
            return new MDCComponent(root, new MDCFoundation({}));
        };
        /* istanbul ignore next: method param only exists for typing purposes; it does not need to be unit tested */
        MDCComponent.prototype.initialize = function () {
            var _args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _args[_i] = arguments[_i];
            }
            // Subclasses can override this to do any additional setup work that would be considered part of a
            // "constructor". Essentially, it is a hook into the parent constructor before the foundation is
            // initialized. Any additional arguments besides root and foundation will be passed in here.
        };
        MDCComponent.prototype.getDefaultFoundation = function () {
            // Subclasses must override this method to return a properly configured foundation class for the
            // component.
            throw new Error('Subclasses must override getDefaultFoundation to return a properly configured ' +
                'foundation class');
        };
        MDCComponent.prototype.initialSyncWithDOM = function () {
            // Subclasses should override this method if they need to perform work to synchronize with a host DOM
            // object. An example of this would be a form control wrapper that needs to synchronize its internal state
            // to some property or attribute of the host DOM. Please note: this is *not* the place to perform DOM
            // reads/writes that would cause layout / paint, as this is called synchronously from within the constructor.
        };
        MDCComponent.prototype.destroy = function () {
            // Subclasses may implement this method to release any resources / deregister any listeners they have
            // attached. An example of this might be deregistering a resize event from the window object.
            this.foundation_.destroy();
        };
        MDCComponent.prototype.listen = function (evtType, handler, options) {
            this.root_.addEventListener(evtType, handler, options);
        };
        MDCComponent.prototype.unlisten = function (evtType, handler, options) {
            this.root_.removeEventListener(evtType, handler, options);
        };
        /**
         * Fires a cross-browser-compatible custom event from the component root of the given type, with the given data.
         */
        MDCComponent.prototype.emit = function (evtType, evtData, shouldBubble) {
            if (shouldBubble === void 0) { shouldBubble = false; }
            var evt;
            if (typeof CustomEvent === 'function') {
                evt = new CustomEvent(evtType, {
                    bubbles: shouldBubble,
                    detail: evtData,
                });
            }
            else {
                evt = document.createEvent('CustomEvent');
                evt.initCustomEvent(evtType, shouldBubble, false, evtData);
            }
            this.root_.dispatchEvent(evt);
        };
        return MDCComponent;
    }());

    /**
     * @license
     * Copyright 2019 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    /**
     * Stores result from applyPassive to avoid redundant processing to detect
     * passive event listener support.
     */
    var supportsPassive_;
    /**
     * Determine whether the current browser supports passive event listeners, and
     * if so, use them.
     */
    function applyPassive(globalObj, forceRefresh) {
        if (globalObj === void 0) { globalObj = window; }
        if (forceRefresh === void 0) { forceRefresh = false; }
        if (supportsPassive_ === undefined || forceRefresh) {
            var isSupported_1 = false;
            try {
                globalObj.document.addEventListener('test', function () { return undefined; }, {
                    get passive() {
                        isSupported_1 = true;
                        return isSupported_1;
                    },
                });
            }
            catch (e) {
            } // tslint:disable-line:no-empty cannot throw error due to tests. tslint also disables console.log.
            supportsPassive_ = isSupported_1;
        }
        return supportsPassive_ ? { passive: true } : false;
    }

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    function matches(element, selector) {
        var nativeMatches = element.matches
            || element.webkitMatchesSelector
            || element.msMatchesSelector;
        return nativeMatches.call(element, selector);
    }

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses$2 = {
        // Ripple is a special case where the "root" component is really a "mixin" of sorts,
        // given that it's an 'upgrade' to an existing component. That being said it is the root
        // CSS class that all other CSS classes derive from.
        BG_FOCUSED: 'mdc-ripple-upgraded--background-focused',
        FG_ACTIVATION: 'mdc-ripple-upgraded--foreground-activation',
        FG_DEACTIVATION: 'mdc-ripple-upgraded--foreground-deactivation',
        ROOT: 'mdc-ripple-upgraded',
        UNBOUNDED: 'mdc-ripple-upgraded--unbounded',
    };
    var strings$2 = {
        VAR_FG_SCALE: '--mdc-ripple-fg-scale',
        VAR_FG_SIZE: '--mdc-ripple-fg-size',
        VAR_FG_TRANSLATE_END: '--mdc-ripple-fg-translate-end',
        VAR_FG_TRANSLATE_START: '--mdc-ripple-fg-translate-start',
        VAR_LEFT: '--mdc-ripple-left',
        VAR_TOP: '--mdc-ripple-top',
    };
    var numbers$1 = {
        DEACTIVATION_TIMEOUT_MS: 225,
        FG_DEACTIVATION_MS: 150,
        INITIAL_ORIGIN_SCALE: 0.6,
        PADDING: 10,
        TAP_DELAY_MS: 300,
    };

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    // Activation events registered on the root element of each instance for activation
    var ACTIVATION_EVENT_TYPES = [
        'touchstart', 'pointerdown', 'mousedown', 'keydown',
    ];
    // Deactivation events registered on documentElement when a pointer-related down event occurs
    var POINTER_DEACTIVATION_EVENT_TYPES = [
        'touchend', 'pointerup', 'mouseup', 'contextmenu',
    ];
    // simultaneous nested activations
    var activatedTargets = [];
    var MDCRippleFoundation = /** @class */ (function (_super) {
        __extends(MDCRippleFoundation, _super);
        function MDCRippleFoundation(adapter) {
            var _this = _super.call(this, __assign({}, MDCRippleFoundation.defaultAdapter, adapter)) || this;
            _this.activationAnimationHasEnded_ = false;
            _this.activationTimer_ = 0;
            _this.fgDeactivationRemovalTimer_ = 0;
            _this.fgScale_ = '0';
            _this.frame_ = { width: 0, height: 0 };
            _this.initialSize_ = 0;
            _this.layoutFrame_ = 0;
            _this.maxRadius_ = 0;
            _this.unboundedCoords_ = { left: 0, top: 0 };
            _this.activationState_ = _this.defaultActivationState_();
            _this.activationTimerCallback_ = function () {
                _this.activationAnimationHasEnded_ = true;
                _this.runDeactivationUXLogicIfReady_();
            };
            _this.activateHandler_ = function (e) { return _this.activate_(e); };
            _this.deactivateHandler_ = function () { return _this.deactivate_(); };
            _this.focusHandler_ = function () { return _this.handleFocus(); };
            _this.blurHandler_ = function () { return _this.handleBlur(); };
            _this.resizeHandler_ = function () { return _this.layout(); };
            return _this;
        }
        Object.defineProperty(MDCRippleFoundation, "cssClasses", {
            get: function () {
                return cssClasses$2;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCRippleFoundation, "strings", {
            get: function () {
                return strings$2;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCRippleFoundation, "numbers", {
            get: function () {
                return numbers$1;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCRippleFoundation, "defaultAdapter", {
            get: function () {
                return {
                    addClass: function () { return undefined; },
                    browserSupportsCssVars: function () { return true; },
                    computeBoundingRect: function () { return ({ top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 }); },
                    containsEventTarget: function () { return true; },
                    deregisterDocumentInteractionHandler: function () { return undefined; },
                    deregisterInteractionHandler: function () { return undefined; },
                    deregisterResizeHandler: function () { return undefined; },
                    getWindowPageOffset: function () { return ({ x: 0, y: 0 }); },
                    isSurfaceActive: function () { return true; },
                    isSurfaceDisabled: function () { return true; },
                    isUnbounded: function () { return true; },
                    registerDocumentInteractionHandler: function () { return undefined; },
                    registerInteractionHandler: function () { return undefined; },
                    registerResizeHandler: function () { return undefined; },
                    removeClass: function () { return undefined; },
                    updateCssVariable: function () { return undefined; },
                };
            },
            enumerable: true,
            configurable: true
        });
        MDCRippleFoundation.prototype.init = function () {
            var _this = this;
            var supportsPressRipple = this.supportsPressRipple_();
            this.registerRootHandlers_(supportsPressRipple);
            if (supportsPressRipple) {
                var _a = MDCRippleFoundation.cssClasses, ROOT_1 = _a.ROOT, UNBOUNDED_1 = _a.UNBOUNDED;
                requestAnimationFrame(function () {
                    _this.adapter_.addClass(ROOT_1);
                    if (_this.adapter_.isUnbounded()) {
                        _this.adapter_.addClass(UNBOUNDED_1);
                        // Unbounded ripples need layout logic applied immediately to set coordinates for both shade and ripple
                        _this.layoutInternal_();
                    }
                });
            }
        };
        MDCRippleFoundation.prototype.destroy = function () {
            var _this = this;
            if (this.supportsPressRipple_()) {
                if (this.activationTimer_) {
                    clearTimeout(this.activationTimer_);
                    this.activationTimer_ = 0;
                    this.adapter_.removeClass(MDCRippleFoundation.cssClasses.FG_ACTIVATION);
                }
                if (this.fgDeactivationRemovalTimer_) {
                    clearTimeout(this.fgDeactivationRemovalTimer_);
                    this.fgDeactivationRemovalTimer_ = 0;
                    this.adapter_.removeClass(MDCRippleFoundation.cssClasses.FG_DEACTIVATION);
                }
                var _a = MDCRippleFoundation.cssClasses, ROOT_2 = _a.ROOT, UNBOUNDED_2 = _a.UNBOUNDED;
                requestAnimationFrame(function () {
                    _this.adapter_.removeClass(ROOT_2);
                    _this.adapter_.removeClass(UNBOUNDED_2);
                    _this.removeCssVars_();
                });
            }
            this.deregisterRootHandlers_();
            this.deregisterDeactivationHandlers_();
        };
        /**
         * @param evt Optional event containing position information.
         */
        MDCRippleFoundation.prototype.activate = function (evt) {
            this.activate_(evt);
        };
        MDCRippleFoundation.prototype.deactivate = function () {
            this.deactivate_();
        };
        MDCRippleFoundation.prototype.layout = function () {
            var _this = this;
            if (this.layoutFrame_) {
                cancelAnimationFrame(this.layoutFrame_);
            }
            this.layoutFrame_ = requestAnimationFrame(function () {
                _this.layoutInternal_();
                _this.layoutFrame_ = 0;
            });
        };
        MDCRippleFoundation.prototype.setUnbounded = function (unbounded) {
            var UNBOUNDED = MDCRippleFoundation.cssClasses.UNBOUNDED;
            if (unbounded) {
                this.adapter_.addClass(UNBOUNDED);
            }
            else {
                this.adapter_.removeClass(UNBOUNDED);
            }
        };
        MDCRippleFoundation.prototype.handleFocus = function () {
            var _this = this;
            requestAnimationFrame(function () {
                return _this.adapter_.addClass(MDCRippleFoundation.cssClasses.BG_FOCUSED);
            });
        };
        MDCRippleFoundation.prototype.handleBlur = function () {
            var _this = this;
            requestAnimationFrame(function () {
                return _this.adapter_.removeClass(MDCRippleFoundation.cssClasses.BG_FOCUSED);
            });
        };
        /**
         * We compute this property so that we are not querying information about the client
         * until the point in time where the foundation requests it. This prevents scenarios where
         * client-side feature-detection may happen too early, such as when components are rendered on the server
         * and then initialized at mount time on the client.
         */
        MDCRippleFoundation.prototype.supportsPressRipple_ = function () {
            return this.adapter_.browserSupportsCssVars();
        };
        MDCRippleFoundation.prototype.defaultActivationState_ = function () {
            return {
                activationEvent: undefined,
                hasDeactivationUXRun: false,
                isActivated: false,
                isProgrammatic: false,
                wasActivatedByPointer: false,
                wasElementMadeActive: false,
            };
        };
        /**
         * supportsPressRipple Passed from init to save a redundant function call
         */
        MDCRippleFoundation.prototype.registerRootHandlers_ = function (supportsPressRipple) {
            var _this = this;
            if (supportsPressRipple) {
                ACTIVATION_EVENT_TYPES.forEach(function (evtType) {
                    _this.adapter_.registerInteractionHandler(evtType, _this.activateHandler_);
                });
                if (this.adapter_.isUnbounded()) {
                    this.adapter_.registerResizeHandler(this.resizeHandler_);
                }
            }
            this.adapter_.registerInteractionHandler('focus', this.focusHandler_);
            this.adapter_.registerInteractionHandler('blur', this.blurHandler_);
        };
        MDCRippleFoundation.prototype.registerDeactivationHandlers_ = function (evt) {
            var _this = this;
            if (evt.type === 'keydown') {
                this.adapter_.registerInteractionHandler('keyup', this.deactivateHandler_);
            }
            else {
                POINTER_DEACTIVATION_EVENT_TYPES.forEach(function (evtType) {
                    _this.adapter_.registerDocumentInteractionHandler(evtType, _this.deactivateHandler_);
                });
            }
        };
        MDCRippleFoundation.prototype.deregisterRootHandlers_ = function () {
            var _this = this;
            ACTIVATION_EVENT_TYPES.forEach(function (evtType) {
                _this.adapter_.deregisterInteractionHandler(evtType, _this.activateHandler_);
            });
            this.adapter_.deregisterInteractionHandler('focus', this.focusHandler_);
            this.adapter_.deregisterInteractionHandler('blur', this.blurHandler_);
            if (this.adapter_.isUnbounded()) {
                this.adapter_.deregisterResizeHandler(this.resizeHandler_);
            }
        };
        MDCRippleFoundation.prototype.deregisterDeactivationHandlers_ = function () {
            var _this = this;
            this.adapter_.deregisterInteractionHandler('keyup', this.deactivateHandler_);
            POINTER_DEACTIVATION_EVENT_TYPES.forEach(function (evtType) {
                _this.adapter_.deregisterDocumentInteractionHandler(evtType, _this.deactivateHandler_);
            });
        };
        MDCRippleFoundation.prototype.removeCssVars_ = function () {
            var _this = this;
            var rippleStrings = MDCRippleFoundation.strings;
            var keys = Object.keys(rippleStrings);
            keys.forEach(function (key) {
                if (key.indexOf('VAR_') === 0) {
                    _this.adapter_.updateCssVariable(rippleStrings[key], null);
                }
            });
        };
        MDCRippleFoundation.prototype.activate_ = function (evt) {
            var _this = this;
            if (this.adapter_.isSurfaceDisabled()) {
                return;
            }
            var activationState = this.activationState_;
            if (activationState.isActivated) {
                return;
            }
            // Avoid reacting to follow-on events fired by touch device after an already-processed user interaction
            var previousActivationEvent = this.previousActivationEvent_;
            var isSameInteraction = previousActivationEvent && evt !== undefined && previousActivationEvent.type !== evt.type;
            if (isSameInteraction) {
                return;
            }
            activationState.isActivated = true;
            activationState.isProgrammatic = evt === undefined;
            activationState.activationEvent = evt;
            activationState.wasActivatedByPointer = activationState.isProgrammatic ? false : evt !== undefined && (evt.type === 'mousedown' || evt.type === 'touchstart' || evt.type === 'pointerdown');
            var hasActivatedChild = evt !== undefined && activatedTargets.length > 0 && activatedTargets.some(function (target) { return _this.adapter_.containsEventTarget(target); });
            if (hasActivatedChild) {
                // Immediately reset activation state, while preserving logic that prevents touch follow-on events
                this.resetActivationState_();
                return;
            }
            if (evt !== undefined) {
                activatedTargets.push(evt.target);
                this.registerDeactivationHandlers_(evt);
            }
            activationState.wasElementMadeActive = this.checkElementMadeActive_(evt);
            if (activationState.wasElementMadeActive) {
                this.animateActivation_();
            }
            requestAnimationFrame(function () {
                // Reset array on next frame after the current event has had a chance to bubble to prevent ancestor ripples
                activatedTargets = [];
                if (!activationState.wasElementMadeActive
                    && evt !== undefined
                    && (evt.key === ' ' || evt.keyCode === 32)) {
                    // If space was pressed, try again within an rAF call to detect :active, because different UAs report
                    // active states inconsistently when they're called within event handling code:
                    // - https://bugs.chromium.org/p/chromium/issues/detail?id=635971
                    // - https://bugzilla.mozilla.org/show_bug.cgi?id=1293741
                    // We try first outside rAF to support Edge, which does not exhibit this problem, but will crash if a CSS
                    // variable is set within a rAF callback for a submit button interaction (#2241).
                    activationState.wasElementMadeActive = _this.checkElementMadeActive_(evt);
                    if (activationState.wasElementMadeActive) {
                        _this.animateActivation_();
                    }
                }
                if (!activationState.wasElementMadeActive) {
                    // Reset activation state immediately if element was not made active.
                    _this.activationState_ = _this.defaultActivationState_();
                }
            });
        };
        MDCRippleFoundation.prototype.checkElementMadeActive_ = function (evt) {
            return (evt !== undefined && evt.type === 'keydown') ? this.adapter_.isSurfaceActive() : true;
        };
        MDCRippleFoundation.prototype.animateActivation_ = function () {
            var _this = this;
            var _a = MDCRippleFoundation.strings, VAR_FG_TRANSLATE_START = _a.VAR_FG_TRANSLATE_START, VAR_FG_TRANSLATE_END = _a.VAR_FG_TRANSLATE_END;
            var _b = MDCRippleFoundation.cssClasses, FG_DEACTIVATION = _b.FG_DEACTIVATION, FG_ACTIVATION = _b.FG_ACTIVATION;
            var DEACTIVATION_TIMEOUT_MS = MDCRippleFoundation.numbers.DEACTIVATION_TIMEOUT_MS;
            this.layoutInternal_();
            var translateStart = '';
            var translateEnd = '';
            if (!this.adapter_.isUnbounded()) {
                var _c = this.getFgTranslationCoordinates_(), startPoint = _c.startPoint, endPoint = _c.endPoint;
                translateStart = startPoint.x + "px, " + startPoint.y + "px";
                translateEnd = endPoint.x + "px, " + endPoint.y + "px";
            }
            this.adapter_.updateCssVariable(VAR_FG_TRANSLATE_START, translateStart);
            this.adapter_.updateCssVariable(VAR_FG_TRANSLATE_END, translateEnd);
            // Cancel any ongoing activation/deactivation animations
            clearTimeout(this.activationTimer_);
            clearTimeout(this.fgDeactivationRemovalTimer_);
            this.rmBoundedActivationClasses_();
            this.adapter_.removeClass(FG_DEACTIVATION);
            // Force layout in order to re-trigger the animation.
            this.adapter_.computeBoundingRect();
            this.adapter_.addClass(FG_ACTIVATION);
            this.activationTimer_ = setTimeout(function () { return _this.activationTimerCallback_(); }, DEACTIVATION_TIMEOUT_MS);
        };
        MDCRippleFoundation.prototype.getFgTranslationCoordinates_ = function () {
            var _a = this.activationState_, activationEvent = _a.activationEvent, wasActivatedByPointer = _a.wasActivatedByPointer;
            var startPoint;
            if (wasActivatedByPointer) {
                startPoint = getNormalizedEventCoords(activationEvent, this.adapter_.getWindowPageOffset(), this.adapter_.computeBoundingRect());
            }
            else {
                startPoint = {
                    x: this.frame_.width / 2,
                    y: this.frame_.height / 2,
                };
            }
            // Center the element around the start point.
            startPoint = {
                x: startPoint.x - (this.initialSize_ / 2),
                y: startPoint.y - (this.initialSize_ / 2),
            };
            var endPoint = {
                x: (this.frame_.width / 2) - (this.initialSize_ / 2),
                y: (this.frame_.height / 2) - (this.initialSize_ / 2),
            };
            return { startPoint: startPoint, endPoint: endPoint };
        };
        MDCRippleFoundation.prototype.runDeactivationUXLogicIfReady_ = function () {
            var _this = this;
            // This method is called both when a pointing device is released, and when the activation animation ends.
            // The deactivation animation should only run after both of those occur.
            var FG_DEACTIVATION = MDCRippleFoundation.cssClasses.FG_DEACTIVATION;
            var _a = this.activationState_, hasDeactivationUXRun = _a.hasDeactivationUXRun, isActivated = _a.isActivated;
            var activationHasEnded = hasDeactivationUXRun || !isActivated;
            if (activationHasEnded && this.activationAnimationHasEnded_) {
                this.rmBoundedActivationClasses_();
                this.adapter_.addClass(FG_DEACTIVATION);
                this.fgDeactivationRemovalTimer_ = setTimeout(function () {
                    _this.adapter_.removeClass(FG_DEACTIVATION);
                }, numbers$1.FG_DEACTIVATION_MS);
            }
        };
        MDCRippleFoundation.prototype.rmBoundedActivationClasses_ = function () {
            var FG_ACTIVATION = MDCRippleFoundation.cssClasses.FG_ACTIVATION;
            this.adapter_.removeClass(FG_ACTIVATION);
            this.activationAnimationHasEnded_ = false;
            this.adapter_.computeBoundingRect();
        };
        MDCRippleFoundation.prototype.resetActivationState_ = function () {
            var _this = this;
            this.previousActivationEvent_ = this.activationState_.activationEvent;
            this.activationState_ = this.defaultActivationState_();
            // Touch devices may fire additional events for the same interaction within a short time.
            // Store the previous event until it's safe to assume that subsequent events are for new interactions.
            setTimeout(function () { return _this.previousActivationEvent_ = undefined; }, MDCRippleFoundation.numbers.TAP_DELAY_MS);
        };
        MDCRippleFoundation.prototype.deactivate_ = function () {
            var _this = this;
            var activationState = this.activationState_;
            // This can happen in scenarios such as when you have a keyup event that blurs the element.
            if (!activationState.isActivated) {
                return;
            }
            var state = __assign({}, activationState);
            if (activationState.isProgrammatic) {
                requestAnimationFrame(function () { return _this.animateDeactivation_(state); });
                this.resetActivationState_();
            }
            else {
                this.deregisterDeactivationHandlers_();
                requestAnimationFrame(function () {
                    _this.activationState_.hasDeactivationUXRun = true;
                    _this.animateDeactivation_(state);
                    _this.resetActivationState_();
                });
            }
        };
        MDCRippleFoundation.prototype.animateDeactivation_ = function (_a) {
            var wasActivatedByPointer = _a.wasActivatedByPointer, wasElementMadeActive = _a.wasElementMadeActive;
            if (wasActivatedByPointer || wasElementMadeActive) {
                this.runDeactivationUXLogicIfReady_();
            }
        };
        MDCRippleFoundation.prototype.layoutInternal_ = function () {
            var _this = this;
            this.frame_ = this.adapter_.computeBoundingRect();
            var maxDim = Math.max(this.frame_.height, this.frame_.width);
            // Surface diameter is treated differently for unbounded vs. bounded ripples.
            // Unbounded ripple diameter is calculated smaller since the surface is expected to already be padded appropriately
            // to extend the hitbox, and the ripple is expected to meet the edges of the padded hitbox (which is typically
            // square). Bounded ripples, on the other hand, are fully expected to expand beyond the surface's longest diameter
            // (calculated based on the diagonal plus a constant padding), and are clipped at the surface's border via
            // `overflow: hidden`.
            var getBoundedRadius = function () {
                var hypotenuse = Math.sqrt(Math.pow(_this.frame_.width, 2) + Math.pow(_this.frame_.height, 2));
                return hypotenuse + MDCRippleFoundation.numbers.PADDING;
            };
            this.maxRadius_ = this.adapter_.isUnbounded() ? maxDim : getBoundedRadius();
            // Ripple is sized as a fraction of the largest dimension of the surface, then scales up using a CSS scale transform
            var initialSize = Math.floor(maxDim * MDCRippleFoundation.numbers.INITIAL_ORIGIN_SCALE);
            // Unbounded ripple size should always be even number to equally center align.
            if (this.adapter_.isUnbounded() && initialSize % 2 !== 0) {
                this.initialSize_ = initialSize - 1;
            }
            else {
                this.initialSize_ = initialSize;
            }
            this.fgScale_ = "" + this.maxRadius_ / this.initialSize_;
            this.updateLayoutCssVars_();
        };
        MDCRippleFoundation.prototype.updateLayoutCssVars_ = function () {
            var _a = MDCRippleFoundation.strings, VAR_FG_SIZE = _a.VAR_FG_SIZE, VAR_LEFT = _a.VAR_LEFT, VAR_TOP = _a.VAR_TOP, VAR_FG_SCALE = _a.VAR_FG_SCALE;
            this.adapter_.updateCssVariable(VAR_FG_SIZE, this.initialSize_ + "px");
            this.adapter_.updateCssVariable(VAR_FG_SCALE, this.fgScale_);
            if (this.adapter_.isUnbounded()) {
                this.unboundedCoords_ = {
                    left: Math.round((this.frame_.width / 2) - (this.initialSize_ / 2)),
                    top: Math.round((this.frame_.height / 2) - (this.initialSize_ / 2)),
                };
                this.adapter_.updateCssVariable(VAR_LEFT, this.unboundedCoords_.left + "px");
                this.adapter_.updateCssVariable(VAR_TOP, this.unboundedCoords_.top + "px");
            }
        };
        return MDCRippleFoundation;
    }(MDCFoundation));

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCRipple = /** @class */ (function (_super) {
        __extends(MDCRipple, _super);
        function MDCRipple() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.disabled = false;
            return _this;
        }
        MDCRipple.attachTo = function (root, opts) {
            if (opts === void 0) { opts = { isUnbounded: undefined }; }
            var ripple = new MDCRipple(root);
            // Only override unbounded behavior if option is explicitly specified
            if (opts.isUnbounded !== undefined) {
                ripple.unbounded = opts.isUnbounded;
            }
            return ripple;
        };
        MDCRipple.createAdapter = function (instance) {
            return {
                addClass: function (className) { return instance.root_.classList.add(className); },
                browserSupportsCssVars: function () { return supportsCssVariables(window); },
                computeBoundingRect: function () { return instance.root_.getBoundingClientRect(); },
                containsEventTarget: function (target) { return instance.root_.contains(target); },
                deregisterDocumentInteractionHandler: function (evtType, handler) {
                    return document.documentElement.removeEventListener(evtType, handler, applyPassive());
                },
                deregisterInteractionHandler: function (evtType, handler) {
                    return instance.root_.removeEventListener(evtType, handler, applyPassive());
                },
                deregisterResizeHandler: function (handler) { return window.removeEventListener('resize', handler); },
                getWindowPageOffset: function () { return ({ x: window.pageXOffset, y: window.pageYOffset }); },
                isSurfaceActive: function () { return matches(instance.root_, ':active'); },
                isSurfaceDisabled: function () { return Boolean(instance.disabled); },
                isUnbounded: function () { return Boolean(instance.unbounded); },
                registerDocumentInteractionHandler: function (evtType, handler) {
                    return document.documentElement.addEventListener(evtType, handler, applyPassive());
                },
                registerInteractionHandler: function (evtType, handler) {
                    return instance.root_.addEventListener(evtType, handler, applyPassive());
                },
                registerResizeHandler: function (handler) { return window.addEventListener('resize', handler); },
                removeClass: function (className) { return instance.root_.classList.remove(className); },
                updateCssVariable: function (varName, value) { return instance.root_.style.setProperty(varName, value); },
            };
        };
        Object.defineProperty(MDCRipple.prototype, "unbounded", {
            get: function () {
                return Boolean(this.unbounded_);
            },
            set: function (unbounded) {
                this.unbounded_ = Boolean(unbounded);
                this.setUnbounded_();
            },
            enumerable: true,
            configurable: true
        });
        MDCRipple.prototype.activate = function () {
            this.foundation_.activate();
        };
        MDCRipple.prototype.deactivate = function () {
            this.foundation_.deactivate();
        };
        MDCRipple.prototype.layout = function () {
            this.foundation_.layout();
        };
        MDCRipple.prototype.getDefaultFoundation = function () {
            return new MDCRippleFoundation(MDCRipple.createAdapter(this));
        };
        MDCRipple.prototype.initialSyncWithDOM = function () {
            var root = this.root_;
            this.unbounded = 'mdcRippleIsUnbounded' in root.dataset;
        };
        /**
         * Closure Compiler throws an access control error when directly accessing a
         * protected or private property inside a getter/setter, like unbounded above.
         * By accessing the protected property inside a method, we solve that problem.
         * That's why this function exists.
         */
        MDCRipple.prototype.setUnbounded_ = function () {
            this.foundation_.setUnbounded(Boolean(this.unbounded_));
        };
        return MDCRipple;
    }(MDCComponent));

    function Ripple(node, props = {ripple: false, unbounded: false, disabled: false, color: null, classForward: () => {}}) {
      let instance = null;
      let addLayoutListener = getContext('SMUI:addLayoutListener');
      let removeLayoutListener;
      let classList = [];
      let rippleCapableSurface = {
        get root_() {
          return node;
        },

        get unbounded() {
          return props.unbounded;
        },

        set unbounded(value) {
          return props.unbounded = value;
        },

        get disabled() {
          return props.disabled;
        },

        set disabled(value) {
          return props.disabled = value;
        }
      };

      function addClass(className) {
        const idx = classList.indexOf(className);
        if (idx === -1) {
          node.classList.add(className);
          classList.push(className);
          if (props.classForward) {
            props.classForward(classList);
          }
        }
      }

      function removeClass(className) {
        const idx = classList.indexOf(className);
        if (idx !== -1) {
          node.classList.remove(className);
          classList.splice(idx, 1);
          if (props.classForward) {
            props.classForward(classList);
          }
        }
      }

      function handleProps() {
        if (props.ripple && !instance) {
          // Override the Ripple component's adapter, so that we can forward classes
          // to Svelte components that overwrite Ripple's classes.
          const foundation = new MDCRippleFoundation({
            ...MDCRipple.createAdapter(rippleCapableSurface),
            addClass: (className) => addClass(className),
            removeClass: (className) => removeClass(className)
          });
          instance = new MDCRipple(node, foundation);
        } else if (instance && !props.ripple) {
          instance.destroy();
          instance = null;
        }
        if (props.ripple) {
          instance.unbounded = !!props.unbounded;
          switch (props.color) {
            case 'surface':
              addClass('mdc-ripple-surface');
              removeClass('mdc-ripple-surface--primary');
              removeClass('mdc-ripple-surface--accent');
              return;
            case 'primary':
              addClass('mdc-ripple-surface');
              addClass('mdc-ripple-surface--primary');
              removeClass('mdc-ripple-surface--accent');
              return;
            case 'secondary':
              addClass('mdc-ripple-surface');
              removeClass('mdc-ripple-surface--primary');
              addClass('mdc-ripple-surface--accent');
              return;
          }
        }
        removeClass('mdc-ripple-surface');
        removeClass('mdc-ripple-surface--primary');
        removeClass('mdc-ripple-surface--accent');
      }

      handleProps();

      if (addLayoutListener) {
        removeLayoutListener = addLayoutListener(layout);
      }

      function layout() {
        if (instance) {
          instance.layout();
        }
      }

      return {
        update(newProps = {ripple: false, unbounded: false, color: null, classForward: []}) {
          props = newProps;
          handleProps();
        },

        destroy() {
          if (instance) {
            instance.destroy();
            instance = null;
            removeClass('mdc-ripple-surface');
            removeClass('mdc-ripple-surface--primary');
            removeClass('mdc-ripple-surface--accent');
          }

          if (removeLayoutListener) {
            removeLayoutListener();
          }
        }
      }
    }

    /* node_modules/@smui/button/Button.svelte generated by Svelte v3.38.2 */
    const file$8 = "node_modules/@smui/button/Button.svelte";

    // (23:1) {#if ripple}
    function create_if_block_1$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "mdc-button__ripple");
    			add_location(div, file$8, 22, 13, 1114);
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
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(23:1) {#if ripple}",
    		ctx
    	});

    	return block;
    }

    // (23:69) {#if touch}
    function create_if_block$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "mdc-button__touch");
    			add_location(div, file$8, 22, 80, 1181);
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
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(23:69) {#if touch}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <svelte:component   this={component}   use={[[Ripple, {ripple, unbounded: false, disabled: !!$$props.disabled, classForward: classes => rippleClasses = classes}], forwardEvents, ...use]}   class="     mdc-button     {className}     {rippleClasses.join(' ')}     {variant === 'raised' ? 'mdc-button--raised' : ''}     {variant === 'unelevated' ? 'mdc-button--unelevated' : ''}     {variant === 'outlined' ? 'mdc-button--outlined' : ''}     {color === 'secondary' ? 'smui-button--color-secondary' : ''}     {touch ? 'mdc-button--touch' : ''}     {context === 'card:action' ? 'mdc-card__action' : ''}     {context === 'card:action' ? 'mdc-card__action--button' : ''}     {context === 'dialog:action' ? 'mdc-dialog__button' : ''}     {context === 'top-app-bar:navigation' ? 'mdc-top-app-bar__navigation-icon' : ''}     {context === 'top-app-bar:action' ? 'mdc-top-app-bar__action-item' : ''}     {context === 'snackbar' ? 'mdc-snackbar__action' : ''}   "   {...actionProp}   {...defaultProp}   {...exclude($$props, ['use', 'class', 'ripple', 'color', 'variant', 'touch', 'component', ...dialogExcludes])} >
    function create_default_slot$2(ctx) {
    	let if_block0_anchor;
    	let if_block1_anchor;
    	let current;
    	let if_block0 = /*ripple*/ ctx[2] && create_if_block_1$1(ctx);
    	const default_slot_template = /*#slots*/ ctx[17].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[19], null);
    	let if_block1 = /*touch*/ ctx[5] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			if_block0_anchor = empty();
    			if (default_slot) default_slot.c();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, if_block0_anchor, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*ripple*/ ctx[2]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(if_block0_anchor.parentNode, if_block0_anchor);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 524288)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[19], dirty, null, null);
    				}
    			}

    			if (/*touch*/ ctx[5]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
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
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(if_block0_anchor);
    			if (default_slot) default_slot.d(detaching);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(1:0) <svelte:component   this={component}   use={[[Ripple, {ripple, unbounded: false, disabled: !!$$props.disabled, classForward: classes => rippleClasses = classes}], forwardEvents, ...use]}   class=\\\"     mdc-button     {className}     {rippleClasses.join(' ')}     {variant === 'raised' ? 'mdc-button--raised' : ''}     {variant === 'unelevated' ? 'mdc-button--unelevated' : ''}     {variant === 'outlined' ? 'mdc-button--outlined' : ''}     {color === 'secondary' ? 'smui-button--color-secondary' : ''}     {touch ? 'mdc-button--touch' : ''}     {context === 'card:action' ? 'mdc-card__action' : ''}     {context === 'card:action' ? 'mdc-card__action--button' : ''}     {context === 'dialog:action' ? 'mdc-dialog__button' : ''}     {context === 'top-app-bar:navigation' ? 'mdc-top-app-bar__navigation-icon' : ''}     {context === 'top-app-bar:action' ? 'mdc-top-app-bar__action-item' : ''}     {context === 'snackbar' ? 'mdc-snackbar__action' : ''}   \\\"   {...actionProp}   {...defaultProp}   {...exclude($$props, ['use', 'class', 'ripple', 'color', 'variant', 'touch', 'component', ...dialogExcludes])} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{
    			use: [
    				[
    					Ripple,
    					{
    						ripple: /*ripple*/ ctx[2],
    						unbounded: false,
    						disabled: !!/*$$props*/ ctx[13].disabled,
    						classForward: /*func*/ ctx[18]
    					}
    				],
    				/*forwardEvents*/ ctx[11],
    				.../*use*/ ctx[0]
    			]
    		},
    		{
    			class: "\n    mdc-button\n    " + /*className*/ ctx[1] + "\n    " + /*rippleClasses*/ ctx[7].join(" ") + "\n    " + (/*variant*/ ctx[4] === "raised"
    			? "mdc-button--raised"
    			: "") + "\n    " + (/*variant*/ ctx[4] === "unelevated"
    			? "mdc-button--unelevated"
    			: "") + "\n    " + (/*variant*/ ctx[4] === "outlined"
    			? "mdc-button--outlined"
    			: "") + "\n    " + (/*color*/ ctx[3] === "secondary"
    			? "smui-button--color-secondary"
    			: "") + "\n    " + (/*touch*/ ctx[5] ? "mdc-button--touch" : "") + "\n    " + (/*context*/ ctx[12] === "card:action"
    			? "mdc-card__action"
    			: "") + "\n    " + (/*context*/ ctx[12] === "card:action"
    			? "mdc-card__action--button"
    			: "") + "\n    " + (/*context*/ ctx[12] === "dialog:action"
    			? "mdc-dialog__button"
    			: "") + "\n    " + (/*context*/ ctx[12] === "top-app-bar:navigation"
    			? "mdc-top-app-bar__navigation-icon"
    			: "") + "\n    " + (/*context*/ ctx[12] === "top-app-bar:action"
    			? "mdc-top-app-bar__action-item"
    			: "") + "\n    " + (/*context*/ ctx[12] === "snackbar"
    			? "mdc-snackbar__action"
    			: "") + "\n  "
    		},
    		/*actionProp*/ ctx[9],
    		/*defaultProp*/ ctx[10],
    		exclude(/*$$props*/ ctx[13], [
    			"use",
    			"class",
    			"ripple",
    			"color",
    			"variant",
    			"touch",
    			"component",
    			.../*dialogExcludes*/ ctx[8]
    		])
    	];

    	var switch_value = /*component*/ ctx[6];

    	function switch_props(ctx) {
    		let switch_instance_props = {
    			$$slots: { default: [create_default_slot$2] },
    			$$scope: { ctx }
    		};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const switch_instance_changes = (dirty & /*Ripple, ripple, $$props, rippleClasses, forwardEvents, use, className, variant, color, touch, context, actionProp, defaultProp, exclude, dialogExcludes*/ 16319)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*Ripple, ripple, $$props, rippleClasses, forwardEvents, use*/ 10373 && {
    						use: [
    							[
    								Ripple,
    								{
    									ripple: /*ripple*/ ctx[2],
    									unbounded: false,
    									disabled: !!/*$$props*/ ctx[13].disabled,
    									classForward: /*func*/ ctx[18]
    								}
    							],
    							/*forwardEvents*/ ctx[11],
    							.../*use*/ ctx[0]
    						]
    					},
    					dirty & /*className, rippleClasses, variant, color, touch, context*/ 4282 && {
    						class: "\n    mdc-button\n    " + /*className*/ ctx[1] + "\n    " + /*rippleClasses*/ ctx[7].join(" ") + "\n    " + (/*variant*/ ctx[4] === "raised"
    						? "mdc-button--raised"
    						: "") + "\n    " + (/*variant*/ ctx[4] === "unelevated"
    						? "mdc-button--unelevated"
    						: "") + "\n    " + (/*variant*/ ctx[4] === "outlined"
    						? "mdc-button--outlined"
    						: "") + "\n    " + (/*color*/ ctx[3] === "secondary"
    						? "smui-button--color-secondary"
    						: "") + "\n    " + (/*touch*/ ctx[5] ? "mdc-button--touch" : "") + "\n    " + (/*context*/ ctx[12] === "card:action"
    						? "mdc-card__action"
    						: "") + "\n    " + (/*context*/ ctx[12] === "card:action"
    						? "mdc-card__action--button"
    						: "") + "\n    " + (/*context*/ ctx[12] === "dialog:action"
    						? "mdc-dialog__button"
    						: "") + "\n    " + (/*context*/ ctx[12] === "top-app-bar:navigation"
    						? "mdc-top-app-bar__navigation-icon"
    						: "") + "\n    " + (/*context*/ ctx[12] === "top-app-bar:action"
    						? "mdc-top-app-bar__action-item"
    						: "") + "\n    " + (/*context*/ ctx[12] === "snackbar"
    						? "mdc-snackbar__action"
    						: "") + "\n  "
    					},
    					dirty & /*actionProp*/ 512 && get_spread_object(/*actionProp*/ ctx[9]),
    					dirty & /*defaultProp*/ 1024 && get_spread_object(/*defaultProp*/ ctx[10]),
    					dirty & /*exclude, $$props, dialogExcludes*/ 8448 && get_spread_object(exclude(/*$$props*/ ctx[13], [
    						"use",
    						"class",
    						"ripple",
    						"color",
    						"variant",
    						"touch",
    						"component",
    						.../*dialogExcludes*/ ctx[8]
    					]))
    				])
    			: {};

    			if (dirty & /*$$scope, touch, ripple*/ 524324) {
    				switch_instance_changes.$$scope = { dirty, ctx };
    			}

    			if (switch_value !== (switch_value = /*component*/ ctx[6])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
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
    	let dialogExcludes;
    	let actionProp;
    	let defaultProp;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button", slots, ['default']);
    	const forwardEvents = forwardEventsBuilder(get_current_component());
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { ripple = true } = $$props;
    	let { color = "primary" } = $$props;
    	let { variant = "text" } = $$props;
    	let { touch = false } = $$props;
    	let { href = null } = $$props;
    	let { action = "close" } = $$props;
    	let { default: defaultAction = false } = $$props;
    	let { component = href == null ? Button : A } = $$props;
    	let context = getContext("SMUI:button:context");
    	let rippleClasses = [];
    	setContext("SMUI:label:context", "button");
    	setContext("SMUI:icon:context", "button");
    	const func = classes => $$invalidate(7, rippleClasses = classes);

    	$$self.$$set = $$new_props => {
    		$$invalidate(13, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("ripple" in $$new_props) $$invalidate(2, ripple = $$new_props.ripple);
    		if ("color" in $$new_props) $$invalidate(3, color = $$new_props.color);
    		if ("variant" in $$new_props) $$invalidate(4, variant = $$new_props.variant);
    		if ("touch" in $$new_props) $$invalidate(5, touch = $$new_props.touch);
    		if ("href" in $$new_props) $$invalidate(14, href = $$new_props.href);
    		if ("action" in $$new_props) $$invalidate(15, action = $$new_props.action);
    		if ("default" in $$new_props) $$invalidate(16, defaultAction = $$new_props.default);
    		if ("component" in $$new_props) $$invalidate(6, component = $$new_props.component);
    		if ("$$scope" in $$new_props) $$invalidate(19, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		setContext,
    		getContext,
    		get_current_component,
    		forwardEventsBuilder,
    		exclude,
    		A,
    		Button,
    		Ripple,
    		forwardEvents,
    		use,
    		className,
    		ripple,
    		color,
    		variant,
    		touch,
    		href,
    		action,
    		defaultAction,
    		component,
    		context,
    		rippleClasses,
    		dialogExcludes,
    		actionProp,
    		defaultProp
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(13, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    		if ("ripple" in $$props) $$invalidate(2, ripple = $$new_props.ripple);
    		if ("color" in $$props) $$invalidate(3, color = $$new_props.color);
    		if ("variant" in $$props) $$invalidate(4, variant = $$new_props.variant);
    		if ("touch" in $$props) $$invalidate(5, touch = $$new_props.touch);
    		if ("href" in $$props) $$invalidate(14, href = $$new_props.href);
    		if ("action" in $$props) $$invalidate(15, action = $$new_props.action);
    		if ("defaultAction" in $$props) $$invalidate(16, defaultAction = $$new_props.defaultAction);
    		if ("component" in $$props) $$invalidate(6, component = $$new_props.component);
    		if ("context" in $$props) $$invalidate(12, context = $$new_props.context);
    		if ("rippleClasses" in $$props) $$invalidate(7, rippleClasses = $$new_props.rippleClasses);
    		if ("dialogExcludes" in $$props) $$invalidate(8, dialogExcludes = $$new_props.dialogExcludes);
    		if ("actionProp" in $$props) $$invalidate(9, actionProp = $$new_props.actionProp);
    		if ("defaultProp" in $$props) $$invalidate(10, defaultProp = $$new_props.defaultProp);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*action*/ 32768) {
    			$$invalidate(9, actionProp = context === "dialog:action" && action !== null
    			? { "data-mdc-dialog-action": action }
    			: {});
    		}

    		if ($$self.$$.dirty & /*defaultAction*/ 65536) {
    			$$invalidate(10, defaultProp = context === "dialog:action" && defaultAction
    			? { "data-mdc-dialog-button-default": "" }
    			: {});
    		}
    	};

    	$$invalidate(8, dialogExcludes = context === "dialog:action" ? ["action", "default"] : []);
    	$$props = exclude_internal_props($$props);

    	return [
    		use,
    		className,
    		ripple,
    		color,
    		variant,
    		touch,
    		component,
    		rippleClasses,
    		dialogExcludes,
    		actionProp,
    		defaultProp,
    		forwardEvents,
    		context,
    		$$props,
    		href,
    		action,
    		defaultAction,
    		slots,
    		func,
    		$$scope
    	];
    }

    class Button_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			use: 0,
    			class: 1,
    			ripple: 2,
    			color: 3,
    			variant: 4,
    			touch: 5,
    			href: 14,
    			action: 15,
    			default: 16,
    			component: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button_1",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get use() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ripple() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ripple(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get variant() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set variant(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get touch() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set touch(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get action() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set action(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get default() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set default(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get component() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set component(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function styleInject(css, ref) {
      if ( ref === void 0 ) ref = {};
      var insertAt = ref.insertAt;

      if (!css || typeof document === 'undefined') { return; }

      var head = document.head || document.getElementsByTagName('head')[0];
      var style = document.createElement('style');
      style.type = 'text/css';

      if (insertAt === 'top') {
        if (head.firstChild) {
          head.insertBefore(style, head.firstChild);
        } else {
          head.appendChild(style);
        }
      } else {
        head.appendChild(style);
      }

      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
    }

    var css_248z$4 = ".mdc-touch-target-wrapper {\n  display: inline;\n}\n\n.mdc-button {\n  font-family: Roboto, sans-serif;\n  -moz-osx-font-smoothing: grayscale;\n  -webkit-font-smoothing: antialiased;\n  font-size: 0.875rem;\n  line-height: 2.25rem;\n  font-weight: 500;\n  letter-spacing: 0.0892857143em;\n  text-decoration: none;\n  text-transform: uppercase;\n  padding: 0 8px 0 8px;\n  display: inline-flex;\n  position: relative;\n  align-items: center;\n  justify-content: center;\n  box-sizing: border-box;\n  min-width: 64px;\n  border: none;\n  outline: none;\n  /* @alternate */\n  line-height: inherit;\n  user-select: none;\n  -webkit-appearance: none;\n  overflow: visible;\n  vertical-align: middle;\n  border-radius: 4px;\n}\n.mdc-button::-moz-focus-inner {\n  padding: 0;\n  border: 0;\n}\n.mdc-button:active {\n  outline: none;\n}\n.mdc-button:hover {\n  cursor: pointer;\n}\n.mdc-button:disabled {\n  background-color: transparent;\n  color: rgba(0, 0, 0, 0.37);\n  cursor: default;\n  pointer-events: none;\n}\n.mdc-button .mdc-button__ripple {\n  border-radius: 4px;\n}\n.mdc-button:not(:disabled) {\n  background-color: transparent;\n}\n.mdc-button .mdc-button__icon {\n  /* @noflip */\n  margin-left: 0;\n  /* @noflip */\n  margin-right: 8px;\n  display: inline-block;\n  width: 18px;\n  height: 18px;\n  font-size: 18px;\n  vertical-align: top;\n}\n[dir=rtl] .mdc-button .mdc-button__icon, .mdc-button .mdc-button__icon[dir=rtl] {\n  /* @noflip */\n  margin-left: 8px;\n  /* @noflip */\n  margin-right: 0;\n}\n.mdc-button .mdc-button__touch {\n  position: absolute;\n  top: 50%;\n  right: 0;\n  left: 0;\n  height: 48px;\n  transform: translateY(-50%);\n}\n.mdc-button:not(:disabled) {\n  color: #6200ee;\n  /* @alternate */\n  color: var(--mdc-theme-primary, #6200ee);\n}\n\n.mdc-button__label + .mdc-button__icon {\n  /* @noflip */\n  margin-left: 8px;\n  /* @noflip */\n  margin-right: 0;\n}\n[dir=rtl] .mdc-button__label + .mdc-button__icon, .mdc-button__label + .mdc-button__icon[dir=rtl] {\n  /* @noflip */\n  margin-left: 0;\n  /* @noflip */\n  margin-right: 8px;\n}\n\nsvg.mdc-button__icon {\n  fill: currentColor;\n}\n\n.mdc-button--raised .mdc-button__icon,\n.mdc-button--unelevated .mdc-button__icon,\n.mdc-button--outlined .mdc-button__icon {\n  /* @noflip */\n  margin-left: -4px;\n  /* @noflip */\n  margin-right: 8px;\n}\n[dir=rtl] .mdc-button--raised .mdc-button__icon, .mdc-button--raised .mdc-button__icon[dir=rtl],\n[dir=rtl] .mdc-button--unelevated .mdc-button__icon,\n.mdc-button--unelevated .mdc-button__icon[dir=rtl],\n[dir=rtl] .mdc-button--outlined .mdc-button__icon,\n.mdc-button--outlined .mdc-button__icon[dir=rtl] {\n  /* @noflip */\n  margin-left: 8px;\n  /* @noflip */\n  margin-right: -4px;\n}\n.mdc-button--raised .mdc-button__label + .mdc-button__icon,\n.mdc-button--unelevated .mdc-button__label + .mdc-button__icon,\n.mdc-button--outlined .mdc-button__label + .mdc-button__icon {\n  /* @noflip */\n  margin-left: 8px;\n  /* @noflip */\n  margin-right: -4px;\n}\n[dir=rtl] .mdc-button--raised .mdc-button__label + .mdc-button__icon, .mdc-button--raised .mdc-button__label + .mdc-button__icon[dir=rtl],\n[dir=rtl] .mdc-button--unelevated .mdc-button__label + .mdc-button__icon,\n.mdc-button--unelevated .mdc-button__label + .mdc-button__icon[dir=rtl],\n[dir=rtl] .mdc-button--outlined .mdc-button__label + .mdc-button__icon,\n.mdc-button--outlined .mdc-button__label + .mdc-button__icon[dir=rtl] {\n  /* @noflip */\n  margin-left: -4px;\n  /* @noflip */\n  margin-right: 8px;\n}\n\n.mdc-button--raised,\n.mdc-button--unelevated {\n  padding: 0 16px 0 16px;\n}\n.mdc-button--raised:disabled,\n.mdc-button--unelevated:disabled {\n  background-color: rgba(0, 0, 0, 0.12);\n  color: rgba(0, 0, 0, 0.37);\n}\n.mdc-button--raised:not(:disabled),\n.mdc-button--unelevated:not(:disabled) {\n  background-color: #6200ee;\n}\n@supports not (-ms-ime-align: auto) {\n  .mdc-button--raised:not(:disabled),\n.mdc-button--unelevated:not(:disabled) {\n    /* @alternate */\n    background-color: var(--mdc-theme-primary, #6200ee);\n  }\n}\n.mdc-button--raised:not(:disabled),\n.mdc-button--unelevated:not(:disabled) {\n  color: #fff;\n  /* @alternate */\n  color: var(--mdc-theme-on-primary, #fff);\n}\n\n.mdc-button--raised {\n  box-shadow: 0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12);\n  transition: box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1);\n}\n.mdc-button--raised:hover, .mdc-button--raised:focus {\n  box-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 0.2), 0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0, 0, 0, 0.12);\n}\n.mdc-button--raised:active {\n  box-shadow: 0px 5px 5px -3px rgba(0, 0, 0, 0.2), 0px 8px 10px 1px rgba(0, 0, 0, 0.14), 0px 3px 14px 2px rgba(0, 0, 0, 0.12);\n}\n.mdc-button--raised:disabled {\n  box-shadow: 0px 0px 0px 0px rgba(0, 0, 0, 0.2), 0px 0px 0px 0px rgba(0, 0, 0, 0.14), 0px 0px 0px 0px rgba(0, 0, 0, 0.12);\n}\n\n.mdc-button--outlined {\n  border-style: solid;\n  padding: 0 15px 0 15px;\n  border-width: 1px;\n}\n.mdc-button--outlined:disabled {\n  border-color: rgba(0, 0, 0, 0.37);\n}\n.mdc-button--outlined .mdc-button__ripple {\n  top: -1px;\n  left: -1px;\n  border: 1px solid transparent;\n}\n.mdc-button--outlined:not(:disabled) {\n  border-color: #6200ee;\n  /* @alternate */\n  border-color: var(--mdc-theme-primary, #6200ee);\n}\n\n.mdc-button--touch {\n  margin-top: 6px;\n  margin-bottom: 6px;\n}\n\n@keyframes mdc-ripple-fg-radius-in {\n  from {\n    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n    transform: translate(var(--mdc-ripple-fg-translate-start, 0)) scale(1);\n  }\n  to {\n    transform: translate(var(--mdc-ripple-fg-translate-end, 0)) scale(var(--mdc-ripple-fg-scale, 1));\n  }\n}\n@keyframes mdc-ripple-fg-opacity-in {\n  from {\n    animation-timing-function: linear;\n    opacity: 0;\n  }\n  to {\n    opacity: var(--mdc-ripple-fg-opacity, 0);\n  }\n}\n@keyframes mdc-ripple-fg-opacity-out {\n  from {\n    animation-timing-function: linear;\n    opacity: var(--mdc-ripple-fg-opacity, 0);\n  }\n  to {\n    opacity: 0;\n  }\n}\n.mdc-ripple-surface--test-edge-var-bug {\n  --mdc-ripple-surface-test-edge-var: 1px solid #000;\n  visibility: hidden;\n}\n.mdc-ripple-surface--test-edge-var-bug::before {\n  border: var(--mdc-ripple-surface-test-edge-var);\n}\n\n.mdc-button {\n  --mdc-ripple-fg-size: 0;\n  --mdc-ripple-left: 0;\n  --mdc-ripple-top: 0;\n  --mdc-ripple-fg-scale: 1;\n  --mdc-ripple-fg-translate-end: 0;\n  --mdc-ripple-fg-translate-start: 0;\n  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);\n}\n.mdc-button .mdc-button__ripple::before,\n.mdc-button .mdc-button__ripple::after {\n  position: absolute;\n  border-radius: 50%;\n  opacity: 0;\n  pointer-events: none;\n  content: \"\";\n}\n.mdc-button .mdc-button__ripple::before {\n  transition: opacity 15ms linear, background-color 15ms linear;\n  z-index: 1;\n}\n.mdc-button.mdc-ripple-upgraded .mdc-button__ripple::before {\n  transform: scale(var(--mdc-ripple-fg-scale, 1));\n}\n.mdc-button.mdc-ripple-upgraded .mdc-button__ripple::after {\n  top: 0;\n  /* @noflip */\n  left: 0;\n  transform: scale(0);\n  transform-origin: center center;\n}\n.mdc-button.mdc-ripple-upgraded--unbounded .mdc-button__ripple::after {\n  top: var(--mdc-ripple-top, 0);\n  /* @noflip */\n  left: var(--mdc-ripple-left, 0);\n}\n.mdc-button.mdc-ripple-upgraded--foreground-activation .mdc-button__ripple::after {\n  animation: mdc-ripple-fg-radius-in 225ms forwards, mdc-ripple-fg-opacity-in 75ms forwards;\n}\n.mdc-button.mdc-ripple-upgraded--foreground-deactivation .mdc-button__ripple::after {\n  animation: mdc-ripple-fg-opacity-out 150ms;\n  transform: translate(var(--mdc-ripple-fg-translate-end, 0)) scale(var(--mdc-ripple-fg-scale, 1));\n}\n.mdc-button .mdc-button__ripple::before,\n.mdc-button .mdc-button__ripple::after {\n  top: calc(50% - 100%);\n  /* @noflip */\n  left: calc(50% - 100%);\n  width: 200%;\n  height: 200%;\n}\n.mdc-button.mdc-ripple-upgraded .mdc-button__ripple::after {\n  width: var(--mdc-ripple-fg-size, 100%);\n  height: var(--mdc-ripple-fg-size, 100%);\n}\n.mdc-button .mdc-button__ripple::before, .mdc-button .mdc-button__ripple::after {\n  background-color: #6200ee;\n}\n@supports not (-ms-ime-align: auto) {\n  .mdc-button .mdc-button__ripple::before, .mdc-button .mdc-button__ripple::after {\n    /* @alternate */\n    background-color: var(--mdc-theme-primary, #6200ee);\n  }\n}\n.mdc-button:hover .mdc-button__ripple::before {\n  opacity: 0.04;\n}\n.mdc-button.mdc-ripple-upgraded--background-focused .mdc-button__ripple::before, .mdc-button:not(.mdc-ripple-upgraded):focus .mdc-button__ripple::before {\n  transition-duration: 75ms;\n  opacity: 0.12;\n}\n.mdc-button:not(.mdc-ripple-upgraded) .mdc-button__ripple::after {\n  transition: opacity 150ms linear;\n}\n.mdc-button:not(.mdc-ripple-upgraded):active .mdc-button__ripple::after {\n  transition-duration: 75ms;\n  opacity: 0.12;\n}\n.mdc-button.mdc-ripple-upgraded {\n  --mdc-ripple-fg-opacity: 0.12;\n}\n.mdc-button .mdc-button__ripple {\n  position: absolute;\n  box-sizing: content-box;\n  width: 100%;\n  height: 100%;\n  overflow: hidden;\n}\n.mdc-button:not(.mdc-button--outlined) .mdc-button__ripple {\n  top: 0;\n  left: 0;\n}\n\n.mdc-button--raised .mdc-button__ripple::before, .mdc-button--raised .mdc-button__ripple::after,\n.mdc-button--unelevated .mdc-button__ripple::before,\n.mdc-button--unelevated .mdc-button__ripple::after {\n  background-color: #fff;\n}\n@supports not (-ms-ime-align: auto) {\n  .mdc-button--raised .mdc-button__ripple::before, .mdc-button--raised .mdc-button__ripple::after,\n.mdc-button--unelevated .mdc-button__ripple::before,\n.mdc-button--unelevated .mdc-button__ripple::after {\n    /* @alternate */\n    background-color: var(--mdc-theme-on-primary, #fff);\n  }\n}\n.mdc-button--raised:hover .mdc-button__ripple::before,\n.mdc-button--unelevated:hover .mdc-button__ripple::before {\n  opacity: 0.08;\n}\n.mdc-button--raised.mdc-ripple-upgraded--background-focused .mdc-button__ripple::before, .mdc-button--raised:not(.mdc-ripple-upgraded):focus .mdc-button__ripple::before,\n.mdc-button--unelevated.mdc-ripple-upgraded--background-focused .mdc-button__ripple::before,\n.mdc-button--unelevated:not(.mdc-ripple-upgraded):focus .mdc-button__ripple::before {\n  transition-duration: 75ms;\n  opacity: 0.24;\n}\n.mdc-button--raised:not(.mdc-ripple-upgraded) .mdc-button__ripple::after,\n.mdc-button--unelevated:not(.mdc-ripple-upgraded) .mdc-button__ripple::after {\n  transition: opacity 150ms linear;\n}\n.mdc-button--raised:not(.mdc-ripple-upgraded):active .mdc-button__ripple::after,\n.mdc-button--unelevated:not(.mdc-ripple-upgraded):active .mdc-button__ripple::after {\n  transition-duration: 75ms;\n  opacity: 0.24;\n}\n.mdc-button--raised.mdc-ripple-upgraded,\n.mdc-button--unelevated.mdc-ripple-upgraded {\n  --mdc-ripple-fg-opacity: 0.24;\n}\n\n.mdc-button {\n  height: 36px;\n}\n\n.mdc-ripple-surface {\n  --mdc-ripple-fg-size: 0;\n  --mdc-ripple-left: 0;\n  --mdc-ripple-top: 0;\n  --mdc-ripple-fg-scale: 1;\n  --mdc-ripple-fg-translate-end: 0;\n  --mdc-ripple-fg-translate-start: 0;\n  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);\n  position: relative;\n  outline: none;\n  overflow: hidden;\n}\n.mdc-ripple-surface::before, .mdc-ripple-surface::after {\n  position: absolute;\n  border-radius: 50%;\n  opacity: 0;\n  pointer-events: none;\n  content: \"\";\n}\n.mdc-ripple-surface::before {\n  transition: opacity 15ms linear, background-color 15ms linear;\n  z-index: 1;\n}\n.mdc-ripple-surface.mdc-ripple-upgraded::before {\n  transform: scale(var(--mdc-ripple-fg-scale, 1));\n}\n.mdc-ripple-surface.mdc-ripple-upgraded::after {\n  top: 0;\n  /* @noflip */\n  left: 0;\n  transform: scale(0);\n  transform-origin: center center;\n}\n.mdc-ripple-surface.mdc-ripple-upgraded--unbounded::after {\n  top: var(--mdc-ripple-top, 0);\n  /* @noflip */\n  left: var(--mdc-ripple-left, 0);\n}\n.mdc-ripple-surface.mdc-ripple-upgraded--foreground-activation::after {\n  animation: mdc-ripple-fg-radius-in 225ms forwards, mdc-ripple-fg-opacity-in 75ms forwards;\n}\n.mdc-ripple-surface.mdc-ripple-upgraded--foreground-deactivation::after {\n  animation: mdc-ripple-fg-opacity-out 150ms;\n  transform: translate(var(--mdc-ripple-fg-translate-end, 0)) scale(var(--mdc-ripple-fg-scale, 1));\n}\n.mdc-ripple-surface::before, .mdc-ripple-surface::after {\n  background-color: #000;\n}\n.mdc-ripple-surface:hover::before {\n  opacity: 0.04;\n}\n.mdc-ripple-surface.mdc-ripple-upgraded--background-focused::before, .mdc-ripple-surface:not(.mdc-ripple-upgraded):focus::before {\n  transition-duration: 75ms;\n  opacity: 0.12;\n}\n.mdc-ripple-surface:not(.mdc-ripple-upgraded)::after {\n  transition: opacity 150ms linear;\n}\n.mdc-ripple-surface:not(.mdc-ripple-upgraded):active::after {\n  transition-duration: 75ms;\n  opacity: 0.12;\n}\n.mdc-ripple-surface.mdc-ripple-upgraded {\n  --mdc-ripple-fg-opacity: 0.12;\n}\n.mdc-ripple-surface::before, .mdc-ripple-surface::after {\n  top: calc(50% - 100%);\n  /* @noflip */\n  left: calc(50% - 100%);\n  width: 200%;\n  height: 200%;\n}\n.mdc-ripple-surface.mdc-ripple-upgraded::after {\n  width: var(--mdc-ripple-fg-size, 100%);\n  height: var(--mdc-ripple-fg-size, 100%);\n}\n.mdc-ripple-surface[data-mdc-ripple-is-unbounded] {\n  overflow: visible;\n}\n.mdc-ripple-surface[data-mdc-ripple-is-unbounded]::before, .mdc-ripple-surface[data-mdc-ripple-is-unbounded]::after {\n  top: calc(50% - 50%);\n  /* @noflip */\n  left: calc(50% - 50%);\n  width: 100%;\n  height: 100%;\n}\n.mdc-ripple-surface[data-mdc-ripple-is-unbounded].mdc-ripple-upgraded::before, .mdc-ripple-surface[data-mdc-ripple-is-unbounded].mdc-ripple-upgraded::after {\n  top: var(--mdc-ripple-top, calc(50% - 50%));\n  /* @noflip */\n  left: var(--mdc-ripple-left, calc(50% - 50%));\n  width: var(--mdc-ripple-fg-size, 100%);\n  height: var(--mdc-ripple-fg-size, 100%);\n}\n.mdc-ripple-surface[data-mdc-ripple-is-unbounded].mdc-ripple-upgraded::after {\n  width: var(--mdc-ripple-fg-size, 100%);\n  height: var(--mdc-ripple-fg-size, 100%);\n}\n.mdc-ripple-surface--primary::before, .mdc-ripple-surface--primary::after {\n  background-color: #6200ee;\n}\n@supports not (-ms-ime-align: auto) {\n  .mdc-ripple-surface--primary::before, .mdc-ripple-surface--primary::after {\n    /* @alternate */\n    background-color: var(--mdc-theme-primary, #6200ee);\n  }\n}\n.mdc-ripple-surface--primary:hover::before {\n  opacity: 0.04;\n}\n.mdc-ripple-surface--primary.mdc-ripple-upgraded--background-focused::before, .mdc-ripple-surface--primary:not(.mdc-ripple-upgraded):focus::before {\n  transition-duration: 75ms;\n  opacity: 0.12;\n}\n.mdc-ripple-surface--primary:not(.mdc-ripple-upgraded)::after {\n  transition: opacity 150ms linear;\n}\n.mdc-ripple-surface--primary:not(.mdc-ripple-upgraded):active::after {\n  transition-duration: 75ms;\n  opacity: 0.12;\n}\n.mdc-ripple-surface--primary.mdc-ripple-upgraded {\n  --mdc-ripple-fg-opacity: 0.12;\n}\n.mdc-ripple-surface--accent::before, .mdc-ripple-surface--accent::after {\n  background-color: #018786;\n}\n@supports not (-ms-ime-align: auto) {\n  .mdc-ripple-surface--accent::before, .mdc-ripple-surface--accent::after {\n    /* @alternate */\n    background-color: var(--mdc-theme-secondary, #018786);\n  }\n}\n.mdc-ripple-surface--accent:hover::before {\n  opacity: 0.04;\n}\n.mdc-ripple-surface--accent.mdc-ripple-upgraded--background-focused::before, .mdc-ripple-surface--accent:not(.mdc-ripple-upgraded):focus::before {\n  transition-duration: 75ms;\n  opacity: 0.12;\n}\n.mdc-ripple-surface--accent:not(.mdc-ripple-upgraded)::after {\n  transition: opacity 150ms linear;\n}\n.mdc-ripple-surface--accent:not(.mdc-ripple-upgraded):active::after {\n  transition-duration: 75ms;\n  opacity: 0.12;\n}\n.mdc-ripple-surface--accent.mdc-ripple-upgraded {\n  --mdc-ripple-fg-opacity: 0.12;\n}\n\n.smui-button--color-secondary:not(:disabled) {\n  color: #018786;\n  /* @alternate */\n  color: var(--mdc-theme-secondary, #018786);\n}\n.smui-button--color-secondary.mdc-button--raised:not(:disabled), .smui-button--color-secondary.mdc-button--unelevated:not(:disabled) {\n  background-color: #018786;\n}\n@supports not (-ms-ime-align: auto) {\n  .smui-button--color-secondary.mdc-button--raised:not(:disabled), .smui-button--color-secondary.mdc-button--unelevated:not(:disabled) {\n    /* @alternate */\n    background-color: var(--mdc-theme-secondary, #018786);\n  }\n}\n.smui-button--color-secondary.mdc-button--raised:not(:disabled), .smui-button--color-secondary.mdc-button--unelevated:not(:disabled) {\n  color: #fff;\n  /* @alternate */\n  color: var(--mdc-theme-on-secondary, #fff);\n}\n.smui-button--color-secondary.mdc-button--outlined:not(:disabled) {\n  border-color: #018786;\n  /* @alternate */\n  border-color: var(--mdc-theme-secondary, #018786);\n}\n\n.smui-button--color-secondary::before, .smui-button--color-secondary::after {\n  background-color: #018786;\n}\n@supports not (-ms-ime-align: auto) {\n  .smui-button--color-secondary::before, .smui-button--color-secondary::after {\n    /* @alternate */\n    background-color: var(--mdc-theme-secondary, #018786);\n  }\n}\n.smui-button--color-secondary:hover::before {\n  opacity: 0.04;\n}\n.smui-button--color-secondary.mdc-ripple-upgraded--background-focused::before, .smui-button--color-secondary:not(.mdc-ripple-upgraded):focus::before {\n  transition-duration: 75ms;\n  opacity: 0.12;\n}\n.smui-button--color-secondary:not(.mdc-ripple-upgraded)::after {\n  transition: opacity 150ms linear;\n}\n.smui-button--color-secondary:not(.mdc-ripple-upgraded):active::after {\n  transition-duration: 75ms;\n  opacity: 0.12;\n}\n.smui-button--color-secondary.mdc-ripple-upgraded {\n  --mdc-ripple-fg-opacity: 0.12;\n}\n.smui-button--color-secondary.mdc-button--raised::before, .smui-button--color-secondary.mdc-button--raised::after, .smui-button--color-secondary.mdc-button--unelevated::before, .smui-button--color-secondary.mdc-button--unelevated::after {\n  background-color: #fff;\n}\n@supports not (-ms-ime-align: auto) {\n  .smui-button--color-secondary.mdc-button--raised::before, .smui-button--color-secondary.mdc-button--raised::after, .smui-button--color-secondary.mdc-button--unelevated::before, .smui-button--color-secondary.mdc-button--unelevated::after {\n    /* @alternate */\n    background-color: var(--mdc-theme-on-secondary, #fff);\n  }\n}\n.smui-button--color-secondary.mdc-button--raised:hover::before, .smui-button--color-secondary.mdc-button--unelevated:hover::before {\n  opacity: 0.08;\n}\n.smui-button--color-secondary.mdc-button--raised.mdc-ripple-upgraded--background-focused::before, .smui-button--color-secondary.mdc-button--raised:not(.mdc-ripple-upgraded):focus::before, .smui-button--color-secondary.mdc-button--unelevated.mdc-ripple-upgraded--background-focused::before, .smui-button--color-secondary.mdc-button--unelevated:not(.mdc-ripple-upgraded):focus::before {\n  transition-duration: 75ms;\n  opacity: 0.24;\n}\n.smui-button--color-secondary.mdc-button--raised:not(.mdc-ripple-upgraded)::after, .smui-button--color-secondary.mdc-button--unelevated:not(.mdc-ripple-upgraded)::after {\n  transition: opacity 150ms linear;\n}\n.smui-button--color-secondary.mdc-button--raised:not(.mdc-ripple-upgraded):active::after, .smui-button--color-secondary.mdc-button--unelevated:not(.mdc-ripple-upgraded):active::after {\n  transition-duration: 75ms;\n  opacity: 0.24;\n}\n.smui-button--color-secondary.mdc-button--raised.mdc-ripple-upgraded, .smui-button--color-secondary.mdc-button--unelevated.mdc-ripple-upgraded {\n  --mdc-ripple-fg-opacity: 0.24;\n}\n\n.smui-button__group {\n  display: inline-flex;\n}\n.smui-button__group > .mdc-button, .smui-button__group > .smui-button__group-item > .mdc-button {\n  margin-left: 0;\n  margin-right: 0;\n}\n.smui-button__group > .mdc-button:not(:last-child), .smui-button__group > .mdc-button:not(:last-child) > .mdc-button__ripple, .smui-button__group > .smui-button__group-item:not(:last-child) > .mdc-button, .smui-button__group > .smui-button__group-item:not(:last-child) > .mdc-button > .mdc-button__ripple {\n  border-top-right-radius: 0;\n  border-bottom-right-radius: 0;\n}\n.smui-button__group > .mdc-button:not(:first-child), .smui-button__group > .mdc-button:not(:first-child) > .mdc-button__ripple, .smui-button__group > .smui-button__group-item:not(:first-child) > .mdc-button, .smui-button__group > .smui-button__group-item:not(:first-child) > .mdc-button > .mdc-button__ripple {\n  border-top-left-radius: 0;\n  border-bottom-left-radius: 0;\n}\n.smui-button__group.smui-button__group--raised {\n  box-shadow: 0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12);\n}\n.smui-button__group > .mdc-button--raised, .smui-button__group > .smui-button__group-item > .mdc-button--raised {\n  border-radius: 4px;\n  box-shadow: 0px 0px 0px 0px rgba(0, 0, 0, 0.2), 0px 0px 0px 0px rgba(0, 0, 0, 0.14), 0px 0px 0px 0px rgba(0, 0, 0, 0.12);\n}\n.smui-button__group > .mdc-button--raised .mdc-button__ripple, .smui-button__group > .smui-button__group-item > .mdc-button--raised .mdc-button__ripple {\n  border-radius: 4px;\n}\n.smui-button__group > .mdc-button--raised:hover, .smui-button__group > .mdc-button--raised:focus, .smui-button__group > .smui-button__group-item > .mdc-button--raised:hover, .smui-button__group > .smui-button__group-item > .mdc-button--raised:focus {\n  box-shadow: 0px 0px 0px 0px rgba(0, 0, 0, 0.2), 0px 0px 0px 0px rgba(0, 0, 0, 0.14), 0px 0px 0px 0px rgba(0, 0, 0, 0.12);\n}\n.smui-button__group > .mdc-button--raised:active, .smui-button__group > .smui-button__group-item > .mdc-button--raised:active {\n  box-shadow: 0px 0px 0px 0px rgba(0, 0, 0, 0.2), 0px 0px 0px 0px rgba(0, 0, 0, 0.14), 0px 0px 0px 0px rgba(0, 0, 0, 0.12);\n}\n.smui-button__group > .mdc-button--raised:disabled, .smui-button__group > .smui-button__group-item > .mdc-button--raised:disabled {\n  box-shadow: 0px 0px 0px 0px rgba(0, 0, 0, 0.2), 0px 0px 0px 0px rgba(0, 0, 0, 0.14), 0px 0px 0px 0px rgba(0, 0, 0, 0.12);\n}\n.smui-button__group > .mdc-button--outlined:not(:last-child), .smui-button__group > .smui-button__group-item:not(:last-child) > .mdc-button--outlined {\n  border-right-width: 0;\n}\n";
    styleInject(css_248z$4);

    /**
     * @license
     * Copyright 2017 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses$1 = {
        ACTIVE: 'mdc-slider--active',
        DISABLED: 'mdc-slider--disabled',
        DISCRETE: 'mdc-slider--discrete',
        FOCUS: 'mdc-slider--focus',
        HAS_TRACK_MARKER: 'mdc-slider--display-markers',
        IN_TRANSIT: 'mdc-slider--in-transit',
        IS_DISCRETE: 'mdc-slider--discrete',
    };
    var strings$1 = {
        ARIA_DISABLED: 'aria-disabled',
        ARIA_VALUEMAX: 'aria-valuemax',
        ARIA_VALUEMIN: 'aria-valuemin',
        ARIA_VALUENOW: 'aria-valuenow',
        CHANGE_EVENT: 'MDCSlider:change',
        INPUT_EVENT: 'MDCSlider:input',
        PIN_VALUE_MARKER_SELECTOR: '.mdc-slider__pin-value-marker',
        STEP_DATA_ATTR: 'data-step',
        THUMB_CONTAINER_SELECTOR: '.mdc-slider__thumb-container',
        TRACK_MARKER_CONTAINER_SELECTOR: '.mdc-slider__track-marker-container',
        TRACK_SELECTOR: '.mdc-slider__track',
    };
    var numbers = {
        PAGE_FACTOR: 4,
    };

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssPropertyNameMap = {
        animation: {
            prefixed: '-webkit-animation',
            standard: 'animation',
        },
        transform: {
            prefixed: '-webkit-transform',
            standard: 'transform',
        },
        transition: {
            prefixed: '-webkit-transition',
            standard: 'transition',
        },
    };
    var jsEventTypeMap = {
        animationend: {
            cssProperty: 'animation',
            prefixed: 'webkitAnimationEnd',
            standard: 'animationend',
        },
        animationiteration: {
            cssProperty: 'animation',
            prefixed: 'webkitAnimationIteration',
            standard: 'animationiteration',
        },
        animationstart: {
            cssProperty: 'animation',
            prefixed: 'webkitAnimationStart',
            standard: 'animationstart',
        },
        transitionend: {
            cssProperty: 'transition',
            prefixed: 'webkitTransitionEnd',
            standard: 'transitionend',
        },
    };
    function isWindow(windowObj) {
        return Boolean(windowObj.document) && typeof windowObj.document.createElement === 'function';
    }
    function getCorrectPropertyName(windowObj, cssProperty) {
        if (isWindow(windowObj) && cssProperty in cssPropertyNameMap) {
            var el = windowObj.document.createElement('div');
            var _a = cssPropertyNameMap[cssProperty], standard = _a.standard, prefixed = _a.prefixed;
            var isStandard = standard in el.style;
            return isStandard ? standard : prefixed;
        }
        return cssProperty;
    }
    function getCorrectEventName(windowObj, eventType) {
        if (isWindow(windowObj) && eventType in jsEventTypeMap) {
            var el = windowObj.document.createElement('div');
            var _a = jsEventTypeMap[eventType], standard = _a.standard, prefixed = _a.prefixed, cssProperty = _a.cssProperty;
            var isStandard = cssProperty in el.style;
            return isStandard ? standard : prefixed;
        }
        return eventType;
    }

    /**
     * @license
     * Copyright 2017 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var DOWN_EVENTS = ['mousedown', 'pointerdown', 'touchstart'];
    var UP_EVENTS = ['mouseup', 'pointerup', 'touchend'];
    var MOVE_EVENT_MAP = {
        mousedown: 'mousemove',
        pointerdown: 'pointermove',
        touchstart: 'touchmove',
    };
    var KEY_IDS = {
        ARROW_DOWN: 'ArrowDown',
        ARROW_LEFT: 'ArrowLeft',
        ARROW_RIGHT: 'ArrowRight',
        ARROW_UP: 'ArrowUp',
        END: 'End',
        HOME: 'Home',
        PAGE_DOWN: 'PageDown',
        PAGE_UP: 'PageUp',
    };
    var MDCSliderFoundation = /** @class */ (function (_super) {
        __extends(MDCSliderFoundation, _super);
        function MDCSliderFoundation(adapter) {
            var _this = _super.call(this, __assign({}, MDCSliderFoundation.defaultAdapter, adapter)) || this;
            /**
             * We set this to NaN since we want it to be a number, but we can't use '0' or '-1'
             * because those could be valid tabindices set by the client code.
             */
            _this.savedTabIndex_ = NaN;
            _this.active_ = false;
            _this.inTransit_ = false;
            _this.isDiscrete_ = false;
            _this.hasTrackMarker_ = false;
            _this.handlingThumbTargetEvt_ = false;
            _this.min_ = 0;
            _this.max_ = 100;
            _this.step_ = 0;
            _this.value_ = 0;
            _this.disabled_ = false;
            _this.preventFocusState_ = false;
            _this.thumbContainerPointerHandler_ = function () { return _this.handlingThumbTargetEvt_ = true; };
            _this.interactionStartHandler_ = function (evt) { return _this.handleDown_(evt); };
            _this.keydownHandler_ = function (evt) { return _this.handleKeydown_(evt); };
            _this.focusHandler_ = function () { return _this.handleFocus_(); };
            _this.blurHandler_ = function () { return _this.handleBlur_(); };
            _this.resizeHandler_ = function () { return _this.layout(); };
            return _this;
        }
        Object.defineProperty(MDCSliderFoundation, "cssClasses", {
            get: function () {
                return cssClasses$1;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCSliderFoundation, "strings", {
            get: function () {
                return strings$1;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCSliderFoundation, "numbers", {
            get: function () {
                return numbers;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCSliderFoundation, "defaultAdapter", {
            get: function () {
                // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
                return {
                    hasClass: function () { return false; },
                    addClass: function () { return undefined; },
                    removeClass: function () { return undefined; },
                    getAttribute: function () { return null; },
                    setAttribute: function () { return undefined; },
                    removeAttribute: function () { return undefined; },
                    computeBoundingRect: function () { return ({ top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 }); },
                    getTabIndex: function () { return 0; },
                    registerInteractionHandler: function () { return undefined; },
                    deregisterInteractionHandler: function () { return undefined; },
                    registerThumbContainerInteractionHandler: function () { return undefined; },
                    deregisterThumbContainerInteractionHandler: function () { return undefined; },
                    registerBodyInteractionHandler: function () { return undefined; },
                    deregisterBodyInteractionHandler: function () { return undefined; },
                    registerResizeHandler: function () { return undefined; },
                    deregisterResizeHandler: function () { return undefined; },
                    notifyInput: function () { return undefined; },
                    notifyChange: function () { return undefined; },
                    setThumbContainerStyleProperty: function () { return undefined; },
                    setTrackStyleProperty: function () { return undefined; },
                    setMarkerValue: function () { return undefined; },
                    setTrackMarkers: function () { return undefined; },
                    isRTL: function () { return false; },
                };
                // tslint:enable:object-literal-sort-keys
            },
            enumerable: true,
            configurable: true
        });
        MDCSliderFoundation.prototype.init = function () {
            var _this = this;
            this.isDiscrete_ = this.adapter_.hasClass(cssClasses$1.IS_DISCRETE);
            this.hasTrackMarker_ = this.adapter_.hasClass(cssClasses$1.HAS_TRACK_MARKER);
            DOWN_EVENTS.forEach(function (evtName) {
                _this.adapter_.registerInteractionHandler(evtName, _this.interactionStartHandler_);
                _this.adapter_.registerThumbContainerInteractionHandler(evtName, _this.thumbContainerPointerHandler_);
            });
            this.adapter_.registerInteractionHandler('keydown', this.keydownHandler_);
            this.adapter_.registerInteractionHandler('focus', this.focusHandler_);
            this.adapter_.registerInteractionHandler('blur', this.blurHandler_);
            this.adapter_.registerResizeHandler(this.resizeHandler_);
            this.layout();
            // At last step, provide a reasonable default value to discrete slider
            if (this.isDiscrete_ && this.getStep() === 0) {
                this.step_ = 1;
            }
        };
        MDCSliderFoundation.prototype.destroy = function () {
            var _this = this;
            DOWN_EVENTS.forEach(function (evtName) {
                _this.adapter_.deregisterInteractionHandler(evtName, _this.interactionStartHandler_);
                _this.adapter_.deregisterThumbContainerInteractionHandler(evtName, _this.thumbContainerPointerHandler_);
            });
            this.adapter_.deregisterInteractionHandler('keydown', this.keydownHandler_);
            this.adapter_.deregisterInteractionHandler('focus', this.focusHandler_);
            this.adapter_.deregisterInteractionHandler('blur', this.blurHandler_);
            this.adapter_.deregisterResizeHandler(this.resizeHandler_);
        };
        MDCSliderFoundation.prototype.setupTrackMarker = function () {
            if (this.isDiscrete_ && this.hasTrackMarker_ && this.getStep() !== 0) {
                this.adapter_.setTrackMarkers(this.getStep(), this.getMax(), this.getMin());
            }
        };
        MDCSliderFoundation.prototype.layout = function () {
            this.rect_ = this.adapter_.computeBoundingRect();
            this.updateUIForCurrentValue_();
        };
        MDCSliderFoundation.prototype.getValue = function () {
            return this.value_;
        };
        MDCSliderFoundation.prototype.setValue = function (value) {
            this.setValue_(value, false);
        };
        MDCSliderFoundation.prototype.getMax = function () {
            return this.max_;
        };
        MDCSliderFoundation.prototype.setMax = function (max) {
            if (max < this.min_) {
                throw new Error('Cannot set max to be less than the slider\'s minimum value');
            }
            this.max_ = max;
            this.setValue_(this.value_, false, true);
            this.adapter_.setAttribute(strings$1.ARIA_VALUEMAX, String(this.max_));
            this.setupTrackMarker();
        };
        MDCSliderFoundation.prototype.getMin = function () {
            return this.min_;
        };
        MDCSliderFoundation.prototype.setMin = function (min) {
            if (min > this.max_) {
                throw new Error('Cannot set min to be greater than the slider\'s maximum value');
            }
            this.min_ = min;
            this.setValue_(this.value_, false, true);
            this.adapter_.setAttribute(strings$1.ARIA_VALUEMIN, String(this.min_));
            this.setupTrackMarker();
        };
        MDCSliderFoundation.prototype.getStep = function () {
            return this.step_;
        };
        MDCSliderFoundation.prototype.setStep = function (step) {
            if (step < 0) {
                throw new Error('Step cannot be set to a negative number');
            }
            if (this.isDiscrete_ && (typeof (step) !== 'number' || step < 1)) {
                step = 1;
            }
            this.step_ = step;
            this.setValue_(this.value_, false, true);
            this.setupTrackMarker();
        };
        MDCSliderFoundation.prototype.isDisabled = function () {
            return this.disabled_;
        };
        MDCSliderFoundation.prototype.setDisabled = function (disabled) {
            this.disabled_ = disabled;
            this.toggleClass_(cssClasses$1.DISABLED, this.disabled_);
            if (this.disabled_) {
                this.savedTabIndex_ = this.adapter_.getTabIndex();
                this.adapter_.setAttribute(strings$1.ARIA_DISABLED, 'true');
                this.adapter_.removeAttribute('tabindex');
            }
            else {
                this.adapter_.removeAttribute(strings$1.ARIA_DISABLED);
                if (!isNaN(this.savedTabIndex_)) {
                    this.adapter_.setAttribute('tabindex', String(this.savedTabIndex_));
                }
            }
        };
        /**
         * Called when the user starts interacting with the slider
         */
        MDCSliderFoundation.prototype.handleDown_ = function (downEvent) {
            var _this = this;
            if (this.disabled_) {
                return;
            }
            this.preventFocusState_ = true;
            this.setInTransit_(!this.handlingThumbTargetEvt_);
            this.handlingThumbTargetEvt_ = false;
            this.setActive_(true);
            var moveHandler = function (moveEvent) {
                _this.handleMove_(moveEvent);
            };
            var moveEventType = MOVE_EVENT_MAP[downEvent.type];
            // Note: upHandler is [de]registered on ALL potential pointer-related release event types, since some browsers
            // do not always fire these consistently in pairs.
            // (See https://github.com/material-components/material-components-web/issues/1192)
            var upHandler = function () {
                _this.handleUp_();
                _this.adapter_.deregisterBodyInteractionHandler(moveEventType, moveHandler);
                UP_EVENTS.forEach(function (evtName) { return _this.adapter_.deregisterBodyInteractionHandler(evtName, upHandler); });
            };
            this.adapter_.registerBodyInteractionHandler(moveEventType, moveHandler);
            UP_EVENTS.forEach(function (evtName) { return _this.adapter_.registerBodyInteractionHandler(evtName, upHandler); });
            this.setValueFromEvt_(downEvent);
        };
        /**
         * Called when the user moves the slider
         */
        MDCSliderFoundation.prototype.handleMove_ = function (evt) {
            evt.preventDefault();
            this.setValueFromEvt_(evt);
        };
        /**
         * Called when the user's interaction with the slider ends
         */
        MDCSliderFoundation.prototype.handleUp_ = function () {
            this.setActive_(false);
            this.adapter_.notifyChange();
        };
        /**
         * Returns the pageX of the event
         */
        MDCSliderFoundation.prototype.getPageX_ = function (evt) {
            if (evt.targetTouches && evt.targetTouches.length > 0) {
                return evt.targetTouches[0].pageX;
            }
            return evt.pageX;
        };
        /**
         * Sets the slider value from an event
         */
        MDCSliderFoundation.prototype.setValueFromEvt_ = function (evt) {
            var pageX = this.getPageX_(evt);
            var value = this.computeValueFromPageX_(pageX);
            this.setValue_(value, true);
        };
        /**
         * Computes the new value from the pageX position
         */
        MDCSliderFoundation.prototype.computeValueFromPageX_ = function (pageX) {
            var _a = this, max = _a.max_, min = _a.min_;
            var xPos = pageX - this.rect_.left;
            var pctComplete = xPos / this.rect_.width;
            if (this.adapter_.isRTL()) {
                pctComplete = 1 - pctComplete;
            }
            // Fit the percentage complete between the range [min,max]
            // by remapping from [0, 1] to [min, min+(max-min)].
            return min + pctComplete * (max - min);
        };
        /**
         * Handles keydown events
         */
        MDCSliderFoundation.prototype.handleKeydown_ = function (evt) {
            var keyId = this.getKeyId_(evt);
            var value = this.getValueForKeyId_(keyId);
            if (isNaN(value)) {
                return;
            }
            // Prevent page from scrolling due to key presses that would normally scroll the page
            evt.preventDefault();
            this.adapter_.addClass(cssClasses$1.FOCUS);
            this.setValue_(value, true);
            this.adapter_.notifyChange();
        };
        /**
         * Returns the computed name of the event
         */
        MDCSliderFoundation.prototype.getKeyId_ = function (kbdEvt) {
            if (kbdEvt.key === KEY_IDS.ARROW_LEFT || kbdEvt.keyCode === 37) {
                return KEY_IDS.ARROW_LEFT;
            }
            if (kbdEvt.key === KEY_IDS.ARROW_RIGHT || kbdEvt.keyCode === 39) {
                return KEY_IDS.ARROW_RIGHT;
            }
            if (kbdEvt.key === KEY_IDS.ARROW_UP || kbdEvt.keyCode === 38) {
                return KEY_IDS.ARROW_UP;
            }
            if (kbdEvt.key === KEY_IDS.ARROW_DOWN || kbdEvt.keyCode === 40) {
                return KEY_IDS.ARROW_DOWN;
            }
            if (kbdEvt.key === KEY_IDS.HOME || kbdEvt.keyCode === 36) {
                return KEY_IDS.HOME;
            }
            if (kbdEvt.key === KEY_IDS.END || kbdEvt.keyCode === 35) {
                return KEY_IDS.END;
            }
            if (kbdEvt.key === KEY_IDS.PAGE_UP || kbdEvt.keyCode === 33) {
                return KEY_IDS.PAGE_UP;
            }
            if (kbdEvt.key === KEY_IDS.PAGE_DOWN || kbdEvt.keyCode === 34) {
                return KEY_IDS.PAGE_DOWN;
            }
            return '';
        };
        /**
         * Computes the value given a keyboard key ID
         */
        MDCSliderFoundation.prototype.getValueForKeyId_ = function (keyId) {
            var _a = this, max = _a.max_, min = _a.min_, step = _a.step_;
            var delta = step || (max - min) / 100;
            var valueNeedsToBeFlipped = this.adapter_.isRTL() && (keyId === KEY_IDS.ARROW_LEFT || keyId === KEY_IDS.ARROW_RIGHT);
            if (valueNeedsToBeFlipped) {
                delta = -delta;
            }
            switch (keyId) {
                case KEY_IDS.ARROW_LEFT:
                case KEY_IDS.ARROW_DOWN:
                    return this.value_ - delta;
                case KEY_IDS.ARROW_RIGHT:
                case KEY_IDS.ARROW_UP:
                    return this.value_ + delta;
                case KEY_IDS.HOME:
                    return this.min_;
                case KEY_IDS.END:
                    return this.max_;
                case KEY_IDS.PAGE_UP:
                    return this.value_ + delta * numbers.PAGE_FACTOR;
                case KEY_IDS.PAGE_DOWN:
                    return this.value_ - delta * numbers.PAGE_FACTOR;
                default:
                    return NaN;
            }
        };
        MDCSliderFoundation.prototype.handleFocus_ = function () {
            if (this.preventFocusState_) {
                return;
            }
            this.adapter_.addClass(cssClasses$1.FOCUS);
        };
        MDCSliderFoundation.prototype.handleBlur_ = function () {
            this.preventFocusState_ = false;
            this.adapter_.removeClass(cssClasses$1.FOCUS);
        };
        /**
         * Sets the value of the slider
         */
        MDCSliderFoundation.prototype.setValue_ = function (value, shouldFireInput, force) {
            if (force === void 0) { force = false; }
            if (value === this.value_ && !force) {
                return;
            }
            var _a = this, min = _a.min_, max = _a.max_;
            var valueSetToBoundary = value === min || value === max;
            if (this.step_ && !valueSetToBoundary) {
                value = this.quantize_(value);
            }
            if (value < min) {
                value = min;
            }
            else if (value > max) {
                value = max;
            }
            this.value_ = value;
            this.adapter_.setAttribute(strings$1.ARIA_VALUENOW, String(this.value_));
            this.updateUIForCurrentValue_();
            if (shouldFireInput) {
                this.adapter_.notifyInput();
                if (this.isDiscrete_) {
                    this.adapter_.setMarkerValue(value);
                }
            }
        };
        /**
         * Calculates the quantized value
         */
        MDCSliderFoundation.prototype.quantize_ = function (value) {
            var numSteps = Math.round(value / this.step_);
            return numSteps * this.step_;
        };
        MDCSliderFoundation.prototype.updateUIForCurrentValue_ = function () {
            var _this = this;
            var _a = this, max = _a.max_, min = _a.min_, value = _a.value_;
            var pctComplete = (value - min) / (max - min);
            var translatePx = pctComplete * this.rect_.width;
            if (this.adapter_.isRTL()) {
                translatePx = this.rect_.width - translatePx;
            }
            var transformProp = getCorrectPropertyName(window, 'transform');
            var transitionendEvtName = getCorrectEventName(window, 'transitionend');
            if (this.inTransit_) {
                var onTransitionEnd_1 = function () {
                    _this.setInTransit_(false);
                    _this.adapter_.deregisterThumbContainerInteractionHandler(transitionendEvtName, onTransitionEnd_1);
                };
                this.adapter_.registerThumbContainerInteractionHandler(transitionendEvtName, onTransitionEnd_1);
            }
            requestAnimationFrame(function () {
                // NOTE(traviskaufman): It would be nice to use calc() here,
                // but IE cannot handle calcs in transforms correctly.
                // See: https://goo.gl/NC2itk
                // Also note that the -50% offset is used to center the slider thumb.
                _this.adapter_.setThumbContainerStyleProperty(transformProp, "translateX(" + translatePx + "px) translateX(-50%)");
                _this.adapter_.setTrackStyleProperty(transformProp, "scaleX(" + pctComplete + ")");
            });
        };
        /**
         * Toggles the active state of the slider
         */
        MDCSliderFoundation.prototype.setActive_ = function (active) {
            this.active_ = active;
            this.toggleClass_(cssClasses$1.ACTIVE, this.active_);
        };
        /**
         * Toggles the inTransit state of the slider
         */
        MDCSliderFoundation.prototype.setInTransit_ = function (inTransit) {
            this.inTransit_ = inTransit;
            this.toggleClass_(cssClasses$1.IN_TRANSIT, this.inTransit_);
        };
        /**
         * Conditionally adds or removes a class based on shouldBePresent
         */
        MDCSliderFoundation.prototype.toggleClass_ = function (className, shouldBePresent) {
            if (shouldBePresent) {
                this.adapter_.addClass(className);
            }
            else {
                this.adapter_.removeClass(className);
            }
        };
        return MDCSliderFoundation;
    }(MDCFoundation));

    /**
     * @license
     * Copyright 2017 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCSlider = /** @class */ (function (_super) {
        __extends(MDCSlider, _super);
        function MDCSlider() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MDCSlider.attachTo = function (root) {
            return new MDCSlider(root);
        };
        Object.defineProperty(MDCSlider.prototype, "value", {
            get: function () {
                return this.foundation_.getValue();
            },
            set: function (value) {
                this.foundation_.setValue(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCSlider.prototype, "min", {
            get: function () {
                return this.foundation_.getMin();
            },
            set: function (min) {
                this.foundation_.setMin(min);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCSlider.prototype, "max", {
            get: function () {
                return this.foundation_.getMax();
            },
            set: function (max) {
                this.foundation_.setMax(max);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCSlider.prototype, "step", {
            get: function () {
                return this.foundation_.getStep();
            },
            set: function (step) {
                this.foundation_.setStep(step);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCSlider.prototype, "disabled", {
            get: function () {
                return this.foundation_.isDisabled();
            },
            set: function (disabled) {
                this.foundation_.setDisabled(disabled);
            },
            enumerable: true,
            configurable: true
        });
        MDCSlider.prototype.initialize = function () {
            this.thumbContainer_ = this.root_.querySelector(strings$1.THUMB_CONTAINER_SELECTOR);
            this.track_ = this.root_.querySelector(strings$1.TRACK_SELECTOR);
            this.pinValueMarker_ = this.root_.querySelector(strings$1.PIN_VALUE_MARKER_SELECTOR);
            this.trackMarkerContainer_ = this.root_.querySelector(strings$1.TRACK_MARKER_CONTAINER_SELECTOR);
        };
        MDCSlider.prototype.getDefaultFoundation = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
            var adapter = {
                hasClass: function (className) { return _this.root_.classList.contains(className); },
                addClass: function (className) { return _this.root_.classList.add(className); },
                removeClass: function (className) { return _this.root_.classList.remove(className); },
                getAttribute: function (name) { return _this.root_.getAttribute(name); },
                setAttribute: function (name, value) { return _this.root_.setAttribute(name, value); },
                removeAttribute: function (name) { return _this.root_.removeAttribute(name); },
                computeBoundingRect: function () { return _this.root_.getBoundingClientRect(); },
                getTabIndex: function () { return _this.root_.tabIndex; },
                registerInteractionHandler: function (evtType, handler) { return _this.listen(evtType, handler, applyPassive()); },
                deregisterInteractionHandler: function (evtType, handler) { return _this.unlisten(evtType, handler, applyPassive()); },
                registerThumbContainerInteractionHandler: function (evtType, handler) {
                    _this.thumbContainer_.addEventListener(evtType, handler, applyPassive());
                },
                deregisterThumbContainerInteractionHandler: function (evtType, handler) {
                    _this.thumbContainer_.removeEventListener(evtType, handler, applyPassive());
                },
                registerBodyInteractionHandler: function (evtType, handler) { return document.body.addEventListener(evtType, handler); },
                deregisterBodyInteractionHandler: function (evtType, handler) { return document.body.removeEventListener(evtType, handler); },
                registerResizeHandler: function (handler) { return window.addEventListener('resize', handler); },
                deregisterResizeHandler: function (handler) { return window.removeEventListener('resize', handler); },
                notifyInput: function () { return _this.emit(strings$1.INPUT_EVENT, _this); },
                notifyChange: function () { return _this.emit(strings$1.CHANGE_EVENT, _this); },
                setThumbContainerStyleProperty: function (propertyName, value) {
                    _this.thumbContainer_.style.setProperty(propertyName, value);
                },
                setTrackStyleProperty: function (propertyName, value) { return _this.track_.style.setProperty(propertyName, value); },
                setMarkerValue: function (value) { return _this.pinValueMarker_.innerText = value.toLocaleString(); },
                setTrackMarkers: function (step, max, min) {
                    var stepStr = step.toLocaleString();
                    var maxStr = max.toLocaleString();
                    var minStr = min.toLocaleString();
                    // keep calculation in css for better rounding/subpixel behavior
                    var markerAmount = "((" + maxStr + " - " + minStr + ") / " + stepStr + ")";
                    var markerWidth = "2px";
                    var markerBkgdImage = "linear-gradient(to right, currentColor " + markerWidth + ", transparent 0)";
                    var markerBkgdLayout = "0 center / calc((100% - " + markerWidth + ") / " + markerAmount + ") 100% repeat-x";
                    var markerBkgdShorthand = markerBkgdImage + " " + markerBkgdLayout;
                    _this.trackMarkerContainer_.style.setProperty('background', markerBkgdShorthand);
                },
                isRTL: function () { return getComputedStyle(_this.root_).direction === 'rtl'; },
            };
            // tslint:enable:object-literal-sort-keys
            return new MDCSliderFoundation(adapter);
        };
        MDCSlider.prototype.initialSyncWithDOM = function () {
            var origValueNow = this.parseFloat_(this.root_.getAttribute(strings$1.ARIA_VALUENOW), this.value);
            var min = this.parseFloat_(this.root_.getAttribute(strings$1.ARIA_VALUEMIN), this.min);
            var max = this.parseFloat_(this.root_.getAttribute(strings$1.ARIA_VALUEMAX), this.max);
            // min and max need to be set in the right order to avoid throwing an error
            // when the new min is greater than the default max.
            if (min >= this.max) {
                this.max = max;
                this.min = min;
            }
            else {
                this.min = min;
                this.max = max;
            }
            this.step = this.parseFloat_(this.root_.getAttribute(strings$1.STEP_DATA_ATTR), this.step);
            this.value = origValueNow;
            this.disabled = (this.root_.hasAttribute(strings$1.ARIA_DISABLED) &&
                this.root_.getAttribute(strings$1.ARIA_DISABLED) !== 'false');
            this.foundation_.setupTrackMarker();
        };
        MDCSlider.prototype.layout = function () {
            this.foundation_.layout();
        };
        MDCSlider.prototype.stepUp = function (amount) {
            if (amount === void 0) { amount = (this.step || 1); }
            this.value += amount;
        };
        MDCSlider.prototype.stepDown = function (amount) {
            if (amount === void 0) { amount = (this.step || 1); }
            this.value -= amount;
        };
        MDCSlider.prototype.parseFloat_ = function (str, defaultValue) {
            var num = parseFloat(str); // tslint:disable-line:ban
            var isNumeric = typeof num === 'number' && isFinite(num);
            return isNumeric ? num : defaultValue;
        };
        return MDCSlider;
    }(MDCComponent));

    /* node_modules/@smui/slider/Slider.svelte generated by Svelte v3.38.2 */
    const file$7 = "node_modules/@smui/slider/Slider.svelte";

    // (24:4) {#if discrete && displayMarkers}
    function create_if_block_1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "mdc-slider__track-marker-container");
    			add_location(div, file$7, 24, 6, 734);
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(24:4) {#if discrete && displayMarkers}",
    		ctx
    	});

    	return block;
    }

    // (29:4) {#if discrete}
    function create_if_block(ctx) {
    	let div;
    	let span;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			attr_dev(span, "class", "mdc-slider__pin-value-marker");
    			add_location(span, file$7, 30, 8, 915);
    			attr_dev(div, "class", "mdc-slider__pin");
    			add_location(div, file$7, 29, 6, 877);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(29:4) {#if discrete}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div4;
    	let div1;
    	let div0;
    	let t0;
    	let t1;
    	let div3;
    	let t2;
    	let svg;
    	let circle;
    	let t3;
    	let div2;
    	let div4_class_value;
    	let div4_aria_disabled_value;
    	let useActions_action;
    	let mounted;
    	let dispose;
    	let if_block0 = /*discrete*/ ctx[4] && /*displayMarkers*/ ctx[5] && create_if_block_1(ctx);
    	let if_block1 = /*discrete*/ ctx[4] && create_if_block(ctx);

    	let div4_levels = [
    		{
    			class: div4_class_value = "\n    mdc-slider\n    " + /*className*/ ctx[2] + "\n    " + (/*discrete*/ ctx[4] ? "mdc-slider--discrete" : "") + "\n    " + (/*discrete*/ ctx[4] && /*displayMarkers*/ ctx[5]
    			? "mdc-slider--display-markers"
    			: "") + "\n  "
    		},
    		{ role: "slider" },
    		{
    			"aria-disabled": div4_aria_disabled_value = /*disabled*/ ctx[3] ? "true" : "false"
    		},
    		{ "aria-valuemin": /*min*/ ctx[6] },
    		{ "aria-valuemax": /*max*/ ctx[7] },
    		{ "aria-valuenow": /*value*/ ctx[0] },
    		/*step*/ ctx[8] === 0
    		? {}
    		: { "data-step": /*step*/ ctx[8] },
    		{ tabindex: /*tabindex*/ ctx[9] },
    		/*inputProps*/ ctx[13],
    		exclude(/*$$props*/ ctx[15], [
    			"use",
    			"class",
    			"disabled",
    			"discrete",
    			"displayMarkers",
    			"min",
    			"max",
    			"step",
    			"value",
    			"tabindex"
    		])
    	];

    	let div4_data = {};

    	for (let i = 0; i < div4_levels.length; i += 1) {
    		div4_data = assign(div4_data, div4_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			div3 = element("div");
    			if (if_block1) if_block1.c();
    			t2 = space();
    			svg = svg_element("svg");
    			circle = svg_element("circle");
    			t3 = space();
    			div2 = element("div");
    			attr_dev(div0, "class", "mdc-slider__track");
    			add_location(div0, file$7, 22, 4, 653);
    			attr_dev(div1, "class", "mdc-slider__track-container");
    			add_location(div1, file$7, 21, 2, 607);
    			attr_dev(circle, "cx", "10.5");
    			attr_dev(circle, "cy", "10.5");
    			attr_dev(circle, "r", "7.875");
    			add_location(circle, file$7, 34, 6, 1054);
    			attr_dev(svg, "class", "mdc-slider__thumb");
    			attr_dev(svg, "width", "21");
    			attr_dev(svg, "height", "21");
    			add_location(svg, file$7, 33, 4, 993);
    			attr_dev(div2, "class", "mdc-slider__focus-ring");
    			add_location(div2, file$7, 36, 4, 1117);
    			attr_dev(div3, "class", "mdc-slider__thumb-container");
    			add_location(div3, file$7, 27, 2, 810);
    			set_attributes(div4, div4_data);
    			add_location(div4, file$7, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t0);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div4, t1);
    			append_dev(div4, div3);
    			if (if_block1) if_block1.m(div3, null);
    			append_dev(div3, t2);
    			append_dev(div3, svg);
    			append_dev(svg, circle);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			/*div4_binding*/ ctx[22](div4);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(useActions_action = useActions.call(null, div4, /*use*/ ctx[1])),
    					action_destroyer(/*forwardEvents*/ ctx[11].call(null, div4)),
    					listen_dev(div4, "MDCSlider:input", /*handleChange*/ ctx[14], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*discrete*/ ctx[4] && /*displayMarkers*/ ctx[5]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(div1, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*discrete*/ ctx[4]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(div3, t2);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			set_attributes(div4, div4_data = get_spread_update(div4_levels, [
    				dirty & /*className, discrete, displayMarkers*/ 52 && div4_class_value !== (div4_class_value = "\n    mdc-slider\n    " + /*className*/ ctx[2] + "\n    " + (/*discrete*/ ctx[4] ? "mdc-slider--discrete" : "") + "\n    " + (/*discrete*/ ctx[4] && /*displayMarkers*/ ctx[5]
    				? "mdc-slider--display-markers"
    				: "") + "\n  ") && { class: div4_class_value },
    				{ role: "slider" },
    				dirty & /*disabled*/ 8 && div4_aria_disabled_value !== (div4_aria_disabled_value = /*disabled*/ ctx[3] ? "true" : "false") && {
    					"aria-disabled": div4_aria_disabled_value
    				},
    				dirty & /*min*/ 64 && { "aria-valuemin": /*min*/ ctx[6] },
    				dirty & /*max*/ 128 && { "aria-valuemax": /*max*/ ctx[7] },
    				dirty & /*value*/ 1 && { "aria-valuenow": /*value*/ ctx[0] },
    				dirty & /*step*/ 256 && (/*step*/ ctx[8] === 0
    				? {}
    				: { "data-step": /*step*/ ctx[8] }),
    				dirty & /*tabindex*/ 512 && { tabindex: /*tabindex*/ ctx[9] },
    				/*inputProps*/ ctx[13],
    				dirty & /*$$props*/ 32768 && exclude(/*$$props*/ ctx[15], [
    					"use",
    					"class",
    					"disabled",
    					"discrete",
    					"displayMarkers",
    					"min",
    					"max",
    					"step",
    					"value",
    					"tabindex"
    				])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 2) useActions_action.update.call(null, /*use*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			/*div4_binding*/ ctx[22](null);
    			mounted = false;
    			run_all(dispose);
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
    	let $formField;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Slider", slots, []);
    	const forwardEvents = forwardEventsBuilder(get_current_component(), ["MDCSlider:input", "MDCSlider:change"]);
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { disabled = false } = $$props;
    	let { discrete = false } = $$props;
    	let { displayMarkers = false } = $$props;
    	let { min = 0 } = $$props;
    	let { max = 100 } = $$props;
    	let { step = 0 } = $$props;
    	let { value = null } = $$props;
    	let { tabindex = "0" } = $$props;
    	let element;
    	let slider;
    	let formField = getContext("SMUI:form-field");
    	validate_store(formField, "formField");
    	component_subscribe($$self, formField, value => $$invalidate(21, $formField = value));
    	let inputProps = getContext("SMUI:generic:input:props") || {};
    	let addLayoutListener = getContext("SMUI:addLayoutListener");
    	let removeLayoutListener;

    	if (addLayoutListener) {
    		removeLayoutListener = addLayoutListener(layout);
    	}

    	onMount(() => {
    		$$invalidate(20, slider = new MDCSlider(element));
    	});

    	onDestroy(() => {
    		slider && slider.destroy();

    		if (removeLayoutListener) {
    			removeLayoutListener();
    		}
    	});

    	function handleChange() {
    		$$invalidate(0, value = slider.value);
    	}

    	function layout(...args) {
    		return slider.layout(...args);
    	}

    	function stepUp(amount = 1, ...args) {
    		return slider.stepUp(amount, ...args);
    	}

    	function stepDown(amount = 1, ...args) {
    		return slider.stepDown(amount, ...args);
    	}

    	function getId() {
    		return inputProps && inputProps.id;
    	}

    	function div4_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			element = $$value;
    			$$invalidate(10, element);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(15, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(1, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ("disabled" in $$new_props) $$invalidate(3, disabled = $$new_props.disabled);
    		if ("discrete" in $$new_props) $$invalidate(4, discrete = $$new_props.discrete);
    		if ("displayMarkers" in $$new_props) $$invalidate(5, displayMarkers = $$new_props.displayMarkers);
    		if ("min" in $$new_props) $$invalidate(6, min = $$new_props.min);
    		if ("max" in $$new_props) $$invalidate(7, max = $$new_props.max);
    		if ("step" in $$new_props) $$invalidate(8, step = $$new_props.step);
    		if ("value" in $$new_props) $$invalidate(0, value = $$new_props.value);
    		if ("tabindex" in $$new_props) $$invalidate(9, tabindex = $$new_props.tabindex);
    	};

    	$$self.$capture_state = () => ({
    		MDCSlider,
    		onMount,
    		onDestroy,
    		getContext,
    		get_current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		forwardEvents,
    		use,
    		className,
    		disabled,
    		discrete,
    		displayMarkers,
    		min,
    		max,
    		step,
    		value,
    		tabindex,
    		element,
    		slider,
    		formField,
    		inputProps,
    		addLayoutListener,
    		removeLayoutListener,
    		handleChange,
    		layout,
    		stepUp,
    		stepDown,
    		getId,
    		$formField
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(15, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(1, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(2, className = $$new_props.className);
    		if ("disabled" in $$props) $$invalidate(3, disabled = $$new_props.disabled);
    		if ("discrete" in $$props) $$invalidate(4, discrete = $$new_props.discrete);
    		if ("displayMarkers" in $$props) $$invalidate(5, displayMarkers = $$new_props.displayMarkers);
    		if ("min" in $$props) $$invalidate(6, min = $$new_props.min);
    		if ("max" in $$props) $$invalidate(7, max = $$new_props.max);
    		if ("step" in $$props) $$invalidate(8, step = $$new_props.step);
    		if ("value" in $$props) $$invalidate(0, value = $$new_props.value);
    		if ("tabindex" in $$props) $$invalidate(9, tabindex = $$new_props.tabindex);
    		if ("element" in $$props) $$invalidate(10, element = $$new_props.element);
    		if ("slider" in $$props) $$invalidate(20, slider = $$new_props.slider);
    		if ("formField" in $$props) $$invalidate(12, formField = $$new_props.formField);
    		if ("inputProps" in $$props) $$invalidate(13, inputProps = $$new_props.inputProps);
    		if ("addLayoutListener" in $$props) addLayoutListener = $$new_props.addLayoutListener;
    		if ("removeLayoutListener" in $$props) removeLayoutListener = $$new_props.removeLayoutListener;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*slider, disabled*/ 1048584) {
    			if (slider && slider.disabled !== disabled) {
    				$$invalidate(20, slider.disabled = disabled, slider);
    			}
    		}

    		if ($$self.$$.dirty & /*slider, min*/ 1048640) {
    			if (slider && slider.min !== min) {
    				$$invalidate(20, slider.min = min, slider);
    			}
    		}

    		if ($$self.$$.dirty & /*slider, max*/ 1048704) {
    			if (slider && slider.max !== max) {
    				$$invalidate(20, slider.max = max, slider);
    			}
    		}

    		if ($$self.$$.dirty & /*slider, step*/ 1048832) {
    			if (slider && slider.step !== step) {
    				$$invalidate(20, slider.step = step, slider);
    			}
    		}

    		if ($$self.$$.dirty & /*slider, value*/ 1048577) {
    			if (slider && slider.value !== value) {
    				$$invalidate(20, slider.value = value, slider);
    			}
    		}

    		if ($$self.$$.dirty & /*slider, $formField*/ 3145728) {
    			if (slider && $formField && $formField.input !== slider) {
    				set_store_value(formField, $formField.input = slider, $formField);
    			}
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		value,
    		use,
    		className,
    		disabled,
    		discrete,
    		displayMarkers,
    		min,
    		max,
    		step,
    		tabindex,
    		element,
    		forwardEvents,
    		formField,
    		inputProps,
    		handleChange,
    		$$props,
    		layout,
    		stepUp,
    		stepDown,
    		getId,
    		slider,
    		$formField,
    		div4_binding
    	];
    }

    class Slider extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			use: 1,
    			class: 2,
    			disabled: 3,
    			discrete: 4,
    			displayMarkers: 5,
    			min: 6,
    			max: 7,
    			step: 8,
    			value: 0,
    			tabindex: 9,
    			layout: 16,
    			stepUp: 17,
    			stepDown: 18,
    			getId: 19
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Slider",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get use() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get discrete() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set discrete(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get displayMarkers() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set displayMarkers(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get min() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set min(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get max() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get step() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set step(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tabindex() {
    		throw new Error("<Slider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabindex(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get layout() {
    		return this.$$.ctx[16];
    	}

    	set layout(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get stepUp() {
    		return this.$$.ctx[17];
    	}

    	set stepUp(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get stepDown() {
    		return this.$$.ctx[18];
    	}

    	set stepDown(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getId() {
    		return this.$$.ctx[19];
    	}

    	set getId(value) {
    		throw new Error("<Slider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var css_248z$3 = "@keyframes mdc-slider-emphasize {\n  0% {\n    animation-timing-function: ease-out;\n  }\n  50% {\n    animation-timing-function: ease-in;\n    transform: scale(0.85);\n  }\n  100% {\n    transform: scale(0.571);\n  }\n}\n.mdc-slider {\n  position: relative;\n  width: 100%;\n  height: 48px;\n  cursor: pointer;\n  touch-action: pan-x;\n  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);\n}\n.mdc-slider:not(.mdc-slider--disabled) .mdc-slider__track {\n  background-color: #018786;\n  /* @alternate */\n  background-color: var(--mdc-theme-secondary, #018786);\n}\n.mdc-slider:not(.mdc-slider--disabled) .mdc-slider__track-container {\n  background-color: rgba(1, 135, 134, 0.26);\n}\n.mdc-slider:not(.mdc-slider--disabled) .mdc-slider__track-marker-container {\n  background-color: #018786;\n  /* @alternate */\n  background-color: var(--mdc-theme-secondary, #018786);\n}\n.mdc-slider:not(.mdc-slider--disabled) .mdc-slider__thumb {\n  fill: #018786;\n  /* @alternate */\n  fill: var(--mdc-theme-secondary, #018786);\n  stroke: #018786;\n  /* @alternate */\n  stroke: var(--mdc-theme-secondary, #018786);\n}\n.mdc-slider:not(.mdc-slider--disabled) .mdc-slider__focus-ring {\n  background-color: #018786;\n  /* @alternate */\n  background-color: var(--mdc-theme-secondary, #018786);\n}\n.mdc-slider:not(.mdc-slider--disabled) .mdc-slider__pin {\n  background-color: #018786;\n  /* @alternate */\n  background-color: var(--mdc-theme-secondary, #018786);\n}\n.mdc-slider:not(.mdc-slider--disabled) .mdc-slider__pin {\n  color: white;\n  /* @alternate */\n  color: var(--mdc-theme-text-primary-on-dark, white);\n}\n.mdc-slider--disabled {\n  cursor: auto;\n}\n.mdc-slider--disabled .mdc-slider__track {\n  background-color: #9a9a9a;\n}\n.mdc-slider--disabled .mdc-slider__track-container {\n  background-color: rgba(154, 154, 154, 0.26);\n}\n.mdc-slider--disabled .mdc-slider__track-marker-container {\n  background-color: #9a9a9a;\n}\n.mdc-slider--disabled .mdc-slider__thumb {\n  fill: #9a9a9a;\n  stroke: #9a9a9a;\n}\n.mdc-slider--disabled .mdc-slider__thumb {\n  /* @alternate */\n  stroke: white;\n  stroke: var(--mdc-slider-bg-color-behind-component, white);\n}\n.mdc-slider:focus {\n  outline: none;\n}\n.mdc-slider__track-container {\n  position: absolute;\n  top: 50%;\n  width: 100%;\n  height: 2px;\n  overflow: hidden;\n}\n.mdc-slider__track {\n  position: absolute;\n  width: 100%;\n  height: 100%;\n  transform-origin: left top;\n  will-change: transform;\n}\n.mdc-slider[dir=rtl] .mdc-slider__track, [dir=rtl] .mdc-slider .mdc-slider__track {\n  transform-origin: right top;\n}\n\n.mdc-slider__track-marker-container {\n  display: flex;\n  margin-right: 0;\n  margin-left: -1px;\n  visibility: hidden;\n}\n.mdc-slider[dir=rtl] .mdc-slider__track-marker-container, [dir=rtl] .mdc-slider .mdc-slider__track-marker-container {\n  margin-right: -1px;\n  margin-left: 0;\n}\n\n.mdc-slider__track-marker-container::after {\n  display: block;\n  width: 2px;\n  height: 2px;\n  content: \"\";\n}\n.mdc-slider__track-marker {\n  flex: 1;\n}\n.mdc-slider__track-marker::after {\n  display: block;\n  width: 2px;\n  height: 2px;\n  content: \"\";\n}\n.mdc-slider__track-marker:first-child::after {\n  width: 3px;\n}\n.mdc-slider__thumb-container {\n  position: absolute;\n  top: 15px;\n  left: 0;\n  width: 21px;\n  height: 100%;\n  user-select: none;\n  will-change: transform;\n}\n.mdc-slider__thumb {\n  position: absolute;\n  top: 0;\n  left: 0;\n  transform: scale(0.571);\n  stroke-width: 3.5;\n  transition: transform 100ms ease-out, fill 100ms ease-out, stroke 100ms ease-out;\n}\n.mdc-slider__focus-ring {\n  width: 21px;\n  height: 21px;\n  border-radius: 50%;\n  opacity: 0;\n  transition: transform 266.67ms ease-out, opacity 266.67ms ease-out, background-color 266.67ms ease-out;\n}\n.mdc-slider__pin {\n  display: flex;\n  position: absolute;\n  top: 0;\n  left: 0;\n  align-items: center;\n  justify-content: center;\n  width: 26px;\n  height: 26px;\n  margin-top: -2px;\n  margin-left: -2px;\n  transform: rotate(-45deg) scale(0) translate(0, 0);\n  border-radius: 50% 50% 50% 0%;\n  z-index: 1;\n  transition: transform 100ms ease-out;\n}\n.mdc-slider__pin-value-marker {\n  font-family: Roboto, sans-serif;\n  -moz-osx-font-smoothing: grayscale;\n  -webkit-font-smoothing: antialiased;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n  font-weight: 400;\n  letter-spacing: 0.0178571429em;\n  text-decoration: inherit;\n  text-transform: inherit;\n  transform: rotate(45deg);\n}\n\n.mdc-slider--active .mdc-slider__thumb {\n  transform: scale3d(1, 1, 1);\n}\n\n.mdc-slider--focus .mdc-slider__thumb {\n  animation: mdc-slider-emphasize 266.67ms linear;\n}\n.mdc-slider--focus .mdc-slider__focus-ring {\n  transform: scale3d(1.55, 1.55, 1.55);\n  opacity: 0.25;\n}\n\n.mdc-slider--in-transit .mdc-slider__thumb {\n  transition-delay: 140ms;\n}\n\n.mdc-slider--in-transit .mdc-slider__thumb-container,\n.mdc-slider--in-transit .mdc-slider__track,\n.mdc-slider:focus:not(.mdc-slider--active) .mdc-slider__thumb-container,\n.mdc-slider:focus:not(.mdc-slider--active) .mdc-slider__track {\n  transition: transform 80ms ease;\n}\n\n.mdc-slider--discrete.mdc-slider--active .mdc-slider__thumb {\n  transform: scale(calc(12 / 21));\n}\n.mdc-slider--discrete.mdc-slider--active .mdc-slider__pin {\n  transform: rotate(-45deg) scale(1) translate(19px, -20px);\n}\n.mdc-slider--discrete.mdc-slider--focus .mdc-slider__thumb {\n  animation: none;\n}\n.mdc-slider--discrete.mdc-slider--display-markers .mdc-slider__track-marker-container {\n  visibility: visible;\n}\n";
    styleInject(css_248z$3);

    /**
     * @license
     * Copyright 2017 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses = {
        ROOT: 'mdc-form-field',
    };
    var strings = {
        LABEL_SELECTOR: '.mdc-form-field > label',
    };

    /**
     * @license
     * Copyright 2017 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCFormFieldFoundation = /** @class */ (function (_super) {
        __extends(MDCFormFieldFoundation, _super);
        function MDCFormFieldFoundation(adapter) {
            var _this = _super.call(this, __assign({}, MDCFormFieldFoundation.defaultAdapter, adapter)) || this;
            _this.clickHandler_ = function () { return _this.handleClick_(); };
            return _this;
        }
        Object.defineProperty(MDCFormFieldFoundation, "cssClasses", {
            get: function () {
                return cssClasses;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCFormFieldFoundation, "strings", {
            get: function () {
                return strings;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCFormFieldFoundation, "defaultAdapter", {
            get: function () {
                return {
                    activateInputRipple: function () { return undefined; },
                    deactivateInputRipple: function () { return undefined; },
                    deregisterInteractionHandler: function () { return undefined; },
                    registerInteractionHandler: function () { return undefined; },
                };
            },
            enumerable: true,
            configurable: true
        });
        MDCFormFieldFoundation.prototype.init = function () {
            this.adapter_.registerInteractionHandler('click', this.clickHandler_);
        };
        MDCFormFieldFoundation.prototype.destroy = function () {
            this.adapter_.deregisterInteractionHandler('click', this.clickHandler_);
        };
        MDCFormFieldFoundation.prototype.handleClick_ = function () {
            var _this = this;
            this.adapter_.activateInputRipple();
            requestAnimationFrame(function () { return _this.adapter_.deactivateInputRipple(); });
        };
        return MDCFormFieldFoundation;
    }(MDCFoundation));

    /**
     * @license
     * Copyright 2017 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCFormField = /** @class */ (function (_super) {
        __extends(MDCFormField, _super);
        function MDCFormField() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MDCFormField.attachTo = function (root) {
            return new MDCFormField(root);
        };
        Object.defineProperty(MDCFormField.prototype, "input", {
            get: function () {
                return this.input_;
            },
            set: function (input) {
                this.input_ = input;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCFormField.prototype, "label_", {
            get: function () {
                var LABEL_SELECTOR = MDCFormFieldFoundation.strings.LABEL_SELECTOR;
                return this.root_.querySelector(LABEL_SELECTOR);
            },
            enumerable: true,
            configurable: true
        });
        MDCFormField.prototype.getDefaultFoundation = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            var adapter = {
                activateInputRipple: function () {
                    if (_this.input_ && _this.input_.ripple) {
                        _this.input_.ripple.activate();
                    }
                },
                deactivateInputRipple: function () {
                    if (_this.input_ && _this.input_.ripple) {
                        _this.input_.ripple.deactivate();
                    }
                },
                deregisterInteractionHandler: function (evtType, handler) {
                    if (_this.label_) {
                        _this.label_.removeEventListener(evtType, handler);
                    }
                },
                registerInteractionHandler: function (evtType, handler) {
                    if (_this.label_) {
                        _this.label_.addEventListener(evtType, handler);
                    }
                },
            };
            return new MDCFormFieldFoundation(adapter);
        };
        return MDCFormField;
    }(MDCComponent));

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

    function prefixFilter(obj, prefix) {
      let names = Object.getOwnPropertyNames(obj);
      const newObj = {};

      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        if (name.substring(0, prefix.length) === prefix) {
          newObj[name.substring(prefix.length)] = obj[name];
        }
      }

      return newObj;
    }

    /* node_modules/@smui/form-field/FormField.svelte generated by Svelte v3.38.2 */
    const file$6 = "node_modules/@smui/form-field/FormField.svelte";
    const get_label_slot_changes = dirty => ({});
    const get_label_slot_context = ctx => ({});

    function create_fragment$7(ctx) {
    	let div;
    	let t;
    	let label;
    	let useActions_action;
    	let div_class_value;
    	let useActions_action_1;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[11].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], null);
    	const label_slot_template = /*#slots*/ ctx[11].label;
    	const label_slot = create_slot(label_slot_template, ctx, /*$$scope*/ ctx[10], get_label_slot_context);

    	let label_levels = [
    		{ for: /*inputId*/ ctx[3] },
    		exclude(prefixFilter(/*$$props*/ ctx[8], "label$"), ["use"])
    	];

    	let label_data = {};

    	for (let i = 0; i < label_levels.length; i += 1) {
    		label_data = assign(label_data, label_levels[i]);
    	}

    	let div_levels = [
    		{
    			class: div_class_value = "\n    mdc-form-field\n    " + /*className*/ ctx[1] + "\n    " + (/*align*/ ctx[2] === "end"
    			? "mdc-form-field--align-end"
    			: "") + "\n  "
    		},
    		exclude(/*$$props*/ ctx[8], ["use", "class", "alignEnd", "inputId", "label$"])
    	];

    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			t = space();
    			label = element("label");
    			if (label_slot) label_slot.c();
    			set_attributes(label, label_data);
    			add_location(label, file$6, 12, 2, 271);
    			set_attributes(div, div_data);
    			add_location(div, file$6, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			append_dev(div, t);
    			append_dev(div, label);

    			if (label_slot) {
    				label_slot.m(label, null);
    			}

    			/*div_binding*/ ctx[12](div);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(useActions_action = useActions.call(null, label, /*label$use*/ ctx[4])),
    					action_destroyer(useActions_action_1 = useActions.call(null, div, /*use*/ ctx[0])),
    					action_destroyer(/*forwardEvents*/ ctx[6].call(null, div))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1024)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[10], dirty, null, null);
    				}
    			}

    			if (label_slot) {
    				if (label_slot.p && (!current || dirty & /*$$scope*/ 1024)) {
    					update_slot(label_slot, label_slot_template, ctx, /*$$scope*/ ctx[10], dirty, get_label_slot_changes, get_label_slot_context);
    				}
    			}

    			set_attributes(label, label_data = get_spread_update(label_levels, [
    				(!current || dirty & /*inputId*/ 8) && { for: /*inputId*/ ctx[3] },
    				dirty & /*$$props*/ 256 && exclude(prefixFilter(/*$$props*/ ctx[8], "label$"), ["use"])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*label$use*/ 16) useActions_action.update.call(null, /*label$use*/ ctx[4]);

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				(!current || dirty & /*className, align*/ 6 && div_class_value !== (div_class_value = "\n    mdc-form-field\n    " + /*className*/ ctx[1] + "\n    " + (/*align*/ ctx[2] === "end"
    				? "mdc-form-field--align-end"
    				: "") + "\n  ")) && { class: div_class_value },
    				dirty & /*$$props*/ 256 && exclude(/*$$props*/ ctx[8], ["use", "class", "alignEnd", "inputId", "label$"])
    			]));

    			if (useActions_action_1 && is_function(useActions_action_1.update) && dirty & /*use*/ 1) useActions_action_1.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			transition_in(label_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			transition_out(label_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			if (label_slot) label_slot.d(detaching);
    			/*div_binding*/ ctx[12](null);
    			mounted = false;
    			run_all(dispose);
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

    let counter = 0;

    function instance$7($$self, $$props, $$invalidate) {
    	let $formFieldStore;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FormField", slots, ['default','label']);
    	const forwardEvents = forwardEventsBuilder(get_current_component());
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { align = "start" } = $$props;
    	let { inputId = "SMUI-form-field-" + counter++ } = $$props;
    	let { label$use = [] } = $$props;
    	let element;
    	let formField;
    	let formFieldStore = writable(formField);
    	validate_store(formFieldStore, "formFieldStore");
    	component_subscribe($$self, formFieldStore, value => $$invalidate(13, $formFieldStore = value));
    	setContext("SMUI:form-field", formFieldStore);
    	setContext("SMUI:generic:input:props", { id: inputId });

    	onMount(() => {
    		$$invalidate(9, formField = new MDCFormField(element));
    	});

    	onDestroy(() => {
    		formField && formField.destroy();
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			element = $$value;
    			$$invalidate(5, element);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(8, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("align" in $$new_props) $$invalidate(2, align = $$new_props.align);
    		if ("inputId" in $$new_props) $$invalidate(3, inputId = $$new_props.inputId);
    		if ("label$use" in $$new_props) $$invalidate(4, label$use = $$new_props.label$use);
    		if ("$$scope" in $$new_props) $$invalidate(10, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		counter,
    		MDCFormField,
    		onMount,
    		onDestroy,
    		setContext,
    		writable,
    		get_current_component,
    		forwardEventsBuilder,
    		exclude,
    		prefixFilter,
    		useActions,
    		forwardEvents,
    		use,
    		className,
    		align,
    		inputId,
    		label$use,
    		element,
    		formField,
    		formFieldStore,
    		$formFieldStore
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(8, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    		if ("align" in $$props) $$invalidate(2, align = $$new_props.align);
    		if ("inputId" in $$props) $$invalidate(3, inputId = $$new_props.inputId);
    		if ("label$use" in $$props) $$invalidate(4, label$use = $$new_props.label$use);
    		if ("element" in $$props) $$invalidate(5, element = $$new_props.element);
    		if ("formField" in $$props) $$invalidate(9, formField = $$new_props.formField);
    		if ("formFieldStore" in $$props) $$invalidate(7, formFieldStore = $$new_props.formFieldStore);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*formField*/ 512) {
    			set_store_value(formFieldStore, $formFieldStore = formField, $formFieldStore);
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		use,
    		className,
    		align,
    		inputId,
    		label$use,
    		element,
    		forwardEvents,
    		formFieldStore,
    		$$props,
    		formField,
    		$$scope,
    		slots,
    		div_binding
    	];
    }

    class FormField extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			use: 0,
    			class: 1,
    			align: 2,
    			inputId: 3,
    			label$use: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FormField",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get use() {
    		throw new Error("<FormField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<FormField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<FormField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<FormField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get align() {
    		throw new Error("<FormField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set align(value) {
    		throw new Error("<FormField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inputId() {
    		throw new Error("<FormField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inputId(value) {
    		throw new Error("<FormField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label$use() {
    		throw new Error("<FormField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label$use(value) {
    		throw new Error("<FormField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@smui/paper/Paper.svelte generated by Svelte v3.38.2 */
    const file$5 = "node_modules/@smui/paper/Paper.svelte";

    function create_fragment$6(ctx) {
    	let div;
    	let div_class_value;
    	let useActions_action;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);

    	let div_levels = [
    		{
    			class: div_class_value = "\n    smui-paper\n    " + /*className*/ ctx[1] + "\n    " + (/*elevation*/ ctx[4] !== 0
    			? "mdc-elevation--z" + /*elevation*/ ctx[4]
    			: "") + "\n    " + (!/*square*/ ctx[2] ? "smui-paper--rounded" : "") + "\n    " + (/*color*/ ctx[3] === "primary"
    			? "smui-paper--color-primary"
    			: "") + "\n    " + (/*color*/ ctx[3] === "secondary"
    			? "smui-paper--color-secondary"
    			: "") + "\n    " + (/*transition*/ ctx[5] ? "mdc-elevation-transition" : "") + "\n  "
    		},
    		exclude(/*$$props*/ ctx[7], ["use", "class", "square", "color", "transition"])
    	];

    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(useActions_action = useActions.call(null, div, /*use*/ ctx[0])),
    					action_destroyer(/*forwardEvents*/ ctx[6].call(null, div))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 256)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				(!current || dirty & /*className, elevation, square, color, transition*/ 62 && div_class_value !== (div_class_value = "\n    smui-paper\n    " + /*className*/ ctx[1] + "\n    " + (/*elevation*/ ctx[4] !== 0
    				? "mdc-elevation--z" + /*elevation*/ ctx[4]
    				: "") + "\n    " + (!/*square*/ ctx[2] ? "smui-paper--rounded" : "") + "\n    " + (/*color*/ ctx[3] === "primary"
    				? "smui-paper--color-primary"
    				: "") + "\n    " + (/*color*/ ctx[3] === "secondary"
    				? "smui-paper--color-secondary"
    				: "") + "\n    " + (/*transition*/ ctx[5] ? "mdc-elevation-transition" : "") + "\n  ")) && { class: div_class_value },
    				dirty & /*$$props*/ 128 && exclude(/*$$props*/ ctx[7], ["use", "class", "square", "color", "transition"])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
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
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Paper", slots, ['default']);
    	const forwardEvents = forwardEventsBuilder(get_current_component());
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { square = false } = $$props;
    	let { color = "default" } = $$props;
    	let { elevation = 1 } = $$props;
    	let { transition = false } = $$props;

    	$$self.$$set = $$new_props => {
    		$$invalidate(7, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("square" in $$new_props) $$invalidate(2, square = $$new_props.square);
    		if ("color" in $$new_props) $$invalidate(3, color = $$new_props.color);
    		if ("elevation" in $$new_props) $$invalidate(4, elevation = $$new_props.elevation);
    		if ("transition" in $$new_props) $$invalidate(5, transition = $$new_props.transition);
    		if ("$$scope" in $$new_props) $$invalidate(8, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		afterUpdate,
    		setContext,
    		get_current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		forwardEvents,
    		use,
    		className,
    		square,
    		color,
    		elevation,
    		transition
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(7, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    		if ("square" in $$props) $$invalidate(2, square = $$new_props.square);
    		if ("color" in $$props) $$invalidate(3, color = $$new_props.color);
    		if ("elevation" in $$props) $$invalidate(4, elevation = $$new_props.elevation);
    		if ("transition" in $$props) $$invalidate(5, transition = $$new_props.transition);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);

    	return [
    		use,
    		className,
    		square,
    		color,
    		elevation,
    		transition,
    		forwardEvents,
    		$$props,
    		$$scope,
    		slots
    	];
    }

    class Paper extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			use: 0,
    			class: 1,
    			square: 2,
    			color: 3,
    			elevation: 4,
    			transition: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Paper",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get use() {
    		throw new Error("<Paper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Paper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Paper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Paper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get square() {
    		throw new Error("<Paper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set square(value) {
    		throw new Error("<Paper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Paper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Paper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get elevation() {
    		throw new Error("<Paper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set elevation(value) {
    		throw new Error("<Paper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get transition() {
    		throw new Error("<Paper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transition(value) {
    		throw new Error("<Paper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@smui/common/ClassAdder.svelte generated by Svelte v3.38.2 */

    // (1:0) <svelte:component   this={component}   use={[forwardEvents, ...use]}   class="{smuiClass} {className}"   {...exclude($$props, ['use', 'class', 'component', 'forwardEvents'])} >
    function create_default_slot$1(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 256)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, null, null);
    				}
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
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(1:0) <svelte:component   this={component}   use={[forwardEvents, ...use]}   class=\\\"{smuiClass} {className}\\\"   {...exclude($$props, ['use', 'class', 'component', 'forwardEvents'])} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{
    			use: [/*forwardEvents*/ ctx[4], .../*use*/ ctx[0]]
    		},
    		{
    			class: "" + (/*smuiClass*/ ctx[3] + " " + /*className*/ ctx[1])
    		},
    		exclude(/*$$props*/ ctx[5], ["use", "class", "component", "forwardEvents"])
    	];

    	var switch_value = /*component*/ ctx[2];

    	function switch_props(ctx) {
    		let switch_instance_props = {
    			$$slots: { default: [create_default_slot$1] },
    			$$scope: { ctx }
    		};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const switch_instance_changes = (dirty & /*forwardEvents, use, smuiClass, className, exclude, $$props*/ 59)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*forwardEvents, use*/ 17 && {
    						use: [/*forwardEvents*/ ctx[4], .../*use*/ ctx[0]]
    					},
    					dirty & /*smuiClass, className*/ 10 && {
    						class: "" + (/*smuiClass*/ ctx[3] + " " + /*className*/ ctx[1])
    					},
    					dirty & /*exclude, $$props*/ 32 && get_spread_object(exclude(/*$$props*/ ctx[5], ["use", "class", "component", "forwardEvents"]))
    				])
    			: {};

    			if (dirty & /*$$scope*/ 256) {
    				switch_instance_changes.$$scope = { dirty, ctx };
    			}

    			if (switch_value !== (switch_value = /*component*/ ctx[2])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
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

    const internals = {
    	component: null,
    	smuiClass: null,
    	contexts: {}
    };

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ClassAdder", slots, ['default']);
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { component = internals.component } = $$props;
    	let { forwardEvents: forwardEventsAdditional = [] } = $$props;
    	const smuiClass = internals.class;
    	const contexts = internals.contexts;
    	const forwardEvents = forwardEventsBuilder(get_current_component(), forwardEventsAdditional);

    	for (let context in contexts) {
    		if (contexts.hasOwnProperty(context)) {
    			setContext(context, contexts[context]);
    		}
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(5, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("component" in $$new_props) $$invalidate(2, component = $$new_props.component);
    		if ("forwardEvents" in $$new_props) $$invalidate(6, forwardEventsAdditional = $$new_props.forwardEvents);
    		if ("$$scope" in $$new_props) $$invalidate(8, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		internals,
    		setContext,
    		get_current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		use,
    		className,
    		component,
    		forwardEventsAdditional,
    		smuiClass,
    		contexts,
    		forwardEvents
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(5, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    		if ("component" in $$props) $$invalidate(2, component = $$new_props.component);
    		if ("forwardEventsAdditional" in $$props) $$invalidate(6, forwardEventsAdditional = $$new_props.forwardEventsAdditional);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);

    	return [
    		use,
    		className,
    		component,
    		smuiClass,
    		forwardEvents,
    		$$props,
    		forwardEventsAdditional,
    		slots,
    		$$scope
    	];
    }

    class ClassAdder extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			use: 0,
    			class: 1,
    			component: 2,
    			forwardEvents: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ClassAdder",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get use() {
    		throw new Error("<ClassAdder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<ClassAdder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<ClassAdder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<ClassAdder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get component() {
    		throw new Error("<ClassAdder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set component(value) {
    		throw new Error("<ClassAdder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get forwardEvents() {
    		throw new Error("<ClassAdder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set forwardEvents(value) {
    		throw new Error("<ClassAdder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function classAdderBuilder(props) {
      function Component(...args) {
        Object.assign(internals, props);
        return new ClassAdder(...args);
      }

      Component.prototype = ClassAdder;

      // SSR support
      if (ClassAdder.$$render) {
        Component.$$render = (...args) => Object.assign(internals, props) && ClassAdder.$$render(...args);
      }
      if (ClassAdder.render) {
        Component.render = (...args) => Object.assign(internals, props) && ClassAdder.render(...args);
      }

      return Component;
    }

    /* node_modules/@smui/common/Div.svelte generated by Svelte v3.38.2 */
    const file$4 = "node_modules/@smui/common/Div.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let useActions_action;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);
    	let div_levels = [exclude(/*$$props*/ ctx[3], ["element", "use", "forwardEvents"])];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			/*div_binding*/ ctx[7](div);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(useActions_action = useActions.call(null, div, /*use*/ ctx[1])),
    					action_destroyer(/*forwardEvents*/ ctx[2].call(null, div))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 32)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[5], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$props*/ 8 && exclude(/*$$props*/ ctx[3], ["element", "use", "forwardEvents"])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 2) useActions_action.update.call(null, /*use*/ ctx[1]);
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
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			/*div_binding*/ ctx[7](null);
    			mounted = false;
    			run_all(dispose);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Div", slots, ['default']);
    	let { element = null } = $$props;
    	let { use = [] } = $$props;
    	let { forwardEvents: forwardEventsAdditional = [] } = $$props;
    	const forwardEvents = forwardEventsBuilder(get_current_component(), forwardEventsAdditional);

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			element = $$value;
    			$$invalidate(0, element);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(3, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("element" in $$new_props) $$invalidate(0, element = $$new_props.element);
    		if ("use" in $$new_props) $$invalidate(1, use = $$new_props.use);
    		if ("forwardEvents" in $$new_props) $$invalidate(4, forwardEventsAdditional = $$new_props.forwardEvents);
    		if ("$$scope" in $$new_props) $$invalidate(5, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		get_current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		element,
    		use,
    		forwardEventsAdditional,
    		forwardEvents
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(3, $$props = assign(assign({}, $$props), $$new_props));
    		if ("element" in $$props) $$invalidate(0, element = $$new_props.element);
    		if ("use" in $$props) $$invalidate(1, use = $$new_props.use);
    		if ("forwardEventsAdditional" in $$props) $$invalidate(4, forwardEventsAdditional = $$new_props.forwardEventsAdditional);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);

    	return [
    		element,
    		use,
    		forwardEvents,
    		$$props,
    		forwardEventsAdditional,
    		$$scope,
    		slots,
    		div_binding
    	];
    }

    class Div extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { element: 0, use: 1, forwardEvents: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Div",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get element() {
    		throw new Error("<Div>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set element(value) {
    		throw new Error("<Div>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get use() {
    		throw new Error("<Div>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Div>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get forwardEvents() {
    		throw new Error("<Div>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set forwardEvents(value) {
    		throw new Error("<Div>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Content = classAdderBuilder({
      class: 'smui-paper__content',
      component: Div,
      contexts: {}
    });

    /* node_modules/@smui/common/H5.svelte generated by Svelte v3.38.2 */
    const file$3 = "node_modules/@smui/common/H5.svelte";

    function create_fragment$3(ctx) {
    	let h5;
    	let useActions_action;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);
    	let h5_levels = [exclude(/*$$props*/ ctx[3], ["element", "use", "forwardEvents"])];
    	let h5_data = {};

    	for (let i = 0; i < h5_levels.length; i += 1) {
    		h5_data = assign(h5_data, h5_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			if (default_slot) default_slot.c();
    			set_attributes(h5, h5_data);
    			add_location(h5, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);

    			if (default_slot) {
    				default_slot.m(h5, null);
    			}

    			/*h5_binding*/ ctx[7](h5);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(useActions_action = useActions.call(null, h5, /*use*/ ctx[1])),
    					action_destroyer(/*forwardEvents*/ ctx[2].call(null, h5))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 32)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[5], dirty, null, null);
    				}
    			}

    			set_attributes(h5, h5_data = get_spread_update(h5_levels, [
    				dirty & /*$$props*/ 8 && exclude(/*$$props*/ ctx[3], ["element", "use", "forwardEvents"])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 2) useActions_action.update.call(null, /*use*/ ctx[1]);
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
    			if (detaching) detach_dev(h5);
    			if (default_slot) default_slot.d(detaching);
    			/*h5_binding*/ ctx[7](null);
    			mounted = false;
    			run_all(dispose);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("H5", slots, ['default']);
    	let { element = null } = $$props;
    	let { use = [] } = $$props;
    	let { forwardEvents: forwardEventsAdditional = [] } = $$props;
    	const forwardEvents = forwardEventsBuilder(get_current_component(), forwardEventsAdditional);

    	function h5_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			element = $$value;
    			$$invalidate(0, element);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(3, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("element" in $$new_props) $$invalidate(0, element = $$new_props.element);
    		if ("use" in $$new_props) $$invalidate(1, use = $$new_props.use);
    		if ("forwardEvents" in $$new_props) $$invalidate(4, forwardEventsAdditional = $$new_props.forwardEvents);
    		if ("$$scope" in $$new_props) $$invalidate(5, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		get_current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		element,
    		use,
    		forwardEventsAdditional,
    		forwardEvents
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(3, $$props = assign(assign({}, $$props), $$new_props));
    		if ("element" in $$props) $$invalidate(0, element = $$new_props.element);
    		if ("use" in $$props) $$invalidate(1, use = $$new_props.use);
    		if ("forwardEventsAdditional" in $$props) $$invalidate(4, forwardEventsAdditional = $$new_props.forwardEventsAdditional);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);

    	return [
    		element,
    		use,
    		forwardEvents,
    		$$props,
    		forwardEventsAdditional,
    		$$scope,
    		slots,
    		h5_binding
    	];
    }

    class H5 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { element: 0, use: 1, forwardEvents: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "H5",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get element() {
    		throw new Error("<H5>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set element(value) {
    		throw new Error("<H5>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get use() {
    		throw new Error("<H5>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<H5>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get forwardEvents() {
    		throw new Error("<H5>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set forwardEvents(value) {
    		throw new Error("<H5>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Title = classAdderBuilder({
      class: 'smui-paper__title',
      component: H5,
      contexts: {}
    });

    /* node_modules/@smui/common/H6.svelte generated by Svelte v3.38.2 */
    const file$2 = "node_modules/@smui/common/H6.svelte";

    function create_fragment$2(ctx) {
    	let h6;
    	let useActions_action;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);
    	let h6_levels = [exclude(/*$$props*/ ctx[3], ["element", "use", "forwardEvents"])];
    	let h6_data = {};

    	for (let i = 0; i < h6_levels.length; i += 1) {
    		h6_data = assign(h6_data, h6_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			h6 = element("h6");
    			if (default_slot) default_slot.c();
    			set_attributes(h6, h6_data);
    			add_location(h6, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h6, anchor);

    			if (default_slot) {
    				default_slot.m(h6, null);
    			}

    			/*h6_binding*/ ctx[7](h6);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(useActions_action = useActions.call(null, h6, /*use*/ ctx[1])),
    					action_destroyer(/*forwardEvents*/ ctx[2].call(null, h6))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 32)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[5], dirty, null, null);
    				}
    			}

    			set_attributes(h6, h6_data = get_spread_update(h6_levels, [
    				dirty & /*$$props*/ 8 && exclude(/*$$props*/ ctx[3], ["element", "use", "forwardEvents"])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 2) useActions_action.update.call(null, /*use*/ ctx[1]);
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
    			if (detaching) detach_dev(h6);
    			if (default_slot) default_slot.d(detaching);
    			/*h6_binding*/ ctx[7](null);
    			mounted = false;
    			run_all(dispose);
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

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("H6", slots, ['default']);
    	let { element = null } = $$props;
    	let { use = [] } = $$props;
    	let { forwardEvents: forwardEventsAdditional = [] } = $$props;
    	const forwardEvents = forwardEventsBuilder(get_current_component(), forwardEventsAdditional);

    	function h6_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			element = $$value;
    			$$invalidate(0, element);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(3, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("element" in $$new_props) $$invalidate(0, element = $$new_props.element);
    		if ("use" in $$new_props) $$invalidate(1, use = $$new_props.use);
    		if ("forwardEvents" in $$new_props) $$invalidate(4, forwardEventsAdditional = $$new_props.forwardEvents);
    		if ("$$scope" in $$new_props) $$invalidate(5, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		get_current_component,
    		forwardEventsBuilder,
    		exclude,
    		useActions,
    		element,
    		use,
    		forwardEventsAdditional,
    		forwardEvents
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(3, $$props = assign(assign({}, $$props), $$new_props));
    		if ("element" in $$props) $$invalidate(0, element = $$new_props.element);
    		if ("use" in $$props) $$invalidate(1, use = $$new_props.use);
    		if ("forwardEventsAdditional" in $$props) $$invalidate(4, forwardEventsAdditional = $$new_props.forwardEventsAdditional);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);

    	return [
    		element,
    		use,
    		forwardEvents,
    		$$props,
    		forwardEventsAdditional,
    		$$scope,
    		slots,
    		h6_binding
    	];
    }

    class H6 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { element: 0, use: 1, forwardEvents: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "H6",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get element() {
    		throw new Error("<H6>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set element(value) {
    		throw new Error("<H6>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get use() {
    		throw new Error("<H6>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<H6>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get forwardEvents() {
    		throw new Error("<H6>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set forwardEvents(value) {
    		throw new Error("<H6>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Subtitle = classAdderBuilder({
      class: 'smui-paper__subtitle',
      component: H6,
      contexts: {}
    });

    var css_248z$2 = ".mdc-elevation--z0 {\n  box-shadow: 0px 0px 0px 0px rgba(0, 0, 0, 0.2), 0px 0px 0px 0px rgba(0, 0, 0, 0.14), 0px 0px 0px 0px rgba(0, 0, 0, 0.12);\n}\n\n.mdc-elevation--z1 {\n  box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12);\n}\n\n.mdc-elevation--z2 {\n  box-shadow: 0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12);\n}\n\n.mdc-elevation--z3 {\n  box-shadow: 0px 3px 3px -2px rgba(0, 0, 0, 0.2), 0px 3px 4px 0px rgba(0, 0, 0, 0.14), 0px 1px 8px 0px rgba(0, 0, 0, 0.12);\n}\n\n.mdc-elevation--z4 {\n  box-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 0.2), 0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0, 0, 0, 0.12);\n}\n\n.mdc-elevation--z5 {\n  box-shadow: 0px 3px 5px -1px rgba(0, 0, 0, 0.2), 0px 5px 8px 0px rgba(0, 0, 0, 0.14), 0px 1px 14px 0px rgba(0, 0, 0, 0.12);\n}\n\n.mdc-elevation--z6 {\n  box-shadow: 0px 3px 5px -1px rgba(0, 0, 0, 0.2), 0px 6px 10px 0px rgba(0, 0, 0, 0.14), 0px 1px 18px 0px rgba(0, 0, 0, 0.12);\n}\n\n.mdc-elevation--z7 {\n  box-shadow: 0px 4px 5px -2px rgba(0, 0, 0, 0.2), 0px 7px 10px 1px rgba(0, 0, 0, 0.14), 0px 2px 16px 1px rgba(0, 0, 0, 0.12);\n}\n\n.mdc-elevation--z8 {\n  box-shadow: 0px 5px 5px -3px rgba(0, 0, 0, 0.2), 0px 8px 10px 1px rgba(0, 0, 0, 0.14), 0px 3px 14px 2px rgba(0, 0, 0, 0.12);\n}\n\n.mdc-elevation--z9 {\n  box-shadow: 0px 5px 6px -3px rgba(0, 0, 0, 0.2), 0px 9px 12px 1px rgba(0, 0, 0, 0.14), 0px 3px 16px 2px rgba(0, 0, 0, 0.12);\n}\n\n.mdc-elevation--z10 {\n  box-shadow: 0px 6px 6px -3px rgba(0, 0, 0, 0.2), 0px 10px 14px 1px rgba(0, 0, 0, 0.14), 0px 4px 18px 3px rgba(0, 0, 0, 0.12);\n}\n\n.mdc-elevation--z11 {\n  box-shadow: 0px 6px 7px -4px rgba(0, 0, 0, 0.2), 0px 11px 15px 1px rgba(0, 0, 0, 0.14), 0px 4px 20px 3px rgba(0, 0, 0, 0.12);\n}\n\n.mdc-elevation--z12 {\n  box-shadow: 0px 7px 8px -4px rgba(0, 0, 0, 0.2), 0px 12px 17px 2px rgba(0, 0, 0, 0.14), 0px 5px 22px 4px rgba(0, 0, 0, 0.12);\n}\n\n.mdc-elevation--z13 {\n  box-shadow: 0px 7px 8px -4px rgba(0, 0, 0, 0.2), 0px 13px 19px 2px rgba(0, 0, 0, 0.14), 0px 5px 24px 4px rgba(0, 0, 0, 0.12);\n}\n\n.mdc-elevation--z14 {\n  box-shadow: 0px 7px 9px -4px rgba(0, 0, 0, 0.2), 0px 14px 21px 2px rgba(0, 0, 0, 0.14), 0px 5px 26px 4px rgba(0, 0, 0, 0.12);\n}\n\n.mdc-elevation--z15 {\n  box-shadow: 0px 8px 9px -5px rgba(0, 0, 0, 0.2), 0px 15px 22px 2px rgba(0, 0, 0, 0.14), 0px 6px 28px 5px rgba(0, 0, 0, 0.12);\n}\n\n.mdc-elevation--z16 {\n  box-shadow: 0px 8px 10px -5px rgba(0, 0, 0, 0.2), 0px 16px 24px 2px rgba(0, 0, 0, 0.14), 0px 6px 30px 5px rgba(0, 0, 0, 0.12);\n}\n\n.mdc-elevation--z17 {\n  box-shadow: 0px 8px 11px -5px rgba(0, 0, 0, 0.2), 0px 17px 26px 2px rgba(0, 0, 0, 0.14), 0px 6px 32px 5px rgba(0, 0, 0, 0.12);\n}\n\n.mdc-elevation--z18 {\n  box-shadow: 0px 9px 11px -5px rgba(0, 0, 0, 0.2), 0px 18px 28px 2px rgba(0, 0, 0, 0.14), 0px 7px 34px 6px rgba(0, 0, 0, 0.12);\n}\n\n.mdc-elevation--z19 {\n  box-shadow: 0px 9px 12px -6px rgba(0, 0, 0, 0.2), 0px 19px 29px 2px rgba(0, 0, 0, 0.14), 0px 7px 36px 6px rgba(0, 0, 0, 0.12);\n}\n\n.mdc-elevation--z20 {\n  box-shadow: 0px 10px 13px -6px rgba(0, 0, 0, 0.2), 0px 20px 31px 3px rgba(0, 0, 0, 0.14), 0px 8px 38px 7px rgba(0, 0, 0, 0.12);\n}\n\n.mdc-elevation--z21 {\n  box-shadow: 0px 10px 13px -6px rgba(0, 0, 0, 0.2), 0px 21px 33px 3px rgba(0, 0, 0, 0.14), 0px 8px 40px 7px rgba(0, 0, 0, 0.12);\n}\n\n.mdc-elevation--z22 {\n  box-shadow: 0px 10px 14px -6px rgba(0, 0, 0, 0.2), 0px 22px 35px 3px rgba(0, 0, 0, 0.14), 0px 8px 42px 7px rgba(0, 0, 0, 0.12);\n}\n\n.mdc-elevation--z23 {\n  box-shadow: 0px 11px 14px -7px rgba(0, 0, 0, 0.2), 0px 23px 36px 3px rgba(0, 0, 0, 0.14), 0px 9px 44px 8px rgba(0, 0, 0, 0.12);\n}\n\n.mdc-elevation--z24 {\n  box-shadow: 0px 11px 15px -7px rgba(0, 0, 0, 0.2), 0px 24px 38px 3px rgba(0, 0, 0, 0.14), 0px 9px 46px 8px rgba(0, 0, 0, 0.12);\n}\n\n.mdc-elevation-transition {\n  transition: box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1);\n  will-change: box-shadow;\n}\n\n.smui-paper {\n  background-color: #fff;\n  color: #000;\n  /* @alternate */\n  color: var(--mdc-theme-on-surface, #000);\n  padding: 24px 16px;\n}\n@supports not (-ms-ime-align: auto) {\n  .smui-paper {\n    /* @alternate */\n    background-color: var(--mdc-theme-surface, #fff);\n  }\n}\n.smui-paper.smui-paper--rounded {\n  border-radius: 4px;\n}\n.smui-paper.smui-paper--color-primary {\n  background-color: #6200ee;\n  color: #fff;\n  /* @alternate */\n  color: var(--mdc-theme-on-primary, #fff);\n}\n.smui-paper.smui-paper--color-primary.mdc-elevation--z0 {\n  box-shadow: 0px 0px 0px 0px rgba(98, 0, 238, 0.2), 0px 0px 0px 0px rgba(98, 0, 238, 0.14), 0px 0px 0px 0px rgba(98, 0, 238, 0.12);\n}\n.smui-paper.smui-paper--color-primary.mdc-elevation--z1 {\n  box-shadow: 0px 2px 1px -1px rgba(98, 0, 238, 0.2), 0px 1px 1px 0px rgba(98, 0, 238, 0.14), 0px 1px 3px 0px rgba(98, 0, 238, 0.12);\n}\n.smui-paper.smui-paper--color-primary.mdc-elevation--z2 {\n  box-shadow: 0px 3px 1px -2px rgba(98, 0, 238, 0.2), 0px 2px 2px 0px rgba(98, 0, 238, 0.14), 0px 1px 5px 0px rgba(98, 0, 238, 0.12);\n}\n.smui-paper.smui-paper--color-primary.mdc-elevation--z3 {\n  box-shadow: 0px 3px 3px -2px rgba(98, 0, 238, 0.2), 0px 3px 4px 0px rgba(98, 0, 238, 0.14), 0px 1px 8px 0px rgba(98, 0, 238, 0.12);\n}\n.smui-paper.smui-paper--color-primary.mdc-elevation--z4 {\n  box-shadow: 0px 2px 4px -1px rgba(98, 0, 238, 0.2), 0px 4px 5px 0px rgba(98, 0, 238, 0.14), 0px 1px 10px 0px rgba(98, 0, 238, 0.12);\n}\n.smui-paper.smui-paper--color-primary.mdc-elevation--z5 {\n  box-shadow: 0px 3px 5px -1px rgba(98, 0, 238, 0.2), 0px 5px 8px 0px rgba(98, 0, 238, 0.14), 0px 1px 14px 0px rgba(98, 0, 238, 0.12);\n}\n.smui-paper.smui-paper--color-primary.mdc-elevation--z6 {\n  box-shadow: 0px 3px 5px -1px rgba(98, 0, 238, 0.2), 0px 6px 10px 0px rgba(98, 0, 238, 0.14), 0px 1px 18px 0px rgba(98, 0, 238, 0.12);\n}\n.smui-paper.smui-paper--color-primary.mdc-elevation--z7 {\n  box-shadow: 0px 4px 5px -2px rgba(98, 0, 238, 0.2), 0px 7px 10px 1px rgba(98, 0, 238, 0.14), 0px 2px 16px 1px rgba(98, 0, 238, 0.12);\n}\n.smui-paper.smui-paper--color-primary.mdc-elevation--z8 {\n  box-shadow: 0px 5px 5px -3px rgba(98, 0, 238, 0.2), 0px 8px 10px 1px rgba(98, 0, 238, 0.14), 0px 3px 14px 2px rgba(98, 0, 238, 0.12);\n}\n.smui-paper.smui-paper--color-primary.mdc-elevation--z9 {\n  box-shadow: 0px 5px 6px -3px rgba(98, 0, 238, 0.2), 0px 9px 12px 1px rgba(98, 0, 238, 0.14), 0px 3px 16px 2px rgba(98, 0, 238, 0.12);\n}\n.smui-paper.smui-paper--color-primary.mdc-elevation--z10 {\n  box-shadow: 0px 6px 6px -3px rgba(98, 0, 238, 0.2), 0px 10px 14px 1px rgba(98, 0, 238, 0.14), 0px 4px 18px 3px rgba(98, 0, 238, 0.12);\n}\n.smui-paper.smui-paper--color-primary.mdc-elevation--z11 {\n  box-shadow: 0px 6px 7px -4px rgba(98, 0, 238, 0.2), 0px 11px 15px 1px rgba(98, 0, 238, 0.14), 0px 4px 20px 3px rgba(98, 0, 238, 0.12);\n}\n.smui-paper.smui-paper--color-primary.mdc-elevation--z12 {\n  box-shadow: 0px 7px 8px -4px rgba(98, 0, 238, 0.2), 0px 12px 17px 2px rgba(98, 0, 238, 0.14), 0px 5px 22px 4px rgba(98, 0, 238, 0.12);\n}\n.smui-paper.smui-paper--color-primary.mdc-elevation--z13 {\n  box-shadow: 0px 7px 8px -4px rgba(98, 0, 238, 0.2), 0px 13px 19px 2px rgba(98, 0, 238, 0.14), 0px 5px 24px 4px rgba(98, 0, 238, 0.12);\n}\n.smui-paper.smui-paper--color-primary.mdc-elevation--z14 {\n  box-shadow: 0px 7px 9px -4px rgba(98, 0, 238, 0.2), 0px 14px 21px 2px rgba(98, 0, 238, 0.14), 0px 5px 26px 4px rgba(98, 0, 238, 0.12);\n}\n.smui-paper.smui-paper--color-primary.mdc-elevation--z15 {\n  box-shadow: 0px 8px 9px -5px rgba(98, 0, 238, 0.2), 0px 15px 22px 2px rgba(98, 0, 238, 0.14), 0px 6px 28px 5px rgba(98, 0, 238, 0.12);\n}\n.smui-paper.smui-paper--color-primary.mdc-elevation--z16 {\n  box-shadow: 0px 8px 10px -5px rgba(98, 0, 238, 0.2), 0px 16px 24px 2px rgba(98, 0, 238, 0.14), 0px 6px 30px 5px rgba(98, 0, 238, 0.12);\n}\n.smui-paper.smui-paper--color-primary.mdc-elevation--z17 {\n  box-shadow: 0px 8px 11px -5px rgba(98, 0, 238, 0.2), 0px 17px 26px 2px rgba(98, 0, 238, 0.14), 0px 6px 32px 5px rgba(98, 0, 238, 0.12);\n}\n.smui-paper.smui-paper--color-primary.mdc-elevation--z18 {\n  box-shadow: 0px 9px 11px -5px rgba(98, 0, 238, 0.2), 0px 18px 28px 2px rgba(98, 0, 238, 0.14), 0px 7px 34px 6px rgba(98, 0, 238, 0.12);\n}\n.smui-paper.smui-paper--color-primary.mdc-elevation--z19 {\n  box-shadow: 0px 9px 12px -6px rgba(98, 0, 238, 0.2), 0px 19px 29px 2px rgba(98, 0, 238, 0.14), 0px 7px 36px 6px rgba(98, 0, 238, 0.12);\n}\n.smui-paper.smui-paper--color-primary.mdc-elevation--z20 {\n  box-shadow: 0px 10px 13px -6px rgba(98, 0, 238, 0.2), 0px 20px 31px 3px rgba(98, 0, 238, 0.14), 0px 8px 38px 7px rgba(98, 0, 238, 0.12);\n}\n.smui-paper.smui-paper--color-primary.mdc-elevation--z21 {\n  box-shadow: 0px 10px 13px -6px rgba(98, 0, 238, 0.2), 0px 21px 33px 3px rgba(98, 0, 238, 0.14), 0px 8px 40px 7px rgba(98, 0, 238, 0.12);\n}\n.smui-paper.smui-paper--color-primary.mdc-elevation--z22 {\n  box-shadow: 0px 10px 14px -6px rgba(98, 0, 238, 0.2), 0px 22px 35px 3px rgba(98, 0, 238, 0.14), 0px 8px 42px 7px rgba(98, 0, 238, 0.12);\n}\n.smui-paper.smui-paper--color-primary.mdc-elevation--z23 {\n  box-shadow: 0px 11px 14px -7px rgba(98, 0, 238, 0.2), 0px 23px 36px 3px rgba(98, 0, 238, 0.14), 0px 9px 44px 8px rgba(98, 0, 238, 0.12);\n}\n.smui-paper.smui-paper--color-primary.mdc-elevation--z24 {\n  box-shadow: 0px 11px 15px -7px rgba(98, 0, 238, 0.2), 0px 24px 38px 3px rgba(98, 0, 238, 0.14), 0px 9px 46px 8px rgba(98, 0, 238, 0.12);\n}\n@supports not (-ms-ime-align: auto) {\n  .smui-paper.smui-paper--color-primary {\n    /* @alternate */\n    background-color: var(--mdc-theme-primary, #6200ee);\n  }\n}\n.smui-paper.smui-paper--color-secondary {\n  background-color: #018786;\n  color: #fff;\n  /* @alternate */\n  color: var(--mdc-theme-on-secondary, #fff);\n}\n.smui-paper.smui-paper--color-secondary.mdc-elevation--z0 {\n  box-shadow: 0px 0px 0px 0px rgba(1, 135, 134, 0.2), 0px 0px 0px 0px rgba(1, 135, 134, 0.14), 0px 0px 0px 0px rgba(1, 135, 134, 0.12);\n}\n.smui-paper.smui-paper--color-secondary.mdc-elevation--z1 {\n  box-shadow: 0px 2px 1px -1px rgba(1, 135, 134, 0.2), 0px 1px 1px 0px rgba(1, 135, 134, 0.14), 0px 1px 3px 0px rgba(1, 135, 134, 0.12);\n}\n.smui-paper.smui-paper--color-secondary.mdc-elevation--z2 {\n  box-shadow: 0px 3px 1px -2px rgba(1, 135, 134, 0.2), 0px 2px 2px 0px rgba(1, 135, 134, 0.14), 0px 1px 5px 0px rgba(1, 135, 134, 0.12);\n}\n.smui-paper.smui-paper--color-secondary.mdc-elevation--z3 {\n  box-shadow: 0px 3px 3px -2px rgba(1, 135, 134, 0.2), 0px 3px 4px 0px rgba(1, 135, 134, 0.14), 0px 1px 8px 0px rgba(1, 135, 134, 0.12);\n}\n.smui-paper.smui-paper--color-secondary.mdc-elevation--z4 {\n  box-shadow: 0px 2px 4px -1px rgba(1, 135, 134, 0.2), 0px 4px 5px 0px rgba(1, 135, 134, 0.14), 0px 1px 10px 0px rgba(1, 135, 134, 0.12);\n}\n.smui-paper.smui-paper--color-secondary.mdc-elevation--z5 {\n  box-shadow: 0px 3px 5px -1px rgba(1, 135, 134, 0.2), 0px 5px 8px 0px rgba(1, 135, 134, 0.14), 0px 1px 14px 0px rgba(1, 135, 134, 0.12);\n}\n.smui-paper.smui-paper--color-secondary.mdc-elevation--z6 {\n  box-shadow: 0px 3px 5px -1px rgba(1, 135, 134, 0.2), 0px 6px 10px 0px rgba(1, 135, 134, 0.14), 0px 1px 18px 0px rgba(1, 135, 134, 0.12);\n}\n.smui-paper.smui-paper--color-secondary.mdc-elevation--z7 {\n  box-shadow: 0px 4px 5px -2px rgba(1, 135, 134, 0.2), 0px 7px 10px 1px rgba(1, 135, 134, 0.14), 0px 2px 16px 1px rgba(1, 135, 134, 0.12);\n}\n.smui-paper.smui-paper--color-secondary.mdc-elevation--z8 {\n  box-shadow: 0px 5px 5px -3px rgba(1, 135, 134, 0.2), 0px 8px 10px 1px rgba(1, 135, 134, 0.14), 0px 3px 14px 2px rgba(1, 135, 134, 0.12);\n}\n.smui-paper.smui-paper--color-secondary.mdc-elevation--z9 {\n  box-shadow: 0px 5px 6px -3px rgba(1, 135, 134, 0.2), 0px 9px 12px 1px rgba(1, 135, 134, 0.14), 0px 3px 16px 2px rgba(1, 135, 134, 0.12);\n}\n.smui-paper.smui-paper--color-secondary.mdc-elevation--z10 {\n  box-shadow: 0px 6px 6px -3px rgba(1, 135, 134, 0.2), 0px 10px 14px 1px rgba(1, 135, 134, 0.14), 0px 4px 18px 3px rgba(1, 135, 134, 0.12);\n}\n.smui-paper.smui-paper--color-secondary.mdc-elevation--z11 {\n  box-shadow: 0px 6px 7px -4px rgba(1, 135, 134, 0.2), 0px 11px 15px 1px rgba(1, 135, 134, 0.14), 0px 4px 20px 3px rgba(1, 135, 134, 0.12);\n}\n.smui-paper.smui-paper--color-secondary.mdc-elevation--z12 {\n  box-shadow: 0px 7px 8px -4px rgba(1, 135, 134, 0.2), 0px 12px 17px 2px rgba(1, 135, 134, 0.14), 0px 5px 22px 4px rgba(1, 135, 134, 0.12);\n}\n.smui-paper.smui-paper--color-secondary.mdc-elevation--z13 {\n  box-shadow: 0px 7px 8px -4px rgba(1, 135, 134, 0.2), 0px 13px 19px 2px rgba(1, 135, 134, 0.14), 0px 5px 24px 4px rgba(1, 135, 134, 0.12);\n}\n.smui-paper.smui-paper--color-secondary.mdc-elevation--z14 {\n  box-shadow: 0px 7px 9px -4px rgba(1, 135, 134, 0.2), 0px 14px 21px 2px rgba(1, 135, 134, 0.14), 0px 5px 26px 4px rgba(1, 135, 134, 0.12);\n}\n.smui-paper.smui-paper--color-secondary.mdc-elevation--z15 {\n  box-shadow: 0px 8px 9px -5px rgba(1, 135, 134, 0.2), 0px 15px 22px 2px rgba(1, 135, 134, 0.14), 0px 6px 28px 5px rgba(1, 135, 134, 0.12);\n}\n.smui-paper.smui-paper--color-secondary.mdc-elevation--z16 {\n  box-shadow: 0px 8px 10px -5px rgba(1, 135, 134, 0.2), 0px 16px 24px 2px rgba(1, 135, 134, 0.14), 0px 6px 30px 5px rgba(1, 135, 134, 0.12);\n}\n.smui-paper.smui-paper--color-secondary.mdc-elevation--z17 {\n  box-shadow: 0px 8px 11px -5px rgba(1, 135, 134, 0.2), 0px 17px 26px 2px rgba(1, 135, 134, 0.14), 0px 6px 32px 5px rgba(1, 135, 134, 0.12);\n}\n.smui-paper.smui-paper--color-secondary.mdc-elevation--z18 {\n  box-shadow: 0px 9px 11px -5px rgba(1, 135, 134, 0.2), 0px 18px 28px 2px rgba(1, 135, 134, 0.14), 0px 7px 34px 6px rgba(1, 135, 134, 0.12);\n}\n.smui-paper.smui-paper--color-secondary.mdc-elevation--z19 {\n  box-shadow: 0px 9px 12px -6px rgba(1, 135, 134, 0.2), 0px 19px 29px 2px rgba(1, 135, 134, 0.14), 0px 7px 36px 6px rgba(1, 135, 134, 0.12);\n}\n.smui-paper.smui-paper--color-secondary.mdc-elevation--z20 {\n  box-shadow: 0px 10px 13px -6px rgba(1, 135, 134, 0.2), 0px 20px 31px 3px rgba(1, 135, 134, 0.14), 0px 8px 38px 7px rgba(1, 135, 134, 0.12);\n}\n.smui-paper.smui-paper--color-secondary.mdc-elevation--z21 {\n  box-shadow: 0px 10px 13px -6px rgba(1, 135, 134, 0.2), 0px 21px 33px 3px rgba(1, 135, 134, 0.14), 0px 8px 40px 7px rgba(1, 135, 134, 0.12);\n}\n.smui-paper.smui-paper--color-secondary.mdc-elevation--z22 {\n  box-shadow: 0px 10px 14px -6px rgba(1, 135, 134, 0.2), 0px 22px 35px 3px rgba(1, 135, 134, 0.14), 0px 8px 42px 7px rgba(1, 135, 134, 0.12);\n}\n.smui-paper.smui-paper--color-secondary.mdc-elevation--z23 {\n  box-shadow: 0px 11px 14px -7px rgba(1, 135, 134, 0.2), 0px 23px 36px 3px rgba(1, 135, 134, 0.14), 0px 9px 44px 8px rgba(1, 135, 134, 0.12);\n}\n.smui-paper.smui-paper--color-secondary.mdc-elevation--z24 {\n  box-shadow: 0px 11px 15px -7px rgba(1, 135, 134, 0.2), 0px 24px 38px 3px rgba(1, 135, 134, 0.14), 0px 9px 46px 8px rgba(1, 135, 134, 0.12);\n}\n@supports not (-ms-ime-align: auto) {\n  .smui-paper.smui-paper--color-secondary {\n    /* @alternate */\n    background-color: var(--mdc-theme-secondary, #018786);\n  }\n}\n.smui-paper .smui-paper__title {\n  font-family: Roboto, sans-serif;\n  -moz-osx-font-smoothing: grayscale;\n  -webkit-font-smoothing: antialiased;\n  font-size: 1.5rem;\n  line-height: 2rem;\n  font-weight: 400;\n  letter-spacing: normal;\n  text-decoration: inherit;\n  text-transform: inherit;\n  margin-top: 0;\n  margin-bottom: 0.4rem;\n}\n.smui-paper .smui-paper__subtitle {\n  font-family: Roboto, sans-serif;\n  -moz-osx-font-smoothing: grayscale;\n  -webkit-font-smoothing: antialiased;\n  font-size: 1rem;\n  line-height: 1.75rem;\n  font-weight: 400;\n  letter-spacing: 0.009375em;\n  text-decoration: inherit;\n  text-transform: inherit;\n  margin-top: -0.2rem;\n  margin-bottom: 0.4rem;\n}\n.smui-paper .smui-paper__content {\n  font-family: Roboto, sans-serif;\n  -moz-osx-font-smoothing: grayscale;\n  -webkit-font-smoothing: antialiased;\n  font-size: 1rem;\n  line-height: 1.5rem;\n  font-weight: 400;\n  letter-spacing: 0.03125em;\n  text-decoration: inherit;\n  text-transform: inherit;\n}\n";
    styleInject(css_248z$2);

    var css_248z$1 = ".fraction.svelte-1gl7v98.svelte-1gl7v98{display:inline-block;vertical-align:middle;margin:0 0.2em 0.4ex;text-align:center}.fraction.svelte-1gl7v98>span.svelte-1gl7v98{display:block;padding-top:0.15em}.fraction.svelte-1gl7v98 span.fdn.svelte-1gl7v98{border-top:thin solid rgb(189, 51, 51);width:300px}.fraction.svelte-1gl7v98 span.bar.svelte-1gl7v98{display:none}";
    styleInject(css_248z$1);

    /* src/Fraction.svelte generated by Svelte v3.38.2 */

    const file$1 = "src/Fraction.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let t0;
    	let t1;
    	let div0;
    	let span0;
    	let t2;
    	let t3;
    	let span1;
    	let t5;
    	let span2;
    	let t6;
    	let t7;
    	let t8;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			t0 = text(/*functionname*/ ctx[0]);
    			t1 = text(" =\n    ");
    			div0 = element("div");
    			span0 = element("span");
    			t2 = text(/*numerator*/ ctx[1]);
    			t3 = space();
    			span1 = element("span");
    			span1.textContent = "/";
    			t5 = space();
    			span2 = element("span");
    			t6 = text(/*denominator*/ ctx[2]);
    			t7 = text("\n    = ");
    			t8 = text(/*result*/ ctx[3]);
    			attr_dev(span0, "class", "fup svelte-1gl7v98");
    			add_location(span0, file$1, 10, 8, 198);
    			attr_dev(span1, "class", "bar svelte-1gl7v98");
    			add_location(span1, file$1, 11, 8, 243);
    			attr_dev(span2, "class", "fdn svelte-1gl7v98");
    			add_location(span2, file$1, 12, 8, 278);
    			attr_dev(div0, "class", "fraction svelte-1gl7v98");
    			add_location(div0, file$1, 9, 4, 167);
    			attr_dev(div1, "class", "eq-c");
    			add_location(div1, file$1, 7, 0, 123);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, span0);
    			append_dev(span0, t2);
    			append_dev(div0, t3);
    			append_dev(div0, span1);
    			append_dev(div0, t5);
    			append_dev(div0, span2);
    			append_dev(span2, t6);
    			append_dev(div1, t7);
    			append_dev(div1, t8);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*functionname*/ 1) set_data_dev(t0, /*functionname*/ ctx[0]);
    			if (dirty & /*numerator*/ 2) set_data_dev(t2, /*numerator*/ ctx[1]);
    			if (dirty & /*denominator*/ 4) set_data_dev(t6, /*denominator*/ ctx[2]);
    			if (dirty & /*result*/ 8) set_data_dev(t8, /*result*/ ctx[3]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Fraction", slots, []);
    	let { functionname = "test" } = $$props;
    	let { numerator } = $$props;
    	let { denominator } = $$props;
    	let { result } = $$props;
    	const writable_props = ["functionname", "numerator", "denominator", "result"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Fraction> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("functionname" in $$props) $$invalidate(0, functionname = $$props.functionname);
    		if ("numerator" in $$props) $$invalidate(1, numerator = $$props.numerator);
    		if ("denominator" in $$props) $$invalidate(2, denominator = $$props.denominator);
    		if ("result" in $$props) $$invalidate(3, result = $$props.result);
    	};

    	$$self.$capture_state = () => ({
    		functionname,
    		numerator,
    		denominator,
    		result
    	});

    	$$self.$inject_state = $$props => {
    		if ("functionname" in $$props) $$invalidate(0, functionname = $$props.functionname);
    		if ("numerator" in $$props) $$invalidate(1, numerator = $$props.numerator);
    		if ("denominator" in $$props) $$invalidate(2, denominator = $$props.denominator);
    		if ("result" in $$props) $$invalidate(3, result = $$props.result);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [functionname, numerator, denominator, result];
    }

    class Fraction extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			functionname: 0,
    			numerator: 1,
    			denominator: 2,
    			result: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Fraction",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*numerator*/ ctx[1] === undefined && !("numerator" in props)) {
    			console.warn("<Fraction> was created without expected prop 'numerator'");
    		}

    		if (/*denominator*/ ctx[2] === undefined && !("denominator" in props)) {
    			console.warn("<Fraction> was created without expected prop 'denominator'");
    		}

    		if (/*result*/ ctx[3] === undefined && !("result" in props)) {
    			console.warn("<Fraction> was created without expected prop 'result'");
    		}
    	}

    	get functionname() {
    		throw new Error("<Fraction>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set functionname(value) {
    		throw new Error("<Fraction>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get numerator() {
    		throw new Error("<Fraction>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set numerator(value) {
    		throw new Error("<Fraction>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get denominator() {
    		throw new Error("<Fraction>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set denominator(value) {
    		throw new Error("<Fraction>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get result() {
    		throw new Error("<Fraction>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set result(value) {
    		throw new Error("<Fraction>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var css_248z = "main.svelte-1m1yi9d{text-align:center;padding:1em;max-width:240px;margin:0 auto}h1.svelte-1m1yi9d{color:#bd765e;text-transform:uppercase;font-size:4em;font-weight:100}@media(min-width: 640px){main.svelte-1m1yi9d{max-width:none}}.paper-container.svelte-1m1yi9d{background-color:#f8f8f8;padding:36px 18px;text-align:left;max-width:500px}.svelte-1m1yi9d .paper-demo{margin:0 auto;max-width:500px}";
    styleInject(css_248z);

    /* src/App.svelte generated by Svelte v3.38.2 */
    const file = "src/App.svelte";

    // (67:6) <Title style="text-align: center;">
    function create_default_slot_11(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Positiv test");
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
    		id: create_default_slot_11.name,
    		type: "slot",
    		source: "(67:6) <Title style=\\\"text-align: center;\\\">",
    		ctx
    	});

    	return block;
    }

    // (72:6) <Content>
    function create_default_slot_10(ctx) {
    	let fraction0;
    	let t0;
    	let fraction1;
    	let t1;
    	let fraction2;
    	let t2;
    	let fraction3;
    	let current;

    	fraction0 = new Fraction({
    			props: {
    				functionname: "",
    				numerator: "Sande postive",
    				denominator: "Sande positive + falske positive",
    				result: "" + ((/*true_positive*/ ctx[4] / (/*true_positive*/ ctx[4] + /*false_positive*/ ctx[5]) * 100).toFixed(2) + "  %")
    			},
    			$$inline: true
    		});

    	fraction1 = new Fraction({
    			props: {
    				functionname: "",
    				numerator: "" + (/*prior*/ ctx[0] + "% * " + /*sensitivity*/ ctx[1].toFixed(1) + "%"),
    				denominator: "(" + /*prior*/ ctx[0] + "% * " + /*sensitivity*/ ctx[1].toFixed(1) + "% ) + ( " + (100 - /*specifity*/ ctx[2]).toFixed(1) + " % * " + (100 - /*prior*/ ctx[0]) + " %)",
    				result: (/*true_positive*/ ctx[4] / (/*true_positive*/ ctx[4] + /*false_positive*/ ctx[5]) * 100).toFixed(2) + " %"
    			},
    			$$inline: true
    		});

    	fraction2 = new Fraction({
    			props: {
    				functionname: "",
    				numerator: /*true_positive*/ ctx[4].toFixed(5),
    				denominator: "" + (/*true_positive*/ ctx[4].toFixed(4) + " + " + /*false_positive*/ ctx[5].toFixed(5)),
    				result: (/*true_positive*/ ctx[4] / (/*true_positive*/ ctx[4] + /*false_positive*/ ctx[5]) * 100).toFixed(2) + "%"
    			},
    			$$inline: true
    		});

    	fraction3 = new Fraction({
    			props: {
    				functionname: "",
    				numerator: "" + ((/*true_positive*/ ctx[4].toFixed(5) * /*persons*/ ctx[3]).toFixed(1) + " personer"),
    				denominator: "" + ((/*true_positive*/ ctx[4].toFixed(4) * /*persons*/ ctx[3]).toFixed(1) + " personer + " + (/*false_positive*/ ctx[5].toFixed(5) * /*persons*/ ctx[3]).toFixed(1) + " personer"),
    				result: (/*true_positive*/ ctx[4] / (/*true_positive*/ ctx[4] + /*false_positive*/ ctx[5]) * 100).toFixed(2) + "%"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(fraction0.$$.fragment);
    			t0 = space();
    			create_component(fraction1.$$.fragment);
    			t1 = space();
    			create_component(fraction2.$$.fragment);
    			t2 = space();
    			create_component(fraction3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(fraction0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(fraction1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(fraction2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(fraction3, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const fraction0_changes = {};
    			if (dirty & /*true_positive, false_positive*/ 48) fraction0_changes.result = "" + ((/*true_positive*/ ctx[4] / (/*true_positive*/ ctx[4] + /*false_positive*/ ctx[5]) * 100).toFixed(2) + "  %");
    			fraction0.$set(fraction0_changes);
    			const fraction1_changes = {};
    			if (dirty & /*prior, sensitivity*/ 3) fraction1_changes.numerator = "" + (/*prior*/ ctx[0] + "% * " + /*sensitivity*/ ctx[1].toFixed(1) + "%");
    			if (dirty & /*prior, sensitivity, specifity*/ 7) fraction1_changes.denominator = "(" + /*prior*/ ctx[0] + "% * " + /*sensitivity*/ ctx[1].toFixed(1) + "% ) + ( " + (100 - /*specifity*/ ctx[2]).toFixed(1) + " % * " + (100 - /*prior*/ ctx[0]) + " %)";
    			if (dirty & /*true_positive, false_positive*/ 48) fraction1_changes.result = (/*true_positive*/ ctx[4] / (/*true_positive*/ ctx[4] + /*false_positive*/ ctx[5]) * 100).toFixed(2) + " %";
    			fraction1.$set(fraction1_changes);
    			const fraction2_changes = {};
    			if (dirty & /*true_positive*/ 16) fraction2_changes.numerator = /*true_positive*/ ctx[4].toFixed(5);
    			if (dirty & /*true_positive, false_positive*/ 48) fraction2_changes.denominator = "" + (/*true_positive*/ ctx[4].toFixed(4) + " + " + /*false_positive*/ ctx[5].toFixed(5));
    			if (dirty & /*true_positive, false_positive*/ 48) fraction2_changes.result = (/*true_positive*/ ctx[4] / (/*true_positive*/ ctx[4] + /*false_positive*/ ctx[5]) * 100).toFixed(2) + "%";
    			fraction2.$set(fraction2_changes);
    			const fraction3_changes = {};
    			if (dirty & /*true_positive, persons*/ 24) fraction3_changes.numerator = "" + ((/*true_positive*/ ctx[4].toFixed(5) * /*persons*/ ctx[3]).toFixed(1) + " personer");
    			if (dirty & /*true_positive, persons, false_positive*/ 56) fraction3_changes.denominator = "" + ((/*true_positive*/ ctx[4].toFixed(4) * /*persons*/ ctx[3]).toFixed(1) + " personer + " + (/*false_positive*/ ctx[5].toFixed(5) * /*persons*/ ctx[3]).toFixed(1) + " personer");
    			if (dirty & /*true_positive, false_positive*/ 48) fraction3_changes.result = (/*true_positive*/ ctx[4] / (/*true_positive*/ ctx[4] + /*false_positive*/ ctx[5]) * 100).toFixed(2) + "%";
    			fraction3.$set(fraction3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fraction0.$$.fragment, local);
    			transition_in(fraction1.$$.fragment, local);
    			transition_in(fraction2.$$.fragment, local);
    			transition_in(fraction3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fraction0.$$.fragment, local);
    			transition_out(fraction1.$$.fragment, local);
    			transition_out(fraction2.$$.fragment, local);
    			transition_out(fraction3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(fraction0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(fraction1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(fraction2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(fraction3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_10.name,
    		type: "slot",
    		source: "(72:6) <Content>",
    		ctx
    	});

    	return block;
    }

    // (66:5) <Paper class="paper-demo">
    function create_default_slot_9(ctx) {
    	let title;
    	let t0;
    	let subtitle;
    	let t2;
    	let content;
    	let current;

    	title = new Title({
    			props: {
    				style: "text-align: center;",
    				$$slots: { default: [create_default_slot_11] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	content = new Content({
    			props: {
    				$$slots: { default: [create_default_slot_10] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(title.$$.fragment);
    			t0 = space();
    			subtitle = element("subtitle");
    			subtitle.textContent = "Sandsynlighed for at en person, der er testet\n\t\t\t\t\t\t\tpositiv i virkeligheden er smittet (sand positiv)";
    			t2 = space();
    			create_component(content.$$.fragment);
    			attr_dev(subtitle, "class", "svelte-1m1yi9d");
    			add_location(subtitle, file, 67, 6, 1874);
    		},
    		m: function mount(target, anchor) {
    			mount_component(title, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, subtitle, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(content, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const title_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
    			const content_changes = {};

    			if (dirty & /*$$scope, true_positive, persons, false_positive, prior, sensitivity, specifity*/ 4159) {
    				content_changes.$$scope = { dirty, ctx };
    			}

    			content.$set(content_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title.$$.fragment, local);
    			transition_in(content.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title.$$.fragment, local);
    			transition_out(content.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(title, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(subtitle);
    			if (detaching) detach_dev(t2);
    			destroy_component(content, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_9.name,
    		type: "slot",
    		source: "(66:5) <Paper class=\\\"paper-demo\\\">",
    		ctx
    	});

    	return block;
    }

    // (126:6) <Title style="text-align: center;"        >
    function create_default_slot_8(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("En positiv test i tal");
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
    		id: create_default_slot_8.name,
    		type: "slot",
    		source: "(126:6) <Title style=\\\"text-align: center;\\\"        >",
    		ctx
    	});

    	return block;
    }

    // (129:6) <Content        >
    function create_default_slot_7(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5_value = (/*prior*/ ctx[0] / 100 * /*persons*/ ctx[3]).toFixed(0) + "";
    	let t5;
    	let t6;
    	let t7_value = /*persons*/ ctx[3] * (1 - /*prior*/ ctx[0] / 100) + "";
    	let t7;
    	let t8;
    	let br0;
    	let t9;
    	let t10;
    	let t11;
    	let t12_value = (/*sensitivity*/ ctx[1] / 100 * (/*prior*/ ctx[0] / 100) * /*persons*/ ctx[3]).toFixed(1) + "";
    	let t12;
    	let t13;
    	let br1;
    	let t14;
    	let br2;
    	let t15;
    	let t16_value = /*specifity*/ ctx[2].toFixed(1) + "";
    	let t16;
    	let t17;
    	let t18_value = (/*persons*/ ctx[3] * (1 - /*prior*/ ctx[0] / 100) * (1 - /*specifity*/ ctx[2] / 100)).toFixed(0) + "";
    	let t18;
    	let t19;
    	let t20_value = ((1 - /*specifity*/ ctx[2] / 100) * 100).toFixed(1) + "";
    	let t20;
    	let t21;
    	let t22_value = /*persons*/ ctx[3] * (1 - /*prior*/ ctx[0] / 100) + "";
    	let t22;
    	let t23;

    	const block = {
    		c: function create() {
    			t0 = text("Med et smittetryk på ");
    			t1 = text(/*prior*/ ctx[0]);
    			t2 = text(" % og en population på ");
    			t3 = text(/*persons*/ ctx[3]);
    			t4 = text("\n\t\t\t\t\t\t\tpersoner, findes\n\t\t\t\t\t\t\t");
    			t5 = text(t5_value);
    			t6 = text(" smittede personer\n\t\t\t\t\t\t\tog ");
    			t7 = text(t7_value);
    			t8 = text(" raske personer.\n\t\t\t\t\t\t\t");
    			br0 = element("br");
    			t9 = text("\n\t\t\t\t\t\t\tMed en test med sensivitet på ");
    			t10 = text(/*sensitivity*/ ctx[1]);
    			t11 = text(" %, vil testen\n\t\t\t\t\t\t\tkorrekt identificere\n\t\t\t\t\t\t\t");
    			t12 = text(t12_value);
    			t13 = text(" personer\n\t\t\t\t\t\t\tsom syge (sande positive)\n\n\t\t\t\t\t\t\t");
    			br1 = element("br");
    			t14 = space();
    			br2 = element("br");
    			t15 = text("\n\n\t\t\t\t\t\t\tMed en specifitet på ");
    			t16 = text(t16_value);
    			t17 = text(" % vil testen vil derudover fejlagtigt identificere ca. ");
    			t18 = text(t18_value);
    			t19 = text(" personer som positive (");
    			t20 = text(t20_value);
    			t21 = text("% af ");
    			t22 = text(t22_value);
    			t23 = text(" raske personer)  selvom personerne\n\t\t\t\t\t\t\tikke er smittede (falske positive). Personer som skal\n\t\t\t\t\t\t\tisoleres eller forhindres i rejser m.m. på baggrund af\n\t\t\t\t\t\t\ten falsk positiv test.");
    			attr_dev(br0, "class", "svelte-1m1yi9d");
    			add_location(br0, file, 133, 7, 3838);
    			attr_dev(br1, "class", "svelte-1m1yi9d");
    			add_location(br1, file, 139, 7, 4056);
    			attr_dev(br2, "class", "svelte-1m1yi9d");
    			add_location(br2, file, 140, 7, 4070);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, t18, anchor);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, t20, anchor);
    			insert_dev(target, t21, anchor);
    			insert_dev(target, t22, anchor);
    			insert_dev(target, t23, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*prior*/ 1) set_data_dev(t1, /*prior*/ ctx[0]);
    			if (dirty & /*persons*/ 8) set_data_dev(t3, /*persons*/ ctx[3]);
    			if (dirty & /*prior, persons*/ 9 && t5_value !== (t5_value = (/*prior*/ ctx[0] / 100 * /*persons*/ ctx[3]).toFixed(0) + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*persons, prior*/ 9 && t7_value !== (t7_value = /*persons*/ ctx[3] * (1 - /*prior*/ ctx[0] / 100) + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*sensitivity*/ 2) set_data_dev(t10, /*sensitivity*/ ctx[1]);
    			if (dirty & /*sensitivity, prior, persons*/ 11 && t12_value !== (t12_value = (/*sensitivity*/ ctx[1] / 100 * (/*prior*/ ctx[0] / 100) * /*persons*/ ctx[3]).toFixed(1) + "")) set_data_dev(t12, t12_value);
    			if (dirty & /*specifity*/ 4 && t16_value !== (t16_value = /*specifity*/ ctx[2].toFixed(1) + "")) set_data_dev(t16, t16_value);
    			if (dirty & /*persons, prior, specifity*/ 13 && t18_value !== (t18_value = (/*persons*/ ctx[3] * (1 - /*prior*/ ctx[0] / 100) * (1 - /*specifity*/ ctx[2] / 100)).toFixed(0) + "")) set_data_dev(t18, t18_value);
    			if (dirty & /*specifity*/ 4 && t20_value !== (t20_value = ((1 - /*specifity*/ ctx[2] / 100) * 100).toFixed(1) + "")) set_data_dev(t20, t20_value);
    			if (dirty & /*persons, prior*/ 9 && t22_value !== (t22_value = /*persons*/ ctx[3] * (1 - /*prior*/ ctx[0] / 100) + "")) set_data_dev(t22, t22_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(t18);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(t20);
    			if (detaching) detach_dev(t21);
    			if (detaching) detach_dev(t22);
    			if (detaching) detach_dev(t23);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7.name,
    		type: "slot",
    		source: "(129:6) <Content        >",
    		ctx
    	});

    	return block;
    }

    // (125:5) <Paper class="paper-demo">
    function create_default_slot_6(ctx) {
    	let title;
    	let t;
    	let content;
    	let current;

    	title = new Title({
    			props: {
    				style: "text-align: center;",
    				$$slots: { default: [create_default_slot_8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	content = new Content({
    			props: {
    				$$slots: { default: [create_default_slot_7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(title.$$.fragment);
    			t = space();
    			create_component(content.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(title, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(content, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const title_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
    			const content_changes = {};

    			if (dirty & /*$$scope, persons, prior, specifity, sensitivity*/ 4111) {
    				content_changes.$$scope = { dirty, ctx };
    			}

    			content.$set(content_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title.$$.fragment, local);
    			transition_in(content.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title.$$.fragment, local);
    			transition_out(content.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(title, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(content, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(125:5) <Paper class=\\\"paper-demo\\\">",
    		ctx
    	});

    	return block;
    }

    // (159:6) <Title style="text-align: center;">
    function create_default_slot_5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Negativ test");
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
    		source: "(159:6) <Title style=\\\"text-align: center;\\\">",
    		ctx
    	});

    	return block;
    }

    // (164:6) <Content>
    function create_default_slot_4(ctx) {
    	let fraction0;
    	let t0;
    	let fraction1;
    	let t1;
    	let fraction2;
    	let t2;
    	let fraction3;
    	let current;

    	fraction0 = new Fraction({
    			props: {
    				functionname: "",
    				numerator: "Sande negative",
    				denominator: "Sande negative + falske negative",
    				result: "" + ((/*true_negative*/ ctx[6] / (/*true_negative*/ ctx[6] + /*false_negative*/ ctx[7]) * 100).toFixed(2) + "  %")
    			},
    			$$inline: true
    		});

    	fraction1 = new Fraction({
    			props: {
    				functionname: "",
    				numerator: "" + ((1 - /*prior*/ ctx[0] / 100) * 100 + "% * " + /*specifity*/ ctx[2].toFixed(1) + "%"),
    				denominator: "(" + (1 - /*prior*/ ctx[0] / 100) * 100 + "% * " + /*specifity*/ ctx[2].toFixed(1) + "% ) + (" + /*prior*/ ctx[0] + "% * " + ((1 - /*sensitivity*/ ctx[1] / 100) * 100).toFixed(1) + "%)",
    				result: "" + ((/*true_negative*/ ctx[6] / (/*true_negative*/ ctx[6] + /*false_negative*/ ctx[7]) * 100).toFixed(2) + "  %")
    			},
    			$$inline: true
    		});

    	fraction2 = new Fraction({
    			props: {
    				functionname: "",
    				numerator: /*true_negative*/ ctx[6].toFixed(5),
    				denominator: "" + (/*true_negative*/ ctx[6].toFixed(4) + " + " + /*false_negative*/ ctx[7].toFixed(5)),
    				result: "" + ((/*true_negative*/ ctx[6] / (/*true_negative*/ ctx[6] + /*false_negative*/ ctx[7]) * 100).toFixed(2) + "  %")
    			},
    			$$inline: true
    		});

    	fraction3 = new Fraction({
    			props: {
    				functionname: "",
    				numerator: "" + (/*true_negative*/ ctx[6].toFixed(4) * /*persons*/ ctx[3] + " personer"),
    				denominator: "" + (/*true_negative*/ ctx[6].toFixed(4) * /*persons*/ ctx[3] + " personer + " + /*false_negative*/ ctx[7].toFixed(4) * /*persons*/ ctx[3] + " personer"),
    				result: "" + ((/*true_negative*/ ctx[6] / (/*true_negative*/ ctx[6] + /*false_negative*/ ctx[7]) * 100).toFixed(2) + "  %")
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(fraction0.$$.fragment);
    			t0 = space();
    			create_component(fraction1.$$.fragment);
    			t1 = space();
    			create_component(fraction2.$$.fragment);
    			t2 = space();
    			create_component(fraction3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(fraction0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(fraction1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(fraction2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(fraction3, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const fraction0_changes = {};
    			if (dirty & /*true_negative, false_negative*/ 192) fraction0_changes.result = "" + ((/*true_negative*/ ctx[6] / (/*true_negative*/ ctx[6] + /*false_negative*/ ctx[7]) * 100).toFixed(2) + "  %");
    			fraction0.$set(fraction0_changes);
    			const fraction1_changes = {};
    			if (dirty & /*prior, specifity*/ 5) fraction1_changes.numerator = "" + ((1 - /*prior*/ ctx[0] / 100) * 100 + "% * " + /*specifity*/ ctx[2].toFixed(1) + "%");
    			if (dirty & /*prior, specifity, sensitivity*/ 7) fraction1_changes.denominator = "(" + (1 - /*prior*/ ctx[0] / 100) * 100 + "% * " + /*specifity*/ ctx[2].toFixed(1) + "% ) + (" + /*prior*/ ctx[0] + "% * " + ((1 - /*sensitivity*/ ctx[1] / 100) * 100).toFixed(1) + "%)";
    			if (dirty & /*true_negative, false_negative*/ 192) fraction1_changes.result = "" + ((/*true_negative*/ ctx[6] / (/*true_negative*/ ctx[6] + /*false_negative*/ ctx[7]) * 100).toFixed(2) + "  %");
    			fraction1.$set(fraction1_changes);
    			const fraction2_changes = {};
    			if (dirty & /*true_negative*/ 64) fraction2_changes.numerator = /*true_negative*/ ctx[6].toFixed(5);
    			if (dirty & /*true_negative, false_negative*/ 192) fraction2_changes.denominator = "" + (/*true_negative*/ ctx[6].toFixed(4) + " + " + /*false_negative*/ ctx[7].toFixed(5));
    			if (dirty & /*true_negative, false_negative*/ 192) fraction2_changes.result = "" + ((/*true_negative*/ ctx[6] / (/*true_negative*/ ctx[6] + /*false_negative*/ ctx[7]) * 100).toFixed(2) + "  %");
    			fraction2.$set(fraction2_changes);
    			const fraction3_changes = {};
    			if (dirty & /*true_negative, persons*/ 72) fraction3_changes.numerator = "" + (/*true_negative*/ ctx[6].toFixed(4) * /*persons*/ ctx[3] + " personer");
    			if (dirty & /*true_negative, persons, false_negative*/ 200) fraction3_changes.denominator = "" + (/*true_negative*/ ctx[6].toFixed(4) * /*persons*/ ctx[3] + " personer + " + /*false_negative*/ ctx[7].toFixed(4) * /*persons*/ ctx[3] + " personer");
    			if (dirty & /*true_negative, false_negative*/ 192) fraction3_changes.result = "" + ((/*true_negative*/ ctx[6] / (/*true_negative*/ ctx[6] + /*false_negative*/ ctx[7]) * 100).toFixed(2) + "  %");
    			fraction3.$set(fraction3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fraction0.$$.fragment, local);
    			transition_in(fraction1.$$.fragment, local);
    			transition_in(fraction2.$$.fragment, local);
    			transition_in(fraction3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fraction0.$$.fragment, local);
    			transition_out(fraction1.$$.fragment, local);
    			transition_out(fraction2.$$.fragment, local);
    			transition_out(fraction3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(fraction0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(fraction1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(fraction2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(fraction3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(164:6) <Content>",
    		ctx
    	});

    	return block;
    }

    // (158:5) <Paper class="paper-demo">
    function create_default_slot_3(ctx) {
    	let title;
    	let t0;
    	let subtitle;
    	let t2;
    	let content;
    	let current;

    	title = new Title({
    			props: {
    				style: "text-align: center;",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	content = new Content({
    			props: {
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(title.$$.fragment);
    			t0 = space();
    			subtitle = element("subtitle");
    			subtitle.textContent = "Sandsynlighed for at en person, der er testet\n\t\t\t\t\t\t\tnegativ i virkeligheden ikke er smittet (sand negativ)";
    			t2 = space();
    			create_component(content.$$.fragment);
    			attr_dev(subtitle, "class", "svelte-1m1yi9d");
    			add_location(subtitle, file, 159, 6, 4794);
    		},
    		m: function mount(target, anchor) {
    			mount_component(title, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, subtitle, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(content, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const title_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
    			const content_changes = {};

    			if (dirty & /*$$scope, true_negative, persons, false_negative, prior, specifity, sensitivity*/ 4303) {
    				content_changes.$$scope = { dirty, ctx };
    			}

    			content.$set(content_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title.$$.fragment, local);
    			transition_in(content.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title.$$.fragment, local);
    			transition_out(content.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(title, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(subtitle);
    			if (detaching) detach_dev(t2);
    			destroy_component(content, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(158:5) <Paper class=\\\"paper-demo\\\">",
    		ctx
    	});

    	return block;
    }

    // (215:6) <Title style="text-align: center;"        >
    function create_default_slot_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("En negativ test i tal");
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
    		source: "(215:6) <Title style=\\\"text-align: center;\\\"        >",
    		ctx
    	});

    	return block;
    }

    // (218:6) <Content>
    function create_default_slot_1(ctx) {
    	let p;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5_value = (/*prior*/ ctx[0] / 100 * /*persons*/ ctx[3]).toFixed(0) + "";
    	let t5;
    	let t6;
    	let t7_value = /*persons*/ ctx[3] * (1 - /*prior*/ ctx[0] / 100) + "";
    	let t7;
    	let t8;
    	let br0;
    	let t9;
    	let t10_value = /*specifity*/ ctx[2].toFixed(1) + "";
    	let t10;
    	let t11;
    	let t12_value = (/*specifity*/ ctx[2] / 100 * (/*persons*/ ctx[3] * (1 - /*prior*/ ctx[0] / 100))).toFixed(0) + "";
    	let t12;
    	let t13;
    	let br1;
    	let t14;
    	let t15;
    	let t16;
    	let t17_value = ((1 - /*sensitivity*/ ctx[1] / 100) * (/*prior*/ ctx[0] / 100 * /*persons*/ ctx[3])).toFixed(0) + "";
    	let t17;
    	let t18;
    	let t19_value = 100 - /*sensitivity*/ ctx[1] + "";
    	let t19;
    	let t20;
    	let t21_value = (/*prior*/ ctx[0] / 100 * /*persons*/ ctx[3]).toFixed(0) + "";
    	let t21;
    	let t22;
    	let br2;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Med en smitteprocent på ");
    			t1 = text(/*prior*/ ctx[0]);
    			t2 = text(" % og en population på ");
    			t3 = text(/*persons*/ ctx[3]);
    			t4 = text("\n\t\t\t\t\t\t\t\tpersoner, findes\n\t\t\t\t\t\t\t\t");
    			t5 = text(t5_value);
    			t6 = text(" smittede personer\n\t\t\t\t\t\t\t\tog ");
    			t7 = text(t7_value);
    			t8 = text(" raske personer.");
    			br0 = element("br");
    			t9 = text("\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\tMed en specifitet på ");
    			t10 = text(t10_value);
    			t11 = text("% vil testen korrekt identificere ");
    			t12 = text(t12_value);
    			t13 = text(" personer som raske (sande negative)\n\t\t\t\t\t\t\t\t");
    			br1 = element("br");
    			t14 = text("\n\t\t\t\t\t\t\t\tTesten med en sensitivitet på ");
    			t15 = text(/*sensitivity*/ ctx[1]);
    			t16 = text(" % vil fejlagtigt identficere ");
    			t17 = text(t17_value);
    			t18 = text(" personer som raske (");
    			t19 = text(t19_value);
    			t20 = text(" % af ");
    			t21 = text(t21_value);
    			t22 = text(" personer), men som i virkeligheden\n\t\t\t\t\t\t\t\ter syge (falske negative). Personerne bliver ikke isoleret\n\t\t\t\t\t\t\t\tog kan videregive smitte.\n\t\t\t\t\t\t\t\t");
    			br2 = element("br");
    			attr_dev(br0, "class", "svelte-1m1yi9d");
    			add_location(br0, file, 222, 56, 6728);
    			attr_dev(br1, "class", "svelte-1m1yi9d");
    			add_location(br1, file, 225, 8, 6935);
    			attr_dev(br2, "class", "svelte-1m1yi9d");
    			add_location(br2, file, 232, 8, 7344);
    			attr_dev(p, "class", "svelte-1m1yi9d");
    			add_location(p, file, 218, 7, 6506);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			append_dev(p, t4);
    			append_dev(p, t5);
    			append_dev(p, t6);
    			append_dev(p, t7);
    			append_dev(p, t8);
    			append_dev(p, br0);
    			append_dev(p, t9);
    			append_dev(p, t10);
    			append_dev(p, t11);
    			append_dev(p, t12);
    			append_dev(p, t13);
    			append_dev(p, br1);
    			append_dev(p, t14);
    			append_dev(p, t15);
    			append_dev(p, t16);
    			append_dev(p, t17);
    			append_dev(p, t18);
    			append_dev(p, t19);
    			append_dev(p, t20);
    			append_dev(p, t21);
    			append_dev(p, t22);
    			append_dev(p, br2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*prior*/ 1) set_data_dev(t1, /*prior*/ ctx[0]);
    			if (dirty & /*persons*/ 8) set_data_dev(t3, /*persons*/ ctx[3]);
    			if (dirty & /*prior, persons*/ 9 && t5_value !== (t5_value = (/*prior*/ ctx[0] / 100 * /*persons*/ ctx[3]).toFixed(0) + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*persons, prior*/ 9 && t7_value !== (t7_value = /*persons*/ ctx[3] * (1 - /*prior*/ ctx[0] / 100) + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*specifity*/ 4 && t10_value !== (t10_value = /*specifity*/ ctx[2].toFixed(1) + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*specifity, persons, prior*/ 13 && t12_value !== (t12_value = (/*specifity*/ ctx[2] / 100 * (/*persons*/ ctx[3] * (1 - /*prior*/ ctx[0] / 100))).toFixed(0) + "")) set_data_dev(t12, t12_value);
    			if (dirty & /*sensitivity*/ 2) set_data_dev(t15, /*sensitivity*/ ctx[1]);
    			if (dirty & /*sensitivity, prior, persons*/ 11 && t17_value !== (t17_value = ((1 - /*sensitivity*/ ctx[1] / 100) * (/*prior*/ ctx[0] / 100 * /*persons*/ ctx[3])).toFixed(0) + "")) set_data_dev(t17, t17_value);
    			if (dirty & /*sensitivity*/ 2 && t19_value !== (t19_value = 100 - /*sensitivity*/ ctx[1] + "")) set_data_dev(t19, t19_value);
    			if (dirty & /*prior, persons*/ 9 && t21_value !== (t21_value = (/*prior*/ ctx[0] / 100 * /*persons*/ ctx[3]).toFixed(0) + "")) set_data_dev(t21, t21_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(218:6) <Content>",
    		ctx
    	});

    	return block;
    }

    // (214:5) <Paper class="paper-demo">
    function create_default_slot(ctx) {
    	let title;
    	let t;
    	let content;
    	let current;

    	title = new Title({
    			props: {
    				style: "text-align: center;",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	content = new Content({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(title.$$.fragment);
    			t = space();
    			create_component(content.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(title, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(content, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const title_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
    			const content_changes = {};

    			if (dirty & /*$$scope, prior, persons, sensitivity, specifity*/ 4111) {
    				content_changes.$$scope = { dirty, ctx };
    			}

    			content.$set(content_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title.$$.fragment, local);
    			transition_in(content.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title.$$.fragment, local);
    			transition_out(content.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(title, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(content, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(214:5) <Paper class=\\\"paper-demo\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let section;
    	let div0;
    	let pre0;
    	let t2;
    	let t3_value = /*prior*/ ctx[0].toFixed(1) + "";
    	let t3;
    	let t4;
    	let t5;
    	let slider0;
    	let updating_value;
    	let t6;
    	let div1;
    	let pre1;
    	let t7;
    	let t8_value = /*sensitivity*/ ctx[1].toFixed(1) + "";
    	let t8;
    	let t9;
    	let t10;
    	let slider1;
    	let updating_value_1;
    	let t11;
    	let div2;
    	let pre2;
    	let t12;
    	let t13_value = /*specifity*/ ctx[2].toFixed(1) + "";
    	let t13;
    	let t14;
    	let t15;
    	let slider2;
    	let updating_value_2;
    	let t16;
    	let div3;
    	let pre3;
    	let t17;
    	let t18;
    	let t19;
    	let slider3;
    	let updating_value_3;
    	let t20;
    	let div10;
    	let div6;
    	let div4;
    	let paper0;
    	let t21;
    	let div5;
    	let paper1;
    	let t22;
    	let div9;
    	let div7;
    	let paper2;
    	let t23;
    	let div8;
    	let paper3;
    	let current;

    	function slider0_value_binding(value) {
    		/*slider0_value_binding*/ ctx[8](value);
    	}

    	let slider0_props = {
    		min: 0,
    		max: 25,
    		step: 0.1,
    		XXdiscrete: true
    	};

    	if (/*prior*/ ctx[0] !== void 0) {
    		slider0_props.value = /*prior*/ ctx[0];
    	}

    	slider0 = new Slider({ props: slider0_props, $$inline: true });
    	binding_callbacks.push(() => bind(slider0, "value", slider0_value_binding));

    	function slider1_value_binding(value) {
    		/*slider1_value_binding*/ ctx[9](value);
    	}

    	let slider1_props = { min: 0, max: 100, step: 0.1 };

    	if (/*sensitivity*/ ctx[1] !== void 0) {
    		slider1_props.value = /*sensitivity*/ ctx[1];
    	}

    	slider1 = new Slider({ props: slider1_props, $$inline: true });
    	binding_callbacks.push(() => bind(slider1, "value", slider1_value_binding));

    	function slider2_value_binding(value) {
    		/*slider2_value_binding*/ ctx[10](value);
    	}

    	let slider2_props = { min: 0, max: 100, step: 0.1 };

    	if (/*specifity*/ ctx[2] !== void 0) {
    		slider2_props.value = /*specifity*/ ctx[2];
    	}

    	slider2 = new Slider({ props: slider2_props, $$inline: true });
    	binding_callbacks.push(() => bind(slider2, "value", slider2_value_binding));

    	function slider3_value_binding(value) {
    		/*slider3_value_binding*/ ctx[11](value);
    	}

    	let slider3_props = {
    		min: 0,
    		max: 1000000,
    		step: 1000,
    		discrete: true
    	};

    	if (/*persons*/ ctx[3] !== void 0) {
    		slider3_props.value = /*persons*/ ctx[3];
    	}

    	slider3 = new Slider({ props: slider3_props, $$inline: true });
    	binding_callbacks.push(() => bind(slider3, "value", slider3_value_binding));

    	paper0 = new Paper({
    			props: {
    				class: "paper-demo",
    				$$slots: { default: [create_default_slot_9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	paper1 = new Paper({
    			props: {
    				class: "paper-demo",
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	paper2 = new Paper({
    			props: {
    				class: "paper-demo",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	paper3 = new Paper({
    			props: {
    				class: "paper-demo",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Bayes";
    			t1 = space();
    			section = element("section");
    			div0 = element("div");
    			pre0 = element("pre");
    			t2 = text("Smitteprocent: ");
    			t3 = text(t3_value);
    			t4 = text(" %");
    			t5 = space();
    			create_component(slider0.$$.fragment);
    			t6 = space();
    			div1 = element("div");
    			pre1 = element("pre");
    			t7 = text("Sensitivitet (sande positive vs. falske negative): ");
    			t8 = text(t8_value);
    			t9 = text(" %");
    			t10 = space();
    			create_component(slider1.$$.fragment);
    			t11 = space();
    			div2 = element("div");
    			pre2 = element("pre");
    			t12 = text("Specifitet (sande negative vs. falske positive): ");
    			t13 = text(t13_value);
    			t14 = text(" %");
    			t15 = space();
    			create_component(slider2.$$.fragment);
    			t16 = space();
    			div3 = element("div");
    			pre3 = element("pre");
    			t17 = text("Antal testede personer: ");
    			t18 = text(/*persons*/ ctx[3]);
    			t19 = space();
    			create_component(slider3.$$.fragment);
    			t20 = space();
    			div10 = element("div");
    			div6 = element("div");
    			div4 = element("div");
    			create_component(paper0.$$.fragment);
    			t21 = space();
    			div5 = element("div");
    			create_component(paper1.$$.fragment);
    			t22 = space();
    			div9 = element("div");
    			div7 = element("div");
    			create_component(paper2.$$.fragment);
    			t23 = space();
    			div8 = element("div");
    			create_component(paper3.$$.fragment);
    			attr_dev(h1, "class", "svelte-1m1yi9d");
    			add_location(h1, file, 25, 1, 753);
    			attr_dev(pre0, "class", "status svelte-1m1yi9d");
    			add_location(pre0, file, 29, 3, 817);
    			set_style(div0, "text-align", "left");
    			attr_dev(div0, "class", "svelte-1m1yi9d");
    			add_location(div0, file, 27, 2, 781);
    			attr_dev(pre1, "class", "status svelte-1m1yi9d");
    			add_location(pre1, file, 41, 3, 1032);
    			set_style(div1, "text-align", "left");
    			attr_dev(div1, "class", "svelte-1m1yi9d");
    			add_location(div1, file, 39, 4, 994);
    			attr_dev(pre2, "class", "status svelte-1m1yi9d");
    			add_location(pre2, file, 47, 3, 1259);
    			set_style(div2, "text-align", "left");
    			attr_dev(div2, "class", "svelte-1m1yi9d");
    			add_location(div2, file, 45, 4, 1223);
    			attr_dev(pre3, "class", "status svelte-1m1yi9d");
    			add_location(pre3, file, 54, 3, 1483);
    			set_style(div3, "text-align", "left");
    			attr_dev(div3, "class", "svelte-1m1yi9d");
    			add_location(div3, file, 52, 4, 1446);
    			attr_dev(section, "class", "svelte-1m1yi9d");
    			add_location(section, file, 26, 1, 769);
    			attr_dev(div4, "class", "paper-container svelte-1m1yi9d");
    			add_location(div4, file, 64, 4, 1744);
    			attr_dev(div5, "class", "paper-container svelte-1m1yi9d");
    			add_location(div5, file, 123, 4, 3455);
    			set_style(div6, "width", "600px");
    			set_style(div6, "float", "left");
    			attr_dev(div6, "class", "svelte-1m1yi9d");
    			add_location(div6, file, 63, 3, 1699);
    			attr_dev(div7, "class", "paper-container svelte-1m1yi9d");
    			add_location(div7, file, 156, 4, 4664);
    			attr_dev(div8, "class", "paper-container svelte-1m1yi9d");
    			add_location(div8, file, 212, 4, 6335);
    			set_style(div9, "margin-left", "640px");
    			attr_dev(div9, "class", "svelte-1m1yi9d");
    			add_location(div9, file, 155, 3, 4626);
    			set_style(div10, "width", "100%");
    			set_style(div10, "overflow", "hidden");
    			attr_dev(div10, "class", "svelte-1m1yi9d");
    			add_location(div10, file, 62, 2, 1651);
    			attr_dev(main, "class", "svelte-1m1yi9d");
    			add_location(main, file, 24, 0, 745);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, section);
    			append_dev(section, div0);
    			append_dev(div0, pre0);
    			append_dev(pre0, t2);
    			append_dev(pre0, t3);
    			append_dev(pre0, t4);
    			append_dev(div0, t5);
    			mount_component(slider0, div0, null);
    			append_dev(section, t6);
    			append_dev(section, div1);
    			append_dev(div1, pre1);
    			append_dev(pre1, t7);
    			append_dev(pre1, t8);
    			append_dev(pre1, t9);
    			append_dev(div1, t10);
    			mount_component(slider1, div1, null);
    			append_dev(section, t11);
    			append_dev(section, div2);
    			append_dev(div2, pre2);
    			append_dev(pre2, t12);
    			append_dev(pre2, t13);
    			append_dev(pre2, t14);
    			append_dev(div2, t15);
    			mount_component(slider2, div2, null);
    			append_dev(section, t16);
    			append_dev(section, div3);
    			append_dev(div3, pre3);
    			append_dev(pre3, t17);
    			append_dev(pre3, t18);
    			append_dev(div3, t19);
    			mount_component(slider3, div3, null);
    			append_dev(main, t20);
    			append_dev(main, div10);
    			append_dev(div10, div6);
    			append_dev(div6, div4);
    			mount_component(paper0, div4, null);
    			append_dev(div6, t21);
    			append_dev(div6, div5);
    			mount_component(paper1, div5, null);
    			append_dev(div10, t22);
    			append_dev(div10, div9);
    			append_dev(div9, div7);
    			mount_component(paper2, div7, null);
    			append_dev(div9, t23);
    			append_dev(div9, div8);
    			mount_component(paper3, div8, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*prior*/ 1) && t3_value !== (t3_value = /*prior*/ ctx[0].toFixed(1) + "")) set_data_dev(t3, t3_value);
    			const slider0_changes = {};

    			if (!updating_value && dirty & /*prior*/ 1) {
    				updating_value = true;
    				slider0_changes.value = /*prior*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			slider0.$set(slider0_changes);
    			if ((!current || dirty & /*sensitivity*/ 2) && t8_value !== (t8_value = /*sensitivity*/ ctx[1].toFixed(1) + "")) set_data_dev(t8, t8_value);
    			const slider1_changes = {};

    			if (!updating_value_1 && dirty & /*sensitivity*/ 2) {
    				updating_value_1 = true;
    				slider1_changes.value = /*sensitivity*/ ctx[1];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			slider1.$set(slider1_changes);
    			if ((!current || dirty & /*specifity*/ 4) && t13_value !== (t13_value = /*specifity*/ ctx[2].toFixed(1) + "")) set_data_dev(t13, t13_value);
    			const slider2_changes = {};

    			if (!updating_value_2 && dirty & /*specifity*/ 4) {
    				updating_value_2 = true;
    				slider2_changes.value = /*specifity*/ ctx[2];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			slider2.$set(slider2_changes);
    			if (!current || dirty & /*persons*/ 8) set_data_dev(t18, /*persons*/ ctx[3]);
    			const slider3_changes = {};

    			if (!updating_value_3 && dirty & /*persons*/ 8) {
    				updating_value_3 = true;
    				slider3_changes.value = /*persons*/ ctx[3];
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			slider3.$set(slider3_changes);
    			const paper0_changes = {};

    			if (dirty & /*$$scope, true_positive, persons, false_positive, prior, sensitivity, specifity*/ 4159) {
    				paper0_changes.$$scope = { dirty, ctx };
    			}

    			paper0.$set(paper0_changes);
    			const paper1_changes = {};

    			if (dirty & /*$$scope, persons, prior, specifity, sensitivity*/ 4111) {
    				paper1_changes.$$scope = { dirty, ctx };
    			}

    			paper1.$set(paper1_changes);
    			const paper2_changes = {};

    			if (dirty & /*$$scope, true_negative, persons, false_negative, prior, specifity, sensitivity*/ 4303) {
    				paper2_changes.$$scope = { dirty, ctx };
    			}

    			paper2.$set(paper2_changes);
    			const paper3_changes = {};

    			if (dirty & /*$$scope, prior, persons, sensitivity, specifity*/ 4111) {
    				paper3_changes.$$scope = { dirty, ctx };
    			}

    			paper3.$set(paper3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(slider0.$$.fragment, local);
    			transition_in(slider1.$$.fragment, local);
    			transition_in(slider2.$$.fragment, local);
    			transition_in(slider3.$$.fragment, local);
    			transition_in(paper0.$$.fragment, local);
    			transition_in(paper1.$$.fragment, local);
    			transition_in(paper2.$$.fragment, local);
    			transition_in(paper3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(slider0.$$.fragment, local);
    			transition_out(slider1.$$.fragment, local);
    			transition_out(slider2.$$.fragment, local);
    			transition_out(slider3.$$.fragment, local);
    			transition_out(paper0.$$.fragment, local);
    			transition_out(paper1.$$.fragment, local);
    			transition_out(paper2.$$.fragment, local);
    			transition_out(paper3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(slider0);
    			destroy_component(slider1);
    			destroy_component(slider2);
    			destroy_component(slider3);
    			destroy_component(paper0);
    			destroy_component(paper1);
    			destroy_component(paper2);
    			destroy_component(paper3);
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
    	let true_positive;
    	let false_positive;
    	let true_negative;
    	let false_negative;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let prior = 0.3;
    	let sensitivity = 70;
    	let specifity = 99.5;
    	let persons = 10000;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function slider0_value_binding(value) {
    		prior = value;
    		$$invalidate(0, prior);
    	}

    	function slider1_value_binding(value) {
    		sensitivity = value;
    		$$invalidate(1, sensitivity);
    	}

    	function slider2_value_binding(value) {
    		specifity = value;
    		$$invalidate(2, specifity);
    	}

    	function slider3_value_binding(value) {
    		persons = value;
    		$$invalidate(3, persons);
    	}

    	$$self.$capture_state = () => ({
    		Button: Button_1,
    		Slider,
    		FormField,
    		Paper,
    		Title,
    		Subtitle,
    		Content,
    		Fraction,
    		prior,
    		sensitivity,
    		specifity,
    		persons,
    		true_positive,
    		false_positive,
    		true_negative,
    		false_negative
    	});

    	$$self.$inject_state = $$props => {
    		if ("prior" in $$props) $$invalidate(0, prior = $$props.prior);
    		if ("sensitivity" in $$props) $$invalidate(1, sensitivity = $$props.sensitivity);
    		if ("specifity" in $$props) $$invalidate(2, specifity = $$props.specifity);
    		if ("persons" in $$props) $$invalidate(3, persons = $$props.persons);
    		if ("true_positive" in $$props) $$invalidate(4, true_positive = $$props.true_positive);
    		if ("false_positive" in $$props) $$invalidate(5, false_positive = $$props.false_positive);
    		if ("true_negative" in $$props) $$invalidate(6, true_negative = $$props.true_negative);
    		if ("false_negative" in $$props) $$invalidate(7, false_negative = $$props.false_negative);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*prior, sensitivity*/ 3) {
    			$$invalidate(4, true_positive = prior / 100 * (sensitivity / 100));
    		}

    		if ($$self.$$.dirty & /*prior, specifity*/ 5) {
    			$$invalidate(5, false_positive = (1 - prior / 100) * (1 - specifity / 100));
    		}

    		if ($$self.$$.dirty & /*prior, specifity*/ 5) {
    			$$invalidate(6, true_negative = (1 - prior / 100) * (specifity / 100));
    		}

    		if ($$self.$$.dirty & /*prior, sensitivity*/ 3) {
    			$$invalidate(7, false_negative = prior / 100 * (1 - sensitivity / 100));
    		}
    	};

    	return [
    		prior,
    		sensitivity,
    		specifity,
    		persons,
    		true_positive,
    		false_positive,
    		true_negative,
    		false_negative,
    		slider0_value_binding,
    		slider1_value_binding,
    		slider2_value_binding,
    		slider3_value_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
