const BASE_URL = 'https://simula-api-701226639755.us-central1.run.app';
export async function createSession(apiKey) {
    const res = await fetch(`${BASE_URL}/session/create`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: '{}',
    });
    if (!res.ok)
        throw new Error(`Session creation failed: ${res.status}`);
    const data = await res.json();
    return data.sessionId;
}
export async function fetchAdFromApi(sessionId, slot, position, signal) {
    const res = await fetch(`${BASE_URL}/render_ad/ssp/native`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, slot, position }),
        signal,
    });
    if (!res.ok)
        throw new Error(`Ad fetch failed: ${res.status}`);
    const aid = res.headers.get('aid');
    if (!aid)
        throw new Error('Missing aid header');
    const html = await res.text();
    return { aid, html };
}
export async function trackImpression(aid, apiKey) {
    await fetch(`${BASE_URL}/track/engagement/impression/${aid}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: '{}',
    });
}
