document.addEventListener('DOMContentLoaded', () => {
    // Memory Game
    document.getElementById('start-memory').addEventListener('click', async () => {
        const response = await fetch('/games/memory/start');
        const data = await response.json();
        const gameDiv = document.getElementById('memory-game');
        gameDiv.classList.remove('hidden');
        gameDiv.innerHTML = '';
        data.cards.forEach(card => {
            const div = document.createElement('div');
            div.className = 'game-card';
            div.textContent = '?';
            div.addEventListener('click', () => {
                div.textContent = card;
                // Simple flip logic (expand for full game)
            });
            gameDiv.appendChild(div);
        });
    });

    // Math Game
    document.getElementById('start-math').addEventListener('click', async () => {
        const response = await fetch('/games/math/start');
        const data = await response.json();
        const gameDiv = document.getElementById('math-game');
        gameDiv.classList.remove('hidden');
        gameDiv.innerHTML = `<p>${data.question} = ?</p><input id="math-answer" type="number"><button id="submit-math">Submit</button>`;
        document.getElementById('submit-math').addEventListener('click', async () => {
            const ans = document.getElementById('math-answer').value;
            if (parseInt(ans) === data.answer) {
                await fetch('/games/math/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ score: 10 }) });
                alert('Correct!');
            } else {
                alert('Wrong!');
            }
        });
    });

    // Puzzle Game
    document.getElementById('start-puzzle').addEventListener('click', async () => {
        const response = await fetch('/games/puzzle/start');
        const data = await response.json();
        const gameDiv = document.getElementById('puzzle-game');
        gameDiv.classList.remove('hidden');
        gameDiv.innerHTML = `<p>${data.puzzle}</p><input id="puzzle-answer" type="text"><button id="submit-puzzle">Submit</button>`;
        document.getElementById('submit-puzzle').addEventListener('click', async () => {
            const ans = document.getElementById('puzzle-answer').value.toLowerCase();
            if (ans === data.answer.toLowerCase()) {
                await fetch('/games/puzzle/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ score: 10 }) });
                alert('Correct!');
            } else {
                alert('Wrong!');
            }
        });
    });
});