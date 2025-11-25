const { sendResponse } = require("../../../responses");
const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();
const middy = require("@middy/core");
const { validateToken } = require("../../../middleware/auth");

async function restoreNote(noteId, userId) {
  try {
    await db.update({
      TableName: "notesTable",
      Key: { noteId: noteId },
      UpdateExpression: "set isDeleted = :falseVal",
      ConditionExpression: "userId = :userId AND isDeleted = :trueVal",
      ExpressionAttributeValues: {
        ":userId": userId,
        ":trueVal": true,
        ":falseVal": false,
      },
    }).promise();

    return { success: true, message: "Note restored" };

  } catch (error) {
    if (error.code === "ConditionalCheckFailedException") {
      return {
        success: false,
        message: "Note not found or not deleted",
      };
    }
    return { success: false, message: "Could not restore note" };
  }
}

const handler = async (event) => {
  const userId = event.id;
  const noteId = event.pathParameters.id;

  if (event.error === "401") {
    return sendResponse(401, { success: false, message: "Invalid token" });
  }

  if (!noteId) {
    return sendResponse(400, {
      success: false,
      message: "Note ID is required",
    });
  }

  const result = await restoreNote(noteId, userId);
  return sendResponse(result.success ? 200 : 400, result);
};

exports.handler = middy(handler).use(validateToken);