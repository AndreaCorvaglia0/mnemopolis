"""Mnemopolis README banner: pixel art on a 320x100 grid, upscaled 4x.

Run from the repository root: python assets/make_banner.py

Outputs:
  assets/mnemopolis-banner.png   static banner (1280x400)
  assets/mnemopolis-banner.svg   same picture + light animations (stars, windows,
                              lighthouse, river shimmer, shooting star, title glint)
"""
import base64, io, math, random
from PIL import Image

W, H, S = 320, 100, 4
random.seed(7)

def hx(c):
    c = c.lstrip('#'); return tuple(int(c[i:i+2], 16) for i in (0, 2, 4))

def mix(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))

BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
def bay(x, y): return (BAYER[y % 4][x % 4] + 0.5) / 16

img = [[hx('#000000')] * W for _ in range(H)]
def put(x, y, c):
    if 0 <= x < W and 0 <= y < H: img[y][x] = hx(c) if isinstance(c, str) else c
def get(x, y): return img[y][x]
def lighten(x, y, col, t):
    if 0 <= x < W and 0 <= y < H: img[y][x] = mix(img[y][x], hx(col), t)

overlay = {'twinkle': [], 'flicker': [], 'lamps': [], 'shimmer': [], 'beam': []}

# ---------------------------------------------------------------- sky
SKY = ['#06051a', '#0b0926', '#110e33', '#181341', '#21184e', '#2c1d5a', '#3b2365',
       '#4e2a6e', '#653274', '#7d3b76']
for y in range(H):
    f = min(1.0, (y / 80) ** 1.5) * (len(SKY) - 1)
    b = int(f); fr = f - b
    for x in range(W):
        c = SKY[min(b + 1, len(SKY) - 1)] if fr > bay(x, y) else SKY[b]
        put(x, y, c)

# ---------------------------------------------------------------- moon
MX, MY, MR = 274, 19, 8
for y in range(MY - 15, MY + 16):
    for x in range(MX - 15, MX + 16):
        d = math.hypot(x - MX, y - MY)
        if MR < d <= MR + 6:  # dithered halo
            t = 1 - (d - MR) / 6
            if t * 0.8 > bay(x, y): lighten(x, y, '#8a86c8', 0.28)
for y in range(MY - MR, MY + MR + 1):
    for x in range(MX - MR, MX + MR + 1):
        d = math.hypot(x - MX, y - MY)
        if d <= MR:
            shade = (x - MX) * -0.6 + (y - MY) * 0.5  # lit from upper right
            c = '#f4efd2' if shade < 2 else ('#ddd5b0' if shade < 5 else '#bdb393')
            if d > MR - 0.9: c = '#cfc6a2'
            put(x, y, c)
for cx, cy, r in [(271, 16, 1.6), (277, 22, 1.2), (276, 15, 0.8), (270, 22, 0.9)]:
    for y in range(int(cy - 2), int(cy + 3)):
        for x in range(int(cx - 2), int(cx + 3)):
            if math.hypot(x - cx, y - cy) <= r: put(x, y, '#c6bd99')

# ---------------------------------------------------------------- title mask (needed to keep stars off it)
G = {
 'M': ["##...##", "###.###", "#######", "##.#.##", "##...##", "##...##", "##...##", "##...##", "##...##"],
 'N': ["##...##", "###..##", "###..##", "####.##", "##.####", "##..###", "##..###", "##...##", "##...##"],
 'E': ["#######", "#######", "##.....", "##.....", "######.", "##.....", "##.....", "#######", "#######"],
 'O': [".#####.", "#######", "##...##", "##...##", "##...##", "##...##", "##...##", "#######", ".#####."],
 'P': ["######.", "#######", "##...##", "##...##", "#######", "######.", "##.....", "##.....", "##....."],
 'L': ["##.....", "##.....", "##.....", "##.....", "##.....", "##.....", "##.....", "#######", "#######"],
 'I': ["######", "######", "..##..", "..##..", "..##..", "..##..", "..##..", "######", "######"],
 'S': [".######", "#######", "##.....", "##.....", ".#####.", ".....##", ".....##", "#######", "######."],
}
TITLE = "MNEMOPOLIS"
GAP = 2
tw_ = sum(len(G[c][0]) * 2 for c in TITLE) + GAP * (len(TITLE) - 1)
TX, TY = (W - tw_) // 2, 9
mask = set()
cx = TX
letter_boxes = []
for ch in TITLE:
    g = G[ch]; gw = len(g[0])
    for r, row in enumerate(g):
        for c, v in enumerate(row):
            if v == '#':
                for dy in (0, 1):
                    for dx in (0, 1):
                        mask.add((cx + c * 2 + dx, TY + r * 2 + dy))
    letter_boxes.append((cx, gw * 2))
    cx += gw * 2 + GAP
