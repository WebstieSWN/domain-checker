import { useState, useRef } from 'react';
import Head from 'next/head';

const TLDS = ['.com', '.net', '.org', '.io', '.co', '.dev', '.ai'];
const DEFAULT_TLDS = ['.com', '.net', '.org'];

const t = {
  en: {
    title:        'Find Your Perfect Domain',
    subtitle:     'Check availability across multiple extensions instantly.',
    placeholder:  'your website name here',
    checkBtn:     'Check',
    available:    'Available',
    taken:        'Taken',
    unknown:      'Unknown',
    checking:     'Checking availability…',
    errorTld:     'Select at least one extension.',
    summaryOf:    (avail, total) =>
      `${avail} available · ${total - avail} taken`,
    premium:      'Premium',
  },
  fr: {
    title:        'Trouvez Votre Domaine Idéal',
    subtitle:     'Vérifiez la disponibilité sur plusieurs extensions.',
    placeholder:  'nom de votre site ici',
    checkBtn:     'Rechercher',
    available:    'Disponible',
    taken:        'Indisponible',
    unknown:      'Inconnu',
    checking:     'Vérification en cours…',
    errorTld:     'Sélectionnez au moins une extension.',
    summaryOf:    (avail, total) =>
      `${avail} disponible · ${total - avail} indisponible`,
    premium:      'Premium',
  },
};

