
let timerInterval = null;
let timeLeft = 25 * 60;
let running = false;

function formatTime(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
}

function updateDisplay() {
    document.getElementById('timer').textContent = formatTime(timeLeft);
}

function startTimer() {
    if (running) return;
    running = true;
    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
        } else {
            stopTimer();
        }
    }, 1000);
}

function stopTimer() {
    running = false;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    stopTimer();
    timeLeft = 25 * 60;
    updateDisplay();
}

document.getElementById('start').addEventListener('click', startTimer);
document.getElementById('stop').addEventListener('click', stopTimer);
document.getElementById('reset').addEventListener('click', resetTimer);

// 初期表示
updateDisplay();
