import { createContext, useContext, useState, useEffect, useRef } from "react";
import api from "../Utility/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined);
  const loginSetRef = useRef(false); // track if login already set the user

  useEffect(() => {
    api.get("/auth/user")
      .then((res) => {
        // Only set from API if login hasn't already set the user
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
    loginSetRef.current = true;
    setUser(userData);
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch (_) {}
    loginSetRef.current = false;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser: setUserFromLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