title_zone = (TX - 6, TY - 4, TX + tw_ + 6, TY + 38)

# ---------------------------------------------------------------- stars
def in_title(x, y):
    return title_zone[0] <= x <= title_zone[2] and title_zone[1] <= y <= title_zone[3]
stars = []
while len(stars) < 70:
    x, y = random.randrange(2, W - 2), int(random.random() ** 1.3 * 58) + 1
    if in_title(x, y) or math.hypot(x - MX, y - MY) < MR + 7: continue
    stars.append((x, y))
for i, (x, y) in enumerate(stars):
    c = random.choice(['#ffffff', '#c9d2ff', '#ffe9c4', '#9fa8e8', '#7d84c4'])
    if i % 5 == 0:
        overlay['twinkle'].append((x, y, 'cross'))
        put(x, y, '#6f74b8')
    elif i % 5 == 1:
        overlay['twinkle'].append((x, y, 'dot'))
        put(x, y, '#5b5f9e')
    else:
        put(x, y, c)

# ---------------------------------------------------------------- wispy clouds
for (cx0, cy0, ln) in [(40, 44, 70), (190, 47, 90), (232, 27, 50)]:
    for x in range(cx0, cx0 + ln):
        t = math.sin(math.pi * (x - cx0) / ln)
        for dy in range(-1, 2):
            y = cy0 + dy + int(1.2 * math.sin(x / 9))
            if in_title(x, y) or math.hypot(x - MX, y - MY) < MR + 1: continue
            if t * (0.75 if dy == 0 else 0.35) > bay(x, y): lighten(x, y, '#8d6fb0', 0.22)

# ---------------------------------------------------------------- hills
for x in range(W):
    yf = int(64 + 4 * math.sin(x / 23) + 2 * math.sin(x / 7 + 1) + 1.5 * math.sin(x / 3.1))
    for y in range(yf, H):
        put(x, y, '#1c1544' if y > yf else '#2c2263')
    ym = int(72 + 3 * math.sin(x / 17 + 2) + 1.5 * math.sin(x / 5 + 0.3))
    for y in range(ym, H):
        put(x, y, '#140f35' if y > ym else '#211a4f')
# distant lights on the far hills
for _ in range(16):
    x = random.randrange(4, W - 4)
    yf = int(64 + 4 * math.sin(x / 23) + 2 * math.sin(x / 7 + 1) + 1.5 * math.sin(x / 3.1))
    put(x, yf + random.randrange(2, 5), random.choice(['#a5733f', '#8e5c3a', '#c48a45']))

GROUND = 84  # first quay row
BODY, BODY_LIT, ROOF, ROOF_LIT = '#0f0b29', '#1f1948', '#18123a', '#3b3372'
WIN_ON, WIN_ON2, WIN_OFF = '#ffd06a', '#f0a54a', '#1b1640'

def windows(x0, x1, y0, y1, p=0.5, step=(3, 3), tall=1, colors=(WIN_ON, WIN_ON2), flick=0.12):
    for y in range(y0, y1 - tall + 1, step[1]):
        for x in range(x0, x1 + 1, step[0]):
            lit = random.random() < p
            for t in range(tall):
                put(x, y + t, random.choice(colors) if lit else WIN_OFF)
            if lit and random.random() < flick:
                overlay['flicker'].append((x, y, tall))

