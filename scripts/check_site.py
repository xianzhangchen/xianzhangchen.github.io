#!/usr/bin/env python3
"""Validate the generated public site using only the Python standard library.

The build owns data/build-manifest.json and lists the HTML pages to check.
Legacy template files outside that manifest are deliberately not crawled.
"""

from __future__ import annotations

import argparse
from collections import Counter
from datetime import date
from html.parser import HTMLParser
import ipaddress
import json
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit


ALLOWED_PROTOCOLS = {"http", "https", "mailto", "tel"}
IMAGE_SUFFIXES = {".avif", ".bmp", ".gif", ".ico", ".jpeg", ".jpg", ".png", ".svg", ".webp"}
SITE_HOST = "xianzhangchen.github.io"
PLACEHOLDERS = re.compile(
    r"\bplaceholder\b|Edit this post in:|Add your full notes here|"
    r"::contentReference\[|oaicite|xxxxxxxxxx|"
    r"vCard / Resume / Personal / Portfolio Template|Loading publication list",
    re.IGNORECASE,
)


class Document(HTMLParser):
    def __init__(self, source: Path):
        super().__init__(convert_charrefs=True)
        self.source = source
        self.ids: list[str] = []
        self.refs: list[tuple[int, str, str]] = []
        self.descriptions: list[str] = []
        self.canonicals: list[str] = []
        self.headings = 0
        self.title_parts: list[str] = []
        self.in_title = False
        self.hidden_text_depth = 0
        self.visible_parts: list[str] = []
        self.feed(source.read_text(encoding="utf-8"))
        self.close()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]):
        values = dict(attrs)
        if values.get("id") is not None:
            self.ids.append(values["id"])
        if tag == "h1":
            self.headings += 1
        if tag == "title":
            self.in_title = True
        if tag in {"script", "style"}:
            self.hidden_text_depth += 1
        if tag == "meta" and values.get("name", "").lower() == "description":
            self.descriptions.append(values.get("content") or "")
        if tag == "link" and "canonical" in (values.get("rel") or "").split():
            self.canonicals.append(values.get("href") or "")
        for attr in ("href", "src"):
            if attr in values:
                self.refs.append((self.getpos()[0], attr, values[attr] or ""))

    def handle_endtag(self, tag: str):
        if tag == "title":
            self.in_title = False
        if tag in {"script", "style"}:
            self.hidden_text_depth = max(0, self.hidden_text_depth - 1)

    def handle_data(self, data: str):
        if self.in_title:
            self.title_parts.append(data)
        if not self.hidden_text_depth:
            self.visible_parts.append(data)


def local_path(root: Path, value: str) -> Path:
    path = (root / value).resolve()
    if not path.is_relative_to(root):
        raise ValueError("path escapes the repository")
    return path


def is_local_host(hostname: str | None) -> bool:
    hostname = (hostname or "").lower().rstrip(".")
    if hostname == "localhost" or hostname.endswith(".localhost"):
        return True
    try:
        return ipaddress.ip_address(hostname).is_loopback
    except ValueError:
        return False


