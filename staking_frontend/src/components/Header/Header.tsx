import { useState, useEffect } from 'react';
import { useConnect, useAccount, useAuthRequest } from '@stacks/connect-react';
import { STACKS_MAINNET } from '@stacks/network';
import { Button, Box, Text, Flex, Avatar, Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react';
import { FiLogOut, FiUser } from 'react-icons/fi';

export const Header = () => {
  const { doOpenAuth, isAuthenticated, userData } = useAuthRequest();
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);
  const { doOpenAuth: connect } = useConnect();

  // Set mounted to true after component mounts to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Truncate address for display
  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  // Handle wallet connection
  const handleConnectWallet = () => {
    const authOrigin = window.location.origin;
    const appDetails = {
      name: 'Staking DApp',
      icon: `${window.location.origin}/logo192.png`,
    };

    connect({
      appDetails,
      onFinish: () => {
        window.location.reload();
      },
      userSession: undefined, // Uses default
    });
  };

  // Handle logout
  const handleLogout = () => {
    // You might need to implement this based on your auth setup
    // For example, if using @stacks/connect:
    // userSession.signUserOut(window.location.origin);
    window.location.reload();
  };

  // Don't render anything until component is mounted
  if (!mounted) return null;

  return (
    <Box as="header" width="100%" bg="white" boxShadow="sm" py={4} px={6}>
      <Flex justifyContent="space-between" alignItems="center" maxW="container.xl" mx="auto">
        <Text fontSize="xl" fontWeight="bold" color="purple.600">
          Staking DApp
        </Text>

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
          <Button 
            colorScheme="purple" 
            onClick={handleConnectWallet}
            isLoading={!mounted}
          >
            Connect Wallet
          </Button>
        )}
      </Flex>
    </Box>
  );
};

export default Header;
