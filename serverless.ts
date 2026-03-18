import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'todo-api',

  provider: {
    name: 'aws',
    runtime: 'nodejs20.x',
    region: 'eu-west-2',
    httpApi: {
      cors: true,
    },
    environment: {
      TODOS_TABLE_NAME: { Ref: 'TodosTable' },
    },
    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:PutItem',
              'dynamodb:GetItem',
              'dynamodb:Scan',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
            ],
            Resource: { 'Fn::GetAtt': ['TodosTable', 'Arn'] },
          },
          {
            Effect: 'Allow',
            Action: ['ssm:GetParameter'],
            Resource: {
              'Fn::Sub': 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/todo-app/mcp-auth-token',
            },
          },
        ],
      },
    },
  },

  build: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
    },
  },

  functions: {
    createTodo: {
      handler: 'src/handlers/createTodo.handler',
      events: [{ httpApi: { path: '/todos', method: 'post' } }],
    },
    listTodos: {
      handler: 'src/handlers/listTodos.handler',
      events: [{ httpApi: { path: '/todos', method: 'get' } }],
    },
    updateTodo: {
      handler: 'src/handlers/updateTodo.handler',
      events: [{ httpApi: { path: '/todos/{id}', method: 'put' } }],
    },
    deleteTodo: {
      handler: 'src/handlers/deleteTodo.handler',
      events: [{ httpApi: { path: '/todos/{id}', method: 'delete' } }],
    },
    mcpServer: {
      handler: 'src/handlers/mcpServer.handler',
      timeout: 30,
      memorySize: 512,
      url: {
        cors: true,
        invokeMode: 'RESPONSE_STREAM',
      },
      environment: {
        MCP_AUTH_TOKEN_SSM_PATH: '/todo-app/mcp-auth-token',
      },
    },
  },

  resources: {
    Resources: {
      TodosTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${self:service}-${sls:stage}-todos',
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
          KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
