import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usersApi, User } from '@/lib/api';
import { toast } from 'sonner';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si un utilisateur est déjà connecté (session)
    const checkSession = async () => {
      const sessionUser = sessionStorage.getItem('currentUser');
      if (sessionUser) {
        try {
          const user: User = JSON.parse(sessionUser);
          // Vérifier que l'utilisateur existe toujours via l'API
          const dbUser = await usersApi.getById(user.id);
          if (dbUser) {
            setCurrentUser(dbUser);
          } else {
            sessionStorage.removeItem('currentUser');
          }
        } catch (error) {
          sessionStorage.removeItem('currentUser');
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const user = await usersApi.login(username, password);

      // Connexion réussie
      setCurrentUser(user);
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      toast.success(`Bienvenue ${user.username}!`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      toast.error('Nom d\'utilisateur ou mot de passe incorrect');
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('currentUser');
    toast.success('Déconnexion réussie');
  };

  const value: AuthContextType = {
    currentUser,
    isAdmin: currentUser?.role === 'admin',
    isAuthenticated: !!currentUser,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
