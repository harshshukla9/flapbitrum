
import clientPromise from './mongodb';
// import './setup-database.js';


export interface UsedAuthKey {
    fusedKey: string;
    randomString: string;
    timestamp: number;
    ipAddress: string;
    createdAt: Date;
  }

export interface GiftBoxClaim {
    userAddress: string;
    fid?: number;
    tokenType: 'arb' | 'pepe' | 'boop' | 'bribe' | 'none';
    amount: number;
    timestamp: number;
    signature?: string;
    transactionHash?: string;
    createdAt: Date;
  }
  
  export interface DailyGiftBoxCount {
    userAddress: string;
    date: string; // YYYY-MM-DD format
    count: number;
    lastClaimTime: number;
  }

  
// Gift Box System Functions
export async function isAuthKeyUsed(fusedKey: string): Promise<boolean> {
    try {
      const client = await clientPromise;
      if (!client) {
        console.warn('MongoDB client not available');
        return false;
      }
      const db = client.db('Flapbi');
      
      const usedKey = await db.collection('usedAuthKeys').findOne({ fusedKey });
      return !!usedKey;
    } catch (error) {
      console.warn('Error checking auth key:', error);
      return false;
    }
  }
  
export async function validateAuthKeyInDatabase(fusedKey: string, randomString: string): Promise<boolean> {
    try {
      const isUsed = await isAuthKeyUsed(fusedKey);
      if (isUsed) {
        return false;
      }
      
      // Store the key for future validation
      await storeUsedAuthKey({
        fusedKey,
        randomString,
        timestamp: Date.now(),
        ipAddress: 'unknown' // Will be set by the calling API route
      });
      
      return true;
    } catch (error) {
      console.error('Database validation error:', error);
      return false;
    }
  }

  export async function storeUsedAuthKey(authKeyData: Omit<UsedAuthKey, 'createdAt'>): Promise<void> {
    const client = await clientPromise;
    const db = client.db('Flapbi');
    
    await db.collection('usedAuthKeys').insertOne({
      ...authKeyData,
      createdAt: new Date()
    });
  }


const GIFT_BOXES_PER_DAY = 5;

export async function canUserClaimGiftBox(userAddress: string, fid?: number): Promise<{
  canClaim: boolean;
  claimsToday: number;
  remainingClaims: number;
  lastClaimTime?: number;
}> {
  const client = await clientPromise;
  const db = client.db('Flapbi');
  
  const currentTime = Date.now();
  
  console.log('🔍 canUserClaimGiftBox - searching for user by FID:', fid);
  
  // Find user's game score record by FID (more reliable)
  const userData = await db.collection('gameScores').findOne({
    fid: fid
  });
  
  console.log('🔍 canUserClaimGiftBox - found userData:', {
    exists: !!userData,
    userAddress: userData?.userAddress,
    lastGiftBoxUpdate: userData?.lastGiftBoxUpdate,
    giftBoxClaimsInPeriod: userData?.giftBoxClaimsInPeriod
  });
  
  if (!userData) {
    // User doesn't exist in gameScores, can claim
    console.log('🔍 canUserClaimGiftBox - user not found, can claim');
    return {
      canClaim: true,
      claimsToday: 0,
      remainingClaims: GIFT_BOXES_PER_DAY,
      lastClaimTime: undefined
    };
  }
  
  // Check if last gift box claim was more than 12 hours ago
  const lastGiftBoxUpdate = userData.lastGiftBoxUpdate || 0;
  const claimsInPeriod = userData.giftBoxClaimsInPeriod || 0;
  
  console.log('🔍 canUserClaimGiftBox - current values:', {
    lastGiftBoxUpdate,
    claimsInPeriod,
    currentTime,
    timeDiff: currentTime - lastGiftBoxUpdate
  });
  
  if (currentTime >= lastGiftBoxUpdate + (12 * 60 * 60 * 1000)) {
    // 12 hours have passed, reset counter
    console.log('🔍 canUserClaimGiftBox - 12 hours passed, resetting');
    return {
      canClaim: true,
      claimsToday: 0,
      remainingClaims: GIFT_BOXES_PER_DAY,
      lastClaimTime: lastGiftBoxUpdate
    };
  }
  
  // Check if user has claims remaining in current 12-hour period
  const canClaim = claimsInPeriod < GIFT_BOXES_PER_DAY;
  
  console.log('🔍 canUserClaimGiftBox - result:', {
    canClaim,
    claimsToday: claimsInPeriod,
    remainingClaims: Math.max(0, GIFT_BOXES_PER_DAY - claimsInPeriod)
  });
  
  return {
    canClaim,
    claimsToday: claimsInPeriod,
    remainingClaims: Math.max(0, GIFT_BOXES_PER_DAY - claimsInPeriod),
    lastClaimTime: lastGiftBoxUpdate
  };
}

