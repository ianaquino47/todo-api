import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { registerTools } from 'src/mcp/toolHandler';
import { DynamoTodoOperations } from 'src/mcp/dynamoOperations';
import { getAuthToken, validateBearerToken } from 'src/mcp/auth';
import { createTodoRepository } from 'src/repositories/todoRepository';

const MCP_AUTH_TOKEN_SSM_PATH = process.env.MCP_AUTH_TOKEN_SSM_PATH ?? '/todo-app/mcp-auth-token';

function lambdaEventToRequest(event: APIGatewayProxyEventV2): Request {
  const url = `https://${event.requestContext.domainName}${event.rawPath}${event.rawQueryString ? `?${event.rawQueryString}` : ''}`;
  const headers = new Headers();

  for (const [key, value] of Object.entries(event.headers ?? {})) {
    if (value) headers.set(key, value);
  }

  // Ensure the Accept header includes both content types required by the MCP protocol
  if (!headers.has('accept')) {
    headers.set('accept', 'application/json, text/event-stream');
  }

  return new Request(url, {
    method: event.requestContext.http.method,
    headers,
    body: event.body ?? undefined,
  });
}

// Lambda Function URL with RESPONSE_STREAM uses awslambda.streamifyResponse
// to write HTTP metadata and body directly to the response stream.
declare const awslambda: {
  streamifyResponse: (handler: (event: APIGatewayProxyEventV2, responseStream: any, context: any) => Promise<void>) => any;
  HttpResponseStream: {
    from: (stream: any, metadata: { statusCode: number; headers: Record<string, string> }) => any;
  };
};

export const handler = awslambda.streamifyResponse(
  async (event: APIGatewayProxyEventV2, responseStream: any) => {
    // Authenticate
    const token = await getAuthToken(MCP_AUTH_TOKEN_SSM_PATH);
    const authHeader = event.headers?.['authorization'] ?? event.headers?.['Authorization'];

    if (!validateBearerToken(authHeader, token)) {
      const httpStream = awslambda.HttpResponseStream.from(responseStream, {
        statusCode: 401,
        headers: { 'content-type': 'application/json' },
      });
      httpStream.write(JSON.stringify({ message: 'Unauthorised' }));
      httpStream.end();
      return;
    }

    // Create a fresh server and transport per request (stateless)
    const server = new McpServer({
      name: 'todo-mcp',
      version: '1.0.0',
    });

    const repository = createTodoRepository();
    const operations = new DynamoTodoOperations(repository);
    registerTools(server, operations);

    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    await server.connect(transport);

    const request = lambdaEventToRequest(event);
    const response = await transport.handleRequest(request);

    // Convert the Web Response to a Lambda streaming response
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const httpStream = awslambda.HttpResponseStream.from(responseStream, {
      statusCode: response.status,
      headers: responseHeaders,
    });

    const body = await response.text();
    httpStream.write(body);
    httpStream.end();
  },
);
