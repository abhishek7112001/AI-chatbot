import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaRobot, FaPlus, FaSearch } from "react-icons/fa";
import AWS from "aws-sdk";

const Chatbot = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [logs, setLogs] = useState([]);
  const [response, setResponse] = useState("");
  const [query, setQuery] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Configure AWS Lambda using environment variables
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
            Authorization: `${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const data = await response.json();
        setUsername(data.name || "User");
      } catch (error) {
        console.error("Error fetching user details:", error.message);
      }
    };

    const fetchLogs = async () => {
      try {
        const params = {
          FunctionName: import.meta.env.VITE_AWS_LAMBDA_FUNCTION_NAME || "SupportBackendHandler",
          InvocationType: "RequestResponse",
          Payload: JSON.stringify({ prompt: "Fetch last 5 logs from CloudWatch" }),
        };

        console.log("Invoking Lambda for logs:", params);
        const result = await lambda.invoke(params).promise();

        if (result.FunctionError) throw new Error(`Lambda execution failed: ${result.Payload}`);

        const data = JSON.parse(result.Payload);
        console.log("Logs Response:", data);

        setLogs(Array.isArray(data.response) ? data.response : [data.response] || ["No logs found"]);
      } catch (error) {
        console.error("Error fetching logs:", error.message || error);
        setLogs(["Error fetching logs: " + (error.message || error)]);
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
    console.log("File selected:", file.name);
  
    // S3 Upload Configuration
    const s3 = new AWS.S3({
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID2,
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY2,
      region: import.meta.env.VITE_AWS_REGION2 || "ap-south-1",
    });
  
    const params = {
      Bucket: import.meta.env.VITE_S3_BUCKET_NAME, // Your S3 bucket name
      Key: `uploads/${Date.now()}_${file.name}`, // Unique filename
      Body: file,
      ContentType: file.type,
      ACL: "public-read", // Makes the file publicly accessible (optional)
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
      setResponse("Please enter a query.");
      return;
    }
  
    try {
      const params = {
        FunctionName:  "SupportBackendHandler",
        InvocationType: "RequestResponse",
        Payload: JSON.stringify({ prompt: query }),
      };
  
      console.log("Invoking Lambda with params:", params);
  
      const result = await lambda.invoke(params).promise();
  
      if (result.FunctionError) {
        throw new Error(`Lambda execution failed: ${result.Payload}`);
      }
  
      const data = JSON.parse(result.Payload);
      console.log("Search Response:", data);
  
      if (data && data.response) {
        setResponse(data.response);
        if (query.toLowerCase().includes("logs")) {
          setLogs(Array.isArray(data.response) ? data.response : [data.response]);
        }
      } else {
        setResponse("No valid response received from Lambda.");
      }
    } catch (error) {
      console.error("Error fetching response:", error.message || error);
      setResponse(`Error fetching response: ${error.message || error}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 text-black">
      {/* Left Sidebar for Logs */}
      <div className="w-1/3 bg-black text-white p-4 overflow-y-auto flex flex-col">
        <h2 className="text-lg font-bold mb-4">AWS CloudWatch Logs</h2>
        <div className="text-sm space-y-2 flex-1 flex items-center justify-center">
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <p key={index} className="bg-gray-800 p-2 rounded">{log}</p>
            ))
          ) : (
            <p className="text-gray-400">If an error is detected, it will be printed here.</p>
          )}
        </div>
      </div>

      {/* Main Chatbot Section */}
      <div className="flex-1 flex flex-col p-10 relative">
        <div className="absolute top-6 left-6 text-xl font-bold">Hi {username}!</div>
        <button onClick={handleLogout} className="absolute top-6 right-6 text-2xl text-black cursor-pointer">
          <FaSignOutAlt />
        </button>

        <div className="flex flex-col items-center mt-16">
          <FaRobot className="text-6xl mb-2" />
          <p className="text-xl font-semibold">Hey, I'm your L1 Support BOT</p>
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col justify-end w-full max-w-2xl mx-auto bg-white border rounded-lg shadow-md p-4 mt-6 h-[60vh] overflow-y-auto">
          {response && (
            <div className="mb-4 p-3 bg-gray-200 rounded-lg self-start text-black">{response}</div>
          )}

          {/* Input Section */}
          <div className="mt-auto bg-gray-100 p-3 rounded-lg shadow-md w-full flex items-center">
            <input
              type="text"
              placeholder="Ask SOPs or Logs..."
              className="flex-grow p-3 text-lg outline-none border border-gray-300 rounded-md"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            <button 
              className="bg-black text-white px-4 py-3 text-lg ml-2 rounded-md cursor-pointer" 
              onClick={() => fileInputRef.current.click()}
            >
              <FaPlus />
            </button>

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload} 
            />

            <button className="bg-black text-white px-4 py-3 text-lg ml-2 rounded-md cursor-pointer" onClick={handleSearch}>
              <FaSearch />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
