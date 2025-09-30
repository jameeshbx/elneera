'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface AccessDeniedModalProps {
  isOpen: boolean;
  status: 'PENDING' | 'REJECTED';
}

export function AccessDeniedModal({ isOpen, status }: AccessDeniedModalProps) {
  const router = useRouter();
  
  if (!isOpen) return null;

  const messages = {
    PENDING: 'Please wait for admin approval',
    REJECTED: 'Admin has rejected your approval and you cannot access these pages'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            {status === 'PENDING' ? 'Access Pending' : 'Access Denied'}
          </h2>
          <p className="mb-6 text-gray-700">
            {messages[status]}
          </p>
          <div className="flex justify-center">
            <Button 
              onClick={() => router.push('/')}
              className="bg-primary hover:bg-primary/90"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
