import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    // TODO: Add your own account association
    frame: {
      "name": "Flapbitrum",
      "version": "1.1",
      "iconUrl": "https://arb-flappyverse.vercel.app/icon.png",
      "homeUrl": "https://arb-flappyverse.vercel.app",
      "imageUrl": "https://arb-flappyverse.vercel.app/image.png",
      "splashImageUrl": "https://arb-flappyverse.vercel.app/splash.png",
      "splashBackgroundColor": "#ffffff",
      "webhookUrl": "https://arb-flappyverse.vercel.app/api/webhook",
      "subtitle": "Flap your way through Arbitrum",
      "description": "Flapbitrum is a fun, crypto-native twist on the classic flappy bird game — built on Arbitrum. Play, flap, and dodge the blocks while repping Layer 2. Compete with friends, share scores, and explore the Arbi-verse with every flap.",
      "primaryCategory": "games"
    },
    "accountAssociation": {
      "header": "eyJmaWQiOjExMDg1NzQsInR5cGUiOiJhdXRoIiwia2V5IjoiMHhkODUzOTVERWYzZDYzM0U3ODYyOTFiZjlERTU0ZDMyNGVlYkM3OTE3In0",
      "payload": "eyJkb21haW4iOiJmbGFwYml0cnVtLnZlcmNlbC5hcHAifQ",
      "signature": "4gTYaBgccYPoqlC9YVyq+HUV0zDxTAiC1cnbAOBIKBMFR69Wj+Y4osR2fAIi9ffUveTo9d6m7a7ftvdZ+HvXABw="
    }
  };

  return NextResponse.json(farcasterConfig);
}
