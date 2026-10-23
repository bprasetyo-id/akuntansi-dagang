import os
import json
import subprocess
import time
import pymupdf

WORKSPACE_DIR = r"d:\projects\Akuntansi Dagang"
MD_FILE = os.path.join(WORKSPACE_DIR, "SDLC_AKUNTANSI_DAGANG.md")
HTML_FILE = os.path.join(WORKSPACE_DIR, "sdlc_doc_print.html")
RAW_PDF = os.path.join(WORKSPACE_DIR, "sdlc_raw.pdf")
FINAL_PDF = os.path.join(WORKSPACE_DIR, "SDLC_AKUNTANSI_DAGANG.pdf")
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

with open(MD_FILE, "r", encoding="utf-8") as f:
    md_content = f.read()

# Build HTML template
html_template = f"""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>SDLC & Software Architecture Document - Akuntansi Perusahaan Dagang</title>
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  
  <!-- Highlight.js (Atom One Dark theme for pristine code styling) -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/sql.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/typescript.min.js"></script>
  
  <!-- KaTeX -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
  
  <!-- Marked.js -->
  <script src="https://cdn.jsdelivr.net/npm/marked@9.1.6/marked.min.js"></script>
  
  <!-- Mermaid.js -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>

  <style>
    @page {{
      size: A4 portrait;
      margin: 18mm 16mm 18mm 16mm;
    }}

    *, *::before, *::after {{
      box-sizing: border-box;
    }}

    body {{
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 10pt;
      line-height: 1.6;
      color: #1e293b;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }}

    /* Cover Page */
    .cover-page {{
      height: 100vh;
      min-height: 250mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      padding: 30mm 10mm 15mm 10mm;
      position: relative;
    }}

    .cover-top-badge {{
      display: inline-block;
      align-self: flex-start;
      background: #eef2ff;
      color: #4338ca;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 6px 16px;
      border-radius: 9999px;
      border: 1px solid #c7d2fe;
      margin-bottom: 24px;
    }}

    .cover-title {{
      font-family: 'Outfit', sans-serif;
      font-size: 28pt;
      font-weight: 800;
      line-height: 1.15;
      color: #0f172a;
      margin: 0 0 16px 0;
      letter-spacing: -0.02em;
    }}

    .cover-subtitle {{
      font-size: 13pt;
      line-height: 1.45;
      color: #475569;
      font-weight: 400;
      margin-bottom: 36px;
      max-width: 90%;
    }}

    .cover-divider {{
      width: 80px;
      height: 5px;
      background: linear-gradient(90deg, #4f46e5, #06b6d4);
      border-radius: 4px;
      margin-bottom: 40px;
    }}

    .meta-grid {{
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
      margin-bottom: 40px;
    }}

    .meta-card {{
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
    }}

    .meta-label {{
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 4px;
    }}

    .meta-value {{
      font-size: 9.5pt;
      font-weight: 600;
      color: #0f172a;
    }}

    .cover-footer {{
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8.5pt;
      color: #64748b;
    }}

    /* Main Typography */
    h1 {{
      font-family: 'Outfit', sans-serif;
      font-size: 20pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin-top: 32px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
      page-break-before: always;
    }}

    h1:first-of-type {{
      page-break-before: auto;
    }}

    h2 {{
      font-family: 'Outfit', sans-serif;
      font-size: 15pt;
      font-weight: 700;
      color: #1e1b4b;
      margin-top: 28px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #cbd5e1;
      page-break-after: avoid;
    }}

    h3 {{
      font-family: 'Outfit', sans-serif;
      font-size: 12pt;
      font-weight: 600;
      color: #334155;
      margin-top: 20px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }}

    h4 {{
      font-size: 10.5pt;
      font-weight: 600;
      color: #475569;
      margin-top: 16px;
      margin-bottom: 6px;
      page-break-after: avoid;
    }}

    p {{
      margin: 0 0 10px 0;
      text-align: justify;
    }}

    strong {{
      font-weight: 600;
      color: #0f172a;
    }}

    /* Tables */
    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0 20px 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }}

    th {{
      background-color: #f1f5f9;
      color: #1e293b;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
    }}

    td {{
      padding: 7px 10px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }}

    tbody tr:nth-child(even) {{
      background-color: #f8fafc;
    }}

    /* Code Blocks */
    pre {{
      background-color: #1e293b !important;
      border-radius: 8px;
      padding: 12px 16px;
      margin: 12px 0 18px 0;
      overflow-x: auto;
      border: 1px solid #334155;
      page-break-inside: avoid;
    }}

    code {{
      font-family: 'Fira Code', 'Courier New', monospace;
      font-size: 8pt;
      line-height: 1.45;
    }}

    :not(pre) > code {{
      background-color: #f1f5f9;
      color: #4338ca;
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 8.5pt;
      border: 1px solid #e2e8f0;
      font-weight: 500;
    }}

    /* Mermaid Diagrams */
    .mermaid {{
      display: flex;
      justify-content: center;
      margin: 20px 0 24px 0;
      padding: 16px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      page-break-inside: avoid;
    }}

    .mermaid svg {{
      max-width: 100% !important;
      height: auto !important;
    }}

    /* KaTeX math formulas */
    .katex-display {{
      margin: 12px 0 16px 0 !important;
      padding: 8px 14px;
      background: #f8fafc;
      border-radius: 6px;
      border-left: 3px solid #6366f1;
      overflow-x: auto;
      page-break-inside: avoid;
    }}

    /* Blockquotes / Callouts */
    blockquote {{
      margin: 14px 0;
      padding: 10px 16px;
      background-color: #f0fdf4;
      border-left: 4px solid #16a34a;
      border-radius: 0 6px 6px 0;
      color: #166534;
      font-size: 9pt;
      page-break-inside: avoid;
    }}

    blockquote p {{
      margin: 0;
    }}

    ul, ol {{
      margin: 0 0 12px 0;
      padding-left: 22px;
    }}

    li {{
      margin-bottom: 4px;
    }}

    hr {{
      border: 0;
      height: 1px;
      background: #e2e8f0;
      margin: 24px 0;
    }}
  </style>
</head>
<body>

  <!-- Cover Page -->
  <div class="cover-page">
    <div>
      <div class="cover-top-badge">Spesifikasi Arsitektur Sistem & SDLC</div>
      <h1 class="cover-title" style="page-break-before: auto; border: none; padding: 0;">SISTEM INFORMASI AKUNTANSI PERUSAHAAN DAGANG</h1>
      <p class="cover-subtitle">
        Dokumentasi Rekayasa Perangkat Lunak, Rancangan Arsitektur Double-Entry Bookkeeping, Skema Database Relasional, dan Algoritma Pelaporan Finansial Komprehensif Berbasis Web.
      </p>
      <div class="cover-divider"></div>
      
      <div class="meta-grid">
        <div class="meta-card">
          <div class="meta-label">Domain Sistem</div>
          <div class="meta-value">Akuntansi Khusus Perusahaan Dagang (Merchandising)</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">Teknologi Frontend</div>
          <div class="meta-value">React 18/19, Tailwind CSS, TanStack Query</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">Backend & Database</div>
          <div class="meta-value">Supabase Cloud, PostgreSQL 15+, PL/pgSQL Triggers</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">Pondasi Akuntansi</div>
          <div class="meta-value">Strict Double-Entry Engine & Multi-Step Income Statement</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">Penyusun Dokumen</div>
          <div class="meta-value">Senior System Analyst & Software Architect</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">Status & Versi</div>
          <div class="meta-value">Versi 1.0.0 — Production Ready</div>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div>Enterprise Architecture Framework &bull; SDLC Specification</div>
      <div>Oktober 2026 &bull; DOKUMEN RESMI</div>
    </div>
  </div>

  <!-- Document Content Target -->
  <main id="content"></main>

  <script>
    const rawMarkdown = {json.dumps(md_content)};

    document.addEventListener("DOMContentLoaded", async function() {{
      marked.use({{
        gfm: true,
        breaks: false
      }});

      // 1. Parse Markdown into HTML
      const html = marked.parse(rawMarkdown);
      const container = document.getElementById('content');
      container.innerHTML = html;

      // 2. Transform Mermaid code blocks into <div class="mermaid">
      const mermaidNodes = [];
      container.querySelectorAll('pre code.language-mermaid').forEach((el) => {{
        const pre = el.parentElement;
        const div = document.createElement('div');
        div.className = 'mermaid';
        div.textContent = el.textContent;
        pre.replaceWith(div);
        mermaidNodes.push(div);
      }});

      // 3. Highlight code blocks (SQL, TSX, etc.)
      container.querySelectorAll('pre code:not(.language-mermaid)').forEach((block) => {{
        hljs.highlightElement(block);
      }});

      // 4. Render KaTeX Formulas (both block $$ and inline $)
      renderMathInElement(container, {{
        delimiters: [
          {{left: '$$', right: '$$', display: true}},
          {{left: '$', right: '$', display: false}}
        ],
        throwOnError: false
      }});

      // 5. Initialize and Run Mermaid
      if (mermaidNodes.length > 0) {{
        mermaid.initialize({{
          startOnLoad: false,
          theme: 'neutral',
          themeVariables: {{
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            primaryColor: '#e0e7ff',
            primaryBorderColor: '#6366f1',
            primaryTextColor: '#1e1b4b',
            lineColor: '#64748b'
          }}
        }});
        await mermaid.run({{ nodes: mermaidNodes }});
      }}

      // Mark page as ready for printing
      document.body.setAttribute('data-rendered', 'true');
    }});
  </script>
</body>
</html>
"""

