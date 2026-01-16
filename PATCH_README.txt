Blog patch (Markdown render + HTML/PDF links)

Files included:
- blog-post.html
- blog/index.html
- js/blog-post.js
- js/blog-index.js
- js/markdown-lite.js
- css/blog-typography.css

How to apply:
1) Unzip into your website repository root (same level as index.html) and overwrite.
2) Commit & push. (GitHub Pages will update.)

Markdown posts:
- Keep writing blog/posts/<slug>.md
- Keep listing in blog/posts/index.json with {slug,title,date,...}

HTML/PDF as a post entry:
- Put your file under blog/posts/ (recommended) e.g. blog/posts/my_note.pdf
- Add an item in blog/posts/index.json with a url field:
  {
    "title": "My PDF Note",
    "date": "2026-01-16",
    "url": "posts/my_note.pdf",
    "type": "pdf",
    "excerpt": "..."
  }

Notes:
- blog-post.js now renders Markdown using MarkdownLite.parse() (and keeps a renderMarkdown alias).
- blog-post.js also fixes relative links/images inside posts by prefixing blog/posts/.
