import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Trigger the token rewards sync
    const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sync-token-rewards`, {
      method: 'POST',
    });
    
    const syncData = await syncResponse.json();
    
    if (syncData.success) {
      return NextResponse.json({
        success: true,
        message: 'Sync completed successfully',
        eventsProcessed: syncData.eventsProcessed,
        fromBlock: syncData.fromBlock,
        toBlock: syncData.toBlock,
      });
    } else {
      return NextResponse.json(
        { success: false, error: syncData.error },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('❌ Error in sync-now:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