export default function DomainChecker() {
  const [lang, setLang]             = useState('en');
  const [query, setQuery]           = useState('');
  const [selected, setSelected]     = useState(DEFAULT_TLDS);
  const [results, setResults]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [checked, setChecked]       = useState(false);
  const inputRef                    = useRef(null);

  const tx = t[lang];

  const toggleTld = (tld) =>
    setSelected((prev) =>
      prev.includes(tld) ? prev.filter((t) => t !== tld) : [...prev, tld]
    );

  const handleCheck = async () => {
    const base = query.trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .split('/')[0]
      .split('.')[0];

    if (!base) { inputRef.current?.focus(); return; }
    if (selected.length === 0) { setError(tx.errorTld); return; }

    setLoading(true);
    setError('');
    setResults([]);
    setChecked(false);

    try {
      const domains = selected.map((tld) => `${base}${tld}`);
      const res  = await fetch('/api/check', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ domains }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const sorted = [...data.results].sort((a, b) => b.available - a.available);
      setResults(sorted);
      setChecked(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const availableCount = results.filter((r) => r.available).length;

  return (
    <>
      <Head>
        <title>Domain Checker — Agency Nady</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main style={s.page}>
        <div style={s.card}>

          {/* ── Header ── */}
          <div style={s.header}>
            <div style={s.topRow}>
              <div style={s.logoRow}>
                <img src="/astronaut.png" alt="Start Website Now" style={s.logoImg} />
                <span style={s.logoText}>Start Website Now</span>
              </div>
              {/* Language dropdown */}
              <select
                value={lang}
                onChange={(e) => { setLang(e.target.value); setResults([]); setChecked(false); setError(''); }}
                style={s.langSelect}
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </div>
            <h2 style={s.heading}>{tx.title}</h2>
            <p style={s.subheading}>{tx.subtitle}</p>
          </div>

          {/* ── Search row ── */}
          <div style={s.searchRow}>
            <div style={s.inputWrap}>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                placeholder={tx.placeholder}
                style={s.input}
                spellCheck={false}
                autoComplete="off"
              />
            </div>
            <button
              onClick={handleCheck}
              disabled={loading}
              style={loading ? { ...s.checkBtn, opacity: 0.75, cursor: 'not-allowed' } : s.checkBtn}
              onMouseEnter={(e) => {
                if (!loading) Object.assign(e.currentTarget.style, s.checkBtnHover);
              }}
              onMouseLeave={(e) => {
                if (!loading) Object.assign(e.currentTarget.style, s.checkBtn);
              }}
            >
              {loading ? <span style={s.spinner} /> : tx.checkBtn}
            </button>
          </div>

          {/* ── TLD pills ── */}
          <div style={s.tldRow}>
            {TLDS.map((tld) => {
              const active = selected.includes(tld);
              return (
                <button
                  key={tld}
                  onClick={() => toggleTld(tld)}
                  style={active ? s.tldActive : s.tldInactive}
                  onMouseEnter={(e) => {
                    if (!active) Object.assign(e.currentTarget.style, s.tldHover);
                  }}
                  onMouseLeave={(e) => {
                    if (!active) Object.assign(e.currentTarget.style, s.tldInactive);
                  }}
                >
                  {tld}
                </button>
              );
            })}
          </div>

          {/* ── Error ── */}
          {error && (
            <div style={s.errorBox}>
              <span style={s.errorDot} />
              {error}
            </div>
          )}

          {/* ── Summary bar ── */}
          {checked && results.length > 0 && (
            <div style={s.summaryBar}>
              <span style={s.summaryText}>
                {tx.summaryOf(availableCount, results.length)}
              </span>
            </div>
          )}

          {/* ── Results ── */}
          {results.length > 0 && (
            <ul style={s.results}>
              {results.map((r, i) => (
                <li
                  key={r.domain}
                  style={{
                    ...s.resultRow,
                    animationDelay: `${i * 50}ms`,
                  }}
                >
                  <div style={s.resultLeft}>
                    <span style={r.available ? s.dotGreen : s.dotRed} />
                    <span style={s.domainText}>{r.domain}</span>
                    {r.isPremium && <span style={s.premiumTag}>{tx.premium}</span>}
                  </div>

                  <div style={s.resultRight}>
                    {r.available === null
                      ? <span style={s.unknownLabel}>{tx.unknown}</span>
                      : r.available
                        ? <span style={s.availableLabel}>{tx.available}</span>
                        : <span style={s.takenLabel}>{tx.taken}</span>
                    }
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* ── Loading placeholder ── */}
          {loading && (
            <div style={s.loadingState}>
              <div style={s.loadingSpinner} />
              <span style={s.loadingText}>{tx.checking}</span>
            </div>
          )}

        </div>
      </main>
    </>
  );
}

/* ─────────────────────────────────────────
   Styles — all tokens from agencynady DS
───────────────────────────────────────── */
const s = {
  page: {
    minHeight: '100vh',
    background: '#eef4fb',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '40px 20px 60px',
  },

  card: {
    width: '100%',
    maxWidth: '580px',
    background: '#ffffff',
    borderRadius: '16px',
    padding: '40px 36px',
    boxShadow: '0px 16px 40px rgba(11, 61, 145, 0.10)',
  },

  // ── Header
  header: {
    marginBottom: '32px',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  langSelect: {
    fontFamily: "'Ubuntu', sans-serif",
    fontWeight: 700,
    fontSize: '13px',
    color: '#334155',
    background: '#f7f9fc',
    border: '2px solid #d6e6ff',
    borderRadius: '8px',
    padding: '6px 10px',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    paddingRight: '28px',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23647182' stroke-width='1.8' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
  },
  logoImg: {
    width: '40px',
    height: '40px',
    objectFit: 'contain',
    flexShrink: 0,
  },
  logoText: {
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 600,
    fontSize: '24px',
    color: '#647182',
    letterSpacing: '-0.3px',
  },
  heading: {
    fontFamily: "'Ubuntu', sans-serif",
    fontWeight: 700,
    fontSize: '30px',
    color: '#0b1b33',
    letterSpacing: '-0.5px',
    lineHeight: 1.15,
  },
  subheading: {
    fontFamily: "'Ubuntu', sans-serif",
    fontWeight: 400,
    fontSize: '16px',
    color: '#647182',
    marginTop: '8px',
  },

  // ── Search
  searchRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '18px',
    alignItems: 'center',
  },
  inputWrap: {
    flex: 1,
  },
  input: {
    width: '100%',
    height: '60px',
    background: '#f7f9fc',
    border: '2px solid #d6e6ff',
    borderRadius: '12px',
    padding: '0 18px',
    fontSize: '18px',
    fontWeight: 400,
    color: '#334155',
    transition: 'border-color 0.15s',
  },

  // Primary button — light background
  checkBtn: {
    height: '60px',
    minWidth: '140px',
    background: '#135fc2',
    color: '#ffffff',
    border: '4px solid #135fc2',
    borderRadius: '12px',
    fontFamily: "'Ubuntu', sans-serif",
    fontWeight: 700,
    fontSize: '20px',
    padding: '0 28px',
    boxShadow: '0px 10px 20px rgba(11, 61, 145, 0.20)',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkBtnHover: {
    height: '60px',
    minWidth: '140px',
    background: '#176bd1',
    color: '#ffffff',
    border: '4px solid #176bd1',
    borderRadius: '12px',
    fontFamily: "'Ubuntu', sans-serif",
    fontWeight: 700,
    fontSize: '20px',
    padding: '0 28px',
    boxShadow: '0px 14px 20px rgba(11, 61, 145, 0.30)',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    cursor: 'pointer',
  },

  spinner: {
    display: 'inline-block',
    width: '20px',
    height: '20px',
    border: '2.5px solid rgba(255,255,255,0.35)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },

  // ── TLD pills — secondary button on light
  tldRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '28px',
  },
  tldInactive: {
    height: '40px',
    padding: '0 16px',
    background: 'transparent',
    border: '2px solid #d6e6ff',
    borderRadius: '10px',
    fontFamily: "'Ubuntu', sans-serif",
    fontWeight: 700,
    fontSize: '14px',
    color: '#647182',
    transition: 'all 0.15s',
    cursor: 'pointer',
  },
  tldHover: {
    height: '40px',
    padding: '0 16px',
    background: '#eaf7ff',
    border: '2px solid #2fb7ff',
    borderRadius: '10px',
    fontFamily: "'Ubuntu', sans-serif",
    fontWeight: 700,
    fontSize: '14px',
    color: '#007db8',
    transition: 'all 0.15s',
    cursor: 'pointer',
  },
  tldActive: {
    height: '40px',
    padding: '0 16px',
    background: '#135fc2',
    border: '2px solid #135fc2',
    borderRadius: '10px',
    fontFamily: "'Ubuntu', sans-serif",
    fontWeight: 700,
    fontSize: '14px',
    color: '#ffffff',
    cursor: 'pointer',
  },

  // ── Error
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(217, 59, 59, 0.07)',
    border: '1.5px solid rgba(217, 59, 59, 0.25)',
    borderRadius: '10px',
    padding: '12px 16px',
    color: '#d93b3b',
    fontWeight: 400,
    fontSize: '14px',
    marginBottom: '20px',
  },
  errorDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#d93b3b',
    flexShrink: 0,
  },

  // ── Summary
  summaryBar: {
    marginBottom: '14px',
  },
  summaryText: {
    fontFamily: "'Ubuntu', sans-serif",
    fontSize: '14px',
    color: '#647182',
  },

  // ── Results list
  results: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  resultRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#f7f9fc',
    border: '1.5px solid #d6e6ff',
    borderRadius: '12px',
    padding: '14px 18px',
    animation: 'fadeSlideIn 0.25s ease both',
  },
  resultLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  dotGreen: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#0da85a',
    flexShrink: 0,
  },
  dotRed: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#d93b3b',
    flexShrink: 0,
  },
  domainText: {
    fontFamily: "'Ubuntu', sans-serif",
    fontWeight: 700,
    fontSize: '16px',
    color: '#0b1b33',
  },
  premiumTag: {
    background: 'rgba(200, 120, 0, 0.10)',
    border: '1.5px solid rgba(200, 120, 0, 0.35)',
    color: '#c87800',
    fontFamily: "'Ubuntu', sans-serif",
    fontWeight: 700,
    fontSize: '11px',
    borderRadius: '6px',
    padding: '2px 8px',
    letterSpacing: '0.3px',
  },
  resultRight: {
    flexShrink: 0,
  },

  availableLabel: {
    fontFamily: "'Ubuntu', sans-serif",
    fontWeight: 700,
    fontSize: '14px',
    color: '#0da85a',
    background: 'rgba(13, 168, 90, 0.09)',
    border: '1.5px solid rgba(13, 168, 90, 0.3)',
    borderRadius: '8px',
    padding: '4px 12px',
  },
  takenLabel: {
    fontFamily: "'Ubuntu', sans-serif",
    fontWeight: 700,
    fontSize: '14px',
    color: '#d93b3b',
    background: 'rgba(217, 59, 59, 0.07)',
    border: '1.5px solid rgba(217, 59, 59, 0.22)',
    borderRadius: '8px',
    padding: '4px 12px',
  },
  unknownLabel: {
    fontFamily: "'Ubuntu', sans-serif",
    fontWeight: 700,
    fontSize: '14px',
    color: '#647182',
    background: 'rgba(100, 113, 130, 0.08)',
    border: '1.5px solid rgba(100, 113, 130, 0.22)',
    borderRadius: '8px',
    padding: '4px 12px',
  },

  // ── Loading
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
    padding: '32px 0 8px',
  },
  loadingSpinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #d6e6ff',
    borderTopColor: '#135fc2',
    borderRadius: '50%',
    animation: 'spin 0.75s linear infinite',
  },
  loadingText: {
    fontFamily: "'Ubuntu', sans-serif",
    fontSize: '15px',
    color: '#647182',
  },
};
