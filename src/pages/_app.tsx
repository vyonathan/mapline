import type { ReactNode } from 'react';
import type { AppProps } from 'next/app';
import { ThemeProvider } from '@/components/ui/theme-provider';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
