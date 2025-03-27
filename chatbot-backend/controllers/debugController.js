// controllers/debugController.js
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const DebugSession = require("../models/debugSessionModel");

AWS.config.update({
  region: process.env.AWS_REGION || "ap-south-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const lambda = new AWS.Lambda();
const cloudwatchlogs = new AWS.CloudWatchLogs();

const getDebugData = async (req, res) => {
  const { type: resourceType, id: resourceId } = req.query;
  const userId = req.user.id; // From authMiddleware

  if (!resourceType || !resourceId) {
    return res.status(400).json({ message: "Resource type and ID are required" });
  }

  try {
    // Fetch logs from CloudWatch
    const logParams = {
      logGroupName: `/aws/lambda/${resourceId}`, // Adjust based on your setup
      limit: 5,
    };
    const logData = await cloudwatchlogs.getLogEvents(logParams).promise();
    const logs = logData.events.map((event) => event.message);

    // Fetch metrics (example: Lambda invocation count)
    const cloudwatch = new AWS.CloudWatch();
    const metricParams = {
      MetricName: "Invocations",
      Namespace: "AWS/Lambda",
      Dimensions: [{ Name: "FunctionName", Value: resourceId }],
      StartTime: new Date(Date.now() - 3600 * 1000), // Last hour
      EndTime: new Date(),
      Period: 300,
      Statistics: ["Sum"],
    };
    const metricData = await cloudwatch.getMetricData({ MetricDataQueries: [{ Id: "m1", MetricStat: metricParams }] }).promise();
    const metrics = metricData.MetricDataResults[0];

    // Invoke Lambda for GenAI response
    const lambdaParams = {
      FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
      InvocationType: "RequestResponse",
      Payload: JSON.stringify({
        body: JSON.stringify({ prompt: `Analyze these logs: ${logs.join("\n")}` }),
      }),
    };
    const lambdaResult = await lambda.invoke(lambdaParams).promise();
    const lambdaData = JSON.parse(lambdaResult.Payload);
    const genaiResponse = lambdaData.response || "No suggestion available";

    // Save session to MongoDB
    const sessionId = uuidv4();
    const debugSession = new DebugSession({
      userId,
      sessionId,
      resourceType,
      resourceId,
      logs,
      metrics,
      genaiResponse,
    });
    await debugSession.save();

    res.status(200).json({ logs, metrics, genaiResponse, sessionId });
  } catch (error) {
    console.error("Error in getDebugData:", error.message);
    res.status(500).json({ message: `Error fetching debug data: ${error.message}` });
  }
};

const getSessions = async (req, res) => {
  const userId = req.user.id;

  try {
    const sessions = await DebugSession.find({ userId }).select("sessionId resourceType resourceId timestamp");
    const sessionList = sessions.map((session) => ({
      sessionId: session.sessionId,
      summary: `Debug ${session.resourceType} ${session.resourceId}`,
      timestamp: session.timestamp,
    }));
    res.status(200).json(sessionList);
  } catch (error) {
    console.error("Error in getSessions:", error.message);
    res.status(500).json({ message: `Error fetching sessions: ${error.message}` });
  }
};

const getSessionById = async (req, res) => {
  const { sessionId } = req.query;
  const userId = req.user.id;

  if (!sessionId) {
    return res.status(400).json({ message: "Session ID is required" });
  }

  try {
    const session = await DebugSession.findOne({ sessionId, userId });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    res.status(200).json({
      logs: session.logs,
      metrics: session.metrics,
      genaiResponse: session.genaiResponse,
      sessionId: session.sessionId,
    });
  } catch (error) {
    console.error("Error in getSessionById:", error.message);
    res.status(500).json({ message: `Error fetching session: ${error.message}` });
  }
};

module.exports = { getDebugData, getSessions, getSessionById };