// Function to check if user can see gift box (without incrementing count)
export async function canUserSeeGiftBox(userAddress: string, fid?: number): Promise<{
  canSee: boolean;
  claimsToday: number;
  remainingClaims: number;
  lastClaimTime?: number;
}> {
  const client = await clientPromise;
  const db = client.db('Flapbi');
  
  const currentTime = Date.now();
  
  // Find user's game score record by FID
  const userData = await db.collection('gameScores').findOne({
    fid: fid
  });
  
  if (!userData) {
    // User doesn't exist in gameScores, can see gift box
    return {
      canSee: true,
      claimsToday: 0,
      remainingClaims: GIFT_BOXES_PER_DAY,
      lastClaimTime: undefined
    };
  }
  
  // Check if last gift box claim was more than 12 hours ago
  const lastGiftBoxUpdate = userData.lastGiftBoxUpdate || 0;
  const claimsInPeriod = userData.giftBoxClaimsInPeriod || 0;
  
  if (currentTime >= lastGiftBoxUpdate + (12 * 60 * 60 * 1000)) {
    // 12 hours have passed, reset counter
    return {
      canSee: true,
      claimsToday: 0,
      remainingClaims: GIFT_BOXES_PER_DAY,
      lastClaimTime: lastGiftBoxUpdate
    };
  }
  
  // Check if user has claims remaining in current 12-hour period
  const canSee = claimsInPeriod < GIFT_BOXES_PER_DAY;
  
  return {
    canSee,
    claimsToday: claimsInPeriod,
    remainingClaims: Math.max(0, GIFT_BOXES_PER_DAY - claimsInPeriod),
    lastClaimTime: lastGiftBoxUpdate
  };
}

