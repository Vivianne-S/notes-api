const AWS = require("aws-sdk");
const { sendResponse } = require("../../../responses");
const middy = require("@middy/core");
const { validateToken } = require("../../../middleware/auth");
const db = new AWS.DynamoDB.DocumentClient();

const getDeletedNotes = async (event) => {
  const userId = event.id;

  if (event.error === "401") {
    return sendResponse(401, { success: false, message: "Invalid token" });
  }

  const result = await db.scan({
    TableName: "notesTable",
    FilterExpression: "userId = :userId AND isDeleted = :deleted",
    ExpressionAttributeValues: {
      ":userId": userId,
      ":deleted": true,
    },
  }).promise();

  return sendResponse(200, { success: true, deletedNotes: result.Items });
};

exports.handler = middy(getDeletedNotes).use(validateToken);