import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handler, setRepository } from 'src/handlers/listTodos';
import { FakeTodoRepository } from 'src/tests/fakes/fakeTodoRepository';
import type { ITodo } from 'src/domain/todo';

const fakeRepo = new FakeTodoRepository();

beforeEach(() => {
  setRepository(fakeRepo);
});

afterEach(() => {
  fakeRepo.clear();
});

function buildEvent(): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: 'GET /todos',
    rawPath: '/todos',
    rawQueryString: '',
    headers: {},
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      domainName: 'test.execute-api.eu-west-2.amazonaws.com',
      domainPrefix: 'test',
      http: {
        method: 'GET',
        path: '/todos',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'jest',
      },
      requestId: 'test-request-id',
      routeKey: 'GET /todos',
      stage: '$default',
      time: '17/Mar/2026:00:00:00 +0000',
      timeEpoch: 1773936000000,
    },
    isBase64Encoded: false,
  } as APIGatewayProxyEventV2;
}

describe('listTodos handler', () => {
  it('should return 200 with an empty array when no todos exist', async () => {
    const result = await handler(buildEvent());

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify([]),
    });
  });

  it('should return 200 with all todos when todos exist', async () => {
    const todos: ITodo[] = [
      { id: 'todo-1', title: 'First', completed: false, createdAt: '2026-03-17T10:00:00.000Z' },
      { id: 'todo-2', title: 'Second', completed: true, createdAt: '2026-03-17T11:00:00.000Z' },
    ];
    fakeRepo.seed(todos);

    const result = await handler(buildEvent());

    const response = result as { statusCode: number; body: string };
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body) as ITodo[];
    expect(body).toHaveLength(2);
    expect(body.map((t) => t.id)).toContain('todo-1');
    expect(body.map((t) => t.id)).toContain('todo-2');
  });
});
