const { sendResponse } = require("../../../responses");
const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();
const middy = require("@middy/core");
const { validateToken } = require("../../../middleware/auth");

async function deleteNote(noteId, userId) {
  try {
    await db
      .update({
        TableName: "notesTable",
        Key: { noteId: noteId },
        UpdateExpression: "SET isDeleted = :deleted",
        ConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":deleted": true,
          ":userId": userId,
        },
      })
      .promise();


      return { success: true, message: "Note moved to deleted notes" };
    } catch (error) {
      if (error.code === "ConditionalCheckFailedException") {
        return {
          success: false,
          message: "Note not found or you don't have permission",
        };
      }
      return { success: false, message: "Could not delete note" };
    }
  }

const handler = async (event) => {
  try {
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

    const result = await deleteNote(noteId, userId);
    return sendResponse(result.success ? 200 : 500, result);
  } catch (error) {
    console.log("Handler error:", error);
    return sendResponse(500, { success: false, message: "Server error" });
  }
};

exports.handler = middy(handler).use(validateToken);