ROOFS = [('#2a2462', '#4f48a6'), ('#3a1d40', '#6a3460'), ('#232a55', '#46579a')]
def house(x, w, h, roof='gable', dark=False, p=0.5):
    global ROOF, ROOF_LIT
    ROOF, ROOF_LIT = ('#0d0a26', '#1d1748') if dark else random.choice(ROOFS)
    body = '#0a0820' if dark else '#14103a'
    side = '#110d2e' if dark else '#2a2358'
    top = GROUND - h
    for y in range(top, GROUND):
        for xx in range(x, x + w):
            put(xx, y, side if xx == x + w - 1 else body)
    if roof == 'gable':
        rh = (w + 2) // 2
        for i in range(rh):
            y = top - 1 - i
            l, r = x - 1 + i, x + w - i
            for xx in range(l, r + 1):
                put(xx, y, ROOF_LIT if (xx == r or (xx >= (l + r) / 2 and i == rh - 1) or i == 0) else ROOF)
        put(x + w - 3, top - rh + 1, '#0b0822')  # chimney
        put(x + w - 3, top - rh, '#0b0822')
    elif roof == 'flat':
        for xx in range(x - 1, x + w + 1):
            put(xx, top - 1, ROOF_LIT if xx >= x + w - 2 else ROOF)
    elif roof == 'hip':
        for i in range(3):
            for xx in range(x - 1 + i * 2, x + w + 1 - i * 2):
                put(xx, top - 1 - i, ROOF_LIT if xx >= x + w - 1 - i * 2 else ROOF)
    if w >= 5 and h >= 5:
        windows(x + 1, x + w - 2, top + 2, GROUND - 2, p=p * (0.5 if dark else 1),
                step=(2 if w < 7 else 3, 3), tall=1 if dark else 2)

def cypress(x, h):
    for i in range(h):
        y = GROUND - 1 - i
        half = 1 if i < h - 3 else 0
        if i < 2: half = 0
        for xx in range(x - half, x + half + 1):
            put(xx, y, '#16304a' if xx == x + half and half else '#0b1a2b')
    put(x, GROUND - h - 1, '#0b1a2b')

def round_tree(x, y, r):
    for yy in range(y - r, y + r + 1):
        for xx in range(x - r, x + r + 1):
            d = math.hypot(xx - x, (yy - y) * 1.1)
            if d <= r + 0.3:
                hl = (xx - x) - (yy - y) > r * 0.6
                put(xx, yy, '#1a3a52' if hl and bay(xx, yy) < 0.6 else '#0c1d30')
    for yy in range(y + r, GROUND):
        put(x, yy, '#0a0818')

# ---------------------------------------------------------------- back row of houses (darker, taller)
for x in list(range(28, 132, 9)) + list(range(186, 236, 9)) + list(range(266, 316, 9)):
    house(x + random.randrange(-2, 3), random.randrange(7, 10), random.randrange(13, 19),
          roof=random.choice(['gable', 'gable', 'hip', 'flat']), dark=True)

