async function loadQuestions() {
  const response = await fetch('jog_kerdesek.csv');
  const data = await response.text();

  const parsed = Papa.parse(data, {
    header: true,
    skipEmptyLines: true
  });

  const allQuestions = parsed.data
    .map(row => ({
      id: parseInt(row.id),
      question: row.question,
      options: [row.option_1, row.option_2, row.option_3, row.option_4],
      correct: parseInt(row.correct) - 1
    }))
    .filter(q => q.question && !isNaN(q.correct));

  let questionPool = [];
  let currentIndex = 0;
  let score = 0;
  let wrongQuestions = [];
  let seenIds = new Set();

  const container = document.getElementById("questions-container");
  const result = document.getElementById("result");

  document.querySelector(".theme-toggle").addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  localStorage.setItem("theme", document.body.classList.contains("light-mode") ? "light" : "dark");
});

window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light-mode");
  }
});


  function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
  }

  function startNewSet(source = allQuestions) {
    let available = source.filter(q => !seenIds.has(q.id));

    if (available.length < 20) {
      seenIds.clear();
      available = shuffle(source).slice(0, 20);
    } else {
      available = shuffle(available).slice(0, 20);
    }

    questionPool = available;
    questionPool.forEach(q => seenIds.add(q.id));
    currentIndex = 0;
    score = 0;
    wrongQuestions = [];
    renderQuestion();
  }

  function renderQuestion() {
    container.innerHTML = "";
    result.innerText = `Pont: ${score} / ${questionPool.length} | Kérdés: ${currentIndex + 1} / ${questionPool.length}`;

    const q = questionPool[currentIndex];
    const qDiv = document.createElement("div");
    qDiv.className = "question card";
    const qTitle = document.createElement("h3");
    qTitle.innerText = q.question;
    qDiv.appendChild(qTitle);

    q.options.forEach((opt, i) => {
      if (opt.trim()) {
        const label = document.createElement("div");
        label.className = "option";
        label.onclick = () => checkAnswer(i, q.correct, label);
        label.textContent = opt;
        qDiv.appendChild(label);
      }
    });

    const nextBtn = document.createElement("button");
    nextBtn.innerText = "Következő kérdés";
    nextBtn.style.display = "none";
    nextBtn.onclick = () => {
      currentIndex++;
      if (currentIndex < questionPool.length) {
        renderQuestion();
      } else {
        showEndOptions();
      }
    };

    qDiv.appendChild(nextBtn);
    container.appendChild(qDiv);

    function checkAnswer(selected, correct, selectedLabel) {
      const labels = container.querySelectorAll(".option");
      labels.forEach((l, idx) => {
        l.classList.remove("correct", "incorrect");
        if (idx === correct) l.classList.add("correct");
        else if (l === selectedLabel) l.classList.add("incorrect");
        l.classList.add("disabled");
      });
      if (selected === correct) score++;
      else wrongQuestions.push(q);
      nextBtn.style.display = "block";
    }
  }

  function showEndOptions() {
    container.innerHTML = "";
    result.innerText = `Végpontszám: ${score} / ${questionPool.length}`;

    if (wrongQuestions.length > 0) {
      const retryBtn = document.createElement("button");
      retryBtn.innerText = `Rossz kérdések ismétlése (${wrongQuestions.length})`;
      retryBtn.onclick = () => startNewSet(wrongQuestions);
      container.appendChild(retryBtn);
    }

    const newSetBtn = document.createElement("button");
    newSetBtn.innerText = "Új 20 kérdés indítása";
    newSetBtn.onclick = () => startNewSet();
    container.appendChild(newSetBtn);
  }

  startNewSet();
}

const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js';
script.onload = loadQuestions;
document.head.appendChild(script);
