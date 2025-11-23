import { useEffect, useState } from 'react';

type BackgroundType = 'gradient' | 'particles' | 'waves' | 'dots' | 'geometric';

export const AnimatedBackground = () => {
  const [backgroundType, setBackgroundType] = useState<BackgroundType>('gradient');

  useEffect(() => {
    // Choisir un fond aléatoire
    const types: BackgroundType[] = ['gradient', 'particles', 'waves', 'dots', 'geometric'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    setBackgroundType(randomType);
  }, []);

  const renderBackground = () => {
    switch (backgroundType) {
      case 'gradient':
        return (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-blue-500/20 animate-gradient-shift" />
        );

      case 'particles':
        return (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-primary/30 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${5 + Math.random() * 10}s`
                }}
              />
            ))}
          </div>
        );

      case 'waves':
        return (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-purple-500/10" />
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-primary/20 to-transparent animate-wave" />
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-primary/10 to-transparent animate-wave-slow" />
          </div>
        );

      case 'dots':
        return (
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }}
            />
          </div>
        );

      case 'geometric':
        return (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute border-2 border-primary/20 animate-spin-slow"
                style={{
                  width: `${100 + i * 50}px`,
                  height: `${100 + i * 50}px`,
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                  borderRadius: i % 2 === 0 ? '50%' : '0',
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${10 + i * 2}s`
                }}
              />
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm">
      {renderBackground()}
    </div>
  );
};
