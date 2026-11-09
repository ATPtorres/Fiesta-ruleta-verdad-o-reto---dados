(function () {
  'use strict';
  const U = window.GameUtils;
  const $ = id => document.getElementById(id);
  const key = 'fiesta-mix-v1';
  const palette = ['#a989ff','#f17eb9','#7bcbcf','#ffc17b','#887ee9','#f59d83','#b9d887','#e09ada','#71aee0','#e8b36e'];
  const defaults = {diceCount:2,roulette:[],players:[],truthLimit:2,level:'suave',truthCounts:{},recent:[]};
  function clampInt(x,min,max,fallback) {
    const n = Number(x);
    return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
  }
  function safeNames(x,maxLength,maxCount) {
    return Array.isArray(x) ? x.filter(v => typeof v==='string').map(v=>v.trim().slice(0,maxLength)).filter(Boolean).filter((v,i,a)=>a.findIndex(y=>y.toLocaleLowerCase('es')===v.toLocaleLowerCase('es'))===i).slice(0,maxCount) : [];
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(key) || '{}');
      const names = safeNames(s.players,24,60);
      const counts = {};
      for (const name of names) counts[name] = clampInt(s.truthCounts && s.truthCounts[name],0,10000,0);
      return {
        diceCount: clampInt(s.diceCount,1,100,2),
        roulette: safeNames(s.roulette,36,100),
        players:names,
        truthLimit:clampInt(s.truthLimit,1,99,2),
        level:['suave','fiesta','picante','atrevido'].includes(s.level)?s.level:'suave',
        truthCounts: counts,
        recent: Array.isArray(s.recent) ? s.recent.filter(p => p && names.includes(p.asker) && names.includes(p.target) && p.asker!==p.target).slice(-3) : []
      };
    } catch(e) { return {...defaults,truthCounts:{},roulette:[],players:[],recent:[]}; }
  }
  const state=load();
  const angles={roulette:0,asker:0,target:0};
  let diceBusy=false, rouletteBusy=false, partyBusy=false;
  let rouletteWinner=null, currentPair=null, selectedMode=null;
  let toastTimer, diceTimer;
  const reducedMotion=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function save() { try { localStorage.setItem(key,JSON.stringify(state)); } catch(e) {} }
  function toast(message) {
    const el=$('toast'); el.textContent=message; el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>el.classList.remove('show'),2600);
  }
  function navigate(where) {
    if (!$(where)) return;
    for (const section of document.querySelectorAll('.screen')) {
      const active=section.id===where;
      section.hidden=!active;
      section.classList.toggle('active',active);
    }
    for (const button of document.querySelectorAll('.tab')) {
      const active=button.dataset.go===where;
      button.classList.toggle('active',active);
      if (active) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
    }
    window.scrollTo(0,0);
  }
  window.goToHome=()=>navigate('home');
  for (const button of document.querySelectorAll('[data-go]')) button.addEventListener('click',()=>navigate(button.dataset.go));
  function sprinkle() {
    if (reducedMotion) return;
    const layer=$('confetti-layer');
    const shades=['#ff89c7','#cbb0ff','#f9cd8d','#85d9d0','#fbf3ff'];
    for(let i=0;i<42;i++) {
      const e=document.createElement('i');e.className='confetti';
      e.style.left=(5+Math.random()*90)+'%';
      e.style.background=shades[U.randomInt(shades.length)];
      e.style.animationDelay=(Math.random()*.4)+'s';
      e.style.setProperty('--shift',(Math.random()*200-100)+'px');
      layer.appendChild(e);
      setTimeout(()=>e.remove(),2300);
    }
  }
  const pips={
    1:['mc'],2:['tl','br'],3:['tl','mc','br'],
    4:['tl','tr','bl','br'],5:['tl','tr','mc','bl','br'],
    6:['tl','tr','ml','mr','bl','br']
  };
  function dieFace(value,count) {
    const die=document.createElement('div');
    die.className='die'+(count>6?' compact':'')+(count>16?' tiny':'');
    die.setAttribute('role','img');die.setAttribute('aria-label','Dado con '+value);
    for (const pos of pips[value]) {
      const pip=document.createElement('i');pip.className='pip';pip.dataset.pos=pos;die.appendChild(pip);
    }
    return die;
  }
  function paintDice(values) {
    const wrap=$('dice-grid');
    wrap.replaceChildren(...values.map(value=>dieFace(value,values.length)));
  }
  function syncDice() {
    $('dice-count').value=state.diceCount;
    $('dice-meta').textContent=state.diceCount+(state.diceCount===1?' dado':' dados')+' · 6 caras';
    $('dice-sum').textContent='—';
    $('dice-status').textContent='Pulsa lanzar para conocer el resultado';
    paintDice(Array(state.diceCount).fill(1));
    save();
  }
  function setDiceCount(n) {
    if (diceBusy) return;
    state.diceCount=clampInt(n,1,100,state.diceCount);
    syncDice();
  }
  $('dice-minus').addEventListener('click',()=>setDiceCount(state.diceCount-1));
  $('dice-plus').addEventListener('click',()=>setDiceCount(state.diceCount+1));
  $('dice-count').addEventListener('change',e=>setDiceCount(e.target.value));
  $('roll-dice').addEventListener('click',()=>{
    if (diceBusy) return;
    diceBusy=true;
    $('roll-dice').disabled=true;
    $('dice-sum').textContent='...';
    $('dice-status').textContent='¡Los dados están rodando!';
    clearInterval(diceTimer);
    const result=Array.from({length:state.diceCount},()=>U.randomInt(6)+1);
    if (!reducedMotion) {
      diceTimer=setInterval(()=>{
        paintDice(result.map(()=>U.randomInt(6)+1));
        for (const die of $('dice-grid').children) die.classList.add('shaking');
      },95);
    }
    setTimeout(()=>{
      clearInterval(diceTimer);
      paintDice(result);
      const sum=result.reduce((a,b)=>a+b,0);
      $('dice-sum').textContent=String(sum);
      $('dice-status').textContent=state.diceCount===1?'Resultado del dado':'Suma de los '+state.diceCount+' dados';
      diceBusy=false;
      $('roll-dice').disabled=false;
      sprinkle();
    },reducedMotion?50:1400);
  });
  function makeChip(label,onRemove) {
    const chip=document.createElement('span');chip.className='chip';
    const text=document.createElement('span');text.textContent=label;
    const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Eliminar '+label);
    close.addEventListener('click',onRemove);
    chip.append(text,close);return chip;
  }
  function createWheel(canvasId,labels,colors) {
    const canvas=$(canvasId);
    const ctx=canvas.getContext('2d');
    const w=canvas.width,c=w/2,r=c-6;
    ctx.clearRect(0,0,w,w);
    ctx.save(); ctx.translate(c,c);
    const entries=labels.length ? labels : ['?','?','?','?','?','?'];
    const count=entries.length,arc=2*Math.PI/count;
    for(let i=0;i<count;i++) {
      const from=-Math.PI/2+i*arc,to=from+arc,mid=from+arc/2;
      ctx.beginPath(); ctx.moveTo(0,0);ctx.arc(0,0,r,from,to);ctx.closePath();
      ctx.fillStyle=labels.length ? colors[i%colors.length] : ['#3b3558','#292943'][i%2];
      ctx.fill();
      ctx.strokeStyle='#151322'; ctx.lineWidth=3; ctx.stroke();
      ctx.save();ctx.rotate(mid);
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#171529';
      ctx.font='800 '+(count>28?'17':count>16?'20':count>9?'25':'29')+'px system-ui, sans-serif';
      let t=entries[i];
      if (count>24) t=String(i+1);
      else if(t.length>(count>12?10:16)) t=t.slice(0,count>12?9:15)+'…';
      ctx.translate(r*.62,0);
      const upright= Math.cos(mid)<0;
      if (upright) ctx.rotate(Math.PI);
      ctx.fillText(t,0,0,Math.min(r*.71,count>20?60:175));
      ctx.restore();
    }
    ctx.beginPath();ctx.arc(0,0,r-2,0,Math.PI*2);ctx.lineWidth=7;ctx.strokeStyle='#eee6ffcc';ctx.stroke();
    ctx.restore();
  }
  function spin(canvasId,index,count,kind,duration) {
    const element=$(canvasId);
    const from=angles[kind];
    // CSS rotates the pre-drawn disc under the stationary top pointer.
    const to=U.spinToIndex(from,index,count,6+U.randomInt(3));
    const ms=reducedMotion?0:duration;
    element.style.transition=ms?'transform '+ms+'ms cubic-bezier(.12,.79,.12,1)':'none';
    element.style.transform='rotate('+to+'deg)';
    angles[kind]=to;
  }
  function resetWheelAngle(canvasId,kind) {
    angles[kind]=0;
    const element=$(canvasId);
    element.style.transition='none'; element.style.transform='rotate(0deg)';
    void element.offsetWidth;
  }
  function renderRoulette() {
    const wrap=$('roulette-chips');
    wrap.replaceChildren(...state.roulette.map((label,i)=>makeChip(label,()=>{
      if (rouletteBusy) return toast('Espera a que termine el giro');
      state.roulette.splice(i,1);rouletteWinner=null;resetWheelAngle('roulette-canvas','roulette');
      renderRoulette();save();
    })));
    $('roulette-count').textContent=state.roulette.length+(state.roulette.length===1?' opción':' opciones');
    $('roulette-hint').textContent=state.roulette.length<2?'Necesitas al menos 2 opciones para girar.':(state.roulette.length>24?'Con más de 24 opciones la ruleta mostrará números; las opciones siguen en la lista.':'Todas las opciones tienen la misma probabilidad.');
    $('spin-roulette').disabled=rouletteBusy||state.roulette.length<2;
    $('roulette-outcome').textContent=rouletteWinner===null?'¿Qué saldrá?':'✦ '+state.roulette[rouletteWinner];
    $('roulette-actions').hidden=rouletteWinner===null;
    createWheel('roulette-canvas',state.roulette,palette);
  }
  $('roulette-form').addEventListener('submit',e=>{
    e.preventDefault(); if (rouletteBusy) return;
    const raw=$('roulette-input').value.trim().replace(/\s+/g,' ');
    if (!raw) return toast('Escribe primero una opción');
    if(state.roulette.length>=100) return toast('Máximo 100 opciones para mantener la fluidez');
    if(state.roulette.some(n=>n.toLocaleLowerCase('es')===raw.toLocaleLowerCase('es')))return toast('Esa opción ya está incluida');
    state.roulette.push(raw.slice(0,36));
    $('roulette-input').value='';rouletteWinner=null;resetWheelAngle('roulette-canvas','roulette');
    renderRoulette();save();
  });
  $('spin-roulette').addEventListener('click',()=>{
    if(rouletteBusy||state.roulette.length<2)return;
    rouletteBusy=true;rouletteWinner=null;
    $('spin-roulette').disabled=true;$('roulette-actions').hidden=true;
    $('roulette-outcome').textContent='Girando…';
    const idx=U.randomInt(state.roulette.length);
    const ms=reducedMotion?50:4100;
    spin('roulette-canvas',idx,state.roulette.length,'roulette',ms);
    setTimeout(()=>{
      rouletteBusy=false;rouletteWinner=idx;renderRoulette();sprinkle();
    },ms+35);
  });
  $('keep-option').addEventListener('click',()=>{
    if(rouletteWinner===null)return;
    rouletteWinner=null;renderRoulette();toast('Opción conservada para el próximo giro');
  });
  $('remove-winner').addEventListener('click',()=>{
    if(rouletteWinner===null)return;
    const label=state.roulette.splice(rouletteWinner,1)[0];rouletteWinner=null;
    resetWheelAngle('roulette-canvas','roulette');renderRoulette();save();
    toast('Eliminado: '+label);
  });
  function clearRound() {
    currentPair=null;selectedMode=null;
    $('round-controls').hidden=true;
    $('party-result').replaceChildren();
    const label=document.createElement('span');label.className='result-label';label.textContent='PRÓXIMA RONDA';
    const title=document.createElement('strong');title.textContent='¿Quién será el siguiente?';
    const help=document.createElement('small');help.textContent='Agrega jugadores y gira las ruletas';
    $('party-result').append(label,title,help);
  }
  function renderPlayers() {
    const wrap=$('player-chips');
    wrap.replaceChildren(...state.players.map((label,i)=>makeChip(label,()=>{
      if (partyBusy) return toast('Espera a que termine el giro');
      state.players.splice(i,1);delete state.truthCounts[label];state.recent=[];
      clearRound();resetWheelAngle('asker-canvas','asker');resetWheelAngle('target-canvas','target');
      renderPlayers();save();
    })));
    $('player-count-label').textContent=state.players.length+(state.players.length===1?' jugador':' jugadores');
    $('player-hint').textContent=state.players.length<2?'Agrega al menos 2 personas para comenzar.':'Los papeles son distintos y se evitan parejas recientes cuando es posible.';
    $('spin-party').disabled=partyBusy||state.players.length<2;
    $('truth-limit').value=state.truthLimit;
    createWheel('asker-canvas',state.players,['#b5a3dd','#ecc2d4','#9d8cbd','#d1b1cb','#c5b7e9']);
    createWheel('target-canvas',state.players,['#ff9e8c','#ffca9c','#f27ca2','#e8b18c','#fc8791']);
    renderTruthBoard();
  }
  $('player-form').addEventListener('submit',e=>{
    e.preventDefault();if(partyBusy)return;
    const raw=$('player-input').value.trim().replace(/\s+/g,' ');
    if(!raw)return toast('Escribe el nombre de una persona');
    if(state.players.length>=60)return toast('Máximo 60 participantes');
    if(state.players.some(n=>n.toLocaleLowerCase('es')===raw.toLocaleLowerCase('es')))return toast('Ese nombre ya está incluido');
    const name=raw.slice(0,24);
    state.players.push(name);state.truthCounts[name]=0;state.recent=[];$('player-input').value='';
    clearRound();resetWheelAngle('asker-canvas','asker');resetWheelAngle('target-canvas','target');
    renderPlayers();save();
  });
  function setTruthLimit(raw) {
    state.truthLimit=clampInt(raw,1,99,state.truthLimit);
    $('truth-limit').value=state.truthLimit;
    renderTruthBoard();if(currentPair)updateRoundStatus();save();
  }
  $('truth-minus').addEventListener('click',()=>setTruthLimit(Math.max(1,state.truthLimit-1)));
  $('truth-plus').addEventListener('click',()=>setTruthLimit(Math.min(99,state.truthLimit+1)));
  $('truth-limit').addEventListener('change',e=>setTruthLimit(e.target.value));
  for(const button of document.querySelectorAll('[data-level]')) {
    button.addEventListener('click',()=>{
      state.level=button.dataset.level;
      for(const btn of document.querySelectorAll('[data-level]'))btn.classList.toggle('active',btn.dataset.level===state.level);
      save();toast('Intensidad actualizada');
    });
  }
  function renderTruthBoard() {
    const wrap=$('truth-board');wrap.replaceChildren();
    if(!state.players.length) {
      const p=document.createElement('p');p.className='hint';p.textContent='Agrega participantes para ver el contador.';wrap.appendChild(p);
      return;
    }
    for(const name of state.players) {
      const n=state.truthCounts[name]||0;
      const row=document.createElement('div');row.className='truth-row';
      const label=document.createElement('span');label.textContent=name;
      const score=document.createElement('span');score.className='score';
      score.textContent=n+' / '+state.truthLimit+(n>=state.truthLimit?' · ¡RETO!':'');
      row.append(label,score);wrap.appendChild(row);
    }
  }
  $('reset-history').addEventListener('click',()=>{
    if(partyBusy)return;
    state.recent=[];state.truthCounts=Object.fromEntries(state.players.map(name=>[name,0]));
    clearRound();renderTruthBoard();save();toast('Rondas y contadores reiniciados');
  });
  function isForced() {
    return !!currentPair && (state.truthCounts[currentPair.target]||0)>=state.truthLimit;
  }
  function updateRoundStatus() {
    if (!currentPair)return;
    const n=state.truthCounts[currentPair.target]||0;
    const forced=isForced();
    $('truth-status').textContent=forced?'⚡ '+currentPair.target+' llegó a '+state.truthLimit+' verdades: le toca reto.': '♡ '+currentPair.target+' lleva '+n+' de '+state.truthLimit+' verdades permitidas.';
    $('choose-truth').disabled=!!selectedMode||forced;
    $('choose-dare').disabled=!!selectedMode;
    $('choose-truth').classList.toggle('selected',selectedMode==='truth');
    $('choose-dare').classList.toggle('selected',selectedMode==='dare');
    $('suggest-truth').disabled=selectedMode==='dare'||(!selectedMode&&forced);
    $('suggest-dare').disabled=selectedMode==='truth';
  }
  function displayPair(pair) {
    const block=$('party-result');block.replaceChildren();
    const label=document.createElement('span');label.className='result-label';label.textContent='¡PAREJA ELEGIDA!';
    const title=document.createElement('strong');title.textContent=pair.asker+' reta / pregunta a '+pair.target;
    const small=document.createElement('small');small.textContent='Negro: '+pair.asker+' · Rojo: '+pair.target;
    block.append(label,title,small);
    $('round-controls').hidden=false;
    $('suggestion').replaceChildren();
    const hint=document.createElement('small');hint.textContent='IDEAS PARA LA RONDA';
    const info=document.createElement('p');info.textContent='Elige verdad o reto, o utiliza una sugerencia.';
    $('suggestion').append(hint,info);
    updateRoundStatus();
  }
  $('spin-party').addEventListener('click',()=>{
    if(partyBusy || state.players.length<2)return;
    partyBusy=true;currentPair=null;selectedMode=null;
    $('spin-party').disabled=true;clearRound();
    const pair=U.choosePair(state.players,state.recent);
    const i=state.players.indexOf(pair.asker),j=state.players.indexOf(pair.target);
    const ms=reducedMotion?50:4200;
    spin('asker-canvas',i,state.players.length,'asker',ms);
    spin('target-canvas',j,state.players.length,'target',ms+200);
    setTimeout(()=>{
      partyBusy=false;currentPair=pair;state.recent.push(pair);state.recent=state.recent.slice(-3);
      save();renderPlayers();displayPair(pair);sprinkle();
    },ms+245);
  });
  function chooseMode(mode) {
    if(!currentPair)return false;
    if(selectedMode)return selectedMode===mode;
    if(mode==='truth'&&isForced())return false;
    selectedMode=mode;
    if(mode==='truth')state.truthCounts[currentPair.target]=(state.truthCounts[currentPair.target]||0)+1;
    else state.truthCounts[currentPair.target]=0;
    save();renderTruthBoard();updateRoundStatus();
    const hint=$('suggestion');
    const headline=document.createElement('small');headline.textContent=mode==='truth'?'VERDAD ELEGIDA':'RETO ELEGIDO';
    const text=document.createElement('p');text.textContent=mode==='truth'?'Puedes inventar una pregunta o pedir una sugerencia.':'Puedes inventar un reto o pedir una sugerencia.';
    hint.replaceChildren(headline,text);
    return true;
  }
  $('choose-truth').addEventListener('click',()=>chooseMode('truth'));
  $('choose-dare').addEventListener('click',()=>chooseMode('dare'));
  const promptHistory=[];
  function suggest(mode) {
    if(!currentPair||!chooseMode(mode))return;
    if (!window.PartyPrompts) return toast('No se pudo cargar el banco de sugerencias');
    const levels=['suave','fiesta','picante','atrevido'];
    const eligible=levels.slice(0,levels.indexOf(state.level)+1);
    const options=eligible.flatMap(level=>window.PartyPrompts[level][mode]);
    const candidates=options.filter(text=>!promptHistory.includes(text));
    const pool=candidates.length?candidates:options;
    if(!pool.length)return toast('No hay sugerencias disponibles');
    const prompt=pool[U.randomInt(pool.length)];
    promptHistory.push(prompt);if(promptHistory.length>12)promptHistory.shift();
    const box=$('suggestion');const title=document.createElement('small');
    title.textContent=mode==='truth'?'♡ PREGUNTA SUGERIDA':'⚡ RETO SUGERIDO';
    const para=document.createElement('p');para.textContent=prompt;
    box.replaceChildren(title,para);
  }
  $('suggest-truth').addEventListener('click',()=>suggest('truth'));
  $('suggest-dare').addEventListener('click',()=>suggest('dare'));
  // Repaint everything once on startup; no user data is inserted as HTML.
  document.querySelectorAll('[data-level]').forEach(el=>el.classList.toggle('active',el.dataset.level===state.level));
  syncDice();renderRoulette();renderPlayers();clearRound();
})();
