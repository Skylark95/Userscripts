import { UserScript, UserScriptPlugin } from "../types";

class SpotifyStylePlugin implements UserScriptPlugin {
  matches() {
    return true;
  }
  run() {
    GM_addStyle(`
      .fyaNJr {
        font-size: 1rem !important
      }
    `);
  }
}

class SpotifyUserScript extends UserScript {
  plugins = [new SpotifyStylePlugin()];
}

new SpotifyUserScript().run();