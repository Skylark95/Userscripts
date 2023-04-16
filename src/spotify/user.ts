import userscript from "../userscript";

userscript({
  name: 'spotify',
  plugins: [{
    name: 'spotify style',
    run: () => {
      GM_addStyle(`
        .fyaNJr {
          font-size: 1rem !important
        }
      `);
    }
  }]
});
