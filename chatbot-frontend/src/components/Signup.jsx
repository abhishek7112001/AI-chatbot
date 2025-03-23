import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert("Signup successful! Please log in.");
        navigate("/login");
      } else {
        alert(data.message || "Signup failed.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black">
      <h1 className="text-4xl mb-8 font-bold">Sign Up</h1>
      <form onSubmit={handleSignup} className="flex flex-col w-96 space-y-6">
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          className="border-2 border-black p-4 rounded-md text-lg"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="border-2 border-black p-4 rounded-md text-lg"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="border-2 border-black p-4 rounded-md text-lg"
          required
        />
        <button
          type="submit"
          className="bg-black text-white py-4 rounded-md text-lg cursor-pointer"
        >
          Sign Up
        </button>
      </form>
      <p className="mt-6 text-lg">
        Already have an account?{" "}
        <button
          onClick={() => navigate("/login")}
          className="underline cursor-pointer"
        >
          Login
        </button>
      </p>
    </div>
  );
};

export default Signup;
