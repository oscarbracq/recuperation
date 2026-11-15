// TNR Athletics — « Coach IA » : la discussion dans l'appli.
// L'appli envoie la conversation + un résumé complet de ses données (forme, sommeil, VFC, séances, repas, programme…).
// Cette fonction vérifie que c'est bien Oscar (sa session), puis interroge Claude et renvoie la réponse.
// La clé Anthropic reste ici, côté serveur : secret ANTHROPIC_API_KEY à ajouter dans Supabase (Edge Functions › Secrets).
// deno-lint-ignore-file no-explicit-any
import { createClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk';

const OWNER = 'oscarbracq@yahoo.com';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const serverKey = () => {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacy) return legacy;
  const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
  return keys.default || Object.values(keys)[0] as string;
};
const db = createClient(Deno.env.get('SUPABASE_URL')!, serverKey(), {auth: {persistSession: false}});
const claude = new Anthropic(); // lit ANTHROPIC_API_KEY
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), {status, headers: {...CORS, 'Content-Type': 'application/json'}});

// Consignes fixes : en premier, pour que la mise en cache fonctionne d'une question à l'autre.
const RULES = `Tu es le coach intégré à TNR Athletics, l'appli d'Oscar : sprinteur qui vise le haut niveau et coach lui-même.
Tu connais toutes ses données, fournies ci-dessous (export de l'appli, à jour au moment de la question). Appuie-toi dessus : cite les dates et les chiffres exacts, compare à ses propres moyennes et à ses bases, relie sommeil, VFC, charge, douleurs, alimentation et séances.
Réponds en français simple, sans jargon anglais. Va droit au but : la réponse d'abord, puis l'explication courte, puis ce qu'il peut faire concrètement (jour par jour ou heure par heure s'il le demande).
Si une donnée manque, dis-le au lieu d'inventer. Pour une douleur forte ou un signe inquiétant, conseille un professionnel de santé.`;

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', {headers: CORS});
  if (req.method !== 'POST') return json({error: 'POST attendu'}, 405);
  const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const {data} = jwt ? await db.auth.getUser(jwt) : {data: {user: null}};
  if (data.user?.email !== OWNER) return json({error: 'Réservé au propriétaire de l\'appli'}, 401);
  if (!Deno.env.get('ANTHROPIC_API_KEY')) return json({error: 'Clé Anthropic absente : ajoute le secret ANTHROPIC_API_KEY dans Supabase.'}, 500);

  let body: any; try { body = await req.json(); } catch { return json({error: 'Requête illisible'}, 400); }
  const context = String(body.context || '').slice(0, 400_000);
  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m: any) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-30).map((m: any) => ({role: m.role, content: m.content.slice(0, 8000)}));
  if (!messages.length || messages.at(-1).role !== 'user') return json({error: 'Pas de question'}, 400);

  try {
    const r: any = await claude.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      output_config: {effort: 'medium'},
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [
        {type: 'text', text: RULES},
        // Les données changent rarement pendant une discussion : elles sont mises en cache (moins cher, plus rapide).
        {type: 'text', text: 'DONNÉES DE L\'APPLI\n' + context, cache_control: {type: 'ephemeral'}}
      ],
      messages
    } as any);
    if (r.stop_reason === 'refusal') return json({text: 'Je ne peux pas répondre à cette question. Reformule-la autrement.', stop: 'refusal'});
    const text = (r.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n').trim();
    return json({text: text || '(réponse vide)', stop: r.stop_reason, usage: r.usage});
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return json({error: 'Clé Anthropic refusée : vérifie le secret ANTHROPIC_API_KEY.'}, 500);
    if (e instanceof Anthropic.RateLimitError) return json({error: 'Trop de questions d\'un coup : réessaie dans une minute.'}, 429);
    if (e instanceof Anthropic.APIError) return json({error: `Claude indisponible (${e.status}). Réessaie plus tard.`}, 502);
    return json({error: 'Erreur : ' + String((e as Error)?.message || e)}, 500);
  }
});
