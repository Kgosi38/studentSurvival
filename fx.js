const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const shown = new WeakMap();

function countTo(el, value) {
  const from = shown.has(el) ? shown.get(el) : value;
  shown.set(el, value);
  if (!window.gsap || reduceMotion || from === value) {
    el.textContent = "R" + value.toFixed(2);
    return;
  }
  const o = { v: from };
  gsap.to(o, {
    v: value, duration: 0.6, ease: "power2.out",
    onUpdate: () => { el.textContent = "R" + o.v.toFixed(2); }
  });
}

if (window.gsap && !reduceMotion) {
  gsap.from(".hero h2, .hero p, .hero .cta", {
    y: 24, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power3.out"
  });
}