let score = 0;
let currentIndex = 0;
let gameQuestions = [];
let usedIds = [];
let doubleDipActive = false;
let isMuted = false;

// Zamanlayıcı değişkenleri
let timerInterval;
let timeLeft = 30;

const moneyValues = [100, 300, 500, 1000, 2000, 3000, 5000, 7500, 15000, 30000, 60000, 125000, 250000, 500000, 1000000];
const difficultyMap = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5];
let lifelines = { fifty: true, audience: true, phone: true, double: true };

const sounds = {
    correct: new Audio('assets/audio/correct.mp3'),
    wrong: new Audio('assets/audio/wrong.mp3'),
    lifeline: new Audio('assets/audio/lifeline.mp3'),
    click: new Audio('assets/audio/click.mp3'),
    tick: new Audio('assets/audio/tick.mp3') // İsteğe bağlı: saniye tıklama sesi
};

function playSound(name) {
    if (sounds[name]) {
        sounds[name].currentTime = 0;
        sounds[name].play().catch(() => {});
    }
}

function stopLifelineSounds() {
    const allAudios = document.querySelectorAll('audio');
    allAudios.forEach(audio => {
        if (audio.id !== 'bgMusic' && audio.id !== 'introMusic') {
            audio.pause();
            audio.currentTime = 0;
        }
    });
}

function initApp() {}

function showAlert(message, callback = null) {
    clearInterval(timerInterval); // Uyarı çıkınca süreyi durdur
    const modal = document.getElementById("customAlert");
    document.getElementById("alertMessage").innerText = message;
    modal.style.display = "block";
    document.getElementById("alertBtn").onclick = () => {
        modal.style.display = "none";
        if (callback) callback();
    };
}

// --- ZAMANLAYICI FONKSİYONU ---
function startTimer() {
    clearInterval(timerInterval);
    const timerContainer = document.getElementById("timerContainer");
    const timerCircle = document.getElementById("timerCircle");

    // Sadece ilk 5 soru (0, 1, 2, 3, 4. indeksler) için çalıştır
    if (currentIndex < 5) {
        timerContainer.style.display = "block";
        timeLeft = 30;
        timerCircle.innerText = timeLeft;
        timerCircle.style.borderColor = "gold";

        timerInterval = setInterval(() => {
            timeLeft--;
            timerCircle.innerText = timeLeft;

            // Son 5 saniye kala rengi kırmızı yap
            if (timeLeft <= 5) {
                timerCircle.style.borderColor = "#c0392b";
                timerCircle.style.color = "#c0392b";
            } else {
                timerCircle.style.borderColor = "gold";
                timerCircle.style.color = "gold";
            }

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                playSound('wrong');
                showAlert("Süreniz doldu!", () => location.reload());
            }
        }, 1000);
    } else {
        timerContainer.style.display = "none"; // 5. sorudan sonra gizle
    }
}

function startGame() {
    const bg = document.getElementById("bgMusic");
    const intro = document.getElementById("introMusic");
    
    if (intro) intro.muted = isMuted;
    if (bg) bg.muted = isMuted;

    if (intro) {
        intro.play().catch(() => {});
        intro.onended = () => {
            bg.volume = 0.2;
            bg.play().catch(() => {});
        };
    } else {
        bg.volume = 0.2;
        bg.play().catch(() => {});
    }

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
    stopLifelineSounds();
    startTimer(); // Her yeni soruda zamanlayıcıyı başlat/kontrol et
    
    const q = gameQuestions[currentIndex];
    updatePyramidUI(currentIndex);
    
    const answersDiv = document.getElementById("answers");
    answersDiv.innerHTML = "";
    document.getElementById("question").innerText = q.question;

    q.answers.forEach(a => {
        const btn = document.createElement("button");
        btn.textContent = a.text;
        btn.onclick = () => { 
            playSound('click'); 
            selectAnswer(a.correct, btn); 
        };
        answersDiv.appendChild(btn);
    });
}

