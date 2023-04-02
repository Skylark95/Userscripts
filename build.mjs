import * as esbuild from 'esbuild';
import { promises as fs } from 'fs';

const files = ['ggdeals', 'spotify', 'steam'];

await Promise.all(files.map(async (file) => {
  await esbuild.build({
    entryPoints: [`src/${file}/user.ts`],
    banner: { js: await fs.readFile(`src//${file}/meta.js`, { encoding: 'utf8' }) },
    bundle: true,
    legalComments: "inline",
    outfile: `dist/${file}.user.js`,
  });
}));