# ---------------------------------------------------------------- lighthouse (left)
LX = 15
for y in range(52, GROUND + 1):
    w = 6 if y > 72 else (5 if y > 62 else 4)
    x0 = LX - w // 2
    band = ((y - 52) // 4) % 2
    for xx in range(x0, x0 + w):
        c = ('#6a2840' if band else '#4a4488')
        if xx == x0 + w - 1: c = '#a2405a' if band else '#7d78c0'
        if xx == x0: c = '#3a1830' if band else '#2c2860'
        put(xx, y, c)
for y in (60, 70): put(LX, y, WIN_ON)
for xx in range(LX - 4, LX + 4): put(xx, 51, '#2f2766')        # gallery
for xx in range(LX - 4, LX + 4, 2): put(xx, 50, '#2f2766')
for y in range(46, 50):
    for xx in range(LX - 2, LX + 2): put(xx, y, '#fff2b8' if y > 46 else '#ffe08a')
for i, y in enumerate(range(43, 46)):
    for xx in range(LX - 3 + i, LX + 3 - i): put(xx, y, '#1a1440')
put(LX - 1, 42, '#1a1440')
LAMP = (LX - 0.5, 47.5)
for yy in range(40, 56):
    for xx in range(LX - 9, LX + 9):
        d = math.hypot(xx - LAMP[0], yy - LAMP[1])
        if 2.5 < d < 8 and (1 - d / 8) * 0.8 > bay(xx, yy): lighten(xx, yy, '#ffe7a0', 0.3)
# beam (overlay only, dithered wedge to the right)
for x in range(LX + 3, 92):
    t = (x - LX) / 92
    spread = 0.7 + t * 6
    for y in range(int(47.5 - spread), int(47.5 + spread) + 1):
        if in_title(x, y): continue
        k = 1 - abs(y - 47.5) / (spread + 0.5)
        if k * (1 - t) * 1.2 > bay(x, y):
            overlay['beam'].append((x, y))
# rocks under lighthouse
for x in range(LX - 7, LX + 8):
    top = GROUND - 2 + int(abs(x - LX) / 3)
    for y in range(top, GROUND + 4 - int(abs(x - LX) / 4)):
        put(x, y, '#3b3478' if (y == top or (x + 2 * y) % 7 == 0) else '#1e1846')

# ---------------------------------------------------------------- front houses
front = [(26, 9, 9, 'gable'), (37, 8, 12, 'gable'), (47, 10, 8, 'hip'), (59, 7, 11, 'gable'),
         (68, 9, 9, 'gable'), (79, 8, 13, 'flat'), (89, 11, 9, 'gable'), (119, 9, 10, 'gable'),
         (190, 8, 10, 'gable'), (200, 10, 8, 'hip'), (212, 8, 12, 'gable'), (222, 9, 9, 'gable'),
         (266, 9, 10, 'gable'), (277, 8, 13, 'flat'), (287, 10, 9, 'gable'), (299, 8, 11, 'gable'),
         (309, 9, 8, 'hip')]

# clock tower
CT = 104
for y in range(54, GROUND):
    for xx in range(CT, CT + 7):
        put(xx, y, BODY_LIT if xx == CT + 6 else BODY)
for i in range(6):
    for xx in range(CT - 1 + i, CT + 8 - i):
        put(xx, 53 - i, ROOF_LIT if xx >= CT + 7 - i - 1 else ROOF)
put(CT + 3, 47, '#0b0822'); put(CT + 3, 46, '#ffd06a')
for y in range(56, 61):
    for xx in range(CT + 1, CT + 6):
        if math.hypot(xx - (CT + 3), y - 58) <= 2.2: put(xx, y, '#f6e3a6')
put(CT + 3, 57, '#2a1d2e'); put(CT + 3, 58, '#2a1d2e'); put(CT + 4, 58, '#2a1d2e')
windows(CT + 2, CT + 4, 64, GROUND - 3, p=0.7, step=(2, 4), tall=2)

# ---------------------------------------------------------------- memory palace (centre)
PX0, PX1 = 138, 182
for y in range(69, GROUND):
    for xx in range(PX0, PX1 + 1):
        put(xx, y, BODY_LIT if xx >= PX1 - 1 else BODY)
for y in (GROUND - 2, GROUND - 1):                 # steps
    for xx in range(PX0 - 2 + (GROUND - 1 - y), PX1 + 3 - (GROUND - 1 - y)):
        put(xx, y, '#2a2358' if y == GROUND - 2 else '#211b4a')
for xx in range(PX0 - 1, PX1 + 2): put(xx, 68, '#2e2766')   # cornice
for xx in range(PX0, PX1 + 1, 3):                  # colonnade with warm light between
    for y in range(71, GROUND - 2): put(xx, y, '#2c2560')
for xx in range(PX0 + 1, PX1, 3):
    for y in range(72, GROUND - 3):
        put(xx, y, '#ffcc66' if y < 75 else '#f2a347')
        put(xx + 1, y, '#e09040' if y < 75 else '#b86a35')
    if random.random() < 0.25: overlay['flicker'].append((xx, 72, 6))
# pediment
for i in range(6):
    for xx in range(150 + i, 171 - i): put(xx, 67 - i, ROOF_LIT if xx > 166 - i else '#221b4d')
put(160, 64, '#ffd06a')
# drum
for y in range(56, 62):
    for xx in range(152, 169): put(xx, y, BODY_LIT if xx >= 167 else BODY)
for xx in range(154, 167, 3):
    put(xx, 57, WIN_ON); put(xx, 58, WIN_ON2); put(xx, 59, WIN_ON2)
for xx in range(151, 170): put(xx, 55, '#2e2766')
# copper-green dome
for y in range(46, 55):
    for xx in range(151, 170):
        d = math.hypot((xx - 160) / 9, (y - 55) / 9)
        if d <= 1.0:
            hl = (xx - 160) * 0.7 - (y - 55) * 0.3
            c = '#173447'
            if hl > 3: c = '#2b5d6e'
            if hl > 5.5 and bay(xx, y) < 0.7: c = '#4d8f95'
            if d > 0.93: c = '#0f2635'
            put(xx, y, c)
for y in (51, 52): put(160, y, '#0f2635')
for y in range(43, 46):
    for xx in range(159, 162): put(xx, y, '#fff0b0' if y == 44 else '#173447')
put(160, 42, '#173447'); put(160, 41, '#4d8f95')
overlay['lamps'].append((160, 44, 2))

# cypresses around the palace
for x, h in [(133, 15), (136, 18), (185, 17), (188, 14)]:
    cypress(x, h)

# ---------------------------------------------------------------- castle-museum (right)
CX0 = 240
for y in range(68, GROUND):                        # wall
    for xx in range(CX0, CX0 + 24): put(xx, y, BODY_LIT if xx >= CX0 + 22 else BODY)
for xx in range(CX0, CX0 + 24, 2): put(xx, 67, BODY)
for tx in (CX0 - 2, CX0 + 20):                     # towers
    for y in range(58, GROUND):
        for xx in range(tx, tx + 6): put(xx, y, BODY_LIT if xx == tx + 5 else BODY)
    for i in range(8):
        for xx in range(tx - 1 + (i + 1) // 2, tx + 7 - (i + 1) // 2):
            put(xx, 57 - i, '#3b3372' if xx >= tx + 3 else '#211a4c')
    put(tx + 3, 49, '#0b0822'); put(tx + 3, 48, '#0b0822')
    put(tx + 4, 48, '#d4504a'); put(tx + 5, 48, '#d4504a'); put(tx + 4, 49, '#9c3440')
    put(tx + 2, 62, '#ff9a3c'); put(tx + 2, 63, '#e86f2e')
    overlay['flicker'].append((tx + 2, 62, 2))
# big fire-lit gate and windows
for y in range(75, GROUND):
    for xx in range(CX0 + 8, CX0 + 16):
        if y == 75 and xx in (CX0 + 8, CX0 + 9, CX0 + 14, CX0 + 15): continue
        if y == 76 and xx in (CX0 + 8, CX0 + 15): continue
        c = '#ffe08a' if y < 78 else ('#ffaa45' if y < 81 else '#e0662e')
        if (xx - CX0) % 2 == 1 and y > 76: c = '#5a2a2a'
        if y == 79: c = '#5a2a2a'
        put(xx, y, c)
for xx in range(CX0 + 7, CX0 + 17): put(xx, 74, '#2e2766')
for yy in range(70, GROUND + 1):
    for xx in range(CX0 + 3, CX0 + 21):
        d = math.hypot(xx - (CX0 + 11.5), (yy - 83) * 0.8)
        if 4.5 < d < 9 and (1 - d / 9) * 0.6 > bay(xx, yy) and get(xx, yy) != hx('#ffe08a'): lighten(xx, yy, '#ff9a3c', 0.25)
overlay['flicker'].append((CX0 + 10, 77, 2))
windows(CX0 + 3, CX0 + 20, 70, 74, p=0.8, step=(4, 4), tall=2, colors=('#ff9a3c', '#f07a34'), flick=0.4)

for x, w, h, r in front:
    house(x, w, h, r)

for x, y, r in [(100, 79, 3), (115, 80, 3), (196, 80, 2), (233, 79, 3), (263, 80, 3), (296, 79, 3), (56, 79, 2)]:
    round_tree(x, y, r)

# ---------------------------------------------------------------- quay + lamps
for x in range(LX + 8, W):
    put(x, GROUND, '#2e2766')
    put(x, GROUND + 1, '#1c1744' if x % 5 else '#120e30')
for x in range(34, W - 4, 26):
    for y in range(78, GROUND): put(x, y, '#0a0818')
    put(x, 76, '#0a0818'); put(x, 77, '#ffe08a')
    overlay['lamps'].append((x, 77, 3))
    for yy in range(73, 82):
        for xx in range(x - 4, x + 5):
            d = math.hypot(xx - x, (yy - 77) * 1.2)
            if 0 < d < 4 and (1 - d / 4) * 0.9 > bay(xx, yy):
                lighten(xx, yy, '#ffb85c', 0.35)

# ---------------------------------------------------------------- river: reflection of everything above the quay
WATER_TOP = GROUND + 2
WATER = hx('#0a0e2c')
src = [row[:] for row in img]
for y in range(WATER_TOP, H):
    k = y - WATER_TOP
    sy = GROUND - 1 - k
    shift = int(round(1.4 * math.sin(y * 1.7)))
    for x in range(W):
        if x < LX + 8 and y < GROUND + 4: continue  # rocks stay
        c = src[sy][(x + shift) % W]
        lum = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]
        fade = 0.55 + k * 0.02
        if lum > 140: fade = 0.25 + k * 0.03
        if lum > 140 and y % 2 == 1 and bay(x, y) < 0.5: fade = 0.6
        img[y][x] = mix(c, WATER, min(fade, 0.92))
# moon reflection
for y in range(WATER_TOP + 1, H, 2):
    half = 1 + (y - WATER_TOP) // 4
    j = random.randrange(-1, 2)
    for x in range(MX - half + j, MX + half + j + 1):
        if random.random() < 0.7: lighten(x, y, '#c9ccff', 0.42)
# ripple lines + shimmer anchors
for _ in range(60):
    x, y = random.randrange(0, W - 6), random.randrange(WATER_TOP + 1, H)
    for xx in range(x, x + random.randrange(2, 6)): lighten(xx, y, '#3a4c9c', 0.35)
for _ in range(26):
    x, y = random.randrange(10, W - 10), random.randrange(WATER_TOP + 1, H - 1)
    overlay['shimmer'].append((x, y, random.randrange(2, 5)))
for x, _, _ in [l for l in overlay['lamps'] if l[1] == 77]:
    for y in range(WATER_TOP + 1, H, 2):
        overlay['shimmer'].append((x - 1 + random.randrange(0, 2), y, 2))

# small boat with lantern
BX = 200
for xx in range(BX - 5, BX + 6): put(xx, 93, '#3d3680' if xx > BX - 4 else '#2a2560')
for xx in range(BX - 4, BX + 5): put(xx, 94, '#0a0818')
put(BX - 6, 92, '#120d2c'); put(BX + 6, 92, '#120d2c')
for y in (89, 90, 91, 92): put(BX + 2, y, '#0a0818')
put(BX + 3, 89, '#ffd06a'); overlay['lamps'].append((BX + 3, 89, 2))
for y in range(96, H, 2): lighten(BX + 3 + (y % 3) - 1, y, '#ffb85c', 0.45)

# foreground reeds framing
for x in list(range(0, 12)) + list(range(306, 320)):
    edge = x if x < 12 else 319 - x
    top = H - 3 - int((12 - edge) * 0.8) - random.randrange(0, 4)
    for y in range(max(top, 80), H):
        put(x, y, '#05040f')
    if random.random() < 0.3: put(x, max(top, 80) - 1, '#05040f')

# ---------------------------------------------------------------- title
OUT, EXT = '#130a1f', ['#b2472f', '#86303a', '#5a2140']
FACE = ['#fff6d6', '#ffe08a', '#ffc04d', '#f59a3a', '#df6c2e']
ext_px = {}
for d in (1, 2, 3):
    for (x, y) in mask:
        p = (x, y + d)
        if p not in mask and p not in ext_px: ext_px[p] = EXT[d - 1]
solid = set(mask) | set(ext_px)
# soft glow then outline
for (x, y) in list(solid):
    for dx in range(-3, 4):
        for dy in range(-3, 4):
            p = (x + dx, y + dy)
            if p in solid: continue
            d = math.hypot(dx, dy)
            if 1.5 < d <= 3.2 and (1 - d / 3.4) * 0.45 > bay(*p):
                lighten(p[0], p[1], '#6a3f8c', 0.18)
for (x, y) in solid:
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, 1), (1, -1), (-1, -1)):
        p = (x + dx, y + dy)
        if p not in solid: put(p[0], p[1], OUT)
