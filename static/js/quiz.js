document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-quiz');
    const submitBtn = document.getElementById('submit-answer');
    const topicSelect = document.getElementById('topic-select');
    const quizContainer = document.getElementById('quiz-container');
    const questionDiv = document.getElementById('question');
    const optionsDiv = document.getElementById('options');
    const timerDiv = document.getElementById('timer');
    const resultDiv = document.getElementById('result');
    const scoreP = document.getElementById('score');

    let timer;
    let timeLeft = 30;

    startBtn.addEventListener('click', async () => {
        const topic = topicSelect.value;
        const response = await fetch(`/quiz/start/${topic}`);
        const data = await response.json();
        if (data.question) {
            quizContainer.classList.remove('hidden');
            displayQuestion(data.question);
            startTimer();
        }
    });

    submitBtn.addEventListener('click', async () => {
        const selected = document.querySelector('input[name="option"]:checked');
        if (!selected) return;
        clearInterval(timer);
        const response = await fetch('/quiz/answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answer: selected.value })
        });
        const data = await response.json();
        if (data.finished) {
            quizContainer.classList.add('hidden');
            resultDiv.classList.remove('hidden');
            scoreP.textContent = `Your score: ${data.score}`;
        } else {
            displayQuestion(data.question);
            startTimer();
        }
    });

    function displayQuestion(q) {
        questionDiv.textContent = q.question;
        optionsDiv.innerHTML = '';
        q.options.forEach((opt, idx) => {
            const label = document.createElement('label');
            label.className = 'quiz-option block';
            label.innerHTML = `<input type="radio" name="option" value="${String.fromCharCode(65 + idx)}"> ${String.fromCharCode(65 + idx)}. ${opt}`;
            optionsDiv.appendChild(label);
        });
    }

    function startTimer() {
        timeLeft = 30;
        timerDiv.textContent = `Time left: ${timeLeft}s`;
        timer = setInterval(() => {
            timeLeft--;
            timerDiv.textContent = `Time left: ${timeLeft}s`;
            if (timeLeft <= 0) {
                clearInterval(timer);
                submitBtn.click();  // Auto-submit
            }
        }, 1000);
    }
});