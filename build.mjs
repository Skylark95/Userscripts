import * as esbuild from 'esbuild';
import { promises as fs } from 'fs';
import process from 'process';

const files = (await fs.readdir('src', { withFileTypes: true}))
  .filter(file => file.isDirectory())
  .map(file => file.name);

const options = await Promise.all(files.map(async (file) => {
  return {
    entryPoints: [`src/${file}/user.ts`],
    banner: { js: await fs.readFile(`src//${file}/meta.js`, { encoding: 'utf8' }) },
    bundle: true,
    legalComments: "inline",
    outfile: `dist/${file}.user.js`,
  };
}));

if (process.argv.length > 2 && process.argv[2] == '--watch') {
  await Promise.all(options.map(async (opt) => {
    const ctx = await esbuild.context(opt);
    return await ctx.watch();
  }));
} else {
  await Promise.all(options.map(async (opt) => {
    const result = await esbuild.build(opt);
    console.log({
      entryPoints: opt.entryPoints,
      result: result
    });
  }));
}


