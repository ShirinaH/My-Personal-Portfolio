(function () {
  "use strict";

  const BOOT_LINES = [
    "555553001000003 // BUILD SYS // SEG3125 // 0011 SH",
    "555553001000004 // LOAD UI  // SEG3125 // 0011 SH",
    "555553001000005 // LOAD UX  // SEG3125 // 0011 SH",
    "",
    "SYS >> ",
    "ST $ = DESIGN",
    "CPU $ = UX/UI",
    "",
    "SPO.LOAD 100 → 100",
    "SPO.LOAD 200 → 200",
    "",
    ">>>",
    "SYS CHECK.INT — PORTFOLIO v1.0",
    "",
    ">>>",
    "Boot Complete",
    "CREATIVE MODE STARTS NOW.",
  ];

  const HERO_TITLE = "HELLO_WORLD";
  const HERO_SUB = [
    ":: PRODUCT: Portfolio",
    ":: ID: SH-001",
    ":: INSPIRATION: COZY RETRO TECH",
    ":: STYLE: LO-FI × PIXEL ART",
  ];

  const bootEl = document.getElementById("boot-loader");
  const bootTerminal = document.getElementById("boot-terminal");
  const bootSkip = document.getElementById("boot-skip");
  const mainContent = document.getElementById("main-content");
  const heroTypewriter = document.getElementById("hero-typewriter");
  const heroSubLines = document.getElementById("hero-sub-lines");

  let bootDone = false;
  let bootAbort = false;

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function typeText(el, text, speed = 28) {
    for (let i = 0; i < text.length; i++) {
      if (bootAbort) return;
      el.textContent += text[i];
      await delay(speed);
    }
  }

  async function typeLine(line, speed = 22) {
    if (bootAbort) return;
    await typeText(bootTerminal, line + "\n", speed);
    await delay(80);
  }

  async function runBootSequence() {
    document.body.classList.add("boot-active");
    bootTerminal.textContent = "";

    for (const line of BOOT_LINES) {
      if (bootAbort) break;
      await typeLine(line, line.startsWith("55555") ? 12 : 24);
    }

    if (!bootAbort) await delay(600);
    finishBoot();
  }

  const BGM_VOLUME = 0.38;
  const FADE_MS = 700;
  let musicController = null;

  function finishBoot() {
    if (bootDone) return;
    bootDone = true;
    bootAbort = true;

    bootEl.classList.add("done");
    document.body.classList.remove("boot-active");
    mainContent.classList.remove("hidden");

    setTimeout(() => {
      bootEl.setAttribute("aria-hidden", "true");
      startHeroAnimations();
      initScrollReveal();
      initParallax();
      requestAnimationFrame(() => activateVisibleReveals());
      if (musicController) musicController.promptPlay();
    }, 650);
  }

  async function startHeroAnimations() {
    if (!heroTypewriter) return;

    heroTypewriter.textContent = "";
    await typeText(heroTypewriter, HERO_TITLE, 90);
    await delay(400);

    if (!heroSubLines) return;
    heroSubLines.textContent = "";
    for (const line of HERO_SUB) {
      const p = document.createElement("p");
      p.className = "hero-sub-line";
      heroSubLines.appendChild(p);
      await typeText(p, line, 35);
      await delay(200);
    }
  }

  function activateVisibleReveals() {
    document.querySelectorAll(".reveal").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92) el.classList.add("active");
    });
  }

  function initScrollReveal() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("active");
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
  }

  function initParallax() {
    const heroImg = document.querySelector(".hero-img");
    const decoPlant = document.querySelector(".deco-plant");

    if (!heroImg) return;

    window.addEventListener(
      "scroll",
      () => {
        const y = window.scrollY;
        if (y < window.innerHeight) {
          heroImg.style.transform = `translateY(${y * 0.06}px)`;
          if (decoPlant) decoPlant.style.transform = `translateY(${y * 0.04}px) rotate(${Math.sin(y * 0.01) * 4}deg)`;
        }
      },
      { passive: true }
    );
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const target = document.querySelector(this.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
    });
  });

  function initTheme(onThemeChange) {
    const toggle = document.getElementById("theme-toggle");
    const badge = document.getElementById("hero-badge");
    const root = document.documentElement;

    function isDark() {
      return root.getAttribute("data-theme") === "dark";
    }

    function updateBadge() {
      if (!badge) return;
      badge.textContent = isDark() ? badge.dataset.dark : badge.dataset.light;
    }

    function applyTheme(dark) {
      if (dark) {
        root.setAttribute("data-theme", "dark");
        localStorage.setItem("portfolio-theme", "dark");
      } else {
        root.removeAttribute("data-theme");
        localStorage.setItem("portfolio-theme", "light");
      }
      if (toggle) toggle.setAttribute("aria-pressed", String(dark));
      updateBadge();
      if (onThemeChange) onThemeChange(dark);
    }

    applyTheme(localStorage.getItem("portfolio-theme") === "dark");

    if (toggle) {
      toggle.addEventListener("click", () => applyTheme(!isDark()));
    }

    return { isDark, applyTheme };
  }

  const TRACK_META = {
    light: { title: "Cozy Chill Loop" },
    dark: { title: "Sleepy Midnight Drift" },
  };

  function initMusic(themeApi) {
    const audioLight = document.getElementById("audio-light");
    const audioDark = document.getElementById("audio-dark");
    const btn = document.getElementById("music-toggle");
    const songTitle = document.getElementById("song-title");
    const vinylStatus = document.getElementById("vinyl-status");

    if (!audioLight || !audioDark || !btn) return null;

    let enabled = localStorage.getItem("portfolio-music") !== "off";
    let playing = false;
    let fading = false;

    function updateNowPlaying(dark) {
      const meta = dark ? TRACK_META.dark : TRACK_META.light;
      if (songTitle) songTitle.textContent = meta.title;
    }

    function trackForDark(dark) {
      return dark ? audioDark : audioLight;
    }

    function fadeVolume(audio, from, to, duration) {
      return new Promise((resolve) => {
        const steps = 16;
        const stepTime = duration / steps;
        let step = 0;
        const delta = (to - from) / steps;

        const tick = () => {
          step += 1;
          audio.volume = Math.max(0, Math.min(1, from + delta * step));
          if (step >= steps) {
            audio.volume = to;
            resolve();
          } else {
            setTimeout(tick, stepTime);
          }
        };
        tick();
      });
    }

    async function crossfadeTo(dark) {
      if (fading) return;
      fading = true;

      const next = trackForDark(dark);
      const prev = trackForDark(!dark);

      if (prev !== next && !prev.paused) {
        await fadeVolume(prev, prev.volume, 0, FADE_MS);
        prev.pause();
      }

      next.currentTime = 0;
      next.volume = 0;

      try {
        await next.play();
        playing = true;
        await fadeVolume(next, 0, BGM_VOLUME, FADE_MS);
      } catch {
        playing = false;
      }

      fading = false;
      updateWidget();
    }

    function pauseAll() {
      [audioLight, audioDark].forEach((a) => {
        a.pause();
        a.volume = 0;
      });
      playing = false;
      updateWidget();
    }

    function updateWidget() {
      const isActive = playing && enabled;
      btn.classList.toggle("is-playing", isActive);
      btn.classList.toggle("is-muted", !enabled || !playing);
      btn.setAttribute("aria-pressed", String(!enabled));
      btn.setAttribute("aria-label", enabled ? "Mute background music" : "Unmute background music");
      if (vinylStatus) vinylStatus.textContent = isActive ? "playing:" : "paused:";
    }

    async function startMusic() {
      if (!enabled || fading) return;
      const active = trackForDark(themeApi.isDark());
      if (playing && !active.paused) return;
      await crossfadeTo(themeApi.isDark());
    }

    btn.addEventListener("click", async () => {
      enabled = !enabled;
      localStorage.setItem("portfolio-music", enabled ? "on" : "off");

      if (enabled) {
        await startMusic();
      } else {
        pauseAll();
      }
    });

    function promptPlay() {
      if (!enabled || playing) return;
      startMusic().catch(() => {});
    }

    document.body.addEventListener(
      "click",
      () => {
        if (enabled && !playing) promptPlay();
      },
      { once: true }
    );

    updateNowPlaying(themeApi.isDark());
    updateWidget();

    return {
      promptPlay,
      onThemeChange(dark) {
        updateNowPlaying(dark);
        if (!enabled) return;
        crossfadeTo(dark);
      },
    };
  }

  const themeApi = initTheme((dark) => {
    if (musicController) musicController.onThemeChange(dark);
  });
  musicController = initMusic(themeApi);

  bootSkip.addEventListener("click", finishBoot);
  runBootSequence();
})();
