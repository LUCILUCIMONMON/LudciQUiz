(function () {
    "use strict";

    const ENTRY_KEY = "ludciquezt-entered-v1";
    const AUDIO_KEY = "ludciquezt-audio-enabled-v1";
    const BGM_ENABLED_KEY = "ludciquezt-bgm-enabled-v1";
    const BGM_VOLUME_KEY = "ludciquezt-bgm-volume-v1";
    const enterButton = document.getElementById("enter-world");
    const audioButton = document.getElementById("splash-audio");
    let audio;

    function getLocalValue(key) {
        try {
            return window.localStorage.getItem(key);
        } catch (error) {
            return null;
        }
    }

    function setLocalValue(key, value) {
        try {
            window.localStorage.setItem(key, value);
        } catch (error) {
            // Storage can be unavailable in private browsing or restricted contexts.
        }
    }

    function createAudio() {
        if (!audio) {
            audio = new Audio("assets/Audio/bgm/main-menu.mp3");
            audio.preload = "none";
            audio.loop = true;

            const savedVolume = getLocalValue(BGM_VOLUME_KEY);
            const volume = savedVolume === null ? 0.28 : Number(savedVolume) / 100;
            audio.volume = Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 0.28;
        }

        return audio;
    }

    let audioEnabled = getLocalValue(BGM_ENABLED_KEY) === null
        ? getLocalValue(AUDIO_KEY) !== "false"
        : getLocalValue(BGM_ENABLED_KEY) === "true";

    try {
        if (window.sessionStorage.getItem(ENTRY_KEY) === "true") {
            window.location.replace("index.html");
            return;
        }
    } catch (error) {
        // Continue showing the splash page when session storage is unavailable.
    }

    function navigateToWorld() {
        try {
            window.location.replace("index.html");
        } catch (error) {
            window.location.href = "index.html";
        }
    }

    function syncAudioButton(playAudio) {
        if (!audioButton) return;

        audioButton.setAttribute("aria-pressed", String(audioEnabled));
        audioButton.innerHTML = (audioEnabled ? "♫ " : "♪ ") + "<span>Audio " + (audioEnabled ? "aktif" : "mati") + "</span>";

        if (audioEnabled && playAudio) {
            createAudio().play().catch(function () {});
        } else if (audio) {
            audio.pause();
        }
    }

    if (audioButton) {
        audioButton.addEventListener("click", function () {
            audioEnabled = audio ? !audioEnabled : true;
            setLocalValue(BGM_ENABLED_KEY, String(audioEnabled));
            syncAudioButton(audioEnabled);
        });
    }

    if (enterButton) {
        enterButton.addEventListener("click", function () {
            try {
                window.sessionStorage.setItem(ENTRY_KEY, "true");
            } catch (error) {
                // Navigation should still work when session storage is unavailable.
            }
            navigateToWorld();
        });
    }

    syncAudioButton(false);
})();