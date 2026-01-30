import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ChakraProvider } from '@chakra-ui/react';
import { Connect, useAuth } from '@stacks/connect-react';
import { STACKS_MAINNET } from '@stacks/network';
import Header from '@/components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Staking DApp',
  description: 'Stake your tokens and earn rewards',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const network = STACKS_MAINNET;

  return (
    <html lang="en">
      <body className={inter.className}>
        <ChakraProvider>
          <Connect
            authOptions={{
              appDetails: {
                name: 'Staking DApp',
                icon: '/logo192.png',
              },
              network,
            }}
          >
            <Header />
            <main>{children}</main>
          </Connect>
        </ChakraProvider>
      </body>
    </html>
  );
}
