import { useContext } from 'react';
import { AuthContext } from './authContextBase';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      token: null,
      loading: false,
      isAuthenticated: false,
      login: async () => {},
      register: async () => {},
      logout: () => {}
    };
  }
  return context;
}
