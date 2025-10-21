import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { arbitrum } from 'viem/chains';
import { CONTRACT_ADDRESSES, TOKEN_REWARD_ABI } from '@/lib/claimcontract';

const publicClient = createPublicClient({
  chain: arbitrum,
  transport: http(),
});

const TOKEN_ADDRESSES = {
  arb: '0x912CE59144191C1204E64559FE8253a0e49E6548' as `0x${string}`,
  pepe: '0x25d887Ce7a35172C62FeBFD67a1856F20FaEbB00' as `0x${string}`,
  boop: '0x13A7DeDb7169a17bE92B0E3C7C2315B46f4772B3' as `0x${string}`,
};

export async function GET() {
  try {
    // Fetch all token balances in parallel
    const [arbBalance, pepeBalance, boopBalance] = await Promise.all([
      publicClient.readContract({
        address: CONTRACT_ADDRESSES.TOKEN_REWARD as `0x${string}`,
        abi: TOKEN_REWARD_ABI,
        functionName: 'getTokenBalance',
        args: [TOKEN_ADDRESSES.arb],
      }),
      publicClient.readContract({
        address: CONTRACT_ADDRESSES.TOKEN_REWARD as `0x${string}`,
        abi: TOKEN_REWARD_ABI,
        functionName: 'getTokenBalance',
        args: [TOKEN_ADDRESSES.pepe],
      }),
      publicClient.readContract({
        address: CONTRACT_ADDRESSES.TOKEN_REWARD as `0x${string}`,
        abi: TOKEN_REWARD_ABI,
        functionName: 'getTokenBalance',
        args: [TOKEN_ADDRESSES.boop],
      }),
    ]);

    const balances = [
      {
        token: 'arb' as const,
        balance: arbBalance?.toString() || '0',
        symbol: 'ARB',
        name: 'Arbitrum',
        color: '#28A0F0',
        icon: '/images/arb.png',
        fallbackIcon: '🔵'
      },
      {
        token: 'pepe' as const,
        balance: pepeBalance?.toString() || '0',
        symbol: 'PEPE',
        name: 'Pepe',
        color: '#00FF88',
        icon: '/images/pepe.png',
        fallbackIcon: '🐸'
      },
      {
        token: 'boop' as const,
        balance: boopBalance?.toString() || '0',
        symbol: 'BOOP',
        name: 'Boop',
        color: '#8B5CF6',
        icon: '/images/boop.jpg',
        fallbackIcon: '🚀'
      }
    ];

    return NextResponse.json({
      success: true,
      balances,
      totalUsdValue: 0 // Could add USD calculation later
    });

  } catch (error: any) {
    console.error('Error fetching token balances:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
