import { useState, useEffect } from 'react';
import Logger from '../../services/logger';
import { useConnect, useAccount, useAuthRequest } from '@stacks/connect-react';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { Button, Box, Text, Flex, Avatar, Menu, MenuButton, MenuList, MenuItem, useToast, Badge, Tooltip } from '@chakra-ui/react';
import { FiLogOut, FiUser, FiWifi, FiWifiOff } from 'react-icons/fi';

export const Header = () => {
  const { doOpenAuth, isAuthenticated, userData } = useAuthRequest();
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);
  const { doOpenAuth: connect } = useConnect();
  const toast = useToast();

  // Local UI state for connection process
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  
  // ENHANCEMENT: Network state
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [networkType, setNetworkType] = useState<'mainnet' | 'testnet'>('mainnet');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Set mounted to true after component mounts to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // ENHANCEMENT: Check network status periodically
  useEffect(() => {
    const checkNetworkStatus = async () => {
      try {
        setNetworkStatus('checking');
        
        // Try to ping Stacks API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('https://api.stacks.co/v2/info', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          setNetworkStatus('connected');
          // Detect network type from response
          setNetworkType(data.network_id === 1 ? 'mainnet' : 'testnet');
        } else {
          setNetworkStatus('disconnected');
        }
      } catch (error) {
        setNetworkStatus('disconnected');
        Logger.logEvent('network_check_failed', { error });
      } finally {
        setLastChecked(new Date());
      }
    };

    // Check immediately
    checkNetworkStatus();

    // Check every 30 seconds
    const interval = setInterval(checkNetworkStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  // ENHANCEMENT: Manual network refresh
  const refreshNetworkStatus = () => {
    setNetworkStatus('checking');
    // Trigger the useEffect by toggling a state
    setLastChecked(null);
  };

  // Truncate address for display
  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  // Handle wallet connection
  const handleConnectWallet = () => {
    // ENHANCEMENT: Check network before connecting
    if (networkStatus === 'disconnected') {
      toast({
        title: 'Network unavailable',
        description: 'Cannot connect wallet when network is offline',
        status: 'warning',
        duration: 5000
      });
      return;
    }

    setConnectError(null);
    setIsConnecting(true);

    const authOrigin = window.location.origin;
    const appDetails = {
      name: 'Staking DApp',
      icon: `${window.location.origin}/logo192.png`,
    };

    try {
      Logger.logEvent('wallet_connect_start');
      connect({
        appDetails,
        // ENHANCEMENT: Use correct network
        network: networkType === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET,
        onFinish: () => {
          setIsConnecting(false);
          Logger.logEvent('wallet_connect_success');
          toast({ title: 'Wallet connected', status: 'success', duration: 3000 });
          window.location.reload();
        },
        onCancel: () => {
          setIsConnecting(false);
          setConnectError('Connection cancelled by user');
          Logger.logEvent('wallet_connect_cancel');
          toast({ title: 'Connection cancelled', status: 'warning', duration: 3000 });
        },
        onError: (err: any) => {
          setIsConnecting(false);
          const message = err?.message || 'Failed to connect wallet';
          setConnectError(message);
          Logger.logEvent('wallet_connect_failure', { message });
          toast({ title: 'Connection failed', description: message, status: 'error', duration: 6000 });
        },
        userSession: undefined, // Uses default
      });
    } catch (err: any) {
      setIsConnecting(false);
      const message = err?.message || 'Failed to initiate connection';
      setConnectError(message);
      console.log('analytics:event', 'wallet_connect_error', message);
      toast({ title: 'Connection error', description: message, status: 'error', duration: 6000 });
    }
  };

  // Handle logout
  const handleLogout = () => {
    toast({ title: 'Disconnected', status: 'info', duration: 2500 });
    window.location.reload();
  };

  // Don't render anything until component is mounted
  if (!mounted) return null;

  // ENHANCEMENT: Get network status color and icon
  const getNetworkStatusDisplay = () => {
    switch (networkStatus) {
      case 'connected':
        return {
          color: 'green',
          icon: FiWifi,
          text: `${networkType === 'mainnet' ? 'Mainnet' : 'Testnet'} • Connected`
        };
      case 'disconnected':
        return {
          color: 'red',
          icon: FiWifiOff,
          text: 'Network Offline'
        };
      case 'checking':
        return {
          color: 'yellow',
          icon: FiWifi,
          text: 'Checking Network...'
        };
    }
  };

  const networkDisplay = getNetworkStatusDisplay();
  const NetworkIcon = networkDisplay.icon;

  return (
    <Box as="header" width="100%" bg="white" boxShadow="sm" py={4} px={6}>
      <Flex justifyContent="space-between" alignItems="center" maxW="container.xl" mx="auto">
        <Flex alignItems="center" gap={4}>
          <Text fontSize="xl" fontWeight="bold" color="purple.600">
            Staking DApp
          </Text>
          
          {/* ENHANCEMENT: Network Status Indicator */}
          <Tooltip 
            label={`Last checked: ${lastChecked?.toLocaleTimeString() || 'Never'} • Click to refresh`}
            hasArrow
          >
            <Badge
              colorScheme={networkDisplay.color}
              display="flex"
              alignItems="center"
              gap={1}
              px={2}
              py={1}
              borderRadius="full"
              cursor="pointer"
              onClick={refreshNetworkStatus}
              role="status"
              aria-label={`Network status: ${networkDisplay.text}`}
            >
              <NetworkIcon 
                size={12} 
                aria-hidden="true"
              />
              <Text fontSize="xs" fontWeight="medium">
                {networkDisplay.text}
              </Text>
            </Badge>
          </Tooltip>
        </Flex>

        {isAuthenticated ? (
          <Menu>
            <MenuButton
              as={Button}
              variant="outline"
              leftIcon={<FiUser />}
              rightIcon={
                <Avatar
                  size="xs"
                  name={address}
                  src={`https://avatars.dicebear.com/api/identicon/${address}.svg`}
                  ml={2}
                />
              }
            >
              {truncateAddress(address || '')}
            </MenuButton>
            <MenuList>
              <MenuItem 
                icon={<FiLogOut />} 
                onClick={handleLogout}
                color="red.500"
              >
                Disconnect Wallet
              </MenuItem>
            </MenuList>
          </Menu>
        ) : (
          <Box>
            {connectError && (
              <Box role="alert" bg="red.50" borderRadius="md" p={2} mb={2} aria-live="assertive">
                <Flex alignItems="center" justifyContent="space-between">
                  <Text color="red.700" fontSize="sm">{connectError}</Text>
                  <Flex>
                    <Button size="sm" mr={2} onClick={() => { console.log('analytics:event','wallet_connect_retry'); setConnectError(null); handleConnectWallet(); }}>
                      Retry
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConnectError(null)}>
                      Dismiss
                    </Button>
                  </Flex>
                </Flex>
              </Box>
            )}

            <Button 
              colorScheme="purple" 
              onClick={handleConnectWallet}
              isLoading={isConnecting || !mounted || networkStatus === 'checking'}
              isDisabled={networkStatus === 'disconnected'}
              aria-disabled={isConnecting || networkStatus === 'disconnected'}
              aria-busy={isConnecting}
            >
              <span aria-live="polite">
                {isConnecting ? 'Connecting…' : 
                 networkStatus === 'disconnected' ? 'Network Offline' : 
                 networkStatus === 'checking' ? 'Checking…' : 
                 'Connect Wallet'}
              </span>
            </Button>
          </Box>
        )}
      </Flex>
    </Box>
  );
};

export default Header;
