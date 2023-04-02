// ==UserScript==
// @name        Steam Keyboard Shortcuts
// @namespace   https://github.com/Skylark95/Userscripts
// @match       https://store.steampowered.com/*
// @version     1.0
// @author      Derek Cochran
// @description Adds keyboard shortcuts to steam
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

  // src/types.ts
  var UserScript = class {
    constructor() {
      this.plugins = [];
      this.shortcuts = [];
    }
    run() {
      this.plugins.forEach((plugin) => {
        if (plugin.matches(window.location)) {
          plugin.run();
        }
      });
      this.shortcuts.forEach((shortcut) => {
        register(shortcut.key, shortcut.callback, shortcut.options);
      });
    }
  };

  // src/steam/user.ts
  var SteamSearchShortcut = class {
    constructor() {
      this.key = "/";
    }
    callback() {
      const input = document.querySelector("#store_nav_search_term");
      if (input) {
        input.focus();
      }
    }
  };
  var SteamUserScript = class extends UserScript {
    constructor() {
      super(...arguments);
      this.shortcuts = [new SteamSearchShortcut()];
    }
  };
  new SteamUserScript().run();
})();
