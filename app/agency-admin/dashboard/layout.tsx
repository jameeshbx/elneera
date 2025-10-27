"use client"

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/agency-admin/(components)/Sidebar';
import AccessDeniedModal from '@/components/AccessDeniedModal';
import { Loader2 } from 'lucide-react';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [accessStatus, setAccessStatus] = useState<'LOADING' | 'GRANTED' | 'PENDING' | 'REJECTED' | 'MODIFY'>('LOADING');

  const router = useRouter();

  const checkAccess = useCallback(async () => {
    try {
      const response = await fetch(`/api/agencyform`, {
        cache: 'no-store', // Prevent caching to always get fresh data
      });
      const result = await response.json();
      
      if (response.ok) {
        if (result.data) {
          const agency = result.data;
          console.log('Agency status:', agency.status); // Debug log
          
          if (agency.status === 'ACTIVE') {
            setAccessStatus('GRANTED');
          } else if (agency.status === 'PENDING') {
            setAccessStatus('PENDING');
          } else if (agency.status === 'REJECTED') {
            setAccessStatus('REJECTED');
          } else if (agency.status === 'MODIFY') {
            setAccessStatus('MODIFY');
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
  }, [router]);

  useEffect(() => {
    checkAccess();

    // Poll for status changes every 30 seconds when status is PENDING
    let interval: NodeJS.Timeout | null = null;
    
    if (accessStatus === 'PENDING') {
      interval = setInterval(() => {
        console.log('Polling for status update...');
        checkAccess();
      }, 30000); // Check every 30 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [checkAccess, accessStatus]);

  // Listen for custom refresh event (can be triggered manually)
  useEffect(() => {
    const handleRefresh = () => {
      console.log('Manual refresh triggered');
      checkAccess();
    };

    window.addEventListener('refreshAgencyStatus', handleRefresh);
    return () => window.removeEventListener('refreshAgencyStatus', handleRefresh);
  }, [checkAccess]);

  if (accessStatus === 'LOADING') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen bg-gray-50">
      {accessStatus === 'GRANTED' ? (
        <>
<Sidebar expanded={sidebarExpanded} onToggleExpanded={() => setSidebarExpanded(!sidebarExpanded)} />          <main className={`flex-1 transition-all duration-300 ${sidebarExpanded ? 'lg:ml-64' : 'lg:ml-20'} ml-16`}>
            <div className="p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </>
      ) : (
        <AccessDeniedModal 
          isOpen={accessStatus === 'PENDING' || accessStatus === 'REJECTED' || accessStatus === 'MODIFY'}
          status={accessStatus as 'PENDING' | 'REJECTED' | 'MODIFY'}
          onRetry={checkAccess} // Add retry button to    
          onModify={checkAccess} // Add modify button to modal
        />
      )}
    </div>
  );
}