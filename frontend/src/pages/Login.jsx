import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    if (!email || !password) {
      alert("Please fill in both email and password.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      alert("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      alert(error.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300 relative">
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-bold flex items-center gap-2 transition-colors"
      >
        ← Back to Home
      </button>

      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 w-full max-w-md transition-colors">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          🛡️ CyberGuard AI
        </h1>

        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
          Login to your account
        </p>

        <div className="space-y-4">
          <input
            type="email"
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 p-3 rounded-lg"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 p-3 rounded-lg"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={login}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-lg font-bold transition-colors"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>

        <p className="text-center mt-6 text-gray-600 dark:text-gray-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 dark:text-blue-400 font-bold">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
