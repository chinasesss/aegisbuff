import React, { useState, useEffect } from 'react';
import { PageRoute } from './types';
import { Header } from './components/navigation/Header';
import { MobileBottomNav } from './components/navigation/MobileBottomNav';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { StreamModal } from './components/StreamModal';
import { ReplayModal } from './components/ReplayModal';

// Dedicated Pages
import { HomePage } from './pages/HomePage';
import { PlayerProfilePage } from './pages/PlayerProfilePage';
import { MatchDetailPage } from './pages/MatchDetailPage';
import { HeroesPage } from './pages/HeroesPage';
import { HeroDetailPage } from './pages/HeroDetailPage';
import { MatchesPage } from './pages/MatchesPage';
import { RankingsPage } from './pages/RankingsPage';
import { MetaPage } from './pages/MetaPage';
import { BuildsPage } from './pages/BuildsPage';
import { EsportsPage } from './pages/EsportsPage';
import { AiCoachPage } from './pages/AiCoachPage';
import { FavoritesPage } from './pages/FavoritesPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageRoute>('home');
  const [activeAccountId, setActiveAccountId] = useState<number | null>(null);
  const [activeMatchId, setActiveMatchId] = useState<number | string | null>(null);
  const [activeHeroId, setActiveHeroId] = useState<number | null>(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isStreamOpen, setIsStreamOpen] = useState(false);
  const [activeReplayIncident, setActiveReplayIncident] = useState<{
    matchId: string;
    timestamp: string;
    title: string;
    description: string;
    imageUrl: string;
  } | null>(null);

  // Keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (page: PageRoute) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPlayer = (accountId: number) => {
    setActiveAccountId(accountId);
    setCurrentPage('player');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectMatch = (matchId: number | string) => {
    setActiveMatchId(matchId);
    setCurrentPage('match');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectHero = (heroId: number) => {
    setActiveHeroId(heroId);
    setCurrentPage('hero');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGlobalSearchSubmit = (query: string) => {
    const clean = query.trim();
    if (!clean) return;

    // Check if numeric
    if (!isNaN(Number(clean))) {
      const num = Number(clean);
      if (clean.length >= 10) {
        // Match ID
        handleSelectMatch(num);
      } else {
        // Player Account ID
        handleSelectPlayer(num);
      }
      return;
    }

    // Default: open search modal with query pre-filled
    setIsSearchOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#121317] text-[#e3e2e8] flex flex-col font-['Inter'] relative selection:bg-[#ff525b] selection:text-white">
      {/* Global Persistent Header */}
      <Header
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenStream={() => setIsStreamOpen(true)}
        onSearchSubmit={handleGlobalSearchSubmit}
      />

      {/* Main View Router */}
      <main className="flex-1 w-full pt-16 pb-16 md:pb-0 min-h-screen bg-[#0d0e12] relative bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,42,68,0.12),transparent_100%)]">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onSelectPlayer={handleSelectPlayer}
            onSelectHero={handleSelectHero}
            onSelectMatch={handleSelectMatch}
            onOpenStream={() => setIsStreamOpen(true)}
          />
        )}

        {currentPage === 'player' && activeAccountId !== null && (
          <PlayerProfilePage
            accountId={activeAccountId}
            onNavigate={handleNavigate}
            onSelectMatch={handleSelectMatch}
            onSelectHero={handleSelectHero}
          />
        )}

        {currentPage === 'players' && (
          <RankingsPage
            onNavigate={handleNavigate}
            onSelectPlayer={handleSelectPlayer}
          />
        )}

        {currentPage === 'match' && activeMatchId !== null && (
          <MatchDetailPage
            matchId={activeMatchId}
            onNavigate={handleNavigate}
            onSelectPlayer={handleSelectPlayer}
            onSelectHero={handleSelectHero}
          />
        )}

        {currentPage === 'matches' && (
          <MatchesPage
            onNavigate={handleNavigate}
            onSelectMatch={handleSelectMatch}
            onOpenStream={() => setIsStreamOpen(true)}
          />
        )}

        {currentPage === 'heroes' && (
          <HeroesPage
            onNavigate={handleNavigate}
            onSelectHero={handleSelectHero}
          />
        )}

        {currentPage === 'hero' && activeHeroId !== null && (
          <HeroDetailPage
            heroId={activeHeroId}
            onNavigate={handleNavigate}
            onSelectHero={handleSelectHero}
          />
        )}

        {currentPage === 'rankings' && (
          <RankingsPage
            onNavigate={handleNavigate}
            onSelectPlayer={handleSelectPlayer}
          />
        )}

        {currentPage === 'meta' && (
          <MetaPage
            onNavigate={handleNavigate}
            onSelectHero={handleSelectHero}
          />
        )}

        {currentPage === 'builds' && (
          <BuildsPage
            onNavigate={handleNavigate}
            onSelectHero={handleSelectHero}
          />
        )}

        {currentPage === 'esports' && (
          <EsportsPage
            onNavigate={handleNavigate}
            onSelectMatch={handleSelectMatch}
            onOpenStream={() => setIsStreamOpen(true)}
          />
        )}

        {currentPage === 'ai-coach' && (
          <AiCoachPage
            onNavigate={handleNavigate}
            onSelectHero={handleSelectHero}
            onOpenReplay={(inc) => setActiveReplayIncident(inc)}
          />
        )}

        {currentPage === 'favorites' && (
          <FavoritesPage
            onNavigate={handleNavigate}
            onSelectPlayer={handleSelectPlayer}
            onSelectMatch={handleSelectMatch}
            onSelectHero={handleSelectHero}
          />
        )}
      </main>

      {/* Global Persistent Footer */}
      <Footer onNavigate={handleNavigate as any} />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Interactive Global Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectHero={(heroId) => handleSelectHero(Number(heroId))}
        onSelectPlayer={(accountId) => handleSelectPlayer(Number(accountId))}
        onSelectMatch={(matchId) => handleSelectMatch(matchId)}
      />

      <StreamModal
        isOpen={isStreamOpen}
        onClose={() => setIsStreamOpen(false)}
        onInspectMatch={() => { setIsStreamOpen(false); handleNavigate('esports'); }}
      />

      <ReplayModal
        incident={activeReplayIncident}
        onClose={() => setActiveReplayIncident(null)}
      />
    </div>
  );
}
