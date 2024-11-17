import * as bcrypt from 'bcrypt';

export async function comparePasswords(
  rawPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(rawPassword, hashedPassword);
}
