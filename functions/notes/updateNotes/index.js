const { sendResponse } = require("../../../responses");
const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();
const middy = require("@middy/core");
const { validateToken } = require("../../../middleware/auth");

async function updateNote(noteId, userId, title, text) {
  try {
    const timestamp = new Date().toLocaleString("sv-SE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Stockholm",
    });

    await db
      .update({
        TableName: "notesTable",
        Key: { noteId: noteId },
        UpdateExpression:
          "SET #title = :title, #text = :text, #modifiedAt = :modifiedAt",
        ConditionExpression: 
          "userId = :userId AND isDeleted = :falseVal",
        ExpressionAttributeNames: {
          "#title": "title",
          "#text": "text",
          "#modifiedAt": "modifiedAt",
        },
        ExpressionAttributeValues: {
          ":title": title.substring(0, 50),
          ":text": text.substring(0, 300),
          ":modifiedAt": timestamp,
          ":userId": userId,
          ":falseVal": false      // ⬅ Lagt till: får inte uppdatera deleted notes
        },
      })
      .promise();

    return { success: true, message: "Note updated", modifiedAt: timestamp };

  } catch (error) {
    console.log("Update error:", error);

    if (error.code === "ConditionalCheckFailedException") {
      return {
        success: false,
        message: "Not found, deleted, or you don't have permission",
      };
    }

    return { success: false, message: "Could not update note" };
  }
}

const handler = async (event) => {
  try {
    const userId = event.id;
    const noteId = event.pathParameters.id;
    const { title, text } = JSON.parse(event.body);

    if (event.error === "401") {
      return sendResponse(401, { success: false, message: "Invalid token" });
    }

    if (!noteId) {
      return sendResponse(400, {
        success: false,
        message: "Note ID is required",
      });
    }

    if (!title?.trim()) {
      return sendResponse(400, {
        success: false,
        message: "Title is required",
      });
    }

    if (!text?.trim()) {
      return sendResponse(400, {
        success: false,
        message: "Text is required",
      });
    }

    const result = await updateNote(noteId, userId, title, text);
    return sendResponse(result.success ? 200 : 500, result);

  } catch (error) {
    console.log("Handler error:", error);
    return sendResponse(500, { success: false, message: "Server error" });
  }
};

exports.handler = middy(handler).use(validateToken);