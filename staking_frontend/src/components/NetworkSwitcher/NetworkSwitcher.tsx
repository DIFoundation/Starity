// Network Switcher Component Example
// A React component demonstrating how to implement network switching

import React, { useState } from 'react';
import { useNetwork } from '@/hooks/useNetwork';
import { getNetworkDescription } from '@/config';

/**
 * NetworkSwitcher Component
 * 
 * Provides UI for switching between supported networks
 * Displays current network status and warnings
 * 
 * @example
 * <NetworkSwitcher />
 */
export function NetworkSwitcher() {
  const {
    currentNetwork,
    networkDescription,
    networks,
    isProduction,
    isTestnet,
    changeNetwork,
    isLoading,
    error,
  } = useNetwork();

  const handleNetworkChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const success = await changeNetwork(e.target.value);
    if (success) {
      console.log(`Network switched to ${e.target.value}`);
    }
  };

  return (
    <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>Network Configuration</h3>
      
      {/* Current Network Display */}
      <div style={{ marginBottom: '1rem' }}>
        <label>Current Network: </label>
        <strong>{networkDescription}</strong>
        {isProduction && (
          <span style={{ marginLeft: '0.5rem', color: 'red' }}>
            ⚠️ Production Network
          </span>
        )}
        {isTestnet && (
          <span style={{ marginLeft: '0.5rem', color: 'orange' }}>
            🧪 Testnet
          </span>
        )}
      </div>

      {/* Network Selector */}
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="network-select">Select Network: </label>
        <select
          id="network-select"
          value={currentNetwork}
          onChange={handleNetworkChange}
          disabled={isLoading}
          style={{ marginLeft: '0.5rem', padding: '0.5rem' }}
        >
          {networks.map(net => (
            <option key={net.name} value={net.name}>
              {net.displayName}
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div style={{ color: 'blue', marginBottom: '1rem' }}>
          Switching network...
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Network Info */}
      <details style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ddd' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
          More Details
        </summary>
        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
          <p>
            <strong>Network:</strong> {currentNetwork}
          </p>
          <p>
            <strong>Status:</strong> {isProduction ? 'Production' : 'Testing'}
          </p>
          <p>
            <strong>Available Networks:</strong> {networks.map(n => n.name).join(', ')}
          </p>
        </div>
      </details>
    </div>
  );
}

/**
 * Minimal Network Status Component
 * 
 * A lightweight component showing just the current network
 * Good for header/navbar integration
 */
export function NetworkStatus() {
  const { currentNetwork, isProduction } = useNetwork();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span>Network:</span>
      <strong style={{ color: isProduction ? 'red' : 'green' }}>
        {currentNetwork.toUpperCase()}
      </strong>
    </div>
  );
}

/**
 * Network-Gated Component Wrapper
 * 
 * Only displays children if on allowed networks
 */
export interface NetworkGateProps {
  allowedNetworks?: ('mainnet' | 'testnet' | 'devnet')[];
  requireProduction?: boolean;
  requireTestnet?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function NetworkGate({
  allowedNetworks,
  requireProduction = false,
  requireTestnet = false,
  fallback = null,
  children,
}: NetworkGateProps) {
  const { currentNetwork, isProduction } = useNetwork();

  // Check allowed networks
  if (allowedNetworks && !allowedNetworks.includes(currentNetwork)) {
    return <>{fallback}</>;
  }

  // Check production requirement
  if (requireProduction && !isProduction) {
    return (
      <>
        {fallback || (
          <div style={{ padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
            This feature is only available on Mainnet.
          </div>
        )}
      </>
    );
  }

  // Check testnet requirement
  if (requireTestnet && isProduction) {
    return (
      <>
        {fallback || (
          <div style={{ padding: '1rem', backgroundColor: '#d3d3f3', borderRadius: '4px' }}>
            This feature is only available on Testnet.
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}

/**
 * Example Usage in App
 */
export function ExampleApp() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Staking Application</h1>

      {/* Network Switcher in Header */}
      <header style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f5f5f5' }}>
        <NetworkStatus />
      </header>

      {/* Main Content */}
      <main>
        {/* Staking Form - Only on allowed networks */}
        <NetworkGate
          allowedNetworks={['mainnet', 'testnet', 'devnet']}
          fallback={<p>Network not supported</p>}
        >
          <section style={{ marginBottom: '2rem' }}>
            <h2>Stake Your Tokens</h2>
            <p>Stake your tokens to earn rewards</p>
            {/* Staking form UI here */}
          </section>
        </NetworkGate>

        {/* Production-Only Features */}
        <NetworkGate
          requireProduction
          fallback={
            <div style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '4px' }}>
              Switch to Mainnet to access this feature
            </div>
          }
        >
          <section style={{ marginBottom: '2rem' }}>
            <h2>Premium Features</h2>
            <p>Advanced staking options available on Mainnet</p>
          </section>
        </NetworkGate>

        {/* Advanced Options - Details Collapsible */}
        <details style={{ marginTop: '2rem' }}>
          <summary style={{ cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}>
            Advanced Network Settings
          </summary>
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
            <NetworkSwitcher />
          </div>
        </details>
      </main>
    </div>
  );
}

export default NetworkSwitcher;
