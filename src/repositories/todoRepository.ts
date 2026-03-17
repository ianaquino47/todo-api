import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import type { ITodo } from 'src/domain/todo';

export interface ITodoRepository {
  create(todo: ITodo): Promise<void>;
  findAll(): Promise<ITodo[]>;
  findById(id: string): Promise<ITodo | undefined>;
  update(id: string, fields: Partial<Pick<ITodo, 'title' | 'completed'>>): Promise<ITodo | undefined>;
  remove(id: string): Promise<void>;
}

export class TodoRepository implements ITodoRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(tableName: string) {
    const client = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = tableName;
  }

  async create(todo: ITodo): Promise<void> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: todo,
      }),
    );
  }

  async findAll(): Promise<ITodo[]> {
    const result = await this.docClient.send(
      new ScanCommand({
        TableName: this.tableName,
      }),
    );

    return (result.Items ?? []) as ITodo[];
  }

  async findById(id: string): Promise<ITodo | undefined> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { id },
      }),
    );

    return result.Item as ITodo | undefined;
  }

  async update(
    id: string,
    fields: Partial<Pick<ITodo, 'title' | 'completed'>>,
  ): Promise<ITodo | undefined> {
    const expressionParts: string[] = [];
    const expressionNames: Record<string, string> = {};
    const expressionValues: Record<string, unknown> = {};

    if (fields.title !== undefined) {
      expressionParts.push('#title = :title');
      expressionNames['#title'] = 'title';
      expressionValues[':title'] = fields.title;
    }

    if (fields.completed !== undefined) {
      expressionParts.push('#completed = :completed');
      expressionNames['#completed'] = 'completed';
      expressionValues[':completed'] = fields.completed;
    }

    if (expressionParts.length === 0) {
      return this.findById(id);
    }

    try {
      const result = await this.docClient.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { id },
          UpdateExpression: `SET ${expressionParts.join(', ')}`,
          ExpressionAttributeNames: expressionNames,
          ExpressionAttributeValues: expressionValues,
          ConditionExpression: 'attribute_exists(id)',
          ReturnValues: 'ALL_NEW',
        }),
      );

      return result.Attributes as ITodo;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.name === 'ConditionalCheckFailedException'
      ) {
        return undefined;
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.docClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { id },
      }),
    );
  }
}

export function createTodoRepository(): ITodoRepository {
  const tableName = process.env.TODOS_TABLE_NAME;
  if (!tableName) {
    throw new Error('TODOS_TABLE_NAME environment variable is not set');
  }
  return new TodoRepository(tableName);
}
