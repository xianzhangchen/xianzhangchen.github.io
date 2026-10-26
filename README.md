# Xian-Zhang Chen — academic homepage

Static academic website for [xianzhangchen.github.io](https://xianzhangchen.github.io/). All public pages contain their complete content before JavaScript runs. The site uses local CSS and a small script for mobile navigation and publication filtering.

## Local preview

From the repository root:

```sh
python3 scripts/build_site.py
python3 scripts/check_site.py
python3 scripts/preview.py --port 8765
```

Open [http://127.0.0.1:8765/](http://127.0.0.1:8765/). The preview server listens only on this computer and blocks hidden paths such as `.git`. Stop it with Ctrl+C. Opening HTML directly with `file://` does not resolve site-root links correctly; use the preview server.

Building requires Python 3.9+ and [Pandoc 3.8.3](https://pandoc.org/installing.html). Pandoc converts Markdown and LaTeX equations into HTML and native MathML. Hosting the generated website requires neither tool, a package manager, nor a backend server.

## Where to edit

| Content | Source |
| --- | --- |
| Site title, identity, contact details, research themes, education, employment | `data/profile.json` |
| Homepage research banner source, description and visibility | `data/profile.json` → `home_banner` |
| Complete publication records, PDFs, selected work, contributions | `data/publications.json` |
| News and homepage updates | `data/news.json` |
| Notes index, language, summaries and publication state | `blog/posts/index.json` |
| Default color theme and theme descriptions | `data/site-appearance.json` |
| Markdown notes | `blog/posts/*.md` |
| Edited HTML article bodies | `content/articles/*.html` |
| Page composition and metadata | `scripts/build_site.py` |
| Layout and progressive enhancements | `assets/site.css`, `assets/site.js` |
| CV layouts | `XC-EN-CV/XC-EN-CV.tex`, `XC-CN-CV/XC-CN-CV.tex` |

Run the build after source changes. Generated HTML is committed for direct GitHub Pages hosting with `.nojekyll`; do not edit it by hand. The build also generates the sitemap, bibliography, compatibility pages and legacy data fragments.

The old template files under `css/`, `js/`, `bootstrap-3.3.6-dist/`, and `single-work.html` are retained as historical assets. Current pages load only `assets/site.css` and `assets/site.js`, plus a small compatibility script on the old article URL. Legacy files are excluded from the generated-page checks and are not needed by the new design.

## Add or update publications

Add an object to `data/publications.json`. Keep a stable `id`, a full author array, year, publication status, journal citation, DOI, primary URL and PDF URL. Use a site-root path for local files, for example `/attaches/publications/paper.pdf`. Do not infer acceptance dates or journal details from a preprint.

`selected: true` includes a paper on the homepage. A `summary` should describe the actual result; include a `contribution` only when it is documented. Optional fields include `image`, `code` and `supplement`. Bibliography and publication-page output are generated from this data.

## Add a note

Each index entry needs a unique `slug`, title, ISO date, category, tags array, language, excerpt and status:

- `published`: requires `content`, a Markdown or HTML body path relative to the repository.
- `external`: requires an `https://` original article `url`; the generated landing page links to that original.
- `draft`: excluded from public indexes and article generation.

Markdown article sections should start at `##`. Write equations with `$...$` or `$$...$$`; keep code in fenced blocks. HTML body fragments must not include an outer document, scripts or an H1. The site supplies the title, navigation and metadata. Use stable, unique heading IDs for article contents links.

Original URLs such as `blog-post.html?p=...` and the two older HTML article URLs remain available. The compatibility script accepts only a predefined route table; it never interpolates an arbitrary URL from the query string.

## News images

Each item in `data/news.json` can use `image` (a site-root image path) and `image_alt` (a description). Leave `image` empty when no image is available. The News page reserves a fixed 280 × 210 px image area on the right, and stacks it below the text on small screens. Existing figures use `object-fit: contain` to keep their labels visible; set `image_fit: "cover"` for a photograph that should fill the frame.

Home shows the latest three entries from the same data. An entry with an image also displays a 220 × 165 px thumbnail; an entry without an image uses the available text width. The three current 2026 entries have no configured image.

### Note covers

Each entry in `blog/posts/index.json` has a `cover` object:

```json
"cover": { "enabled": true, "src": "", "alt": "" }
```

- Set `enabled` to `false` to remove the image block completely.
- Keep `enabled: true` and an empty `src` to reserve a blank image area with a 2.35:1 aspect ratio.
- To show an image, set `src` to a site-root image path such as `/img/blog/my-note.jpg`, and give `alt` a concise description of the image. Images use `object-fit: cover`, so their edges may be cropped to fill the same 2.35:1 area.

Add the image file before building; the checker verifies that configured local images exist. Empty `src` values are valid and require no image file.

## Color themes

`data/site-appearance.json` lists six themes and their color tokens: `academic`, `github`, `teal-gold`, `slate-blue`, `ivory-navy`, and `graphite-lilac`. The short descriptions in that file identify each palette. The default is `github` (GitHub's white, gray and blue palette).

Set `default_theme` to the chosen theme ID, then run `python3 scripts/build_site.py`. The build records this default in the HTML `data-theme` and `data-default-theme` attributes, and the front-end uses the matching palette. Theme selection in the page lets you compare the palettes before choosing the published default.

Open [Color palettes](http://127.0.0.1:8765/appearance.html) in the local preview to compare all six themes. The same page is linked from the homepage and the footer. A browser selection is saved locally; `default_theme` sets the initial palette for visitors without a saved selection.

## Homepage research banner

首页横幅只通过 `data/profile.json` 的 `home_banner` 配置模式、图片和间隔。页面不显示模式选择器、前后切换、暂停按钮或图片计数；旧的浏览器横幅设置不再影响显示。

```json
"home_banner": {
  "enabled": true,
  "src": "/img/research/quantum-materials-banner-v1.jpg",
  "alt": "AI-generated conceptual research image.",
  "mode": "fixed",
  "interval_ms": 6000,
  "slides": [
    { "src": "/img/research/quantum-materials-banner-v1.jpg", "alt": "AI-generated quantum-materials device concept." },
    { "src": "/img/research/quantum-materials-banner-v2.jpg", "alt": "AI-generated graphene device and scanning probe concept." }
  ]
}
```

- `enabled: false` 完全隐藏横幅。
- `mode: "fixed"` 固定显示 `slides[0]`，至少需要一张图。更换固定图片时，修改 `slides[0]`，并同步顶层 `src` 和 `alt`。
- `mode: "carousel"` 按顺序轮播 `slides`，至少需要两张图。
- `interval_ms` 是轮播间隔，单位为毫秒，必须是大于等于 `3000` 的整数；当前 `6000` 表示六秒。
- 每张图片使用本地 `src` 路径，并填写非空的 `alt` 描述。顶层 `src` 和 `alt` 同时用作无 JavaScript 时的首图后备，始终与 `slides[0]` 保持一致。
- 鼠标悬停、键盘焦点进入横幅、页面切到后台或系统请求减少动态效果时，轮播自动暂停。

修改后，在仓库根目录运行以下命令，然后刷新本地预览：

```sh
python3 scripts/build_site.py
```

当前两张图分别展示量子材料测量硬件与扫描探针下的石墨烯器件，均为 AI 生成的研究概念图。来源与生成提示词记录在 [img/research/README.md](img/research/README.md)。

## Synchronize and regenerate CVs

```sh
python3 scripts/sync_cv_data.py
python3 scripts/sync_cv_data.py --check
```

This synchronizes the publication blocks in both TeX files from `data/publications.json`. The surrounding layout, biographical material, employment and contact details are edited in their TeX sources; update those whenever the corresponding profile data changes.

Compile each standalone CV with XeLaTeX from its source directory. Prefer a temporary output directory so auxiliary files stay out of the repository:

```sh
mkdir -p /tmp/xzchen-cv-en /tmp/xzchen-cv-zh
cd XC-EN-CV
xelatex -interaction=nonstopmode -halt-on-error -output-directory=/tmp/xzchen-cv-en XC-EN-CV.tex
xelatex -interaction=nonstopmode -halt-on-error -output-directory=/tmp/xzchen-cv-en XC-EN-CV.tex
cd ../XC-CN-CV
xelatex -interaction=nonstopmode -halt-on-error -output-directory=/tmp/xzchen-cv-zh XC-CN-CV.tex
xelatex -interaction=nonstopmode -halt-on-error -output-directory=/tmp/xzchen-cv-zh XC-CN-CV.tex
```

Inspect every rendered page and extracted text, then copy the verified PDFs to their existing repository paths. Update `profile.updated` when publishing a coordinated content update. Fonts and CV images are retained for reproducibility.

## Checks and publishing

```sh
python3 scripts/build_site.py --check
python3 scripts/check_site.py
python3 scripts/sync_cv_data.py --check
node --check assets/site.js
```

The content checker verifies generated-page metadata, one H1, unique IDs, internal files and fragments, allowed link protocols, article index consistency, and visible unfinished content. CI runs the build and content checks; it does not publish or change Pages settings.

Before publishing, inspect desktop and mobile layouts, menu keyboard access, publication filters, old article URLs, bibliography and both CV downloads. Commit and push only after reviewing the local preview. Deployment continues to use the repository’s existing GitHub Pages configuration; this update does not alter that configuration.
