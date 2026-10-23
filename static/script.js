// Lazy-attach <source> only when a video enters the viewport, and pause it again
// when it leaves. The page currently has no videos; this is kept so rollout clips
// can be dropped in later with <video class="vid" data-src="..."> as in the template.
document.addEventListener("DOMContentLoaded", () => {
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