function selectAnswer(correct, btn) {
    // 1. Hemen diğer butonlara tıklamayı kapat ve seçilen şıkkı turuncu yap
    disableAllButtons();
    clearInterval(timerInterval); // Süreyi durdur
    btn.style.backgroundColor = "orange"; // Seçim anında turuncu
    btn.style.borderColor = "white";

    // 2. İki saniye (2000ms) bekleme süresi (Gerilim efekti)
    setTimeout(() => {
        if (correct) {
            // DOĞRU CEVAP
            btn.classList.add("correct"); // Yeşil olur
            playSound('correct');
            score = moneyValues[currentIndex];
            doubleDipActive = false;

            // Doğru şıkkı yanıp söndürme efekti
            btn.style.animation = "blink 0.5s step-end infinite alternate";

            setTimeout(() => {
                btn.style.animation = "none"; // Animasyonu durdur
                currentIndex++;
                if (currentIndex >= gameQuestions.length) {
                    showAlert("TEBRİKLER! MİLYONERSİNİZ!", () => location.reload());
                } else {
                    showQuestion();
                }
            }, 2000); // 2 saniye yeşil yandıktan sonra yeni soruya geç

        } else {
            // YANLIŞ CEVAP
            if (doubleDipActive) {
                btn.classList.add("wrong"); // Kırmızı olur
                btn.disabled = true;
                btn.style.opacity = "0.5";
                playSound('wrong');
                doubleDipActive = false; 
                showAlert("Yanlış! Ama çift cevap jokeriniz var. Devam edin.");
                // Diğer butonları geri aç (çift cevap hakkı için)
                document.querySelectorAll("#answers button").forEach(b => {
                    if (!b.classList.contains("wrong")) b.style.pointerEvents = "auto";
                });
            } else {
                btn.classList.add("wrong"); // Kırmızı olur
                playSound('wrong');
                highlightCorrectAnswer(); // Doğru olanı da göster
                
                // Doğru olan şıkkı bul ve yanıp söndür
                highlightAndBlinkCorrect();

                let finalPrize = calculateSafeMoney();
                setTimeout(() => { 
                    showAlert(`Bitti! Ödülünüz: ${finalPrize.toLocaleString()} ₺`, () => location.reload()); 
                }, 2000);
            }
        }
    }, 2000); // Turuncu bekleme süresi 2 saniye
}

// Doğru şıkkı bulup yanıp söndüren yardımcı fonksiyon
function highlightAndBlinkCorrect() {
    const q = gameQuestions[currentIndex];
    document.querySelectorAll("#answers button").forEach(btn => {
        if (q.answers.find(a => a.text === btn.textContent && a.correct)) {
            btn.classList.add("correct");
            btn.style.animation = "blink 0.5s step-end infinite alternate";
        }
    });
}

function quitGame() {
    clearInterval(timerInterval);
    playSound('click');
    let prize = currentIndex > 0 ? moneyValues[currentIndex - 1] : 0;
    showAlert(`Çekildiniz! Ödülünüz: ${prize.toLocaleString()} ₺`, () => location.reload());
}

function calculateSafeMoney() {
    if (currentIndex >= 10) return 30000;
    if (currentIndex >= 5) return 2000;
    return 0;
}

function disableAllButtons() { 
    document.querySelectorAll("#answers button").forEach(b => b.style.pointerEvents = "none"); 
}

function highlightCorrectAnswer() {
    const q = gameQuestions[currentIndex];
    document.querySelectorAll("#answers button").forEach(btn => {
        if (q.answers.find(a => a.text === btn.textContent && a.correct)) {
            btn.classList.add("correct");
        }
    });
}

function updateScore() {}

function updatePyramidUI(index) {
    document.querySelectorAll('#moneyList li').forEach(li => li.classList.remove('active-level'));
    const currentLi = document.querySelector(`#moneyList li[data-level="${index + 1}"]`);
    if (currentLi) {
        currentLi.classList.add('active-level');
        currentLi.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
}

function useFifty() {
    if (!lifelines.fifty) return;
    playSound('lifeline');
    const q = gameQuestions[currentIndex];
    const wrongs = q.answers.filter(a => !a.correct).sort(() => 0.5 - Math.random()).slice(0, 2);
    document.querySelectorAll("#answers button").forEach(btn => { 
        if (wrongs.find(w => w.text === btn.textContent)) btn.style.visibility = "hidden"; 
    });
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

function toggleMute() {
    isMuted = !isMuted;
    const allAudios = document.querySelectorAll('audio');
    allAudios.forEach(audio => { audio.muted = isMuted; });
    for (let key in sounds) { if (sounds[key] instanceof Audio) sounds[key].muted = isMuted; }
    const muteIcon = document.getElementById("muteIcon");
    if (muteIcon) muteIcon.innerText = isMuted ? "🔇" : "🔊";
}