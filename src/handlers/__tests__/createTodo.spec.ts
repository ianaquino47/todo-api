import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handler } from 'src/handlers/createTodo';

function buildEvent(overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: 'POST /todos',
    rawPath: '/todos',
    rawQueryString: '',
    headers: { 'content-type': 'application/json' },
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      domainName: 'test.execute-api.eu-west-2.amazonaws.com',
      domainPrefix: 'test',
      http: {
        method: 'POST',
        path: '/todos',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'jest',
      },
      requestId: 'test-request-id',
      routeKey: 'POST /todos',
      stage: '$default',
      time: '17/Mar/2026:00:00:00 +0000',
      timeEpoch: 1773936000000,
    },
    isBase64Encoded: false,
    ...overrides,
  } as APIGatewayProxyEventV2;
}

function buildTodoBody(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Buy groceries',
    completed: false,
    createdAt: '2026-03-17T12:00:00.000Z',
    ...overrides,
  });
}

describe('createTodo handler', () => {
  it('should return 201 with the todo when given a valid request', async () => {
    const body = buildTodoBody();
    const event = buildEvent({ body });

    const result = await handler(event);

    expect(result).toEqual({
      statusCode: 201,
      body,
    });
  });

  it('should return 201 when title has leading/trailing whitespace', async () => {
    const body = buildTodoBody({ title: '  Buy groceries  ' });
    const event = buildEvent({ body });

    const result = await handler(event);

    expect(result).toEqual({
      statusCode: 201,
      body,
    });
  });

  it('should return 400 when request body is missing', async () => {
    const event = buildEvent({ body: undefined });

    const result = await handler(event);

    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ message: 'Request body is required' }),
    });
  });

  it('should return 400 when title is missing', async () => {
    const body = buildTodoBody({ title: undefined });
    const event = buildEvent({ body });

    const result = await handler(event);

    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ message: 'Title is required' }),
    });
  });

  it('should return 400 when title is an empty string', async () => {
    const body = buildTodoBody({ title: '' });
    const event = buildEvent({ body });

    const result = await handler(event);

    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ message: 'Title is required' }),
    });
  });

  it('should return 400 when title is only whitespace', async () => {
    const body = buildTodoBody({ title: '   ' });
    const event = buildEvent({ body });

    const result = await handler(event);

    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ message: 'Title is required' }),
    });
  });
});
