import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaRobot } from "react-icons/fa";
import "@fontsource/press-start-2p"; // Import the pixel font

const HomePage = () => {
  const navigate = useNavigate();
  const [highlightLogin, setHighlightLogin] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black">
      <h1 className="font-[Press Start 2P] text-5xl mb-6 text-center">
        Hey, I'm your AWS Debugger Bot
      </h1>
      <FaRobot className="text-9xl mb-6" /> {/* Bot icon size increased */}
      <div className="flex border-4 border-black rounded-md overflow-hidden w-[40rem]">
        {/* Search bar width increased */}
        <input
          type="text"
          placeholder="Search..."
          className="flex-grow p-4 text-xl outline-none"
        />
        <button
          className="bg-black text-white px-6 py-4 text-xl"
          onClick={() => setHighlightLogin(true)}
        >
          Try Now
        </button>
      </div>
      <div className="mt-6 flex space-x-6">
        <button
          className={`px-6 py-4 text-xl border-4 border-black rounded-md ${
            highlightLogin ? "bg-gray-300" : ""
          }`}
          onClick={() => navigate("/login")}
        >
          Login
        </button>
        <button
          className="px-6 py-4 text-xl border-4 border-black rounded-md"
          onClick={() => navigate("/signup")}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default HomePage;
