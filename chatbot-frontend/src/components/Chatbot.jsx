import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaRobot, FaSearch } from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import axios from "axios";
import AWS from "aws-sdk";

const Chatbot = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState({ invocations: 0, avgDuration: 0 });
  const chatContainerRef = useRef(null);

  AWS.config.update({
    region: import.meta.env.VITE_AWS_REGION || "ap-south-1",
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  });

  const lambda = new AWS.Lambda();
  const cloudwatch = new AWS.CloudWatchLogs();
  const cloudwatchMetrics = new AWS.CloudWatch();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/");

    const initializeUser = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setUsername(data.name || "User");
        await loadChatHistory(token);
        await handleNewChat(); // Create new chat on login
        await fetchLogsAndMetrics();
      } catch (error) {
        console.error("Initialization error:", error);
        if (error.message.includes("401")) navigate("/");
      }
    };

    initializeUser();
  }, [navigate]);

  const fetchLogsAndMetrics = async () => {
    try {
      const logParams = {
        logGroupName: import.meta.env.VITE_AWS_LOG_GROUP_NAME || `/aws/lambda/${import.meta.env.VITE_AWS_LAMBDA_FUNCTION_NAME || "SupportBackendHandler"}`,
        limit: 50,
      };
      const logResult = await cloudwatch.filterLogEvents(logParams).promise();
      setLogs(logResult.events?.map(event => ({
        timestamp: new Date(event.timestamp).toLocaleString(),
        message: event.message.trim(),
      })) || []);

      const metricParams = {
        EndTime: Math.floor(Date.now() / 1000),
        StartTime: Math.floor((Date.now() - 86400000) / 1000),
        Namespace: "AWS/Lambda",
        Period: 3600,
        Dimensions: [{ Name: "FunctionName", Value: import.meta.env.VITE_AWS_LAMBDA_FUNCTION_NAME }],
      };

      const [invocations, duration] = await Promise.all([
        cloudwatchMetrics.getMetricStatistics({ ...metricParams, MetricName: "Invocations", Statistics: ["Sum"] }).promise(),
        cloudwatchMetrics.getMetricStatistics({ ...metricParams, MetricName: "Duration", Statistics: ["Average"] }).promise(),
      ]);

      setMetrics({
        invocations: invocations.Datapoints?.reduce((sum, point) => sum + (point.Sum || 0), 0) || 0,
        avgDuration: duration.Datapoints?.reduce((sum, point) => sum + (point.Average || 0), 0) / duration.Datapoints.length || 0,
      });
    } catch (error) {
      console.error("Monitoring error:", error);
      setLogs([{ timestamp: new Date().toLocaleString(), message: `Error: ${error.message}` }]);
    }
  };

  const loadChatHistory = async (token) => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchHistory(data);
    } catch (error) {
      console.error("History load error:", error.message);
    }
  };

  const handleNewChat = async () => {
    const token = localStorage.getItem("token");
    const newSession = { sessionId: Date.now().toString(), messages: [] };

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const chatEndpoint = `${backendUrl}/api/chats`;
      const { data } = await axios.post(chatEndpoint, newSession, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSearchHistory(prev => [data.chat, ...prev]);
      setSelectedChat(data.chat);
      setQuery("");
    } catch (error) {
      console.error("Error creating new chat:", error.response || error);
      // Fallback to local state if backend fails
      setSelectedChat(newSession);
      setQuery("");
      // alert("Failed to save new chat to backend. Using local session.");
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleSearch = async () => {
    if (!query.trim()) return alert("Please enter a query");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      if (!backendUrl) throw new Error("Backend URL not defined");

      const lambdaParams = {
        FunctionName: import.meta.env.VITE_AWS_LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({ body: JSON.stringify({ prompt: query }) }),
      };
      const { Payload } = await lambda.invoke(lambdaParams).promise();
      let lambdaData = JSON.parse(Payload);
      if (typeof lambdaData.body === "string") lambdaData = JSON.parse(lambdaData.body);

      const newMessage = {
        prompt: query,
        response: lambdaData.response || "No response received",
        sessionId: selectedChat.sessionId,
      };

      const chatEndpoint = `${backendUrl}/api/chats`;
      const { data } = await axios.post(chatEndpoint, newMessage, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSearchHistory(prev => [data.chat, ...prev]);
      setSelectedChat(data.chat);
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    } catch (error) {
      console.error("Error:", error.response || error);
      alert(`Error: ${error.response?.status === 404 ? "404: Check backend route" : error.message}`);
    } finally {
      setIsLoading(false);
      setQuery("");
    }
  };

  const truncateText = (text, maxLength = 25) => 
    text?.length > maxLength ? `${text.substring(0, maxLength)}...` : text || "New Chat";

  return (
    <div className="bg-gray-100 flex flex-col overflow-hidden overflow-auto-y" style={{ height: 'calc(120vh - 64px)' }}>
      <nav className="bg-black text-white p-4 flex justify-between items-center">
        <div className="text-xl font-bold">Welcome {username}</div>
        <button onClick={handleLogout} className="text-2xl hover:text-gray-300">
          <FaSignOutAlt />
        </button>
      </nav>

      <div className="flex flex-1" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Left Section - AWS Monitoring */}
        <div className="w-1/4 bg-black flex flex-col border-r border-gray-300">
          <div className="p-4 border-b border-gray-300 text-white">
            <h2 className="text-lg font-semibold mb-3">AWS Monitoring</h2>
            <div className="space-y-2">
              <p className="text-sm"><span className="font-medium">Invocations:</span> {metrics.invocations}</p>
              <p className="text-sm">
                <span className="font-medium">Avg Duration:</span> {metrics.avgDuration.toFixed(2)}ms
              </p>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <h3 className="text-sm font-medium mb-3 text-white">Recent Logs</h3>
            {logs.length > 0 ? (
              <ul className="space-y-2">
                {logs.map((log, i) => (
                  <li key={i} className="bg-white p-2 rounded text-sm break-words shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">{log.timestamp}</div>
                    <div className="font-mono">{log.message}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No logs available</p>
            )}
          </div>
        </div>

        {/* Middle Section - Chat Interface */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="p-4 border-b border-gray-300 flex justify-between items-center overflow-auto-y">
            <h2 className="text-lg font-semibold">
              {selectedChat?.messages?.length ? "Current Chat" : "New Chat"}
            </h2>
            <button
              onClick={handleNewChat}
              className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
            >
              New Chat
            </button>
          </div>
          
          <div ref={chatContainerRef} className="flex-1 overflow-auto p-4 space-y-4">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <ClipLoader color="#3B82F6" size={40} />
              </div>
            ) : selectedChat?.messages?.length ? (
              selectedChat.messages.map((msg, i) => (
                <div key={i} className="space-y-4">
                  <div className="flex justify-end">
                    <div className="bg-blue-500 text-white p-3 rounded-lg max-w-3xl">
                      {msg.prompt}
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-3 rounded-lg max-w-3xl">
                      {msg.response}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-black">
                <FaRobot className="text-6xl mb-4" />
                <p className="text-xl font-semibold">AWS Support Assistant</p>
                <p className="mt-2">Start chatting with your AWS resources</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-300">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Ask about your AWS resources..."
                className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                <FaSearch className="text-lg" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Section - Chat History */}
        <div className="w-1/4 bg-gray-50 border-l border-gray-300">
          <div className="p-4 border-b border-gray-300">
            <h2 className="text-lg font-semibold">Chat History</h2>
          </div>
          <div className="overflow-auto h-[calc(100vh-112px)]">
            {searchHistory.map((chat) => (
              <div
                key={chat.sessionId}
                onClick={() => setSelectedChat(chat)}
                className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 ${
                  selectedChat?.sessionId === chat.sessionId ? "bg-blue-50" : ""
                }`}
              >
                <div className="text-sm font-medium text-gray-700">
                  {truncateText(chat.messages[0]?.prompt)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(chat.sessionId).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;