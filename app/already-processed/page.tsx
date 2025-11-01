import { Suspense } from 'react';
import AlreadyProcessedContent from './AlreadyProcessedContent';

export default function AlreadyProcessed() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <Suspense fallback={
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading...</p>
                    </div>
                }>
                    <AlreadyProcessedContent />
                </Suspense>
            </div>
        </div>
    );
}
