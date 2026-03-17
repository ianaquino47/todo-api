import type { ITodo } from 'src/domain/todo';
import type { ITodoRepository } from 'src/repositories/todoRepository';

export class FakeTodoRepository implements ITodoRepository {
  private readonly store = new Map<string, ITodo>();

  async create(todo: ITodo): Promise<void> {
    this.store.set(todo.id, { ...todo });
  }

  async findAll(): Promise<ITodo[]> {
    return [...this.store.values()];
  }

  async findById(id: string): Promise<ITodo | undefined> {
    const item = this.store.get(id);
    return item ? { ...item } : undefined;
  }

  async update(
    id: string,
    fields: Partial<Pick<ITodo, 'title' | 'completed'>>,
  ): Promise<ITodo | undefined> {
    const existing = this.store.get(id);
    if (!existing) {
      return undefined;
    }

    const updated: ITodo = { ...existing, ...fields };
    this.store.set(id, updated);
    return { ...updated };
  }

  async remove(id: string): Promise<void> {
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

  getAll(): ITodo[] {
    return [...this.store.values()];
  }
}
