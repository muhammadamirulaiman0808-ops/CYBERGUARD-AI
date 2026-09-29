import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient"; // Import client supabase anda

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPasswordStrength(password) {
  if (password.length === 0) {
    return {
      label: "",
      barColor: "",
      textColor: "",
      width: "0%",
    };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) {
    return {
      label: "Weak 🔴",
      barColor: "bg-red-500",
      textColor: "text-red-500",
      width: "33%",
    };
  }

  if (score === 3) {
    return {
      label: "Medium 🟡",
      barColor: "bg-yellow-500",
      textColor: "text-yellow-500",
      width: "66%",
    };
  }

  return {
    label: "Strong 🟢",
    barColor: "bg-green-500",
    textColor: "text-green-500",
    width: "100%",
  };
}

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const strength = getPasswordStrength(password);

  function validate() {
    const newErrors = {};

    // USERNAME: min 3 chars, no whitespace
    if (username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters long.";
    } else if (/\s/.test(username)) {
      newErrors.username = "Username cannot contain spaces.";
    }

    // EMAIL
    if (!EMAIL_REGEX.test(email)) {
      newErrors.email = "Invalid email format (e.g., name@domain.com).";
    }

    // PASSWORD
    if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long.";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = "Password must contain at least one uppercase letter.";
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = "Password must contain at least one lowercase letter.";
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = "Password must contain at least one number.";
    }

    // CONFIRM PASSWORD
    if (confirmPassword !== password) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function register() {
    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      // Panggil Supabase Authentication
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            username: username, // Simpan username ke metadata Supabase
          },
        },
      });

      if (error) {
        throw error;
      }

      alert("Registration successful! Please check your email to verify your account.");
      navigate("/login");
    } catch (error) {
      console.log(error);
      alert(error.message || "Registration failed. Please try again.");
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
          Create your account
        </p>

        <div className="space-y-4">
          {/* USERNAME */}
          <div>
            <input
              className={`w-full border ${
                errors.username ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              } dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 p-3 rounded-lg`}
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username}</p>
            )}
          </div>

          {/* EMAIL */}
          <div>
            <input
              type="email"
              className={`w-full border ${
                errors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              } dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 p-3 rounded-lg`}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* PASSWORD */}
          <div>
            <input
              type="password"
              className={`w-full border ${
                errors.password ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              } dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 p-3 rounded-lg`}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* PASSWORD STRENGTH METER */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${strength.barColor} transition-all duration-300`}
                    style={{ width: strength.width }}
                  ></div>
                </div>

                <p className={`text-sm mt-1 font-semibold ${strength.textColor}`}>
                  {strength.label}
                </p>
              </div>
            )}

            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <input
              type="password"
              className={`w-full border ${
                errors.confirmPassword
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              } dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 p-3 rounded-lg`}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            onClick={register}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-lg font-bold transition-colors"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </div>

        <p className="text-center mt-6 text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 dark:text-blue-400 font-bold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;