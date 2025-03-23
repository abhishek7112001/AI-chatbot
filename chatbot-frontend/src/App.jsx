import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Chatbot from "./components/Chatbot";
import ProtectedRoute from "./components/ProtectedRoute"; // Import ProtectedRoute

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* 🔒 Protected Route for Chatbot */}
        <Route element={<ProtectedRoute />}>
          <Route path="/chatbot" element={<Chatbot />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
