import { UserScript, UserScriptPlugin } from "../types";

class SpotifyStylePlugin implements UserScriptPlugin {
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