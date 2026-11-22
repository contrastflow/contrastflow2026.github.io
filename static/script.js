// Playback focus and section navigation.
document.addEventListener("DOMContentLoaded", () => {
  // Keep paused clips subdued and let only the selected clip play.
  const allVideos = Array.from(document.querySelectorAll("video:not(.reel-video)"));
  const clearFocus = (video) => video.classList.remove("is-playing");
  allVideos.forEach(video => {
    video.addEventListener("play", () => {
      allVideos.forEach(other => {
        if (other !== video) {
          other.pause();
          clearFocus(other);
        }
      });
      video.classList.add("is-playing");
    });
    ["pause", "ended", "error", "emptied"].forEach(event => {
      video.addEventListener(event, () => clearFocus(video));
    });
  });
  // Keep the reel independent of the full-length comparison players.
  const reel = document.querySelector("#showcase");
  if (reel) {
    const track = reel.querySelector(".marquee-track");
    const cards = Array.from(track.children);
    cards.forEach(card => {
      const copy = card.cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      copy.tabIndex = -1;
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
    const enabled = () => !paused && !document.hidden && !allVideos.some(v => !v.paused && !v.ended);
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
    allVideos.forEach(video => ["play", "pause", "ended"].forEach(event => video.addEventListener(event, sync)));
    document.addEventListener("visibilitychange", sync);
    updateToggle();
    measure();
    requestAnimationFrame(tick);
  }
  const videos = document.querySelectorAll("video.vid[data-src]");
  const attach = (v) => {
    if (v.dataset.loaded) return;
    const s = document.createElement("source");
    s.src = v.dataset.src;
    s.type = "video/mp4";
    v.appendChild(s);
    v.load();
    v.dataset.loaded = "1";
  };
  if (!("IntersectionObserver" in window)) {
    videos.forEach(attach);
  } else {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const v = e.target;
        if (e.isIntersecting) {
          attach(v);
          v.playbackRate = parseFloat(v.dataset.speed || "1");
          v.play().catch(() => { /* autoplay blocked */ });
        } else {
          v.pause();
        }
      }
    }, { threshold: 0.25 });
    videos.forEach(v => io.observe(v));
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
