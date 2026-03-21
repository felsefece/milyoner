let score = 0;
let currentIndex = 0;
let gameQuestions = [];
let usedIds = [];
let doubleDipActive = false;

const moneyValues = [100, 300, 500, 1000, 2000, 3000, 5000, 7500, 15000, 30000, 60000, 125000, 250000, 500000, 1000000];
const difficultyMap = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5];
let lifelines = { fifty: true, audience: true, phone: true, double: true };

const sounds = {
    correct: new Audio('assets/audio/correct.mp3'),
    wrong: new Audio('assets/audio/wrong.mp3'),
    lifeline: new Audio('assets/audio/lifeline.mp3'),
    click: new Audio('assets/audio/click.mp3')
};

function playSound(name) {
    if (sounds[name]) {
        sounds[name].currentTime = 0;
        sounds[name].play().catch(() => {});
    }
}

function initApp() {}

function showAlert(message, callback = null) {
    const modal = document.getElementById("customAlert");
    document.getElementById("alertMessage").innerText = message;
    modal.style.display = "block";
    document.getElementById("alertBtn").onclick = () => {
        modal.style.display = "none";
        if (callback) callback();
    };
}

function startGame() {
    // İsim kontrolü kaldırıldı, direkt oyun başlıyor
    const bg = document.getElementById("bgMusic");
    bg.volume = 0.2;
    bg.play().catch(() => {});

    generateQuestions();
    document.getElementById("startScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "flex"; 
    showQuestion();
}

function generateQuestions() {
    gameQuestions = []; usedIds = [];
    difficultyMap.forEach(d => {
        const list = questions.filter(q => q.difficulty === d && !usedIds.includes(q.id));
        let q = list[Math.floor(Math.random() * list.length)];
        if (q) { gameQuestions.push(q); usedIds.push(q.id); }
    });
}

function showQuestion() {
    const q = gameQuestions[currentIndex];
    updatePyramidUI(currentIndex);
    document.getElementById("question").innerText = q.question;
    const answersDiv = document.getElementById("answers");
    answersDiv.innerHTML = "";
    q.answers.forEach(a => {
        const btn = document.createElement("button");
        btn.textContent = a.text;
        btn.onclick = () => { playSound('click'); selectAnswer(a.correct, btn); };
        answersDiv.appendChild(btn);
    });
}

function selectAnswer(correct, btn) {
    if (correct) {
        disableAllButtons();
        btn.classList.add("correct");
        playSound('correct');
        score = moneyValues[currentIndex];
        updateScore();
        doubleDipActive = false;
        setTimeout(() => {
            currentIndex++;
            if (currentIndex >= gameQuestions.length) showAlert("TEBRİKLER! MİLYONERSİNİZ!", () => location.reload());
            else showQuestion();
        }, 1500);
    } else {
        if (doubleDipActive) {
            btn.classList.add("wrong");
            btn.disabled = true;
            btn.style.pointerEvents = "none";
            btn.style.opacity = "0.5";
            playSound('wrong');
            doubleDipActive = false; 
            showAlert("Yanlış! Ama çift cevap jokeriniz sayesinde bir şansınız daha var.");
        } else {
            btn.classList.add("wrong");
            playSound('wrong');
            disableAllButtons();
            highlightCorrectAnswer();
            let finalPrize = calculateSafeMoney();
            setTimeout(() => { showAlert(`Bitti! Ödülünüz: ${finalPrize.toLocaleString()} ₺`, () => location.reload()); }, 1200);
        }
    }
}

function quitGame() {
    playSound('click');
    let prize = currentIndex > 0 ? moneyValues[currentIndex - 1] : 0;
    showAlert(`Çekildiniz! Ödülünüz: ${prize.toLocaleString()} ₺`, () => location.reload());
}

function calculateSafeMoney() {
    if (currentIndex >= 10) return 30000;
    if (currentIndex >= 5) return 2000;
    return 0;
}

function disableAllButtons() { document.querySelectorAll("#answers button").forEach(b => b.style.pointerEvents = "none"); }

function highlightCorrectAnswer() {
    const q = gameQuestions[currentIndex];
    document.querySelectorAll("#answers button").forEach(btn => {
        if (q.answers.find(a => a.text === btn.textContent && a.correct)) btn.classList.add("correct");
    });
}

function updateScore() { document.getElementById("score").innerText = score.toLocaleString() + " ₺"; }

function updatePyramidUI(index) {
    document.querySelectorAll('#moneyList li').forEach(li => li.classList.remove('active-level'));
    const currentLi = document.querySelector(`#moneyList li[data-level="${index + 1}"]`);
    if (currentLi) currentLi.classList.add('active-level');
}

function useFifty() {
    if (!lifelines.fifty) return;
    playSound('lifeline');
    const q = gameQuestions[currentIndex];
    const wrongs = q.answers.filter(a => !a.correct).sort(() => 0.5 - Math.random()).slice(0, 2);
    document.querySelectorAll("#answers button").forEach(btn => { if (wrongs.find(w => w.text === btn.textContent)) btn.style.visibility = "hidden"; });
    lifelines.fifty = false; document.getElementById("btnFifty").disabled = true;
}

function useDouble() {
    if (!lifelines.double) return;
    playSound('lifeline');
    doubleDipActive = true; 
    lifelines.double = false;
    document.getElementById("btnDouble").disabled = true;
    showAlert("Çift cevap aktif! Bu soru için iki seçim hakkınız var.");
}

function useAudience() {
    if (!lifelines.audience) return;
    playSound('lifeline');
    const q = gameQuestions[currentIndex];
    const chart = document.getElementById("chart"); chart.innerHTML = "";
    q.answers.forEach(a => {
        let p = a.correct ? Math.floor(Math.random() * 30) + 60 : Math.floor(Math.random() * 10);
        const bar = document.createElement("div"); bar.className = "bar"; bar.style.width = p + "%"; bar.innerText = `${a.text.substring(0,10)} %${p}`;
        chart.appendChild(bar);
    });
    document.getElementById("audienceModal").style.display = "block";
    lifelines.audience = false; document.getElementById("btnAudience").disabled = true;
}

function closeAudience() { document.getElementById("audienceModal").style.display = "none"; }

function usePhone() {
    if (!lifelines.phone) return;
    playSound('lifeline');
    showAlert("Telefon: Bence cevap '" + gameQuestions[currentIndex].answers.find(a=>a.correct).text + "'");
    lifelines.phone = false; document.getElementById("btnPhone").disabled = true;
}