for p, c in ext_px.items(): put(p[0], p[1], c)
for (x, y) in mask:
    r = y - TY
    f = r / 18 * (len(FACE) - 1)
    b = int(f); fr = f - b
    c = FACE[min(b + 1, 4)] if fr > bay(x, y) else FACE[b]
    if (x, y - 1) not in mask: c = '#fffdf2'
    elif (x - 1, y) not in mask and r < 12: c = mix(hx(c), hx('#ffffff'), 0.35)
    if (x, y + 1) not in mask and (x, y - 1) in mask: c = '#c4552a'
    put(x, y, c)
# glint points on letter corners (overlay)
glints = [(letter_boxes[0][0] + 1, TY + 1), (letter_boxes[4][0] + 10, TY + 2),
          (letter_boxes[9][0] + 12, TY + 3)]

# ---------------------------------------------------------------- subtitle
F3 = {
 'A': [".#.", "#.#", "###", "#.#", "#.#"], 'C': [".##", "#..", "#..", "#..", ".##"],
 'E': ["###", "#..", "##.", "#..", "###"], 'F': ["###", "#..", "##.", "#..", "#.."],
 'G': [".##", "#..", "#.#", "#.#", ".##"], 'I': ["###", ".#.", ".#.", ".#.", "###"],
 'L': ["#..", "#..", "#..", "#..", "###"], 'M': ["#...#", "##.##", "#.#.#", "#...#", "#...#"],
 'N': ["#..#", "##.#", "#.##", "#..#", "#..#"], 'O': [".#.", "#.#", "#.#", "#.#", ".#."],
 'R': ["##.", "#.#", "##.", "#.#", "#.#"], 'S': [".##", "#..", ".#.", "..#", "##."],
 'T': ["###", ".#.", ".#.", ".#.", ".#."], 'V': ["#.#", "#.#", "#.#", "#.#", ".#."],
 'W': ["#...#", "#...#", "#.#.#", "##.##", "#...#"], 'Y': ["#.#", "#.#", ".#.", ".#.", ".#."],
 ' ': ["..", "..", "..", "..", ".."],
}
SUB = "MEMORY TOWNS FOR ACTIVE LEARNING"
sw = sum(len(F3[c][0]) + 1 for c in SUB) - 1
sx, sy = (W - sw) // 2, TY + 25
def diamond(x, y, c):
    for dx, dy in ((0, -1), (-1, 0), (0, 0), (1, 0), (0, 1)): put(x + dx, y + dy, c)
