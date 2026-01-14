import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ExperienceProvider } from "utils/experience-context";

interface Props {
  children: ReactNode;
}

const queryClient = new QueryClient();

/**
 * A provider wrapping the whole app.
 *
 * You can add multiple providers here by nesting them,
 * and they will all be applied to the app.
 *
 * Note: ThemeProvider is already included in AppWrapper.tsx and does not need to be added here.
 */
export const AppProvider = ({ children }: Props) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ExperienceProvider>
        {children}
      </ExperienceProvider>
    </QueryClientProvider>
  );
};
