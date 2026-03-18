import type { ITodo } from 'src/domain/todo';
import type { ITodoOperations } from 'src/mcp/toolHandler';

const DEFAULT_API_URL = 'https://3nio1igy4g.execute-api.eu-west-2.amazonaws.com';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error (${response.status}): ${error}`);
  }
  return response.json() as Promise<T>;
}

export class HttpTodoOperations implements ITodoOperations {
  private readonly apiUrl: string;

  constructor(apiUrl?: string) {
    this.apiUrl = apiUrl ?? process.env.TODO_API_URL ?? DEFAULT_API_URL;
  }

  async listTodos(): Promise<ITodo[]> {
    const response = await fetch(`${this.apiUrl}/todos`);
    return handleResponse<ITodo[]>(response);
  }

  async addTodo(title: string): Promise<ITodo> {
    const todo: ITodo = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const response = await fetch(`${this.apiUrl}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo),
    });

    return handleResponse<ITodo>(response);
  }

  async updateTodo(id: string, title: string): Promise<ITodo | undefined> {
    const response = await fetch(`${this.apiUrl}/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });

    if (response.status === 404) return undefined;
    return handleResponse<ITodo>(response);
  }

  async completeTodo(id: string): Promise<ITodo | undefined> {
    const response = await fetch(`${this.apiUrl}/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    });

    if (response.status === 404) return undefined;
    return handleResponse<ITodo>(response);
  }

  async deleteTodo(id: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/todos/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok && response.status !== 204) {
      const error = await response.text();
      throw new Error(`API error (${response.status}): ${error}`);
    }
  }
}
