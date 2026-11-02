# 앱 아이콘·시작 화면·웹 아이콘을 그린다: 운동장 초록 바탕, 흰 원 안에 주황 고깔 셋(흰 띠, 받침), 발밑 그림자.
# 그림 파일 없이 도형으로 그린다.   python3 scripts/native-assets.py   (Pillow 필요)
import glob, os
from PIL import Image, ImageDraw, ImageFilter

GRASS = (0x5E, 0x91, 0x47)      # 운동장(장면의 field)
GRASS_DARK = (0x4E, 0x7E, 0x3B)
CONE = (0xF2, 0x6B, 0x1D)
CONE_SHADE = (0xD9, 0x5A, 0x12)
BAND = (0xF7, 0xF7, 0xF2)
LIGHT_BG, DARK_BG = (0xE9, 0xEF, 0xF1), (0x10, 0x16, 0x1B)   # 웹 --bg 밝게 / 어둡게

def cone(size):
    """투명 바탕에 고깔. size 는 정사각 한 변"""
    S = size * 4  # 크게 그려 줄인다(가장자리 매끈하게)
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx = S / 2
    top, base_y = S * 0.14, S * 0.78
    tw, bw = S * 0.07, S * 0.30          # 꼭대기 반폭, 아래 반폭
    # 몸통 (왼쪽 밝게, 오른쪽 조금 어둡게)
    d.polygon([(cx - tw, top), (cx + tw, top), (cx + bw, base_y), (cx - bw, base_y)], fill=CONE)
    d.polygon([(cx + tw * 0.2, top), (cx + tw, top), (cx + bw, base_y), (cx + bw * 0.45, base_y)], fill=CONE_SHADE)
    d.rounded_rectangle([cx - tw, top - S * 0.02, cx + tw, top + S * 0.02], radius=S * 0.02, fill=CONE)
    # 흰 띠
    def at(y):
        f = (y - top) / (base_y - top)
        return tw + (bw - tw) * f
    y1, y2 = S * 0.40, S * 0.52
    d.polygon([(cx - at(y1), y1), (cx + at(y1), y1), (cx + at(y2), y2), (cx - at(y2), y2)], fill=BAND)
    # 받침
    d.rounded_rectangle([cx - S * 0.38, base_y - S * 0.01, cx + S * 0.38, base_y + S * 0.07], radius=S * 0.025, fill=CONE)
    d.rectangle([cx + S * 0.18, base_y - S * 0.01, cx + S * 0.38, base_y + S * 0.07], fill=CONE_SHADE)
    return im.resize((size, size), Image.LANCZOS)

def icon(size, bg=GRASS):
    """운동장 위 흰 원 안에 고깔 셋(뒤에 둘, 앞에 하나). 고깔 하나짜리는 다른 상표(VLC)와 닮아 셋으로 둔다."""
    im = Image.new('RGBA', (size, size), bg + (255,))
    d = ImageDraw.Draw(im)
    w = max(2, size // 40)
    d.ellipse([size * 0.08, size * 0.42, size * 0.92, size * 0.88], outline=(0xF4, 0xF6, 0xF2, 255), width=w)
    sh = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    spots = [(0.31, 0.27, 0.37), (0.69, 0.27, 0.37), (0.50, 0.38, 0.47)]   # (가운데 x, 받침 y 비율, 크기 비율)
    for x, y, k in spots:
        sd.ellipse([size * (x - k * 0.40), size * (y + k * 0.62), size * (x + k * 0.40), size * (y + k * 0.74)], fill=(0, 0, 0, 60))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(size / 70)))
    for x, y, k in spots:
        c = cone(int(size * k))
        im.alpha_composite(c, (int(size * x - c.width / 2), int(size * y - c.height * 0.10)))
    return im

def save_rgb(im, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.convert('RGB').save(path)

if __name__ == '__main__':
    os.makedirs('store', exist_ok=True)
    save_rgb(icon(1024), 'store/icon-1024.png')
    save_rgb(icon(512), 'store/icon-512.png')                      # Play 스토어
    save_rgb(icon(180), 'public/icon-180.png')                      # 웹(홈 화면에 추가)
    # iOS: 1024 한 장(Xcode 가 줄인다)
    for p in glob.glob('ios/App/App/Assets.xcassets/AppIcon.appiconset/*.png'):
        save_rgb(icon(1024), p)
    # iOS 시작 화면: 바탕 + 가운데 고깔(밝게/어둡게 같은 그림, 바탕만 다르게)
    for p in glob.glob('ios/App/App/Assets.xcassets/Splash.imageset/*.png'):
        im = Image.new('RGBA', (2732, 2732), (DARK_BG if 'dark' in p else LIGHT_BG) + (255,))
        c = cone(560)
        im.alpha_composite(c, ((2732 - 560) // 2, (2732 - 560) // 2))
        save_rgb(im, p)
    # Android: 런처 아이콘(옛 모양·둥근 모양·적응형 앞그림)
    dens = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
    for k, m in dens.items():
        base = f'android/app/src/main/res/mipmap-{k}'
        if not os.path.isdir(base):
            continue
        px = int(48 * m)
        big = icon(px * 4).resize((px, px), Image.LANCZOS)
        save_rgb(big, f'{base}/ic_launcher.png')
        r = Image.new('L', (px, px), 0); ImageDraw.Draw(r).ellipse([0, 0, px - 1, px - 1], fill=255)
        rnd = big.copy(); rnd.putalpha(r); rnd.save(f'{base}/ic_launcher_round.png')
        fg = int(108 * m)
        f = Image.new('RGBA', (fg, fg), (0, 0, 0, 0))
        c = cone(int(fg * 0.62))
        f.alpha_composite(c, ((fg - c.width) // 2, (fg - c.height) // 2))
        f.save(f'{base}/ic_launcher_foreground.png')
    bgx = 'android/app/src/main/res/values/ic_launcher_background.xml'
    if os.path.exists(bgx):
        open(bgx, 'w').write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#5E9147</color>\n</resources>\n')
    # Android 시작 화면
    for p in glob.glob('android/app/src/main/res/drawable*/splash.png'):
        w, h = Image.open(p).size
        im = Image.new('RGBA', (w, h), (DARK_BG if 'night' in p else LIGHT_BG) + (255,))
        n = min(w, h) // 4
        c = cone(n)
        im.alpha_composite(c, ((w - n) // 2, (h - n) // 2))
        save_rgb(im, p)
    print('done')
