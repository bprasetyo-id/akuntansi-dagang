import os
import json
import subprocess
import time
import pymupdf

WORKSPACE_DIR = r"d:\projects\Akuntansi Dagang"
MD_FILE = os.path.join(WORKSPACE_DIR, "PANDUAN_MANAJEMEN_USER_LEVEL_AKUNTANSI.md")
HTML_FILE = os.path.join(WORKSPACE_DIR, "user_level_doc_print.html")
RAW_PDF = os.path.join(WORKSPACE_DIR, "user_level_raw.pdf")
FINAL_PDF = os.path.join(WORKSPACE_DIR, "PANDUAN_MANAJEMEN_USER_LEVEL_AKUNTANSI.pdf")
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

with open(MD_FILE, "r", encoding="utf-8") as f:
    md_content = f.read()

# Build HTML template with executive styling
html_template = f"""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Panduan & Kebijakan Manajemen User Level - Sistem Akuntansi Dagang</title>
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  
  <!-- Highlight.js -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/sql.min.js"></script>
  
  <!-- Marked.js -->
  <script src="https://cdn.jsdelivr.net/npm/marked@9.1.6/marked.min.js"></script>
  
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
      font-size: 26pt;
      font-weight: 800;
      line-height: 1.2;
      color: #0f172a;
      margin: 0 0 16px 0;
      letter-spacing: -0.02em;
    }}

    .cover-subtitle {{
      font-size: 13pt;
      line-height: 1.5;
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
      font-size: 18pt;
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
      font-size: 14pt;
      font-weight: 700;
      color: #1e1b4b;
      margin-top: 26px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #cbd5e1;
      page-break-after: avoid;
    }}

    h3 {{
      font-family: 'Outfit', sans-serif;
      font-size: 11.5pt;
      font-weight: 600;
      color: #334155;
      margin-top: 18px;
      margin-bottom: 8px;
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
      background-color: #0f172a !important;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 12px 16px;
      overflow-x: auto;
      margin: 12px 0 16px 0;
      page-break-inside: avoid;
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
    }}

    pre code {{
      font-family: 'Fira Code', monospace;
      font-size: 8.5pt;
      color: #e2e8f0 !important;
    }}

    code {{
      font-family: 'Fira Code', monospace;
      font-size: 8.5pt;
    }}

    p code, li code, td code {{
      background-color: #f1f5f9;
      color: #4338ca;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 8pt;
      border: 1px solid #e2e8f0;
    }}

    /* Callouts / Blockquotes */
    blockquote {{
      background-color: #f0fdf4;
      border-left: 4px solid #16a34a;
      margin: 14px 0;
      padding: 12px 18px;
      color: #166534;
      font-size: 9.5pt;
      border-radius: 0 8px 8px 0;
      page-break-inside: avoid;
    }}

    blockquote p {{
      margin: 0;
    }}

    /* ASCII Diagrams */
    pre code.language-text {{
      color: #38bdf8;
      font-size: 8pt;
      line-height: 1.35;
    }}

    /* User Level Hierarchy Visual Cards */
    .user-levels-container {{
      margin: 16px 0 20px 0;
      page-break-inside: avoid;
    }}
    .user-card-top {{
      background: #eef2ff;
      border: 1.5px solid #6366f1;
      border-radius: 8px;
      padding: 10px 16px;
      text-align: center;
      margin-bottom: 10px;
      box-shadow: 0 1px 3px rgba(99, 102, 241, 0.1);
    }}
    .user-card-grid {{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }}
    .user-card-sub {{
      border-radius: 8px;
      padding: 10px 10px;
      text-align: center;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }}
    .card-akuntan {{
      background: #f0fdf4;
      border: 1.5px solid #22c55e;
    }}
    .card-kasir {{
      background: #f0f9ff;
      border: 1.5px solid #0ea5e9;
    }}
    .card-auditor {{
      background: #fefce8;
      border: 1.5px solid #eab308;
    }}
    .card-badge {{
      display: inline-block;
      color: #ffffff;
      font-size: 6.5pt;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 2px 7px;
      border-radius: 999px;
      margin-bottom: 4px;
    }}
    .badge-owner {{ background: #4f46e5; }}
    .badge-akuntan {{ background: #16a34a; }}
    .badge-kasir {{ background: #0284c7; }}
    .badge-auditor {{ background: #ca8a04; }}
    .card-title {{
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 9.5pt;
      margin-bottom: 2px;
    }}
    .card-desc {{
      font-size: 7.2pt;
      line-height: 1.35;
      color: #475569;
    }}

    ul, ol {{
      margin: 6px 0 12px 0;
      padding-left: 22px;
    }}

    li {{
      margin-bottom: 4px;
    }}
  </style>
</head>
<body>

  <!-- Cover Page -->
  <div class="cover-page">
    <div>
      <div class="cover-top-badge">TATA KELOLA & PENGENDALIAN INTERNAL (INTERNAL CONTROL)</div>
      <h1 class="cover-title" style="page-break-before: auto; border-bottom: none;">
        PANDUAN & KEBIJAKAN<br>MANAJEMEN USER LEVEL
      </h1>
      <div class="cover-subtitle">
        Pedoman Standar Hak Akses, Segregation of Duties (SoD), dan Implementasi Keamanan Database Row Level Security (RLS) pada Sistem Akuntansi Perusahaan Dagang
      </div>
      <div class="cover-divider"></div>
      
      <div class="meta-grid">
        <div class="meta-card">
          <div class="meta-label">Nama Dokumen</div>
          <div class="meta-value">User Authority & Access Management Guide</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">Standar Kepatuhan</div>
          <div class="meta-value">COSO Internal Control & SAK Indonesia</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">Teknologi Enkripsi & RLS</div>
          <div class="meta-value">PostgreSQL Row Level Security (Supabase)</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">Target Pengguna</div>
          <div class="meta-value">Owner, Akuntan, Kasir Toko, dan Auditor</div>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div><strong>Sistem Informasi Akuntansi Dagang</strong> &bull; Versi 1.0 (Production)</div>
      <div>Oktober 2026 &bull; Tim Software Architect & DBA</div>
    </div>
  </div>

  <!-- Content Container -->
  <div id="content"></div>

  <script>
    const markdownText = {json.dumps(md_content)};
    
    marked.setOptions({{
      gfm: true,
      breaks: true,
      highlight: function(code, lang) {{
        const language = highlight.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, {{ language }}).value;
      }}
    }});

    document.getElementById('content').innerHTML = marked.parse(markdownText);
  </script>
</body>
</html>
"""

