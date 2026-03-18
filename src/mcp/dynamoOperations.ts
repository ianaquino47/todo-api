import type { ITodo } from 'src/domain/todo';
import type { ITodoRepository } from 'src/repositories/todoRepository';
import type { ITodoOperations } from 'src/mcp/toolHandler';

export class DynamoTodoOperations implements ITodoOperations {
  private readonly repository: ITodoRepository;

  constructor(repository: ITodoRepository) {
    this.repository = repository;
  }

  async listTodos(): Promise<ITodo[]> {
    return this.repository.findAll();
  }

  async addTodo(title: string): Promise<ITodo> {
    const todo: ITodo = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    await this.repository.create(todo);
    return todo;
  }

  async updateTodo(id: string, title: string): Promise<ITodo | undefined> {
    return this.repository.update(id, { title });
  }

  async completeTodo(id: string): Promise<ITodo | undefined> {
    return this.repository.update(id, { completed: true });
  }

  async deleteTodo(id: string): Promise<void> {
    return this.repository.remove(id);
  }
}
