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

  run() {
    this.plugins.forEach(plugin => {
      if (plugin.matches(window.location)) {
        plugin.run();
      }
    });
    this.shortcuts.forEach(shortcut => {
      register(shortcut.key, shortcut.callback, shortcut.options);
    });
  }
}
