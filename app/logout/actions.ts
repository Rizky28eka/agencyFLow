'use server';

import { redirect } from 'next/navigation';

export async function logout() {
  // Perform any server-side cleanup if necessary
  // Then redirect to a client-side logout page
  redirect('/logout-client'); // Create a new client-side route for logout
}
