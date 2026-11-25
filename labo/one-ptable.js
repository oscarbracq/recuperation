/* ================= Une séance, en tableau (lecture seule) =================
   Oscar lit plus facilement un tableau qu'un texte (il est dyslexique) : quand il ouvre une séance, chaque exercice
   s'affiche comme pendant la séance en direct (une ligne par série : répétitions, charge, récup), sans rien à cocher.
   La consigne de l'exercice reste à portée, repliée sous « Consigne ». */
function planTable(p) {
  const L = itemLabels(p.items), trk = p.kind === 'track';
  const cell = v => `<span>${v == null || v === '' ? '–' : v}</span>`;
  const box = (it, i) => {
    const e = exOf(it.ex), lab = L[i] ? `<span class="exlbl">${L[i]}</span>` : '';
    let head = '', rows = '';
    if (e.t === 'test') { head = '<span>#</span><span>Essai</span>'; rows = Array.from({length: it.reps || 3}, (_, j) => `<div class="ptbr p2"><span class="n">${j + 1}</span>${cell('essai')}</div>`).join(''); }
    else if (it.min || e.u === 'min') { head = '<span></span><span>Durée</span>'; rows = `<div class="ptbr p2"><span class="n">1</span>${cell((it.min || it.reps || '') + ' min')}</div>`; }
    else if (it.seq) {
      head = '<span>#</span><span>Distances</span><span>Intensité</span><span>Récup</span>';
      rows = Array.from({length: it.blocks || 1}, (_, j) => `<div class="ptbr"><span class="n">${j + 1}</span>${cell(it.seq.join(' + ') + ' m')}${cell(it.pct ? it.pct + ' %' : '')}${cell(it.brest ? fmtRest(it.brest) : it.rest ? fmtRest(it.rest) : '')}</div>`).join('');
    } else if (e.t === 'track' || trk) {
      head = '<span>#</span><span>Distance</span><span>Intensité</span><span>Récup</span>';
      rows = Array.from({length: +it.reps || 1}, (_, j) => `<div class="ptbr"><span class="n">${j + 1}</span>${cell((it.dist || '') + ' m')}${cell(it.pct ? it.pct + ' %' : '')}${cell(it.rest ? fmtRest(it.rest) : '')}</div>`).join('');
    } else {
      const sg = suggest(it), kg = +it.kg > 0 ? fx(it.kg, 1) + ' kg' : sg?.kg ? fx(sg.kg, 1) + ' kg' : it.pct ? it.pct + ' %' : e.u === 'kg' ? '' : 'corps';
      const reps = uVal(it, it.reps);
      head = '<span>Série</span><span>Répétitions</span><span>Charge</span><span>Récup</span>';
      const nx = p.items[i + 1]?.link; // enchaîné avec le suivant : « X » = tout de suite, pas de récup
      rows = Array.from({length: +it.sets || 1}, (_, j) => `<div class="ptbr"><span class="n">${j + 1}</span>${cell(reps)}${cell(kg)}${nx ? '<span class="supx" title="Enchaîne tout de suite">X</span>' : cell(it.rest ? fmtRest(it.rest) : '')}</div>`).join('');
    }
    const sub = [it.pct && !(e.t === 'track' || trk) ? it.pct + ' % du max' : '', it.ct && it.ct !== 'iso' ? ctName(it.ct) : it.ct === 'iso' ? 'isométrique' : '', it.link ? 'enchaîné avec le précédent' : ''].filter(Boolean).join(' · ');
    return `<div class="ptab${it.link ? ' plink' : ''}"><button type="button" class="ptab-h" data-tex="${it.ex}">${lab}<b>${esc(e.n)}</b><span class="ptab-go" aria-hidden="true">›</span></button>
      ${sub ? `<p class="ptab-s">${esc(sub)}</p>` : ''}
      <div class="ptbr hd${head.split('<span').length - 1 === 2 ? ' p2' : ''}">${head}</div>${rows}
      ${it.note ? `<details class="ptab-why"><summary>Consigne</summary><p>${esc(it.note)}</p></details>` : ''}</div>`;
  };
  return `<div class="ptabs">${p.items.map(box).join('')}</div>`;
}
