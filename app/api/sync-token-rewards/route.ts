import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { arbitrum } from 'viem/chains';
import clientPromise from '@/lib/mongodb';

// Contract addresses and ABIs
const TOKEN_REWARD_CONTRACT = '0xD7bd7b687eed415749467f0FDcFe9316ce51Eef9' as `0x${string}`;
const LEADERBOARD_CONTRACT = '0xf8d0FeEfF7093f353EF897Fb680bC463E03BCce0' as `0x${string}`; // Your leaderboard contract

const TOKEN_REWARD_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "TokenRewarded",
    "type": "event"
  }
] as const;

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

// Token address mapping (case insensitive)
const TOKEN_ADDRESSES: Record<string, 'ARB' | 'PEPE' | 'BOOP'> = {
  '0x912ce59144191c1204e64559fe8253a0e49e6548': 'ARB',
  '0x25d887ce7a35172c62febfd67a1856f20faebb00': 'PEPE',
  '0x13a7dedb7169a17be92b0e3c7c2315b46f4772b3': 'BOOP',
};

const CONTRACT_DEPLOYED_BLOCK = BigInt(388858120); // Start from your specified block

const publicClient = createPublicClient({
  chain: arbitrum,
  transport: http(),
});

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('Flapbi');
    
    // Get last synced block
    const lastSynced = await db.collection('tokenRewards').findOne(
      {},
      { sort: { blockNumber: -1 } }
    );
    
    const fromBlock = lastSynced ? BigInt(lastSynced.blockNumber + 1) : CONTRACT_DEPLOYED_BLOCK;
    const toBlock = await publicClient.getBlockNumber();
    
    if (fromBlock > toBlock) {
      return NextResponse.json({ 
        success: true, 
        message: 'Already up to date',
        eventsProcessed: 0 
      });
    }
    
    console.log(`🔄 Syncing TokenRewarded events from block ${fromBlock} to ${toBlock}`);
    console.log(`📍 Token Reward Contract: ${TOKEN_REWARD_CONTRACT}`);
    console.log(`📍 Leaderboard Contract: ${LEADERBOARD_CONTRACT}`);
    
    // Fetch TokenRewarded events
    const logs = await publicClient.getLogs({
      address: TOKEN_REWARD_CONTRACT,
      event: TOKEN_REWARD_ABI[0],
      fromBlock,
      toBlock,
    });
    
    console.log(`📊 Found ${logs.length} TokenRewarded events`);
    
    if (logs.length === 0) {
      console.log('ℹ️ No TokenRewarded events found in this block range');
      return NextResponse.json({ 
        success: true, 
        message: 'No new events found',
        eventsProcessed: 0,
        fromBlock: fromBlock.toString(),
        toBlock: toBlock.toString(),
      });
    }
    
    let eventsProcessed = 0;
    const profileCache = new Map(); // Cache to avoid duplicate getUserProfile calls
    
    for (const log of logs) {
      try {
        const { user, token, amount } = log.args as any;
        const tokenSymbol = TOKEN_ADDRESSES[token.toLowerCase() as keyof typeof TOKEN_ADDRESSES];
        
        if (!tokenSymbol) {
          console.warn(`⚠️ Unknown token address: ${token}`);
          continue;
        }
        
        // Check if we already have this user's profile cached
        let userProfile = profileCache.get(user.toLowerCase());
        
        if (!userProfile) {
          // Fetch user profile from leaderboard contract
          try {
            const profileData = await publicClient.readContract({
              address: LEADERBOARD_CONTRACT,
              abi: LEADERBOARD_ABI,
              functionName: 'getUserProfile',
              args: [user],
            }) as any;
            
            userProfile = {
              userAddress: user.toLowerCase(),
              username: profileData.username || '',
              fid: profileData.fid ? String(profileData.fid) : '',
              pfp: profileData.pfp || '',
              score: profileData.score ? String(profileData.score) : '0',
            };
            
            // Cache the profile
            profileCache.set(user.toLowerCase(), userProfile);
            
            console.log(`✅ Fetched profile for ${user}: ${userProfile.username} (FID: ${userProfile.fid})`);
          } catch (profileError) {
            console.warn(`⚠️ Failed to fetch profile for ${user}:`, profileError);
            // Continue with minimal data
            userProfile = {
              userAddress: user.toLowerCase(),
              username: '',
              fid: '',
              pfp: '',
              score: '0',
            };
            profileCache.set(user.toLowerCase(), userProfile);
          }
        }
        
        // Store the token reward event
        await db.collection('tokenRewards').insertOne({
          userAddress: user.toLowerCase(),
          tokenAddress: token.toLowerCase(),
          tokenSymbol,
          amount: amount.toString(),
          transactionHash: log.transactionHash,
          blockNumber: Number(log.blockNumber),
          timestamp: Date.now(),
          // Profile data
          username: userProfile.username,
          fid: userProfile.fid,
          pfp: userProfile.pfp,
          score: userProfile.score,
          createdAt: new Date(),
        });
        
        eventsProcessed++;
        
      } catch (error) {
        console.error(`❌ Error processing event ${log.transactionHash}:`, error);
        continue;
      }
    }
    
    console.log(`✅ Successfully processed ${eventsProcessed} token reward events`);
    
    return NextResponse.json({
      success: true,
      message: `Processed ${eventsProcessed} token reward events`,
      eventsProcessed,
      fromBlock: fromBlock.toString(),
      toBlock: toBlock.toString(),
    });
    
  } catch (error: any) {
    console.error('❌ Error syncing token rewards:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
