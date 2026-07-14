// Reusable retrieval-practice quiz widget, shared across lessons.
// Markup contract:
// <div class="quiz" data-answer="B">
//   <div class="q">Question text</div>
//   <div class="choices">
//     <button class="choice" data-key="A">...</button>
//     <button class="choice" data-key="B">...</button>
//   </div>
//   <div class="feedback"></div>
// </div>
(function () {
  function initQuizzes() {
    document.querySelectorAll(".quiz").forEach(function (quiz) {
      var answer = quiz.getAttribute("data-answer");
      var feedback = quiz.querySelector(".feedback");
      var buttons = quiz.querySelectorAll(".choice");
      var answered = false;
      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (answered) return;
          answered = true;
          var picked = btn.getAttribute("data-key");
          buttons.forEach(function (b) {
            if (b.getAttribute("data-key") === answer) {
              b.classList.add("correct");
            } else if (b === btn) {
              b.classList.add("incorrect");
            }
          });
          if (feedback) {
            if (picked === answer) {
              feedback.textContent = "Correct.";
              feedback.classList.add("show-correct");
            } else {
              feedback.textContent = "Not quite — the highlighted option is correct.";
              feedback.classList.add("show-incorrect");
            }
          }
        });
      });
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initQuizzes);
  } else {
    initQuizzes();
  }
})();
