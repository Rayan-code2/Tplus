import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { User } from '../types';

interface CricketFantasyViewProps {
  user: User | null;
  onRefreshUser?: () => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  onBack?: () => void;
}

export type PlayerRole = 'WK' | 'BAT' | 'AR' | 'BOWL';

export interface FantasyRules {
  size: number;
  budget: number;
  perTeam: number;
  cm: number;
  vm: number;
  WK: [number, number];
  BAT: [number, number];
  AR: [number, number];
  BOWL: [number, number];
}

export interface Player {
  id: number;
  name: string;
  team: number; // 1 or 2
  role: PlayerRole;
  cr: number;
  pts: number;
  img?: string;
}

export interface Contest {
  id: number;
  name: string;
  fee: number;
  spots: number;
  prize: number[];
  done?: boolean;
}

export interface Match {
  id: number;
  t1: string;
  t2: string;
  locked: boolean;
  rules?: Partial<FantasyRules>;
  players: Player[];
  contests: Contest[];
}

export interface FantasyTeam {
  id: number;
  mid: number;
  name: string;
  ids: number[];
  c: number;
  vc: number;
  me?: boolean | number;
}

export interface ContestJoin {
  id: number;
  cid: number;
  mid: number;
  tid: number;
  prize?: number;
}

export interface TransactionRecord {
  t: string;
  a: number;
}

const K = 'fantasyxi_v1';
const DR: FantasyRules = {
  size: 11,
  budget: 100,
  perTeam: 7,
  cm: 2,
  vm: 1.5,
  WK: [1, 4],
  BAT: [1, 6],
  AR: [1, 4],
  BOWL: [1, 6],
};

const R = (m: Match): FantasyRules => Object.assign({}, DR, m.rules || {});

const rtxt = (r: FantasyRules) =>
  `${r.size} players, ${r.budget} credits, max ${r.perTeam} from one team. ` +
  (['WK', 'BAT', 'AR', 'BOWL'] as const).map((x) => `${x} ${r[x][0]}-${r[x][1]}`).join(', ') +
  '.';

