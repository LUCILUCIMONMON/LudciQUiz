(function () {
    "use strict";

    const ENTRY_KEY = "ludciquezt-entered-v1";
    const AUDIO_KEY = "ludciquezt-audio-enabled-v1";
    const BGM_ENABLED_KEY = "ludciquezt-bgm-enabled-v1";
    const BGM_VOLUME_KEY = "ludciquezt-bgm-volume-v1";
    const audio = new Audio("assets/Audio/bgm/main-menu.mp3");
    const enterButton = document.getElementById("enter-world");
    const audioButton = document.getElementById("splash-audio");
    let audioEnabled = localStorage.getItem(BGM_ENABLED_KEY) === null
        ? localStorage.getItem(AUDIO_KEY) !== "false"
        : localStorage.getItem(BGM_ENABLED_KEY) === "true";

    if (sessionStorage.getItem(ENTRY_KEY) === "true") {
        window.location.replace("index.html");
        return;
    }

    audio.loop = true;
    audio.volume = localStorage.getItem(BGM_VOLUME_KEY) === null ? 0.28 : Math.min(1, Math.max(0, Number(localStorage.getItem(BGM_VOLUME_KEY)) / 100));

    function syncAudioButton() {
        audioButton.setAttribute("aria-pressed", String(audioEnabled));
        audioButton.innerHTML = (audioEnabled ? "♫ " : "♪ ") + "<span>Audio " + (audioEnabled ? "aktif" : "mati") + "</span>";
        if (audioEnabled) audio.play().catch(function () {});
        else audio.pause();
    }

    audioButton.addEventListener("click", function () {
        audioEnabled = !audioEnabled;
        localStorage.setItem(BGM_ENABLED_KEY, String(audioEnabled));
        syncAudioButton();
    });

    enterButton.addEventListener("click", function () {
        sessionStorage.setItem(ENTRY_KEY, "true");
        window.location.replace("index.html");
    });

    syncAudioButton();
})();