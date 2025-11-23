import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Music, X, ExternalLink } from 'lucide-react';

interface SpotifyConnectProps {
  onClose: () => void;
}

export const SpotifyConnect = ({ onClose }: SpotifyConnectProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Liste de playlists focus populaires
  const focusPlaylists = [
    { name: 'Deep Focus', url: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ' },
    { name: 'Peaceful Piano', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO' },
    { name: 'Instrumental Study', url: 'https://open.spotify.com/playlist/37i9dQZF1DX3PFzdbtx1Us' },
    { name: 'Lofi Beats', url: 'https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn' },
    { name: 'Ambient Relaxation', url: 'https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY' },
    { name: 'Focus Flow', url: 'https://open.spotify.com/playlist/37i9dQZF1DX0SM0LYsmbMT' }
  ];

  const handlePlayMusic = () => {
    // Choisir une playlist aléatoire
    const randomPlaylist = focusPlaylists[Math.floor(Math.random() * focusPlaylists.length)];
    window.open(randomPlaylist.url, '_blank');
    setIsPlaying(true);
  };

  return (
    <Card className="relative bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30 p-6">
      <Button
        onClick={onClose}
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 hover:bg-green-500/20"
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="flex flex-col items-center gap-4 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
            <Music className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Musique de Focus</h3>
            <p className="text-sm text-muted-foreground">
              {isPlaying ? 'Profitez de votre session!' : 'Boostez votre concentration'}
            </p>
          </div>
        </div>

        {!isPlaying && (
          <Button
            onClick={handlePlayMusic}
            className="w-full bg-green-500 hover:bg-green-600 text-white gap-2"
          >
            <Music className="h-4 w-4" />
            Lancer une playlist Focus
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}

        {isPlaying && (
          <div className="text-center space-y-2">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              Playlist lancée! 🎵
            </p>
            <p className="text-xs text-muted-foreground">
              La musique peut améliorer votre concentration de 15%
            </p>
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground">
          Les playlists s'ouvrent dans Spotify
        </p>
      </div>
    </Card>
  );
};
