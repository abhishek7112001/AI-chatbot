import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token); // Store token for authentication
        alert("Login successful!");
        navigate("/chatbot");
      } else {
        alert(data.message || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black">
      <h1 className="text-4xl mb-8 font-bold">Login</h1>
      <form onSubmit={handleLogin} className="flex flex-col w-96 space-y-6">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-2 border-black p-4 rounded-md text-lg"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border-2 border-black p-4 rounded-md text-lg"
          required
        />
        <button
          type="submit"
          className="bg-black text-white py-4 rounded-md text-lg cursor-pointer"
        >
          Login
        </button>
      </form>
      <p className="mt-6 text-lg">
        Don't have an account?{" "}
        <button
          onClick={() => navigate("/signup")}
          className="underline cursor-pointer"
        >
          Sign Up
        </button>
      </p>
    </div>
  );
};

export default Login;
