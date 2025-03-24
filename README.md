This project is about an AI-Driven L1-support chat-bot for SOP execution.

To clone this project:
1) open your specified folder location.
2) Type git clone <URL>
3) cd backend-chatbot
4) npm install
5) create a .env file and specify your 
        i) MONGO_URL
        ii) JWT_SECRET
        iii) API_GATEWAY_URL
6) cd ..
7) cd frontend-chatbot
8) Create a .env file and add the VITE_BACKEND_URL
9) cd ..
10) npm start
11) When you open the frontend, then you need to signup and login to the bot
12) Then UI interafce of the bot with the chatbox appears.
13) In the left-hand side, the logs when error occurs is being printed and in the right-hand side, you have the greet mesage and the logout feature
14) Now, if you will type a prompt say “Check last 5 errors in AWS Lambda XYZ.” or  “Run health check on RDS instance ABC.” 
15) You will get the response in the response field.
16) This UI has been integrated to the API gateway from where we will get response.
