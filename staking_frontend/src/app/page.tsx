'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Input, 
  Stack, 
  HStack, 
  Text, 
  CardRoot,
  CardBody, 
  CardHeader,
  Badge,
  Spinner,
  Grid,
  SimpleGrid,
  Icon,
  Separator,
} from '@chakra-ui/react';
import { FiArrowUp, FiArrowDown, FiTrendingUp } from 'react-icons/fi';
import { useStakingContract } from '@/hooks/useStakingContract';

// Commit 2: Stats cards display system
const MOCK_STATS = [
  { label: 'Total Value Locked', value: '45.2M STX', change: '+12%', icon: FiArrowUp, color: 'green' },
  { label: 'Current APY', value: '9.2%', change: 'Stable', icon: FiTrendingUp, color: 'blue' },
  { label: 'Active Stakers', value: '12,840', change: '+142 today', icon: FiArrowUp, color: 'purple' },
];

// Commit 3: User staking data types and contracts
interface UserStakingInfo {
  stakedAmount: number;
  pendingRewards: number;
  lastClaimTime: number;
  apy: number;
}

interface ContractStateInfo {
  isPaused: boolean;
  totalStaked: number;
  rewardRate: number;
}

export default function StakingLandingPage() {
  // Commit 4: Form and loading state management
  const [amount, setAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  
  // User and contract state
  const [userInfo, setUserInfo] = useState<UserStakingInfo>({
    stakedAmount: 0,
    pendingRewards: 0,
    lastClaimTime: 0,
    apy: 9.2,
  });
  
  const [contractState, setContractState] = useState<ContractStateInfo>({
    isPaused: false,
    totalStaked: 0,
    rewardRate: 20,
  });
  
  const { 
    getUserInfo, 
    getContractState,
  } = useStakingContract();

  // Fetch user and contract data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true);
        const [userInfoData, contractStateData] = await Promise.all([
          getUserInfo(''),
          getContractState()
        ]);
        
        // Set user info with default values
        if (userInfoData) {
          setUserInfo({
            stakedAmount: userInfoData.staked || 0,
            pendingRewards: userInfoData.rewards || 0,
            lastClaimTime: userInfoData.lastClaim || 0,
            apy: 9.2,
          });
        }
        
        // Set contract state
        if (contractStateData) {
          setContractState({
            isPaused: contractStateData.isPaused || false,
            totalStaked: contractStateData.totalStaked || 0,
            rewardRate: contractStateData.rewardRate || 20,
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [getUserInfo, getContractState]);

  const handleStake = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setIsLoading(true);
      // Actual contract call would go here
      console.log('Staking:', amount);
      setAmount('');
    } catch (error) {
      console.error('Staking failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!unstakeAmount || isNaN(Number(unstakeAmount)) || Number(unstakeAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (Number(unstakeAmount) > userInfo.stakedAmount) {
      alert('Insufficient stake');
      return;
    }

    try {
      setIsLoading(true);
      // Actual contract call would go here
      console.log('Unstaking:', unstakeAmount);
      setUnstakeAmount('');
    } catch (error) {
      console.error('Unstaking failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    if (userInfo.pendingRewards <= 0) {
      alert('No rewards to claim');
      return;
    }

    try {
      setIsLoading(true);
      // Actual contract call would go here
      console.log('Claiming rewards');
      setUserInfo(prev => ({ ...prev, pendingRewards: 0 }));
    } catch (error) {
      console.error('Claim failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="calc(100vh - 80px)" bg="gray.50" py={8} px={4}>
      <Box maxW="7xl" mx="auto">
        {/* Hero Section */}
        <Stack gap={8} mb={8}>
          {/* Page Title */}
          <Box textAlign="center">
            <Text fontSize="4xl" fontWeight="bold" mb={2}>
              Staking Platform
            </Text>
            <Text fontSize="lg" color="gray.600">
              Earn rewards by staking your tokens
            </Text>
          </Box>

          {/* Stats Cards */}
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} w="full">
            {MOCK_STATS.map((stat, index) => (
              <CardRoot key={index} bg="white" borderRadius="lg" boxShadow="sm" _hover={{ boxShadow: 'md' }} transition="all 0.2s">
                <CardBody>
                  <HStack justify="space-between" mb={3}>
                    <Text fontSize="sm" color="gray.500" fontWeight="medium">
                      {stat.label}
                    </Text>
                    <Icon as={stat.icon} w={5} h={5} color={`${stat.color}.500`} />
                  </HStack>
                  <Text fontSize="3xl" fontWeight="bold" mb={2}>
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
              </CardRoot>
            ))}
          </SimpleGrid>
        </Stack>

        {/* Main Content Grid */}
        <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={8} mb={8}>
          {/* Left Column: Staking Form */}
          <Stack gap={6}>
            {/* Stake Card */}
            <CardRoot bg="white" borderRadius="lg" boxShadow="sm" w="full">
              <CardHeader borderBottomWidth="1px" borderColor="gray.200" pb={4}>
                <Text fontSize="lg" fontWeight="bold">Stake Tokens</Text>
              </CardHeader>
              <CardBody p={6}>
                <Stack gap={6}>
                  <Stack w="full" gap={4}>
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
                      disabled={contractState.isPaused}
                    />
                    
                    <HStack w="full" justify="space-between" color="gray.500" fontSize="sm">
                      <Text>Available: 1,000 STX</Text>
                      <Button 
                        variant="plain" 
                        size="sm" 
                        colorScheme="purple"
                        onClick={() => setAmount('1000')}
                      >
                        Max
                      </Button>
                    </HStack>
                  </Stack>
                  
                  <Separator />
                  
                  <Stack w="full" gap={3} fontSize="sm">
                    <HStack w="full" justify="space-between">
                      <Text color="gray.600">APY</Text>
                      <Text fontWeight="bold" color="green.500">{userInfo.apy}%</Text>
                    </HStack>
                    <HStack w="full" justify="space-between">
                      <Text color="gray.600">Est. Annual Reward</Text>
                      <Text fontWeight="medium">{(Number(amount) * userInfo.apy / 100).toFixed(2)} STX</Text>
                    </HStack>
                  </Stack>
                  
                  <Button
                    colorScheme="purple"
                    size="lg"
                    w="full"
                    onClick={handleStake}
                    loading={isLoading}
                    disabled={!amount || isNaN(Number(amount)) || Number(amount) <= 0 || contractState.isPaused}
                  >
                    {contractState.isPaused ? 'Staking Paused' : 'Stake Tokens'}
                  </Button>
                </Stack>
              </CardBody>
            </CardRoot>

            {/* Unstake Card */}
            <CardRoot bg="white" borderRadius="lg" boxShadow="sm" w="full">
              <CardHeader borderBottomWidth="1px" borderColor="gray.200" pb={4}>
                <Text fontSize="lg" fontWeight="bold">Unstake Tokens</Text>
              </CardHeader>
              <CardBody p={6}>
                <Stack gap={6}>
                  <Stack w="full" gap={4}>
                    <Input
                      placeholder="0.00"
                      size="lg"
                      textAlign="right"
                      fontSize="2xl"
                      value={unstakeAmount}
                      onChange={(e) => setUnstakeAmount(e.target.value)}
                      type="number"
                      min="0"
                      step="0.01"
                      borderColor="gray.200"
                      _hover={{ borderColor: 'gray.300' }}
                      _focus={{
                        borderColor: 'red.400',
                        boxShadow: '0 0 0 1px var(--chakra-colors-red-400)',
                      }}
                      disabled={contractState.isPaused}
                    />
                    
                    <HStack w="full" justify="space-between" color="gray.500" fontSize="sm">
                      <Text>Staked: {userInfo.stakedAmount} STX</Text>
                      <Button 
                        variant="plain" 
                        size="sm" 
                        colorScheme="red"
                        onClick={() => setUnstakeAmount(userInfo.stakedAmount.toString())}
                      >
                        Max
                      </Button>
                    </HStack>
                  </Stack>
                  
                  <Button
                    colorScheme="red"
                    variant="outline"
                    size="lg"
                    w="full"
                    onClick={handleUnstake}
                    loading={isLoading}
                    disabled={!unstakeAmount || isNaN(Number(unstakeAmount)) || Number(unstakeAmount) <= 0 || contractState.isPaused}
                  >
                    {contractState.isPaused ? 'Unstaking Paused' : 'Unstake Tokens'}
                  </Button>
                </Stack>
              </CardBody>
            </CardRoot>
          </Stack>

          {/* Right Column: User Dashboard */}
          <Stack gap={6}>
            {/* Loading State */}
            {dataLoading ? (
              <CardRoot bg="white" borderRadius="lg" boxShadow="sm" w="full" h="400px">
                <CardBody display="flex" alignItems="center" justifyContent="center">
                  <Stack gap={4} alignItems="center">
                    <Spinner size="lg" color="purple.500" />
                    <Text color="gray.600">Loading your staking data...</Text>
                  </Stack>
                </CardBody>
              </CardRoot>
            ) : (
              <>
                {/* Your Stakes Card */}
                <CardRoot bg="white" borderRadius="lg" boxShadow="sm" w="full">
                  <CardHeader borderBottomWidth="1px" borderColor="gray.200" pb={4}>
                    <HStack justify="space-between">
                      <Text fontSize="lg" fontWeight="bold">Your Stakes</Text>
                      {userInfo.stakedAmount > 0 && <Badge colorScheme="green">Active</Badge>}
                    </HStack>
                  </CardHeader>
                  <CardBody p={6}>
                    <Stack gap={6} align="stretch">
                      <Stack gap={2}>
                        <HStack w="full" justify="space-between">
                          <Text color="gray.600" fontSize="sm">Total Staked</Text>
                          <Text fontSize="2xl" fontWeight="bold">{userInfo.stakedAmount} STX</Text>
                        </HStack>
                        <HStack w="full" justify="space-between">
                          <Text color="gray.600" fontSize="sm">% of Total</Text>
                          <Text fontSize="sm" fontWeight="medium">
                            {contractState.totalStaked > 0 
                              ? ((userInfo.stakedAmount / contractState.totalStaked) * 100).toFixed(2)
                              : 0}%
                          </Text>
                        </HStack>
                      </Stack>

                      <Separator />

                      <Stack gap={2}>
                        <HStack w="full" justify="space-between">
                          <Text color="gray.600" fontSize="sm">Pending Rewards</Text>
                          <Text fontSize="xl" fontWeight="bold" color="green.500">
                            {userInfo.pendingRewards.toFixed(4)} STX
                          </Text>
                        </HStack>
                      </Stack>

                      <Button
                        colorScheme="green"
                        w="full"
                        onClick={handleClaimRewards}
                        loading={isLoading}
                        disabled={userInfo.pendingRewards <= 0}
                      >
                        Claim Rewards
                      </Button>
                    </Stack>
                  </CardBody>
                </CardRoot>

                {/* Rewards Summary Card */}
                <CardRoot bg="white" borderRadius="lg" boxShadow="sm" w="full">
                  <CardHeader borderBottomWidth="1px" borderColor="gray.200" pb={4}>
                    <Text fontSize="lg" fontWeight="bold">Rewards Summary</Text>
                  </CardHeader>
                  <CardBody p={6}>
                    <Stack gap={4} align="stretch">
                      <HStack justify="space-between" p={3} bg="blue.50" borderRadius="md">
                        <HStack gap={3}>
                          <Icon as={FiTrendingUp} w={5} h={5} color="blue.500" />
                          <Stack gap={0} align="start">
                            <Text fontSize="sm" fontWeight="medium" color="gray.700">Daily Rate</Text>
                            <Text fontSize="xs" color="gray.500">Based on {userInfo.apy}% APY</Text>
                          </Stack>
                        </HStack>
                        <Text fontWeight="bold" color="blue.600">
                          {(userInfo.stakedAmount * userInfo.apy / 100 / 365).toFixed(4)} STX
                        </Text>
                      </HStack>

                      <HStack justify="space-between" p={3} bg="green.50" borderRadius="md">
                        <HStack gap={3}>
                          <Icon as={FiArrowUp} w={5} h={5} color="green.500" />
                          <Stack gap={0} align="start">
                            <Text fontSize="sm" fontWeight="medium" color="gray.700">Total Earned</Text>
                            <Text fontSize="xs" color="gray.500">All-time rewards</Text>
                          </Stack>
                        </HStack>
                        <Text fontWeight="bold" color="green.600">
                          {(userInfo.pendingRewards + 0).toFixed(4)} STX
                        </Text>
                      </HStack>
                    </Stack>
                  </CardBody>
                </CardRoot>
              </>
            )}
          </Stack>
        </Grid>

        {/* Contract Status Footer */}
        {contractState.isPaused && (
          <Box 
            p={4} 
            bg="red.50" 
            borderRadius="lg" 
            borderLeftWidth="4px" 
            borderLeftColor="red.500"
            textAlign="center"
          >
            <Text color="red.700" fontWeight="medium">
              ⚠️ Staking is currently paused by the contract owner. No new stakes or unstakes are allowed.
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}