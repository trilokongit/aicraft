import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Footer year ---------------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- Nav scroll state ---------------- */
  const nav = document.getElementById("nav");
  const onScrollNav = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  /* ---------------- Mobile nav toggle ---------------- */
  const navToggle = document.getElementById("navToggle");
  const navMobile = document.getElementById("navMobile");
  navToggle.addEventListener("click", () => {
    const open = navMobile.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  navMobile.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      navMobile.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    })
  );

  /* ---------------- Reveal on scroll ---------------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add("is-visible"), (i % 4) * 70);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------------- Flow diagram node cycling ---------------- */
  function animateFlow(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const nodes = el.querySelectorAll(".flow-node");
    if (!nodes.length) return;

    if (reduceMotion) {
      nodes.forEach((n) => n.classList.add("is-active"));
      return;
    }

    let active = 0;
    nodes[0].classList.add("is-active");
    let timer = null;

    function tick() {
      nodes.forEach((n) => n.classList.remove("is-active"));
      active = (active + 1) % nodes.length;
      nodes[active].classList.add("is-active");
      timer = setTimeout(tick, 1400);
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !timer) {
            timer = setTimeout(tick, 1400);
          } else if (!entry.isIntersecting && timer) {
            clearTimeout(timer);
            timer = null;
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
  }
  animateFlow("flowDiagram");
  animateFlow("flowDiagram2");

  /* ---------------- Contact form -> WhatsApp ---------------- */
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("cfName").value.trim();
      const topic = document.getElementById("cfTopic").value;
      const message = document.getElementById("cfMessage").value.trim();
      const text = `Hi Trilok, I'm ${name}.\nI'm interested in: ${topic}.` + (message ? `\n\n${message}` : "");
      const url = `https://wa.me/919817737778?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank", "noopener");
    });
  }

  /* ---------------- Hero Three.js network scene ---------------- */
  function initHeroScene() {
    const canvas = document.getElementById("heroCanvas");
    const hero = document.querySelector(".hero");
    if (!canvas || !hero || reduceMotion) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch (e) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    function size() {
      const w = hero.clientWidth;
      const h = hero.clientHeight;
      renderer.setSize(w, h, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    size();
    window.addEventListener("resize", size);

    // Node points
    const COUNT = 46;
    const positions = new Float32Array(COUNT * 3);
    const nodeData = [];
    for (let i = 0; i < COUNT; i++) {
      const x = (Math.random() - 0.5) * 14;
      const y = (Math.random() - 0.5) * 8;
      const z = (Math.random() - 0.5) * 6;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      nodeData.push({
        baseY: y,
        speed: 0.2 + Math.random() * 0.3,
        offset: Math.random() * Math.PI * 2,
      });
    }
    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pointsMat = new THREE.PointsMaterial({
      color: 0x2f86ff,
      size: 0.055,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(pointsGeo, pointsMat);
    scene.add(points);

    // Connections between nearby nodes
    const linePositions = [];
    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 2.6) {
          linePositions.push(
            positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
            positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
          );
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x8b7cff, transparent: true, opacity: 0.14 });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    let raf;
    const clock = new THREE.Clock();

    function animate() {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const posAttr = pointsGeo.getAttribute("position");
      for (let i = 0; i < COUNT; i++) {
        const d = nodeData[i];
        posAttr.array[i * 3 + 1] = d.baseY + Math.sin(t * d.speed + d.offset) * 0.25;
      }
      posAttr.needsUpdate = true;
      scene.rotation.y = Math.sin(t * 0.05) * 0.15;
      scene.rotation.x = Math.cos(t * 0.04) * 0.05;
      renderer.render(scene, camera);
    }
    animate();

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else animate();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHeroScene);
  } else {
    initHeroScene();
  }
})();