// Demo dynamic player avatars generator
function demoImg(i: number, team: number): string {
  const sk = ['#f1c9a5', '#e0a97c', '#c68a5b', '#a8693f', '#8d5524'][i % 5];
  const hr = ['#1b1b1b', '#3b2417', '#5a3a22', '#101010'][(i * 3) % 4];
  const jc = team === 1 ? '#1d4fd7' : '#f2b01e';
  const bg = ['#cfe3c4', '#c9dcef', '#f0e2c0'][i % 3];
  const top =
    i % 4 === 1
      ? `<path d="M32 38a16 16 0 0 1 32 0z" fill="${jc}"/><rect x="30" y="36" width="36" height="4" rx="2" fill="${jc}"/>`
      : `<path d="M33 38a15 15 0 0 1 30 0c-4-7-9-9-15-9s-11 2-15 9z" fill="${hr}"/>`;
  const beard =
    i % 5 === 2
      ? `<path d="M36 44q12 16 24 0q-2 10-12 11q-10-1-12-11z" fill="${hr}" opacity=".9"/>`
      : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="${bg}"/><rect x="42" y="50" width="12" height="16" fill="${sk}"/><path d="M12 96c2-22 16-31 36-31s34 9 36 31z" fill="${jc}"/><path d="M40 67l8 10 8-10" stroke="#fff" stroke-width="3" fill="none"/><circle cx="48" cy="38" r="15" fill="${sk}"/>${beard}${top}<circle cx="42" cy="40" r="1.6" fill="#222"/><circle cx="54" cy="40" r="1.6" fill="#222"/></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

const AV =
  "<svg viewBox='0 0 48 48'><circle cx='24' cy='19' r='8' fill='#f4f7f1'/><path d='M8 46c2-12 10-15 16-15s14 3 16 15z' fill='#f4f7f1'/></svg>";

function seed(): {
  matches: Match[];
  teams: FantasyTeam[];
  wallet: number;
  tx: TransactionRecord[];
  joins: ContestJoin[];
  pin?: string;
} {
  const P: [string, number, PlayerRole, number, number][] = [
    ['Pant', 1, 'WK', 9, 38],
    ['Rohit', 1, 'BAT', 10, 51],
    ['Kohli', 1, 'BAT', 10.5, 62],
    ['Gill', 1, 'BAT', 9, 27],
    ['Surya', 1, 'BAT', 9, 44],
    ['Jadeja', 1, 'AR', 9, 48],
    ['Hardik', 1, 'AR', 9.5, 35],
    ['Axar', 1, 'AR', 8.5, 30],
    ['Bumrah', 1, 'BOWL', 9.5, 45],
    ['Kuldeep', 1, 'BOWL', 8, 33],
    ['Siraj', 1, 'BOWL', 8.5, 22],
    ['Carey', 2, 'WK', 8.5, 25],
    ['Head', 2, 'BAT', 10, 70],
    ['Smith', 2, 'BAT', 9.5, 41],
    ['Warner', 2, 'BAT', 9, 18],
    ['Marsh', 2, 'AR', 9.5, 40],
    ['Maxwell', 2, 'AR', 9.5, 55],
    ['Stoinis', 2, 'AR', 8.5, 29],
    ['Cummins', 2, 'BOWL', 9, 36],
    ['Starc', 2, 'BOWL', 9, 42],
    ['Zampa', 2, 'BOWL', 8.5, 31],
    ['Hazlewood', 2, 'BOWL', 8.5, 28],
  ];

  const m: Match = {
    id: 1,
    t1: 'India',
    t2: 'Australia',
    locked: false,
    players: P.map((p, i) => ({
      id: i + 1,
      name: p[0],
      team: p[1],
      role: p[2],
      cr: p[3],
      pts: p[4],
      img: demoImg(i, p[1]),
    })),
    contests: [
      { id: 11, name: 'Mega Contest', fee: 50, spots: 10, prize: [300, 150, 50] },
      { id: 12, name: 'Free Practice', fee: 0, spots: 5, prize: [20] },
    ],
  };

  return {
    matches: [m],
    teams: [
      { id: 101, mid: 1, name: 'Cricket Guru', ids: [1, 2, 3, 6, 7, 9, 10, 13, 17, 19, 20], c: 3, vc: 13 },
      { id: 102, mid: 1, name: 'Boundary King', ids: [1, 3, 5, 6, 9, 12, 13, 16, 17, 19, 21], c: 13, vc: 17 },
      { id: 103, mid: 1, name: 'Super Six', ids: [1, 2, 4, 6, 8, 9, 14, 16, 18, 20, 22], c: 6, vc: 9 },
    ],
    wallet: 1000,
    tx: [],
    joins: [
      { id: 901, cid: 11, mid: 1, tid: 101 },
      { id: 902, cid: 11, mid: 1, tid: 102 },
      { id: 903, cid: 11, mid: 1, tid: 103 },
      { id: 904, cid: 12, mid: 1, tid: 101 },
    ],
    pin: '1234',
  };
}

export const CricketFantasyView: React.FC<CricketFantasyViewProps> = ({
  user,
  showToast,
  onRefreshUser,
  onOpenDeposit,
  onBack,
}) => {
  // Global Store State matching fantasyxi_v1
  const [store, setStore] = useState(() => {
    try {
      const saved = localStorage.getItem(K);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.matches && parsed.matches.length) return parsed;
      }
    } catch {}
    return seed();
  });

  // Sync with unified Main Wallet balance (depositBalance + winningBalance + balance)
  useEffect(() => {
    if (user) {
      const mainWallet =
        (Number(user.depositBalance) || 0) +
        (Number(user.winningBalance) || 0) +
        (Number(user.balance) || 0);
      setStore((prev: any) => ({
        ...prev,
        wallet: Number(mainWallet.toFixed(2)),
      }));
    }
  }, [user]);

  // Persist store to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(K, JSON.stringify(store));
    } catch {}
  }, [store]);

  // Navigation & UI state (matching reference code exactly)
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [tab, setTab] = useState<'matches' | 'teams' | 'lb' | 'wallet' | 'build' | 'cons'>('matches');
  const [mid, setMid] = useState<number>(1);
  const [sel, setSel] = useState<number[]>([]);
  const [cId, setCId] = useState<number | null>(null);
  const [vcId, setVcId] = useState<number | null>(null);
  const [roleFilter, setRoleFilter] = useState<'ALL' | PlayerRole>('ALL');
  const [teamName, setTeamName] = useState<string>('');
  const [editTeamId, setEditTeamId] = useState<number | null>(null);
  const [viewTeamId, setViewTeamId] = useState<number | null>(null);
  const [joinContestId, setJoinContestId] = useState<number | null>(null);
  const [contestDetailId, setContestDetailId] = useState<number | null>(null);
  const [leaderboardMatchId, setLeaderboardMatchId] = useState<number>(1);
  const [adminMatchId, setAdminMatchId] = useState<number>(1);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [adminPinInput, setAdminPinInput] = useState<string>('');
  const [adminPinError, setAdminPinError] = useState<string>('');
  const [bannerMsg, setBannerMsg] = useState<string>('');

  // Admin form inputs
  const [newTeam1, setNewTeam1] = useState<string>('');
  const [newTeam2, setNewTeam2] = useState<string>('');
  const [newPName, setNewPName] = useState<string>('');
  const [newPTeam, setNewPTeam] = useState<number>(1);
  const [newPRole, setNewPRole] = useState<PlayerRole>('WK');
  const [newPCredits, setNewPCredits] = useState<string>('9.0');
  const [newPPoints, setNewPPoints] = useState<string>('0');
  const [newPPhoto, setNewPPhoto] = useState<string>('');

  const [newCName, setNewCName] = useState<string>('');
  const [newCFee, setNewCFee] = useState<string>('50');
  const [newCSpots, setNewCSpots] = useState<string>('10');
  const [newCPrizes, setNewCPrizes] = useState<string>('300,150,50');

  const [addCoinsInput, setAddCoinsInput] = useState<string>('500');
  const [newPinInput, setNewPinInput] = useState<string>('');

  const activeMatch = store.matches.find((m: Match) => m.id === mid) || store.matches[0];
  const adminActiveMatch = store.matches.find((m: Match) => m.id === adminMatchId) || store.matches[0];
  const lbActiveMatch = store.matches.find((m: Match) => m.id === leaderboardMatchId) || store.matches[0];

  // Helper points calculator
  const calcPts = (t: FantasyTeam, m: Match) => {
    const r = R(m);
    return t.ids.reduce((a, id) => {
      const p = m.players.find((pl) => pl.id === id);
      return a + (p ? p.pts * (t.c === id ? r.cm : t.vc === id ? r.vm : 1) : 0);
    }, 0);
  };

  const pool = (co: Contest) => co.prize.reduce((a, b) => a + b, 0);
  const getEntries = (co: Contest) => store.joins.filter((j: ContestJoin) => j.cid === co.id);
  const getTeam = (j: ContestJoin) => store.teams.find((t: FantasyTeam) => t.id === j.tid);

  // Check function for team building
  const checkTeam = (m: Match) => {
    const ps = sel.map((id) => m.players.find((p) => p.id === id)).filter(Boolean) as Player[];
    const rc: Record<string, number> = {};
    ps.forEach((p) => {
      rc[p.role] = (rc[p.role] || 0) + 1;
    });
    return {
      ps,
      cr: ps.reduce((a, p) => a + p.cr, 0),
      rc,
      t1: ps.filter((p) => p.team === 1).length,
      t2: ps.filter((p) => p.team === 2).length,
    };
  };

  const canAddPlayer = (m: Match, p: Player) => {
    const k = checkTeam(m);
    const r = R(m);
    if (k.ps.length >= r.size) return 'Max ' + r.size + ' players';
    if (k.cr + p.cr > r.budget) return 'Not enough credits';
    if ((p.team === 1 ? k.t1 : k.t2) >= r.perTeam) return 'Max ' + r.perTeam + ' from one team';
    if ((k.rc[p.role] || 0) >= r[p.role][1]) return p.role + ' max ' + r[p.role][1];
    return '';
  };

  const getProblems = (m: Match) => {
    const k = checkTeam(m);
    const r = R(m);
    const e: string[] = [];
    if (k.ps.length !== r.size) e.push(r.size - k.ps.length + ' more players to pick');
    for (const ro of ['WK', 'BAT', 'AR', 'BOWL'] as const) {
      if ((k.rc[ro] || 0) < r[ro][0]) e.push('At least ' + r[ro][0] + ' ' + ro);
    }
    if (!cId) e.push('Choose a Captain (C)');
    if (!vcId) e.push('Choose a Vice-captain (VC)');
    return e;
  };

  const getTeamName = (m: Match, t: number) => (t === 1 ? m.t1 : m.t2);

  const resetBuild = () => {
    setSel([]);
    setCId(null);
    setVcId(null);
    setTeamName('');
    setRoleFilter('ALL');
    setEditTeamId(null);
  };

  // Avatar component
  const renderAvatar = (p: Player, size = 44) => {
    if (p.img) {
      return (
        <img
          src={p.img}
          alt={p.name}
          className="thumb"
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      );
    }
    return (
      <div
        className="thumb ph"
        style={{ width: `${size}px`, height: `${size}px` }}
        dangerouslySetInnerHTML={{ __html: AV }}
      />
    );
  };

  // Pick Image File from computer
  const handlePickImg = (cb: (dataUrl: string) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 96;
          const s = Math.min(img.width, img.height);
          canvas.getContext('2d')?.drawImage(img, (img.width - s) / 2, (img.height - s) * 0.2, s, s, 0, 0, 96, 96);
          cb(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // ==========================================
  // VIEW: STADIUM FIELD / GROUND VIEW
  // ==========================================
  const renderField = () => {
    const t = store.teams.find((x: FantasyTeam) => x.id === viewTeamId);
    if (!t) return null;
    const m = store.matches.find((x: Match) => x.id === t.mid) || store.matches[0];

    const renderRow = (r: PlayerRole, label: string) => {
      const ps = t.ids
        .map((id) => m.players.find((p) => p.id === id))
        .filter((p): p is Player => !!p && p.role === r);
      if (!ps.length) return null;

      return (
        <div className="fvr">
          <div className="fvl">{label}</div>
          <div className="fvp">
            {ps.map((p) => (
              <div
                key={p.id}
                className="fvc cursor-pointer"
                onClick={() => {
                  if (t.c === p.id) {
                    t.c = 0;
                    t.vc = p.id;
                  } else if (t.vc === p.id) {
                    t.vc = 0;
                  } else {
                    t.c = p.id;
                  }
                  setStore({ ...store });
                  confetti({ particleCount: 30 });
                }}
              >
                {t.c === p.id && <i className="fvb c">C</i>}
                {t.vc === p.id && <i className="fvb vc">VC</i>}
                <div className="fva">
                  {p.img ? (
                    <img src={p.img} alt={p.name} />
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: AV }} />
                  )}
                </div>
                <div className={`fvn ${p.team === 1 ? 'w' : 'd'}`}>{p.name}</div>
                <div className="fvm">{Number(p.cr).toFixed(1)} Cr</div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="fv">
        {/* Header */}
        <div className="fvh">
          <button className="bk" onClick={() => setViewTeamId(null)}>
            &#8249;
          </button>
          <div className="nm">
            {t.name}
            <small>
              {calcPts(t, m)} pts, C = {R(m).cm}x, VC = {R(m).vm}x
            </small>
          </div>
          {t.me && !m.locked && (
            <button
              className="ed"
              onClick={() => {
                resetBuild();
                setMid(t.mid);
                setSel([...t.ids]);
                setCId(t.c);
                setVcId(t.vc);
                setTeamName(t.name);
                setEditTeamId(t.id);
                setViewTeamId(null);
                setTab('build');
              }}
            >
              &#9998; Edit Team
            </button>
          )}
        </div>

        {/* Pitch Oval Formation */}
        <div className="fvf">
          {renderRow('WK', 'Wicketkeepers')}
          {renderRow('BAT', 'Batsmen')}
          {renderRow('AR', 'All Rounders')}
          {renderRow('BOWL', 'Bowlers')}
        </div>

        {/* Team Legend */}
        <div className="fvg">
          <span>
            <i className="dot w"></i>
            {m.t1}
          </span>
          <span>
            <i className="dot d"></i>
            {m.t2}
          </span>
        </div>
      </div>
    );
  };

  // If viewing stadium field, render field view
  if (viewTeamId) {
    return (
      <div className="w-full min-h-screen bg-[#2c5a1d] flex justify-center">
        <div id="app" className="fantasy-xi-root" style={{ padding: 0, background: 'none', minHeight: 'auto' }}>
          <style>{REFERENCE_CSS}</style>
          {renderField()}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: BUILD / CREATE TEAM SCREEN
  // ==========================================
  const renderBuild = () => {
    const m = activeMatch;
    const k = checkTeam(m);
    const er = getProblems(m);
    const list = m.players.filter((p) => roleFilter === 'ALL' || p.role === roleFilter);

    const handleSaveTeam = () => {
      const issues = getProblems(m);
      if (issues.length) {
        if (showToast) {
          showToast(`Cannot save yet: ${issues[0]}`, 'error');
        } else {
          setBannerMsg(`Cannot save yet: ${issues[0]}`);
        }
        return;
      }
      const nm = teamName.trim() || 'Team ' + (store.teams.filter((t: FantasyTeam) => t.me).length + 1);

      let t = store.teams.find((x: FantasyTeam) => x.id === editTeamId);
      if (t) {
        Object.assign(t, { name: nm, ids: [...sel], c: cId, vc: vcId });
      } else {
        t = {
          id: Date.now(),
          mid: m.id,
          name: nm,
          ids: [...sel],
          c: cId || 0,
          vc: vcId || 0,
          me: 1,
        };
        store.teams.push(t);
      }

      setStore({ ...store });
      resetBuild();
      setTab('teams');
      setViewTeamId(t.id);
      confetti({ particleCount: 60, spread: 60 });
      if (showToast) showToast('Team saved successfully!', 'success');
    };

    return (
      <div>
        <div className="row">
          <h2>
            {m.t1} vs {m.t2}
          </h2>
          <button className="ghost" onClick={() => setTab('matches')}>
            Back
          </button>
        </div>

        <div className="mu">
          {rtxt(R(m))} Tap C ({R(m).cm}x) or VC ({R(m).vm}x) on a selected player.
        </div>

        <div className="tabs" style={{ marginTop: '10px' }}>
          {(['ALL', 'WK', 'BAT', 'AR', 'BOWL'] as const).map((r) => (
            <button
              key={r}
              className={`chip ${roleFilter === r ? 'on' : ''}`}
              onClick={() => setRoleFilter(r)}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Players List */}
        {list.map((p) => {
          const on = sel.includes(p.id);
          const why = on ? '' : canAddPlayer(m, p);

          return (
            <div
              key={p.id}
              className={`pl ${on ? 'on' : ''} ${why ? 'dis' : ''}`}
              onClick={() => {
                if (sel.includes(p.id)) {
                  setSel(sel.filter((x) => x !== p.id));
                  if (cId === p.id) setCId(null);
                  if (vcId === p.id) setVcId(null);
                } else if (!canAddPlayer(m, p)) {
                  setSel([...sel, p.id]);
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {renderAvatar(p, 38)}
                <div>
                  <b>{p.name}</b>
                  <div className="mu">
                    {getTeamName(m, p.team)}, {p.role}
                  </div>
                </div>
              </div>

              <b>{p.cr}</b>

              {on && (
                <div
                  style={{ display: 'flex', gap: '4px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span
                    className={`cv ${cId === p.id ? 'act' : ''}`}
                    onClick={() => {
                      setCId(cId === p.id ? null : p.id);
                      if (vcId === p.id) setVcId(null);
                    }}
                  >
                    C
                  </span>
                  <span
                    className={`cv ${vcId === p.id ? 'act' : ''}`}
                    onClick={() => {
                      setVcId(vcId === p.id ? null : p.id);
                      if (cId === p.id) setCId(null);
                    }}
                  >
                    VC
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* In-flow Action & Save Section at end of player list */}
        <div style={{ marginTop: '24px', marginBottom: '80px', padding: '16px', background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <b style={{ fontSize: '16px' }}>Team Overview</b>
              <div className="mu" style={{ fontSize: '13px' }}>
                {k.ps.length}/{R(m).size} Players Selected • {(R(m).budget - k.cr).toFixed(1)} Credits Left
              </div>
            </div>
            <span className={`tag ${er.length === 0 ? 'ok' : ''}`}>
              {er.length === 0 ? '✓ Ready' : `${er.length} steps left`}
            </span>
          </div>

          {er.length > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', fontSize: '13px', color: '#b91c1c' }}>
              <b>Required to save:</b>
              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                {er.map((errItem, idx) => (
                  <li key={idx}>{errItem}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              placeholder="Team name (e.g. MyXI-1)"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px' }}
            />
            <button
              className="pri"
              style={{
                margin: 0,
                padding: '11px 22px',
                fontSize: '15px',
                fontWeight: 800,
                background: er.length === 0 ? '#0d7a4f' : '#059669',
                color: '#ffffff',
                borderRadius: '8px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              onClick={handleSaveTeam}
            >
              💾 Save Team
            </button>
          </div>
        </div>

        {/* Fixed Sticky Bottom Bar */}
        <div className="bar" style={{ zIndex: 999 }}>
          <div>
            <div className="row" style={{ marginBottom: '6px' }}>
              <span className="big" style={{ fontSize: '16px', fontWeight: 800 }}>
                {k.ps.length}/{R(m).size} Players
              </span>
              <span className="big" style={{ fontSize: '15px', color: (R(m).budget - k.cr) < 0 ? '#ef4444' : '#0d7a4f', fontWeight: 800 }}>
                {(R(m).budget - k.cr).toFixed(1)} cr left
              </span>
              <span className="mu" style={{ fontWeight: 600, fontSize: '13px' }}>
                {m.t1} {k.t1} : {k.t2} {m.t2}
              </span>
            </div>

            {er.length > 0 ? (
              <div className="err" style={{ fontSize: '12px', background: '#fef2f2', padding: '4px 8px', borderRadius: '6px', border: '1px solid #fecaca', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                ⚠️ Next: {er[0]}
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#0d7a4f', background: '#f0fdf4', padding: '4px 8px', borderRadius: '6px', border: '1px solid #bbf7d0', marginBottom: '8px', fontWeight: 700 }}>
                ✓ Squad completed! Enter team name & click Save.
              </div>
            )}

            <div className="row" style={{ gap: '8px' }}>
              <input
                id="tn"
                placeholder="Team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
              />
              <button
                className="pri"
                style={{
                  margin: 0,
                  padding: '10px 20px',
                  fontSize: '15px',
                  fontWeight: 800,
                  background: er.length === 0 ? '#0d7a4f' : '#059669',
                  color: '#ffffff',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(13,122,79,0.3)',
                }}
                onClick={handleSaveTeam}
              >
                💾 Save Team
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // VIEW: MATCHES LIST
  // ==========================================
  const renderMatches = () => (
    <div>
      <h2>Upcoming matches</h2>
      {store.matches.length ? (
        store.matches.map((m: Match) => (
          <div key={m.id} className="card">
            <div className="row">
              <b>
                {m.t1} vs {m.t2}
              </b>
              <span className={`tag ${m.locked ? '' : 'ok'}`}>
                {m.locked ? 'Locked' : 'Open'}
              </span>
            </div>

            <div className="mu">
              {m.players.length} players, {store.teams.filter((t: FantasyTeam) => t.mid === m.id).length} teams created
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="pri"
                disabled={m.locked || m.players.length < R(m).size}
                onClick={() => {
                  resetBuild();
                  setMid(m.id);
                  setTab('build');
                }}
              >
                Create Team
              </button>

              <button
                className="ghost"
                style={{ marginTop: '8px' }}
                onClick={() => {
                  setMid(m.id);
                  setTab('cons');
                  setJoinContestId(null);
                  setContestDetailId(null);
                }}
              >
                Contests ({(m.contests || []).length})
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="mu">No matches yet. Ask the admin to add one.</p>
      )}
    </div>
  );

  // ==========================================
  // VIEW: CONTESTS LIST
  // ==========================================
  const renderContests = () => {
    const m = activeMatch;

    return (
      <div>
        <div className="row">
          <h2>
            {m.t1} vs {m.t2}
          </h2>
          <button className="ghost" onClick={() => setTab('matches')}>
            Back
          </button>
        </div>

        {m.contests.length ? (
          m.contests.map((c: Contest) => {
            const es = getEntries(c);
            const n = es.length;
            const mine = es.filter((j) => getTeam(j) && getTeam(j)?.me).length;

            return (
              <div key={c.id} className="card">
                <div className="row">
                  <b>{c.name}</b>
                  <span className="tag ok">{c.fee ? `₹${c.fee} INR` : 'FREE'}</span>
                </div>

                <div className="row" style={{ marginTop: '6px' }}>
                  <div>
                    <div className="mu">Prize pool</div>
                    <span className="big">🏆 {pool(c)}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mu">1st prize</div>
                    <b>{c.prize[0]}</b>
                  </div>
                </div>

                <div
                  style={{
                    height: '6px',
                    background: 'var(--bd)',
                    borderRadius: '3px',
                    margin: '8px 0',
                  }}
                >
                  <div
                    style={{
                      height: '6px',
                      borderRadius: '3px',
                      background: 'var(--ac)',
                      width: `${Math.min(100, (n / c.spots) * 100)}%`,
                    }}
                  />
                </div>

                <div className="row">
                  <span className="mu">
                    {n}/{c.spots} spots{mine ? ', your entries: ' + mine : ''}
                  </span>
                  <div>
                    <button
                      className="ghost"
                      onClick={() => {
                        setContestDetailId(c.id);
                      }}
                    >
                      Details
                    </button>{' '}
                    {c.done ? (
                      <span className="tag">Ended</span>
                    ) : (
                      <button
                        className="pri"
                        style={{ margin: 0 }}
                        disabled={m.locked || n >= c.spots}
                        onClick={() => {
                          setJoinContestId(c.id);
                        }}
                      >
                        Join
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="mu">No contests in this match yet.</p>
        )}
      </div>
    );
  };

  // ==========================================
  // VIEW: JOIN CONTEST TEAM CHOOSER (jp)
  // ==========================================
  const renderJoinContest = () => {
    const m = activeMatch;
    const c = m.contests.find((x) => x.id === joinContestId);
    if (!c) return null;

    const mine = store.teams.filter(
      (t: FantasyTeam) =>
        t.me &&
        t.mid === m.id &&
        !store.joins.some((j: ContestJoin) => j.cid === c.id && j.tid === t.id)
    );

    const handleJoinWithTeam = async (teamId: number) => {
      const liveMainWallet = user
        ? (Number(user.depositBalance) || 0) + (Number(user.winningBalance) || 0) + (Number(user.balance) || 0)
        : store.wallet;

      if (liveMainWallet < c.fee) {
        setBannerMsg('Insufficient Main Wallet balance.');
        if (showToast) showToast('Insufficient Main Wallet balance! Please deposit funds.', 'error');
        return;
      }
      if (getEntries(c).length >= c.spots) {
        setBannerMsg('Contest is full.');
        return;
      }

      if (c.fee > 0) {
        try {
          const teamObj = store.teams.find((t: FantasyTeam) => t.id === teamId);
          const res = await fetch('/api/fantasy/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              matchId: m.id,
              matchTitle: `${m.a} vs ${m.b}`,
              contestId: c.id,
              contestName: c.name,
              entryFee: c.fee,
              teamName: teamObj?.name || 'Fantasy XI',
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            setBannerMsg(data.error || 'Failed to deduct from Main Wallet.');
            if (showToast) showToast(data.error || 'Failed to deduct from Main Wallet!', 'error');
            return;
          }
        } catch {
          setBannerMsg('Network error joining contest.');
          if (showToast) showToast('Network error joining contest.', 'error');
          return;
        }
      }

      const updatedStore = { ...store };
      updatedStore.wallet = Math.max(0, liveMainWallet - c.fee);
      if (c.fee) {
        updatedStore.tx.unshift({ t: 'Entry: ' + c.name, a: -c.fee });
      }
      updatedStore.joins.push({ id: Date.now(), cid: c.id, mid: m.id, tid: teamId });
      setStore(updatedStore);
      setBannerMsg('Joined the contest. Best of luck!');
      setJoinContestId(null);
      confetti({ particleCount: 50 });
      if (showToast) showToast('Joined contest! Entry fee deducted from Main Wallet.', 'success');
      if (onRefreshUser) onRefreshUser();
    };

    return (
      <div>
        <div className="row">
          <h2>{c.name}</h2>
          <button className="ghost" onClick={() => setJoinContestId(null)}>
            Back
          </button>
        </div>

        <div className="card">
          Entry fee: <b>₹{c.fee} INR</b>, your balance: <b>₹{store.wallet} INR</b>
        </div>

        <h2>Choose a team</h2>
        {mine.length ? (
          mine.map((t: FantasyTeam) => (
            <div key={t.id} className="card">
              <div className="row">
                <b>{t.name}</b>
                <button
                  className="pri"
                  style={{ margin: 0 }}
                  onClick={() => handleJoinWithTeam(t.id)}
                >
                  Join (₹{c.fee} INR)
                </button>
              </div>
            </div>
          ))
        ) : (
          <div>
            <p className="mu">You have no eligible team for this contest.</p>
            <button
              className="pri"
              onClick={() => {
                resetBuild();
                setMid(m.id);
                setTab('build');
              }}
            >
              Create a new team
            </button>
          </div>
        )}
      </div>
    );
  };

  // ==========================================
  // VIEW: CONTEST DETAILS & STANDINGS (cdet)
  // ==========================================
  const renderContestDetail = () => {
    const m = activeMatch;
    const c = m.contests.find((x) => x.id === contestDetailId);
    if (!c) return null;

    const es = getEntries(c)
      .filter(getTeam)
      .sort((a, b) => calcPts(getTeam(b)!, m) - calcPts(getTeam(a)!, m));

    return (
      <div>
        <div className="row">
          <h2>{c.name}</h2>
          <button className="ghost" onClick={() => setContestDetailId(null)}>
            Back
          </button>
        </div>

        <div className="card">
          <div className="row">
            <span>Prize pool</span>
            <span className="big">🏆 {pool(c)}</span>
          </div>
          <div className="mu">
            Entry ₹{c.fee} INR, {c.spots} spots
          </div>
          <div style={{ marginTop: '8px' }}>
            {c.prize.map((a, i) => (
              <div key={i} className="row">
                <span>Rank {i + 1}</span>
                <b>₹{a} INR</b>
              </div>
            ))}
          </div>
        </div>

        <h2>
          Standings ({es.length}/{c.spots})
        </h2>
        {es.map((j, i) => {
          const t = getTeam(j)!;
          return (
            <div key={j.id} className={`card ${t.me ? 'me' : ''}`}>
              <div className="row">
                <b>
                  {i + 1}. {t.name}
                  {t.me ? ' (you)' : ''}
                </b>
                <span className="big">{calcPts(t, m)}</span>
              </div>
              <div className="row">
                <span className="mu">
                  {c.done
                    ? j.prize
                      ? 'Won: ₹' + j.prize + ' INR'
                      : 'No prize'
                    : c.prize[i] != null
                    ? 'Prize for this rank: ' + c.prize[i]
                    : ''}
                </span>
                <button className="ghost" onClick={() => setViewTeamId(t.id)}>
                  Team
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ==========================================
  // VIEW: WALLET
  // ==========================================
  const renderWallet = () => (
    <div>
      <div className="card">
        <div className="mu">Your INR Wallet</div>
        <span className="big" style={{ fontSize: '32px' }}>
          ₹{store.wallet} INR
        </span>
        <div className="mu">100% Pure INR Fantasy Wallet.</div>
        {onOpenDeposit && (
          <button
            className="pri"
            style={{ marginTop: '10px' }}
            onClick={onOpenDeposit}
          >
            Deposit / Add INR
          </button>
        )}
      </div>

      <h2>Transactions</h2>
      {store.tx.length ? (
        store.tx.map((x: TransactionRecord, idx: number) => (
          <div
            key={idx}
            className="row"
            style={{ padding: '6px 0', borderBottom: '1px solid var(--bd)' }}
          >
            <span>{x.t}</span>
            <b style={{ color: x.a > 0 ? 'var(--ac)' : 'var(--bad)' }}>
              {x.a > 0 ? '+' : ''}
              {x.a}
            </b>
          </div>
        ))
      ) : (
        <p className="mu">No transactions yet.</p>
      )}
    </div>
  );

  // ==========================================
  // VIEW: MY TEAMS
  // ==========================================
  const renderTeams = () => {
    const mine = store.teams.filter((t: FantasyTeam) => t.me);

    const renderCard = (t: FantasyTeam) => {
      const m = store.matches.find((x: Match) => x.id === t.mid) || store.matches[0];
      const nm = (id: number) => {
        const p = m.players.find((pl) => pl.id === id);
        return p ? p.name + (t.c === id ? ' (C)' : t.vc === id ? ' (VC)' : '') : '?';
      };

      return (
        <div key={t.id} className="card me">
          <div className="row">
            <b>{t.name} (you)</b>
            <span className="big">{calcPts(t, m)}</span>
          </div>
          <div className="mu">
            {m.t1} vs {m.t2}
          </div>
          <div style={{ marginTop: '4px' }}>{t.ids.map(nm).join(', ')}</div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button className="ghost" onClick={() => setViewTeamId(t.id)}>
              View Team
            </button>
            <button
              className="ghost del"
              onClick={() => {
                if (store.joins.some((j: ContestJoin) => j.tid === t.id)) {
                  setBannerMsg('This team has joined a contest and cannot be deleted.');
                  if (showToast) showToast('This team has joined a contest and cannot be deleted.', 'error');
                } else {
                  store.teams = store.teams.filter((x: FantasyTeam) => x.id !== t.id);
                  setStore({ ...store });
                }
              }}
            >
              Delete
            </button>
          </div>
        </div>
      );
    };

    return (
      <div>
        <h2>My teams</h2>
        {mine.length ? (
          mine.map(renderCard)
        ) : (
          <p className="mu">You have not created a team yet. Start from the Matches tab.</p>
        )}
      </div>
    );
  };

  // ==========================================
  // VIEW: LEADERBOARD
  // ==========================================
  const renderLeaderboard = () => {
    if (!store.matches.length) return <p className="mu">No matches.</p>;
    const m = lbActiveMatch;
    const ts = store.teams
      .filter((t: FantasyTeam) => t.mid === m.id)
      .sort((a: FantasyTeam, b: FantasyTeam) => calcPts(b, m) - calcPts(a, m));

    return (
      <div>
        <div className="tabs">
          {store.matches.map((x: Match) => (
            <button
              key={x.id}
              className={`chip ${x.id === m.id ? 'on' : ''}`}
              onClick={() => setLeaderboardMatchId(x.id)}
            >
              {x.t1} vs {x.t2}
            </button>
          ))}
        </div>

        {ts.length ? (
          ts.map((t: FantasyTeam, i: number) => {
            const nm = (id: number) => {
              const p = m.players.find((pl) => pl.id === id);
              return p ? p.name + (t.c === id ? ' (C)' : t.vc === id ? ' (VC)' : '') : '?';
            };

            return (
              <div key={t.id} className={`card ${t.me ? 'me' : ''}`}>
                <div className="row">
                  <b>
                    {i + 1}. {t.name}
                    {t.me ? ' (you)' : ''}
                  </b>
                  <span className="big">{calcPts(t, m)}</span>
                </div>
                <div className="mu">
                  {m.t1} vs {m.t2}
                </div>
                <div style={{ marginTop: '4px' }}>{t.ids.map(nm).join(', ')}</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button className="ghost" onClick={() => setViewTeamId(t.id)}>
                    View Team
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="mu">No teams in this match yet.</p>
        )}
      </div>
    );
  };

  // ==========================================
  // VIEW: ADMIN LOGIN
  // ==========================================
  const renderAdminLogin = () => (
    <div className="card">
      <b>Admin login</b>
      {!store.pin && <div className="mu">Demo PIN: 1234</div>}
      <div className="row" style={{ marginTop: '8px' }}>
        <input
          type="password"
          placeholder="PIN"
          value={adminPinInput}
          onChange={(e) => setAdminPinInput(e.target.value)}
          style={{ flex: 1 }}
        />
        <button
          className="pri"
          style={{ margin: 0 }}
          onClick={() => {
            if (adminPinInput === (store.pin || '1234')) {
              setIsAdminLoggedIn(true);
              setAdminPinError('');
            } else {
              setAdminPinError('Wrong PIN.');
            }
          }}
        >
          Login
        </button>
      </div>
      {adminPinError && <div className="err">{adminPinError}</div>}
    </div>
  );

  // ==========================================
  // VIEW: ADMIN PANEL
  // ==========================================
  const renderAdmin = () => {
    const m = adminActiveMatch;

    const handleAddMatch = () => {
      const a1 = newTeam1.trim();
      const b1 = newTeam2.trim();
      if (!a1 || !b1) return;
      const id = Date.now();
      const newM: Match = {
        id,
        t1: a1,
        t2: b1,
        locked: false,
        players: [],
        contests: [],
      };
      const updated = { ...store, matches: [...store.matches, newM] };
      setStore(updated);
      setAdminMatchId(id);
      setNewTeam1('');
      setNewTeam2('');
      setBannerMsg('Match added successfully!');
    };

    const handleAddContest = () => {
      const n = newCName.trim();
      const f = parseFloat(newCFee) || 0;
      const s = parseInt(newCSpots) || 10;
      const p = newCPrizes.split(',').map(Number).filter((x) => x > 0);
      if (!n || s <= 0 || !p.length || p.length > s) {
        setBannerMsg('Enter a valid name, spots and prizes.');
        return;
      }
      m.contests.push({ id: Date.now(), name: n, fee: f, spots: s, prize: p });
      setStore({ ...store });
      setNewCName('');
      setBannerMsg('Contest added!');
    };

    const handleAddPlayer = () => {
      const n = newPName.trim();
      const c = parseFloat(newPCredits);
      if (!n || !(c > 0)) return;
      m.players.push({
        id: Date.now(),
        name: n,
        team: newPTeam,
        role: newPRole,
        cr: c,
        img: newPPhoto || '',
        pts: parseFloat(newPPoints) || 0,
      });
      setStore({ ...store });
      setNewPName('');
      setNewPPhoto('');
      setBannerMsg('Player added!');
    };

    const handleSettle = () => {
      if (!window.confirm('Is the result final? Prizes will be distributed.')) return;
      let count = 0;
      m.contests.forEach((c) => {
        if (c.done) return;
        getEntries(c)
          .filter(getTeam)
          .sort((x, y) => calcPts(getTeam(y)!, m) - calcPts(getTeam(x)!, m))
          .forEach((j, i) => {
            const pr = c.prize[i] || 0;
            j.prize = pr;
            if (pr && getTeam(j)?.me) {
              store.wallet += pr;
              store.tx.unshift({
                t: 'Prize: ' + c.name + ' (rank ' + (i + 1) + ')',
                a: pr,
              });
            }
          });
        c.done = true;
        count++;
      });
      m.locked = true;
      setStore({ ...store });
      setBannerMsg(count + ' contest(s) settled and prizes distributed.');
      confetti({ particleCount: 50 });
    };

    return (
      <div>
        {/* New match */}
        <div className="card">
          <b>New match</b>
          <div className="form">
            <input
              placeholder="Team 1"
              value={newTeam1}
              onChange={(e) => setNewTeam1(e.target.value)}
            />
            <input
              placeholder="Team 2"
              value={newTeam2}
              onChange={(e) => setNewTeam2(e.target.value)}
            />
            <button
              className="pri full"
              style={{ margin: 0 }}
              onClick={handleAddMatch}
            >
              Add match
            </button>
          </div>
        </div>

        {/* Selected match options */}
        {m && (
          <div>
            <div className="card">
              <div className="row">
                <select
                  value={m.id}
                  onChange={(e) => setAdminMatchId(Number(e.target.value))}
                  style={{ flex: 1 }}
                >
                  {store.matches.map((x: Match) => (
                    <option key={x.id} value={x.id}>
                      {x.t1} vs {x.t2}
                    </option>
                  ))}
                </select>
                <button
                  className="ghost"
                  onClick={() => {
                    m.locked = !m.locked;
                    setStore({ ...store });
                  }}
                >
                  {m.locked ? 'Unlock' : 'Lock'}
                </button>
                <button
                  className="ghost del"
                  onClick={() => {
                    if (!window.confirm('Delete this match and all its teams?')) return;
                    store.matches = store.matches.filter((x: Match) => x.id !== m.id);
                    store.teams = store.teams.filter((t: FantasyTeam) => t.mid !== m.id);
                    setStore({ ...store });
                  }}
                >
                  Delete
                </button>
              </div>
              <div className="mu" style={{ marginTop: '6px' }}>
                {m.locked
                  ? 'Locked: users cannot create new teams.'
                  : 'Open: users can create teams.'}
              </div>
            </div>

            {/* Team Names */}
            <div className="card">
              <b>Team names</b>
              <div className="form">
                <input
                  value={m.t1}
                  onChange={(e) => {
                    m.t1 = e.target.value;
                    setStore({ ...store });
                  }}
                />
                <input
                  value={m.t2}
                  onChange={(e) => {
                    m.t2 = e.target.value;
                    setStore({ ...store });
                  }}
                />
              </div>
            </div>

            {/* Contests Manager */}
            <div className="card">
              <b>Contests</b>
              {m.contests.map((c) => (
                <div key={c.id} className="row" style={{ marginTop: '6px' }}>
                  <span>
                    {c.name}: fee {c.fee}, pool {pool(c)}, {getEntries(c).length}/{c.spots}
                    {c.done ? ' (settled)' : ''}
                  </span>
                  <button
                    className="ghost del"
                    onClick={() => {
                      if (getEntries(c).length) {
                        setBannerMsg('This contest has entries and cannot be deleted.');
                      } else {
                        m.contests = m.contests.filter((x) => x.id !== c.id);
                        setStore({ ...store });
                      }
                    }}
                  >
                    X
                  </button>
                </div>
              ))}

              <div className="form">
                <input
                  className="full"
                  placeholder="Contest name"
                  value={newCName}
                  onChange={(e) => setNewCName(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Entry fee (₹ INR)"
                  value={newCFee}
                  onChange={(e) => setNewCFee(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Spots"
                  value={newCSpots}
                  onChange={(e) => setNewCSpots(e.target.value)}
                />
                <input
                  className="full"
                  placeholder="Prizes by rank: 300,150,50"
                  value={newCPrizes}
                  onChange={(e) => setNewCPrizes(e.target.value)}
                />
                <button
                  className="pri full"
                  style={{ margin: 0 }}
                  onClick={handleAddContest}
                >
                  Add contest
                </button>
              </div>

              <button
                className="pri"
                style={{ background: 'var(--ac2)', color: '#1b1500', width: '100%', marginTop: '10px' }}
                onClick={handleSettle}
              >
                Declare result and distribute prizes
              </button>
            </div>

            {/* Add Player */}
            <div className="card">
              <b>Add player</b>
              <div className="form">
                <input
                  className="full"
                  placeholder="Player name"
                  value={newPName}
                  onChange={(e) => setNewPName(e.target.value)}
                />
                <select
                  value={newPTeam}
                  onChange={(e) => setNewPTeam(Number(e.target.value))}
                >
                  <option value={1}>{m.t1}</option>
                  <option value={2}>{m.t2}</option>
                </select>
                <select
                  value={newPRole}
                  onChange={(e) => setNewPRole(e.target.value as PlayerRole)}
                >
                  <option value="WK">WK</option>
                  <option value="BAT">BAT</option>
                  <option value="AR">AR</option>
                  <option value="BOWL">BOWL</option>
                </select>
                <input
                  type="number"
                  step="0.5"
                  placeholder="Credits (8-11)"
                  value={newPCredits}
                  onChange={(e) => setNewPCredits(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Points"
                  value={newPPoints}
                  onChange={(e) => setNewPPoints(e.target.value)}
                />

                <div className="full" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    className="ghost"
                    onClick={() => handlePickImg((dataUrl) => setNewPPhoto(dataUrl))}
                  >
                    Add photo
                  </button>
                  {newPPhoto && <img src={newPPhoto} className="thumb" alt="Preview" />}
                </div>

                <button
                  className="pri full"
                  style={{ margin: 0 }}
                  onClick={handleAddPlayer}
                >
                  Add player
                </button>
              </div>
            </div>

            {/* Players List & Points update */}
            <h2>Players ({m.players.length}) and points</h2>
            {m.players.map((p) => (
              <div key={p.id} className="card">
                <div className="row" style={{ gap: '6px' }}>
                  <div style={{ flex: 1 }}>{renderAvatar(p, 44)}</div>
                  <button
                    className="ghost"
                    onClick={() =>
                      handlePickImg((dataUrl) => {
                        p.img = dataUrl;
                        setStore({ ...store });
                      })
                    }
                  >
                    {p.img ? 'Change photo' : 'Add photo'}
                  </button>
                  {p.img && (
                    <button
                      className="ghost del"
                      onClick={() => {
                        p.img = '';
                        setStore({ ...store });
                      }}
                    >
                      Remove
                    </button>
                  )}
                  <button
                    className="ghost del"
                    onClick={() => {
                      m.players = m.players.filter((x) => x.id !== p.id);
                      store.teams.forEach((t: FantasyTeam) => {
                        if (t.mid === m.id) {
                          t.ids = t.ids.filter((x) => x !== p.id);
                        }
                      });
                      setStore({ ...store });
                    }}
                  >
                    Delete
                  </button>
                </div>

                <div className="form">
                  <input
                    value={p.name}
                    placeholder="Name"
                    onChange={(e) => {
                      p.name = e.target.value;
                      setStore({ ...store });
                    }}
                  />
                  <select
                    value={p.team}
                    onChange={(e) => {
                      p.team = Number(e.target.value);
                      setStore({ ...store });
                    }}
                  >
                    <option value={1}>{m.t1}</option>
                    <option value={2}>{m.t2}</option>
                  </select>
                  <select
                    value={p.role}
                    onChange={(e) => {
                      p.role = e.target.value as PlayerRole;
                      setStore({ ...store });
                    }}
                  >
                    {(['WK', 'BAT', 'AR', 'BOWL'] as const).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.5"
                    value={p.cr}
                    placeholder="Credits"
                    onChange={(e) => {
                      p.cr = parseFloat(e.target.value) || 0;
                      setStore({ ...store });
                    }}
                  />
                  <input
                    className="full"
                    type="number"
                    value={p.pts}
                    placeholder="Points"
                    onChange={(e) => {
                      p.pts = parseFloat(e.target.value) || 0;
                      setStore({ ...store });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Wallet Admin Add */}
        <div className="card" style={{ marginTop: '12px' }}>
          <b>Wallet</b>
          <div className="form">
            <input
              type="number"
              placeholder="INR amount to add"
              value={addCoinsInput}
              onChange={(e) => setAddCoinsInput(e.target.value)}
            />
            <button
              className="pri"
              style={{ margin: 0 }}
              onClick={() => {
                const x = parseFloat(addCoinsInput);
                if (x > 0) {
                  store.wallet += x;
                  store.tx.unshift({ t: 'Added by admin', a: x });
                  setStore({ ...store });
                  setBannerMsg('₹' + x + ' INR added to the wallet.');
                }
              }}
            >
              Add INR
            </button>
          </div>
        </div>

        {/* Admin PIN */}
        <div className="card">
          <b>Admin PIN</b>
          <div className="form">
            <input
              type="password"
              placeholder="New PIN"
              value={newPinInput}
              onChange={(e) => setNewPinInput(e.target.value)}
            />
            <button
              className="pri"
              style={{ margin: 0 }}
              onClick={() => {
                const q = newPinInput.trim();
                if (q.length >= 4) {
                  store.pin = q;
                  setStore({ ...store });
                  setBannerMsg('PIN changed.');
                } else {
                  setBannerMsg('PIN must be at least 4 characters.');
                }
              }}
            >
              Change PIN
            </button>
          </div>
        </div>

        <button
          className="ghost del"
          style={{ width: '100%', marginTop: '10px' }}
          onClick={() => {
            if (!window.confirm('Reset all data to the demo?')) return;
            setStore(seed());
            setBannerMsg('Data reset to demo!');
          }}
        >
          Demo data reset
        </button>
      </div>
    );
  };

  const isUserRole = role === 'user';

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] text-[#0f172a] flex justify-center">
      <div id="app" className="fantasy-xi-root w-full shadow-sm">
        <style>{REFERENCE_CSS}</style>

        {/* Header */}
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: 0,
                fontSize: '24px',
                cursor: 'pointer',
                color: 'var(--tx)',
                padding: '0 4px',
                lineHeight: 1,
              }}
              title="Back"
            >
              &#8249;
            </button>
          )}
          <h1>Fantasy XI</h1>
        </div>

        <span className="tag ok">₹{store.wallet} INR</span>
      </header>

      {bannerMsg && (
        <div className="card" style={{ borderColor: 'var(--ac)', marginBottom: '10px' }}>
          {bannerMsg}
        </div>
      )}

      {/* User Navigation Tabs */}
      {isUserRole && (
        <div className="tabs">
          {[
            ['matches', 'Matches'],
            ['teams', 'My Teams'],
            ['lb', 'Leaderboard'],
            ['wallet', 'Wallet'],
          ].map(([id, label]) => (
            <button
              key={id}
              className={tab === id ? 'on' : ''}
              onClick={() => {
                setTab(id as any);
                setJoinContestId(null);
                setContestDetailId(null);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Main Content Router */}
      {isUserRole ? (
        tab === 'build' ? (
          renderBuild()
        ) : tab === 'cons' ? (
          joinContestId ? (
            renderJoinContest()
          ) : contestDetailId ? (
            renderContestDetail()
          ) : (
            renderContests()
          )
        ) : tab === 'wallet' ? (
          renderWallet()
        ) : tab === 'teams' ? (
          renderTeams()
        ) : tab === 'lb' ? (
          renderLeaderboard()
        ) : (
          renderMatches()
        )
      ) : isAdminLoggedIn ? (
        renderAdmin()
      ) : (
        renderAdminLogin()
      )}
      </div>
    </div>
  );
};

// Clean White & Emerald Green Cricket Fantasy Theme (Ground view retains green stadium field)
const REFERENCE_CSS = `
.fantasy-xi-root {
  --bg:#ffffff;
  --card:#ffffff;
  --tx:#0f172a;
  --mu:#64748b;
  --ac:#0d7a4f;
  --ac2:#f59e0b;
  --bd:#e2e8f0;
  --bad:#ef4444;
  box-sizing:border-box;
  max-width:560px;
  margin:0 auto;
  padding:14px 14px 120px;
  font:15px/1.45 "Trebuchet MS","Segoe UI",system-ui,sans-serif;
  color:var(--tx);
  background:var(--bg);
  min-height:100vh;
}
.fantasy-xi-root header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.fantasy-xi-root h1{font:800 22px/1 Georgia,serif;margin:0;letter-spacing:-.5px;color:var(--tx)}
.fantasy-xi-root h2{font:700 16px Georgia,serif;margin:14px 0 6px;color:var(--tx)}
.fantasy-xi-root .seg{display:flex;background:#f1f5f9;border:1px solid var(--bd);border-radius:20px;padding:2px}
.fantasy-xi-root .seg button{border:0;background:none;color:var(--mu);padding:6px 14px;border-radius:18px;font:inherit;font-weight:600;cursor:pointer}
.fantasy-xi-root .seg button.on{background:var(--ac);color:#fff}
.fantasy-xi-root .tabs{display:flex;gap:6px;margin:8px 0 12px;overflow-x:auto}
.fantasy-xi-root .tabs button,.fantasy-xi-root .chip{border:1px solid var(--bd);background:#ffffff;color:var(--tx);padding:6px 12px;border-radius:16px;font:inherit;white-space:nowrap;cursor:pointer}
.fantasy-xi-root .tabs button.on,.fantasy-xi-root .chip.on{background:var(--ac);color:#ffffff;border-color:var(--ac);font-weight:700}
.fantasy-xi-root .card{background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:14px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.04)}
.fantasy-xi-root .row{display:flex;justify-content:space-between;align-items:center;gap:8px}
.fantasy-xi-root .mu{color:var(--mu);font-size:13px}
.fantasy-xi-root .tag{font-size:12px;padding:2px 8px;border-radius:10px;background:#e2e8f0;color:#475569;font-weight:700}
.fantasy-xi-root .tag.ok{background:var(--ac);color:#fff}
.fantasy-xi-root button.pri{background:var(--ac);color:#fff;border:0;border-radius:10px;padding:9px 14px;font:inherit;font-weight:700;margin-top:8px;cursor:pointer}
.fantasy-xi-root button.pri:disabled{opacity:.4;cursor:not-allowed}
.fantasy-xi-root button.ghost{background:none;border:1px solid var(--bd);color:var(--tx);border-radius:10px;padding:6px 10px;font:inherit;cursor:pointer}
.fantasy-xi-root button.del{color:var(--bad);cursor:pointer}
.fantasy-xi-root input,.fantasy-xi-root select{font:inherit;color:var(--tx);background:#ffffff;border:1px solid #cbd5e1;border-radius:8px;padding:8px 12px;min-width:0}
.fantasy-xi-root .form{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}
.fantasy-xi-root .form .full{grid-column:1/-1}
.fantasy-xi-root .pl{display:flex;align-items:center;gap:8px;background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:9px 12px;margin-bottom:7px;cursor:pointer;user-select:none;box-shadow:0 1px 2px rgba(0,0,0,0.02)}
.fantasy-xi-root .pl>div:first-child{flex:1}
.fantasy-xi-root .pl.on{border-color:var(--ac);background:#f0fdf4}
.fantasy-xi-root .pl.dis{opacity:.4}
.fantasy-xi-root .cv{width:32px;height:32px;border-radius:50%;border:1px solid var(--mu);display:grid;place-items:center;font-size:12px;font-weight:800;cursor:pointer;color:var(--mu)}
.fantasy-xi-root .cv.act{background:var(--ac2);border-color:var(--ac2);color:#1b1500}
.fantasy-xi-root .bar{position:fixed;left:0;right:0;bottom:0;background:#ffffff;border-top:2px solid #e2e8f0;padding:12px 14px calc(14px + env(safe-area-inset-bottom,0px));z-index:999;box-shadow:0 -6px 25px rgba(0,0,0,0.14)}
.fantasy-xi-root .bar>div{max-width:560px;margin:0 auto}
.fantasy-xi-root .big{font:800 20px Georgia,serif;color:var(--tx)}
.fantasy-xi-root .err{color:var(--bad);font-size:13px;margin:4px 0}
.fantasy-xi-root .me{border-color:var(--ac2);border-width:2px}
.fantasy-xi-root .dot{display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:8px}
.fantasy-xi-root .dot.w{background:#0d7a4f}.fantasy-xi-root .dot.d{background:#0f172a}
.fantasy-xi-root .fv{margin:-14px -14px -120px;min-height:100vh;display:flex;flex-direction:column;color:#fff;background:repeating-linear-gradient(90deg,#5ea23b 0 46px,#69b044 46px 92px)}
.fantasy-xi-root .fvh{display:flex;align-items:center;gap:10px;padding:12px 14px}
.fantasy-xi-root .fvh .bk{background:none;border:0;color:#fff;font-size:34px;line-height:1;padding:0 6px;cursor:pointer}
.fantasy-xi-root .fvh .nm{flex:1;font-weight:700;font-size:18px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fantasy-xi-root .fvh .nm small{display:block;font-weight:500;font-size:12px;opacity:.85}
.fantasy-xi-root .fvh .ed{background:#fff;color:#111;border:0;border-radius:10px;padding:10px 16px;font:inherit;font-weight:700;cursor:pointer}
.fantasy-xi-root .fvf{margin:8px 12px 18px;padding:10px 4px 2px;border:2px solid rgba(255,255,255,.35);border-radius:120px;flex:1}
.fantasy-xi-root .fvr{margin:10px 0 22px}
.fantasy-xi-root .fvl{text-align:center;font-weight:700;font-size:20px;text-transform:uppercase;margin-bottom:10px;text-shadow:0 1px 2px #0004}
.fantasy-xi-root .fvp{display:flex;justify-content:center;flex-wrap:wrap;gap:10px 4px}
.fantasy-xi-root .fvc{position:relative;width:108px;text-align:center}
.fantasy-xi-root .fva{width:50px;height:50px;border-radius:50%;background:#bcd8b0;margin:0 auto;overflow:hidden;border:2px solid rgba(255,255,255,.5)}
.fantasy-xi-root .fva svg{width:100%;height:100%;display:block}
.fantasy-xi-root .fvn{position:relative;margin:-6px auto 0;display:inline-block;max-width:104px;padding:4px 8px;border-radius:3px;font-weight:700;font-size:13px;line-height:1.2}
.fantasy-xi-root .fvn.w{background:#fff;color:#111}.fantasy-xi-root .fvn.d{background:#1b1b1b;color:#fff}
.fantasy-xi-root .fvm{margin-top:3px;font-size:14px;color:#eef6e8;text-shadow:0 1px 2px #0004}
.fantasy-xi-root .fvb{position:absolute;left:16px;top:-6px;z-index:2;width:26px;height:26px;border-radius:50%;font-style:normal;font-size:12px;font-weight:800;display:grid;place-items:center;color:#fff;border:2px solid #fff8}
.fantasy-xi-root .fvb.c{background:#f08a00}.fantasy-xi-root .fvb.vc{background:#2f6bf0}
.fantasy-xi-root .fvg{background:#2c5a1d;padding:14px 18px calc(14px + env(safe-area-inset-bottom,0px));display:flex;gap:30px;font-weight:700;font-size:18px}
.fantasy-xi-root .thumb{width:44px;height:44px;border-radius:50%;object-fit:cover;background:#bcd8b0;display:block}
.fantasy-xi-root .thumb.ph svg{width:100%;height:100%;display:block}
.fantasy-xi-root .fva img{width:100%;height:100%;object-fit:cover;display:block}
`;
