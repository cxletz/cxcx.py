(function () {
  "use strict";

  var STORAGE_KEY = "python-cert-exam-v1";

  function getRoot() {
    return document.querySelector(".container-fluid") || document.body;
  }

  function getQuestionId() {
    var path = location.pathname || "";
    var file = path.replace(/^.*[\\/]/, "");
    var m = file.match(/^(q\d+)\.html$/i);
    if (!m) {
      m =
        path.match(/(q\d+)\.php\.html?$/i) || path.match(/(q\d+)\.php$/i);
    }
    return m ? m[1].toLowerCase() : null;
  }

  function normalize(s) {
    return String(s == null ? "" : s)
      .trim()
      .replace(/\s+/g, " ");
  }

  function loadStore() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  function saveStore(store) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      console.warn("Exam: could not save to localStorage", e);
    }
  }

  function getRadioGroups(root) {
    var radios = Array.prototype.slice.call(
      root.querySelectorAll('input[type="radio"]')
    );
    var groups = new Map();
    radios.forEach(function (r, i) {
      var key = r.name ? r.name : "__anon_" + i;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    });
    var ordered = [];
    var seen = new Set();
    radios.forEach(function (r, i) {
      var key = r.name ? r.name : "__anon_" + i;
      if (!seen.has(key)) {
        seen.add(key);
        ordered.push(groups.get(key));
      }
    });
    return ordered;
  }

  function serializeRadioGroups(root) {
    var parts = [];
    getRadioGroups(root).forEach(function (group) {
      var idx = -1;
      for (var i = 0; i < group.length; i++) {
        if (group[i].checked) {
          idx = i;
          break;
        }
      }
      parts.push(idx < 0 ? "" : String(idx));
    });
    return parts;
  }

  function applyRadioGroups(root, values) {
    var groups = getRadioGroups(root);
    var vi = 0;
    groups.forEach(function (group) {
      var v = values[vi++];
      if (v === undefined) return;
      var n = parseInt(v, 10);
      if (v === "" || v === null) {
        group.forEach(function (r) {
          r.checked = false;
        });
        return;
      }
      if (!isNaN(n) && n >= 0 && n < group.length) {
        group.forEach(function (r, j) {
          r.checked = j === n;
        });
      }
    });
  }

  function serializeSelects(root) {
    var parts = [];
    root.querySelectorAll("select").forEach(function (sel) {
      var opt = sel.options[sel.selectedIndex];
      parts.push(opt ? normalize(opt.textContent) : "");
    });
    return parts;
  }

  function applySelects(root, values) {
    var sels = root.querySelectorAll("select");
    var i = 0;
    sels.forEach(function (sel) {
      var want = values[i++];
      if (want === undefined) return;
      var found = false;
      for (var o = 0; o < sel.options.length; o++) {
        if (normalize(sel.options[o].textContent) === normalize(want)) {
          sel.selectedIndex = o;
          found = true;
          break;
        }
      }
      if (!found && want === "") sel.selectedIndex = 0;
    });
  }

  function serializeCheckboxes(root) {
    var boxes = root.querySelectorAll('input[type="checkbox"]');
    if (boxes.length === 0) return [];
    var idxs = [];
    for (var i = 0; i < boxes.length; i++) {
      if (boxes[i].checked) idxs.push(i);
    }
    return [idxs.join(",")];
  }

  function applyCheckboxes(root, values) {
    var boxes = root.querySelectorAll('input[type="checkbox"]');
    if (boxes.length === 0) return;
    var raw = values && values[0] != null ? String(values[0]) : "";
    var set = {};
    if (raw.trim()) {
      raw.split(",").forEach(function (p) {
        var n = parseInt(p.trim(), 10);
        if (!isNaN(n)) set[n] = true;
      });
    }
    for (var i = 0; i < boxes.length; i++) {
      boxes[i].checked = !!set[i];
    }
  }

  function serializeTextInputs(root) {
    var parts = [];
    root.querySelectorAll('input[type="text"]').forEach(function (inp) {
      parts.push(normalize(inp.value));
    });
    return parts;
  }

  function applyTextInputs(root, values) {
    var i = 0;
    root.querySelectorAll('input[type="text"]').forEach(function (inp) {
      if (values[i] !== undefined) inp.value = values[i];
      i++;
    });
  }

  /**
   * Order: selects → radio groups → checkbox aggregate → text inputs.
   * Must match answer-key.js arrays.
   */
  function collectPageState() {
    var root = getRoot();
    var out = [];
    serializeSelects(root).forEach(function (x) {
      out.push(x);
    });
    serializeRadioGroups(root).forEach(function (x) {
      out.push(x);
    });
    serializeCheckboxes(root).forEach(function (x) {
      out.push(x);
    });
    serializeTextInputs(root).forEach(function (x) {
      out.push(x);
    });
    return out;
  }

  function applyPageState(values) {
    if (!values || !values.length) return;
    var root = getRoot();
    var i = 0;
    var selCount = root.querySelectorAll("select").length;
    var radParts = getRadioGroups(root).length;
    var cbParts = root.querySelectorAll('input[type="checkbox"]').length
      ? 1
      : 0;
    var txtCount = root.querySelectorAll('input[type="text"]').length;

    var selVals = values.slice(i, i + selCount);
    i += selCount;
    applySelects(root, selVals);

    var radVals = values.slice(i, i + radParts);
    i += radParts;
    applyRadioGroups(root, radVals);

    var cbVals = values.slice(i, i + cbParts);
    i += cbParts;
    applyCheckboxes(root, cbVals);

    var txtVals = values.slice(i, i + txtCount);
    applyTextInputs(root, txtVals);
  }

  function saveCurrentPage() {
    var qid = getQuestionId();
    if (!qid) return;
    var store = loadStore();
    store[qid] = collectPageState();
    saveStore(store);
  }

  function restoreCurrentPage() {
    var qid = getQuestionId();
    if (!qid) return;
    var store = loadStore();
    if (!store[qid]) return;
    applyPageState(store[qid]);
  }

  function resetCurrentPageControls() {
    var root = getRoot();
    root.querySelectorAll("select").forEach(function (sel) {
      sel.selectedIndex = 0;
    });
    getRadioGroups(root).forEach(function (group) {
      group.forEach(function (r) {
        r.checked = false;
      });
    });
    root.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      cb.checked = false;
    });
    root.querySelectorAll('input[type="text"]').forEach(function (inp) {
      inp.value = "";
    });
  }

  function partMatch(expected, actual) {
    if (expected === "*" || expected === null) return true;
    return normalize(actual) === normalize(expected);
  }

  function gradeQuestion(qid, expected, actual) {
    if (!expected || !Array.isArray(expected) || expected.length === 0) {
      return {
        kind: "nokey",
        parts: [],
        correctCount: 0,
        totalGraded: 0,
      };
    }
    if (!actual || !actual.length) {
      var gradedSlots = 0;
      for (var g = 0; g < expected.length; g++) {
        if (expected[g] !== "*" && expected[g] !== null) gradedSlots++;
      }
      if (gradedSlots === 0) gradedSlots = expected.length;
      return {
        kind: "empty",
        parts: [],
        correctCount: 0,
        totalGraded: gradedSlots,
      };
    }
    var parts = [];
    var correct = 0;
    var totalGraded = 0;
    for (var i = 0; i < expected.length; i++) {
      var ex = expected[i];
      var ac = actual[i] !== undefined ? actual[i] : "";
      var ok = partMatch(ex, ac);
      var graded = ex !== "*" && ex !== null;
      if (graded) {
        totalGraded++;
        if (ok) correct++;
      }
      parts.push({
        index: i + 1,
        expected: ex,
        actual: ac,
        ok: ok,
        graded: graded,
      });
    }
    var lenOk = actual.length === expected.length;
    var kind = "incorrect";
    if (lenOk && totalGraded > 0 && correct === totalGraded) kind = "correct";
    else if (!lenOk) kind = "incorrect";
    return {
      kind: kind,
      parts: parts,
      correctCount: correct,
      totalGraded: totalGraded,
      lenOk: lenOk,
    };
  }

  function renderResults(score, total, rows) {
    var panel = document.getElementById("exam-results-panel");
    if (!panel) return;

    var pct = total > 0 ? Math.round((score / total) * 1000) / 10 : 0;
    var html = "";
    html +=
      '<h3>Exam results</h3><div class="exam-score-summary">Score: ' +
      score +
      " / " +
      total +
      " (" +
      pct +
      "%)</div>";
    html += '<table class="exam-results-table"><thead><tr>';
    html +=
      "<th>Question</th><th>Status</th><th>Detail</th></tr></thead><tbody>";

    rows.forEach(function (r) {
      var rowClass = "exam-result-row--nokey";
      if (r.rowKind === "correct") rowClass = "exam-result-row--correct";
      else if (r.rowKind === "incorrect") rowClass = "exam-result-row--incorrect";
      else if (r.rowKind === "partial") rowClass = "exam-result-row--partial";
      else if (r.rowKind === "empty") rowClass = "exam-result-row--empty";

      html += '<tr class="' + rowClass + '">';
      html += "<td><b>" + r.qid + "</b></td>";
      html += "<td>" + r.label + "</td>";
      html += "<td>" + r.detail + "</td>";
      html += "</tr>";
    });

    html += "</tbody></table>";
    html +=
      '<div class="exam-retake-wrap"><button type="button" id="exam-retake-btn" class="btn btn-warning">Retake Exam</button></div>';
    panel.innerHTML = html;
    panel.hidden = false;
    panel.scrollIntoView({ behavior: "smooth", block: "start" });

    var retake = document.getElementById("exam-retake-btn");
    if (retake) {
      retake.addEventListener("click", function () {
        retakeExam();
      });
    }
  }

  function finishExam() {
    saveCurrentPage();
    if (
      !confirm(
        "Submit and finish the exam? Your answers saved in this browser will be scored."
      )
    ) {
      return;
    }

    var store = loadStore();
    var key = window.EXAM_ANSWER_KEY || {};
    var score = 0;
    var total = 0;
    var rows = [];

    for (var n = 1; n <= 57; n++) {
      var qid = "q" + n;
      var expected = key[qid];
      var actual = store[qid];

      if (expected === null || expected === undefined) {
        rows.push({
          qid: qid,
          rowKind: "nokey",
          label: "Not graded",
          detail:
            "No answer key configured for this question. Edit answer-key.js to add it.",
        });
        continue;
      }

      if (!Array.isArray(expected) || !expected.length) {
        rows.push({
          qid: qid,
          rowKind: "nokey",
          label: "Not graded",
          detail: "Empty answer key entry.",
        });
        continue;
      }

      var g = gradeQuestion(qid, expected, actual);

      if (g.kind === "empty") {
        rows.push({
          qid: qid,
          rowKind: "empty",
          label: "Unanswered",
          detail: "No saved answers for this question.",
        });
        total += g.totalGraded;
        continue;
      }

      var partLines = g.parts
        .map(function (p) {
          if (!p.graded) {
            return (
              '<div class="exam-part-detail exam-part-line--ok">Part ' +
              p.index +
              ": (wildcard — not scored)</div>"
            );
          }
          var span = p.ok ? "exam-part-line--ok" : "exam-part-line--bad";
          return (
            '<div class="exam-part-detail ' +
            span +
            '">Part ' +
            p.index +
            ": " +
            (p.ok ? "Correct" : "Incorrect") +
            " — yours: <code>" +
            escapeHtml(String(p.actual)) +
            "</code> (expected: <code>" +
            escapeHtml(String(p.expected)) +
            "</code>)</div>"
          );
        })
        .join("");
      if (g.lenOk === false) {
        partLines =
          '<div class="exam-part-detail exam-part-line--bad">Saved answer length does not match answer key (wrong number of parts).</div>' +
          partLines;
      }

      var rowKind = "incorrect";
      if (
        g.lenOk &&
        g.totalGraded > 0 &&
        g.correctCount === g.totalGraded
      ) {
        rowKind = "correct";
      }
      score += g.correctCount;
      total += g.totalGraded;

      rows.push({
        qid: qid,
        rowKind: rowKind,
        label:
          rowKind === "correct"
            ? "All correct"
            : g.correctCount + " / " + g.totalGraded + " parts correct",
        detail: partLines,
      });
    }

    renderResults(score, total, rows);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function retakeExam() {
    if (
      !confirm(
        "Clear all saved answers for this exam in this browser and reset this page?"
      )
    ) {
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    var panel = document.getElementById("exam-results-panel");
    if (panel) {
      panel.innerHTML = "";
      panel.hidden = true;
    }
    resetCurrentPageControls();
  }

  function bindEvents() {
    var root = getRoot();
    root.addEventListener("change", function () {
      saveCurrentPage();
    });
    root.addEventListener("input", function () {
      saveCurrentPage();
    });

    var finish = document.getElementById("exam-finish-btn");
    if (finish) {
      finish.addEventListener("click", function () {
        finishExam();
      });
    }
  }

  function init() {
    bindEvents();
    restoreCurrentPage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
