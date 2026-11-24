#!/usr/bin/env python3
"""Package the website without publishing unused historical video revisions."""

import argparse
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import shutil
from urllib.parse import urlsplit


class AssetReferences(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in {"src", "data-src", "poster", "href"} and value:
                url = urlsplit(value)
                if not url.scheme and not url.netloc and url.path:
                    self.paths.append(url.path)


def build(output, offline=False):
    repo = Path(__file__).resolve().parent.parent
    output = output.resolve()
    if output.exists():
        raise FileExistsError(f"Choose a new output directory: {output}")
    output.mkdir(parents=True)
    pages = sorted(repo.glob("*.html"))
    page_assets = {}
    for page in pages:
        shutil.copy2(page, output / page.name)
        references = AssetReferences()
        references.feed(page.read_text())
        page_assets[page.name] = references.paths
    referenced = {asset for assets in page_assets.values() for asset in assets}
    # Include local CSS images as well as images referenced directly in HTML.
    for asset in list(referenced):
        if Path(asset).suffix != ".css":
            continue
        for match in re.finditer(r"url\(\s*['\"]?([^'\")]+)", (repo / asset).read_text()):
            url = urlsplit(match.group(1))
            if not url.scheme and not url.netloc and url.path:
                referenced.add(((repo / asset).parent / url.path).resolve().relative_to(repo).as_posix())

    unused_libero = sorted(
        path.relative_to(repo).as_posix()
        for path in (repo / "static/videos").rglob("*")
        if path.is_file() and "libero" in path.name.lower()
        and path.suffix.lower() in {".mp4", ".webm", ".mov"}
        and path.relative_to(repo).as_posix() not in referenced
    )
    if unused_libero:
        raise ValueError("Archive unused LIBERO videos outside the repository: " + ", ".join(unused_libero))

    def omit_history(directory, names):
        if Path(directory).is_relative_to(repo / "static/images"):
            return [
                name for name in names
                if (Path(directory) / name).is_file()
                and (Path(directory) / name).relative_to(repo).as_posix() not in referenced
            ]
        if Path(directory) != repo / "static/videos":
            return []
        return [
            name for name in names
            if name == "archive" or (
                Path(name).suffix in {".mp4", ".jpg"}
                and f"static/videos/{name}" not in referenced
            )
        ]

    shutil.copytree(repo / "static", output / "static", ignore=omit_history)
    (output / ".nojekyll").touch()
    for page, assets in page_assets.items():
        for asset in assets:
            if not (output / asset).is_file():
                raise FileNotFoundError(f"{page} references missing asset: {asset}")

    size = sum(path.stat().st_size for path in output.rglob("*") if path.is_file())
    # https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
    if not offline and size > 1_000_000_000:
        raise ValueError(f"Published site exceeds the GitHub Pages size limit: {size} bytes")
    print(json.dumps({"output": str(output), "bytes": size, "pages": len(pages)}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parent.parent / "_site")
    parser.add_argument("--offline", action="store_true", help="Package an offline review archive without the hosting size limit")
    args = parser.parse_args()
    build(args.output, offline=args.offline)
