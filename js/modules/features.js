export function initInteractiveFeatures() {
  initLoveQuiz();
  initBucketList();
}

function initLoveQuiz() {
  const quizContainer = document.getElementById('love-quiz');
  if (!quizContainer) return;

  const questions = [
    {
      q: "Qual o sentimento que define a nossa história desde o primeiro dia?",
      options: ["Cumplicidade e Carinho 💜", "Amor Verdadeiro & Calma 🔮", "Tudo isso e muito mais! ✨"],
      correct: 2,
      feedback: "Exatamente! Cada segundo com você é especial demais. 🥰"
    },
    {
      q: "Qual é o nosso destino dos sonhos para a próxima viagem juntos?",
      options: ["Praia ao pôr do sol 🌅", "Montanhas aconchegantes 🏔️", "Qualquer lugar, desde que seja com você! 💞"],
      correct: 2,
      feedback: "Com certeza! Estar com você transforma qualquer lugar no melhor lugar do mundo. 🌍✨"
    }
  ];

  let currentQ = 0;
  let score = 0;

  function renderQuestion() {
    if (currentQ >= questions.length) {
      quizContainer.innerHTML = `
        <div class="quiz-result reveal in">
          <div class="quiz-badge">👑 100% Amor</div>
          <h4>Você acertou tudo, minha princesa!</h4>
          <p>Nosso amor é a resposta certa para todas as perguntas. 💜✨</p>
          <button type="button" class="hub-btn primary quiz-restart-btn">Refazer Quiz</button>
        </div>
      `;
      const restartBtn = quizContainer.querySelector('.quiz-restart-btn');
      if (restartBtn) {
        restartBtn.addEventListener('click', () => {
          currentQ = 0;
          score = 0;
          renderQuestion();
        });
      }
      return;
    }

    const item = questions[currentQ];
    quizContainer.innerHTML = `
      <div class="quiz-card reveal in">
        <p class="quiz-step">Pergunta ${currentQ + 1} de ${questions.length}</p>
        <h4 class="quiz-question">${item.q}</h4>
        <div class="quiz-options">
          ${item.options.map((opt, i) => `
            <button type="button" class="quiz-opt-btn" data-idx="${i}">${opt}</button>
          `).join('')}
        </div>
        <div class="quiz-feedback" id="quiz-fb" style="display:none;"></div>
      </div>
    `;

    quizContainer.querySelectorAll('.quiz-opt-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.dataset.idx, 10);
        const fb = quizContainer.querySelector('#quiz-fb');
        if (fb) {
          fb.style.display = 'block';
          fb.innerHTML = `<p>${item.feedback}</p>`;
        }
        btn.classList.add('selected');
        if (navigator.vibrate) navigator.vibrate([30, 50, 30]);

        setTimeout(() => {
          currentQ++;
          renderQuestion();
        }, 1800);
      });
    });
  }

  renderQuestion();
}

function initBucketList() {
  const bucketList = document.getElementById('bucket-list');
  if (!bucketList) return;

  bucketList.querySelectorAll('.bucket-item').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('completed');
      if (item.classList.contains('completed')) {
        if (navigator.vibrate) navigator.vibrate(50);
      }
    });
  });
}
