import { isAdminAuthenticated } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const authenticated = await isAdminAuthenticated();
  return NextResponse.json({ authenticated });
}
