import { APIGatewayProxyHandler } from "aws-lambda";
import "source-map-support/register";
import { auth } from "../core/index";
import URL from "url";
import aws4 from "aws4";
import AWS from "aws-sdk";
import fetch from "node-fetch";

export const invokeProcess: APIGatewayProxyHandler = async (
  event,
  _context
) => {
  try {
    const idToken = event.headers.Authorization;
    await auth.getAwsCredentials(idToken);
    const urlProcessFile = process.env.PROCESS_FILE_URL;
    console.log("URL: ", urlProcessFile);
    const url = URL.parse(urlProcessFile);
    const opts = {
      host: url.hostname,
      method: "POST",
      path: url.pathname,
      body: JSON.stringify({ processId: Math.floor(Math.random() * 10) + 100 }),
      service: "execute-api",
      region: "us-east-1",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
      },
    };

    const signedRequest = aws4.sign(opts, {
      secretAccessKey: AWS.config.credentials.secretAccessKey,
      accessKeyId: AWS.config.credentials.accessKeyId,
      sessionToken: AWS.config.credentials.sessionToken,
    });

    console.log("signedRequest: ", signedRequest);

    const res = await fetch(urlProcessFile, {
      method: "POST",
      headers: signedRequest.headers,
      body: signedRequest.body,
    });
    return {
      statusCode: 200,
      body: JSON.stringify(await res.json()),
    };
  } catch (error) {
    console.log("error: ", error);
    return {
      statusCode: 500,
      body: JSON.stringify(error.message),
    };
  }
};

export const processFilesPolicy: APIGatewayProxyHandler = async (
  event,
  _context
) => {
  const { processId } = JSON.parse(event.body || "0");
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Process file Execution successfull. processId : ${processId}`,
    }),
  };
};
