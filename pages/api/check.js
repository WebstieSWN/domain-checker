export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { domains } = req.body;

  if (!Array.isArray(domains) || domains.length === 0) {
    return res.status(400).json({ error: 'No domains provided' });
  }

  const safe = domains.filter((d) => /^[a-z0-9][a-z0-9.-]{0,251}[a-z0-9]$/i.test(d));
  if (safe.length === 0) {
    return res.status(400).json({ error: 'Invalid domain names' });
  }

  const checkOne = async (domain) => {
    try {
      const response = await fetch(`https://rdap.org/domain/${domain}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(6000),
      });
      // 200 = domain exists (taken), 404 = available
      return { domain, available: response.status === 404 };
    } catch {
      // Network/timeout — mark as unknown rather than crashing
      return { domain, available: null };
    }
  };

  const results = await Promise.all(safe.map(checkOne));
  return res.status(200).json({ results });
}
