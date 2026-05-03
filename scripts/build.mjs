import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, relative } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

function minifyJsonFiles(srcDir, outDir) {
  mkdirSync(outDir, { recursive: true });
  for (const name of readdirSync(srcDir)) {
    const src = join(srcDir, name);
    if (statSync(src).isDirectory()) continue;
    if (!name.endsWith('.json')) continue;
    const text = readFileSync(src, 'utf8');
    writeFileSync(join(outDir, name), JSON.stringify(JSON.parse(text)));
  }
}

/** Non-module assets: HTML + compact JSON (esbuild does not emit these by default). */
const staticPlugin = {
  name: 'static-assets',
  setup(build) {
    build.onStart(() => {
      mkdirSync(dist, { recursive: true });
      for (const f of ['index.html', 'grammar.html', 'vocabulary.html', 'study.html']) {
        copyFileSync(join(root, f), join(dist, f));
      }
      minifyJsonFiles(join(root, 'data'), join(dist, 'data'));
    });
  },
};

async function main() {
  await esbuild.build({
    absWorkingDir: root,
    entryPoints: {
      'js/study': 'js/study.js',
      'js/list': 'js/list.js',
      'css/styles': 'css/styles.css',
    },
    outdir: 'dist',
    bundle: true,
    minify: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2020'],
    plugins: [staticPlugin],
  });

  console.log(`Built ${relative(process.cwd(), dist)}/ (esbuild: JS, CSS; plugin: HTML, JSON)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
