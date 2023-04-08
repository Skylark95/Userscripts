import { IShortcutOptions, register } from '@violentmonkey/shortcut';

export interface UserScriptShortcut {
  key: string;
  callback(): void
  options?: Partial<IShortcutOptions>;
}

export interface UserScriptPlugin {
  matches: (location: Location) => boolean;
  run: () => void;
}

export class UserScript {
  plugins: UserScriptPlugin[] = [];
  shortcuts: UserScriptShortcut[] = [];
  debug = false;

  run() {
    this.plugins.forEach(plugin => {
      if (plugin.matches(window.location)) {
        if (this.debug) {
          console.log(`Running plugin '${plugin.constructor.name}'`);
        }
        plugin.run();
      }
    });
    this.shortcuts.forEach(shortcut => {
      if (this.debug) {
        console.log(`Registering shortcut key '${shortcut.key}' and shortcut '${shortcut.constructor.name}'`);
      }
      register(shortcut.key, shortcut.callback, shortcut.options);
    });
  }
}
