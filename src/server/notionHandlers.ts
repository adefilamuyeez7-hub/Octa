import jsonDb from '../lib/jsonDb';

const NOTION_AUTHORIZE = 'https://www.notion.com/oauth2/v2/authorize';
const NOTION_TOKEN = 'https://www.notion.com/oauth2/v2/token';

export async function notionStart(request: Request) {
  const params = new URL(request.url).searchParams;
  const redirect = params.get('redirect') || '/';
  const clientId = process.env.NOTION_CLIENT_ID || '';
  const state = Math.random().toString(36).slice(2);
  const qs = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    owner: 'user',
    redirect_uri: (process.env.NOTION_REDIRECT_URI || '') + '/api/notion/callback',
    state,
  });
  // store state in DB for later verification
  await jsonDb.pushTask({ type: 'notion_oauth_state', state, createdAt: new Date().toISOString() });
  return Response.redirect(`${NOTION_AUTHORIZE}?${qs.toString()}`);
}

export async function notionCallback(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (!code) return new Response('Missing code', { status: 400 });

    const clientId = process.env.NOTION_CLIENT_ID || '';
    const clientSecret = process.env.NOTION_CLIENT_SECRET || '';
    const redirectUri = (process.env.NOTION_REDIRECT_URI || '') + '/api/notion/callback';

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const tokenRes = await fetch(NOTION_TOKEN, { method: 'POST', body });
    const tokenJson = await tokenRes.json();

    await jsonDb.pushTask({ type: 'notion_token', token: tokenJson, state, createdAt: new Date().toISOString() });

    return new Response('<html><body><h1>Notion connected — you can close this window.</h1></body></html>', { headers: { 'content-type': 'text/html' } });
  } catch (e) {
    console.error(e);
    return new Response('Callback error', { status: 500 });
  }
}
