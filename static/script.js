// Playback focus and section navigation.
document.addEventListener("DOMContentLoaded", () => {
  const configureSpeed = video => {
    const speed = Number(video.dataset.speed || 1);
    video.defaultPlaybackRate = speed;
    video.playbackRate = speed;
    video.addEventListener("loadedmetadata", () => { video.playbackRate = speed; });
  };
  document.querySelectorAll("video").forEach(configureSpeed);
  // Start muted full comparisons when visible; paired videos can play together.
  const allVideos = Array.from(document.querySelectorAll("video:not(.reel-video):not(.sim-policy)"));
  const clearFocus = video => video.classList.remove("is-playing");
  const visibleVideos = new Set();
  const manuallyPaused = new WeakSet();
  const loadVideo = video => {
    if (video.dataset.loaded) return;
    video.querySelectorAll("source[data-src]").forEach(source => { source.src = source.dataset.src; });
    video.dataset.loaded = "1";
    video.load();
  };
  const startVideo = video => {
    if (document.hidden || !visibleVideos.has(video) || manuallyPaused.has(video)) return;
    loadVideo(video);
    video.playbackRate = Number(video.dataset.speed || 1);
    if (video.paused) video.play().catch(() => {});
  };
  allVideos.forEach(video => {
    video.muted = true;
    video.addEventListener("play", () => {
      if (document.hidden || !visibleVideos.has(video)) { video.pause(); return; }
      manuallyPaused.delete(video);
      video.classList.add("is-playing");
    });
    video.addEventListener("pause", () => {
      if (visibleVideos.has(video) && !document.hidden && !video.ended) manuallyPaused.add(video);
      clearFocus(video);
    });
    ["ended", "error", "emptied"].forEach(event => video.addEventListener(event, () => clearFocus(video)));
  });
  if ("IntersectionObserver" in window) {
    const playbackVisibility = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
          visibleVideos.add(video);
          startVideo(video);
        } else {
          visibleVideos.delete(video);
          manuallyPaused.delete(video);
          video.pause();
        }
      });
    }, { threshold: [0, 0.1] });
    allVideos.forEach(video => playbackVisibility.observe(video));
  } else {
    allVideos.forEach(video => { visibleVideos.add(video); startVideo(video); });
  }
  document.addEventListener("visibilitychange", () => {
    allVideos.forEach(video => document.hidden ? video.pause() : startVideo(video));
  });
  // Training and policy clips start together; shorter clips hold their final
  // frames until the entire comparison finishes, then restart together.
  const comparisonVideos = [];
  document.querySelectorAll(".sim-comparison, .attention-comparison").forEach(group => {
    const videos = Array.from(group.querySelectorAll("video.sim-policy"));
    comparisonVideos.push(...videos);
    let visible = false;
    let manualPause = false;
    const start = () => {
      if (!visible || document.hidden || manualPause) return;
      videos.forEach(loadVideo);
      if (videos.some(video => video.readyState < 2)) return;
      videos.forEach(video => {
        if (video.paused && !video.ended) video.play().catch(() => {});
      });
    };
    videos.forEach(video => {
      video.muted = true;
      video.addEventListener("canplay", start);
      video.addEventListener("play", () => {
        if (!visible || document.hidden) { video.pause(); return; }
        manualPause = false;
        video.classList.add("is-playing");
        start();
      });
      video.addEventListener("pause", () => {
        clearFocus(video);
        if (visible && !document.hidden && !video.ended) {
          manualPause = true;
          videos.forEach(other => { if (!other.paused) other.pause(); });
        }
      });
      video.addEventListener("ended", () => {
        clearFocus(video);
        if (!videos.every(other => other.ended)) return;
        videos.forEach(other => { other.currentTime = 0; });
        start();
      });
      video.addEventListener("error", () => clearFocus(video));
    });
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        visible = entry.isIntersecting && entry.intersectionRatio >= 0.1;
        if (visible) start();
        else { manualPause = false; videos.forEach(video => video.pause()); }
      });
    }, { threshold: [0, 0.1] });
    observer.observe(group);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) videos.forEach(video => video.pause());
      else start();
    });
  });
  const fullPlayers = [...allVideos, ...comparisonVideos];
  // Keep the reel independent of the full-length comparison players.
  const reel = document.querySelector("#showcase");
  if (reel) {
    const track = reel.querySelector(".marquee-track");
    const cards = Array.from(track.children);
    cards.forEach(card => {
      const copy = card.cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      copy.tabIndex = -1;
      copy.querySelectorAll("video").forEach(configureSpeed);
      track.appendChild(copy);
    });
    const previews = Array.from(track.querySelectorAll("video"));
    const visible = new Set();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const toggle = reel.querySelector(".reel-toggle");
    let paused = motion.matches;
    let hovering = false;
    let focused = false;
    let offset = 0;
    let cycle = 0;
    let last = 0;
    const enabled = () => !paused && !document.hidden && !fullPlayers.some(v => !v.paused && !v.ended);
    const sync = () => {
      const active = enabled();
      previews.forEach(video => {
        if (active && visible.has(video)) {
          if (!video.hasAttribute("src")) {
            video.src = video.dataset.src;
            video.muted = true;
          }
          if (video.paused) video.play().catch(() => {});
        } else video.pause();
      });
    };
    previews.forEach(video => {
      video.addEventListener("play", () => {
        if (!enabled() || !visible.has(video)) video.pause();
        else video.classList.add("is-playing");
      });
      ["pause", "ended", "error"].forEach(event => video.addEventListener(event, () => clearFocus(video)));
    });
    const visibility = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
      sync();
    }, { threshold: 0.05 });
    previews.forEach(video => visibility.observe(video));
    const updateToggle = () => {
      toggle.setAttribute("aria-label", paused ? "Play video reel" : "Pause video reel");
      toggle.setAttribute("aria-pressed", String(paused));
      toggle.firstElementChild.textContent = paused ? "▶" : "Ⅱ";
      sync();
    };
    toggle.addEventListener("click", () => { paused = !paused; updateToggle(); });
    motion.addEventListener("change", event => { paused = event.matches; updateToggle(); });
    reel.addEventListener("mouseenter", () => { hovering = true; });
    reel.addEventListener("mouseleave", () => { hovering = false; });
    reel.addEventListener("focusin", () => { focused = true; });
    reel.addEventListener("focusout", event => { focused = reel.contains(event.relatedTarget); });
    const render = () => {
      if (cycle > 0) offset = ((offset % cycle) + cycle) % cycle;
      track.style.transform = `translateX(${-offset}px)`;
    };
    const measure = () => { cycle = track.children[cards.length].offsetLeft - cards[0].offsetLeft; render(); };
    new ResizeObserver(measure).observe(track);
    ["prev", "next"].forEach(direction => {
      reel.querySelector(`.${direction}`).addEventListener("click", () => {
        offset += (direction === "next" ? 1 : -1) * (cards[1].offsetLeft - cards[0].offsetLeft);
        render();
      });
    });
    const tick = time => {
      const elapsed = last ? Math.min(time - last, 50) : 0;
      last = time;
      if (enabled() && visible.size && !hovering && !focused) {
        offset += elapsed * 0.035;
        render();
      }
      requestAnimationFrame(tick);
    };
    fullPlayers.forEach(video => ["play", "pause", "ended"].forEach(event => video.addEventListener(event, sync)));
    document.addEventListener("visibilitychange", sync);
    updateToggle();
    measure();
    requestAnimationFrame(tick);
  }
  // Sticky side nav: highlight the current section and sub-section while scrolling.
  const navLinks = document.querySelectorAll(".sidenav a");
  const linkById = new Map();
  navLinks.forEach(a => {
    const id = a.getAttribute("href").slice(1);
    if (!linkById.has(id) || !a.classList.contains("sub")) linkById.set(id, a);
  });

  const sections = document.querySelectorAll("section.section");
  const subAnchors = document.querySelectorAll("[id^='m-'], [id^='rw-'], [id^='sim-']");

  const setActive = (id, isSub) => {
    navLinks.forEach(a => {
      const sub = a.classList.contains("sub");
      if (isSub ? sub : !sub) a.classList.remove("active");
    });
    const link = linkById.get(id);
    if (link) link.classList.add("active");
  };

  const so = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) setActive(e.target.id, false);
  }, { threshold: 0, rootMargin: "-30% 0px -60% 0px" });
  sections.forEach(s => so.observe(s));

  const ssub = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) setActive(e.target.id, true);
  }, { threshold: 0, rootMargin: "-20% 0px -70% 0px" });
  subAnchors.forEach(s => ssub.observe(s));

  // The last section (BibTeX) can't scroll high enough to reach the active band,
  // so highlight it directly once the page is scrolled to the bottom.
  const activateLastAtBottom = () => {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      const last = sections[sections.length - 1];
      if (last) setActive(last.id, false);
    }
  };
  window.addEventListener("scroll", activateLastAtBottom, { passive: true });
  activateLastAtBottom();
});
