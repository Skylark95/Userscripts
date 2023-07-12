// ==UserScript==
// @name        GG.Deals Steam Links
// @namespace   https://github.com/Skylark95/Userscripts
// @match       https://gg.deals/*
// @grant       GM_xmlhttpRequest
// @version     1.0
// @author      Derek Cochran
// @description Changes game links to steam on bundle pages
// ==/UserScript==
(() => {
  // node_modules/@violentmonkey/shortcut/dist/index.esm.js
  /*! @violentmonkey/shortcut v1.2.6 | ISC License */
  function _extends() {
    _extends = Object.assign || function(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
      return target;
    };
    return _extends.apply(this, arguments);
  }
  var isMacintosh = navigator.userAgent.includes("Macintosh");
  var modifiers = {
    c: "c",
    s: "s",
    a: "a",
    m: "m",
    ctrl: "c",
    control: "c",
    // macOS
    shift: "s",
    alt: "a",
    meta: "m",
    ctrlcmd: isMacintosh ? "m" : "c"
  };
  var aliases = {
    arrowup: "up",
    arrowdown: "down",
    arrowleft: "left",
    arrowright: "right",
    enter: "cr",
    escape: "esc",
    " ": "space"
  };
  function reprKey(base, mod, caseSensitive = false) {
    const {
      c,
      s,
      a,
      m
    } = mod;
    if (!caseSensitive || base.length > 1)
      base = base.toLowerCase();
    base = aliases[base] || base;
    return [m && "m", c && "c", s && "s", a && "a", base].filter(Boolean).join("-");
  }
  function normalizeKey(shortcut, caseSensitive = false) {
    const parts = shortcut.split("-");
    const base = parts.pop();
    const modifierState = {};
    for (const part of parts) {
      const key = modifiers[part.toLowerCase()];
      if (!key)
        throw new Error(`Unknown modifier key: ${part}`);
      modifierState[key] = true;
    }
    return reprKey(base, modifierState, caseSensitive);
  }
  function normalizeSequence(sequence, caseSensitive) {
    return sequence.split(" ").map((key) => normalizeKey(key, caseSensitive));
  }
  function parseCondition(condition) {
    return condition.split("&&").map((key) => {
      key = key.trim();
      if (!key)
        return;
      if (key[0] === "!") {
        return {
          not: true,
          field: key.slice(1).trim()
        };
      }
      return {
        not: false,
        field: key
      };
    }).filter(Boolean);
  }
  var KeyNode = class {
    constructor() {
      this.children = /* @__PURE__ */ new Map();
      this.shortcuts = /* @__PURE__ */ new Set();
    }
    add(sequence, shortcut) {
      let node = this;
      for (const key of sequence) {
        let child = node.children.get(key);
        if (!child) {
          child = new KeyNode();
          node.children.set(key, child);
        }
        node = child;
      }
      node.shortcuts.add(shortcut);
    }
    get(sequence) {
      let node = this;
      for (const key of sequence) {
        node = node.children.get(key);
        if (!node)
          return null;
      }
      return node;
    }
    remove(sequence, shortcut) {
      let node = this;
      const ancestors = [node];
      for (const key of sequence) {
        node = node.children.get(key);
        if (!node)
          return;
        ancestors.push(node);
      }
      if (shortcut)
        node.shortcuts.delete(shortcut);
      else
        node.shortcuts.clear();
      let i = ancestors.length - 1;
      while (i > 1) {
        node = ancestors[i];
        if (node.shortcuts.size || node.children.size)
          break;
        const last = ancestors[i - 1];
        last.children.delete(sequence[i - 1]);
        i -= 1;
      }
    }
  };
  var KeyboardService = class {
    constructor() {
      this._context = {};
      this._conditionData = {};
      this._dataCI = [];
      this._dataCS = [];
      this._rootCI = new KeyNode();
      this._rootCS = new KeyNode();
      this.options = {
        sequenceTimeout: 500
      };
      this._reset = () => {
        this._curCI = null;
        this._curCS = null;
        this._resetTimer();
      };
      this.handleKey = (e) => {
        if (!e.key || e.key.length > 1 && modifiers[e.key.toLowerCase()])
          return;
        this._resetTimer();
        const keyCS = reprKey(e.key, {
          c: e.ctrlKey,
          a: e.altKey,
          m: e.metaKey
        }, true);
        const keyCI = reprKey(e.key, {
          c: e.ctrlKey,
          s: e.shiftKey,
          a: e.altKey,
          m: e.metaKey
        });
        if (this.handleKeyOnce(keyCS, keyCI, false)) {
          e.preventDefault();
          this._reset();
        }
        this._timer = setTimeout(this._reset, this.options.sequenceTimeout);
      };
    }
    _resetTimer() {
      if (this._timer) {
        clearTimeout(this._timer);
        this._timer = null;
      }
    }
    _addCondition(condition) {
      let cache = this._conditionData[condition];
      if (!cache) {
        const value = parseCondition(condition);
        cache = {
          count: 0,
          value,
          result: this._evalCondition(value)
        };
        this._conditionData[condition] = cache;
      }
      cache.count += 1;
    }
    _removeCondition(condition) {
      const cache = this._conditionData[condition];
      if (cache) {
        cache.count -= 1;
        if (!cache.count) {
          delete this._conditionData[condition];
        }
      }
    }
    _evalCondition(conditions) {
      return conditions.every((cond) => {
        let value = this._context[cond.field];
        if (cond.not)
          value = !value;
        return value;
      });
    }
    _checkShortcut(item) {
      const cache = item.condition && this._conditionData[item.condition];
      const enabled = !cache || cache.result;
      if (item.enabled !== enabled) {
        item.enabled = enabled;
        this._enableShortcut(item);
      }
    }
    _enableShortcut(item) {
      const root = item.caseSensitive ? this._rootCS : this._rootCI;
      if (item.enabled) {
        root.add(item.sequence, item);
      } else {
        root.remove(item.sequence, item);
      }
    }
    enable() {
      this.disable();
      document.addEventListener("keydown", this.handleKey);
    }
    disable() {
      document.removeEventListener("keydown", this.handleKey);
    }
    register(key, callback, options) {
      const {
        caseSensitive,
        condition
      } = _extends({
        caseSensitive: false
      }, options);
      const sequence = normalizeSequence(key, caseSensitive);
      const data = caseSensitive ? this._dataCS : this._dataCI;
      const item = {
        sequence,
        condition,
        callback,
        enabled: false,
        caseSensitive
      };
      if (condition)
        this._addCondition(condition);
      this._checkShortcut(item);
      data.push(item);
      return () => {
        const index = data.indexOf(item);
        if (index >= 0) {
          data.splice(index, 1);
          if (condition)
            this._removeCondition(condition);
          item.enabled = false;
          this._enableShortcut(item);
        }
      };
    }
    setContext(key, value) {
      this._context[key] = value;
      for (const cache of Object.values(this._conditionData)) {
        cache.result = this._evalCondition(cache.value);
      }
      for (const data of [this._dataCS, this._dataCI]) {
        for (const item of data) {
          this._checkShortcut(item);
        }
      }
    }
    handleKeyOnce(keyCS, keyCI, fromRoot) {
      var _curCS, _curCI;
      let curCS = this._curCS;
      let curCI = this._curCI;
      if (fromRoot || !curCS && !curCI) {
        fromRoot = true;
        curCS = this._rootCS;
        curCI = this._rootCI;
      }
      if (curCS)
        curCS = curCS.get([keyCS]);
      if (curCI)
        curCI = curCI.get([keyCI]);
      const shortcuts = [...curCI ? curCI.shortcuts : [], ...curCS ? curCS.shortcuts : []].reverse();
      this._curCS = curCS;
      this._curCI = curCI;
      if (!fromRoot && !shortcuts.length && !((_curCS = curCS) != null && _curCS.children.size) && !((_curCI = curCI) != null && _curCI.children.size)) {
        return this.handleKeyOnce(keyCS, keyCI, true);
      }
      for (const shortcut of shortcuts) {
        try {
          shortcut.callback();
        } catch (_unused) {
        }
        return true;
      }
    }
  };
  var service;
  function getService() {
    if (!service) {
      service = new KeyboardService();
      service.enable();
    }
    return service;
  }
  var register = (...args) => getService().register(...args);

  // src/userscript.ts
  var Logger = class {
    constructor(level = 1 /* Info */) {
      this.level = level;
    }
    debug(data) {
      if (this.level <= 0 /* Debug */) {
        console.log(data);
      }
    }
    info(data) {
      if (this.level <= 1 /* Info */) {
        console.log(data);
      }
    }
  };
  var UserScriptEventListener = class {
    constructor(userscript, plugin, options) {
      this.userscript = userscript;
      this.logger = userscript.logger;
      this.plugin = plugin;
      this.options = options;
    }
    register() {
      const querySelectors = Array.isArray(this.options.querySelector) ? this.options.querySelector : [this.options.querySelector];
      let count = 0;
      for (const querySelector of querySelectors) {
        const elements = document.querySelectorAll(querySelector);
        for (const el of elements) {
          el.addEventListener(this.options.type, this.listener());
        }
        count = count + elements.length;
      }
      this.logger.debug(`Registered '${count}' event handlers for '${this.options.name}' (plugin: ${this.plugin.name})`);
    }
    listener() {
      const logger = this.logger;
      const plugin = this.plugin;
      const options = this.options;
      const register2 = () => this.userscript.registerListenersForPlugin(plugin);
      return function(event) {
        logger.debug(`handle called for '${options.name}' with delay of '${options.delay}'`);
        setTimeout(() => {
          logger.debug(`Started running plugin '${plugin.name}'`);
          plugin.run({ event, logger });
          logger.debug(`Finished running plugin '${plugin.name}'`);
          register2();
        }, options.delay);
      };
    }
  };
  var UserScript = class {
    constructor(logger) {
      this.logger = logger;
      this.context = { logger };
      this.eventListeners = {};
    }
    registerPlugin(plugin) {
      const matches = plugin.matches || (() => true);
      if (matches(window.location)) {
        const events = plugin.events || [];
        events.forEach((event) => this.registerEvent(plugin, event));
        this.logger.debug(`Started running plugin '${plugin.name}'`);
        plugin.run(this.context);
        this.logger.debug(`Finished running plugin '${plugin.name}'`);
      } else {
        this.logger.debug(`Skipping plugin '${plugin.name}' as matches returned false`);
      }
    }
    registerEvent(plugin, event) {
      this.logger.debug(`Registering event '${event.name}`);
      const listener = new UserScriptEventListener(this, plugin, event);
      listener.register();
      const listeners = this.eventListeners[plugin.name] || [];
      listeners.push(listener);
      this.eventListeners[plugin.name] = listeners;
    }
    registerShortcut(shortcut) {
      this.logger.debug(`Registering shortcut key '${shortcut.key}' and shortcut '${shortcut.name}'`);
      register(shortcut.key, shortcut.callback, shortcut.options);
    }
    registerListenersForPlugin(plugin) {
      const listeners = this.eventListeners[plugin.name] || [];
      for (const listener of listeners) {
        listener.register();
      }
    }
  };
  function userscript_default({
    name,
    plugins = [],
    shortcuts = [],
    logLevel = 1 /* Info */
  }) {
    const logger = new Logger(logLevel);
    const userscript = new UserScript(logger);
    logger.debug(`Started running userscript '${name}'`);
    plugins.forEach((plugin) => userscript.registerPlugin(plugin));
    shortcuts.forEach((shortcut) => userscript.registerShortcut(shortcut));
    logger.debug(`Finished running userscript '${name}'`);
  }

  // src/ggdeals/user.ts
  function requestSteamLink(a, title) {
    GM_xmlhttpRequest({
      method: "GET",
      url: `https://store.steampowered.com/search/suggest?term=${encodeURIComponent(title)}&f=games&cc=US`,
      responseType: "document",
      onload: (r) => {
        const d = r.response;
        const match = d.querySelector(".match");
        if (!match) {
          return;
        }
        const href = match.getAttribute("href");
        if (href) {
          a.setAttribute("href", href);
          a.setAttribute("target", "_blank");
        }
      }
    });
  }
  userscript_default({
    name: "gg.deals",
    logLevel: 1 /* Info */,
    shortcuts: [{
      name: "gg.deals search shortcut",
      key: "/",
      callback: () => {
        const input = document.querySelector("#global-search-input");
        if (input) {
          input.focus();
        }
      }
    }],
    plugins: [{
      name: "gg.deals steam links on bundle and deal pages",
      matches: (location) => !!location.pathname.match(/\/(bundle|deal|wallet-friendly)\/.+/),
      events: [{
        name: "gg.deals page navigation event",
        type: "click",
        delay: 2e3,
        querySelector: ".pjax-link"
      }, {
        name: "gg.deals filter change event",
        type: "click",
        delay: 2e3,
        querySelector: [".filter", ".badge-filter"]
      }],
      run: () => {
        const items = document.querySelectorAll(".game-item");
        for (const item of items) {
          const title = item.querySelector(".game-info-wrapper .game-info-title-wrapper a");
          if (!title || !title.textContent) {
            continue;
          }
          const a = item.querySelector("a");
          if (!a) {
            continue;
          }
          requestSteamLink(a, title.textContent);
        }
      }
    }, {
      name: "gg.deals steam links on blog pages",
      matches: (location) => !!location.pathname.match(/\/(blog)\/.+/),
      run: () => {
        const items = document.querySelectorAll(".game-items-header");
        for (const item of items) {
          const title = item.querySelector(".game-info .game-info-title-wrapper .game-info-title");
          if (!title || !title.hasAttribute("data-title-auto-hide")) {
            continue;
          }
          const a = item.querySelector("a");
          if (!a) {
            continue;
          }
          requestSteamLink(a, title.getAttribute("data-title-auto-hide") || "");
        }
      }
    }]
  });
})();
