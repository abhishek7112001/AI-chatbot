import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaRobot, FaPlus, FaSearch } from "react-icons/fa";

const Chatbot = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [logs, setLogs] = useState([]);
  const [response, setResponse] = useState(""); 
  const [query, setQuery] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUsername(data.name || "User");
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    const fetchLogs = async () => {
      try {
        const response = await fetch("https://zeyqlv160j.execute-api.ap-south-1.amazonaws.com/prod/SupportBackendHandler", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: query }), // Make sure query is defined
          mode: "cors",  // Ensure CORS is set
        });
    
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
    
        const data = await response.json();  // Parse JSON response
        console.log("Response Data:", data);  // Check response in console
    
        setChatResponse(data.message);  // Ensure state updates correctly
      } catch (error) {
        console.error("Error fetching logs:", error);
      }
    };
    
    
    

    fetchUserDetails();
    fetchLogs();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        localStorage.removeItem("token");
        alert("Logout successful!");
        navigate("/");
      } else {
        alert("Logout failed. Please try again.");
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("An error occurred while logging out.");
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
  
    try {
      const response = await fetch("https://zeyqlv160j.execute-api.ap-south-1.amazonaws.com/prod/SupportBackendHandler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: query }),
        mode: "cors",
      });
  
      console.log("Response status:", response.status);
      
      const data = await response.json();
      console.log("API Response:", data);  // Log response in console
  
      if (data && data.response) {
        setResponse(data.response);
      } else {
        setResponse("No valid response received.");
      }
    } catch (error) {
      console.error("Error fetching response:", error);
      setResponse("Error fetching response. Please try again.");
    }
  };
  
  
  

  return (
    <div className="flex min-h-screen bg-gray-100 text-black">
      <div className="w-1/3 bg-black text-white p-4 overflow-y-auto flex flex-col">
        <h2 className="text-lg font-bold mb-4">AWS CloudWatch Logs</h2>
        <div className="text-sm space-y-2 flex-1 flex items-center justify-center">
          {logs.length > 0 ? logs.map((log, index) => (
            <p key={index} className="bg-gray-800 p-2 rounded">{log}</p>
          )) : <p className="text-gray-400">If an error detected it will be printed here.</p>}
        </div>
      </div>

      <div className="flex-1 flex flex-col p-10 relative">
        <div className="absolute top-6 left-6 text-xl font-bold">
          Hii {username}!
        </div>
        <button 
          onClick={handleLogout} 
          className="absolute top-6 right-6 text-2xl text-black cursor-pointer"
        >
          <FaSignOutAlt />
        </button>

        <div className="flex flex-col items-center mt-16">
          <FaRobot className="text-6xl mb-2" />
          <p className="text-xl font-semibold">Hey, I'm your L1 Support BOT</p>
        </div>

        <div className="flex-1 flex flex-col justify-end w-full max-w-2xl mx-auto bg-white border rounded-lg shadow-md p-4 mt-6 h-[60vh] overflow-y-auto">
          {response && (
            <div className="mb-4 p-3 bg-gray-200 rounded-lg self-start text-black">
              {response}
            </div>
          )}
          
          <div className="mt-auto bg-gray-100 p-3 rounded-lg shadow-md w-full flex items-center">
            <input
              type="text"
              placeholder="Ask SOPs or Logs..."
              className="flex-grow p-3 text-lg outline-none border border-gray-300 rounded-md"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload} 
            />
            <button 
              className="bg-black text-white px-4 py-3 text-lg ml-2 rounded-md cursor-pointer"
              onClick={() => fileInputRef.current.click()}
            >
              <FaPlus />
            </button>
            <button 
              className="bg-black text-white px-4 py-3 text-lg ml-2 rounded-md cursor-pointer"
              onClick={handleSearch}
            >
              <FaSearch />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
