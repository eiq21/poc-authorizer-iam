import { APIGatewayProxyHandler } from "aws-lambda";
import "source-map-support/register";
import { auth } from "../core/index";

export const register: APIGatewayProxyHandler = async (event, _context) => {
  const { username, password, documentNumber, phoneNumber } = JSON.parse(
    event.body || "{}"
  );

  try {
    const result = await auth.register(
      username,
      password,
      documentNumber,
      phoneNumber
    );

    await auth.addUserToGroup(username, process.env.GROUP_USERS_NAME);

    return {
      statusCode: 201,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.log("error: ", error);
    return {
      statusCode: 500,
      body: JSON.stringify(error),
    };
  }
};

export const authenticate: APIGatewayProxyHandler = async (event, _context) => {
  const { username, password } = JSON.parse(event.body || "{}");

  try {
    const result = await auth.authenticate(username, password);
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.log("error: ", error);
    return {
      statusCode: 500,
      body: JSON.stringify(error),
    };
  }
};

export const authorize: APIGatewayProxyHandler = async (event, _context) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message:
          "Go Serverless Webpack (Typescript) v1.0! Your function executed successfully!",
        input: event,
      },
      null,
      2
    ),
  };
};

export const refreshToken: APIGatewayProxyHandler = async (event, _context) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message:
          "Go Serverless Webpack (Typescript) v1.0! Your function executed successfully!",
        input: event,
      },
      null,
      2
    ),
  };
};

export const confirmRegister: APIGatewayProxyHandler = async (
  event,
  _context
) => {
  const { username, code } = JSON.parse(event.body || "{}");
  try {
    const result = await auth.confirmRegister(username, code);

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.log("error: ", error);
    return {
      statusCode: 500,
      body: JSON.stringify(error),
    };
  }
};
