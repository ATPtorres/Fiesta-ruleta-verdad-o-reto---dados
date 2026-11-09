const assert = require('node:assert/strict');
const test = require('node:test');
const { randomInt, spinToIndex, normalizeAngle, choosePair } = require('../docs/game-utils.js');

test('dados: valores uniformemente dentro de rango', () => {
  for (let i=0; i<300; i++) {
    const n = randomInt(6);
    assert.ok(Number.isInteger(n) && n >= 0 && n <= 5);
  }
});
test('ruleta: termina en el centro del sector seleccionado', () => {
  for (const count of [2,3,7,31,60]) {
    for (let index=0; index<count; index++) {
      const final = spinToIndex(414, index, count, 5);
      const expected = normalizeAngle(-(index + .5) * 360 / count);
      assert.ok(Math.abs(normalizeAngle(final) - expected) < .0001);
    }
  }
});
test('verdad o reto: roles distintos y sin repetición inmediata con 3+', () => {
  const players = ['Juan','Jose','Marta','Ana'];
  for (let i=0; i<200; i++) {
    const pair = choosePair(players, [{asker:'Juan',target:'Jose'}]);
    assert.notEqual(pair.asker, pair.target);
    assert.notDeepEqual([pair.asker,pair.target].sort(), ['Jose','Juan']);
  }
});
test('verdad o reto: funciona con 2 jugadores', () => {
  const p = choosePair(['A','B'], [{asker:'A',target:'B'}]);
  assert.notEqual(p.asker,p.target);
});
