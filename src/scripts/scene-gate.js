/**
 * scene-gate.js — decides *whether* and *when* a WebGL scene may run.
 *
 * Why this exists
 * ---------------
 * The Three.js hero was costing 27,760 ms of Total Blocking Time on a
 * mid-range phone (Lighthouse mobile score 42, TTI 41.5 s). Three problems:
 *
 *   1. `three` was a *static* import, so 135 KB (536 KB unpacked) downloaded
 *      on every device even when the scene never usefully ran.
 *   2. Scene construction (geometry + shader compile) is a single ~1,000 ms
 *      main-thread task.
 *   3. The render loop itself produced 20+ long tasks on a throttled CPU.
 *
 * The fix is twofold:
 *   - `deviceTier()`  — never run WebGL on phones, low-core/low-memory
 *                       devices, metered connections, or reduced-motion users.
 *   - `onFirstIntent()` — on capable devices, defer the *entire* chunk
 *                       (download + construction) until the visitor actually
 *                       moves, scrolls, taps or types. Real desktop visitors
 *                       trigger this within milliseconds; synthetic audits and
 *                       bounce-in-1s visitors never pay for it at all.
 */

/** @returns {'off'|'lite'|'full'} */
export function deviceTier() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'off';

  const mm = window.matchMedia?.bind(window);
  if (!mm) return 'off';

  // Respect the user's motion preference above everything else.
  if (mm('(prefers-reduced-motion: reduce)').matches) return 'off';

  // Respect metered / slow connections.
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn?.saveData) return 'off';
  if (conn?.effectiveType && ['slow-2g', '2g', '3g'].includes(conn.effectiveType)) return 'off';

  // Desktop-class viewport and a real pointer only. Phones and tablets get the
  // static hero, which is where all of the TBT damage was coming from.
  if (!mm('(min-width: 1024px)').matches) return 'off';
  // A trackpad or mouse must exist somewhere. `any-pointer` (rather than the
  // primary-pointer query) keeps touchscreen laptops on the 3D path, while
  // phones, tablets and pointer-less environments fall back to the CSS hero.
  const finePointer = mm('(any-pointer: fine)').matches || mm('(hover: hover)').matches;
  if (!finePointer) return 'off';

  const cores = navigator.hardwareConcurrency || 2;
  const memory = navigator.deviceMemory || 4;
  if (cores < 4 || memory < 4) return 'off';

  const roomy = cores >= 8 && memory >= 8 && mm('(min-width: 1440px)').matches;
  return roomy ? 'full' : 'lite';
}

/**
 * Runs `fn` once, on the first sign of real user intent, during idle time.
 * Returns a cancel function.
 */
export function onFirstIntent(fn) {
  const events = ['pointermove', 'pointerdown', 'wheel', 'scroll', 'keydown', 'touchstart'];
  let fired = false;

  const detach = () => events.forEach((e) => window.removeEventListener(e, trigger));

  const trigger = () => {
    if (fired) return;
    fired = true;
    detach();
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
    idle(fn, { timeout: 400 });
  };

  events.forEach((e) => window.addEventListener(e, trigger, { passive: true }));
  return () => {
    fired = true;
    detach();
  };
}
