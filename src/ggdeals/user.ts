import { UserScript, UserScriptPlugin, UserScriptShortcut } from "../types";

class GGDealsSearchShortcut implements UserScriptShortcut {
  key = '/';
  callback() {
    const input = document.querySelector('#global-search-input');
    if (input) {
      (input as HTMLElement).focus();
    }
  }
}

class GGDealsSteamLinksPlugin implements UserScriptPlugin {
  matches(location: Location) {
    return !!location.pathname.match(/\/(bundle|deal)\/.+/);
  }
  run() {
    const items = document.querySelectorAll('.game-item');
    for (const item of items) {
      const title = item.querySelector('.game-info-wrapper .game-info-title-wrapper a');
      if (!title || !title.textContent) {
        continue;
      }
      const a = item.querySelector('a');
      if (!a) {
        continue;
      }
      GM_xmlhttpRequest({
        method: "GET",
        url: `https://store.steampowered.com/search/suggest?term=${encodeURIComponent(title.textContent)}&f=games&cc=US`,
        responseType: 'document',
        onload: r => {
          const d = r.response as Document;
          const match = d.querySelector('.match');
          if (!match) {
            return;
          }
          const href = match.getAttribute('href');
          if (href) {
            a.setAttribute('href', href);
            a.setAttribute('target', '_blank');
          }
        }
      });
    }
  }
}

class GGDeals extends UserScript {
  shortcuts = [new GGDealsSearchShortcut()];
  plugins = [new GGDealsSteamLinksPlugin()];
}

new GGDeals().run();