with open(HTML_FILE, "w", encoding="utf-8") as f:
    f.write(html_template)
print(f"[1/4] HTML print preview saved to: {HTML_FILE}")

# Execute Chrome Headless to compile PDF
print("[2/4] Compiling HTML to PDF using Chrome Headless...")
chrome_cmd = f'"{CHROME_PATH}" --headless=new --disable-gpu --no-sandbox --no-pdf-header-footer --virtual-time-budget=12000 --print-to-pdf="{RAW_PDF}" "{HTML_FILE}"'

res = subprocess.run(chrome_cmd, shell=True, capture_output=True, text=True)
if res.returncode != 0:
    print(f"Error running Chrome: {res.stderr}")
    exit(1)

print(f"[3/4] Chrome rendered raw PDF: {RAW_PDF}")

# Post-process with PyMuPDF to add professional running headers and footers
print("[4/4] Adding professional running headers, footers & page numbers via PyMuPDF...")
doc = pymupdf.open(RAW_PDF)
total_pages = len(doc)
print(f"Total document pages: {total_pages}")

# Header & Footer formatting (Exclude Cover Page = page 0)
for i in range(1, total_pages):
    page = doc[i]
    rect = page.rect
    width = rect.width
    height = rect.height
    
    # Header: Running title + hairline rule
    header_text = "Sistem Informasi Akuntansi Dagang | SDLC & Software Architecture"
    page.insert_text(
        pymupdf.Point(45, 32),
        header_text,
        fontsize=7.5,
        fontname="helv",
        color=(0.4, 0.45, 0.5)
    )
    page.draw_line(
        pymupdf.Point(45, 38),
        pymupdf.Point(width - 45, 38),
        color=(0.85, 0.88, 0.92),
        width=0.5
    )
    
    # Footer: Hairline rule + confidentiality + page numbers
    page.draw_line(
        pymupdf.Point(45, height - 38),
        pymupdf.Point(width - 45, height - 38),
        color=(0.85, 0.88, 0.92),
        width=0.5
    )
    footer_left = "Dokumen Spesifikasi Teknis — Confidential & Proprietary"
    page.insert_text(
        pymupdf.Point(45, height - 26),
        footer_left,
        fontsize=7.5,
        fontname="helv",
        color=(0.45, 0.5, 0.55)
    )
    footer_right = f"Halaman {i + 1} dari {total_pages}"
    text_len = len(footer_right) * 4.5
    page.insert_text(
        pymupdf.Point(width - 45 - text_len, height - 26),
        footer_right,
        fontsize=7.5,
        fontname="helv",
        color=(0.45, 0.5, 0.55)
    )

doc.save(FINAL_PDF)
doc.close()

# Cleanup raw PDF
if os.path.exists(RAW_PDF):
    os.remove(RAW_PDF)

file_size_kb = os.path.getsize(FINAL_PDF) / 1024
print(f"PDF GENERATION SUCCESSFUL!")
print(f"File Output: {FINAL_PDF}")
print(f"File Size: {file_size_kb:.2f} KB")
print(f"Total Pages: {total_pages}")
