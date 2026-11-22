/* ================= Les textes posés directement sur le fond coloré (TNR Lab d'abord) =================
   Le fond animé change de couleur (rouge vif en Training, vert, bleu) : un texte gris posé dessus, sans bloc derrière,
   disparaît par endroits (« Garmin 20:48 · Withings », « Exercices de rééquilibrage du jour »…).
   Sans ajouter de fond : ces textes passent en blanc cassé (en noir doux en mode clair) avec un halo très léger de
   la couleur opposée, qui les détache de n'importe quelle couleur derrière. Seulement dans le Lab pour l'instant
   (html.lab), pour qu'Oscar juge avant de le passer dans l'appli. */
(function oneOnBg() {
  if (!document.documentElement.classList.contains('lab')) return;
  const SEL = '.foot, .sec-label, h2 small, h2, h1 + p, p.small, p.note, p.hint, .hint, .muted, .eyebrow, .tophead small, .hm-date, .one-tipb, small';
  const opaque = el => { for (let e = el; e && e !== document.body; e = e.parentElement) { const b = getComputedStyle(e).backgroundColor, m = b.match(/rgba?\(([^)]+)\)/), a = m ? (m[1].split(',')[3] ?? 1) : 0; if (b !== 'transparent' && +a > .5) return true; if (e.classList?.contains('pane') || e.id === 'sheet') return true; } return false; };
  let T = 0;
  const run = () => { T = 0; document.querySelectorAll(SEL).forEach(el => { if (el.closest('#one-top, #one-tabs, svg, .toast, .card, .tcard, .list, .seg, button, .one-sq')) return; el.classList.toggle('onbg', !opaque(el.parentElement)); }); };
  new MutationObserver(() => { if (!T) T = setTimeout(run, 60); }).observe(document.body, {childList: true, subtree: true});
  setTimeout(run, 500);
})();
