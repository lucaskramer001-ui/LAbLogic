// node scripts/stills.mjs out/qa/sheet.png t1 t2 ...  -> renders stills (scale 0.5) and a contact sheet
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const [, , sheet, ...times] = process.argv;
const outDir = path.dirname(sheet);
fs.mkdirSync(outDir, {recursive: true});
let serveUrl = 'build/bundle';
if (!fs.existsSync(serveUrl) || process.env.REBUNDLE) {
  serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve('build/bundle')});
}
const comp = await selectComposition({serveUrl, id: 'Iceberg', browserExecutable: BROWSER});
const files = [];
for (const t of times) {
  const frame = Math.min(comp.durationInFrames - 1, Math.round(parseFloat(t) * comp.fps));
  const f = path.join(outDir, `t${String(t).padStart(5, '0')}.png`);
  await renderStill({serveUrl, composition: comp, frame, output: f, scale: 0.5, browserExecutable: BROWSER});
  files.push(f);
}
// contact sheet with ffmpeg (labels are the file names in the order given)
const cols = Math.min(5, files.length);
const rows = Math.ceil(files.length / cols);
const inputs = files.flatMap((f) => ['-i', f]);
const pads = files.map((_, i) => `[${i}:v]scale=270:480,drawtext=text='${times[i]}':x=8:y=8:fontsize=26:fontcolor=white:box=1:boxcolor=black@0.6[v${i}]`).join(';');
const layout = files.map((_, i) => `${(i % cols) * 270}_${Math.floor(i / cols) * 480}`).join('|');
execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', `${pads};${files.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${files.length}:layout=${layout}:fill=black`, sheet]);
console.log('sheet', sheet, comp.durationInFrames, 'frames');
