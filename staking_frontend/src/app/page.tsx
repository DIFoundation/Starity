'use client';

import { useState, useEffect } from 'react';
import { useAccount } from '@stacks/connect-react';
import { Box, Button, Input, VStack, HStack, Text, Card, CardBody, Divider, useToast } from '@chakra-ui/react';
import { useStakingContract } from '@/hooks/useStakingContract';

// Mock data for the UI - will be replaced with actual contract data
const MOCK_STATS = [
  { label: 'Total Value Locked', value: '45.2M STX', change: '+12%' },
  { label: 'Current APY', value: '9.2%', change: 'Stable' },
  { label: 'Active Stakers', value: '12,840', change: '+142 today' },
];

export default function StakingLandingPage() {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useAccount();
  const toast = useToast();
  
  const { 
    getUserInfo, 
    getContractState,
    prepareTransaction,
    FUNCTIONS 
  } = useStakingContract();

  // Fetch user and contract data
  useEffect(() => {
    const fetchData = async () => {
      if (!address) return;
      
      try {
        setIsLoading(true);
        const [userInfo, contractState] = await Promise.all([
          getUserInfo(address),
          getContractState()
        ]);
        console.log('User Info:', userInfo);
        console.log('Contract State:', contractState);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch staking data',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [address, getUserInfo, getContractState, toast]);

  const handleStake = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount to stake',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsLoading(true);
      // This would be replaced with actual contract call
      // const txOptions = prepareTransaction(FUNCTIONS.STAKE, {
      //   token: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.your-token-contract',
      //   amount: Number(amount) * 1e6, // Convert to smallest unit
      // });
      // await doContractCall(txOptions);
      
      toast({
        title: 'Success',
        description: 'Tokens staked successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      setAmount('');
    } catch (error) {
      console.error('Staking failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to stake tokens',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="calc(100vh - 80px)" bg="gray.50" py={8} px={4}>
      <Box maxW="6xl" mx="auto">
        {/* Stats Cards */}
        <HStack spacing={6} mb={8} flexWrap="wrap" justify="center">
          {MOCK_STATS.map((stat, index) => (
            <Card key={index} flex={1} minW="200px" bg="white" borderRadius="lg" boxShadow="sm">
              <CardBody>
                <Text fontSize="sm" color="gray.500" mb={2}>
                  {stat.label}
                </Text>
                <Text fontSize="2xl" fontWeight="bold" mb={1}>
                  {stat.value}
                </Text>
                <Text 
                  fontSize="xs" 
                  color={stat.change === 'Stable' ? 'gray.500' : 'green.500'}
                  fontWeight="medium"
                >
                  {stat.change}
                </Text>
              </CardBody>
            </Card>
          ))}
        </HStack>

        {/* Staking Form */}
        <Card bg="white" borderRadius="lg" boxShadow="sm" maxW="md" mx="auto">
          <CardBody p={6}>
            <VStack spacing={6}>
              <Text fontSize="xl" fontWeight="bold">
                Stake Your Tokens
              </Text>
              
              <VStack w="full" spacing={4}>
                <Input
                  placeholder="0.00"
                  size="lg"
                  textAlign="right"
                  fontSize="2xl"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  borderColor="gray.200"
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{
                    borderColor: 'purple.400',
                    boxShadow: '0 0 0 1px var(--chakra-colors-purple-400)',
                  }}
                />
                
                <HStack w="full" justify="space-between" color="gray.500" fontSize="sm">
                  <Text>Balance: 0 STX</Text>
                  <Button 
                    variant="link" 
                    size="sm" 
                    colorScheme="purple"
                    onClick={() => setAmount('100')}
                  >
                    Max
                  </Button>
                </HStack>
              </VStack>
              
              <Divider />
              
              <VStack w="full" spacing={3}>
                <HStack w="full" justify="space-between">
                  <Text>APY</Text>
                  <Text fontWeight="medium">9.2%</Text>
                </HStack>
                <HStack w="full" justify="space-between">
                  <Text>Your Stake</Text>
                  <Text fontWeight="medium">0 STX</Text>
                </HStack>
                <HStack w="full" justify="space-between">
                  <Text>Rewards</Text>
                  <Text fontWeight="medium" color="green.500">0 STX</Text>
                </HStack>
              </VStack>
              
              <Button
                colorScheme="purple"
                size="lg"
                w="full"
                onClick={handleStake}
                isLoading={isLoading}
                loadingText="Processing..."
                isDisabled={!amount || isNaN(Number(amount)) || Number(amount) <= 0}
              >
                Stake Tokens
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </Box>
    </Box>
  );
}