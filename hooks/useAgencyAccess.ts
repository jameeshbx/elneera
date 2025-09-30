import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function useAgencyAccess() {
  const { data: session, status } = useSession();
  const [accessStatus, setAccessStatus] = useState<'LOADING' | 'GRANTED' | 'PENDING' | 'REJECTED'>('LOADING');
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      if (status === 'loading') return;
      
      if (!session?.user?.email) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`/api/agencyform`);
        const result = await response.json();
        
        if (response.ok) {
          if (result.data) {
            const agency = result.data;
            if (agency.status === 'ACTIVE') {
              setAccessStatus('GRANTED');
            } else if (agency.status === 'PENDING') {
              setAccessStatus('PENDING');
            } else if (agency.status === 'REJECTED') {
              setAccessStatus('REJECTED');
            }
          } else {
            // No agency found, redirect to form
            router.push('/agency-admin/agency-form');
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking access:', error);
        router.push('/error');
      }
    };

    checkAccess();
  }, [session, status, router]);

  return { accessStatus };
}
