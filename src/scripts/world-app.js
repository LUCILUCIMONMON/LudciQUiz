(function () {
    "use strict";

    const STORAGE_KEY = "ludciquezt-progress-v1";
    const ENTRY_KEY = "ludciquezt-entered-v1";
    const AUDIO_KEY = "ludciquezt-audio-enabled-v1";
    const BGM_ENABLED_KEY = "ludciquezt-bgm-enabled-v1";
    const SFX_ENABLED_KEY = "ludciquezt-sfx-enabled-v1";
    const BGM_VOLUME_KEY = "ludciquezt-bgm-volume-v1";
    const SFX_VOLUME_KEY = "ludciquezt-sfx-volume-v1";
    const GOD_MODE_KEY = "ludciquezt-god-mode-v1";
    const AUDIO_ROOT = "assets/Audio/";
    const levels = window.LUDCIQUEZT_LEVELS;
    const view = document.getElementById("view");
    const headerScore = document.getElementById("header-score");

    if (sessionStorage.getItem(ENTRY_KEY) !== "true") {
        window.location.replace("splash.html");
        return;
    }

    let progress = loadProgress();
    let activeLevel = null;
    let activeQuestion = null;
    let questionIndex = 0;
    let lives = 3;
    let godMode = localStorage.getItem(GOD_MODE_KEY) === "true";
    let runScore = 0;
    let answered = false;
    let examMode = false;
    let examAsked = new Set();
    let lastResult = null;
    const legacyAudioEnabled = localStorage.getItem(AUDIO_KEY) !== "false";
    let bgmEnabled = localStorage.getItem(BGM_ENABLED_KEY) === null ? legacyAudioEnabled : localStorage.getItem(BGM_ENABLED_KEY) === "true";
    let sfxEnabled = localStorage.getItem(SFX_ENABLED_KEY) === null ? legacyAudioEnabled : localStorage.getItem(SFX_ENABLED_KEY) === "true";
    let bgmVolume = loadVolume(BGM_VOLUME_KEY, 28);
    let sfxVolume = loadVolume(SFX_VOLUME_KEY, 72);
    let currentBgm = "";
    const bgm = new Audio();
    bgm.loop = true;
    bgm.volume = bgmVolume;

    function loadVolume(key, fallback) {
        const saved = Number(localStorage.getItem(key));
        return Number.isFinite(saved) && localStorage.getItem(key) !== null ? Math.min(1, Math.max(0, saved / 100)) : fallback / 100;
    }

    function loadProgress() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (saved && Array.isArray(saved.completedLevels)) {
                return {
                    completedLevels: saved.completedLevels.filter(Number.isInteger),
                    examCompleted: saved.examCompleted === true,
                    totalScore: Number(saved.totalScore) || 0,
                    bestScore: Number(saved.bestScore) || 0,
                    gamesPlayed: Number(saved.gamesPlayed) || 0,
                    history: Array.isArray(saved.history) ? saved.history.slice(0, 5) : []
                };
            }
        } catch (error) {
            console.warn("Progres Ludciquezt tidak dapat dibaca.", error);
        }
        return { completedLevels: [], examCompleted: false, totalScore: 0, bestScore: 0, gamesPlayed: 0, history: [] };
    }

    function saveProgress() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        } catch (error) {
            console.warn("Progres Ludciquezt tidak dapat disimpan.", error);
        }
        headerScore.textContent = progress.totalScore.toLocaleString("id-ID") + " XP";
    }

    function setTheme(theme) {
        document.body.dataset.theme = theme || "base";
    }

    function setBgm(track, force) {
        if (!track) return;
        if (!force && track === currentBgm && !bgm.paused) return;
        currentBgm = track;
        bgm.pause();
        if (!bgmEnabled) return;
        bgm.src = AUDIO_ROOT + "bgm/" + track;
        bgm.currentTime = 0;
        bgm.volume = bgmVolume;
        bgm.play().catch(function () {});
    }

    function playSfx(name) {
        if (!sfxEnabled) return;
        const sound = new Audio(AUDIO_ROOT + "sfx/" + name + ".mp3");
        sound.volume = sfxVolume;
        sound.play().catch(function () {});
    }

    function setView(name) {
        document.body.classList.toggle("game-active", name === "game");
        document.querySelectorAll(".nav-link").forEach(function (button) {
            button.classList.toggle("is-active", button.dataset.view === name);
        });
    }

    function renderWorlds() {
        setView("worlds");
        setTheme("base");
        setBgm("main-menu.mp3");
        const totalSteps = levels.length + 1;
        const completed = progress.completedLevels.length + (progress.examCompleted ? 1 : 0);
        const worlds = [
            { id: "website", name: "Website Realm", detail: "HTML / CSS / JavaScript", active: true, symbol: "&lt;/&gt;" },
            { id: "vault", name: "Database Vault", detail: "COMING SOON", symbol: "[db]" },
            { id: "mobile", name: "The Mobile Grid", detail: "COMING SOON", symbol: "[▦]" },
            { id: "wasteland", name: "The Logic & Bug Wasteland", detail: "COMING SOON", symbol: "{?}" }
        ];
        const cards = worlds.map(function (world) {
            return '<button class="world-card ' + (world.active ? "world-card-active" : "world-card-soon") + '" data-world="' + world.id + '" type="button">' +
                '<span class="world-symbol" aria-hidden="true">' + world.symbol + '</span><span class="world-detail">' + world.detail + '</span><strong>' + world.name + '</strong>' +
                '<span class="world-enter">' + (world.active ? "JELAJAHI WORLD ↗" : "COMING SOON ↗") + '</span></button>';
        }).join("");
        view.innerHTML = '<section class="worlds-page"><div class="worlds-heading"><div><span class="eyebrow">SELECT YOUR DESTINATION</span><h1>World map<span class="title-dot">.</span></h1><p>Empat dunia. Satu perjalanan dimulai dari sini.</p></div>' +
            '<div class="world-stats"><strong>' + progress.totalScore.toLocaleString("id-ID") + ' XP</strong><span>' + completed + ' / ' + totalSteps + ' TAHAP SELESAI</span></div></div>' +
            '<div class="world-grid">' + cards + '</div><div class="world-footnote"><span>ACTIVE SECTOR / 01</span><span>PROGRESS DISIMPAN DI PERANGKAT INI</span></div></section>';
        headerScore.textContent = progress.totalScore.toLocaleString("id-ID") + " XP";
    }

    function isUnlocked(index) {
        return index === 0 || progress.completedLevels.includes(levels[index - 1].id);
    }

    function isExamUnlocked() {
        return levels.every(function (level) { return progress.completedLevels.includes(level.id); });
    }

    function renderRealm() {
        setView("realm");
        setTheme("base");
        setBgm("main-menu.mp3");
        const totalSteps = levels.length + 1;
        const completedSteps = progress.completedLevels.length + (progress.examCompleted ? 1 : 0);
        const cards = levels.map(function (level, index) {
            const isComplete = progress.completedLevels.includes(level.id);
            const unlocked = isUnlocked(index);
            const status = isComplete ? "Selesai" : unlocked ? "Terbuka" : "Terkunci";
            return '<article class="stage-card ' + (unlocked ? "stage-open" : "stage-locked") + (isComplete ? " stage-complete" : "") + '">' +
                '<div class="stage-card-head"><span>STAGE 0' + level.id + '</span><span>' + (unlocked ? level.questions.length + " SOAL" : "LOCKED") + '</span></div>' +
                '<div class="stage-icon stage-' + level.topic.toLowerCase() + '" aria-hidden="true">' + level.topic + '</div><h2>' + level.title + '</h2><p>' + level.description + '</p>' +
                '<div class="stage-card-foot"><span>' + status + '</span>' + (unlocked ? '<button class="button ' + (isComplete ? "button-secondary" : "button-primary") + '" data-level="' + level.id + '">' + (isComplete ? "Main lagi" : "Mulai stage") + '</button>' : "") + '</div></article>';
        }).join("");
        const examUnlocked = isExamUnlocked();
        const examStatus = progress.examCompleted ? "Ujian selesai" : examUnlocked ? "Siap dimulai" : "Selesaikan 3 stage untuk membuka";
        const examCard = '<article class="stage-card stage-exam ' + (examUnlocked ? "stage-open" : "stage-locked") + (progress.examCompleted ? " stage-complete" : "") + '"><div class="stage-card-head"><span>FINAL STAGE</span><span>' + (examUnlocked ? "50 SOAL" : "LOCKED") + '</span></div>' +
            '<div class="stage-icon" aria-hidden="true">!</div><h2>Ujian Campuran</h2><p>Campuran HTML, CSS, dan JavaScript. Bertahan melewati ronde untuk menghadapi soal yang makin menantang.</p>' +
            '<div class="exam-milestones"><span>01-10 <b>PEMANASAN</b></span><span>11-20 <b>MENENGAH</b></span><span>21-30 <b>LANJUT</b></span><span>31-40 <b>MAHIR</b></span><span>41-49 <b>SANGAT SULIT</b></span><span>50 <b>FINAL</b></span></div>' +
            '<div class="stage-card-foot"><span>' + examStatus + '</span>' +
            (examUnlocked ? '<button class="button ' + (progress.examCompleted ? "button-secondary" : "button-primary") + '" data-action="start-exam">' + (progress.examCompleted ? "Ulangi ujian" : "Mulai ujian") + '</button>' : "") + '</div></article>';
        view.innerHTML = '<section class="realm-page"><button class="back-button" data-action="worlds">← Kembali ke world map</button>' +
            '<div class="realm-heading"><span class="eyebrow">ACTIVE WORLD / 01</span><h1>Website Realm<span class="title-dot">.</span></h1><p>Bangun fondasi web, lalu buktikan semuanya di ujian akhir.</p>' +
            '<div class="realm-progress"><span>' + completedSteps + ' / ' + totalSteps + ' TAHAP SELESAI</span><div class="progress-track"><div class="progress-fill" style="width:' + Math.round((completedSteps / totalSteps) * 100) + '%"></div></div></div></div>' +
            '<div class="stage-grid">' + cards + examCard + '</div></section>';
    }

    function renderSettings() {
        setView("settings");
        setTheme("base");
        setBgm("main-menu.mp3");
        view.innerHTML = '<section class="settings-page"><button class="back-button" data-action="worlds">← Kembali ke world map</button>' +
            '<div class="settings-heading"><span class="eyebrow">PREFERENCES / AUDIO</span><h1>Pengaturan<span class="title-dot">.</span></h1><p>Atur musik latar dan efek suara sesuai kenyamananmu.</p></div>' +
            '<div class="settings-group"><div class="setting-title"><strong>Musik latar</strong><span>Musik menu dan tiap stage</span></div>' +
            '<label class="setting-toggle"><span>Aktifkan BGM</span><input id="bgm-enabled" type="checkbox"' + (bgmEnabled ? " checked" : "") + '></label>' +
            '<label class="setting-volume" for="bgm-volume"><span>Volume BGM <output id="bgm-volume-value">' + Math.round(bgmVolume * 100) + '%</output></span><input id="bgm-volume" type="range" min="0" max="100" value="' + Math.round(bgmVolume * 100) + '"></label></div>' +
            '<div class="settings-group"><div class="setting-title"><strong>Efek suara</strong><span>Respons jawaban, menang, dan kalah</span></div>' +
            '<label class="setting-toggle"><span>Aktifkan SFX</span><input id="sfx-enabled" type="checkbox"' + (sfxEnabled ? " checked" : "") + '></label>' +
            '<label class="setting-volume" for="sfx-volume"><span>Volume SFX <output id="sfx-volume-value">' + Math.round(sfxVolume * 100) + '%</output></span><input id="sfx-volume" type="range" min="0" max="100" value="' + Math.round(sfxVolume * 100) + '"></label></div>' +
            '<div class="settings-group"><div class="setting-title"><strong>Bantuan bermain</strong><span>Atur tingkat tantangan permainan</span></div>' +
            '<label class="setting-toggle"><span>God Mode <small class="setting-helper">Tetap bisa lanjut meski nyawa habis</small></span><input id="god-mode-enabled" type="checkbox"' + (godMode ? " checked" : "") + '></label></div></section>';
    }

    function startLevel(id) {
        const index = levels.findIndex(function (level) { return level.id === id; });
        if (index < 0 || !isUnlocked(index)) return;
        activeLevel = levels[index];
        examMode = false;
        questionIndex = 0;
        lives = 3;
        runScore = 0;
        answered = false;
        setTheme(activeLevel.topic.toLowerCase());
        setBgm(activeLevel.topic === "JS" ? "Javascript-level.mp3" : activeLevel.topic + "-level.mp3", true);
        renderQuestion();
    }

    function startExam() {
        if (!isExamUnlocked()) return;
        activeLevel = { id: 0, title: "Ujian Campuran", topic: "UJIAN", questions: [] };
        examMode = true;
        questionIndex = 0;
        lives = 3;
        runScore = 0;
        answered = false;
        examAsked = new Set();
        setTheme("exam");
        setBgm("UJIAN-levell.mp3", true);
        renderQuestion();
    }

    function getExamQuestion() {
        const candidates = [];
        if (questionIndex === 49) {
            levels.forEach(function (level) {
                candidates.push({ question: level.questions[19], topic: level.topic });
            });
        } else {
            const ranges = [[0, 4], [4, 8], [8, 12], [12, 16], [16, 19]];
            const range = ranges[Math.floor(questionIndex / 10)];
            levels.forEach(function (level) {
                for (let index = range[0]; index < range[1]; index += 1) {
                    candidates.push({ question: level.questions[index], topic: level.topic });
                }
            });
        }
        const unseen = candidates.filter(function (candidate) {
            return !examAsked.has(candidate.topic + "::" + candidate.question.prompt);
        });
        const pool = unseen.length ? unseen : candidates;
        const selection = pool[Math.floor(Math.random() * pool.length)];
        examAsked.add(selection.topic + "::" + selection.question.prompt);
        return selection;
    }

    function examTier() {
        if (questionIndex < 10) return "PEMANASAN";
        if (questionIndex < 20) return "MENENGAH";
        if (questionIndex < 30) return "LANJUT";
        if (questionIndex < 40) return "MAHIR";
        if (questionIndex < 49) return "SANGAT SULIT";
        return "PALING SULIT / FINAL";
    }

    function renderQuestion() {
        setView("game");
        const selection = examMode ? getExamQuestion() : { question: activeLevel.questions[questionIndex], topic: activeLevel.topic };
        activeQuestion = selection;
        const question = selection.question;
        const options = question.answers.map(function (answer, index) {
            return '<button class="answer-option" data-answer="' + index + '"><span class="answer-letter">' + String.fromCharCode(65 + index) + '</span><span class="answer-text">' + answer.replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</span></button>';
        }).join("");
        const code = question.code ? '<pre class="question-code"><code>' + question.code.replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</code></pre>' : "";
        const label = examMode ? 'SOAL ' + String(questionIndex + 1).padStart(2, "0") + ' / ' + examTier() : activeLevel.topic + ' / SOAL ' + String(questionIndex + 1).padStart(2, "0") + ' DARI ' + activeLevel.questions.length;
        const progressValue = examMode ? ((questionIndex + 1) / 50) * 100 : ((questionIndex + 1) / activeLevel.questions.length) * 100;
        view.innerHTML = '<section class="quiz-page"><div class="quiz-topline"><button class="back-button" data-action="realm">← Kembali ke Website Realm</button><div class="quiz-stats"><span>XP <strong>' + runScore + '</strong></span><span>NYAWA <strong class="lives" aria-label="' + lives + ' nyawa tersisa">' + "♥ ".repeat(lives) + "♡ ".repeat(3 - lives) + '</strong></span></div></div>' +
            '<div class="quiz-progress" role="progressbar" aria-label="Progres soal" aria-valuenow="' + (questionIndex + 1) + '" aria-valuemin="1" aria-valuemax="' + (examMode ? 50 : activeLevel.questions.length) + '"><div class="progress-fill" style="width:' + progressValue + '%"></div></div>' +
            '<section class="quiz-card"><div class="question-meta"><span class="question-tag">' + label + '</span>' + (examMode ? '<span class="question-topic">' + selection.topic + '</span>' : "") + (godMode ? '<span class="god-mode-indicator">GOD MODE</span>' : "") + '</div>' +
            '<h1>' + question.prompt + '</h1>' + code + '<div class="answers">' + options + '</div><div class="feedback" id="feedback" aria-live="polite"></div></section></section>';
    }

    function chooseAnswer(index) {
        if (answered) return;
        answered = true;
        const question = activeQuestion.question;
        const correct = index === question.correct;
        const options = view.querySelectorAll(".answer-option");
        options.forEach(function (option, optionIndex) {
            option.disabled = true;
            if (optionIndex === question.correct) option.classList.add("is-correct");
            if (optionIndex === index && !correct) option.classList.add("is-wrong");
        });
        if (correct) {
            if (!godMode) {
                runScore += 100;
                progress.totalScore += 100;
                saveProgress();
            }
            playSfx("correct");
        } else {
            lives = Math.max(0, lives - 1);
            playSfx("wrong");
        }
        const feedback = document.getElementById("feedback");
        const levelComplete = !examMode && questionIndex === activeLevel.questions.length - 1;
        const examComplete = examMode && questionIndex === 49 && (lives > 0 || godMode);
        const outOfLives = lives === 0 && !godMode;
        const runOver = outOfLives || levelComplete || examComplete;
        let milestone = "";
        if (examMode && lives > 0 && questionIndex < 49 && (questionIndex + 1) % 10 === 0) {
            milestone = questionIndex < 19 ? " Ronde berikutnya lebih menantang." : " Tingkat kesulitan naik. Tetap fokus!";
        }
        if (godMode && lives === 0) milestone += " God Mode aktif: kamu tetap bisa lanjut.";
        const actionLabel = outOfLives ? "Lihat hasil" : levelComplete ? "Selesaikan stage" : examComplete ? "Selesaikan ujian" : examMode ? "Lanjutkan" : "Soal berikutnya";
        feedback.className = "feedback is-visible " + (correct ? "is-correct" : "is-wrong");
        feedback.innerHTML = '<div class="feedback-copy"><strong>' + (correct ? (godMode ? "Tepat! God Mode: skor nonaktif" : "Tepat! +100 XP") : "Belum tepat") + '</strong><p>' + question.explanation + milestone + '</p></div>' +
            '<button class="button button-primary" data-action="next" data-over="' + runOver + '">' + actionLabel + ' <span aria-hidden="true">→</span></button>';
        const statLives = view.querySelector(".lives");
        statLives.textContent = "♥ ".repeat(lives) + "♡ ".repeat(3 - lives);
        statLives.setAttribute("aria-label", lives + " nyawa tersisa");
    }

    function finishRun() {
        const won = lives > 0 || godMode;
        if (examMode && questionIndex === 49 && won) progress.examCompleted = true;
        if (won && !examMode && !progress.completedLevels.includes(activeLevel.id)) {
            progress.completedLevels.push(activeLevel.id);
            progress.completedLevels.sort(function (a, b) { return a - b; });
        }
        if (!godMode) progress.bestScore = Math.max(progress.bestScore, runScore);
        progress.gamesPlayed += 1;
        const resultTitle = examMode ? "Ujian Campuran / " + (questionIndex + 1) + " soal" : activeLevel.title;
        progress.history.unshift({ title: resultTitle, score: runScore, won: won, date: new Date().toISOString() });
        progress.history = progress.history.slice(0, 5);
        lastResult = { won: won, score: runScore, level: activeLevel, exam: examMode, questions: questionIndex + 1 };
        saveProgress();
        playSfx(won ? "complete" : "game-over");
        renderFinish();
    }

    function renderFinish() {
        setTheme(lastResult.exam ? "exam" : lastResult.level.topic.toLowerCase());
        setView("realm");
        const title = lastResult.exam ? lastResult.won ? "Ujian ditaklukkan!" : "Ujian selesai." : lastResult.won ? "Stage selesai!" : "Coba lagi, ya.";
        const message = lastResult.exam
            ? lastResult.won ? "Sempurna. Kamu menuntaskan seluruh 50 soal dan melewati tingkat final." : "Kamu bertahan sampai soal ke-" + lastResult.questions + ". Latih lagi modulmu dan pecahkan rekor berikutnya."
            : lastResult.won
                ? "Keren, kamu sudah menaklukkan " + lastResult.level.title + ". Stage berikutnya sudah menunggumu."
                : "Nyawamu habis saat " + lastResult.level.title + ". Progres level tetap aman, jadi kamu bisa mencoba lagi kapan saja.";
        const action = lastResult.exam ? "Ulangi ujian" : lastResult.won ? "Lanjut ke Website Realm" : "Coba stage lagi";
        view.innerHTML = '<section class="finish-page"><div class="finish-wrap"><div class="finish-mark" aria-hidden="true">' + (lastResult.won ? "✓" : lastResult.exam ? "!" : "↻") + '</div>' +
            '<span class="eyebrow">' + (lastResult.exam ? (lastResult.won ? "FINAL EXAM CLEARED / 50 SOAL" : "EXAM RUN / " + lastResult.questions + " SOAL") : lastResult.won ? "STAGE CLEARED" : "RUN COMPLETE") + '</span><h1>' + title + '</h1>' +
            '<p>' + message + '</p><div class="result-score">' + runScore + '<span>XP DIDAPAT DI RUN INI</span></div><div class="finish-actions">' +
            '<button class="button button-primary" data-action="' + (lastResult.exam ? "start-exam" : "realm") + '">' + action + ' <span aria-hidden="true">→</span></button>' +
            '<button class="button button-secondary" data-action="worlds">Kembali ke world map</button></div>' +
            (lastResult.won ? '<div class="certificate">ACHIEVEMENT UNLOCKED / <strong>' + lastResult.level.topic + ' STARTER</strong></div>' : "") + '</div></section>';
    }

    function showComingSoon(button) {
        const label = button.querySelector("strong").textContent;
        let toast = document.querySelector(".coming-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.className = "coming-toast";
            toast.setAttribute("role", "status");
            document.body.appendChild(toast);
        }
        toast.textContent = label + " — Coming Soon";
        toast.classList.add("is-visible");
        window.clearTimeout(showComingSoon.timeout);
        showComingSoon.timeout = window.setTimeout(function () { toast.classList.remove("is-visible"); }, 2200);
    }

    view.addEventListener("change", function (event) {
        const target = event.target;
        if (target.id === "bgm-enabled") {
            bgmEnabled = target.checked;
            localStorage.setItem(BGM_ENABLED_KEY, String(bgmEnabled));
            if (bgmEnabled) setBgm(currentBgm || "main-menu.mp3", true);
            else bgm.pause();
        }
        if (target.id === "sfx-enabled") {
            sfxEnabled = target.checked;
            localStorage.setItem(SFX_ENABLED_KEY, String(sfxEnabled));
        }
        if (target.id === "god-mode-enabled") {
            godMode = target.checked;
            localStorage.setItem(GOD_MODE_KEY, String(godMode));
            if (!godMode) lives = 3;
        }
    });

    view.addEventListener("input", function (event) {
        const target = event.target;
        if (target.id === "bgm-volume") {
            bgmVolume = Number(target.value) / 100;
            bgm.volume = bgmVolume;
            localStorage.setItem(BGM_VOLUME_KEY, target.value);
            document.getElementById("bgm-volume-value").textContent = target.value + "%";
        }
        if (target.id === "sfx-volume") {
            sfxVolume = Number(target.value) / 100;
            localStorage.setItem(SFX_VOLUME_KEY, target.value);
            document.getElementById("sfx-volume-value").textContent = target.value + "%";
        }
    });

    document.addEventListener("click", function (event) {
        const brand = event.target.closest(".brand");
        if (brand) {
            event.preventDefault();
            renderWorlds();
            return;
        }
        const target = event.target.closest("button");
        if (!target) return;
        if (target.dataset.view === "worlds" || target.dataset.action === "worlds") renderWorlds();
        if (target.dataset.view === "settings") renderSettings();
        if (target.dataset.action === "realm") renderRealm();
        if (target.dataset.world === "website") renderRealm();
        if (target.dataset.world && target.dataset.world !== "website") showComingSoon(target);
        if (target.dataset.level) startLevel(Number(target.dataset.level));
        if (target.dataset.action === "start-exam") startExam();
        if (target.dataset.answer !== undefined) chooseAnswer(Number(target.dataset.answer));
        if (target.dataset.action === "next") {
            if (target.dataset.over === "true") finishRun();
            else { questionIndex += 1; answered = false; renderQuestion(); }
        }
    });

    renderWorlds();
})();