import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { dotaService } from '../services/dotaService';
import { PageRoute, PlayerProfileData } from '../types/index';
import { SkeletonCard } from '../components/common/SkeletonLoader';

interface FavoritesPageProps {
  onNavigate: (page: PageRoute) => void;
  onSelectPlayer: (accountId: number) => void;
  onSelectMatch: (matchId: number) => void;
  onSelectHero: (heroId: number) => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  onNavigate: _onNavigate,
  onSelectPlayer,
  onSelectMatch,
  onSelectHero: _onSelectHero,
}) => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [favoritePlayers, setFavoritePlayers] = useState<PlayerProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [steamInput, setSteamInput] = useState('');
  const [connectMessage, setConnectMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);

    if (!currentUser) { setFavoritePlayers([]); setLoading(false); return; }
    const playerIds = currentUser.favorites.players;
    try {
      const results = await Promise.all(
        playerIds.map((id: number) => dotaService.getPlayer(id).catch(() => null))
      );
      setFavoritePlayers(results.filter((p: any): p is PlayerProfileData => p !== null));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLinkAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!steamInput.trim()) return;
    const accountId = Number(steamInput.trim());
    if (isNaN(accountId)) {
      setConnectMessage('Please enter a valid numeric Dota 2 Account ID or Steam 32-bit ID.');
      return;
    }

    const linked = authService.connectSteamAccount(accountId, `Player #${accountId}`);
    setUser(authService.getCurrentUser());
    setConnectMessage(linked ? `Linked OpenDota Account ID #${accountId}.` : 'Sign in with Steam before linking an account.');
    setSteamInput('');
  };

  const handleRemovePlayer = (id: number) => {
    authService.toggleFavoritePlayer(id);
    setFavoritePlayers((prev) => prev.filter((p) => p.profile.account_id !== id));
  };

  const handleRemoveMatch = (id: number) => {
    authService.toggleFavoriteMatch(id);
    setUser(authService.getCurrentUser());
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
      {/* Banner */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-[#ff525b] animate-pulse" />
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#ff525b]">
            Personal Command Station
          </span>
        </div>
        <h1 className="font-['Space_Grotesk'] text-3xl md:text-5xl font-black text-white tracking-tight">
          WATCHLIST & FAVORITES
        </h1>
        <p className="text-sm text-[#8b8a91] mt-1 max-w-xl">
          Quickly monitor bookmarked competitors, saved tactical replays, and sync your personal Dota 2 account ID for rapid coaching.
        </p>
      </div>

      {/* Steam Account Sync Box */}
      <div className="bg-[#15161a] rounded-2xl border border-white/[0.08] p-6 lg:p-8 mb-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-['Space_Grotesk'] text-xl font-bold text-white">
                Dota 2 Account Telemetry Link
              </h2>
              {user?.connectedAccountId && (
                <span className="px-2 py-0.5 rounded bg-[#00e676]/20 text-[#00e676] text-xs font-mono font-bold">
                  LINKED
                </span>
              )}
            </div>
            <p className="text-xs text-[#8b8a91] max-w-lg">
              {user?.connectedAccountId
                ? `Active account linked: #${user?.connectedAccountId}. All searches and AI coach analysis calibrate to your match data by default.`
                : 'Sign in with Steam to keep favorites associated with your account.'}
            </p>
          </div>

          <form onSubmit={handleLinkAccount} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter OpenDota Account ID"
              value={steamInput}
              onChange={(e) => setSteamInput(e.target.value)}
              className="w-56 bg-[#1a1b20] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-[#e3e2e8] placeholder-[#77767d] focus:outline-none focus:border-[#ff525b]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#ff525b] hover:bg-[#ba1a1a] rounded-xl text-xs font-mono font-bold text-white transition-colors cursor-pointer"
            >
              {user?.connectedAccountId ? 'Update ID' : 'Link Profile'}
            </button>
          </form>
        </div>

        {connectMessage && (
          <div className="mt-4 p-3 rounded-lg bg-[#00e676]/10 border border-[#00e676]/30 text-xs font-mono text-[#00e676]">
            {connectMessage}
          </div>
        )}
      </div>

      {/* Grid: Pinned Players & Bookmarked Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pinned Competitors */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00e676]" />
              Tracked Competitors ({favoritePlayers.length})
            </h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              <SkeletonCard className="h-20" />
              <SkeletonCard className="h-20" />
            </div>
          ) : favoritePlayers.length === 0 ? (
            <div className="bg-[#15161a] p-8 rounded-2xl border border-white/[0.04] text-center">
              <p className="text-sm text-[#8b8a91]">No players pinned yet.</p>
              <p className="text-xs text-[#77767d] mt-1">
                Visit any player profile (or search Satanic, Yatoro, Miracle) and click &quot;Watchlist&quot; to pin them here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {favoritePlayers.map((player) => (
                <div
                  key={player.profile.account_id}
                  className="p-4 bg-[#15161a] hover:bg-[#1a1b20] border border-white/[0.06] rounded-xl flex items-center justify-between gap-4 transition-all"
                >
                  <div
                    onClick={() => onSelectPlayer(player.profile.account_id)}
                    className="flex items-center gap-3.5 cursor-pointer flex-1 min-w-0"
                  >
                    <img
                      src={player.profile.avatarfull}
                      alt={player.profile.personaname}
                      className="w-12 h-12 rounded-xl object-cover border border-white/[0.08]"
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-white block truncate">
                        {player.profile.personaname}
                      </span>
                      <span className="text-xs font-mono text-[#00e676]">
                        {player.leaderboard_rank
                          ? `Rank #${player.leaderboard_rank} Immortal`
                          : player.mmr_estimate?.estimate
                          ? `${player.mmr_estimate.estimate.toLocaleString()} MMR`
                          : 'Immortal'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectPlayer(player.profile.account_id)}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-mono text-white transition-colors cursor-pointer"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => handleRemovePlayer(player.profile.account_id)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-[#ff525b] text-xs font-mono transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bookmarked Matches */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ffc640]" />
              Saved Match Replays ({user?.favorites.matches || [].length})
            </h3>
          </div>

          {user?.favorites.matches || [].length === 0 ? (
            <div className="bg-[#15161a] p-8 rounded-2xl border border-white/[0.04] text-center">
              <p className="text-sm text-[#8b8a91]">No matches bookmarked yet.</p>
              <p className="text-xs text-[#77767d] mt-1">
                Open any real match from the match list and bookmark it for later review.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {user?.favorites.matches || [].map((matchId: number) => (
                <div
                  key={matchId}
                  className="p-4 bg-[#15161a] hover:bg-[#1a1b20] border border-white/[0.06] rounded-xl flex items-center justify-between gap-4 transition-all"
                >
                  <div
                    onClick={() => onSelectMatch(matchId)}
                    className="cursor-pointer flex-1 min-w-0"
                  >
                    <span className="font-bold text-sm text-white block">
                      Match ID #{matchId}
                    </span>
                    <span className="text-xs font-mono text-[#ffc640]">
                      Replay Telemetry Saved
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectMatch(matchId)}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-mono text-white transition-colors cursor-pointer"
                    >
                      Inspect Replay
                    </button>
                    <button
                      onClick={() => handleRemoveMatch(matchId)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-[#ff525b] text-xs font-mono transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
