import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient, PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';

// Persister configuration for localStorage
const persister = createSyncStoragePersister({
    storage: window.localStorage,
    key: 'CHATTUBE_QUERY_CACHE',
});

/**
 * QueryProvider component that wraps the application and provides
 * the TanStack Query context with Persistence enabled.
 */
export const QueryProvider = ({ children }: { children: ReactNode }) => {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // To minimize backend load:
                // 1. Data remains "fresh" for 24 hours (Stale Time)
                staleTime: 24 * 60 * 60 * 1000,
                // 2. Data stays in cache for 7 days even if inactive (GC Time)
                gcTime: 7 * 24 * 60 * 60 * 1000,
                // 3. Disable refetching on various triggers
                refetchOnWindowFocus: false,
                refetchOnReconnect: false,
                refetchOnMount: false,
                retry: 1,
            },
        },
    }));

    // Attach the persister to the query client
    useEffect(() => {
        const [unsubscribe] = persistQueryClient({
            queryClient,
            persister,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            buster: 'v1', // Update this to clear cache on version changes
        });

        return unsubscribe;
    }, [queryClient]);

    return (
        <PersistQueryClientProvider client={queryClient} persistOptions={{
            persister,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            buster: 'v1', // Update this to clear cache on version changes
        }}>
            {children}
        </PersistQueryClientProvider>
    );
};
