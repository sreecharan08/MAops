"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();

  const [rollNumber, setRollNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roll_number: rollNumber,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid credentials.");
        return;
      }

      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("student", JSON.stringify(data.student));

      router.push("/dashboard");
    } catch {
      setError("Unable to connect to the server. Please check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-container">
        <div className="login-brand">
          <div className="brand-logo">MRU</div>
          <h1>Student Portal</h1>
          <p>Assignment & Report Submission System</p>
        </div>

        <div className="login-card">
          <div className="card-header">
            <h2>Welcome Back</h2>
            <p>Sign in to access your student portal</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="rollNumber">Roll Number</label>
              <input
                id="rollNumber"
                type="text"
                placeholder="Enter your roll number (e.g. 2411CS040092)"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="login-footer">
            <span>Student Assignment Portal</span>
          </div>
        </div>

        <p className="copyright">© 2026 Student Portal. All rights reserved.</p>
      </div>
    </main>
  );
}
