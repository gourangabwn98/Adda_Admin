// ─── src/context/AuthContext.jsx ──────────────────────────────────────────────
import { createContext, useState } from "react";
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("addaAdmin"));
    } catch {
      return null;
    }
  });

  const login = (data) => {
    setUser(data);
    localStorage.setItem("addaAdmin", JSON.stringify(data));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("addaAdmin");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