export async function generateGiftBoxReward(score: number = 0): Promise<{
  tokenType: 'arb' | 'pepe' | 'boop' | 'bribe' | 'none';
  amount: number;
}> {
  // Calculate "better luck next time" probability based on score
  let betterLuckProbability = 0.2; // Default 50%
  
  // if (score < 50) {
  //   betterLuckProbability = 0.96; // 90% chance for scores under 4000
  // } else if (score < 300) {
  //   betterLuckProbability = 0.7; // 70% chance for scores 4000-7999
  // } else if (score < 500) {
  //   betterLuckProbability = 0.5; // 50% chance for scores 8000-11999
  // } else if (score < 800) {
  //   betterLuckProbability = 0.3; // 30% chance for scores 12000-15999
  // } else if (score < 1200) {
  //   betterLuckProbability = 0.2; // 20% chance for scores 16000-19999
  // } else {
  //   betterLuckProbability = 0.1; // 10% chance for scores 20000+
  // }
  
  const random = Math.random();
  console.log(random,betterLuckProbability)
  if (random < betterLuckProbability) {
    console.log(`🎁 Gift Box: Better luck next time! (${(betterLuckProbability * 100).toFixed(1)}% chance) - Score: ${score.toLocaleString()}`);
    return { tokenType: 'none', amount: 0 };
  }
  
  // Remaining chance of getting a token (distributed equally among the 4 tokens)
  const tokenRandom = Math.random();
  const tokenChance = (1 - betterLuckProbability) / 4; // Equal distribution among 4 tokens
  
  if (tokenRandom < tokenChance) {
    // ARB: 0.025 - 0.075 (halved from 0.05 - 0.15)
    const arbAmount = 0.1 + (Math.random() * 0.05);
    console.log(`🎁 Gift Box: ARB reward! (${(tokenChance * 100).toFixed(1)}% chance) - Amount: ${arbAmount.toFixed(6)} - Score: ${score.toLocaleString()}`);
    return { tokenType: 'arb', amount: parseFloat(arbAmount.toFixed(6)) };
  } else if (tokenRandom < tokenChance * 2) {
    // PEPE: 2236 - 6778 (halved from 4473 - 13557)
    const pepeAmount = 2000 + Math.floor(Math.random() * (3778 - 1236 + 1));
    console.log(`🎁 Gift Box: PEPE reward! (${(tokenChance * 100).toFixed(1)}% chance) - Amount: ${pepeAmount.toLocaleString()} - Score: ${score.toLocaleString()}`);
    return { tokenType: 'pepe', amount: pepeAmount };
  } else if (tokenRandom < tokenChance * 3) {
    // BOOP: 711 - 1000 (halved from 1423 - 2000)
    const boopAmount = 2000 + Math.floor(Math.random() * (1000 - 411 + 1));
    console.log(`🎁 Gift Box: BOOP reward! (${(tokenChance * 100).toFixed(1)}% chance) - Amount: ${boopAmount.toLocaleString()} - Score: ${score.toLocaleString()}`);
    return { tokenType: 'boop', amount: boopAmount };
  } else {
    bribe: 14000 - 23000
    const bribeAmount = 14000 + Math.floor(Math.random() * (23000 - 14000 + 1));
    console.log(`🎁 Gift Box: bribe reward! (${(tokenChance * 100).toFixed(1)}% chance) - Amount: ${bribeAmount.toLocaleString()} - Score: ${score.toLocaleString()}`);
    return { tokenType: 'bribe', amount: bribeAmount };
  }
}

