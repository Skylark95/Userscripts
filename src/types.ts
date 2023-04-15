import { IShortcutOptions, register } from '@violentmonkey/shortcut';

export interface UserScriptShortcut {
  key: string;
  callback(): void
  options?: Partial<IShortcutOptions>;
}

export interface UserScriptPlugin {
  run: () => void;
  matches?: (location: Location) => boolean;
}

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

export class UserScript {
  plugins: UserScriptPlugin[] = [];
  shortcuts: UserScriptShortcut[] = [];
  logger = new Logger();

  run() {
    this.plugins.forEach(plugin => {
      const matches = plugin.matches || (() => true);
      if (matches(window.location)) {
        this.logger.debug(`Running plugin '${plugin.constructor.name}'`);
        plugin.run();
      }
    });
    this.shortcuts.forEach(shortcut => {
      this.logger.debug(`Registering shortcut key '${shortcut.key}' and shortcut '${shortcut.constructor.name}'`);
      register(shortcut.key, shortcut.callback, shortcut.options);
    });
  }
}
