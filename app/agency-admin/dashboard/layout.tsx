"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/agency-admin/(components)/Sidebar';
import { AccessDeniedModal } from '@/components/AccessDeniedModal';
import { Loader2 } from 'lucide-react';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [accessStatus, setAccessStatus] = useState<'LOADING' | 'GRANTED' | 'PENDING' | 'REJECTED'>('LOADING');

  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      if (status === 'loading') return;
      
     

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
  }, [ status, router]);

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
          <Sidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} />
          <main className={`flex-1 transition-all duration-300 ${sidebarExpanded ? 'lg:ml-64' : 'lg:ml-20'} ml-16`}>
            <div className="p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </>
      ) : (
        <AccessDeniedModal 
          isOpen={accessStatus === 'PENDING' || accessStatus === 'REJECTED'}
          status={accessStatus as 'PENDING' | 'REJECTED'}
        />
      )}
    </div>
  );
}