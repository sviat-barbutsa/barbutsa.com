"""Create and verify deterministic, public-safe EazeGames archival media.

Windows owns this checkout and this script intentionally uses only Pillow plus
the locally installed Tesseract executable. Source JPGs are read-only evidence;
all output is newly encoded without source metadata. No OCR text is written to
disk or printed.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageStat, features


SOURCE_ROOT = Path(r"D:\web\personal\eazegames_aassets")
REPO_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = REPO_ROOT / "public" / "work" / "eazegames"
EVIDENCE_ROOT = REPO_ROOT.parent / "EXECUTION" / "evidence" / "ATLAS-EAZEGAMES-01"
MANIFEST_PATH = EVIDENCE_ROOT / "media-manifest.json"
CHECKLIST_PATH = EVIDENCE_ROOT / "redaction-checklist.json"
TESSERACT = Path(r"C:\Program Files\Tesseract-OCR\tesseract.exe")
FONT_REGULAR = Path(r"C:\Windows\Fonts\arial.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\arialbd.ttf")

SOURCE_FILES = [f"{index}_{name}.jpg" for index, name in enumerate([
    "into",
    "home",
    "welcome",
    "drawer",
    "rank_list",
    "live_winning_table",
    "personal_tips",
    "signup_form",
    "email_confirm",
])]

PUBLISHED_BASES = {
    "0_into.jpg": "eazegames-v1-landing",
    "1_home.jpg": "eazegames-v1-home",
    "2_welcome.jpg": "eazegames-v1-onboarding",
    "3_drawer.jpg": "eazegames-v1-navigation",
    "4_rank_list.jpg": "eazegames-v1-rankings",
    "5_live_winning_table.jpg": "eazegames-v1-live-activity",
    "6_personal_tips.jpg": "eazegames-v1-notifications",
}

SENSITIVE_REGIONS = {
    "1_home.jpg": [(1560, 0, 1820, 92)],
    "2_welcome.jpg": [(1560, 0, 1825, 96)],
    "3_drawer.jpg": [(0, 0, 380, 265), (1570, 0, 1839, 100)],
    "4_rank_list.jpg": [(1540, 0, 1803, 112), (410, 690, 700, 1090)],
    "5_live_winning_table.jpg": [(1540, 0, 1796, 100), (400, 165, 700, 660)],
    "6_personal_tips.jpg": [(320, 18, 553, 145)],
}

SAFE_OCR_WORDS = {
    "profile",
    "logout",
    "player",
    "name",
    "amount",
    "rank",
    "level",
    "loading",
    "money",
    "add",
    "notifications",
    "mark",
    "read",
    "date",
    "game",
    "competition",
    "eazegames",
    "eazecoins",
    "euro",
}

CHECKLIST = [
    {
        "source": "0_into.jpg",
        "outputs": ["eazegames-v1-landing"],
        "treatment": "Re-encoded archival public landing screen; no account surface present.",
    },
    {
        "source": "1_home.jpg",
        "outputs": ["eazegames-v1-home", "eazegames-card-1600x1200", "eazegames-og-1200x630"],
        "treatment": "Synthetic header account and balances; account badges removed; podium identities replaced.",
    },
    {
        "source": "2_welcome.jpg",
        "outputs": ["eazegames-v1-onboarding"],
        "treatment": "Synthetic dimmed header account and balances; background podium identities replaced.",
    },
    {
        "source": "3_drawer.jpg",
        "outputs": ["eazegames-v1-navigation"],
        "treatment": "Drawer and header account identities/balances replaced; badges and podium identities removed.",
    },
    {
        "source": "4_rank_list.jpg",
        "outputs": ["eazegames-v1-rankings"],
        "treatment": "Browser chrome cropped; account replaced; every leaderboard avatar/name replaced with synthetic rows.",
    },
    {
        "source": "5_live_winning_table.jpg",
        "outputs": ["eazegames-v1-live-activity"],
        "treatment": "Account replaced; every live-activity avatar/name replaced with synthetic rows.",
    },
    {
        "source": "6_personal_tips.jpg",
        "outputs": ["eazegames-v1-notifications"],
        "treatment": "Browser chrome cropped; account and visible background podium identities replaced.",
    },
    {
        "source": "7_signup_form.jpg",
        "outputs": [],
        "treatment": "Excluded: personal signup data and password surface.",
    },
    {
        "source": "8_email_confirm.jpg",
        "outputs": [],
        "treatment": "Excluded: recipient address and tokenized validation URL.",
    },
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def font(size: int, *, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_BOLD if bold else FONT_REGULAR), size=size)


def average_color(image: Image.Image, box: tuple[int, int, int, int]) -> tuple[int, int, int]:
    crop = image.crop(box).convert("RGB")
    return tuple(int(value) for value in ImageStat.Stat(crop).median)


def remove_badge(image: Image.Image, center: tuple[int, int], radius: int) -> None:
    x, y = center
    sample_box = (
        max(0, x + radius + 2),
        max(0, y - radius),
        min(image.width, x + radius * 3 + 2),
        min(image.height, y + radius),
    )
    fill = average_color(image, sample_box)
    ImageDraw.Draw(image).ellipse((x - radius, y - radius, x + radius, y + radius), fill=fill)


def redraw_header_menu(image: Image.Image, top: int) -> None:
    """Replace an account-alert hamburger with a clean neutral control."""
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, top, 56, top + 81), fill="#292e31")
    for offset, width in ((29, 20), (35, 14), (41, 9)):
        draw.line((12, top + offset, 12 + width, top + offset), fill="#f4f1e8", width=2)
    draw.line((55, top + 16, 55, top + 65), fill="#394147", width=1)


def centered_text(draw: ImageDraw.ImageDraw, center: tuple[int, int], text: str, face: ImageFont.FreeTypeFont, fill: str) -> None:
    box = draw.textbbox((0, 0), text, font=face)
    draw.text((center[0] - (box[2] - box[0]) / 2, center[1] - (box[3] - box[1]) / 2 - box[1]), text, font=face, fill=fill)


def synthetic_avatar(image: Image.Image, center: tuple[int, int], radius: int, label: str = "T") -> None:
    draw = ImageDraw.Draw(image)
    draw.ellipse(
        (center[0] - radius, center[1] - radius, center[0] + radius, center[1] + radius),
        fill="#394147",
        outline="#ffda44",
        width=max(2, radius // 10),
    )
    centered_text(draw, center, label, font(max(12, radius), bold=True), "#f4f1e8")


def synthetic_header(
    image: Image.Image,
    profile_box: tuple[int, int, int, int],
    balance_box: tuple[int, int, int, int] | None,
    *,
    dimmed: bool = False,
) -> None:
    draw = ImageDraw.Draw(image)
    base = "#202527" if dimmed else "#292e31"
    muted = "#777d7f" if dimmed else "#f4f1e8"
    draw.rectangle(profile_box, fill=base)
    height = profile_box[3] - profile_box[1]
    avatar_center = (profile_box[0] + max(24, height // 3), profile_box[1] + height // 2)
    synthetic_avatar(image, avatar_center, max(15, height // 4))
    draw.text(
        (avatar_center[0] + max(22, height // 3), profile_box[1] + height * 0.33),
        "TestPlayer",
        font=font(max(14, height // 5), bold=True),
        fill=muted,
    )
    if balance_box:
        draw.rectangle(balance_box, fill=base)
        draw.text(
            (balance_box[0] + 12, balance_box[1] + (balance_box[3] - balance_box[1]) * 0.34),
            "€ 0,00     G 500",
            font=font(max(13, (balance_box[3] - balance_box[1]) // 5)),
            fill=muted,
        )


def replace_identity_row(image: Image.Image, box: tuple[int, int, int, int], index: int) -> None:
    draw = ImageDraw.Draw(image)
    fill = average_color(image, (box[2] - 12, box[1], box[2], box[3]))
    draw.rectangle(box, fill=fill)
    center = (box[0] + 23, (box[1] + box[3]) // 2)
    synthetic_avatar(image, center, max(12, (box[3] - box[1]) // 3), str(index))
    draw.text(
        (box[0] + 48, box[1] + max(6, (box[3] - box[1]) // 4)),
        f"TestPlayer {index:02d}",
        font=font(max(13, (box[3] - box[1]) // 3)),
        fill="#d7dcde",
    )


def replace_podium_avatars(image: Image.Image, centers: list[tuple[int, int]], radius: int) -> None:
    for index, center in enumerate(centers, start=1):
        synthetic_avatar(image, center, radius, str(index))


def sanitize_landing(image: Image.Image) -> Image.Image:
    return image.convert("RGB")


def sanitize_home(image: Image.Image) -> Image.Image:
    image = image.convert("RGB")
    synthetic_header(image, (1585, 0, image.width, 84), (1252, 0, 1432, 84))
    replace_podium_avatars(image, [(1180, 449), (1222, 449), (1265, 449), (1307, 449), (1350, 449)], 17)
    for badge in [(45, 32, 10), (1563, 28, 8), (650, 788, 8), (891, 788, 8), (1131, 788, 8)]:
        remove_badge(image, badge[:2], badge[2])
    return image


def sanitize_onboarding(image: Image.Image) -> Image.Image:
    image = image.convert("RGB")
    synthetic_header(image, (1585, 0, image.width, 82), (1260, 0, 1428, 82), dimmed=True)
    replace_podium_avatars(image, [(1180, 449), (1222, 449), (1265, 449), (1307, 449), (1350, 449)], 17)
    remove_badge(image, (1570, 27), 8)
    return image


def sanitize_navigation(image: Image.Image) -> Image.Image:
    image = image.convert("RGB")
    synthetic_header(image, (1608, 0, image.width, 84), (1282, 0, 1454, 84))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((1457, 18, 1584, 64), radius=23, fill="#ffda44")
    draw.ellipse((1474, 33, 1484, 43), fill="#292e31")
    draw.text((1492, 31), "Add money", font=font(15), fill="#292e31")
    draw.rectangle((214, 112, 252, 151), fill="#292e31")
    synthetic_avatar(image, (187, 95), 60)
    draw.rectangle((90, 151, 290, 250), fill="#292e31")
    draw.text((134, 164), "TestPlayer", font=font(22, bold=True), fill="#f4f1e8")
    draw.text((106, 210), "€ 0,00    G 500", font=font(18), fill="#f4f1e8")
    replace_podium_avatars(image, [(1193, 449), (1235, 449), (1278, 449), (1320, 449), (1363, 449)], 17)
    for center_y in (333, 389, 444, 500, 607):
        draw.rectangle((0, center_y - 24, 48, center_y + 24), fill="#292e31")
        draw.ellipse((22, center_y - 7, 36, center_y + 7), outline="#aab0b2", width=2)
    return image


def sanitize_rankings(image: Image.Image) -> Image.Image:
    image = image.convert("RGB")
    synthetic_header(image, (1575, 13, image.width, 94), (1250, 13, 1415, 94))
    redraw_header_menu(image, 13)
    replace_podium_avatars(image, [(941, 274), (983, 274), (1026, 274), (1068, 274)], 15)
    centers = [735, 780, 824, 869, 963, 1007, 1051]
    for index, center in enumerate(centers, start=1):
        replace_identity_row(image, (428, center - 21, 680, center + 21), index)
    for badge in [(763, 431, 9), (1108, 431, 9), (1335, 431, 9)]:
        remove_badge(image, badge[:2], badge[2])
    return image.crop((0, 13, image.width, image.height))


def sanitize_live_activity(image: Image.Image) -> Image.Image:
    image = image.convert("RGB")
    synthetic_header(image, (1565, 0, image.width, 78), (1240, 0, 1410, 78))
    redraw_header_menu(image, 0)
    centers = [208, 254, 301, 348, 394, 441, 487, 533, 580, 626]
    for index, center in enumerate(centers, start=1):
        replace_identity_row(image, (425, center - 20, 690, center + 20), index)
    return image


def sanitize_notifications(image: Image.Image) -> Image.Image:
    image = image.convert("RGB")
    synthetic_header(image, (342, 27, image.width, 113), (0, 27, 162, 113))
    replace_podium_avatars(image, [(17, 472), (58, 472), (98, 472)], 15)
    return image.crop((0, 27, image.width, image.height))


SANITIZERS = {
    "0_into.jpg": sanitize_landing,
    "1_home.jpg": sanitize_home,
    "2_welcome.jpg": sanitize_onboarding,
    "3_drawer.jpg": sanitize_navigation,
    "4_rank_list.jpg": sanitize_rankings,
    "5_live_winning_table.jpg": sanitize_live_activity,
    "6_personal_tips.jpg": sanitize_notifications,
}


def fit(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    result = image.copy()
    result.thumbnail(size, Image.Resampling.LANCZOS)
    return result


def create_card(home: Image.Image) -> Image.Image:
    canvas = Image.new("RGB", (1600, 1200), "#202527")
    screenshot = fit(home, (1500, 916))
    canvas.paste(screenshot, ((1600 - screenshot.width) // 2, 42))
    draw = ImageDraw.Draw(canvas)
    draw.line((50, 985, 1550, 985), fill="#ffda44", width=3)
    draw.text((72, 1018), "EAZEGAMES · ORIGINAL VERSION 1", font=font(34, bold=True), fill="#f4f1e8")
    draw.text((72, 1072), "Real-time skill-gaming web platform", font=font(27), fill="#b8c0c3")
    draw.text((72, 1122), "ARCHIVAL INTERFACE · 2016–2017", font=font(20, bold=True), fill="#ffda44")
    return canvas


def create_og(home: Image.Image) -> Image.Image:
    canvas = Image.new("RGB", (1200, 630), "#202527")
    screenshot = fit(home, (700, 430))
    x = 470 + (700 - screenshot.width) // 2
    y = (630 - screenshot.height) // 2
    canvas.paste(screenshot, (x, y))
    draw = ImageDraw.Draw(canvas)
    draw.line((54, 70, 54, 560), fill="#ffda44", width=5)
    draw.text((88, 102), "EazeGames", font=font(47, bold=True), fill="#f4f1e8")
    draw.text((88, 165), "Original Web", font=font(47, bold=True), fill="#f4f1e8")
    draw.text((88, 228), "Platform", font=font(47, bold=True), fill="#f4f1e8")
    draw.text((88, 334), "Historical production", font=font(24, bold=True), fill="#ffda44")
    draw.text((88, 368), "case study · 2016–2017", font=font(24, bold=True), fill="#ffda44")
    draw.text((88, 470), "ORIGINAL VERSION 1", font=font(18, bold=True), fill="#b8c0c3")
    return canvas


def save_image(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.suffix == ".webp":
        image.save(path, "WEBP", quality=88, method=6, exif=b"")
    elif path.suffix == ".avif":
        image.save(path, "AVIF", quality=72, speed=6, exif=b"")
    else:
        raise ValueError(f"Unsupported output format: {path.suffix}")


def save_variants(base: str, image: Image.Image, *, compact_width: int = 960) -> list[Path]:
    outputs: list[Path] = []
    for suffix in (".webp", ".avif"):
        full_path = OUTPUT_ROOT / f"{base}{suffix}"
        save_image(image, full_path)
        outputs.append(full_path)
    if image.width > compact_width:
        compact = image.resize(
            (compact_width, round(image.height * compact_width / image.width)),
            Image.Resampling.LANCZOS,
        )
        for suffix in (".webp", ".avif"):
            compact_path = OUTPUT_ROOT / f"{base}-{compact_width}{suffix}"
            save_image(compact, compact_path)
            outputs.append(compact_path)
    return outputs


def ocr(image: Image.Image, *, psm: int = 6) -> str:
    if not TESSERACT.is_file():
        raise RuntimeError("Local Windows Tesseract executable is unavailable.")
    payload = io.BytesIO()
    image.convert("RGB").save(payload, "PNG")
    completed = subprocess.run(
        [str(TESSERACT), "stdin", "stdout", "--psm", str(psm), "-l", "eng"],
        input=payload.getvalue(),
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    if completed.returncode != 0:
        raise RuntimeError(f"Local OCR failed with exit code {completed.returncode}.")
    return completed.stdout.decode("utf-8", errors="ignore")


def normalized_tokens(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-zA-Z0-9_]{4,}", text.lower())
        if token not in SAFE_OCR_WORDS and not token.isdigit()
    }


def source_sensitive_tokens() -> set[str]:
    tokens: set[str] = set()
    for source_name, regions in SENSITIVE_REGIONS.items():
        with Image.open(SOURCE_ROOT / source_name) as source:
            for region in regions:
                tokens.update(normalized_tokens(ocr(source.crop(region))))
    return tokens


def expected_output_paths() -> list[Path]:
    paths: list[Path] = []
    for source_name, base in PUBLISHED_BASES.items():
        with Image.open(SOURCE_ROOT / source_name) as source:
            sanitized = SANITIZERS[source_name](source.copy())
        paths.extend([OUTPUT_ROOT / f"{base}.webp", OUTPUT_ROOT / f"{base}.avif"])
        if sanitized.width > 960:
            paths.extend([OUTPUT_ROOT / f"{base}-960.webp", OUTPUT_ROOT / f"{base}-960.avif"])
    for base in ("eazegames-card-1600x1200", "eazegames-og-1200x630"):
        paths.extend([OUTPUT_ROOT / f"{base}.webp", OUTPUT_ROOT / f"{base}.avif"])
        paths.extend([OUTPUT_ROOT / f"{base}-960.webp", OUTPUT_ROOT / f"{base}-960.avif"])
    return sorted(paths)


def generate() -> None:
    missing = [name for name in SOURCE_FILES if not (SOURCE_ROOT / name).is_file()]
    if missing:
        raise RuntimeError(f"Missing {len(missing)} required source evidence file(s).")
    if not features.check("avif"):
        raise RuntimeError("Windows Pillow lacks AVIF encoding support.")

    source_before = {name: sha256(SOURCE_ROOT / name) for name in SOURCE_FILES}
    outputs: list[Path] = []
    sanitized_images: dict[str, Image.Image] = {}
    for source_name, base in PUBLISHED_BASES.items():
        with Image.open(SOURCE_ROOT / source_name) as source:
            sanitized = SANITIZERS[source_name](source.copy())
        sanitized_images[source_name] = sanitized
        outputs.extend(save_variants(base, sanitized))

    card = create_card(sanitized_images["1_home.jpg"])
    og = create_og(sanitized_images["1_home.jpg"])
    outputs.extend(save_variants("eazegames-card-1600x1200", card))
    outputs.extend(save_variants("eazegames-og-1200x630", og))

    source_after = {name: sha256(SOURCE_ROOT / name) for name in SOURCE_FILES}
    if source_before != source_after:
        raise RuntimeError("Source evidence changed during processing.")

    EVIDENCE_ROOT.mkdir(parents=True, exist_ok=True)
    manifest = {
        "schemaVersion": "personal-atlas.eazegames-media/v1",
        "sourceRoot": "D:/web/personal/eazegames_aassets",
        "sources": [
            {
                "name": name,
                "sha256": source_before[name],
                "published": name in PUBLISHED_BASES,
            }
            for name in SOURCE_FILES
        ],
        "outputs": [
            {
                "path": path.relative_to(REPO_ROOT).as_posix(),
                "sha256": sha256(path),
                "bytes": path.stat().st_size,
            }
            for path in sorted(outputs)
        ],
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    CHECKLIST_PATH.write_text(json.dumps(CHECKLIST, indent=2) + "\n", encoding="utf-8")


def verify() -> None:
    if not MANIFEST_PATH.is_file() or not CHECKLIST_PATH.is_file():
        raise RuntimeError("Media evidence manifest/checklist is missing.")
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    recorded_sources = {entry["name"]: entry for entry in manifest["sources"]}
    for source_name in SOURCE_FILES:
        source_path = SOURCE_ROOT / source_name
        if not source_path.is_file() or sha256(source_path) != recorded_sources[source_name]["sha256"]:
            raise RuntimeError("Source evidence identity mismatch.")

    expected = expected_output_paths()
    actual = sorted(path for path in OUTPUT_ROOT.iterdir() if path.is_file())
    if [path.name for path in actual] != [path.name for path in expected]:
        raise RuntimeError("Public derivative inventory contains a missing or unauthorized file.")
    if any(path.suffix.lower() in {".jpg", ".jpeg", ".png"} for path in actual):
        raise RuntimeError("Lossless/source-like raster copy found in public derivatives.")
    if any("signup" in path.name or "email" in path.name or "confirm" in path.name for path in actual):
        raise RuntimeError("Excluded sensitive source is represented in public derivatives.")

    recorded_outputs = {Path(entry["path"]).name: entry for entry in manifest["outputs"]}
    sensitive_tokens = source_sensitive_tokens()
    for output_path in actual:
        if output_path.name not in recorded_outputs or sha256(output_path) != recorded_outputs[output_path.name]["sha256"]:
            raise RuntimeError("Public derivative identity mismatch.")
        with Image.open(output_path) as image:
            if image.getexif():
                raise RuntimeError("Public derivative retains metadata.")
            output_text = ocr(image)
            if re.search(r"[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}", output_text):
                raise RuntimeError("Email-like text detected in public derivative.")
            if normalized_tokens(output_text) & sensitive_tokens:
                raise RuntimeError("Source-sensitive OCR token survived in a public derivative.")

    with Image.open(OUTPUT_ROOT / "eazegames-card-1600x1200.webp") as card:
        if card.size != (1600, 1200):
            raise RuntimeError("Card derivative has the wrong dimensions.")
    with Image.open(OUTPUT_ROOT / "eazegames-og-1200x630.webp") as og:
        if og.size != (1200, 630):
            raise RuntimeError("Open Graph derivative has the wrong dimensions.")

    checklist = json.loads(CHECKLIST_PATH.read_text(encoding="utf-8"))
    excluded = {entry["source"] for entry in checklist if not entry["outputs"]}
    if excluded != {"7_signup_form.jpg", "8_email_confirm.jpg"}:
        raise RuntimeError("Redaction checklist does not preserve the mandatory exclusions.")

    print(
        f"EazeGames media verification passed: {len(SOURCE_FILES)} immutable sources, "
        f"{len(actual)} public derivatives, local OCR/privacy/metadata checks green."
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()
    try:
        if not args.verify_only:
            generate()
        verify()
    except Exception as error:
        print(f"EazeGames media verification failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