export async function claimGiftBox(userAddress: string, fid?: number): Promise<{
  success: boolean;
  tokenType: 'arb' | 'pepe' | 'boop' | 'bribe' | 'none';
  amount: number;
  amountInWei?: string;
  signature?: string;
  nonce?: string;
  signatureVerified?: boolean;
  signingError?: string;
  claimsToday: number;
  remainingClaims: number;
}> {
  const client = await clientPromise;
  const db = client.db('Flapbi');
  
  const userAddressLower = userAddress;
  
  // Check if user can claim
  const canClaim = await canUserClaimGiftBox(userAddress, fid);
  if (!canClaim.canClaim) {
    return {
      success: false,
      tokenType: 'none',
      amount: 0,
      claimsToday: canClaim.claimsToday,
      remainingClaims: canClaim.remainingClaims
    };
  }
  
  // Get user's best score for reward calculation
  let userBestScore = 0;
  if (fid) {
    try {
      const userGameData = await db.collection('gameScores').findOne(
        { fid: fid },
        { sort: { score: -1 } }
      );
      userBestScore = userGameData?.currentSeasonScore || 0;
      console.log(`🎯 User best score for gift box calculation: ${userBestScore.toLocaleString()}`);
    } catch (error) {
      console.log('⚠️ Error getting user score for gift box, using 0:', error);
      userBestScore = 0;
    }
  }
  
  // Generate reward based on user's score
  const reward = await generateGiftBoxReward(userBestScore);
  
  // Update gift box claims in gameScores collection
  const currentTime = Date.now();
  const lastGiftBoxUpdate = canClaim.lastClaimTime || 0;
  const claimsInPeriod = canClaim.claimsToday;
  
  console.log('🔍 Claiming gift box - Debug info:', {
    userAddress: userAddressLower,
    lastGiftBoxUpdate,
    claimsInPeriod,
    currentTime,
    timeDiff: currentTime - lastGiftBoxUpdate,
    twelveHours: 12 * 60 * 60 * 1000
  });
  
  // Check if we need to reset the counter (12 hours passed)
  let newClaimsInPeriod = 1;
  let newLastGiftBoxUpdate = currentTime;
  
  if (lastGiftBoxUpdate === 0) {
    // First time claiming - start with 1
    newClaimsInPeriod = 1;
    newLastGiftBoxUpdate = currentTime;
    console.log('🎯 First time claiming - starting with 1');
  } else if (currentTime >= lastGiftBoxUpdate + (12 * 60 * 60 * 1000)) {
    // 12 hours have passed, start new period
    newClaimsInPeriod = 1;
    newLastGiftBoxUpdate = currentTime;
    console.log('🔄 12 hours passed - resetting counter to 1');
  } else {
    // Continue in current period
    newClaimsInPeriod = claimsInPeriod + 1;
    newLastGiftBoxUpdate = currentTime; // Always update to current time when claiming
    console.log(`📈 Continuing period - incrementing from ${claimsInPeriod} to ${newClaimsInPeriod}`);
  }
  
  console.log('💾 Updating database with:', {
    userAddress: userAddressLower,
    newClaimsInPeriod,
    newLastGiftBoxUpdate
  });
  
  const updateResult = await db.collection('gameScores').updateOne(
    { fid: fid },
    {
      $set: {
        giftBoxClaimsInPeriod: newClaimsInPeriod,
        lastGiftBoxUpdate: newLastGiftBoxUpdate,
        updatedAt: new Date()
      },
      $inc: {
        totalRewardsClaimed: 1
      }
    },
    { upsert: true }
  );
  
  console.log('✅ Database update result:', {
    matchedCount: updateResult.matchedCount,
    modifiedCount: updateResult.modifiedCount,
    upsertedCount: updateResult.upsertedCount
  });
  
  // Store the claim
  const giftBoxClaim: GiftBoxClaim = {
    userAddress: userAddressLower,
    fid,
    tokenType: reward.tokenType,
    amount: reward.amount,
    timestamp: Date.now(),
    createdAt: new Date()
  };
  
  await db.collection('giftBoxClaims').insertOne(giftBoxClaim);
  
  // Generate signature for token reward (only if not "none")
  let signature: string | undefined;
  let nonceStr: string | undefined;
  let signatureVerified: boolean | undefined;
  let signingError: string | undefined;
  if (reward.tokenType !== 'none') {
    const { ethers } = await import('ethers');
    const { CONTRACT_ADDRESSES, TOKEN_REWARD_ABI } = await import('@/lib/claimcontract');
    const serverPrivateKey = process.env.SERVER_PRIVATE_KEY;
    
    // Convert amount to wei (18 decimals)
    const amountInWei = convertToWei(reward.amount);
    
    // Read user's current nonce from the contract
    let nonce = BigInt(0);
    try {
      const rpcUrl = process.env.ARBITRUM_RPC_URL || process.env.ALCHEMY_ARBITRUM_RPC_URL || process.env.RPC_URL || '';
      const provider = rpcUrl ? new ethers.JsonRpcProvider(rpcUrl) : ethers.getDefaultProvider();
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.TOKEN_REWARD, TOKEN_REWARD_ABI as any, provider);
      const currentNonce = await contract.userNonce(userAddressLower);
      // Contract requires exact equality: nonce == userNonce[msg.sender]
      nonce = BigInt(currentNonce);

      // Fallback: if signature verification fails with +1, we'll retry with currentNonce below

      nonceStr = nonce.toString();

      if (serverPrivateKey) {
        const wallet = new ethers.Wallet(serverPrivateKey);

        // Build message and sign
        let candidateNonce = nonce;
        let candidateSig: string | undefined;

        const providerForVerify = provider;
        const contractForVerify = contract;

        // Helper to sign for a given nonce
        const contractAddress = CONTRACT_ADDRESSES.TOKEN_REWARD as string;
        const signForNonce = async (n: bigint) => {
          const packedData = ethers.solidityPacked(
            ["address", "address", "uint256", "uint256", "address"],
            [userAddressLower, getTokenAddress(reward.tokenType), amountInWei, n, contractAddress]
          );
          const messageHash = ethers.keccak256(packedData);
          return wallet.signMessage(ethers.getBytes(messageHash));
        };

        // Try required nonce (current)
        candidateSig = await signForNonce(candidateNonce);
        let isValid = false;
        try {
          const tokenAddr = getTokenAddress(reward.tokenType);
          console.log(`🔍 Verifying signature for ${reward.tokenType}:`, {
            tokenAddress: tokenAddr,
            amountInWei: amountInWei.toString(),
            nonce: candidateNonce.toString(),
            hasSignature: !!candidateSig
          });
          
          isValid = await contractForVerify.verifySignature(
            tokenAddr,
            amountInWei,
            candidateNonce,
            candidateSig
          );
          
          console.log(`🔍 Signature verification result for ${reward.tokenType}:`, isValid);
        } catch (error) {
          console.log(`🔍 Signature verification error for ${reward.tokenType}:`, error);
          isValid = false;
        }

        if (!isValid) {
          // Retry with currentNonce + 1 as a fallback
          console.log(`🔍 Retrying signature verification for ${reward.tokenType} with nonce + 1`);
          candidateNonce = BigInt(currentNonce) + BigInt(1);
          const retrySig = await signForNonce(candidateNonce);
          try {
            const retryValid = await contractForVerify.verifySignature(
              getTokenAddress(reward.tokenType),
              amountInWei,
              candidateNonce,
              retrySig
            );
            console.log(`🔍 Retry signature verification result for ${reward.tokenType}:`, retryValid);
            if (retryValid) {
              nonce = candidateNonce;
              candidateSig = retrySig;
            }
          } catch (error) {
            console.log(`🔍 Retry signature verification error for ${reward.tokenType}:`, error);
            // leave as invalid; will return unsigned
          }
        }

        // Assign outputs if valid
        try {
          const finalValid = await contractForVerify.verifySignature(
            getTokenAddress(reward.tokenType),
            amountInWei,
            nonce,
            candidateSig as string
          );
          if (finalValid) {
            signature = candidateSig as string;
            nonceStr = nonce.toString();
            signatureVerified = true;
          } else {
            console.warn('Generated signature did not verify on-chain');
            signatureVerified = false;
          }
        } catch (e) {
          console.warn('Error verifying signature on-chain:', e);
          signatureVerified = false;
          signingError = (e as Error).message;
        }
      }
    } catch (e) {
      // Fallback to timestamp-based nonce if RPC not configured
      nonce = BigInt(Math.floor(Date.now() / 1000));
      nonceStr = nonce.toString();
      if (serverPrivateKey) {
        const wallet = new ethers.Wallet(serverPrivateKey);
        const packedData = ethers.solidityPacked(
          ["address", "address", "uint256", "uint256", "address"],
          [userAddressLower, getTokenAddress(reward.tokenType), amountInWei, nonce, (CONTRACT_ADDRESSES.TOKEN_REWARD as string)]
        );
        const messageHash = ethers.keccak256(packedData);
        signature = await wallet.signMessage(ethers.getBytes(messageHash));
        signatureVerified = undefined; // unknown in this path
      }
    }

    // If we still have no signature but we do have a server key, produce a best-effort signature
    if (!signature && serverPrivateKey) {
      try {
        const wallet = new ethers.Wallet(serverPrivateKey);
        const packedData = ethers.solidityPacked(
          ["address", "address", "uint256", "uint256", "address"],
          [userAddressLower, getTokenAddress(reward.tokenType), amountInWei, nonce, (CONTRACT_ADDRESSES.TOKEN_REWARD as string)]
        );
        const messageHash = ethers.keccak256(packedData);
        signature = await wallet.signMessage(ethers.getBytes(messageHash));
        signatureVerified = false;
      } catch (e) {
        signingError = (e as Error).message;
      }
    }

    console.log('Signature data:', {
      userAddress: userAddressLower,
      tokenAddress: getTokenAddress(reward.tokenType),
      tokenType: reward.tokenType,
      amount: reward.amount,
      amountInWei: amountInWei.toString(),
      nonce: nonceStr,
      hasSignature: !!signature,
      signatureVerified,
      signingError
    });
    
    // Additional debugging for bribe token
    if (reward.tokenType === 'bribe') {
      console.log('🔍 bribe TOKEN DEBUG:', {
        tokenAddress: getTokenAddress('bribe'),
        isAddressValid: getTokenAddress('bribe').startsWith('0x') && getTokenAddress('bribe').length === 42,
        amountInWei: amountInWei.toString(),
        nonce: nonceStr,
        signature: signature ? 'Present' : 'Missing',
        signatureVerified,
        signingError
      });
    }
  }
  
  return {
    success: true,
    tokenType: reward.tokenType,
    amount: reward.amount,
    amountInWei: reward.tokenType !== 'none' ? convertToWei(reward.amount).toString() : '0',
    signature,
    nonce: nonceStr,
    signatureVerified,
    signingError,
    claimsToday: newClaimsInPeriod,
    remainingClaims: Math.max(0, GIFT_BOXES_PER_DAY - newClaimsInPeriod)
  };
}

