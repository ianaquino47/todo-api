import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handler, setRepository } from 'src/handlers/deleteTodo';
import { FakeTodoRepository } from 'src/tests/fakes/fakeTodoRepository';
import type { ITodo } from 'src/domain/todo';

const fakeRepo = new FakeTodoRepository();

const existingTodo: ITodo = {
  id: 'todo-1',
  title: 'To be deleted',
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

function buildEvent(id: string | undefined): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: 'DELETE /todos/{id}',
    rawPath: `/todos/${id ?? ''}`,
    rawQueryString: '',
    headers: {},
    pathParameters: id ? { id } : undefined,
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      domainName: 'test.execute-api.eu-west-2.amazonaws.com',
      domainPrefix: 'test',
      http: {
        method: 'DELETE',
        path: `/todos/${id ?? ''}`,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'jest',
      },
      requestId: 'test-request-id',
      routeKey: 'DELETE /todos/{id}',
      stage: '$default',
      time: '17/Mar/2026:00:00:00 +0000',
      timeEpoch: 1773936000000,
    },
    isBase64Encoded: false,
  } as APIGatewayProxyEventV2;
}

describe('deleteTodo handler', () => {
  it('should return 204 and remove the todo when it exists', async () => {
    const event = buildEvent('todo-1');

    const result = await handler(event);

    expect(result).toEqual({
      statusCode: 204,
      body: '',
    });

    const remaining = fakeRepo.getAll();
    expect(remaining).toHaveLength(0);
  });

  it('should return 204 when deleting a non-existent todo (idempotent)', async () => {
    const event = buildEvent('non-existent');

    const result = await handler(event);

    expect(result).toEqual({
      statusCode: 204,
      body: '',
    });

    // Original todo should still be there
    const remaining = fakeRepo.getAll();
    expect(remaining).toHaveLength(1);
  });

  it('should return 400 when the ID is missing', async () => {
    const event = buildEvent(undefined);

    const result = await handler(event);

    expect(result).toEqual({
      statusCode: 400,
      body: JSON.stringify({ message: 'Todo ID is required' }),
    });
  });
});
