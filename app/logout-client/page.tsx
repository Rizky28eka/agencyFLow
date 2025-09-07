'use client';

import { signOut } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutClientPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      await signOut({ redirect: false }); // Do not redirect, handle it manually
      router.push('/login'); // Redirect to login page after logout
    };
    performLogout();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Logging out...</p>
    </div>
  );
}
