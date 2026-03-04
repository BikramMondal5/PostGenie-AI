import { APIGatewayProxyResult } from 'aws-lambda';

export const createResponse = (
  statusCode: number,
  body: any,
  headers: Record<string, string> = {}
): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      ...headers,
    },
    body: JSON.stringify(body),
  };
};

export const successResponse = (data: any): APIGatewayProxyResult => {
  return createResponse(200, { success: true, data });
};

export const errorResponse = (
  statusCode: number,
  message: string,
  error?: any
): APIGatewayProxyResult => {
  return createResponse(statusCode, {
    success: false,
    message,
    error: error?.message || error,
  });
};
