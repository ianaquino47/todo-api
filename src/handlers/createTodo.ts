import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

interface ITodo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Request body is required' }),
    };
  }

  const todo: ITodo = JSON.parse(event.body);

  if (!todo.title?.trim()) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Title is required' }),
    };
  }

  return {
    statusCode: 201,
    body: JSON.stringify(todo),
  };
};
