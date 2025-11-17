"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

type QueryProviderProps = {
  children: ReactNode;
};

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000, // Data stays fresh for 30 seconds
            gcTime: 300_000, // Keep in memory for 5 minutes (formerly cacheTime)
            refetchOnWindowFocus: false, // Don't refetch when user switches tabs
            retry: 1, // Retry failed requests once
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
