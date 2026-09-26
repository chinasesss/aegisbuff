import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { GoogleGenAI } from '@google/genai';

dotenv.config();
const app = express();
const PORT = Number(process.env.PORT || 4000);
const OPENDOTA_URL = (process.env.OPENDOTA_API_URL || 'https://api.opendota.com/api').replace(/\/$/, '');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors({ origin: (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim(), credentials: true }));
app.use(express.json({ limit: '1mb' }));

const cache = new Map<string, { expires: number; data: unknown }>();
async function od<T>(endpoint: string, ttl = 60_000): Promise<T> {
  const key = endpoint;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.data as T;
  const url = new URL(`${OPENDOTA_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`);
  if (process.env.OPENDOTA_API_KEY) url.searchParams.set('api_key', process.env.OPENDOTA_API_KEY);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const r = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } });
    if (!r.ok) throw new Error(`OpenDota ${r.status}: ${await r.text()}`);
    const data = await r.json() as T;
    cache.set(key, { expires: Date.now() + ttl, data });
    return data;
  } finally { clearTimeout(timeout); }
}


const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();
const API_PUBLIC_URL = (process.env.API_PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const STEAM_COOKIE = 'aegisbuff_steam';
function sign(value: string) { return crypto.createHmac('sha256', process.env.SESSION_SECRET || 'change-me').update(value).digest('base64url'); }
function makeSession(steamId: string) { return `${steamId}.${sign(steamId)}`; }
function readSession(req: express.Request) { const raw = String(req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(`${STEAM_COOKIE}=`))?.slice(STEAM_COOKIE.length + 1); if (!raw) return null; const [steamId, sig] = raw.split('.'); if (!steamId || !sig) return null; const expected=sign(steamId); if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null; return steamId; }
app.get('/api/auth/steam', (_req, res) => {
  const params = new URLSearchParams({ 'openid.ns':'http://specs.openid.net/auth/2.0', 'openid.mode':'checkid_setup', 'openid.return_to':`${API_PUBLIC_URL}/api/auth/steam/callback`, 'openid.realm':FRONTEND_URL, 'openid.identity':'http://specs.openid.net/auth/2.0/identifier_select', 'openid.claimed_id':'http://specs.openid.net/auth/2.0/identifier_select' });
  res.redirect(`https://steamcommunity.com/openid/login?${params}`);
});
app.get('/api/auth/steam/callback', async (req, res) => {
  try {
    const params = new URLSearchParams(); for (const [k,v] of Object.entries(req.query)) if (typeof v === 'string') params.set(k,v);
    const claimed = params.get('openid.claimed_id') || '';
    const steamId = claimed.match(/\/openid\/id\/(\d+)$/)?.[1];
    if (!steamId) throw new Error('Steam OpenID response did not contain a valid SteamID.');
    params.set('openid.mode','check_authentication');
    const verify = await fetch('https://steamcommunity.com/openid/login', { method:'POST', headers:{'content-type':'application/x-www-form-urlencoded'}, body:params });
    const body = await verify.text();
    if (!body.includes('is_valid:true')) throw new Error('Steam OpenID verification failed.');
    res.setHeader('Set-Cookie', `${STEAM_COOKIE}=${makeSession(steamId)}; Path=/; HttpOnly; SameSite=Lax; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}Max-Age=604800`);
    res.redirect(FRONTEND_URL);
  } catch (e) { res.status(401).send(`Steam login failed: ${String(e)}`); }
});
app.get('/api/auth/me', async (req, res) => {
  const steamId = readSession(req); if (!steamId) return res.json({ user: null });
  try { const profile = await od<any>(`/players/${steamId}`, 10 * 60_000); res.json({ user: { id: steamId, username: profile.profile?.personaname || `Steam ${steamId}`, email:'', connectedAccountId:Number(steamId), connectedPlayerName:profile.profile?.personaname, avatarUrl:profile.profile?.avatarfull, favorites:{players:[],heroes:[],matches:[],builds:[]} } }); } catch { res.json({ user:{ id:steamId, username:`Steam ${steamId}`, email:'', connectedAccountId:Number(steamId), favorites:{players:[],heroes:[],matches:[],builds:[]} } }); }
});
app.post('/api/auth/logout', (req,res) => { res.setHeader('Set-Cookie', `${STEAM_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}`); res.json({ok:true}); });
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'aegisbuff-api', dataSource: 'OpenDota', ai: Boolean(process.env.GEMINI_API_KEY), time: new Date().toISOString() }));
app.get('/api/heroes', async (_req, res) => { try { res.json(await od('/heroStats', 15 * 60_000)); } catch (e) { res.status(502).json({ error: String(e) }); } });
app.get('/api/heroes/:id/matchups', async (req, res) => { try { res.json(await od(`/heroes/${req.params.id}/matchups`, 15 * 60_000)); } catch (e) { res.status(502).json({ error: String(e) }); } });
app.get('/api/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json([]);
  try {
    const [players, heroes] = await Promise.all([od<any[]>(`/search?q=${encodeURIComponent(q)}`, 3 * 60_000), od<any[]>('/heroStats', 15 * 60_000)]);
    const h = heroes.filter(x => x.localized_name?.toLowerCase().includes(q.toLowerCase())).slice(0, 6).map(x => ({ account_id: -x.id, personaname: x.localized_name, avatarfull: x.img }));
    res.json([...players.slice(0, 12), ...h]);
  } catch (e) { res.status(502).json({ error: String(e) }); }
});
app.get('/api/players/:id', async (req, res) => proxy(res, `/players/${req.params.id}`, 10 * 60_000));
app.get('/api/players/:id/wl', async (req, res) => proxy(res, `/players/${req.params.id}/wl`, 10 * 60_000));
app.get('/api/players/:id/matches', async (req, res) => {
  const q = new URLSearchParams();
  for (const k of ['limit','hero_id','win']) if (req.query[k] !== undefined) q.set(k, String(req.query[k]));
  proxy(res, `/players/${req.params.id}/matches?${q}`, 3 * 60_000);
});
app.get('/api/players/:id/heroes', async (req, res) => proxy(res, `/players/${req.params.id}/heroes`, 10 * 60_000));
app.get('/api/players/:id/totals', async (req, res) => proxy(res, `/players/${req.params.id}/totals`, 60 * 60_000));
app.get('/api/matches/:id', async (req, res) => proxy(res, `/matches/${req.params.id}`, 24 * 60 * 60_000));
app.get('/api/pro/matches', async (_req, res) => proxy(res, '/proMatches', 60_000));
app.get('/api/pro/players', async (_req, res) => proxy(res, '/proPlayers', 60 * 60_000));
app.get('/api/constants/:resource', async (req, res) => proxy(res, `/constants/${req.params.resource}`, 60 * 60_000));

async function proxy(res: express.Response, endpoint: string, ttl: number) { try { res.json(await od(endpoint, ttl)); } catch (e) { res.status(502).json({ error: String(e) }); } }

app.post('/api/ai/analyze', async (req, res) => {
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `You are a Dota 2 analytics assistant. Use ONLY the supplied OpenDota data. Do not invent facts, patch numbers, benchmarks, or telemetry. Return JSON with keys: summary (string), findings (string[]), recommendations (string[]). Explicitly say when data is insufficient. User query: ${String(req.body.query || '')}. Dataset: ${JSON.stringify(req.body.data).slice(0, 120000)}`;
    const response = await ai.models.generateContent({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash', contents: prompt });
    const text = response.text || '';
    const clean = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    try { return res.json(JSON.parse(clean)); } catch { return res.json({ summary: clean, findings: [], recommendations: [] }); }
  } catch (e) { res.status(502).json({ error: String(e) }); }
});

const dist = path.join(__dirname, 'dist');
app.use(express.static(dist));
app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
app.listen(PORT, () => console.log(`AegisBuff API listening on :${PORT}`));
