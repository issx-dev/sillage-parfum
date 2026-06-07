import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

// This route reads request.nextUrl.searchParams, which would otherwise
// trigger a DYNAMIC_SERVER_USAGE bailout that the try-catch below would
// swallow and mislog as a Stripe error during `next build`. Declaring
// force-dynamic tells Next.js to skip the static check entirely.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session_id parameter" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      id: session.id,
      amountTotal: session.amount_total || 0,
      customerEmail: session.customer_email || "",
    });
  } catch (error) {
    console.error("Error retrieving Stripe session:", error);
    return NextResponse.json(
      { error: "Failed to retrieve session" },
      { status: 500 }
    );
  }
}
