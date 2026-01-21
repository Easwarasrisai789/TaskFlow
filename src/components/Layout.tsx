import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";

type LayoutProps = {
  title?: string;
  children: React.ReactNode;
  rightActions?: React.ReactNode;
};

export const Layout: React.FC<LayoutProps> = ({
  title = "Taskflow",
  children,
  rightActions,
}) => {
  const { user, logout } = useAuth();

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-left">
          <span className="app-logo-dot" />
          <h1>{title}</h1>
        </div>
        <div className="app-header-center">{rightActions}</div>
        <div className="app-header-right">
          {user && (
            <>
              <div className="user-chip">
                {user.photoURL && (
                  <img src={user.photoURL} alt={user.displayName || ""} />
                )}
                <div>
                  <span className="user-name">
                    {user.displayName || user.email}
                  </span>
                  <span className="user-email">{user.email}</span>
                </div>
              </div>
              <button className="secondary-button" onClick={logout}>
                Logout
              </button>
            </>
          )}
        </div>
      </header>
      <motion.main
        className="app-main"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25 }}
      >
        {children}
      </motion.main>
    </div>
  );
};


