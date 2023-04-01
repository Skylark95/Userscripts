// ==UserScript==
// @name        Spotify Styles
// @namespace   https://github.com/Skylark95/Userscripts
// @match       https://open.spotify.com/*
// @grant       GM_addStyle
// @version     1.0
// @author      Derek Cochran
// @description Personal style changes for Spotify
// ==/UserScript==
function spotify() {
    GM_addStyle(`
    .fyaNJr {
      font-size: 1rem !important
    }
  `);
}
spotify();
