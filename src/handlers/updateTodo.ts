import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import type { ITodoRepository } from 'src/repositories/todoRepository';
import { createTodoRepository } from 'src/repositories/todoRepository';

let repository: ITodoRepository;

function getRepository(): ITodoRepository {
  if (!repository) {
    repository = createTodoRepository();
  }
  return repository;
}

export function setRepository(repo: ITodoRepository): void {
  repository = repo;
}

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const id = event.pathParameters?.id;

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Todo ID is required' }),
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Request body is required' }),
    };
  }

  const { title, completed } = JSON.parse(event.body) as {
    title?: string;
    completed?: boolean;
  };

  if (title === undefined && completed === undefined) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'At least one field (title or completed) is required' }),
    };
  }

  const fields: Record<string, unknown> = {};
  if (title !== undefined) fields.title = title;
  if (completed !== undefined) fields.completed = completed;

  const updated = await getRepository().update(id, fields as { title?: string; completed?: boolean });

  if (!updated) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Todo not found' }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updated),
  };
};
