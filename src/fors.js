if (typeof Fors === "undefined") {
    Fors = {};
}

Fors.apply = function(object, config, defaults) {
    
    if (defaults) {
        Fors.apply(object, defaults);
    }
    if (object && config && typeof config == 'object') {
        for (var key in config) {
            object[key] = config[key];
        }
    }
    return object;
};

Fors.apply(Fors, {
    platformVersion: '0.2',
    platformVersionDetail: {
        major: 0,
        minor: 2,
        patch: 0
    },
    userAgent: navigator.userAgent.toLowerCase(),
    cache: {},
    idSeed: 1000,
    BLANK_IMAGE_URL : 'data:image/gif;base64,R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
    isStrict: document.compatMode == "CSS1Compat",

    windowId: 'ext-window',
    documentId: 'ext-document',

    
    emptyFn : function() {},

    
    isSecure : /^https/i.test(window.location.protocol),

    
    isReady : false,

    
    enableGarbageCollector : true,

    
    enableListenerCollection : true,

    
    applyIf : function(object, config) {
        var property, undefined;

        if (object) {
            for (property in config) {
                if (object[property] === undefined) {
                    object[property] = config[property];
                }
            }
        }

        return object;
    },

    
    repaint : function() {
        var mask = Fors.getBody().createChild({
            cls: 'x-mask x-mask-transparent'
        });
        setTimeout(function() {
            mask.remove();
        }, 0);
    },

    
    id : function(el, prefix) {
        el = Fors.getDom(el) || {};
        if (el === document) {
            el.id = this.documentId;
        }
        else if (el === window) {
            el.id = this.windowId;
        }
        el.id = el.id || ((prefix || 'ext-gen') + (++Fors.idSeed));
        return el.id;
    },

    
    extend : function() {
        
        var inlineOverrides = function(o){
            for (var m in o) {
                if (!o.hasOwnProperty(m)) {
                    continue;
                }
                this[m] = o[m];
            }
        };

        var objectConstructor = Object.prototype.constructor;

        return function(subclass, superclass, overrides){
            
            if (Fors.isObject(superclass)) {
                overrides = superclass;
                superclass = subclass;
                subclass = overrides.constructor != objectConstructor
                    ? overrides.constructor
                    : function(){ superclass.apply(this, arguments); };
            }

            
            var F = function(){},
                subclassProto,
                superclassProto = superclass.prototype;

            F.prototype = superclassProto;
            subclassProto = subclass.prototype = new F();
            subclassProto.constructor = subclass;
            subclass.superclass = superclassProto;

            if(superclassProto.constructor == objectConstructor){
                superclassProto.constructor = superclass;
            }

            subclass.override = function(overrides){
                Fors.override(subclass, overrides);
            };

            subclassProto.superclass = subclassProto.supr = (function(){
                return superclassProto;
            });

            subclassProto.override = inlineOverrides;
            subclassProto.proto = subclassProto;

            subclass.override(overrides);
            subclass.extend = function(o) {
                return Fors.extend(subclass, o);
            };

            return subclass;
        };
    }(),

    
    override : function(origclass, overrides) {
        Fors.apply(origclass.prototype, overrides);
    },

    
    namespace : function() {
        var ln = arguments.length,
            i, value, split, x, xln, parts, object;

        for (i = 0; i < ln; i++) {
            value = arguments[i];
            parts = value.split(".");
            if (window.Fors) {
                object = window[parts[0]] = Object(window[parts[0]]);
            } else {
                object = arguments.callee.caller.arguments[0];
            }
            for (x = 1, xln = parts.length; x < xln; x++) {
                object = object[parts[x]] = Object(object[parts[x]]);
            }
        }
        return object;
    },

    
    urlEncode : function(o, pre) {
        var empty,
            buf = [],
            e = encodeURIComponent;

        Fors.iterate(o, function(key, item){
            empty = Fors.isEmpty(item);
            Fors.each(empty ? key : item, function(val){
                buf.push('&', e(key), '=', (!Fors.isEmpty(val) && (val != key || !empty)) ? (Fors.isDate(val) ? Fors.encode(val).replace(/"/g, '') : e(val)) : '');
            });
        });

        if(!pre){
            buf.shift();
            pre = '';
        }

        return pre + buf.join('');
    },

    
    urlDecode : function(string, overwrite) {
        if (Fors.isEmpty(string)) {
            return {};
        }

        var obj = {},
            pairs = string.split('&'),
            d = decodeURIComponent,
            name,
            value;

        Fors.each(pairs, function(pair) {
            pair = pair.split('=');
            name = d(pair[0]);
            value = d(pair[1]);
            obj[name] = overwrite || !obj[name] ? value : [].concat(obj[name]).concat(value);
        });

        return obj;
    },

    
    htmlEncode : function(value) {
        return Fors.util.Format.htmlEncode(value);
    },

    
    htmlDecode : function(value) {
         return Fors.util.Format.htmlDecode(value);
    },

    
    urlAppend : function(url, s) {
        if (!Fors.isEmpty(s)) {
            return url + (url.indexOf('?') === -1 ? '?' : '&') + s;
        }
        return url;
    },

    
     toArray : function(array, start, end) {
        return Array.prototype.slice.call(array, start || 0, end || array.length);
     },

     
     each : function(array, fn, scope) {
         if (Fors.isEmpty(array, true)) {
             return 0;
         }
         if (!Fors.isIterable(array) || Fors.isPrimitive(array)) {
             array = [array];
         }
         for (var i = 0, len = array.length; i < len; i++) {
             if (fn.call(scope || array[i], array[i], i, array) === false) {
                 return i;
             }
         }
         return true;
     },

     
     iterate : function(obj, fn, scope) {
         if (Fors.isEmpty(obj)) {
             return;
         }
         if (Fors.isIterable(obj)) {
             Fors.each(obj, fn, scope);
             return;
         }
         else if (Fors.isObject(obj)) {
             for (var prop in obj) {
                 if (obj.hasOwnProperty(prop)) {
                     if (fn.call(scope || obj, prop, obj[prop], obj) === false) {
                         return;
                     }
                 }
             }
         }
     },

    
    pluck : function(arr, prop) {
        var ret = [];
        Fors.each(arr, function(v) {
            ret.push(v[prop]);
        });
        return ret;
    },

    
    getBody : function() {
        return Fors.get(document.body || false);
    },

    
    getHead : function() {
        var head;

        return function() {
            if (head == undefined) {
                head = Fors.get(DOC.getElementsByTagName("head")[0]);
            }

            return head;
        };
    }(),

    
    getDoc : function() {
        return Fors.get(document);
    },

    
    getCmp : function(id) {
        return Fors.ComponentMgr.get(id);
    },

    
    getOrientation: function() {
        return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    },

    isIterable : function(v) {
        if (!v) {
            return false;
        }
        
        if (Fors.isArray(v) || v.callee) {
            return true;
        }
        
        if (/NodeList|HTMLCollection/.test(Object.prototype.toString.call(v))) {
            return true;
        }

        
        
        return ((typeof v.nextNode != 'undefined' || v.item) && Fors.isNumber(v.length));
    },

    
    num : function(v, defaultValue) {
        v = Number(Fors.isEmpty(v) || Fors.isArray(v) || typeof v == 'boolean' || (typeof v == 'string' && Fors.util.Format.trim(v).length == 0) ? NaN : v);
        return isNaN(v) ? defaultValue : v;
    },

    
    isEmpty : function(value, allowBlank) {
        var isNull       = value == null,
            emptyArray   = (Fors.isArray(value) && !value.length),
            blankAllowed = !allowBlank ? value === '' : false;

        return isNull || emptyArray || blankAllowed;
    },

    
    isArray : function(v) {
        return Object.prototype.toString.apply(v) === '[object Array]';
    },

    
    isDate : function(v) {
        return Object.prototype.toString.apply(v) === '[object Date]';
    },

    
    isObject : function(v) {
        return !!v && Object.prototype.toString.call(v) === '[object Object]';
    },

    
    isPrimitive : function(v) {
        return Fors.isString(v) || Fors.isNumber(v) || Fors.isBoolean(v);
    },

    
    isFunction : function(v) {
        return Object.prototype.toString.apply(v) === '[object Function]';
    },

    
    isNumber : function(v) {
        return Object.prototype.toString.apply(v) === '[object Number]' && isFinite(v);
    },

    
    isString : function(v) {
        return typeof v === 'string';
        
        
    },

    
    isBoolean : function(v) {
        return Object.prototype.toString.apply(v) === '[object Boolean]';
    },

    
    isElement : function(v) {
        return v ? !!v.tagName : false;
    },

    
    isDefined : function(v){
        return typeof v !== 'undefined';
    },

    
    destroy : function() {
        var ln = arguments.length,
            i, arg;

        for (i = 0; i < ln; i++) {
            arg = arguments[i];
            if (arg) {
                if (Fors.isArray(arg)) {
                    this.destroy.apply(this, arg);
                }
                else if (Fors.isFunction(arg.destroy)) {
                    arg.destroy();
                }
                else if (arg.dom) {
                    arg.remove();
                }
            }
        }
    }
});


(function() {
var El = Fors.Element = Fors.extend(Object, {
    
    defaultUnit : "px",

    constructor : function(element, forceNew) {
        var dom = typeof element == 'string'
                ? document.getElementById(element)
                : element,
            id;

        if (!dom) {
            return null;
        }

        id = dom.id;
        if (!forceNew && id && Fors.cache[id]) {
            return Fors.cache[id].el;
        }

        
        this.dom = dom;

        
        this.id = id || Fors.id(dom);
        return this;
    },

    
    set : function(o, useSet) {
        var el = this.dom,
            attr,
            value;

        for (attr in o) {
            if (o.hasOwnProperty(attr)) {
                value = o[attr];
                if (attr == 'style') {
                    this.applyStyles(value);
                }
                else if (attr == 'cls') {
                    el.className = value;
                }
                else if (useSet !== false) {
                    el.setAttribute(attr, value);
                }
                else {
                    el[attr] = value;
                }
            }
        }
        return this;
    },

    
    is : function(simpleSelector) {
        return Fors.DomQuery.is(this.dom, simpleSelector);
    },

    
    getValue : function(asNumber){
        var val = this.dom.value;
        return asNumber ? parseInt(val, 10) : val;
    },

    
    addListener : function(eventName, fn, scope, options){
        Fors.EventManager.on(this.dom,  eventName, fn, scope || this, options);
        return this;
    },

    
    removeListener : function(eventName, fn, scope) {
        Fors.EventManager.un(this.dom, eventName, fn, scope);
        return this;
    },

    
    removeAllListeners : function(){
        Fors.EventManager.removeAll(this.dom);
        return this;
    },

    
    purgeAllListeners : function() {
        Fors.EventManager.purgeElement(this, true);
        return this;
    },

    
    remove : function() {
        var me = this,
            dom = me.dom;

        if (dom) {
            delete me.dom;
            Fors.removeNode(dom);
        }
    },

    isAncestor : function(c) {
        var p = this.dom;
        c = Fors.getDom(c);
        if (p && c) {
            return p.contains(c);
        }
        return false;
    },

    
    isDescendent : function(p) {
        return Fors.fly(p).isAncestor(this);
    },

    
    contains : function(el) {
        return !el ? false : this.isAncestor(el);
    },

    
    getAttribute : function(name, ns) {
        var d = this.dom;
        return d.getAttributeNS(ns, name) || d.getAttribute(ns + ":" + name) || d.getAttribute(name) || d[name];
    },

    
    setHTML : function(html) {
        if(this.dom) {
            this.dom.innerHTML = html;
        }
        return this;
    },

    
    getHTML : function() {
        return this.dom ? this.dom.innerHTML : '';
    },

    
    hide : function() {
        this.setVisible(false);
        return this;
    },

    
    show : function() {
        this.setVisible(true);
        return this;
    },

    
     setVisible : function(visible, animate) {
        var me = this,
            dom = me.dom,
            mode = this.getVisibilityMode();

        switch (mode) {
            case El.VISIBILITY:
                this.removeClass(['x-hidden-display', 'x-hidden-offsets']);
                this[visible ? 'removeClass' : 'addClass']('x-hidden-visibility');
            break;

            case El.DISPLAY:
                this.removeClass(['x-hidden-visibility', 'x-hidden-offsets']);
                this[visible ? 'removeClass' : 'addClass']('x-hidden-display');
            break;

            case El.OFFSETS:
                this.removeClass(['x-hidden-visibility', 'x-hidden-display']);
                this[visible ? 'removeClass' : 'addClass']('x-hidden-offsets');
            break;
        }

        return me;
    },

    getVisibilityMode: function() {
        var dom = this.dom,
            mode = El.data(dom, 'visibilityMode');

        if (mode === undefined) {
            El.data(dom, 'visibilityMode', mode = El.DISPLAY);
        }

        return mode;
    },

    setDisplayMode : function(mode) {
        El.data(this.dom, 'visibilityMode', mode);
        return this;
    }
});

var Elp = El.prototype;


El.VISIBILITY = 1;

El.DISPLAY = 2;

El.OFFSETS = 3;


El.addMethods = function(o){
   Fors.apply(Elp, o);
};


Elp.on = Elp.addListener;
Elp.un = Elp.removeListener;


Elp.update = Elp.setHTML;


El.get = function(el){
    var extEl,
        dom,
        id;

    if(!el){
        return null;
    }

    if (typeof el == "string") { 
        if (!(dom = document.getElementById(el))) {
            return null;
        }
        if (Fors.cache[el] && Fors.cache[el].el) {
            extEl = Fors.cache[el].el;
            extEl.dom = dom;
        } else {
            extEl = El.addToCache(new El(dom));
        }
        return extEl;
    } else if (el.tagName) { 
        if(!(id = el.id)){
            id = Fors.id(el);
        }
        if (Fors.cache[id] && Fors.cache[id].el) {
            extEl = Fors.cache[id].el;
            extEl.dom = el;
        } else {
            extEl = El.addToCache(new El(el));
        }
        return extEl;
    } else if (el instanceof El) {
        if(el != El.docEl){
            
            
            el.dom = document.getElementById(el.id) || el.dom;
        }
        return el;
    } else if(el.isComposite) {
        return el;
    } else if(Fors.isArray(el)) {
        return El.select(el);
    } else if(el == document) {
        
        if(!El.docEl){
            var F = function(){};
            F.prototype = Elp;
            El.docEl = new F();
            El.docEl.dom = document;
            El.docEl.id = Fors.id(document);
        }
        return El.docEl;
    }
    return null;
};


El.addToCache = function(el, id){
    id = id || el.id;
    Fors.cache[id] = {
        el:  el,
        data: {},
        events: {}
    };
    return el;
};


El.data = function(el, key, value) {
    el = El.get(el);
    if (!el) {
        return null;
    }
    var c = Fors.cache[el.id].data;
    if (arguments.length == 2) {
        return c[key];
    }
    else {
        return (c[key] = value);
    }
};




El.garbageCollect = function() {
    if (!Fors.enableGarbageCollector) {
        clearInterval(El.collectorThreadId);
    }
    else {
        var id,
            dom,
            EC = Fors.cache;

        for (id in EC) {
            if (!EC.hasOwnProperty(id)) {
                continue;
            }
            if(EC[id].skipGarbageCollection){
                continue;
            }
            dom = EC[id].el.dom;
            if(!dom || !dom.parentNode || (!dom.offsetParent && !document.getElementById(id))){
                if(Fors.enableListenerCollection){
                    Fors.EventManager.removeAll(dom);
                }
                delete EC[id];
            }
        }
    }
};



El.Flyweight = function(dom) {
    this.dom = dom;
};

var F = function(){};
F.prototype = Elp;

El.Flyweight.prototype = new F;
El.Flyweight.prototype.isFlyweight = true;

El._flyweights = {};


El.fly = function(el, named) {
    var ret = null;
    named = named || '_global';

    el = Fors.getDom(el);
    if (el) {
        (El._flyweights[named] = El._flyweights[named] || new El.Flyweight()).dom = el;
        ret = El._flyweights[named];
    }

    return ret;
};


Fors.get = El.get;


Fors.fly = El.fly;



})();


Fors.apply(Fors, {
    version : '0.6.1',

    setup: function(config) {
        if (config && typeof config == 'object') {
            if (config.addMetaTags !== false) {
                var head = Fors.get(document.getElementsByTagName('head')[0]),
                    tag, precomposed;

                
                if (!Fors.is.Desktop) {
                    tag = Fors.get(document.createElement('meta'));
                    tag.set({
                        name: 'viewport',
                        content: 'width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0;'
                    });
                    head.appendChild(tag);                    
                }

                
                if (Fors.is.iOS) {
                                    
                    if (config.fullscreen !== false) {
                        tag = Fors.get(document.createElement('meta'));
                        tag.set({
                            name: 'apple-mobile-web-app-capable',
                            content: 'yes'
                        });
                        head.appendChild(tag);

                        if (Fors.isString(config.statusBarStyle)) {
                            tag = Fors.get(document.createElement('meta'));
                            tag.set({
                                name: 'apple-mobile-web-app-status-bar-style',
                                content: config.statusBarStyle
                            });
                            head.appendChild(tag);
                        }
                    }
                    
                    
                    if (config.tabletStartupScreen && Fors.is.iPad) {
                        tag = Fors.get(document.createElement('link'));
                        tag.set({
                            rel: 'apple-touch-startup-image',
                            href: config.tabletStartupScreen
                        }); 
                        head.appendChild(tag);                  
                    }
                    
                    if (config.phoneStartupScreen && !Fors.is.iPad) {
                        tag = Fors.get(document.createElement('link'));
                        tag.set({
                            rel: 'apple-touch-startup-image',
                            href: config.phoneStartupScreen
                        });
                        head.appendChild(tag);
                    }
                    
                    
                    if (config.icon) {
                        config.phoneIcon = config.tabletIcon = config.icon;
                    }
                    
                    precomposed = (config.glossOnIcon === false) ? '-precomposed' : '';
                    if (Fors.is.iPad && Fors.isString(config.tabletIcon)) {
                        tag = Fors.get(document.createElement('link'));
                        tag.set({
                            rel: 'apple-touch-icon' + precomposed,
                            href: config.tabletIcon
                        });
                        head.appendChild(tag);
                    } 
                    else if (!Fors.is.iPad && Fors.isString(config.phoneIcon)) {
                        tag = Fors.get(document.createElement('link'));
                        tag.set({
                            rel: 'apple-touch-icon' + precomposed,
                            href: config.phoneIcon
                        });
                        head.appendChild(tag);
                    }
                }
            }

            if (Fors.isFunction(config.onReady)) {
                Fors.onReady(function() {
                    var args = arguments;
                    if (config.fullscreen !== false) {
                        Fors.stretchEl = Fors.getBody().createChild({
                            cls: 'x-body-stretcher'
                        });                        
                        Fors.stretchEl.setSize(window.innerWidth, window.innerHeight);
                        Fors.hideAddressBar(function() {
                            if (Fors.is.Android) {
                                setInterval(function() {
                                   window.scrollTo(0, Fors.is.Android ? 1 : 0);
                                }, 250);
                            }
                            else {
                                document.body.addEventListener('touchstart', function() {
                                    Fors.hideAddressBar();
                                }, true);
                            }
                            config.onReady.apply(this, args);
                        }, this);
                    }
                    else {
                        config.onReady.apply(this, args);
                    }
                }, config.scope);
            }
        }
    } ,
    
    // hideAddressBar : function(callback, scope) {
    //     setTimeout(function() {
    //         window.scrollTo(0, Fors.is.Android ? 1 : 0);
    //         if (callback) {
    //             setTimeout(function() {
    //                 callback.apply(scope || this);                
    //             }, 300);    
    //         }
    //     }, 100);
    // },
    
     
    getDom : function(el) {
        if (!el || !document) {
            return null;
        }

        return el.dom ? el.dom : (typeof el == 'string' ? document.getElementById(el) : el);
    },
    
    
    // removeNode : function(node) {
    //     if (node && node.parentNode && node.tagName != 'BODY') {
    //         Fors.EventManager.removeAll(node);
    //         node.parentNode.removeChild(node);
    //         delete Fors.cache[node.id];
    //     }
    // }
});
