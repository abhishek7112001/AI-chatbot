AI-Driven L1 Support Chatbot for SOP Execution

Overview:

This project is an AI-powered Level 1 Support Chatbot designed for Standard Operating Procedure (SOP) execution. It allows users to interact with the system through a chat interface, executing commands such as fetching logs, running health checks, and monitoring AWS services via ARN integration.

Features:

User Authentication: Signup and login functionality.

Interactive Chatbot UI: A structured interface with chatbot responses.

AWS Integration: Executes commands via AWS ARN by passing credentials.

Real-time Logging: Displays error logs on the left panel.

Response Execution: Processes queries like:

"Check last 5 errors in AWS Lambda XYZ."

"Run health check on RDS instance ABC."

Logout Feature: Secure session handling.

Installation and Setup:

Clone the Repository

# Navigate to your preferred directory
cd /path/to/your/folder

# Clone the repository
git clone <REPOSITORY_URL>

Backend Setup:

cd backend-chatbot

# Install dependencies
npm install

# Create a .env file with the following variables
MONGO_URL=<your_mongo_connection_string>
JWT_SECRET=<your_jwt_secret>
API_GATEWAY_URL=<your_api_gateway_url>

Frontend Setup:

cd ../frontend-chatbot

# Install dependencies
npm install

# Create a .env file with the backend API URL
VITE_BACKEND_URL=<your_backend_url>

Run the Application:

cd ..
npm start

Usage:

Open the Frontend in a browser.

Signup/Login to access the chatbot.

The UI Interface Appears:

Left Panel: Displays error logs.

Right Panel: Contains the chatbot with a greeting message and logout button.

Interact with the Bot by typing queries such as:

"Check last 5 errors in AWS Lambda XYZ."

"Run health check on RDS instance ABC."

The chatbot fetches and returns relevant responses based on the provided prompt.

Deployment:

This project can be deployed using Vercel (for the frontend) and AWS Lambda/API Gateway (for the backend). Ensure all environment variables are correctly configured before deployment.

Technologies Used:

Frontend: React, Vite, Tailwind CSS

Backend: Node.js, Express, MongoDB

Authentication: JWT

Cloud Services: AWS Lambda, API Gateway

Logging & Monitoring: Integrated with AWS for error tracking

Contributing:

Contributions are welcome! Feel free to open issues and submit pull requests.
