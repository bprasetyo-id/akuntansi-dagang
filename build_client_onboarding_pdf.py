import os
import json
import subprocess
import time
import pymupdf

WORKSPACE_DIR = r"d:\projects\Akuntansi Dagang"
MD_FILE = os.path.join(WORKSPACE_DIR, "PANDUAN_PERSIAPAN_DAN_ONBOARDING_KLIEN.md")
HTML_FILE = os.path.join(WORKSPACE_DIR, "client_onboarding_print.html")
RAW_PDF = os.path.join(WORKSPACE_DIR, "client_onboarding_raw.pdf")
FINAL_PDF = os.path.join(WORKSPACE_DIR, "PANDUAN_PERSIAPAN_DAN_ONBOARDING_KLIEN.pdf")
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

with open(MD_FILE, "r", encoding="utf-8") as f:
    md_content = f.read()

# Build HTML template with modern executive styling
html_template = f"""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Panduan Persiapan & Onboarding Klien Baru - SIA Dagang</title>
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  
  <!-- Highlight.js -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  
  <!-- Marked.js -->
  <script src="https://cdn.jsdelivr.net/npm/marked@9.1.6/marked.min.js"></script>

  <style>
    @page {{
      size: A4 portrait;
      margin: 18mm 16mm 20mm 16mm;
      @bottom-right {{
        content: counter(page);
      }}
    }}

    * {{
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }}

    body {{
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 9.5pt;
      line-height: 1.55;
      color: #1e293b;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }}

    h1, h2, h3, h4, h5, h6 {{
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin-top: 1.4em;
      margin-bottom: 0.5em;
      page-break-after: avoid;
    }}

    h1 {{
      font-size: 19pt;
      color: #1e1b4b;
      border-bottom: 2px solid #e0e7ff;
      padding-bottom: 8px;
      margin-top: 0;
    }}

    h2 {{
      font-size: 13pt;
      color: #1e1b4b;
      background: #f8fafc;
      border-left: 4px solid #4f46e5;
      padding: 6px 12px;
      border-radius: 0 6px 6px 0;
      margin-top: 1.6em;
    }}

    h3 {{
      font-size: 10.5pt;
      color: #4338ca;
      margin-top: 1.2em;
    }}

    p, li {{
      color: #334155;
    }}

    ul, ol {{
      padding-left: 20px;
      margin-top: 0.4em;
      margin-bottom: 0.6em;
    }}

    li {{
      margin-bottom: 0.3em;
    }}

    strong {{
      color: #0f172a;
      font-weight: 600;
    }}

    blockquote {{
      margin: 1em 0;
      padding: 10px 16px;
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      border-radius: 0 8px 8px 0;
      font-style: italic;
      color: #1e40af;
      page-break-inside: avoid;
    }}

    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 1.2em 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }}

    th {{
      background-color: #f1f5f9;
      color: #1e293b;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      font-family: 'Outfit', sans-serif;
    }}

    td {{
      padding: 7px 10px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }}

    tr:nth-child(even) td {{
      background-color: #f8fafc;
    }}

    code {{
      font-family: 'Fira Code', monospace;
      font-size: 8.5pt;
      background-color: #f1f5f9;
      color: #4f46e5;
      padding: 1px 5px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }}

    pre {{
      background-color: #0f172a !important;
      border-radius: 8px;
      padding: 12px 16px;
      overflow-x: auto;
      margin: 1em 0;
      page-break-inside: avoid;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid #1e293b;
    }}

    pre code {{
      font-family: 'Fira Code', monospace;
      font-size: 8pt;
      line-height: 1.5;
      color: #e2e8f0 !important;
      background: transparent !important;
      border: none;
      padding: 0;
    }}

    hr {{
      border: 0;
      height: 1px;
      background: #e2e8f0;
      margin: 24px 0;
    }}

    .header-doc {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }}

    .brand-title {{
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 13pt;
      color: #4f46e5;
      letter-spacing: -0.02em;
    }}

    .brand-sub {{
      font-size: 8pt;
      color: #64748b;
      font-weight: 500;
    }}

    .doc-meta {{
      text-align: right;
      font-size: 8pt;
      color: #64748b;
    }}

    .badge-confidential {{
      display: inline-block;
      padding: 3px 8px;
      background-color: #f0fdf4;
      color: #166534;
      font-weight: 700;
      border-radius: 4px;
      font-size: 7.5pt;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      border: 1px solid #bbf7d0;
    }}
  </style>
</head>
<body>
  <div class="header-doc">
    <div>
      <div class="brand-title">SIA DAGANG CLOUD ERP</div>
      <div class="brand-sub">Standar Operasional Prosedur (SOP) Implementasi & Onboarding Klien B2B</div>
    </div>
    <div class="doc-meta">
      <span class="badge-confidential">STANDARD OPERATING PROCEDURE</span><br>
      <span style="font-size: 7.5pt; color: #94a3b8;">Edisi Rilis Operasional &bull; 2026</span>
    </div>
  </div>

  <div id="content"></div>

  <script>
    const mdText = {json.dumps(md_content)};
    marked.setOptions({{
      gfm: true,
      breaks: false,
      headerIds: true
    }});
    document.getElementById('content').innerHTML = marked.parse(mdText);
    hljs.highlightAll();
  </script>
</body>
</html>
"""

with open(HTML_FILE, "w", encoding="utf-8") as f:
    f.write(html_template)

print("HTML print file generated. Rendering PDF via Headless Chrome...")

chrome_cmd = [
    CHROME_PATH,
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--run-all-compositor-stages-before-draw",
    f"--print-to-pdf={RAW_PDF}",
    "--print-to-pdf-no-header",
    f"file:///{HTML_FILE.replace(os.sep, '/')}"
]

subprocess.run(chrome_cmd, check=True)
print("Raw PDF created via Chrome.")

# Post-processing with PyMuPDF for footer and page numbers
doc = pymupdf.open(RAW_PDF)
total_pages = len(doc)
print(f"Total pages rendered: {total_pages}")

footer_font = "helv"
footer_size = 7.5
color_slate = (0.45, 0.50, 0.58)

for page_idx, page in enumerate(doc):
    page_num = page_idx + 1
    rect = page.rect
    
    line_y = rect.height - 35
    page.draw_line(
        pymupdf.Point(45, line_y),
        pymupdf.Point(rect.width - 45, line_y),
        color=(0.88, 0.91, 0.94),
        width=0.6
    )
    
    left_text = "SIA Dagang Cloud ERP — Panduan Persiapan & Onboarding Klien B2B"
    page.insert_text(
        pymupdf.Point(45, rect.height - 22),
        left_text,
        fontsize=footer_size,
        fontname=footer_font,
        color=color_slate
    )
    
    right_text = f"Halaman {page_num} dari {total_pages}"
    page.insert_text(
        pymupdf.Point(rect.width - 110, rect.height - 22),
        right_text,
        fontsize=footer_size,
        fontname=footer_font,
        color=color_slate
    )

try:
    doc.save(FINAL_PDF)
    print(f"Final Client Onboarding PDF successfully generated at: {FINAL_PDF}")
except Exception as e:
    alt_pdf = os.path.join(WORKSPACE_DIR, f"PANDUAN_PERSIAPAN_DAN_ONBOARDING_KLIEN_{int(time.time())}.pdf")
    doc.save(alt_pdf)
    print(f"Saved to alternative path: {alt_pdf}")
doc.close()
