"""One-time inject exam.css, toolbar, results panel, and scripts into HTML pages."""
import glob
import os

BASE = os.path.dirname(os.path.abspath(__file__))
LINK = '    <link rel="stylesheet" href="exam.css">\n'
TOOLBAR = """<p class="exam-exam-toolbar d-inline-flex gap-2 flex-wrap align-items-center mb-2">
  <button type="button" id="exam-finish-btn" class="btn btn-danger">Finish Exam</button>
</p>
<div id="exam-results-panel" class="exam-results-panel" hidden></div>
"""
SCRIPTS = '    <script src="answer-key.js"></script>\n    <script src="exam.js"></script>\n'

paths = sorted(glob.glob(os.path.join(BASE, "q*.php.html")))
paths.append(os.path.join(BASE, "main.php.html"))

for path in paths:
    if not os.path.isfile(path):
        continue
    with open(path, encoding="utf-8", errors="replace") as f:
        c = f.read()
    if "exam.js" in c:
        print("skip (already injected):", os.path.basename(path))
        continue
    if 'href="exam.css"' not in c and "</head>" in c:
        c = c.replace("</head>", LINK + "</head>", 1)
    if "exam-results-panel" not in c and "<hr>" in c:
        c = c.replace("<hr>", "<hr>\n" + TOOLBAR, 1)
    if "exam.js" not in c:
        c = c.replace("</body>", SCRIPTS + "</body>", 1)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(c)
    print("injected:", os.path.basename(path))
