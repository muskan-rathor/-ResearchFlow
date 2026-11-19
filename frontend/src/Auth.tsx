
import { useState } from "react";
import "./Auth.css";
import { loginUser, registerUser } from "./services/authService";
import { useAuthStore } from "./stores/authStore";

export default function Auth() {
  const login = useAuthStore((state) => state.login);

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isRegister) {
        await registerUser({ name, email, password });
        setMessage("Account created! You can now log in.");
        setIsRegister(false);
        setPassword("");
      } else {
        const result = await loginUser({ email, password });
        login(result.token, result.user);
      }
    } catch (err: unknown) {
      const errorMessage =
        typeof err === "object" && err !== null && "response" in err
          ? (err as {
              response?: { data?: { message?: string } };
            }).response?.data?.message
          : undefined;

      setError(
        errorMessage ||
          (err instanceof Error ? err.message : "Something went wrong")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-brand-icon">R</div>
        <span>ResearchFlow</span>
      </div>

      <div className="auth-card">
        <div className="auth-heading">
          <p className="auth-eyebrow">YOUR RESEARCH WORKSPACE</p>
          <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>
          <p>
            {isRegister
              ? "Start organizing and exploring your research."
              : "Sign in to continue your research journey."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <label>
              Full name
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </label>

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success">{message}</div>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : isRegister
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <div className="auth-switch">
          {isRegister ? "Already have an account?" : "New to ResearchFlow?"}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
              setMessage("");
            }}
          >
            {isRegister ? "Sign in" : "Create account"}
          </button>
        </div>
      </div>

      <p className="auth-footer">
        ResearchFlow · Your intelligent research workspace
      </p>
    </div>
  );
}
