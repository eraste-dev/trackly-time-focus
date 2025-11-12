import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  details?: string;
}

export const LoadingScreen = ({ message = 'Chargement...', details }: LoadingScreenProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 p-8">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-2xl">
            <Loader2 className="h-10 w-10 text-white animate-spin" />
          </div>
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            {message}
          </h2>
          {details && (
            <p className="text-sm text-muted-foreground max-w-md">
              {details}
            </p>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};
