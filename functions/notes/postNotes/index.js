const { sendResponse } = require("../../../responses");
const AWS = require("aws-sdk");
const { nanoid } = require("nanoid");
const db = new AWS.DynamoDB.DocumentClient();
const middy = require("@middy/core");
const { validateToken } = require("../../../middleware/auth");

async function postNotes(userId, title, text) {
  try {
    const timestamp = new Date().toLocaleString("sv-SE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Stockholm",
    });

    const noteId = nanoid();

    await db
      .put({
        TableName: "notesTable",
        Item: {
          noteId: noteId,
          userId: userId,
          title: title.substring(0, 50),
          text: text.substring(0, 300),
          createdAt: timestamp,
        },
      })
      .promise();

    return {
      success: true,
      message: "Note created",
      noteId: noteId,
      createdAt: timestamp,
    };
  } catch (error) {
    console.log("Database error:", error);
    return {
      success: false,
      message: "Could not create note: " + error.message,
    };
  }
}

const handler = async (event) => {
  try {
    const userId = event.id;

    if (event.error === "401") {
      return sendResponse(401, {
        success: false,
        message: "Invalid token",
      });
    }

    const { title, text } = JSON.parse(event.body);

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

    const result = await postNotes(userId, title, text);

    return sendResponse(result.success ? 200 : 500, result);
  } catch (error) {
    console.log("Handler error:", error);
    return sendResponse(500, {
      success: false,
      message: "Server error: " + error.message,
    });
  }
};

exports.handler = middy(handler).use(validateToken);