function getTokenAddress(tokenType: 'arb' | 'pepe' | 'boop' | 'bribe' | 'none'): string {
  // These should match your actual token contract addresses
  switch (tokenType) {
    case 'arb':
      return '0x912CE59144191C1204E64559FE8253a0e49E6548'; // Arbitrum token address
    case 'pepe':
      return '0x25d887Ce7a35172C62FeBFD67a1856F20FaEbB00'; // PEPE token address
    case 'boop':
      return '0x13A7DeDb7169a17bE92B0E3C7C2315B46f4772B3'; // Replace with actual BOOP address
    case 'bribe':
      return '0x014d482f8403227cf65e1512e94d95606d536b07'; // bribe token address
    case 'none':
      throw new Error('Cannot get token address for "none" type');
    default:
      throw new Error('Invalid token type');
  }
}

function convertToWei(amount: number): bigint {
  // Convert amount to 18 decimals (wei)
  return BigInt(Math.floor(amount * Math.pow(10, 18)));
}

export async function getUserGiftBoxStats(userAddress: string, fid?: number): Promise<{
  totalClaims: number;
  totalArb: number;
  totalPepe: number;
  totalBoop: number;
  totalbribe: number;
  claimsToday: number;
  remainingClaims: number;
  totalRewardsClaimed: number;
}> {
  const client = await clientPromise;
  const db = client.db('Flapbi');
  
  const userAddressLower = userAddress.toLowerCase();
  const currentTime = Date.now();
  
  // Get user's game score record by FID
  const userData = await db.collection('gameScores').findOne({
    fid: fid
  });
  
  // Get current period claims
  let claimsToday = 0;
  if (userData) {
    const lastGiftBoxUpdate = userData.lastGiftBoxUpdate || 0;
    const claimsInPeriod = userData.giftBoxClaimsInPeriod || 0;
    
    // Check if 12 hours have passed since last update
    if (currentTime >= lastGiftBoxUpdate + (12 * 60 * 60 * 1000)) {
      claimsToday = 0; // Reset if 12 hours passed
    } else {
      claimsToday = claimsInPeriod;
    }
  }
  
  // Get all-time stats from giftBoxClaims collection
  const allClaims = await db.collection('giftBoxClaims').find({
    userAddress: userAddressLower
  }).toArray();
  
  let totalArb = 0;
  let totalPepe = 0;
  let totalBoop = 0;
  let totalbribe = 0;
  
  allClaims.forEach((claim: any) => {
    if (claim.tokenType === 'arb') totalArb += claim.amount;
    else if (claim.tokenType === 'pepe') totalPepe += claim.amount;
    else if (claim.tokenType === 'boop') totalBoop += claim.amount;
    else if (claim.tokenType === 'bribe') totalbribe += claim.amount;
  });
  
  return {
    totalClaims: allClaims.length,
    totalArb,
    totalPepe,
    totalBoop,
    totalbribe,
    claimsToday,
    remainingClaims: Math.max(0, GIFT_BOXES_PER_DAY - claimsToday),
    totalRewardsClaimed: userData?.totalRewardsClaimed || 0
  };
} 