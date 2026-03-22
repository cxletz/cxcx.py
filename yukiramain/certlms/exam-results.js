(function () {
  "use strict";

  var STORAGE_KEY = "python-cert-exam-v1";
  var RESULTS_STORAGE_KEY = "python-cert-exam-results";

  function displayResults() {
    var resultsData;
    
    try {
      resultsData = JSON.parse(sessionStorage.getItem(RESULTS_STORAGE_KEY));
    } catch (e) {
      resultsData = null;
    }

    var panel = document.getElementById("exam-results-panel");
    
    if (!resultsData) {
      panel.innerHTML = "<p class='alert alert-warning'>No exam results found. Please complete an exam first.</p>";
      return;
    }

    var score = resultsData.score;
    var total = resultsData.total;
    var rows = resultsData.rows;

    var pct = total > 0 ? Math.round((score / total) * 1000) / 10 : 0;
    var html = "";
    html += '<h3>Exam Results</h3><div class="exam-score-summary">Score: ' +
      score +
      " / " +
      total +
      " (" +
      pct +
      "%)</div>";
    html += '<table class="exam-results-table"><thead><tr>';
    html += "<th>Question</th><th>Status</th><th>Detail</th></tr></thead><tbody>";

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
    html = '<div class="exam-results-table-wrapper">' + html + '</div>';
    panel.innerHTML = html;
  }

  function retakeExam() {
    if (
      !confirm(
        "Clear all saved answers for this exam in this browser and start over?"
      )
    ) {
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(RESULTS_STORAGE_KEY);
    window.location.href = "main.html";
  }

  function bindEvents() {
    var retakeBtn = document.getElementById("retake-btn");
    if (retakeBtn) {
      retakeBtn.addEventListener("click", function () {
        retakeExam();
      });
    }
    var retakeBtnTop = document.getElementById("retake-btn-top");
    if (retakeBtnTop) {
      retakeBtnTop.addEventListener("click", function () {
        retakeExam();
      });
    }
  }

  function init() {
    displayResults();
    bindEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