diamond(sx - 6, sy + 2, '#ffc04d'); diamond(sx + sw + 5, sy + 2, '#ffc04d')
for xx in range(sx - 22, sx - 9): put(xx, sy + 2, '#4a3a86')
for xx in range(sx + sw + 9, sx + sw + 22): put(xx, sy + 2, '#4a3a86')
for ch in SUB:
    g = F3[ch]
    for r, row in enumerate(g):
        for c, v in enumerate(row):
            if v == '#':
                put(sx + c + 1, sy + r + 1, '#120c2e')
                put(sx + c, sy + r, '#c9b8f2' if r < 2 else '#a48fe0')
    sx += len(g[0]) + 1

# ---------------------------------------------------------------- stepped corners (transparent)
alpha = [[255] * W for _ in range(H)]
for i, n in enumerate([3, 1, 1]):
    for x in range(n):
        for (yy, xx) in ((i, x), (i, W - 1 - x), (H - 1 - i, x), (H - 1 - i, W - 1 - x)):
            alpha[yy][xx] = 0

# ---------------------------------------------------------------- write PNG
im = Image.new('RGBA', (W, H))
im.putdata([img[y][x] + (alpha[y][x],) for y in range(H) for x in range(W)])
big = im.resize((W * S, H * S), Image.NEAREST)
big.save('assets/mnemopolis-banner.png', optimize=True)
buf = io.BytesIO(); big.save(buf, 'PNG', optimize=True)
b64 = base64.b64encode(buf.getvalue()).decode()

