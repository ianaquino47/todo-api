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
  _event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const todos = await getRepository().findAll();

  return {
    statusCode: 200,
    body: JSON.stringify(todos),
  };
};
