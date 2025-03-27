import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaRobot, FaPlus, FaSearch, FaBars } from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import axios from "axios";
import AWS from "aws-sdk";

const Chatbot = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [response, setResponse] = useState("");
  const [query, setQuery] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const fileInputRef = useRef(null);

  // AWS Configuration
  AWS.config.update({
    region: import.meta.env.VITE_AWS_REGION || "ap-south-1",
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  });

  const lambda = new AWS.Lambda();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    const fetchUserDetails = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        setUsername(data.name || "User");
        await loadChatHistory(token);
      } catch (error) {
        console.error("Error fetching user details:", error.message);
        if (error.message.includes("401")) {
          localStorage.removeItem("token");
          navigate("/");
        }
      }
    };

    fetchUserDetails();
  }, [navigate]);

  const loadChatHistory = async (token) => {
    if (!token) return;

    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formattedHistory = res.data.map((chat) => {
        const firstMessage = chat.messages?.[0] || {};
        return {
          sessionId: chat.sessionId,
          prompt: firstMessage.prompt || "Unknown prompt",
          response: firstMessage.response || "Unknown response",
          messages: chat.messages || [],
          timestamp: chat.timestamp || chat.createdAt,
          _id: chat._id,
        };
      });

      setSearchHistory(formattedHistory);
      setSelectedChat(null);
      setResponse("");
    } catch (error) {
      console.error("Error loading chat history:", error.message);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/");
      }
    }
  };

  const handleNewChat = () => {
    setSelectedChat(null);
    setResponse("");
    setQuery("");
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      localStorage.removeItem("token");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error.message);
      navigate("/");
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    const s3 = new AWS.S3({
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
      region: import.meta.env.VITE_AWS_REGION || "ap-south-1",
    });

    const params = {
      Bucket: import.meta.env.VITE_S3_BUCKET_NAME,
      Key: `${Date.now()}_${file.name}`,
      Body: file,
      ContentType: file.type,
    };

    try {
      await s3.upload(params).promise();
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

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    setIsLoading(true);
    setResponse("");

    try {
      // Initialize new chat if none selected
      if (!selectedChat) {
        setSelectedChat({
          sessionId: `session_${Date.now()}`,
          prompt: "",
          response: "",
          messages: [],
          _id: null,
          timestamp: new Date().toISOString(),
        });
      }

      const lambdaParams = {
        FunctionName: import.meta.env.VITE_AWS_LAMBDA_FUNCTION_NAME,
        InvocationType: "RequestResponse",
        Payload: JSON.stringify({
          body: JSON.stringify({ prompt: query }),
        }),
      };

      const lambdaResult = await lambda.invoke(lambdaParams).promise();
      if (lambdaResult.FunctionError) {
        throw new Error(`Lambda execution failed: ${lambdaResult.Payload}`);
      }

      let lambdaData = JSON.parse(lambdaResult.Payload);
      if (typeof lambdaData.body === "string") lambdaData = JSON.parse(lambdaData.body);

      const bedrockResponse = lambdaData.response || "No valid response from Bedrock";

      const newChat = {
        messages: [{
          prompt: query,
          response: bedrockResponse,
        }]
      };

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/chats`,
        newChat,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedChat = {
        sessionId: res.data.sessionId,
        prompt: query,
        response: bedrockResponse,
        messages: res.data.messages,
        _id: res.data._id,
        timestamp: res.data.timestamp || res.data.createdAt,
      };

      setSearchHistory((prev) => [...prev, updatedChat]);
      setSelectedChat(updatedChat);
      setResponse(bedrockResponse);
    } catch (error) {
      console.error("Error in handleSearch:", error.message);
      setResponse(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
      setQuery("");
    }
  };

  const handleHistoryClick = (chat) => {
    setSelectedChat(chat);
    setResponse(chat.messages[0]?.response || "No response available");
  };

  const toggleHistory = () => {
    setIsHistoryOpen(!isHistoryOpen);
  };

  const truncateText = (text, maxLength = 20) => {
    if (!text) return "Untitled";
    return text.length <= maxLength ? text : `${text.substring(0, maxLength - 3)}...`;
  };

  return (
    <div className="flex min-h-screen bg-gray-100 text-black">
      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col p-4 transition-all duration-300 ${isHistoryOpen ? "pr-1/4" : "pr-0"}`}>
        <div className="flex justify-between items-center mb-4">
          <div className="text-xl font-bold text-black">Hi {username}!</div>
          <div className="flex items-center space-x-4">
            <button onClick={handleLogout} className="text-2xl text-black cursor-pointer">
              <FaSignOutAlt />
            </button>
            {!isHistoryOpen && (
              <button onClick={toggleHistory} className="text-2xl text-black cursor-pointer">
                <FaBars />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">
            {selectedChat ? "Current Chat" : "New Chat"}
          </h3>
          {selectedChat && (
            <button
              onClick={handleNewChat}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              New Chat
            </button>
          )}
        </div>

        <div className="flex-1 bg-black text-white p-4 rounded-lg shadow-md overflow-y-auto mb-4">
          {isLoading ? (
            <div className="flex justify-center">
              <ClipLoader color="#ffffff" size={30} />
            </div>
          ) : selectedChat ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <div className="bg-gray-700 text-white p-3 rounded-lg max-w-xs">
                  {selectedChat.prompt || "No prompt available"}
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-gray-800 text-white p-3 rounded-lg max-w-xs">
                  {selectedChat.response || "No response available"}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <FaRobot className="text-6xl mb-2" />
              <p className="text-xl font-semibold">Your AWS Debugger</p>
              <p className="text-gray-400 text-sm mt-2">Start a new conversation</p>
            </div>
          )}
        </div>

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

      {/* Chat History Sidebar */}
      <div
        className={`h-full bg-white shadow-lg transition-all duration-300 ease-in-out ${
          isHistoryOpen ? "w-1/4" : "w-0"
        } overflow-hidden flex flex-col`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">AWS Debugger</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleNewChat}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              New Chat
            </button>
            <button onClick={toggleHistory} className="text-2xl text-black cursor-pointer">
              <FaBars />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {searchHistory.length > 0 ? (
            searchHistory.map((item) => (
              <div
                key={item._id}
                className={`h-16 p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                  selectedChat?._id === item._id ? "bg-gray-300" : "bg-gray-200 hover:bg-gray-300"
                } flex items-center`}
                onClick={() => handleHistoryClick(item)}
              >
                <p className="text-sm text-gray-700 truncate">
                  {truncateText(item.messages[0]?.prompt || "Untitled chat")}
                </p>
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