def check_site(root: Path) -> list[str]:
    errors: list[str] = []

    def fail(location: str | Path, message: str):
        errors.append(f"{location}: {message}")

    def read_json(relative: str):
        try:
            return json.loads((root / relative).read_text(encoding="utf-8"))
        except (OSError, ValueError) as exc:
            fail(relative, f"cannot read valid JSON: {exc}")
            return None

    def check_local_image(source: str, where: str, field: str):
        try:
            image_url = urlsplit(source)
            if image_url.scheme or image_url.netloc:
                fail(where, f"{field} must be a local image path")
                return
            image_path = local_path(root, unquote(image_url.path).lstrip("/"))
            if image_path.suffix.lower() not in IMAGE_SUFFIXES or not image_path.is_file():
                fail(where, f"{field} must point to an existing local image: {source!r}")
            elif image_path.stat().st_size == 0:
                fail(where, f"{field} points to an empty image file: {source!r}")
        except (OSError, ValueError) as exc:
            fail(where, f"invalid {field}: {exc}")

    manifest_path = "data/build-manifest.json"
    if not (root / manifest_path).is_file():
        return [f"{manifest_path}: missing build manifest; run python3 scripts/build_site.py first"]
    manifest = read_json(manifest_path)
    if not isinstance(manifest, dict) or not isinstance(manifest.get("pages"), list):
        fail(manifest_path, 'expected an object containing a "pages" array')
        return errors
    pages = manifest["pages"]
    if not pages or not all(isinstance(page, str) and page for page in pages):
        fail(manifest_path, "pages must be a nonempty array of file paths")
        return errors
    if len(pages) != len(set(pages)):
        fail(manifest_path, "pages contains duplicate paths")

    profile = read_json("data/profile.json")
    banner = profile.get("home_banner") if isinstance(profile, dict) else None
    banner_where = "data/profile.json home_banner"
    if not isinstance(banner, dict):
        fail(banner_where, "expected a banner configuration object")
    else:
        if not isinstance(banner.get("enabled"), bool):
            fail(banner_where, "enabled must be a boolean")
        source = banner.get("src")
        if not isinstance(source, str) or not source.strip():
            fail(banner_where, "src must be a nonempty fallback image path")
        else:
            check_local_image(source, banner_where, "src")
        alternative = banner.get("alt")
        if not isinstance(alternative, str) or not alternative.strip():
            fail(banner_where, "alt must describe the fallback image")
        mode = banner.get("mode")
        if not isinstance(mode, str) or mode not in {"fixed", "carousel"}:
            fail(banner_where, "mode must be fixed or carousel")
        interval = banner.get("interval_ms")
        if isinstance(interval, bool) or not isinstance(interval, int) or interval < 3000:
            fail(banner_where, "interval_ms must be an integer of at least 3000 milliseconds")
        slides = banner.get("slides")
        if not isinstance(slides, list) or not slides:
            fail(banner_where, "slides must contain at least one image")
        else:
            if mode == "carousel" and len(slides) < 2:
                fail(banner_where, "carousel mode requires at least two slides")
            for number, slide in enumerate(slides, 1):
                where = f"{banner_where} slide {number}"
                if not isinstance(slide, dict):
                    fail(where, "slide must be an object with src and alt fields")
                    continue
                slide_source = slide.get("src")
                if not isinstance(slide_source, str) or not slide_source.strip():
                    fail(where, "src must be a nonempty local image path")
                else:
                    check_local_image(slide_source, where, "src")
                slide_alt = slide.get("alt")
                if not isinstance(slide_alt, str) or not slide_alt.strip():
                    fail(where, "alt must describe the slide image")
            if isinstance(slides[0], dict) and source != slides[0].get("src"):
                fail(banner_where, "fallback src must match the fixed first slide")

    appearance = read_json("data/site-appearance.json")
    if not isinstance(appearance, dict) or not isinstance(appearance.get("themes"), list):
        fail("data/site-appearance.json", "expected a theme configuration with a themes array")
    else:
        theme_ids = [theme.get("id") for theme in appearance["themes"] if isinstance(theme, dict)]
        if not isinstance(appearance.get("default_theme"), str) or appearance["default_theme"] not in theme_ids:
            fail("data/site-appearance.json", "default_theme must identify a configured theme")

    news = read_json("data/news.json")
    if not isinstance(news, list):
        fail("data/news.json", "expected an array of news entries")
    else:
        for number, entry in enumerate(news, 1):
            where = f"data/news.json entry {number}"
            if not isinstance(entry, dict):
                fail(where, "news entry must be an object")
                continue
            source = entry.get("image", "")
            if not isinstance(source, str):
                fail(where, "image must be a local path string or an empty string")
            elif source:
                check_local_image(source, where, "image")

    cache: dict[Path, Document] = {}

    def document(path: Path) -> Document | None:
        if path not in cache:
            try:
                cache[path] = Document(path)
            except (OSError, UnicodeError, ValueError) as exc:
                fail(path.relative_to(root), f"cannot parse HTML: {exc}")
                return None
        return cache[path]

    for page in pages:
        try:
            path = local_path(root, page)
        except ValueError as exc:
            fail(manifest_path, f"invalid page {page!r}: {exc}")
            continue
        if path.suffix.lower() != ".html" or not path.is_file():
            fail(page, "manifest page must be an existing HTML file")
            continue
        doc = document(path)
        if doc is None:
            continue
        if doc.headings != 1:
            fail(page, f"expected exactly one h1; found {doc.headings}")
        if not "".join(doc.title_parts).strip():
            fail(page, "missing nonempty title")
        if len(doc.descriptions) != 1 or not doc.descriptions[0].strip():
            fail(page, "expected one nonempty meta description")
        if len(doc.canonicals) != 1:
            fail(page, "expected one canonical URL")
        else:
            try:
                canonical = urlsplit(doc.canonicals[0])
                valid_canonical = canonical.scheme in {"http", "https"} and canonical.hostname
            except ValueError:
                valid_canonical = False
            if not valid_canonical:
                fail(page, "canonical must be an absolute HTTP(S) URL")
        for identity, count in Counter(doc.ids).items():
            if not identity or count > 1:
                fail(page, f"empty or duplicate id {identity!r}")
        match = PLACEHOLDERS.search("\n".join(doc.visible_parts))
        if match:
            fail(page, f"unpublished placeholder/export residue {match.group()!r}")

        for line, attr, value in doc.refs:
            where = f"{page}:{line}"
            if not value.strip():
                fail(where, f"empty {attr}")
                continue
            try:
                url = urlsplit(value)
                host = url.hostname
            except ValueError as exc:
                fail(where, f"invalid {attr} URL {value!r}: {exc}")
                continue
            if url.scheme and url.scheme.lower() not in ALLOWED_PROTOCOLS:
                fail(where, f"unsupported URL protocol in {value!r}")
                continue
            if is_local_host(host):
                fail(where, f"localhost URL is not public: {value!r}")
                continue
            if url.scheme in {"mailto", "tel"}:
                continue
            if host and host.lower() != SITE_HOST:
                continue
            target_name = unquote(url.path)
            if target_name.startswith("/"):
                target = root / target_name.lstrip("/")
            elif target_name:
                target = path.parent / target_name
            else:
                target = path
            target = target.resolve()
            if not target.is_relative_to(root):
                fail(where, f"local URL escapes the site: {value!r}")
                continue
            if target.is_dir():
                target /= "index.html"
            if not target.is_file():
                fail(where, f"missing local target: {value!r}")
                continue
            if url.fragment and target.suffix.lower() == ".html":
                target_doc = document(target)
                fragment = unquote(url.fragment)
                if target_doc is not None and fragment not in target_doc.ids:
                    fail(where, f"missing fragment #{fragment} in {target.relative_to(root)}")

    entries = read_json("blog/posts/index.json")
    if not isinstance(entries, list):
        fail("blog/posts/index.json", "expected an array of entries")
        return errors
    seen_slugs: set[str] = set()
    for number, entry in enumerate(entries, 1):
        where = f"blog/posts/index.json entry {number}"
        if not isinstance(entry, dict):
            fail(where, "entry must be an object")
            continue
        for field in ("slug", "title", "date", "category", "language", "excerpt", "status"):
            if not isinstance(entry.get(field), str) or not entry[field].strip():
                fail(where, f"{field} must be a nonempty string")
        slug = entry.get("slug", "")
        if not isinstance(slug, str) or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
            fail(where, "slug must contain lowercase words separated by hyphens")
            slug = ""
        elif slug in seen_slugs:
            fail(where, f"duplicate slug {slug!r}")
        seen_slugs.add(slug)
        tags = entry.get("tags")
        if not isinstance(tags, list) or not all(isinstance(tag, str) and tag.strip() for tag in tags):
            fail(where, "tags must be an array of nonempty strings")
        cover = entry.get("cover")
        if not isinstance(cover, dict):
            fail(where, "cover must be an object with enabled, src and alt fields")
        else:
            enabled = cover.get("enabled")
            source = cover.get("src")
            alternative = cover.get("alt")
            if not isinstance(enabled, bool):
                fail(where, "cover.enabled must be a boolean")
            if not isinstance(source, str):
                fail(where, "cover.src must be a string; an empty string reserves image space")
            elif source:
                check_local_image(source, where, "cover.src")
            if not isinstance(alternative, str):
                fail(where, "cover.alt must be a string")
            elif enabled is True and source and not alternative.strip():
                fail(where, "cover.alt must describe the image when a cover is displayed")
        if entry.get("language") not in {"en", "zh-CN"}:
            fail(where, "language must be en or zh-CN")
        try:
            date.fromisoformat(entry.get("date", ""))
        except (TypeError, ValueError):
            fail(where, "date must be a valid ISO date")
        status = entry.get("status")
        if status not in {"published", "external", "draft"}:
            fail(where, "status must be published, external or draft")
        if status == "external":
            external = entry.get("url")
            if not isinstance(external, str) or not external.strip():
                fail(where, "external entry requires a nonempty url")
            else:
                try:
                    parsed = urlsplit(external)
                    if parsed.scheme not in {"http", "https"} or not parsed.hostname or is_local_host(parsed.hostname):
                        fail(where, "external url must be a public absolute HTTP(S) URL")
                except ValueError:
                    fail(where, "invalid external url")
        if status == "published":
            content = entry.get("content")
            if not isinstance(content, str) or not content:
                fail(where, "published entry requires a content source")
            else:
                try:
                    source_path = local_path(root, content)
                    if source_path.suffix not in {".md", ".html"} or not source_path.is_file() or not source_path.read_text(encoding="utf-8").strip():
                        fail(where, "content must point to a nonempty Markdown or HTML file")
                except (OSError, UnicodeError, ValueError) as exc:
                    fail(where, f"invalid content source: {exc}")
            output = f"blog/{slug}.html"
            if output not in pages or not (root / output).is_file():
                fail(where, f"published output missing from build manifest/site: {output}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1], help="repository root (defaults to this script's parent repository)")
    args = parser.parse_args()
    errors = check_site(args.root.resolve())
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        print(f"Site checks failed: {len(errors)} error(s).", file=sys.stderr)
        return 1
    print("Site checks passed: pages, links/fragments, metadata, banner, news images, blog index and covers.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
