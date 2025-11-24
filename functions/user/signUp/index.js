const { sendResponse } = require("../../../responses");
const bcrypt = require("bcryptjs");
const AWS = require("aws-sdk");
const { nanoid } = require("nanoid");
const db = new AWS.DynamoDB.DocumentClient();

async function createAccount(
  email,
  hashedPassword,
  userId,
) {
  try {
    await db
      .put({
        TableName: "userTable",
        Item: {
          email: email,
          password: hashedPassword,
          userId: userId
        },
      })
      .promise();

    return { success: true, userId: userId };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Could not create account" };
  }
}

async function signup(email, password) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = nanoid();

  const result = await createAccount(
    email,
    hashedPassword,
    userId,
  );
  return result;
}

exports.handler = async (event) => {
  const { email, password } = JSON.parse(event.body);
  const result = await signup(email, password);

  if (result.success) return sendResponse(200, result);
  else return sendResponse(400, result);
};