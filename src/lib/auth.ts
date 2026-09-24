import { cookies } from 'next/headers';

/**
 * Check if the current request has valid admin authentication.
 * Returns true if the admin_pin cookie matches the expected PIN.
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const pin = cookieStore.get('admin_pin')?.value;
  const expectedPin = process.env.ADMIN_PIN || '1911';
  return pin === expectedPin;
}
