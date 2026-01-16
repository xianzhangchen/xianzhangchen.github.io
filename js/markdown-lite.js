/*
 * MarkdownLite - a small, dependency-free Markdown renderer for static sites.
 * Supported:
 *  - YAML front-matter (handled in blog-post.js)
 *  - Headings (# .. ######)
 *  - Fenced code blocks (```)
 *  - Inline code (`code`)
 *  - Bold/italic (**bold**, *italic*)
 *  - Links [text](url)
 *  - Images ![alt](url)
 *  - Blockquotes (> )
 *  - Unordered lists (-, *) and ordered lists (1.)
 *  - Horizontal rule (---, ***)
 */
(function () {
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function inline(md) {
    // Escape first; then allow a small subset of inline markdown.
    let s = escapeHtml(md);

    // Images
    s = s.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '<img alt="$1" src="$2" class="img-responsive" />');

    // Links
    s = s.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // Inline code
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic (simple)
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    return s;
  }

  function parse(md) {
    // Normalize newlines
    md = (md || '').replace(/\r\n?/g, '\n');

    // Extract fenced code blocks first (placeholder approach)
    const codeBlocks = [];
    md = md.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)\n```/g, function (_, lang, code) {
      const idx = codeBlocks.length;
      codeBlocks.push({ lang: lang || '', code: escapeHtml(code) });
      return `@@CODEBLOCK_${idx}@@`;
    });

    const lines = md.split('\n');
    let out = [];
    let inUl = false;
    let inOl = false;
    let inQuote = false;
    let paragraph = [];

    function flushParagraph() {
      if (paragraph.length) {
        out.push('<p>' + inline(paragraph.join(' ')).trim() + '</p>');
        paragraph = [];
      }
    }
    function closeLists() {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (inOl) { out.push('</ol>'); inOl = false; }
    }
    function closeQuote() {
      if (inQuote) { flushParagraph(); out.push('</blockquote>'); inQuote = false; }
    }

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Code block placeholder line
      if (/^@@CODEBLOCK_\d+@@$/.test(line.trim())) {
        closeQuote();
        closeLists();
        flushParagraph();
        out.push(line.trim());
        continue;
      }

      // Horizontal rule
      if (/^\s*(---|\*\*\*)\s*$/.test(line)) {
        closeQuote();
        closeLists();
        flushParagraph();
        out.push('<hr />');
        continue;
      }

      // Empty line: end paragraph / lists / quote paragraph (but keep quote open)
      if (/^\s*$/.test(line)) {
        flushParagraph();
        closeLists();
        if (inQuote) {
          // keep blockquote open; paragraph already flushed
        }
        continue;
      }

      // Blockquote
      if (/^\s*>\s?/.test(line)) {
        closeLists();
        if (!inQuote) {
          flushParagraph();
          out.push('<blockquote>');
          inQuote = true;
        }
        const q = line.replace(/^\s*>\s?/, '');
        paragraph.push(q);
        continue;
      } else {
        // Leaving quote
        if (inQuote) {
          closeQuote();
        }
      }

      // Headings
      const h = line.match(/^\s*(#{1,6})\s+(.+?)\s*$/);
      if (h) {
        closeLists();
        flushParagraph();
        const level = h[1].length;
        const text = inline(h[2]);
        // Create id from plain text (strip tags)
        const id = h[2]
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-')
          .slice(0, 64);
        out.push(`<h${level} id="${id}">${text}</h${level}>`);
        continue;
      }

      // Lists
      const ul = line.match(/^\s*[-\*]\s+(.+)$/);
      const ol = line.match(/^\s*(\d+)\.\s+(.+)$/);
      if (ul) {
        if (!inUl) {
          flushParagraph();
          if (inOl) { out.push('</ol>'); inOl = false; }
          out.push('<ul>');
          inUl = true;
        }
        out.push('<li>' + inline(ul[1]).trim() + '</li>');
        continue;
      }
      if (ol) {
        if (!inOl) {
          flushParagraph();
          if (inUl) { out.push('</ul>'); inUl = false; }
          out.push('<ol>');
          inOl = true;
        }
        out.push('<li>' + inline(ol[2]).trim() + '</li>');
        continue;
      }

      // Default: paragraph line
      closeLists();
      paragraph.push(line.trim());
    }

    // Finalize
    closeQuote();
    closeLists();
    flushParagraph();

    let html = out.join('\n');

    // Restore code blocks
    html = html.replace(/@@CODEBLOCK_(\d+)@@/g, function (_, n) {
      const b = codeBlocks[parseInt(n, 10)];
      if (!b) return '';
      const langClass = b.lang ? ` language-${b.lang}` : '';
      return `<pre class="codeblock"><code class="${langClass}">${b.code}</code></pre>`;
    });

    return html;
  }

  // Public API
  window.MarkdownLite = { parse };
  // Backward/compat alias used by older blog-post.js implementations.
  // If a page expects window.renderMarkdown(markdown), provide it.
  if (!window.renderMarkdown) {
    window.renderMarkdown = parse;
  }
})();
