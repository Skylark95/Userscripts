import userscript from "../userscript";

function requestSteamLink(a: HTMLAnchorElement, title: string) {
  GM_xmlhttpRequest({
    method: "GET",
    url: `https://store.steampowered.com/search/suggest?term=${encodeURIComponent(title)}&f=games&cc=US`,
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

userscript({
  name: 'gg.deals',
  shortcuts: [{
    name: 'gg.deals search shortcut',
    key: '/',
    callback: () => {
      const input = document.querySelector('#global-search-input');
      if (input) {
        (input as HTMLElement).focus();
      }
    }
  }],
  plugins: [{
    name: 'gg.deals steam links on bundle and deal pages',
    matches: (location: Location) => !!location.pathname.match(/\/(bundle|deal)\/.+/),
    events:[{
      name: 'gg.deals page navigation event',
      type: 'click',
      delay: 2000,
      querySelector: '.pjax-link'
    }],
    run: () => {
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
        requestSteamLink(a, title.textContent);
      }
    }
  }, {
    name: 'gg.deals steam links on blog pages',
    matches: (location: Location) => !!location.pathname.match(/\/(blog)\/.+/),
    run: () => {
      const items = document.querySelectorAll('.game-items-header');
      for (const item of items) {
        const title = item.querySelector('.game-info .game-info-title-wrapper .game-info-title');
        if (!title || !title.hasAttribute('data-title-auto-hide')) {
          continue;
        }
        const a = item.querySelector('a');
        if (!a) {
          continue;
        }
        requestSteamLink(a, title.getAttribute('data-title-auto-hide') || '');
      }
    }
  }]
});
