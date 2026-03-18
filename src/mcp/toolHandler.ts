import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ITodo } from 'src/domain/todo';
import {
  AddTodoSchema,
  UpdateTodoSchema,
  CompleteTodoSchema,
  DeleteTodoSchema,
} from 'src/mcp/schemas';

export interface ITodoOperations {
  listTodos(): Promise<ITodo[]>;
  addTodo(title: string): Promise<ITodo>;
  updateTodo(id: string, title: string): Promise<ITodo | undefined>;
  completeTodo(id: string): Promise<ITodo | undefined>;
  deleteTodo(id: string): Promise<void>;
}

function formatTodoList(todos: ITodo[]): string {
  if (todos.length === 0) {
    return 'No TODO items found.';
  }

  return todos
    .map((todo) => {
      const status = todo.completed ? '[x]' : '[ ]';
      return `${status} ${todo.title} (id: ${todo.id})`;
    })
    .join('\n');
}

export function registerTools(server: McpServer, operations: ITodoOperations): void {
  server.tool(
    'list_todos',
    'Retrieves all TODO items. Returns a formatted list showing each item with its completion status, title, and ID.',
    {},
    async () => {
      const todos = await operations.listTodos();
      return {
        content: [{ type: 'text', text: formatTodoList(todos) }],
      };
    },
  );

  server.tool(
    'add_todo',
    'Creates a new TODO item with the given title. The item starts as not completed.',
    AddTodoSchema,
    async ({ title }) => {
      const todo = await operations.addTodo(title);
      return {
        content: [{ type: 'text', text: `Created TODO: ${todo.title} (id: ${todo.id})` }],
      };
    },
  );

  server.tool(
    'update_todo',
    'Updates the title of an existing TODO item. Requires the item ID and the new title.',
    UpdateTodoSchema,
    async ({ id, title }) => {
      const todo = await operations.updateTodo(id, title);
      if (!todo) {
        return {
          content: [{ type: 'text', text: `TODO with id "${id}" not found.` }],
          isError: true,
        };
      }
      return {
        content: [{ type: 'text', text: `Updated TODO: ${todo.title} (id: ${todo.id})` }],
      };
    },
  );

  server.tool(
    'complete_todo',
    'Marks a TODO item as completed. Requires the item ID.',
    CompleteTodoSchema,
    async ({ id }) => {
      const todo = await operations.completeTodo(id);
      if (!todo) {
        return {
          content: [{ type: 'text', text: `TODO with id "${id}" not found.` }],
          isError: true,
        };
      }
      return {
        content: [{ type: 'text', text: `Completed TODO: ${todo.title} (id: ${todo.id})` }],
      };
    },
  );

  server.tool(
    'delete_todo',
    'Permanently removes a TODO item. Requires the item ID.',
    DeleteTodoSchema,
    async ({ id }) => {
      await operations.deleteTodo(id);
      return {
        content: [{ type: 'text', text: `Deleted TODO with id "${id}".` }],
      };
    },
  );
}
