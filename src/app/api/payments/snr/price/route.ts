import { NextResponse } from "next/server";
import {
  getSNRAmount,
  formatSNRAmount,
} from "@/lib/snr-price";

export async function GET() {
  try {
    const { amount, priceUsd, totalUsd } = await getSNRAmount();
    return NextResponse.json({
      amount,
      formatted: formatSNRAmount(amount),
      priceUsd,
      totalUsd,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch SNR price" },
      { status: 503 }
    );
  }
}