with open(HTML_FILE, "w", encoding="utf-8") as f:
    f.write(html_template)
print(f"[1/4] HTML template saved to: {HTML_FILE}")

# Execute Chrome Headless to compile PDF
print("[2/4] Compiling HTML to PDF using Chrome Headless...")
chrome_cmd = f'"{CHROME_PATH}" --headless=new --disable-gpu --no-sandbox --no-pdf-header-footer --virtual-time-budget=10000 --print-to-pdf="{RAW_PDF}" "{HTML_FILE}"'

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
    header_text = "Sistem Akuntansi Dagang | Kebijakan Manajemen User Level & SoD"
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
    footer_left = "Dokumen Tata Kelola Finansial — Confidential & Proprietary"
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

output_saved_path = FINAL_PDF
try:
    doc.save(FINAL_PDF)
except Exception as save_err:
    output_saved_path = os.path.join(WORKSPACE_DIR, "PANDUAN_MANAJEMEN_USER_LEVEL_AKUNTANSI_V2.pdf")
    doc.save(output_saved_path)
    print(f"Catatan: File asli sedang dibuka di PDF viewer. Berhasil disimpan ke: {output_saved_path}")

doc.close()

# Cleanup raw PDF and HTML
if os.path.exists(RAW_PDF):
    os.remove(RAW_PDF)

file_size_kb = os.path.getsize(output_saved_path) / 1024
print(f"PDF GENERATION SUCCESSFUL!")
print(f"File Output: {output_saved_path}")
print(f"File Size: {file_size_kb:.2f} KB")
print(f"Total Pages: {total_pages}")
