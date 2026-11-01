# Build an SRT from words.json (voice-over word timings) plus the audio offset in the video.
# usage: python3 srt.py words.json OFFSET out.srt
import json, sys
words = json.load(open(sys.argv[1])); off = float(sys.argv[2]); out = sys.argv[3]
def ts(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
cues, cur = [], []
for w in words:
    cur.append(w)
    text = ' '.join(x['w'] for x in cur)
    end_sentence = w['w'][-1] in '.?!'
    if end_sentence or len(text) > 70 or (w['w'][-1] == ',' and len(text) > 40):
        cues.append(cur); cur = []
if cur: cues.append(cur)
with open(out, 'w') as f:
    for i, c in enumerate(cues, 1):
        text = ' '.join(x['w'] for x in c)
        if len(text) > 42:  # two lines
            mid = len(text) // 2; cut = text.rfind(' ', 0, mid + 8)
            text = text[:cut] + '\n' + text[cut + 1:]
        end = c[-1]['e'] + off + 0.15
        if i < len(cues): end = min(end, cues[i][0]['s'] + off - 0.02)
        f.write(f"{i}\n{ts(c[0]['s'] + off)} --> {ts(end)}\n{text}\n\n")
print(len(cues), 'cues')
