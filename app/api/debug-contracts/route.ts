import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { arbitrum } from 'viem/chains';

const publicClient = createPublicClient({
  chain: arbitrum,
  transport: http(),
});

// Common leaderboard contract addresses to test
const POSSIBLE_CONTRACTS = [
  '0xf8d0FeEfF7093f353EF897Fb680bC463E03BCce0' // Your leaderboard contract
];

const LEADERBOARD_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserProfile",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "username",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "fid",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "pfp",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "score",
            "type": "uint256"
          }
        ],
        "internalType": "struct UserProfile",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export async function GET() {
  try {
    const results = [];
    
    for (const contractAddress of POSSIBLE_CONTRACTS) {
      try {
        // Test if contract has getUserProfile function
        const testAddress = '0x6Fd50cdB870061aAa07edD2b91b77FB148D0c686'; // Your address from image
        
        const profileData = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: LEADERBOARD_ABI,
          functionName: 'getUserProfile',
          args: [testAddress],
        }) as any;
        
        results.push({
          contractAddress,
          success: true,
          profileData: {
            user: profileData.user,
            username: profileData.username,
            fid: profileData.fid ? String(profileData.fid) : '',
            pfp: profileData.pfp,
            score: profileData.score ? String(profileData.score) : '0',
          }
        });
        
        console.log(`✅ Contract ${contractAddress} works!`);
        
      } catch (error: any) {
        results.push({
          contractAddress,
          success: false,
          error: error.message,
        });
        
        console.log(`❌ Contract ${contractAddress} failed:`, error.message);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Contract testing completed',
      results,
      note: 'Look for a contract with success: true and correct profile data'
    });
    
  } catch (error: any) {
    console.error('❌ Error testing contracts:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
