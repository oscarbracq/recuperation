/* ================= Changement unique du 28 novembre 2026 (v193), fait par l'appli avec la connexion d'Oscar =================
   1) La prépa muscu à venir est retirée (il la refait au propre) : les séances de salle du Coach training du 30 nov. au
      22 janv. passent en « supprimée » (même méthode que le bouton Supprimer ; une copie est gardée sur son PC).
   2) Une phrase d'objectif dans la note de 9 séances de piste du coach (une seule chose à mettre en place).
   Ne tourne qu'une fois : settings/app.mig193 = true. */
const MIG193_DEL = ["coach-2026-11-30-2lwl", "coach-2026-12-02-9smb", "coach-2026-12-04-p844", "coach-2026-12-07-gaf5", "coach-2026-12-09-rory", "coach-2026-12-11-64ik", "coach-2026-12-14-y85m", "coach-2026-12-16-v7i1", "coach-2026-12-18-58hb", "coach-2026-12-21-o10m", "coach-2026-12-23-ohcp", "coach-2026-12-25-rbi7", "coach-2026-12-28-z7hb", "coach-2026-12-30-s50d", "coach-2027-01-01-nbrs", "coach-2027-01-04-dkks", "coach-2027-01-06-2eik", "coach-2027-01-08-agyp", "coach-2027-01-11-uh4d", "coach-2027-01-13-0vqe", "coach-2027-01-15-jpue", "coach-2027-01-18-c3ly", "coach-2027-01-20-9gl7", "coach-2027-01-22-51bi"];
const MIG193_NOTE = {
"athle-2026-11-30": "Objectif : reste penché sur les 10 premiers mètres en poussant loin derrière toi. En vidéo, ton buste se redresse de 7 à 15° par appui ; la cible est 2 à 5°.",
"athle-2026-12-02": "Objectif : épaules basses et mains relâchées sur les 150 m, surtout quand la fatigue arrive. Le relâchement est ton axe n° 4, pas encore validé en vidéo.",
"athle-2026-12-04": "Objectif : sur les 20 m libres, pose le pied sous la hanche, pas devant. En accélération, tes vidéos le montrent 25 à 40 % de la jambe devant la hanche.",
"athle-2026-12-07": "Objectif : reste penché jusqu'à 10 m sur chaque départ, même sur les 30 m. 2e séance de suite avec cette consigne : redresse-toi petit à petit, pas d'un coup.",
"athle-2026-12-09": "Objectif : sur les 50 m, pied qui frappe sous la hanche et repart vite. Ta fréquence en vidéo est de 3,3 à 3,75 pas par seconde ; la cible est 3,8 à 4,4.",
"athle-2026-12-11": "Objectif : veille de compète, garde la même consigne, rien de nouveau : rester penché sur les 10 premiers mètres. À Liévin, fais filmer ton départ de côté.",
"athle-2026-12-14": "Objectif : aux blocs, épaules juste au-dessus de la ligne, pas devant. Tes vidéos les montrent 18 à 30 % du bras devant ; la cible est 15 % au plus.",
"athle-2026-12-16": "Objectif : sur les 120 m, garde les épaules basses et la mâchoire molle quand ça pique. Un buste relâché garde ta fréquence en fin de course.",
"athle-2026-12-18": "Objectif : veille de compète, même consigne que lundi : épaules au-dessus de la ligne, puis tu pousses. Rien de nouveau avant le meeting JB."
};
(function mig193() {
  const t = setInterval(async () => {
    // On attend les vraies données (réglages et séances chargés depuis le serveur), jamais les valeurs par défaut.
    if (!S.app?.updatedAt || !S.plans || !Object.keys(S.plans).length || typeof dbSet !== 'function') return;
    clearInterval(t); if (S.app.mig193) return;
    const now = new Date().toISOString(); let n = 0, m = 0;
    try {
      for (const id of MIG193_DEL) { const p = S.plans[id]; if (!p || p.deleted || p.kind === 'track') continue; const q = {...p, deleted: true, updatedAt: now}; S.plans[id] = q; await dbSet('plans/' + id, q); n++; }
      for (const [id, note] of Object.entries(MIG193_NOTE)) { const p = S.plans[id]; if (!p || p.deleted || (p.note || '').includes(note)) continue; const q = {...p, note: p.note ? note + '\n' + p.note : note, updatedAt: now}; S.plans[id] = q; await dbSet('plans/' + id, q); m++; }
      S.app = {...S.app, mig193: true}; await dbSet('settings/app', {...S.app, updatedAt: now});
      if (n || m) { toast(`Prépa muscu retirée (${n} séances) · ${m} objectifs de piste ajoutés`); try { renderMod(true); } catch (e) {} }
    } catch (e) { /* sans réseau : on réessaiera à la prochaine ouverture */ }
  }, 1500);
})();
