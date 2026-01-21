import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";

export const LoginPage: React.FC = () => {
  const {
    user,
    signInWithGoogle,
    emailSignIn,
    emailSignUp,
    resetPassword, // ✅ added
  } = useAuth();

  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null); // ✅ added

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        await emailSignIn(email, password);
      } else {
        await emailSignUp(name, email, password);
      }
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Forgot password handler
  const handleForgotPassword = async () => {
    setError(null);
    setSuccess(null);
    try {
      await resetPassword(email);
      setSuccess("Password reset email sent. Please check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    }
  };

  return (
    <div className="auth-root">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="auth-header">
          <span className="app-logo-dot large" />
          <h1>Taskflow</h1>
          <p>Smart task manager with live productivity insights.</p>
        </div>

        <div className="auth-toggle">
          <button
            className={mode === "signin" ? "auth-toggle-btn active" : "auth-toggle-btn"}
            onClick={() => setMode("signin")}
          >
            Sign in
          </button>
          <button
            className={mode === "signup" ? "auth-toggle-btn active" : "auth-toggle-btn"}
            onClick={() => setMode("signup")}
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <label className="field">
              <span>Name</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {/* ✅ Forgot Password (only in Sign In mode) */}
          {mode === "signin" && (
            <button
              type="button"
              className="forgot-password"
              onClick={handleForgotPassword}
            >
              Forgot password?
            </button>
          )}

          {error && <p className="error-text">{error}</p>}
          {success && <p className="success-text">{success}</p>}

          <button
            className="primary-button full-width"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "signin"
              ? "Sign in"
              : "Create account"}
          </button>
        </form>

        <div className="auth-divider">
          <span />
          <p>or</p>
          <span />
        </div>

        <button
          className="secondary-button full-width"
          onClick={() => signInWithGoogle()}
        >
          Continue with Google
        </button>
      </motion.div>
    </div>
  );
};
