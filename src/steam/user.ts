import { UserScript, UserScriptShortcut } from "../types";

class SteamSearchShortcut implements UserScriptShortcut {
    key = '/';
    callback() {
      const input = document.querySelector('#store_nav_search_term');
      if (input) {
          (input as HTMLElement).focus();
      }
    }
}

class SteamUserScript extends UserScript {
  shortcuts = [new SteamSearchShortcut()];
}

new SteamUserScript().run();