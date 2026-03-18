import type { ITodo } from 'src/domain/todo';
import type { ITodoOperations } from 'src/mcp/toolHandler';

export class FakeTodoOperations implements ITodoOperations {
  private readonly store = new Map<string, ITodo>();

  async listTodos(): Promise<ITodo[]> {
    return [...this.store.values()];
  }

  async addTodo(title: string): Promise<ITodo> {
    const todo: ITodo = {
      id: `fake-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    this.store.set(todo.id, { ...todo });
    return { ...todo };
  }

  async updateTodo(id: string, title: string): Promise<ITodo | undefined> {
    const existing = this.store.get(id);
    if (!existing) return undefined;

    const updated: ITodo = { ...existing, title };
    this.store.set(id, updated);
    return { ...updated };
  }

  async completeTodo(id: string): Promise<ITodo | undefined> {
    const existing = this.store.get(id);
    if (!existing) return undefined;

    const updated: ITodo = { ...existing, completed: true };
    this.store.set(id, updated);
    return { ...updated };
  }

  async deleteTodo(id: string): Promise<void> {
    this.store.delete(id);
  }

  clear(): void {
    this.store.clear();
  }

  seed(todos: ITodo[]): void {
    for (const todo of todos) {
      this.store.set(todo.id, { ...todo });
    }
  }
}
