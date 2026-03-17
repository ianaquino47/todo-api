import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { handler, setRepository } from 'src/handlers/updateTodo';
import { FakeTodoRepository } from 'src/tests/fakes/fakeTodoRepository';
import type { ITodo } from 'src/domain/todo';

const fakeRepo = new FakeTodoRepository();

const existingTodo: ITodo = {
  id: 'todo-1',
  title: 'Original title',
  completed: false,
  createdAt: '2026-03-17T10:00:00.000Z',
};

beforeEach(() => {
  setRepository(fakeRepo);
  fakeRepo.seed([existingTodo]);
});

afterEach(() => {
  fakeRepo.clear();
});

function buildEvent(
  id: string | undefined,
  body?: string,
): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: 'PUT /todos/{id}',
    rawPath: `/todos/${id ?? ''}`,
    rawQueryString: '',
    headers: { 'content-type': 'application/json' },
    pathParameters: id ? { id } : undefined,
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      domainName: 'test.execute-api.eu-west-2.amazonaws.com',
      domainPrefix: 'test',
      http: {
        method: 'PUT',
        path: `/todos/${id ?? ''}`,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'jest',
      },
      requestId: 'test-request-id',
      routeKey: 'PUT /todos/{id}',
      stage: '$default',
      time: '17/Mar/2026:00:00:00 +0000',
      timeEpoch: 1773936000000,
    },
    isBase64Encoded: false,
    body,
  } as APIGatewayProxyEventV2;
}

describe('updateTodo handler', () => {
  it('should return 200 with the updated todo when updating the title', async () => {
    const event = buildEvent('todo-1', JSON.stringify({ title: 'Updated title' }));

    const result = await handler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body!) as ITodo;
    expect(body.title).toBe('Updated title');
    expect(body.completed).toBe(false);
  });

  it('should return 200 with the updated todo when toggling completed', async () => {
    const event = buildEvent('todo-1', JSON.stringify({ completed: true }));

    const result = await handler(event) as APIGatewayProxyStructuredResultV2;

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body!) as ITodo;
    expect(body.completed).toBe(true);
    expect(body.title).toBe('Original title');
  });

  it('should return 404 when the todo does not exist', async () => {
    const event = buildEvent('non-existent', JSON.stringify({ title: 'New' }));

    const result = await handler(event);

    expect(result).toEqual({
      statusCode: 404,
      body: JSON.stringify({ message: 'Todo not found' }),
    });
  });

  it('should return 400 when the ID is missing', async () => {
    const event = buildEvent(undefined, JSON.stringify({ title: 'New' }));

    const result = await handler(event);

    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ message: 'Todo ID is required' }),
    });
  });

  it('should return 400 when the request body is missing', async () => {
    const event = buildEvent('todo-1');

    const result = await handler(event);

    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ message: 'Request body is required' }),
    });
  });

  it('should return 400 when no updatable fields are provided', async () => {
    const event = buildEvent('todo-1', JSON.stringify({}));

    const result = await handler(event);

    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ message: 'At least one field (title or completed) is required' }),
    });
  });
});
