// ==UserScript==
// @name        GG.Deals Steam Links
// @namespace   https://github.com/Skylark95/Userscripts
// @match       https://gg.deals/bundle/*
// @grant       GM_xmlhttpRequest
// @version     1.0
// @author      Derek Cochran
// @description Changes game links to steam on bundle pages

// ==/UserScript==
function ggdeals() {
    const items = document.querySelectorAll('.game-item');
    for(const item of items) {
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

ggdeals();