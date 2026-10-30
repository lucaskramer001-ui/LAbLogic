# Read layout.jsonl and report: labels cut by the frame, labels overlapping each other or the
# scientist's head/body, and text wider than its own pill.
import json, sys, collections
W, H, FPS = int(sys.argv[2]), int(sys.argv[3]), 60
issues = collections.defaultdict(list)
def inter(a, b):
    x0, y0 = max(a[0], b[0]), max(a[1], b[1]); x1, y1 = min(a[0] + a[2], b[0] + b[2]), min(a[1] + a[3], b[1] + b[3])
    return max(0, x1 - x0) * max(0, y1 - y0)
for line in open(sys.argv[1]):
    d = json.loads(line); f = d['f']; t = f / FPS
    items = d['items']
    for it in items:
        x, y, w, h = it['b']
        if it['k'] == 'sci':
            continue
        onscreen = x + w > 0 and y + h > 0 and x < W and y < H
        cut = x < -6 or y < -6 or x + w > W + 6 or y + h > H + 6
        if onscreen and cut:
            issues[('CUT', it['t'])].append(t)
        if it.get('inner'):
            tx, ty, tw, th, rx, ry, rw, rh = it['inner']
            if rw > 150 and tw > rw * 0.96:
                issues[('OVERFLOW', it['t'])].append(t)
    labels = [i for i in items if i['k'] != 'sci']
    for i in range(len(labels)):
        for j in range(i + 1, len(labels)):
            a, b = labels[i], labels[j]
            if a['t'] == b['t']:
                continue
            ov = inter(a['b'], b['b'])
            small = min(a['b'][2] * a['b'][3], b['b'][2] * b['b'][3])
            if small > 0 and ov / small > 0.04:
                issues[('OVERLAP', a['t'] + '  <>  ' + b['t'])].append(t)
    for s in [i for i in items if i['k'] == 'sci']:
        x, y, w, h = s['b']
        body = [x + w * 0.15, y, w * 0.7, h]
        for l in labels:
            ov = inter(body, l['b'])
            if l['b'][2] * l['b'][3] and ov / (l['b'][2] * l['b'][3]) > 0.06:
                issues[('ON SCIENTIST', l['t'])].append(t)
def ranges(ts):
    ts = sorted(ts); out = []; s = p = ts[0]
    for x in ts[1:]:
        if x - p > 0.5: out.append((s, p)); s = x
        p = x
    out.append((s, p)); return out
for (kind, what), ts in sorted(issues.items(), key=lambda kv: min(kv[1])):
    rs = ', '.join(f'{a:.1f}-{b:.1f}' for a, b in ranges(ts))
    print(f'{kind:12s} {what[:90]:90s} {rs}')
