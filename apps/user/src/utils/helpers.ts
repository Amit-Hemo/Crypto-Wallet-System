import * as bcrypt from 'bcrypt';

export async function hashPassword(rawPassword: string): Promise<string> {
  const salt = await bcrypt.genSalt();
  return bcrypt.hash(rawPassword, salt);
}

export async function comparePasswords(
  rawPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(rawPassword, hashedPassword);
}