# ---------------------------------------------------------------- write animated SVG
def R(x, y, w=1, h=1, fill='#fff', cls='', style=''):
    a = f' class="{cls}"' if cls else ''
    s = f' style="{style}"' if style else ''
    return f'<rect x="{x*S}" y="{y*S}" width="{w*S}" height="{h*S}" fill="{fill}"{a}{s}/>'

parts = []
# lighthouse beam
parts.append('<g class="beam">' + ''.join(R(x, y, fill='#fff1b8') for x, y in overlay['beam']) + '</g>')
# twinkling stars
for i, (x, y, kind) in enumerate(overlay['twinkle']):
    d = f'animation-delay:-{(i * 0.73) % 3.2:.2f}s'
    if kind == 'cross':
        parts.append(f'<g class="tw" style="{d}">' + R(x, y, fill='#ffffff') +
                     ''.join(R(x + dx, y + dy, fill='#8f97e0') for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))) + '</g>')
    else:
        parts.append(R(x, y, fill='#e8ecff', cls='tw', style=d))
# windows flicker (dark veil that blinks)
for i, (x, y, h) in enumerate(overlay['flicker']):
    parts.append(R(x, y, 1, h, fill='#140f30', cls='fl', style=f'animation-delay:-{(i * 1.37) % 5:.2f}s'))
