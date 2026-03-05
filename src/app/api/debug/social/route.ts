import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};
  const token = process.env.X_BEARER_TOKEN;

  results.hasToken = !!token;
  results.tokenPrefix = token ? token.slice(0, 10) + "..." : "missing";

  // Test X API user lookup for bankrbot
  try {
    const res = await fetch(
      "https://api.twitter.com/2/users/by/username/bankrbot?user.fields=public_metrics",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    results.xStatus = res.status;
    const data = await res.json();
    results.xData = data;
  } catch (err) {
    results.xError = String(err);
  }

  // Test GitHub for BankrBot
  try {
    const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
    const ghToken = process.env.GITHUB_TOKEN;
    results.hasGhToken = !!ghToken;
    if (ghToken) headers["Authorization"] = `Bearer ${ghToken}`;

    // BankrBot org
    const res = await fetch("https://api.github.com/orgs/BankrBot/repos?sort=stars&per_page=3", { headers });
    results.ghStatus = res.status;
    const repos = await res.json();
    results.ghRepos = Array.isArray(repos) ? repos.map((r: { full_name: string; stargazers_count: number }) => ({ name: r.full_name, stars: r.stargazers_count })) : repos;
  } catch (err) {
    results.ghError = String(err);
  }

  return NextResponse.json(results);
}
