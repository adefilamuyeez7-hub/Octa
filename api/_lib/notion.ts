const NOTION_VERSION = "2022-06-28";
const NOTION_AUTHORIZE = "https://www.notion.com/oauth2/v2/authorize";
const NOTION_TOKEN = "https://www.notion.com/oauth2/v2/token";
const NOTION_API = "https://api.notion.com/v1";
const NOTION_STATE_COOKIE = "octa_notion_state";
const NOTION_ACCESS_COOKIE = "octa_notion_access_token";

type JsonRecord = Record<string, unknown>;

function buildCookie(name: string, value: string, maxAgeSeconds: number) {
  const attrs = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Secure",
    `Max-Age=${maxAgeSeconds}`,
  ];
  return attrs.join("; ");
}

function readCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader.split(";").map((part) => part.trim());
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split("=");
    if (key === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function getConfiguredRedirectBase(request: Request): string {
  return (process.env.NOTION_REDIRECT_URI || "").trim() || getBaseUrl(request);
}

function getCallbackUrl(request: Request): string {
  const configured = getConfiguredRedirectBase(request).replace(/\/$/, "");
  return configured.endsWith("/api/notion/callback")
    ? configured
    : `${configured}/api/notion/callback`;
}

export function getNotionStatus(request: Request) {
  const hasClientId = Boolean(process.env.NOTION_CLIENT_ID);
  const hasClientSecret = Boolean(process.env.NOTION_CLIENT_SECRET);
  const hasDatabaseId = Boolean(process.env.NOTION_DATABASE_ID);
  const hasAccessToken = Boolean(readCookie(request, NOTION_ACCESS_COOKIE) || process.env.NOTION_TOKEN);

  return {
    oauthReady: hasClientId && hasClientSecret,
    databaseReady: hasDatabaseId,
    connected: hasAccessToken && hasDatabaseId,
  };
}

async function notionFetch(path: string, init: RequestInit, accessToken: string) {
  return fetch(`${NOTION_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

export async function pushToNotion(request: Request, task: JsonRecord) {
  const accessToken = readCookie(request, NOTION_ACCESS_COOKIE) || process.env.NOTION_TOKEN || "";
  const databaseId = process.env.NOTION_DATABASE_ID || "";

  if (!accessToken || !databaseId) {
    return { ok: false, fallback: true, reason: "Notion is not configured" };
  }

  const payload = {
    parent: { database_id: databaseId },
    properties: {
      Name: { title: [{ text: { content: String(task.title ?? task.text ?? "Task") } }] },
      Notes: { rich_text: [{ text: { content: String(task.text ?? "") } }] },
    },
  };

  const res = await notionFetch("/pages", { method: "POST", body: JSON.stringify(payload) }, accessToken);
  if (!res.ok) {
    return { ok: false, status: res.status, body: await res.text() };
  }

  return { ok: true, result: (await res.json()) as JsonRecord };
}

export async function handleNotionStart(request: Request) {
  const clientId = process.env.NOTION_CLIENT_ID || "";
  if (!clientId) {
    return new Response("NOTION_CLIENT_ID is missing", { status: 500 });
  }

  const params = new URL(request.url).searchParams;
  const redirectAfter = params.get("redirect") || "/dashboard";
  const state = Math.random().toString(36).slice(2);
  const callbackUrl = getCallbackUrl(request);
  const qs = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    owner: "user",
    redirect_uri: callbackUrl,
    state,
  });

  const response = Response.redirect(`${NOTION_AUTHORIZE}?${qs.toString()}`);
  response.headers.append("Set-Cookie", buildCookie(NOTION_STATE_COOKIE, state, 10 * 60));
  response.headers.append("Set-Cookie", buildCookie("octa_notion_redirect", redirectAfter, 10 * 60));
  return response;
}

export async function handleNotionCallback(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = readCookie(request, NOTION_STATE_COOKIE);
  const redirectAfter = readCookie(request, "octa_notion_redirect") || "/dashboard";

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }
  if (!state || !savedState || state !== savedState) {
    return new Response("Invalid OAuth state", { status: 400 });
  }

  const clientId = process.env.NOTION_CLIENT_ID || "";
  const clientSecret = process.env.NOTION_CLIENT_SECRET || "";
  if (!clientId || !clientSecret) {
    return new Response("Notion OAuth is not configured", { status: 500 });
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getCallbackUrl(request),
    client_id: clientId,
    client_secret: clientSecret,
  });

  const tokenRes = await fetch(NOTION_TOKEN, { method: "POST", body });
  const tokenJson = (await tokenRes.json()) as JsonRecord;
  if (!tokenRes.ok) {
    return new Response(`Notion token exchange failed: ${JSON.stringify(tokenJson)}`, { status: 502 });
  }

  const accessToken = typeof tokenJson.access_token === "string" ? tokenJson.access_token : "";
  if (!accessToken) {
    return new Response("Notion token response was missing access_token", { status: 502 });
  }

  const response = new Response(
    `<html><body><h1>Notion connected.</h1><p>You can return to the dashboard.</p><script>window.location.replace(${JSON.stringify(
      redirectAfter,
    )})</script></body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
  response.headers.append("Set-Cookie", buildCookie(NOTION_ACCESS_COOKIE, accessToken, 60 * 60 * 24 * 30));
  response.headers.append("Set-Cookie", buildCookie(NOTION_STATE_COOKIE, "", 0));
  response.headers.append("Set-Cookie", buildCookie("octa_notion_redirect", "", 0));
  return response;
}
