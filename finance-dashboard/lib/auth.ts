export const SESSION_COOKIE_NAME = 'dashboard_session';

export function validatePassword(input: string): boolean {
  return input === process.env.DASHBOARD_PASSWORD;
}
