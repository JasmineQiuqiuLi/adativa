  import { useState } from "react";
  import { Link, useNavigate } from "react-router-dom";
  // import { useUser } from "../../hooks/useUser";
  import "./Register.css";

  const Register = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [success,setSuccess] = useState<string|null>(null);


    const navigate = useNavigate();
    // const setUser = useUser((s) => s.setUser);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("http://127.0.0.1:8000/users/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            display_name: displayName || null,
          }),
        });

        if (res.status === 409) {
          setError("Email is already registered");
          return;
        }
        if (!res.ok) {
          setError("Sign up failed. Please try again.");
          return;
        }

        setSuccess(
        "Account created successfully! Redirecting to login..."
        );

        // wait 2 seconds before navigating
        setTimeout(() => {
            navigate("/login");
        }, 2000);

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
        <h1>Sign up</h1>

        <div className="form-group">
          <label>Display name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e)=>setDisplayName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={loading}
        >
          {loading
            ? "Creating account..."
            : "Sign up"}
        </button>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {success && (
          <div className="success-box">
            {success}
          </div>
        )}

        <p className="auth-switch">
          Already have an account?
          <Link to="/login">
            Log in
          </Link>
        </p>

      </form>
    </div>
  );
};

  export default Register;