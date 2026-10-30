// node scripts/layout-qa.mjs <CompId> <everyNth> <out.jsonl>
// Renders a low-res sampled pass with {probe: true} and saves every frame's label boxes.
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const [, , id, nth, outFile] = process.argv;
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve('build/qa-bundle')});
const inputProps = {probe: true};
const comp = await selectComposition({serveUrl, id, inputProps, browserExecutable: BROWSER});
const out = fs.createWriteStream(outFile);
await renderMedia({
  serveUrl,
  composition: comp,
  inputProps,
  codec: 'gif',
  everyNthFrame: Number(nth),
  scale: 0.2,
  outputLocation: 'out/qa/probe.gif',
  browserExecutable: BROWSER,
  concurrency: 4,
  muted: true,
  onBrowserLog: (log) => {
    if (log.text.startsWith('LAYOUT ')) out.write(log.text.slice(7) + '\n');
  },
});
out.end();
console.log('done');
