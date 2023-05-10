import { IShortcutOptions, register } from '@violentmonkey/shortcut';

export enum LogLevel {
  Debug,
  Info
}

export class Logger {
  level: LogLevel;

  constructor(level = LogLevel.Info) {
    this.level = level;
  }

  debug(data: string) {
    if (this.level <= LogLevel.Debug) {
      console.log(data);
    }
  }

  info(data: string) {
    if (this.level <= LogLevel.Info) {
      console.log(data);
    }
  }
}

export type UserScriptContext = {
  logger: Logger,
  event?: Event
}

export type UserScriptEventOptions = {
  name: string;
  type: string;
  querySelector: string | string[];
  delay: number;
}

export type UserScriptShortcut = {
  name: string;
  key: string;
  callback(): void
  options?: Partial<IShortcutOptions>;
}

export type UserScriptPlugin = {
  name: string;
  run: (context: UserScriptContext) => void;
  matches?: (location: Location) => boolean;
  events?: UserScriptEventOptions[];
}

export type UserScriptOptions = {
  name: string;
  plugins?: UserScriptPlugin[];
  events?: UserScriptEventOptions[];
  shortcuts?: UserScriptShortcut[];
  logLevel?: LogLevel;
}

class UserScriptEventListener {
  logger: Logger;
  plugin: UserScriptPlugin;
  options: UserScriptEventOptions;

  constructor(logger: Logger, plugin: UserScriptPlugin, options: UserScriptEventOptions) {
    this.logger = logger;
    this.plugin = plugin;
    this.options = options;
  }

  register() {
    const querySelectors = Array.isArray(this.options.querySelector) ? this.options.querySelector : [this.options.querySelector];
    let count = 0;
    for (const querySelector of querySelectors)  {
      const elements = document.querySelectorAll(querySelector);
      for (const el of elements) {
        el.addEventListener(this.options.type, this.listener());
      }
      count = count + elements.length;
    }
    this.logger.debug(`Registered '${count}' event handlers for '${this.options.name}'`);
  }

  listener() {
    const logger = this.logger;
    const plugin = this.plugin;
    const options = this.options;
    const register = () => this.register();
    return function(event: Event) {
      logger.debug(`handle called for '${options.name}' with delay of '${options.delay}'`);
      setTimeout(() => {
        logger.debug(`Started running plugin '${plugin.name}'`);
        plugin.run({event, logger});
        logger.debug(`Finished running plugin '${plugin.name}'`);
        register();
      }, options.delay);
    };
  }
}

class UserScript {
  logger: Logger;
  context: UserScriptContext;

  constructor(logger: Logger) {
    this.logger = logger;
    this.context = { logger };
  }

  registerPlugin(plugin: UserScriptPlugin) {
    const matches = plugin.matches || (() => true);
    if (matches(window.location)) {
      const events = plugin.events || [];
      events.forEach(event => this.registerEvent(plugin, event));
      this.logger.debug(`Started running plugin '${plugin.name}'`);
      plugin.run(this.context);
      this.logger.debug(`Finished running plugin '${plugin.name}'`);
    } else {
      this.logger.debug(`Skipping plugin '${plugin.name}' as matches returned false`);
    }
  }

  registerEvent(plugin: UserScriptPlugin, event: UserScriptEventOptions) {
    this.logger.debug(`Registering event '${event.name}`);
    const listener = new UserScriptEventListener(this.logger, plugin, event);
    listener.register();
  }

  registerShortcut(shortcut: UserScriptShortcut) {
    this.logger.debug(`Registering shortcut key '${shortcut.key}' and shortcut '${shortcut.name}'`);
    register(shortcut.key, shortcut.callback, shortcut.options);
  }
}


export default function ({
  name, 
  plugins = [], 
  shortcuts = [],
  logLevel = LogLevel.Info
}: UserScriptOptions) {
  const logger = new Logger(logLevel);
  const userscript = new UserScript(logger);
  logger.debug(`Started running userscript '${name}'`);
  plugins.forEach(plugin => userscript.registerPlugin(plugin));
  shortcuts.forEach(shortcut => userscript.registerShortcut(shortcut));
  logger.debug(`Finished running userscript '${name}'`);
}

