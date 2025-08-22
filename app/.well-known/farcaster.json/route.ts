import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    accountAssociation: {
      header: "",
      payload: "",
      signature: ""
    },
    frame: {
      version: "1",
      name: "Flapbitrum",
      iconUrl: `${APP_URL}/images/arb.png`,
      homeUrl: `${APP_URL}`,
      imageUrl: `${APP_URL}/images/arb.png`,
      screenshotUrls: [],
      tags: ["base", "farcaster", "miniapp", "game"],
      primaryCategory: "games",
      buttonTitle: "Play Flapbitrum",
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: "#14051a",
      subtitle: "Flap your way through Arbitrum",
      description: "Flapbitrum is a fun, crypto-native twist on the classic flappy bird game — built on Arbitrum. Play, flap, and dodge the blocks while repping Layer 2. Compete with friends, share scores, and explore the Arbi-verse with every flap.",
      webhookUrl: `${APP_URL}/api/webhook`,
      tagline: "Flap your way through Arbitrum",
      ogTitle: "Flapbitrum",
      ogDescription: "Flapbitrum is a fun, crypto-native twist on the classic flappy bird game — built on Arbitrum. Play, flap, and dodge the blocks while repping Layer 2. Compete with friends, share scores, and explore the Arbi-verse with every flap.",
      ogImageUrl: `${APP_URL}/images/arb.png`,
      heroImageUrl: `${APP_URL}/images/arb.png`,
    },
  };

  return NextResponse.json(farcasterConfig);
}
