import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db, User } from '@/lib/db';
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

// Fonction de hachage (doit être la même que dans db.ts)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

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
          // Vérifier que l'utilisateur existe toujours dans la DB
          const dbUser = await db.users.get(user.id);
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
      const hashedPassword = await hashPassword(password);
      const user = await db.users.where('username').equals(username).first();

      if (!user) {
        toast.error('Nom d\'utilisateur ou mot de passe incorrect');
        return false;
      }

      if (user.password !== hashedPassword) {
        toast.error('Nom d\'utilisateur ou mot de passe incorrect');
        return false;
      }

      // Connexion réussie
      setCurrentUser(user);
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      toast.success(`Bienvenue ${user.username}!`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      toast.error('Erreur lors de la connexion');
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
