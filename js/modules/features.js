export function initInteractiveFeatures() {
  initLoveQuiz();
  initBucketList();
  initDailyNote();
  initTimeCapsule();
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

function initDailyNote() {
  const button = document.getElementById('daily-note-btn');
  const copy = document.getElementById('daily-note-copy');
  const status = document.getElementById('daily-note-status');
  if (!button || !copy || !status) return;

  const messages = [
    'O seu sorriso tem um jeito especial de transformar qualquer dia comum em um dia bonito. 💜',
    'Com você, até os silêncios ficam leves, seguros e cheios de carinho.',
    'Eu adoro a pessoa que sou quando estou ao seu lado: mais calmo, mais feliz e mais eu.',
    'Você é uma das minhas partes favoritas de todos os planos para o futuro.',
    'Obrigado por existir do seu jeitinho e por deixar meus dias mais coloridos. ✨',
    'Meu lugar favorito sempre fica um pouco mais perto quando você está comigo.',
    'Hoje, como todos os dias, eu escolho cuidar da nossa história com carinho.'
  ];
  const key = 'murilo-ana-daily-note';
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const saved = localStorage.getItem(key);

  if (saved === today) {
    const message = messages[new Date(`${today}T12:00:00`).getDay()];
    copy.textContent = message;
    status.textContent = 'Este carinho fica guardado até amanhã.';
    button.disabled = true;
    button.textContent = 'Volte amanhã para outro motivo';
  }

  button.addEventListener('click', () => {
    const message = messages[new Date(`${today}T12:00:00`).getDay()];
    copy.textContent = message;
    status.textContent = 'Um lembrete só nosso, liberado hoje.';
    button.disabled = true;
    button.textContent = 'Volte amanhã para outro motivo';
    localStorage.setItem(key, today);
    if (navigator.vibrate) navigator.vibrate(25);
  });
}

function initTimeCapsule() {
  const capsule = document.querySelector('.time-capsule');
  const countdown = document.getElementById('capsule-countdown');
  const copy = document.getElementById('capsule-copy');
  const button = document.getElementById('capsule-btn');
  if (!capsule || !countdown || !copy || !button) return;

  const unlockDate = new Date(capsule.dataset.unlockDate);
  if (Number.isNaN(unlockDate.getTime())) return;
  let timer = null;

  function update() {
    const remaining = unlockDate.getTime() - Date.now();
    if (remaining <= 0) {
      clearInterval(timer);
      countdown.textContent = 'A cápsula está pronta para ser aberta. 💌';
      button.disabled = false;
      button.textContent = 'Abrir a cápsula';
      button.addEventListener('click', () => {
        copy.textContent = 'Se você abriu isto, chegou um momento que eu sonhei guardar com você. Que a gente continue escolhendo um ao outro, com leveza, carinho e muitos novos capítulos.';
        button.hidden = true;
      }, { once: true });
      return;
    }
    const totalHours = Math.floor(remaining / 3600000);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const minutes = Math.floor((remaining % 3600000) / 60000);
    countdown.textContent = `${days} dias, ${String(hours).padStart(2, '0')}h e ${String(minutes).padStart(2, '0')}min para abrir.`;
  }

  update();
  timer = window.setInterval(update, 60000);
}
