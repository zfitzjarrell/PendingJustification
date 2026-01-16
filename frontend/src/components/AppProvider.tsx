import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ExperienceProvider } from "utils/experience-context";
import brain from "brain";

interface Props {
  children: ReactNode;
}

// Keep this as a module-level singleton so it persists across renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prevents surprise refetches that feel like "it loaded, then changed"
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

// Cache dropdown data for a long time (change if you expect these to change often)
const DROPDOWN_STALE_TIME_MS = 1000 * 60 * 60 * 24; // 24 hours

// Prefetch immediately when this module is loaded (one-time per page load)
queryClient.prefetchQuery({
  queryKey: ["topics"],
  queryFn: async () => {
    const res = await brain.list_topics_jaas();
    return res.json();
  },
  staleTime: DROPDOWN_STALE_TIME_MS,
});

queryClient.prefetchQuery({
  queryKey: ["tones"],
  queryFn: async () => {
    const res = await brain.list_tones_jaas();
    return res.json();
  },
  staleTime: DROPDOWN_STALE_TIME_MS,
});

/**
 * A provider wrapping the whole app.
 */
export const AppProvider = ({ children }: Props) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ExperienceProvider>{children}</ExperienceProvider>
    </QueryClientProvider>
  );
};
