import userscript from "../userscript";

userscript({
  name: 'steam',
  shortcuts: [{
    name: 'steam search shortcut',
    key: '/',
    callback: () => {
      const input = document.querySelector('#store_nav_search_term');
      if (input) {
        (input as HTMLElement).focus();
      }
    }
  }]
});
