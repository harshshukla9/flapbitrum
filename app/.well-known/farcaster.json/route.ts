import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    frame: {
      "name": "Flapbitrum",
      "version": "1",
      "iconUrl": "https://flapbitrum.vercel.app/images/logo.png",
      "homeUrl": "https://flapbitrum.vercel.app",
      "imageUrl": "https://flapbitrum.vercel.app/images/image.png",
      "splashImageUrl": "https://flapbitrum.vercel.app/images/splash.png",
      "splashBackgroundColor": "#ffffff",
      "webhookUrl": "https://flapbitrum.vercel.app/api/webhook",
      "subtitle": "Flap your way through Arbitrum",
      "description": "Flapbitrum is a fun, crypto-native twist on the classic flappy bird game — built on Arbitrum.",
      "primaryCategory": "games"
    },
    "accountAssociation": {
      "header": "eyJmaWQiOjExMDg1NzQsInR5cGUiOiJhdXRoIiwia2V5IjoiMHhkODUzOTVERWYzZDYzM0U3ODYyOTFiZjlERTU0ZDMyNGVlYkM3OTE3In0",
      "payload": "eyJkb21haW4iOiJmbGFwYml0cnVtLnZlcmNlbC5hcHAifQ",
      "signature": "4gTYaBgccYPoqlC9YVyq+HUV0zDxTAiC1cnbAOBIKBMFR69Wj+Y4osR2fAIi9ffUveTo9d6m7a7ftvdZ+HvXABw="
    },
    
    "baseBuilder": {
    "allowedAddresses": ["0x721f07F9E4b5b2D522D0D657cCEebfb64487d8DC"]
  }
  };

  return NextResponse.json(farcasterConfig);
}
