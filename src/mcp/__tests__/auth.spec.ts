import { validateBearerToken } from 'src/mcp/auth';

describe('validateBearerToken', () => {
  const expectedToken = 'my-secret-token';

  it('should return true when the token matches', () => {
    expect(validateBearerToken('Bearer my-secret-token', expectedToken)).toBe(true);
  });

  it('should return false when the token does not match', () => {
    expect(validateBearerToken('Bearer wrong-token', expectedToken)).toBe(false);
  });

  it('should return false when the header is missing', () => {
    expect(validateBearerToken(undefined, expectedToken)).toBe(false);
  });

  it('should return false when the header has no Bearer prefix', () => {
    expect(validateBearerToken('my-secret-token', expectedToken)).toBe(false);
  });

  it('should return false when the header is empty', () => {
    expect(validateBearerToken('', expectedToken)).toBe(false);
  });

  it('should return false when the header has extra parts', () => {
    expect(validateBearerToken('Bearer my-secret-token extra', expectedToken)).toBe(false);
  });
});
