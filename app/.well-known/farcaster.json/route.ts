import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    // TODO: Add your own account association
    frame: {
      frame: {
        version: "1",
        name: "Flapbitrum",
        iconUrl: `${APP_URL}/images/arb.png`,
        homeUrl: `${APP_URL}`,
        imageUrl: `${APP_URL}/images/arb.png`,
        screenshotUrls: [],
        tags: ["monad", "farcaster", "miniapp", "template"],
        primaryCategory: "developer-tools",
        buttonTitle: "Play Flapbitrum",
        splashImageUrl: `${APP_URL}/images/arb.png`,
        splashBackgroundColor: "#ffffff",
        webhookUrl: `${APP_URL}/api/webhook`,
      },
    },
   
  };

  return NextResponse.json(farcasterConfig);
}
