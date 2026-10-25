'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  Bookmark,
  Check,
  Compass,
  MapPin,
  Plus,
  X,
  ExternalLink,
  RotateCcw,
  LoaderCircle,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import {
  AREAS,
  DEFAULT_INTERESTS,
  publishedHours,
  tokyoDate,
  visitDates,
  type Interest,
  type Mode,
  type Place,
} from '@/lib/discovery';
import { TasteDiscovery } from '@/components/taste-discovery';
import {writeBrowserTaste} from '@/lib/browser-taste';
import { EMPTY_TASTE, selectedTopics, type TasteProfile } from '@/lib/taste';
import { DiscoveryMap } from '@/components/discovery-map';

type Reply = {
  places: Place[];
  notice?: string;
  retrievedAt?: string;
  examined: number;
};

const modes: Mode[] = ['familiar', 'explore', 'surprise'];
const modeCopy: Record<Mode, string> = {
  familiar: 'Stay close to what you love.',
  explore: 'A new angle on your kind of thing.',
  surprise: 'Follow a lateral connection.',
};
const modeLabel: Record<Mode, string> = {
  familiar: 'Familiar',
  explore: 'Explore',
  surprise: 'Surprise',
};

function readStored<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback;
  } catch {
    return fallback;
  }
}

function shortDate(d: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(d + 'T00:00:00+09:00'));
}

