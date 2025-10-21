import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔄 Manual sync triggered...');
    
    // Call the sync endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const syncResponse = await fetch(`${baseUrl}/api/sync-token-rewards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const syncData = await syncResponse.json();
    
    if (syncData.success) {
      return NextResponse.json({
        success: true,
        message: `Manual sync completed successfully!`,
        eventsProcessed: syncData.eventsProcessed,
        fromBlock: syncData.fromBlock,
        toBlock: syncData.toBlock,
        instructions: [
          '1. Events have been synced from blockchain',
          '2. Go to /token-claims-leaderboard to see results',
          '3. If still empty, check contract addresses in sync API'
        ]
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: syncData.error,
          message: 'Sync failed. Check contract addresses and blockchain connection.'
        },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('❌ Manual sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        message: 'Failed to trigger sync. Make sure server is running.'
      },
      { status: 500 }
    );
  }
}
