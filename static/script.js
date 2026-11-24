document.addEventListener("DOMContentLoaded", () => {
  const configureSpeed = video => {
    const speed = Number(video.dataset.speed || 1);
    video.defaultPlaybackRate = speed;
    video.playbackRate = speed;
    video.addEventListener("loadedmetadata", () => { video.playbackRate = speed; });
  };
  document.querySelectorAll("video").forEach(configureSpeed);
  const allVideos = Array.from(document.querySelectorAll("video:not(.reel-video):not(.sim-policy):not(.real-eval-policy)"));
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
  const comparisonVideos = [];
  document.querySelectorAll(".sim-comparison, .attention-comparison, .real-eval-comparison").forEach(group => {
    const videos = Array.from(group.querySelectorAll("video.sim-policy, video.real-eval-policy"));
    comparisonVideos.push(...videos);
    let visible = false;
    let manualPause = false;
    const start = () => {
      if (!visible || document.hidden || manualPause || group.closest("[hidden]")) return;
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
        if (!visible || document.hidden || group.closest("[hidden]")) { video.pause(); return; }
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
    group.addEventListener("examplechange", () => {
      visible = false;
      manualPause = false;
      videos.forEach(video => { video.pause(); if (video.readyState >= 1) video.currentTime = 0; });
      observer.unobserve(group);
      observer.observe(group);
    });
    observer.observe(group);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) videos.forEach(video => video.pause());
      else start();
    });
  });
  const caseCarousels = Array.from(document.querySelectorAll(".case-carousel"));
  caseCarousels.forEach(carousel => {
    const slides = Array.from(carousel.querySelectorAll(":scope > .case-slide"));
    if (slides.length === 1) {
      carousel.showLinkedExample = id => slides[0].id === id;
      return;
    }
    const dots = Array.from(carousel.querySelectorAll(".case-dots .dot"));
    const counter = carousel.querySelector(".case-counter");
    let active = 0;
    const show = index => {
      active = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        slide.hidden = i !== active;
        slide.inert = i !== active;
        slide.querySelectorAll(".sim-comparison, .attention-comparison").forEach(group => {
          group.dispatchEvent(new Event("examplechange"));
        });
        dots[i].classList.toggle("active", i === active);
        dots[i].setAttribute("aria-pressed", String(i === active));
      });
      counter.textContent = `${active + 1}/${slides.length}`;
    };
    carousel.querySelector(".prev").addEventListener("click", () => show(active - 1));
    carousel.querySelector(".next").addEventListener("click", () => show(active + 1));
    dots.forEach((dot, i) => dot.addEventListener("click", () => show(i)));
    carousel.addEventListener("keydown", event => {
      if (event.target.closest("video")) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        show(active + (event.key === "ArrowRight" ? 1 : -1));
      }
    });
    carousel.showLinkedExample = id => {
      const index = slides.findIndex(slide => slide.id === id);
      if (index >= 0) { show(index); return true; }
      if (id === carousel.dataset.categoryAnchor) show(0);
      return false;
    };
  });
  const revealExample = hash => {
    const id = hash.replace(/^#/, "");
    caseCarousels.forEach(carousel => {
      if (carousel.showLinkedExample(id)) {
        requestAnimationFrame(() => carousel.scrollIntoView({ block:"start" }));
      }
    });
  };
  window.addEventListener("hashchange", () => revealExample(location.hash));
  document.addEventListener("click", event => {
    const link = event.target.closest("a[href^='#']");
    if (link) revealExample(link.getAttribute("href"));
  });
  revealExample(location.hash);
  const fullPlayers = [...allVideos, ...comparisonVideos];
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
  const navLinks = document.querySelectorAll(".sidenav a");
  const linkById = new Map();
  navLinks.forEach(a => {
    const id = a.getAttribute("href").slice(1);
    if (!linkById.has(id) || !a.classList.contains("sub")) linkById.set(id, a);
  });

  const sections = document.querySelectorAll("section.section");
  const subAnchors = Array.from(document.querySelectorAll(".sidenav a.sub")).map(a => document.getElementById(a.hash.slice(1))).filter(Boolean);

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

  const activateLastAtBottom = () => {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      const last = sections[sections.length - 1];
      if (last) setActive(last.id, false);
    }
  };
  window.addEventListener("scroll", activateLastAtBottom, { passive: true });
  activateLastAtBottom();
});
