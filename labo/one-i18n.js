/* ================= TNR · English version =================
   Paramètres › Langue de l'appli. « Français » (the default) is the app exactly as written: this file then does nothing.
   « English » translates everything the app shows, after it is drawn, without touching the code that draws it:
   · a table French → English (labo/one-i18n-en.js, I18N_EN), one entry per text the code can write. An entry with {}
     is a sentence with holes (numbers, names): "Nuit courte ({} h) : va te coucher tôt ce soir." The English side
     may reorder the holes with {1} {2}…;
   · a MutationObserver (like oneTips in one.js) translates each text node and the placeholder / aria-label / title /
     data-tip attributes as soon as they appear or change; the French original stays on the node, so going back to
     Français puts every text back as it was;
   · dates and numbers: toLocaleDateString / toLocaleString with 'fr-FR' answer in 'en-GB';
   · confirm() and the tab title too.
   To find texts added to the app since the table was written: python -I labo/i18n-missing.py */
(() => {
  const ON = () => S.lang === 'en';
  // Before this file, S.lang was always saved as 'en' (it only renamed the three parts). Start everyone in French once.
  try { if (localStorage.getItem('tnr-lang-v2') !== '1') { S.lang = 'fr'; saveUi(); localStorage.setItem('tnr-lang-v2', '1'); } } catch (e) {}

  const norm = s => s.replace(/\s+/g, ' ').trim();
  const EXACT = new Map(), PATS = [], SUBS = [], FIRST = new Map();
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const LETTER = /[\p{L}\p{N}]/u;
  const EDGE = '([^.!?:;]{0,40}?)';
  for (const [fr0, en] of Object.entries(I18N_EN)) {
    const fr = norm(fr0);
    if (!fr.includes('{}')) { EXACT.set(fr, en); continue; }
    const parts = fr.split('{}');
    // The extraction dropped holes at both ends ("{} kcal" became "kcal…"): accept a number or a sign there.
    // A hole at either end holds a short value (a number, a name), never a whole other sentence.
    const hole = i => (i === 1 && !parts[0]) || (i === parts.length - 1 && !parts[i]) ? EDGE : '(.*?)';
    PATS.push({re: new RegExp('^([^\\p{L}]*?)' + parts.map((p, i) => (i ? hole(i) : '') + esc(p)).join('') + '([^\\p{L}]*?)$', 'su'), en, wrap: true});
    // When a hole holds HTML (a number in bold…), the sentence is cut into several text nodes: each node is a run
    // of pieces between two holes. Learn every such run, as long as the English keeps the holes in the same order.
    if (!/\{\d\}/.test(en)) {
      const ep = en.split('{}');
      if (ep.length === parts.length) {
        parts.forEach((p, i) => { const a = norm(p), b = ep[i].trim(); if (a.length > 2 && LETTER.test(a) && !EXACT.has(a)) EXACT.set(a, b); });
        // A run may also start or end with the text of a hole (a number glued to the next words).
        for (let a = 0; a < parts.length; a++) for (let b = a + 1; b < parts.length; b++) {
          const fp = parts.slice(a, b + 1), e = ep.slice(a, b + 1);
          SUBS.push({re: new RegExp('^' + EDGE + fp.map(esc).join('(.*?)') + EDGE + '$', 's'), en: '{}' + e.join('{}') + '{}'});
        }
      }
    }
  }
  // The most specific sentences first: "{} sur {}" must not swallow a longer sentence that has its own entry.
  const stat = p => (p.re.source.replace(/\(\.\*\?\)|\(\[\^\\p\{L\}\]\*\?\)/g, '').match(/\p{L}/gu) || []).length;
  for (const L of [PATS, SUBS]) { for (let i = L.length - 1; i >= 0; i--) if (stat(L[i]) < (L === SUBS ? 8 : 3)) L.splice(i, 1); L.sort((a, b) => stat(b) - stat(a)); }
  // Fragments: a text glued from several known pieces ('Poids : ' + x + ' kg') is translated piece by piece.
  // A single word is only replaced inside a longer text when it is long enough and spelled the same way (no "plus" → "More").
  for (const k of EXACT.keys()) {
    if (k.length < 3 || (!/\s/.test(k) && !/^\p{Lu}/u.test(k) && k.length < 5)) continue;
    const m = k.match(/^[\p{L}\p{N}]+/u); if (!m) continue;
    const w = m[0].toLowerCase(); (FIRST.get(w) || FIRST.set(w, []).get(w)).push(k);
  }
  for (const a of FIRST.values()) a.sort((x, y) => y.length - x.length);
  const SORTED = [...EXACT.keys()].sort();

  const CACHE = new Map();
  const fixNum = s => s.replace(/(\d),(\d)/g, '$1.$2');
  // Little French words left between translated pieces (lists joined with " et ", "le" before a date…).
  const POST = s => s.replace(/ et (?=[\p{L}\d])/gu, ' and ').replace(/ ou (?=[\p{L}\d])/gu, ' or ').replace(/, mais /g, ', but ')
    .replace(/\ble (?=(Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day|\d)/g, 'on ').replace(/\bdu (?=\d)/g, 'from ').replace(/ au (?=\d)/g, ' to ').replace(/(\d) sur (?=\d)/g, '$1 of ');
  function frag(s) {
    let out = '', cur = 0, hit = false; const re = /[\p{L}\p{N}]+/gu; let m;
    while ((m = re.exec(s))) {
      if (m.index > 0 && LETTER.test(s[m.index - 1])) continue;
      const c = FIRST.get(m[0].toLowerCase()); if (!c) continue;
      for (const k of c) {
        const piece = s.substr(m.index, k.length);
        if (/\s/.test(k) ? piece.toLowerCase() !== k.toLowerCase() : piece !== k) continue;
        if (LETTER.test(s[m.index + k.length] || '') && LETTER.test(k[k.length - 1])) continue;
        let en = EXACT.get(k);
        if (s[m.index] !== k[0] && s[m.index] === s[m.index].toUpperCase()) en = en.charAt(0).toUpperCase() + en.slice(1);
        out += s.slice(cur, m.index) + en; cur = m.index + k.length; re.lastIndex = cur; hit = true; break;
      }
    }
    return hit ? out + s.slice(cur) : s;
  }
  function tr(s0, deep = 0) {
    const s = norm(s0); if (!s || !/[A-Za-zÀ-ÿ]/.test(s)) return s0;
    if (CACHE.has(s)) return CACHE.get(s);
    let r = EXACT.get(s);
    if (r == null) {
      // A sentence that ends with its own punctuation may come without it, or the other way round.
      const m = s.match(/^(.*?)([\s.:…!?]*)$/s);
      if (m && m[2] && EXACT.has(m[1])) r = EXACT.get(m[1]) + m[2];
    }
    if (r == null) {
      // A number glued in front or behind: "47 % de la note", "Séance 3".
      const m = s.match(/^([\d\s.,+−-]*)(.*?)([\s\d.,+−-]*)$/s);
      if (m && (m[1] || m[3]) && EXACT.has(m[2])) r = m[1] + EXACT.get(m[2]) + m[3];
    }
    if (r == null && deep < 3) {
      // A name followed by a known ending: "Back squat, la bonne technique", "Fer : sous 30".
      for (const x of s.matchAll(/[,:(·]/g)) { const tail = s.slice(x.index).trim(); if (x.index && EXACT.has(tail)) { const sep = s.slice(0, x.index).match(/\s*$/)[0]; r = tr(s.slice(0, x.index).trimEnd(), deep + 1) + sep + EXACT.get(tail); break; } }
    }
    for (const L of [PATS]) {
      if (r != null) break;
      for (const p of L) {
        const m = s.match(p.re); if (!m) continue;
        let g = m.slice(1).map(x => deep < 3 && x ? tr(x, deep + 1) : x), lead = '', trail = '';
        if (p.wrap) { lead = g[0]; trail = g[g.length - 1]; g = g.slice(1, -1); }
        let i = 0; r = lead + p.en.replace(/\{(\d?)\}/g, (_, d) => d ? g[+d - 1] ?? '' : g[i++] ?? '') + trail;
        break;
      }
    }
    // "Barre · Dos", "20 min · Rouleau · Assis, rouleau…": each part on its own.
    if (r == null && deep < 3 && s.includes(' · ')) { const ss = s.split(' · '); r = ss.map(x => tr(x, deep + 1)).join(' · '); }
    // A description cut short with "…": find the full text it starts with, and cut the English the same way.
    if (r == null && /…$/.test(s) && s.length > 12) {
      const p = s.slice(0, -1).trimEnd(); let lo = 0, hi = SORTED.length;
      while (lo < hi) { const mid = (lo + hi) >> 1; SORTED[mid] < p ? lo = mid + 1 : hi = mid; }
      const k = SORTED[lo]; if (k && k.startsWith(p)) { const en = EXACT.get(k); r = en.length <= p.length + 3 ? en : en.slice(0, p.length).replace(/\s+\S*$/, '') + '…'; }
    }
    // Several sentences glued in one text: one by one.
    if (r == null && deep < 3) { const ss = s.split(/(?<=[.!?])\s+(?=\p{Lu}|\d)/u); if (ss.length > 1) r = ss.map(x => tr(x, deep + 1)).join(' '); }
    for (const L of [SUBS]) {
      if (r != null) break;
      for (const p of L) {
        const m = s.match(p.re); if (!m) continue;
        let g = m.slice(1).map(x => deep < 3 && x ? tr(x, deep + 1) : x), lead = '', trail = '';
        if (p.wrap) { lead = g[0]; trail = g[g.length - 1]; g = g.slice(1, -1); }
        let i = 0; r = lead + p.en.replace(/\{(\d?)\}/g, (_, d) => d ? g[+d - 1] ?? '' : g[i++] ?? '') + trail;
        break;
      }
    }
    if (r == null) r = frag(s);
    r = POST(fixNum(r));
    if (CACHE.size > 20000) CACHE.clear();
    CACHE.set(s, r);
    return r;
  }
  window.tnrTr = tr;

  const ATTRS = ['placeholder', 'aria-label', 'title', 'data-tip'];
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'NOSCRIPT']);
  const skipEl = el => !el || SKIP.has(el.nodeName) || el.isContentEditable || el.closest?.('[data-noi18n]');
  function doText(n) {
    if (skipEl(n.parentNode)) return;
    const v = n.data; if (v === n.__en) return;
    const t = tr(v); n.__fr = v;
    if (t === v || norm(t) === norm(v)) { n.__en = v; return; }
    const lead = v.match(/^\s*/)[0], trail = v.match(/\s*$/)[0];
    n.__en = lead + t.trim() + trail; n.data = n.__en;
  }
  function doAttrs(el) {
    if (skipEl(el)) return;
    for (const a of ATTRS) {
      const v = el.getAttribute(a); if (v == null || (el.__ena && el.__ena[a] === v)) continue;
      const t = tr(v); if (t === v) continue;
      (el.__fra ||= {})[a] = v; (el.__ena ||= {})[a] = t; el.setAttribute(a, t);
    }
    if (el.nodeName === 'INPUT' && /^(button|submit)$/.test(el.type) && el.value && el.value !== el.__env) { el.__frv = el.value; el.value = el.__env = tr(el.value); }
  }
  function walk(root) {
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1 || skipEl(root)) return;
    doAttrs(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {acceptNode: n => n.nodeType === 1 && SKIP.has(n.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT});
    const one = []; let n;
    while ((n = w.nextNode())) { if (n.nodeType !== 3) { doAttrs(n); continue; } doText(n); if (/^\s*[LMJVSD]\s*$/.test(n.data)) one.push(n); }
    if (one.length >= 7) dow(one);
    for (const t of one) if (!t.__dow) dayCell(t);
  }
  // A day initial inside a calendar cell that carries its date ("J 26" with data-bday="2026-11-26").
  function dayCell(t) {
    let e = t.parentElement;
    for (let i = 0; e && i < 3; i++, e = e.parentElement) {
      const a = [...e.attributes].find(x => /^\d{4}-\d{2}-\d{2}$/.test(x.value)); if (!a) continue;
      const d = new Date(a.value + 'T12:00:00').getDay();
      if (t.data.trim() === 'DLMMJVS'[d]) { t.__dow = true; t.__fr = t.data; t.__en = t.data.replace(/\S/, 'SMTWTFS'[d]); t.data = t.__en; }
      return;
    }
  }
  // Week rows written as single letters (L M M J V S D): two M's, so they are read as a row, never one by one.
  function dow(nodes) {
    for (const up of [1, 2]) {
      const g = new Map();
      for (const t of nodes) { let p = t.parentNode; for (let i = 1; i < up && p; i++) p = p.parentNode; (g.get(p) || g.set(p, []).get(p)).push(t); }
      for (const row of g.values()) {
        if (row.length < 7 || row.some(t => t.__dow)) continue;
        const s = row.map(t => t.data.trim()).join(''), i0 = 'LMMJVSDLMMJVSD'.indexOf(s.slice(0, 7));
        if (i0 < 0 || ![...s].every((c, i) => c === 'LMMJVSD'[(i0 + i) % 7])) continue;
        row.forEach((t, i) => { t.__dow = true; t.__fr = t.data; t.__en = t.data.replace(/\S/, 'MTWTFSS'[(i0 + i) % 7]); t.data = t.__en; });
      }
    }
  }
  const mo = new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === 'childList') m.addedNodes.forEach(walk);
      else if (m.type === 'characterData') doText(m.target);
      else if (m.type === 'attributes') doAttrs(m.target);
    }
  });
  let title0 = null;
  function start() {
    document.documentElement.lang = 'en';
    walk(document.body);
    title0 = document.title; document.title = tr(document.title);
    mo.observe(document.body, {childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS});
  }
  function stop() {
    mo.disconnect();
    document.documentElement.lang = 'fr';
    if (title0 != null) document.title = title0;
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) {
      if (n.nodeType === 3) { if (n.__fr != null && n.data === n.__en) n.data = n.__fr; n.__fr = n.__en = n.__dow = undefined; continue; }
      if (n.__fra) for (const [a, v] of Object.entries(n.__fra)) if (n.getAttribute(a) === n.__ena[a]) n.setAttribute(a, v);
      n.__fra = n.__ena = undefined;
      if (n.__frv != null && n.value === n.__env) n.value = n.__frv;
    }
  }

  // Dates and numbers in English when the app asks for French.
  const loc = l => ON() && (l == null || /^fr/i.test(String(l))) ? 'en-GB' : l;
  for (const k of ['toLocaleDateString', 'toLocaleTimeString', 'toLocaleString']) {
    const f = Date.prototype[k]; Date.prototype[k] = function (l, o) { return f.call(this, loc(l), o); };
  }
  { const f = Number.prototype.toLocaleString;
    // No thousands comma in English: the app reads some of these numbers back from its own fields.
    Number.prototype.toLocaleString = function (l, o) { return ON() && loc(l) !== l ? f.call(this, 'en-GB', {...(o || {}), useGrouping: false}) : f.call(this, l, o); }; }
  { const f = window.confirm; window.confirm = m => f.call(window, ON() ? tr(String(m)) : m); }

  let was = false;
  function apply() { const on = ON(); if (on === was) return; was = on; on ? start() : stop(); }
  // The app's own click handler changes S.lang and redraws; follow it right after.
  document.addEventListener('click', e => { if (e.target.closest?.('[data-hlang]')) setTimeout(apply, 0); }, true);
  document.addEventListener('click', e => { if (e.target.closest?.('[data-hlang]')) apply(); });
  apply();
})();
