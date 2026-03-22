# Python Cert Reviewer

A browser-based practice environment for Python certification–style questions. It ships as static HTML pages with an auto-graded exam flow: answers are saved in **localStorage**, and scores are computed against a machine-readable key.

## How to use

1. Visit [https://cxletz.github.io/cxcx.py](https://cxletz.github.io/cxcx.py) to use the hosted version in your browser.

To run or develop from this repository instead, see **How to run** below.

## Features

- **57 questions** (`q1.html`–`q57.html`) — multiple choice, drop-downs, checkboxes, text entry, and drag-and-drop segments  
- **Finish Exam** submits and opens a per-question results breakdown  
- **`answer-key.js`** — expected answers (must stay aligned with control order in `exam.js`: selects → radio groups → checkbox block → text inputs → drag-drop slots)

## How to run

1. Clone or download this repository.  
2. Open the project in any static file server **or** open `index.html` in the browser (some browsers restrict `localStorage` on `file://`; a simple server avoids that).  
3. Entry point: root `index.html` redirects to `yukiramain/certlms/index.html` (CERT LMS shell). Use **main.html** inside `certlms` for the question list / exam navigation as wired in the app.

Example with Python:

```bash
cd "yukiramain/certlms"
python -m http.server 8080
```

Then visit `http://localhost:8080/`.

## Project layout

| Path | Role |
|------|------|
| `yukiramain/certlms/` | Main app: questions, `exam.js`, `answer-key.js`, results page |
| `yukiramain/certlms/exam.js` | Save/restore answers, grading, drag-drop serialization |
| `yukiramain/certlms/answer-key.js` | `EXAM_ANSWER_KEY` object |
| `index.html` (repo root) | Shortcut redirect into `certlms` |

Third-party **Bootstrap** assets are vendored under `cdn.jsdelivr.net/` for offline use where included.

## Credits

- **Original creator** — Unknown. The earliest version of this material was scraped or collected from various sources; the original author was not identified.

- **Revision — cxletz** — **cxletz** revised the first code and carried the project forward (the in-app CERT LMS page also references **@cxletz!**).

- **Branding**  
  The CERT LMS UI references **Yukira** (e.g. profile imagery on the landing page).

## License

No license file is included in this repository. Add one if you intend to distribute or accept contributions on GitHub.

