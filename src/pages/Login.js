import React, { useState } from "react";
import { auth } from "../config/firebase";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    console.log("Attempting login with email:", email, "password:", password);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log(
        "Logged in user:",
        userCredential.user.email,
        "UID:",
        userCredential.user.uid
      );
      navigate("/");
    } catch (err) {
      let errorMessage = "Failed to log in.";
      switch (err.code) {
        case "auth/invalid-email":
          errorMessage = "Invalid email format.";
          break;
        case "auth/user-not-found":
          errorMessage = "No account found with this email.";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password.";
          break;
        case "auth/network-request-failed":
          errorMessage = "Network error. Check your connection.";
          break;
        default:
          errorMessage = err.message;
      }
      setError(errorMessage);
      console.error("Login error:", err.code, err.message);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetMessage("");
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage("Password reset email sent. Check your inbox.");
      setResetEmail("");
    } catch (err) {
      let errorMessage = "Failed to send reset email.";
      switch (err.code) {
        case "auth/invalid-email":
          errorMessage = "Invalid email format.";
          break;
        case "auth/user-not-found":
          errorMessage = "No account found with this email.";
          break;
        case "auth/network-request-failed":
          errorMessage = "Network error. Check your connection.";
          break;
        default:
          errorMessage = err.message;
      }
      setResetMessage(errorMessage);
      console.error("Reset error:", err.code, err.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F9F9F9] font-poppins p-6 justify-center items-center">
      <h1 className="text-3xl font-bold text-[#0F084B] mb-6">
        Mori Delogica Login
      </h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleLogin} className="w-full max-w-md">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-3 mb-4 border border-[#ddd] rounded-lg font-poppins text-[#333]"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-3 mb-4 border border-[#ddd] rounded-lg font-poppins text-[#333]"
          required
        />
        <button
          type="submit"
          className="w-full py-3 bg-[#0F084B] text-white rounded-lg hover:bg-[#1a167d] transition-colors"
        >
          Login
        </button>
        <p className="mt-4 text-center">
          <button
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("resetForm").classList.remove("hidden");
            }}
            className="text-[#2196F3] hover:underline"
          >
            Forgot Password?
          </button>
        </p>
      </form>

      {/* Password Reset Form */}
      <form
        onSubmit={handlePasswordReset}
        id="resetForm"
        className="w-full max-w-md mt-6 hidden"
      >
        <h2 className="text-xl font-semibold text-[#0F084B] mb-4">
          Reset Password
        </h2>
        {resetMessage && (
          <p
            className={
              resetMessage.includes("sent") ? "text-green-500" : "text-red-500"
            }
            mb-4
          >
            {resetMessage}
          </p>
        )}
        <input
          type="email"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full p-3 mb-4 border border-[#ddd] rounded-lg font-poppins text-[#333]"
          required
        />
        <button
          type="submit"
          className="w-full py-3 bg-[#0F084B] text-white rounded-lg hover:bg-[#1a167d] transition-colors"
        >
          Send Reset Email
        </button>
        <p className="mt-2 text-center">
          <button
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("resetForm").classList.add("hidden");
            }}
            className="text-[#FF5733] hover:underline"
          >
            Back to Login
          </button>
        </p>
      </form>
    </div>
  );
};

export default Login;
