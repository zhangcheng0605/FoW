#!/usr/bin/env python3
"""Build FoW into a single self-contained page.

Outputs:
  index.html         — full standalone document (open directly in a browser)
  dist/artifact.html — same app without the outer document skeleton
                       (for hosts that wrap content in their own <html>/<head>/<body>)
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"

PERSONA_ORDER = ["hr", "finance", "procurement", "it", "legal", "sales", "marketing"]


def read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


def load_data() -> str:
    packs = {}
    for pid in PERSONA_ORDER:
        f = SRC / "data" / f"{pid}.json"
        if f.exists():
            packs[pid] = json.loads(read(f))
            extras = SRC / "data" / f"extras-{pid}.json"
            if extras.exists():
                extra = json.loads(read(extras))
                extra.pop("personaId", None)
                packs[pid].update(extra)
            tour = SRC / "data" / f"tour-{pid}.json"
            if tour.exists():
                t = json.loads(read(tour))
                t.pop("personaId", None)
                packs[pid]["tour"] = t
            chains = SRC / "data" / f"chains-{pid}.json"
            if chains.exists():
                packs[pid]["chains"] = json.loads(read(chains)).get("chains", [])
            joined = SRC / "data" / f"joined-{pid}.json"
            if joined.exists():
                j = json.loads(read(joined))
                packs[pid]["joined"] = j.get("joined")
                for c in j.get("newConnections", []):
                    if c not in packs[pid].get("connections", []):
                        packs[pid]["connections"].append(c)
    blob = json.dumps(packs, ensure_ascii=False, separators=(",", ":"))
    # a literal "</script>" inside JSON strings would end the inline script tag early
    blob = blob.replace("</", "<\\/")
    return f"window.FOW_DATA = {blob};"


def build() -> None:
    style = read(SRC / "style.css")
    css_dir = SRC / "css"
    if css_dir.exists():
        for extra in sorted(css_dir.glob("*.css")):
            style += "\n\n/* == " + extra.name + " == */\n" + read(extra)
    body = read(SRC / "body.html")
    script_names = [
        "logos.js", "logos-custom.js", "avatars.js",  # brand marks + avatars load first
        "registry.js", "charts.js", "chat.js", "app.js", "pet.js", "present.js", "fx.js",
    ]
    scripts = "\n".join(
        read(SRC / "js" / name)
        for name in script_names
        if (SRC / "js" / name).exists()
    )
    # per-persona studio renderers (studio-<id>.js) load after the core
    for extra in sorted((SRC / "js").glob("studio-*.js")):
        scripts += "\n" + read(extra)
    data = load_data()
    news_file = SRC / "data" / "news.json"
    if news_file.exists():
        news_blob = json.dumps(json.loads(read(news_file)), ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
        data += f"\nwindow.FOW_NEWS = {news_blob};"

    inner = f"""<title>FoW — Future of Work</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
{style}
</style>
{body}
<script>
{data}
</script>
<script>
{scripts}
</script>"""

    index = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
{inner.split('</style>')[0]}</style>
</head>
<body>
{inner.split('</style>', 1)[1]}
</body>
</html>"""

    (ROOT / "index.html").write_text(index, encoding="utf-8")
    (ROOT / "dist").mkdir(exist_ok=True)
    (ROOT / "dist" / "artifact.html").write_text(inner, encoding="utf-8")

    n = len(re.findall(r'"personaId"', data))
    print(f"built index.html ({len(index)//1024} KB) with {n} persona packs")


if __name__ == "__main__":
    build()
