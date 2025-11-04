'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

export default function AlreadyProcessedContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Get the status from the URL
        const statusParam = searchParams.get('status');

        if (statusParam) {
            setStatus(statusParam.toUpperCase());
            setIsLoading(false);
        } else {
            setError('No status information available');
            setIsLoading(false);
        }
    }, [searchParams]);

    const getStatusDetails = () => {
        if (!status) return null;

        const statusMap: Record<string, {
            title: string;
            description: string;
            icon: React.ReactNode;
            color: string;
        }> = {
            'APPROVED': {
                title: 'Already Approved',
                description: 'This agency has already been approved.',
                icon: <CheckCircle className="h-12 w-12 text-green-500" />,
                color: 'text-green-500'
            },
            'REJECTED': {
                title: 'Already Rejected',
                description: 'This agency has already been rejected.',
                icon: <XCircle className="h-12 w-12 text-red-500" />,
                color: 'text-red-500'
            },
            'MODIFY': {
                title: 'Modification Requested',
                description: 'A modification has already been requested for this agency.',
                icon: <AlertCircle className="h-12 w-12 text-yellow-500" />,
                color: 'text-yellow-500'
            },
            'PENDING': {
                title: 'Processing',
                description: 'This request is already being processed.',
                icon: <Info className="h-12 w-12 text-blue-500" />,
                color: 'text-blue-500'
            },
            'ACTIVE': {
                title: 'Agency Active',
                description: 'This agency is already active.',
                icon: <CheckCircle className="h-12 w-12 text-green-500" />,
                color: 'text-green-500'
            },
        };

        return statusMap[status] || {
            title: 'Already Processed',
            description: 'This request has already been processed.',
            icon: <Info className="h-12 w-12 text-gray-500" />,
            color: 'text-gray-500'
        };
    };

    const statusDetails = getStatusDetails();

    if (isLoading) {
        return (
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Checking status...</p>
            </div>
        );
    }

    if (error || !statusDetails) {
        return (
            <div className="text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                <h2 className="mt-4 text-xl font-semibold text-gray-900">Error</h2>
                <p className="mt-2 text-gray-600">{error || 'Invalid status'}</p>
                <button
                    onClick={() => router.push('/')}
                    className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    Return Home
                </button>
            </div>
        );
    }

    return (
        <div className="text-center">
            <div className={`${statusDetails.color} mb-4`}>
                {statusDetails.icon}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{statusDetails.title}</h2>
            <p className="mt-2 text-gray-600">{statusDetails.description}</p>
            <button
                onClick={() => router.push('/')}
                className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
                Return Home
            </button>
        </div>
    );
}
