import { useState } from "react";
  import { Link, useNavigate } from "react-router-dom";
  import { useUser } from "../../hooks/useUser";
  import "./Login.css";

  const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const setUser = useUser((s) => s.setUser);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("http://127.0.0.1:8000/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (res.status === 401) {
          setError("Invalid email or password");
          return;
        }
        if (!res.ok) {
          setError("Login failed. Please try again.");
          return;
        }

        const user = await res.json();
        setUser(user);
        navigate("/");
      } catch (err) {
        console.error(err);
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="auth-container">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h1>Log in</h1>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>

          {error && <div className="error-box">{error}</div>}

          <p className="auth-switch">
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </form>
      </div>
    );
  };

  export default Login;