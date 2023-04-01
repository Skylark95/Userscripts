// ==UserScript==
// @name        Steam Keyboard Shortcuts
// @namespace   https://github.com/Skylark95/Userscripts
// @match       https://store.steampowered.com/*
// @version     1.0
// @author      Derek Cochran
// @description Adds keyboard shortcuts to steam
// @require https://cdn.jsdelivr.net/npm/@violentmonkey/shortcut@1
// ==/UserScript==
function steam() {
    VM.shortcut.register('/', () => {
        const input = document.querySelector('#store_nav_search_term');
        if (input) {
            (input as HTMLElement).focus();
        }
    });
}
steam();