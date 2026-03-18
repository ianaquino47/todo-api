import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

let cachedToken: string | undefined;

export async function getAuthToken(ssmPath: string): Promise<string> {
  if (cachedToken) {
    return cachedToken;
  }

  const client = new SSMClient({});
  const result = await client.send(
    new GetParameterCommand({
      Name: ssmPath,
      WithDecryption: true,
    }),
  );

  const token = result.Parameter?.Value;
  if (!token) {
    throw new Error(`SSM parameter "${ssmPath}" not found or empty`);
  }

  cachedToken = token;
  return token;
}

export function validateBearerToken(
  authHeader: string | undefined,
  expectedToken: string,
): boolean {
  if (!authHeader) return false;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return false;

  return parts[1] === expectedToken;
}

// Exposed for testing — allows resetting the cached token
export function resetCachedToken(): void {
  cachedToken = undefined;
}
