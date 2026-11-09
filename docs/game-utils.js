(function (root) {
  'use strict';
  function randomInt(max) {
    if (!Number.isSafeInteger(max) || max < 1 || max > 0x100000000) {
      throw new RangeError('max debe ser entero positivo');
    }
    if (root.crypto && typeof root.crypto.getRandomValues === 'function') {
      const limit = Math.floor(0x100000000 / max) * max;
      const bytes = new Uint32Array(1);
      let n;
      do {
        root.crypto.getRandomValues(bytes);
        n = bytes[0];
      } while (n >= limit);
      return n % max;
    }
    return Math.floor(Math.random() * max);
  }
  function normalizeAngle(degrees) {
    return ((degrees % 360) + 360) % 360;
  }
  function spinToIndex(current, index, count, cycles) {
    if (!Number.isInteger(index) || !Number.isInteger(count) || count < 1 || index < 0 || index >= count) {
      throw new RangeError('Sector inválido');
    }
    const target = normalizeAngle(-(index + 0.5) * 360 / count);
    const delta = normalizeAngle(target - normalizeAngle(current));
    return current + 360 * (cycles === undefined ? 6 : cycles) + delta;
  }
  function choosePair(names, recent, choose) {
    if (!Array.isArray(names) || names.length < 2) throw new RangeError('Se requieren 2 personas');
    const picks = [];
    for (let i = 0; i < names.length; i++) {
      for (let j = 0; j < names.length; j++) {
        if (i !== j) picks.push({ asker: names[i], target: names[j] });
      }
    }
    const history = (recent || []).slice(-3);
    let pool = picks;
    for (const prior of history.slice().reverse()) {
      const next = pool.filter(pair => !(
        (pair.asker === prior.asker && pair.target === prior.target) ||
        (pair.asker === prior.target && pair.target === prior.asker)
      ));
      if (next.length > 0) pool = next;
    }
    if (history.length && names.length >= 3) {
      const last = history[history.length - 1];
      const varied = pool.filter(pair => pair.asker !== last.asker && pair.target !== last.target);
      if (varied.length) pool = varied;
    }
    const index = (choose || randomInt)(pool.length);
    if (!Number.isInteger(index) || index < 0 || index >= pool.length) throw new RangeError('Elección inválida');
    return pool[index];
  }
  const api = Object.freeze({ randomInt, normalizeAngle, spinToIndex, choosePair });
  root.GameUtils = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
