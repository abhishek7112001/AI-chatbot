import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaRobot, FaPlus, FaSearch, FaBars } from "react-icons/fa";
import AWS from "aws-sdk";
import { ClipLoader } from "react-spinners";
import axios from "axios";


const Chatbot = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [response, setResponse] = useState("");
  const [query, setQuery] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]); // State for search history with query and response
  const [selectedChat, setSelectedChat] = useState(null); // State to track selected chat
  const [isHistoryOpen, setIsHistoryOpen] = useState(true); // History panel open by default
  const fileInputRef = useRef(null);

  AWS.config.update({
    region: import.meta.env.VITE_AWS_REGION || "ap-south-1",
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  });

  const lambda = new AWS.Lambda();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        setUsername(data.name || "User");
      } catch (error) {
        console.error("Error fetching user details:", error.message);
      }
    };

    fetchUserDetails();
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
      if (!response.ok) throw new Error("Logout failed");
      localStorage.removeItem("token");
      alert("Logout successful!");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error.message);
      alert("An error occurred while logging out.");
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    const s3 = new AWS.S3({
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID2,
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY2,
      region: import.meta.env.VITE_AWS_REGION2 || "ap-south-1",
    });

    const params = {
      Bucket: import.meta.env.VITE_S3_BUCKET_NAME,
      Key: `${Date.now()}_${file.name}`,
      Body: file,
      ContentType: file.type,
    };

    try {
      const uploadResult = await s3.upload(params).promise();
      console.log("File uploaded successfully:", uploadResult.Location);
      alert("File uploaded successfully!");
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file.");
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setResponse("⚠️ Please enter a valid query.");
      return;
    }

    setIsLoading(true);
    setResponse("");

    try {
      const params = {
        FunctionName: import.meta.env.VITE_AWS_LAMBDA_FUNCTION_NAME,
        InvocationType: "RequestResponse",
        Payload: JSON.stringify({
          body: JSON.stringify({ prompt: query }),
        }),
      };

      const result = await lambda.invoke(params).promise();
      if (result.FunctionError) throw new Error(`Lambda execution failed: ${result.Payload}`);
      let data = JSON.parse(result.Payload);
      if (typeof data.body === "string") data = JSON.parse(data.body);

      if (data && data.response) {
        const newChat = { prompt: query, response: data.response, timestamp: new Date() };
        setSearchHistory((prev) => [...prev, newChat]);
        setSelectedChat(newChat); // Set the new chat as the selected one
        setResponse(data.response);
      } else {
        setResponse("⚠️ No valid response received.");
      }
    } catch (error) {
      console.error("Error fetching response:", error.message);
      setResponse(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
      setQuery("");
    }
  };

  const handleHistoryClick = (chat) => {
    setSelectedChat(chat); // Set the clicked chat as the selected one
    setResponse(chat.response); // Update the response to show in the chat panel
  };

  const toggleHistory = () => {
    setIsHistoryOpen(!isHistoryOpen);
  };

  const truncateText = (text, maxLength = 20) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  };

  return (
    <div className="flex min-h-screen bg-gray-100 text-black">
      {/* Main Content Area (Left Part) */}
      <div className={`flex-1 flex flex-col p-4 transition-all duration-300 ${isHistoryOpen ? "pr-1/4" : "pr-0"}`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-xl font-bold text-black">Hi {username}!</div>
          <div className="flex items-center space-x-4">
            <button onClick={handleLogout} className="text-2xl text-black cursor-pointer transition-all duration-300">
              <FaSignOutAlt />
            </button>
            {!isHistoryOpen && (
              <button onClick={toggleHistory} className="text-2xl text-black cursor-pointer">
                <FaBars />
              </button>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-black text-white p-4 rounded-lg shadow-md overflow-y-auto mb-4">
          {isLoading ? (
            <div className="flex justify-center">
              <ClipLoader color="#ffffff" size={30} />
            </div>
          ) : selectedChat ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <div className="bg-gray-700 text-white p-3 rounded-lg max-w-xs">
                  {selectedChat.prompt}
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-gray-800 text-white p-3 rounded-lg max-w-xs">
                  {selectedChat.response}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <FaRobot className="text-6xl mb-2" />
              <p className="text-xl font-semibold">Your AWS Debugger</p>
              <p className="text-gray-400 text-sm mt-2">Your chat will appear here.</p>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="bg-gray-100 p-3 rounded-lg shadow-md w-full flex items-center max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Ask anything..."
            className="flex-grow p-3 text-lg outline-none border border-gray-300 rounded-md"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
          <button
            className="bg-black text-white px-4 py-3 text-lg ml-2 rounded-md cursor-pointer"
            onClick={() => fileInputRef.current.click()}
          >
            <FaPlus />
          </button>
          <button
            className="bg-black text-white px-4 py-3 text-lg ml-2 rounded-md cursor-pointer"
            onClick={handleSearch}
            disabled={isLoading}
          >
            <FaSearch />
          </button>
        </div>
      </div>

      {/* Right Panel: Sliding History */}
      <div
        className={`h-full bg-white shadow-lg transition-all duration-300 ease-in-out ${
          isHistoryOpen ? "w-1/4" : "w-0"
        } overflow-hidden flex flex-col`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">AWS Debugger</h2>
          <button onClick={toggleHistory} className="text-2xl text-black cursor-pointer">
            <FaBars />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {searchHistory.length > 0 ? (
            searchHistory.map((item, index) => (
              <div
                key={index}
                className={`h-16 p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                  selectedChat === item ? "bg-gray-300" : "bg-gray-200 hover:bg-gray-300"
                } flex items-center`}
                onClick={() => handleHistoryClick(item)}
              >
                <p className="text-sm text-gray-700 truncate">{truncateText(item.prompt)}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400">No search history yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chatbot;