function CompassArt({ mode }: { mode: Mode }) {
  return (
    <div className={'taste-compass ' + mode} aria-hidden="true">
      <div className="compass-rim">
        <span className="compass-pt north">FAMILIAR</span>
        <span className="compass-pt east">EXPLORE</span>
        <span className="compass-pt south">SURPRISE</span>
        <span className="compass-pt west">TASTE</span>
        <div className="compass-face">
          <div className="compass-reticle" />
          <div className="compass-needle" />
          <div className="compass-pivot" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<Interest[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [area, setArea] = useState<keyof typeof AREAS>('tokyo');
  const [when, setWhen] = useState('weekend');
  const [date, setDate] = useState(tokyoDate());
  const [mode, setMode] = useState<Mode>('explore');
  const [reply, setReply] = useState<Reply | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<'discover' | 'saved' | 'taste'>('discover');
  const [saved, setSaved] = useState<Place[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);
  const [toast, setToast] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [searchedDates, setSearchedDates] = useState<string[]>([]);
  const [searchedMode, setSearchedMode] = useState<Mode>('explore');
  const [taste, setTaste] = useState<TasteProfile>(EMPTY_TASTE);

  const resultRef = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);
  const searchAbort = useRef<AbortController | null>(null);
  const sequence = useRef(0);

  useEffect(() => {
    const s = readStored<unknown>('sidequest-saved-v1', []);
    if (Array.isArray(s)) {
      setSaved(
        s
          .filter(
            (p) =>
              p &&
              typeof p.id === 'string' &&
              typeof p.name === 'string' &&
              p.hours &&
              p.signals
          )
          .slice(0, 100)
      );
    }
    try {
      const r = JSON.parse(sessionStorage.getItem('sidequest-rejected-v1') || '[]');
      if (Array.isArray(r)) setRejected(r.filter((x) => typeof x === 'string'));
    } catch {}

    const i = readStored<unknown>('sidequest-interests-v1', null);
    if (
      Array.isArray(i) &&
      i.length > 0 &&
      i.length <= 8 &&
      i.every((v) => v && typeof v.id === 'string' && typeof v.name === 'string')
    ) {
      setInterests(i);
    } else {
      setInterests(DEFAULT_INTERESTS);
    }
    setReady(true);
    return () => {
      abort.current?.abort();
      searchAbort.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem('sidequest-saved-v1', JSON.stringify(saved));
      localStorage.setItem('sidequest-interests-v1', JSON.stringify(interests));
      sessionStorage.setItem('sidequest-rejected-v1', JSON.stringify(rejected));
    } catch {
      setStorageError(true);
    }
  }, [saved, interests, rejected, ready]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  function applyTaste(profile: TasteProfile, anchors: Interest[]) {
    setTaste(profile);
    try{writeBrowserTaste(localStorage,profile.exploration?.picks.map(p=>({id:p.id,name:p.name,type:p.type,feeling:p.feeling}))||anchors.map(p=>({...p,feeling:"love" as const})));}catch{}
    if (anchors.length) {
      setInterests(anchors);
      setChanged(true);
    }
    setView('discover');
    setTimeout(() => {
      resultRef.current?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
        block: 'start',
      });
    }, 30);
    setToast('Your taste profile has been applied.');
  }

  function exploreTaste() {
    setView('taste');
    setTimeout(() => {
      resultRef.current?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
        block: 'start',
      });
    }, 30);
  }

  async function searchInterests(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    searchAbort.current?.abort();
    const c = new AbortController();
    searchAbort.current = c;
    setSearching(true);
    setSearchError('');
    setMatches([]);
    try {
      const r = await fetch('/api/search?q=' + encodeURIComponent(query.trim()), {
        signal: c.signal,
      });
      const b = (await r.json()) as { interests: Interest[]; error?: string };
      if (!r.ok) throw Error(b.error || 'Search failed.');
      setMatches(b.interests);
      if (!b.interests.length) {
        setSearchError('No match found. Try an artist, film, book, or brand.');
      }
    } catch (e) {
      if (!c.signal.aborted) {
        setSearchError(e instanceof Error ? e.message : 'Search failed.');
      }
    } finally {
      if (!c.signal.aborted) setSearching(false);
    }
  }

  function addInterest(i: Interest) {
    if (interests.length >= 8 || interests.some((x) => x.id === i.id)) return;
    setInterests([...interests, i]);
    setMatches([]);
    setQuery('');
    setChanged(true);
  }

  async function discover(nextMode = mode, nextInterests = interests, nextTaste = taste) {
    abort.current?.abort();
    const c = new AbortController();
    abort.current = c;
    const seq = ++sequence.current;
    setPending(true);
    setError('');
    setView('discover');
    setOpen(null);
    const dates = visitDates(when, date);

    try {
      const r = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: c.signal,
        body: JSON.stringify({
          interests: nextInterests,
          ...(nextTaste.discovery &&
          nextTaste.discovery.ids.every((id) => nextInterests.some((i) => i.id === id))
            ? { context: nextTaste.discovery }
            : {}),
          area,
          dates,
          budget: 'flexible',
          kind: 'places',
          mode: nextMode,
          rejected,
          savedFamilies: saved.map((p) => p.family),
        }),
      });
      const b = (await r.json()) as Reply & { error?: string };
      if (!r.ok) throw Error(b.error || 'Discovery failed.');
      if (seq !== sequence.current) return;
      setReply(b);
      setSearchedDates(dates);
      setSearchedMode(nextMode);
      setChanged(false);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'instant'
            : 'smooth',
          block: 'start',
        });
      }, 50);
    } catch (e) {
      if (!c.signal.aborted) {
        setError(e instanceof Error ? e.message : 'Could not connect. Please try again.');
      }
    } finally {
      if (seq === sequence.current) setPending(false);
    }
  }

  function changeMode(m: Mode) {
    setMode(m);
    if (reply && !pending) void discover(m);
    else setChanged(true);
  }

  function toggleSave(p: Place) {
    const exists = saved.some((s) => s.id === p.id);
    if (!exists && saved.length >= 100) {
      setToast('Your list is full. Remove a place before saving another.');
      return;
    }
    setSaved(exists ? saved.filter((s) => s.id !== p.id) : [p, ...saved]);
    setToast(exists ? 'Removed from saved places.' : 'Saved to your field guide.');
  }

  function reject(p: Place) {
    setRejected([...new Set([...rejected, p.id])]);
    setOpen(null);
    setToast('Passed for this session.');
  }

  const visible = (view === 'saved' ? saved : reply?.places || []).filter(
    (p) => view === 'saved' || !rejected.includes(p.id)
  );
  const canSearch = interests.length >= 1 && interests.length <= 8 && !pending;

  const dial = (
    <section className="dial-panel" aria-label="Discovery dial">
      <div className="dial-heading">
        <div>
          <h2>How far will you wander?</h2>
          <p>{modeCopy[mode]}</p>
        </div>
        <Compass size={21} />
      </div>
      <div className="dial-options" role="group" aria-label="Discovery mode">
        {modes.map((m, i) => (
          <button
            key={m}
            className={mode === m ? 'selected' : ''}
            aria-pressed={mode === m}
            onClick={() => changeMode(m)}
            disabled={pending}
          >
            <span className="dial-tick">
              <span className={'small-orbit orbit-' + i} />
            </span>
            {modeLabel[m]}
          </button>
        ))}
      </div>
      <p className="dial-note">Same taste. A wider circle of possibilities.</p>
    </section>
  );

  return (
    <>
      <a href="#taste" className="skip-link">
        Skip to your interests
      </a>
      <header className="site-header">
        <a className="brand" href="/" aria-label="SideQuest home">
          <Compass strokeWidth={1.7} />
          <span>
            SideQuest<span className="brand-dot">.</span>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <button
            className={view === 'discover' ? 'nav-active' : ''}
            onClick={() => setView('discover')}
          >
            Discover
          </button>
          <button
            className={view === 'saved' ? 'nav-active' : ''}
            onClick={() => {
              setView('saved');
              setOpen(null);
              setTimeout(
                () =>
                  resultRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  }),
                50
              );
            }}
          >
            <Bookmark size={16} />
            Saved <span className="count">{saved.length}</span>
          </button>
        </nav>
        <span className="city-mark">
          <span />
          Tokyo, Japan <span className="city-ja" lang="ja">東京</span>
        </span>
      </header>

      <main className={view === 'taste' ? 'editing-taste' : undefined}>
        <section className="intro">
          <div className="intro-copy">
            <h1>
              Your taste.
              <br />A different <em>Tokyo.</em>
            </h1>
            <p>
              Turn the things you love into
              <br className="desktop-break" /> somewhere worth going.
            </p>
          </div>
          <div className="intro-aside">
            <p>
              The listening bar around the corner.
              <br />
              The gallery you almost walked past.
              <br />
              <strong>Your next cultural sidequest.</strong>
            </p>
            <span className="qloo-credit">
              Cultural graph by <b>Qloo</b>
              <ArrowUpRight size={15} />
            </span>
          </div>
        </section>

        <div className={view === 'taste' ? 'workspace taste-workspace' : 'workspace'}>
          <aside className="taste-panel" id={view === 'taste' ? 'taste-panel-editing' : 'taste'}>
            <div className="panel-title">
              <h2>What’s your thing?</h2>
              <SlidersHorizontal size={18} />
            </div>
            <p className="muted">Start with 3–8 things you love. Think music, films, books, brands.</p>

            <div className="taste-entry">
              <button className="taste-entry-button" onClick={exploreTaste}>
                Find my taste
                <ArrowRight size={17} />
              </button>
              <p>
                {taste.exploration?.picks.length
                  ? 'Your trail: ' + taste.exploration.picks.map((p) => p.name).join(' · ')
                  : selectedTopics(taste).length
                  ? selectedTopics(taste).map((t) => t.name).join(' · ')
                  : 'Follow a favourite into something unexpected.'}
              </p>
              {(selectedTopics(taste).length > 0 || !!taste.exploration?.picks.length) && (
                <button
                  className="text-button"
                  onClick={() => {
                    setTaste(EMPTY_TASTE);
                    setToast('Taste profile cleared. Your search interests are unchanged.');
                  }}
                >
                  Clear taste profile
                </button>
              )}
            </div>

            <div className="interest-chips" aria-label="Your interests">
              {interests.map((i) => (
                <span className="interest-chip" key={i.id}>
                  {i.name}
                  <button
                    aria-label={'Remove ' + i.name}
                    onClick={() => {
                      setInterests(interests.filter((x) => x.id !== i.id));
                      setChanged(true);
                    }}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>

            <form className="interest-search" onSubmit={searchInterests}>
              <label className="sr-only" htmlFor="interest">
                Search for an interest
              </label>
              <input
                id="interest"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setMatches([]);
                  setSearchError('');
                  searchAbort.current?.abort();
                  setSearching(false);
                }}
                placeholder="Find an artist, film, brand…"
                maxLength={80}
                disabled={interests.length >= 8}
              />
              <button
                aria-label="Search interests"
                disabled={query.trim().length < 2 || searching || interests.length >= 8}
              >
                {searching ? <LoaderCircle size={18} className="spin" /> : <Plus size={18} />}
              </button>
            </form>

            {matches.length > 0 && (
              <div className="search-matches" aria-label="Choose the correct interest">
                <p>Choose the one you mean</p>
                {matches.map((i) => (
                  <button
                    key={i.id}
                    disabled={interests.some((x) => x.id === i.id)}
                    onClick={() => addInterest(i)}
                  >
                    <span>
                      {i.name}
                      <small>{i.type.replaceAll('_', ' ')}</small>
                    </span>
                    {interests.some((x) => x.id === i.id) ? (
                      <Check size={16} />
                    ) : (
                      <Plus size={16} />
                    )}
                  </button>
                ))}
              </div>
            )}

            {searchError && (
              <p className="inline-error" role="status">
                {searchError}
              </p>
            )}

            <p className="interest-count">
              {interests.length} of 8 interests
              {interests.length < 3 ? ' · Add ' + (3 - interests.length) + ' more' : ''}
            </p>

            {(view === 'discover' || view === 'saved') && (
              <>
                <div className="filter-fields">
                  <label>
                    Where
                    <select
                      value={area}
                      onChange={(e) => {
                        setArea(e.target.value as keyof typeof AREAS);
                        setChanged(true);
                      }}
                    >
                      {Object.entries(AREAS).map(([key, a]) => (
                        <option key={key} value={key}>
                          {a.name}
                          {key === 'tokyo' ? '' : ' · 3.5 km'}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    When
                    <select
                      value={when}
                      onChange={(e) => {
                        setWhen(e.target.value);
                        setChanged(true);
                      }}
                    >
                      <option value="weekend">This weekend</option>
                      <option value="today">Today</option>
                      <option value="custom">Pick a date</option>
                    </select>
                  </label>

                  {when === 'custom' && (
                    <label>
                      Visit date · Tokyo time
                      <input
                        type="date"
                        min={tokyoDate()}
                        value={date}
                        onChange={(e) => {
                          setDate(e.target.value);
                          setChanged(true);
                        }}
                      />
                    </label>
                  )}
                </div>

                <div className="mobile-dial">{dial}</div>

                <button
                  className="primary discover-button"
                  onClick={() => void discover()}
                  disabled={!canSearch}
                >
                  {pending ? (
                    <>
                      <LoaderCircle size={18} className="spin" />
                      Finding places…
                    </>
                  ) : (
                    <>
                      Find my sidequest
                      <ArrowRight size={19} />
                    </>
                  )}
                </button>

                {rejected.length > 0 && (
                  <button
                    className="text-button reset-pass"
                    onClick={() => {
                      setRejected([]);
                      setToast('Passed places can appear in your next search.');
                      setChanged(true);
                    }}
                  >
                    <RotateCcw size={13} />
                    Reset {rejected.length} passed {rejected.length === 1 ? 'place' : 'places'}
                  </button>
                )}
              </>
            )}
          </aside>

          <div className="discovery-stage">
            {(view === 'discover' || view === 'saved') && <div className="desktop-dial">{dial}</div>}

            <div ref={resultRef} className="result-anchor">
              {storageError && (
                <p className="status-notice" role="status">
                  Browser storage is unavailable. Your tastes and saves last only while this page is open.
                </p>
              )}

              {view === 'taste' ? (
                <TasteDiscovery
                  profile={taste}
                  interests={interests}
                  onApply={applyTaste}
                  onCancel={() => setView('discover')}
                />
              ) : (
                <>
                  {error && (
                    <div className="error-state" role="alert">
                      <Info size={20} />
                      <div>
                        <strong>We couldn’t complete this search.</strong>
                        <p>{error}</p>
                        <button className="text-button" onClick={() => void discover()}>
                          Try again <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>
                  )}

                  {view === 'saved' ? (
                    <div className="results-heading">
                      <div>
                        <h2>Saved for later.</h2>
                        <p>
                          {saved.length
                            ? `${saved.length} ${saved.length === 1 ? 'place' : 'places'} saved in your field guide.`
                            : 'Save places while exploring to build your day.'}
                        </p>
                      </div>
                      <Bookmark size={23} />
                    </div>
                  ) : reply ? (
                    <div className="results-heading">
                      <div>
                        <h2>{visible.length ? 'Follow this feeling.' : 'Let’s try another route.'}</h2>
                        <p>
                          {visible.length} {visible.length === 1 ? 'place' : 'places'} ·{' '}
                          {searchedDates.map(shortDate).join('–')} · {modeLabel[searchedMode]}
                        </p>
                      </div>
                      <span className="live-label">
                        <span />
                        Live Qloo search
                      </span>
                    </div>
                  ) : null}

                  {changed && reply && view === 'discover' && (
                    <div className="update-notice">
                      Your search settings changed.
                      <button onClick={() => void discover()} disabled={!canSearch}>
                        Update discoveries <ArrowRight size={14} />
                      </button>
                    </div>
                  )}

                  {pending && (
                    <div className="loading-state" role="status">
                      <LoaderCircle className="spin" size={24} />
                      <div>
                        <strong>Following the connections.</strong>
                        <p>Checking Tokyo cultural spots against your taste.</p>
                      </div>
                    </div>
                  )}

                  {!pending && <DiscoveryMap places={visible} events={[]} />}

                  {!pending && visible.length > 0 && (
                    <div className="results-list">
                      {visible.map((p, index) => {
                        const isSaved = saved.some((s) => s.id === p.id);
                        const expanded = open === p.id;
                        return (
                          <article
                            className={'place-row ' + (expanded ? 'expanded' : '')}
                            key={p.id}
                          >
                            <div className="place-index" aria-hidden="true">
                              {String(index + 1).padStart(2, '0')}
                            </div>
                            <div className="place-content">
                              <div className="place-meta">
                                <span>{p.family}</span>
                                <span>
                                  <MapPin size={12} />
                                  {p.area}
                                </span>
                              </div>
                              <button
                                className="place-title"
                                aria-expanded={expanded}
                                aria-controls={'detail-' + p.id}
                                onClick={() => setOpen(expanded ? null : p.id)}
                              >
                                <h3>{p.name}</h3>
                                <ArrowUpRight size={21} />
                              </button>
                              <p className="place-reason">{p.reason}</p>
                              <div className="place-foot">
                                <span>{p.category}</span>
                                <span>{p.area}</span>
                              </div>
                            </div>
                            <div className="place-actions">
                              <button
                                className={'icon-button ' + (isSaved ? 'is-saved' : '')}
                                aria-label={(isSaved ? 'Unsave ' : 'Save ') + p.name}
                                aria-pressed={isSaved}
                                onClick={() => toggleSave(p)}
                              >
                                <Bookmark size={19} fill={isSaved ? 'currentColor' : 'none'} />
                              </button>
                              {view === 'discover' && (
                                <button
                                  className="pass-button"
                                  aria-label={'Pass on ' + p.name}
                                  onClick={() => reject(p)}
                                >
                                  Pass
                                  <X size={12} />
                                </button>
                              )}
                            </div>

                            {expanded && (
                              <section className="place-detail" id={'detail-' + p.id}>
                                <div className="detail-description">
                                  <h4>A closer look</h4>
                                  <p>{p.description}</p>
                                  <p className="address">
                                    <MapPin size={15} />
                                    {p.address}
                                  </p>
                                  <div className="detail-links">
                                    {p.website && (
                                      <a
                                        className="primary small"
                                        href={p.website}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        Venue website <ExternalLink size={14} />
                                      </a>
                                    )}
                                    <a
                                      className="text-button"
                                      href={p.map}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      Open map <ArrowUpRight size={16} />
                                    </a>
                                  </div>
                                </div>
                                <div className="detail-evidence">
                                  <h4>Why it found you</h4>
                                  <p>{p.reason}</p>
                                  {p.signals.length > 0 && (
                                    <div className="evidence-chain">
                                      {p.signals.slice(0, 3).map((s) => (
                                        <span key={s.name}>{s.name}</span>
                                      ))}
                                      <ArrowRight size={14} />
                                      <b>{p.category}</b>
                                    </div>
                                  )}
                                  <h4>Before you go</h4>
                                  {(view === 'saved' ? [tokyoDate()] : searchedDates).map((d) => (
                                    <p className="hours-row" key={d}>
                                      <span>{shortDate(d)}</span>
                                      <span>{publishedHours(p, d)}</span>
                                    </p>
                                  ))}
                                  <p className="source-stamp">
                                    Tokyo cultural guide · Curated via Qloo
                                  </p>
                                </div>
                              </section>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}

                  {!pending && reply && view === 'discover' && !visible.length && (
                    <div className="empty-state">
                      <Compass size={36} />
                      <h3>No matching spots found</h3>
                      <p>
                        Try searching across Tokyo, picking another date, or resetting your passed spots.
                      </p>
                      <button
                        className="text-button"
                        onClick={() => {
                          setArea('tokyo');
                          setChanged(true);
                        }}
                      >
                        Search across Tokyo <ArrowRight size={16} />
                      </button>
                    </div>
                  )}

                  {!pending && view === 'saved' && !visible.length && (
                    <div className="empty-state">
                      <Bookmark size={36} />
                      <h3>Keep a little possibility.</h3>
                      <p>
                        Tap the bookmark on any discovery to save it here. Your saves help shape future searches.
                      </p>
                      <button className="text-button" onClick={() => setView('discover')}>
                        Back to discoveries <ArrowRight size={16} />
                      </button>
                    </div>
                  )}

                  {!reply && view === 'discover' && !pending && (
                    <section className="welcome">
                      <div className="welcome-text">
                        <h2>
                          Good things
                          <br />
                          are <em>connected.</em>
                        </h2>
                        <p>
                          A favourite track. A well-made object.
                          <br />
                          A film you can’t stop thinking about.
                          <br />
                          There’s a whole city on the other side.
                        </p>
                        <div className="welcome-route">
                          <span>Your interests</span>
                          <ArrowRight size={17} />
                          <span>Your next sidequest</span>
                        </div>
                      </div>
                      <CompassArt mode={mode} />
                    </section>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <section className="how-it-works">
          <h2>
            A little taste.
            <br />
            A little serendipity.
          </h2>
          <div>
            <p>
              <strong>Start with what moves you.</strong>
              Your favourite artists, films, and brands give Qloo a starting point.
            </p>
            <p>
              <strong>Let the connections wander.</strong>
              The dial balances affinity with a wider mix of cultural places.
            </p>
            <p>
              <strong>Make it your own.</strong>
              Save what speaks to you. Pass on what doesn’t.
            </p>
          </div>
        </section>
      </main>

      <footer>
        <a className="footer-brand" href="/">
          SideQuest.
        </a>
        <span>Made for the curious. Built with Qloo.</span>
        <span>Tokyo, a little differently.</span>
      </footer>

      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
    </>
  );
}