# lamp pulses
for i, (x, y, r) in enumerate(overlay['lamps']):
    parts.append(f'<g class="lamp" style="animation-delay:-{(i * 0.9) % 2.6:.2f}s">' +
                 R(x, y, fill='#fffbe0') + ''.join(R(x + dx, y + dy, fill='#ffd06a', style='opacity:.45')
                 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))) + '</g>')
# river shimmer
for i, (x, y, w) in enumerate(overlay['shimmer']):
    parts.append(R(x, y, w, 1, fill='#9fb0ff', cls='sh', style=f'animation-delay:-{(i * 0.41) % 2.8:.2f}s'))
# title glints (4-point sparkle)
for i, (x, y) in enumerate(glints):
    g = R(x, y, fill='#ffffff') + ''.join(R(x + dx, y + dy, fill='#fff6d6') for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))) \
        + ''.join(R(x + dx, y + dy, fill='#ffffff', style='opacity:.6') for dx, dy in ((2, 0), (-2, 0), (0, 2), (0, -2)))
    parts.append(f'<g class="gl" style="animation-delay:{i * 1.6:.1f}s">{g}</g>')
# shooting star
ss = R(0, 0, fill='#ffffff') + R(-1, -0, fill='#d6dcff') + R(-2, -1, fill='#a9b2f0') + R(-3, -1, fill='#7d86d0') + R(-4, -2, fill='#5a62aa')
parts.append(f'<g class="ss"><g transform="translate({74*S},{5*S})">{ss}</g></g>')

css = """
.tw{animation:tw 3.2s steps(4) infinite}
@keyframes tw{0%,100%{opacity:.1}50%{opacity:1}}
.fl{opacity:0;animation:fl 5s steps(1) infinite}
@keyframes fl{0%,40%{opacity:0}41%{opacity:.85}43%{opacity:0}74%{opacity:.5}76%{opacity:0}}
.lamp{animation:lamp 2.6s steps(3) infinite}
@keyframes lamp{0%,100%{opacity:.55}50%{opacity:1}}
.beam{animation:beam 4.5s steps(6) infinite}
@keyframes beam{0%,100%{opacity:.05}45%,55%{opacity:.32}}
.sh{animation:sh 2.8s steps(2) infinite}
@keyframes sh{0%,100%{opacity:0}50%{opacity:.55}}
.gl{opacity:0;animation:gl 4.8s steps(1) infinite}
@keyframes gl{0%{opacity:0}2%{opacity:.7}5%{opacity:1}9%{opacity:.5}11%{opacity:0}}
.ss{opacity:0;animation:ss 11s steps(14) infinite}
@keyframes ss{0%{opacity:0;transform:translate(0,0)}1%{opacity:1}9%{opacity:1;transform:translate(-200px,64px)}10%,100%{opacity:0;transform:translate(-200px,64px)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
"""
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W*S} {H*S}" width="{W*S}" height="{H*S}" role="img" aria-label="Mnemopolis: memory towns for active learning">
<title>Mnemopolis: memory towns for active learning</title>
<style>{css}</style>
<image href="data:image/png;base64,{b64}" x="0" y="0" width="{W*S}" height="{H*S}"/>
<g shape-rendering="crispEdges">{''.join(parts)}</g>
</svg>'''
open('assets/mnemopolis-banner.svg', 'w').write(svg)
print('png kB', len(buf.getvalue()) // 1024, 'svg kB', len(svg) // 1024,
      {k: len(v) for k, v in overlay.items()})
