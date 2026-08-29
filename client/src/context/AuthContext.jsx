import { createContext, useContext, useState, useEffect, useRef } from "react";
import api from "../Utility/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined);
  const loginSetRef = useRef(false);
  const isLoggingIn = useRef(false);

  useEffect(() => {
    if (isLoggingIn.current) return;

    api.get("/auth/user")
      .then((res) => {
        if (!loginSetRef.current) {
          setUser(res.data.user || null);
        }
      })
      .catch(() => {
        if (!loginSetRef.current) {
          setUser(null);
        }
      });
  }, []);

  const setUserFromLogin = (userData) => {
    isLoggingIn.current = true;
    loginSetRef.current = true;
    setUser(userData);
    setTimeout(() => { isLoggingIn.current = false; }, 1000);
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch (_) {}
    loginSetRef.current = false;
    isLoggingIn.current = false;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser: setUserFromLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
