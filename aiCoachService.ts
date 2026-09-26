import { PlayerHeroStat, PlayerMatchSummary, PlayerProfileData } from '../types';
import { dotaService } from './dotaService';

export interface AiCoachAnalysisResult {
  question: string;
  factualData: string[];
  aiAnalysis: string[];
  actionableAdvice: string[];
  keyMetric: { label: string; value: string; delta?: string; positive?: boolean };
}

export async function generateCoachAnalysis(query: string, profile: PlayerProfileData | null, matches: PlayerMatchSummary[], heroes: PlayerHeroStat[]): Promise<AiCoachAnalysisResult> {
  const sample = matches.slice(0, 20);
  const wins = sample.filter(m => (m.player_slot < 128) === Boolean(m.radiant_win)).length;
  const wr = sample.length ? (wins / sample.length) * 100 : 0;
  const deaths = sample.length ? sample.reduce((a, m) => a + (m.deaths || 0), 0) / sample.length : 0;
  const qualified = heroes.filter(h => h.games >= 5).sort((a,b) => b.win / b.games - a.win / a.games);
  const top = qualified[0];
  const factual = [
    `Account: ${profile?.profile?.personaname || 'Unknown'} (#${profile?.profile?.account_id || 'unknown'}).`,
    `OpenDota returned ${sample.length} recent matches for this analysis.`,
    `Observed sample: ${wins} wins / ${sample.length - wins} losses (${wr.toFixed(1)}% win rate).`,
    `Average deaths in the sample: ${deaths.toFixed(1)}.`,
    top ? `Highest recorded hero win rate among heroes with at least 5 games: hero #${top.hero_id}, ${top.win}/${top.games} (${(top.win/top.games*100).toFixed(1)}%).` : 'No hero has enough recorded games for a 5-game comparison.'
  ];
  try {
    const ai = await dotaService.getAiAnalysis({ query, data: { profile, matches: sample, heroes } });
    return {
      question: query, factualData: factual,
      aiAnalysis: Array.isArray(ai.findings) ? ai.findings : [ai.summary || 'No AI finding returned.'],
      actionableAdvice: Array.isArray(ai.recommendations) ? ai.recommendations : [],
      keyMetric: { label: 'RECENT SAMPLE WIN RATE', value: `${wr.toFixed(1)}%`, delta: `${wins}W - ${sample.length-wins}L`, positive: wr >= 50 }
    };
  } catch {
    return { question: query, factualData: factual, aiAnalysis: ['Gemini analysis is unavailable or not configured. The figures above are direct OpenDota-derived measurements.'], actionableAdvice: [], keyMetric: { label: 'RECENT SAMPLE WIN RATE', value: `${wr.toFixed(1)}%`, delta: `${wins}W - ${sample.length-wins}L`, positive: wr >= 50 } };
  }
}
