import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const client = await clientPromise;
    const db = client.db('Flapbi');
    
    // Aggregate token rewards by user
    const pipeline = [
      {
        $group: {
          _id: '$userAddress',
          username: { $first: '$username' },
          fid: { $first: '$fid' },
          pfp: { $first: '$pfp' },
          score: { $first: '$score' },
          totalClaims: {
            $sum: 1
          },
          tokens: {
            $push: {
              symbol: '$tokenSymbol',
              amount: '$amount'
            }
          },
          lastClaimDate: {
            $max: '$createdAt'
          }
        }
      },
      {
        $addFields: {
          // Calculate total amounts by token type
          arbAmount: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$tokens',
                    cond: { $eq: ['$$this.symbol', 'ARB'] }
                  }
                },
                as: 'token',
                in: { $toDouble: '$$token.amount' }
              }
            }
          },
          pepeAmount: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$tokens',
                    cond: { $eq: ['$$this.symbol', 'PEPE'] }
                  }
                },
                as: 'token',
                in: { $toDouble: '$$token.amount' }
              }
            }
          },
          boopAmount: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$tokens',
                    cond: { $eq: ['$$this.symbol', 'BOOP'] }
                  }
                },
                as: 'token',
                in: { $toDouble: '$$token.amount' }
              }
            }
          }
        }
      },
      {
        $addFields: {
          // Calculate total claim value (you can add USD prices later)
          totalClaimValue: {
            $add: ['$arbAmount', '$pepeAmount', '$boopAmount']
          }
        }
      },
      {
        $sort: {
          totalClaimValue: -1,
          totalClaims: -1,
          lastClaimDate: -1
        }
      },
      {
        $skip: offset
      },
      {
        $limit: limit
      }
    ];
    
    const leaderboard = await db.collection('tokenRewards').aggregate(pipeline).toArray();
    
    // Format the response
    const formattedLeaderboard = leaderboard.map((entry, index) => ({
      rank: offset + index + 1,
      userAddress: entry._id,
      username: entry.username || '',
      fid: entry.fid || '',
      pfp: entry.pfp || '',
      score: entry.score || '0',
      totalClaims: entry.totalClaims,
      tokenAmounts: {
        arb: formatTokenAmount(entry.arbAmount, 'ARB'),
        pepe: formatTokenAmount(entry.pepeAmount, 'PEPE'),
        boop: formatTokenAmount(entry.boopAmount, 'BOOP'),
      },
      totalClaimValue: entry.totalClaimValue,
      lastClaimDate: entry.lastClaimDate,
    }));
    
    // Get total count for pagination
    const totalCount = await db.collection('tokenRewards').distinct('userAddress').then(users => users.length);
    
    return NextResponse.json({
      success: true,
      leaderboard: formattedLeaderboard,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      totalUsers: totalCount
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching token claims leaderboard:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Helper function to format token amounts
function formatTokenAmount(amount: number, tokenSymbol: string): string {
  if (amount === 0) return '0';
  
  const decimals = 18; // All tokens have 18 decimals
  const formatted = (amount / Math.pow(10, decimals)).toFixed(4);
  
  // Remove trailing zeros
  return parseFloat(formatted).toString();
}
