import { useEffect, useState } from 'react';
import { AnimatedBackground } from './AnimatedBackground';
import { SpotifyConnect } from './SpotifyConnect';
import { Button } from '@/components/ui/button';
import { X, Minimize2 } from 'lucide-react';
import { useActiveTimer } from '@/hooks/useActiveTimer';
import { useProjects } from '@/hooks/useProjects';
import { formatDuration } from '@/lib/timeTracking';

interface FocusModeProps {
  onClose: () => void;
}

type AnimationType = 'breathe' | 'pulse' | 'bounce' | 'float' | 'rotate';

const animations: Record<AnimationType, string> = {
  breathe: 'animate-pulse',
  pulse: 'animate-pulse-glow',
  bounce: 'animate-bounce',
  float: 'animate-float',
  rotate: 'animate-spin-slow'
};

export const FocusMode = ({ onClose }: FocusModeProps) => {
  const { activeTimer, elapsedTime } = useActiveTimer();
  const { projects } = useProjects();
  const [showSpotify, setShowSpotify] = useState(true);
  const [animation, setAnimation] = useState<AnimationType>('breathe');
  const [motivationalQuote, setMotivationalQuote] = useState('');

  const project = projects.find(p => p.id === activeTimer?.projectId);

  const quotes = [
    "Restez concentré, vous êtes en plein flow! 🎯",
    "Chaque minute compte, continuez comme ça! ⏱️",
    "La concentration est la clé du succès! 🔑",
    "Vous êtes en train de créer quelque chose d'incroyable! ✨",
    "Le travail en profondeur produit des résultats extraordinaires! 🚀",
    "Profitez de ce moment de pure concentration! 🧘",
    "Votre futur vous remercie pour ce travail! 💪",
    "La magie opère quand vous êtes dans la zone! 🎨"
  ];

  useEffect(() => {
    // Choisir une animation aléatoire
    const animationTypes: AnimationType[] = ['breathe', 'pulse', 'bounce', 'float', 'rotate'];
    const randomAnimation = animationTypes[Math.floor(Math.random() * animationTypes.length)];
    setAnimation(randomAnimation);

    // Choisir une citation aléatoire
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setMotivationalQuote(randomQuote);

    // Masquer Spotify après 10 secondes si l'utilisateur ne l'a pas fermé
    const spotifyTimer = setTimeout(() => {
      setShowSpotify(false);
    }, 10000);

    // Changer la citation toutes les 30 secondes
    const quoteInterval = setInterval(() => {
      const newQuote = quotes[Math.floor(Math.random() * quotes.length)];
      setMotivationalQuote(newQuote);
    }, 30000);

    return () => {
      clearTimeout(spotifyTimer);
      clearInterval(quoteInterval);
    };
  }, []);

  if (!activeTimer) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <AnimatedBackground />

      {/* Boutons de contrôle */}
      <div className="absolute top-4 right-4 flex gap-2 z-50">
        <Button
          onClick={onClose}
          variant="outline"
          size="icon"
          className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
        >
          <Minimize2 className="h-4 w-4" />
        </Button>
        <Button
          onClick={onClose}
          variant="outline"
          size="icon"
          className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 flex flex-col items-center gap-8">
        {/* Timer principal avec animation */}
        <div className="text-center space-y-6">
          <div
            className={`inline-flex items-center justify-center w-64 h-64 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 backdrop-blur-sm border-4 border-primary/30 ${animations[animation]}`}
          >
            <div className="text-center">
              <div className="text-6xl font-bold text-foreground mb-2">
                {formatDuration(elapsedTime)}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">
                Temps écoulé
              </div>
            </div>
          </div>

          {/* Informations du projet */}
          {project && (
            <div className="flex items-center justify-center gap-3 px-6 py-3 rounded-full bg-background/60 backdrop-blur-sm border border-border">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <span className="text-lg font-medium">{project.name}</span>
            </div>
          )}

          {/* Citation motivationnelle */}
          <div className="px-8 py-4 rounded-2xl bg-background/40 backdrop-blur-sm border border-border max-w-2xl">
            <p className="text-lg text-center text-foreground/80 italic">
              {motivationalQuote}
            </p>
          </div>
        </div>

        {/* Spotify Connect */}
        {showSpotify && (
          <div className="w-full max-w-2xl animate-in slide-in-from-bottom duration-500">
            <SpotifyConnect onClose={() => setShowSpotify(false)} />
          </div>
        )}

        {/* Instructions */}
        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>Le timer continue de tourner en arrière-plan</p>
          <p className="text-xs opacity-70">
            Cliquez sur <Minimize2 className="inline h-3 w-3" /> pour réduire le mode focus
          </p>
        </div>
      </div>
    </div>
  );
};
