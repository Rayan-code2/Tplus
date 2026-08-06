import React, { useState } from 'react';
import {
  GitFork,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  Users,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Layers,
  Award,
} from 'lucide-react';
import { User, SystemSettings, LevelBreakdownRow } from '../types';

interface MatrixTreeViewProps {
  currentUser: User;
  users: User[];
  settings: SystemSettings;
}

export const MatrixTreeView: React.FC<MatrixTreeViewProps> = ({
  currentUser,
  users,
  settings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRootId, setSelectedRootId] = useState<string>(currentUser.id);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<number>(0); // 0 = All

  const rootUser = users.find((u) => u.id === selectedRootId) || currentUser;

  // Build 2x2 Forced Matrix Placement Map with strict max 2 children per parent
  const buildPlacementTree = () => {
    const childrenMap = new Map<string, User[]>();

    const getChildren = (pId: string) => childrenMap.get(pId) || [];

    const addChild = (pId: string, child: User) => {
      const existing = childrenMap.get(pId) || [];
      if (existing.length < 2 && !existing.some((u) => u.id === child.id)) {
        childrenMap.set(pId, [...existing, child]);
        return true;
      }
      return false;
    };

    // Sort users by registration or array order
    const remainingUsers = [...users].filter((u) => u.id !== rootUser.id);

    remainingUsers.forEach((u) => {
      // 1. Try explicit placementUplineId if valid and < 2 children
      if (u.placementUplineId) {
        const added = addChild(u.placementUplineId, u);
        if (added) return;
      }

      // 2. Otherwise BFS spillover placement starting from sponsorId (or rootUser)
      const startSponsorId = u.sponsorId && users.some((s) => s.id === u.sponsorId) ? u.sponsorId : rootUser.id;
      const queue = [startSponsorId];
      const visited = new Set<string>([startSponsorId]);

      while (queue.length > 0) {
        const currParentId = queue.shift()!;
        const currChildren = getChildren(currParentId);

        if (currChildren.length < 2) {
          addChild(currParentId, u);
          break;
        }

        for (const childNode of currChildren) {
          if (!visited.has(childNode.id)) {
            visited.add(childNode.id);
            queue.push(childNode.id);
          }
        }
      }
    });

    return childrenMap;
  };

  const placementMap = buildPlacementTree();

  // Get direct placement children for visual tree
  const getDirectChildren = (parentId: string): User[] => {
    const list = placementMap.get(parentId) || [];
    if (!searchQuery) return list;
    return list.filter(
      (u) =>
        u.nodeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getUserActivePackage = (u: User) => {
    if (!u.activePackageId || u.activePackageId === 'none' || u.activePackageId === 'null' || u.activePackageId === '') {
      return null;
    }
    return settings.packages.find((p) => p.id === u.activePackageId) || null;
  };

  // Build Dynamic Level Breakdown Table data (2x2 Matrix Placement Tree)
  const getLevelBreakdown = (): LevelBreakdownRow[] => {
    const rows: LevelBreakdownRow[] = [];

    let currentLevelUsers: User[] = [rootUser];
    const maxLevelCount = Math.max(10, settings.levelIncomePercentages?.length || 10);

    for (let level = 1; level <= maxLevelCount; level++) {
      const nextLevelUsers: User[] = [];
      currentLevelUsers.forEach((parent) => {
        const children = placementMap.get(parent.id) || [];
        nextLevelUsers.push(...children);
      });

      const config = settings.levelIncomePercentages.find((l) => l.level === level);
      const levelPercent = config ? config.percent : 0;

      const activeUsersList = nextLevelUsers.filter((u) => getUserActivePackage(u) !== null);
      const activeCount = activeUsersList.length;
      const inactiveCount = nextLevelUsers.length - activeCount;

      // Calculate total volume of level (only from users with active packages)
      const volume = nextLevelUsers.reduce((sum, u) => {
        const pkg = getUserActivePackage(u);
        return sum + (pkg ? pkg.price : 0);
      }, 0);

      const earned = volume * (levelPercent / 100);

      // Income per active node (e.g., for $10 node at 5% = $0.50 USDT per node)
      const avgNodePrice = activeCount > 0 ? volume / activeCount : settings.packages[0]?.price || 10;
      const incomePerNode = avgNodePrice * (levelPercent / 100);

      rows.push({
        level,
        percentage: levelPercent,
        totalUsers: nextLevelUsers.length,
        activeUsers: activeCount,
        inactiveUsers: inactiveCount,
        volume,
        incomePerNode,
        earned,
      });

      currentLevelUsers = nextLevelUsers;
    }

    return rows;
  };

  const levelBreakdown = getLevelBreakdown();

  const totalDownlineMembers = levelBreakdown.reduce((sum, r) => sum + r.totalUsers, 0);
  const totalActiveNodes = levelBreakdown.reduce((sum, r) => sum + r.activeUsers, 0);
  const totalInactiveNodes = levelBreakdown.reduce((sum, r) => sum + r.inactiveUsers, 0);
  const totalMatrixVolume = levelBreakdown.reduce((sum, r) => sum + r.volume, 0);
  const totalEstEarnings = levelBreakdown.reduce((sum, r) => sum + r.earned, 0);

  return (
    <div className="space-y-8 font-mono pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0b1424] border border-cyan-500/30 p-5 rounded-2xl">
        <div>
          <h2 className="text-lg font-bold text-cyan-300 flex items-center gap-2">
            <GitFork className="w-5 h-5 text-cyan-400" />
            10-Level Matrix Genealogy Tree
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visualizing Node <span className="text-white font-bold">#{rootUser.nodeId}</span> ({rootUser.name})
          </p>
        </div>

        {/* Search & Root Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Node ID / Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#050911] border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-cyan-300 focus:outline-none focus:border-cyan-500 w-48"
            />
          </div>

          {selectedRootId !== currentUser.id && (
            <button
              onClick={() => setSelectedRootId(currentUser.id)}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset To My Node
            </button>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-[#050911] border border-slate-700 p-1 rounded-xl">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
              className="p-1 hover:bg-slate-800 rounded text-slate-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-cyan-400 font-bold px-1.5">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              className="p-1 hover:bg-slate-800 rounded text-slate-300"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* VISUAL MATRIX TREE CONTAINER */}
      <div className="bg-[#050911] border border-cyan-500/20 rounded-2xl p-6 overflow-x-auto min-h-[420px] shadow-inner relative flex justify-center items-center">
        <div
          className="transition-transform duration-300 origin-top flex flex-col items-center gap-8 py-4"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* LEVEL 0: ROOT NODE */}
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-br from-[#0c1d33] to-[#081220] border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] rounded-2xl p-4 w-64 text-center space-y-2 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-black font-extrabold text-[9px] uppercase px-3 py-0.5 rounded-full tracking-wider">
                Root Node
              </span>
              <div className="text-cyan-300 font-bold text-sm">#{rootUser.nodeId}</div>
              <div className="text-white font-semibold text-xs truncate">{rootUser.name}</div>
              <div className="text-[10px] text-slate-400">
                Pkg:{' '}
                <span className="text-emerald-400 font-bold">
                  {getUserActivePackage(rootUser)?.name || 'None'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] pt-2 border-t border-slate-800 text-slate-300">
                <span>Directs: {rootUser.directReferralsCount}</span>
                <span className="text-amber-400 font-bold">{rootUser.rank}</span>
              </div>
            </div>

            {/* Tree Connector Line */}
            {getDirectChildren(rootUser.id).length > 0 && (
              <div className="w-0.5 h-8 bg-cyan-500/50 my-1" />
            )}
          </div>

          {/* LEVEL 1: DIRECT REFERRALS */}
          {getDirectChildren(rootUser.id).length > 0 && (
            <div className="relative">
              {/* Horizontal Connecting Line */}
              <div className="absolute -top-4 left-8 right-8 h-0.5 bg-cyan-500/40" />

              <div className="flex flex-wrap justify-center gap-6">
                {getDirectChildren(rootUser.id).map((child) => {
                  const grandChildren = getDirectChildren(child.id);
                  const pkg = getUserActivePackage(child);

                  return (
                    <div key={child.id} className="flex flex-col items-center space-y-2">
                      <div className="w-0.5 h-4 bg-cyan-500/40" />
                      <div
                        onClick={() => setSelectedRootId(child.id)}
                        className="bg-[#0b1626] border border-cyan-500/30 hover:border-cyan-400 cursor-pointer transition rounded-xl p-3.5 w-56 space-y-2 group shadow-md hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-cyan-300 font-bold text-xs">#{child.nodeId}</span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              pkg ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-slate-600'
                            }`}
                          />
                        </div>
                        <div className="text-white text-xs font-semibold truncate">{child.name}</div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span>
                            {pkg ? pkg.name : 'No Package'}
                          </span>
                          <span className="text-cyan-400 font-bold">${child.teamVolume} Vol</span>
                        </div>
                        <div className="text-[9px] text-slate-500 pt-1.5 border-t border-slate-800/80 text-center group-hover:text-cyan-300">
                          Click to focus this node →
                        </div>
                      </div>

                      {/* LEVEL 2 CHILDREN PREVIEW */}
                      {grandChildren.length > 0 && (
                        <div className="flex flex-col items-center space-y-2 pt-1">
                          <div className="w-0.5 h-4 bg-slate-700" />
                          <div className="flex gap-2">
                            {grandChildren.slice(0, 3).map((gc) => (
                              <div
                                key={gc.id}
                                onClick={() => setSelectedRootId(gc.id)}
                                className="bg-[#080e18] border border-slate-800 hover:border-cyan-500/40 p-2 rounded-lg text-center cursor-pointer text-[10px] w-28"
                              >
                                <div className="text-cyan-400 font-bold truncate">#{gc.nodeId}</div>
                                <div className="text-slate-400 truncate">{gc.name.split(' ')[0]}</div>
                              </div>
                            ))}
                            {grandChildren.length > 3 && (
                              <div className="bg-[#080e18] border border-slate-800 p-2 rounded-lg text-center text-[10px] text-slate-500 flex items-center justify-center">
                                +{grandChildren.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 10-LEVEL BREAKDOWN STATS SUMMARY & TABLE */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            10-Level Matrix Performance & Commission Report
          </h3>
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#0b1424] border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Total Downline</div>
            <div className="text-sm font-extrabold text-white mt-0.5">{totalDownlineMembers} Users</div>
            <div className="text-[10px] text-slate-500 mt-1">
              <span className="text-emerald-400 font-bold">{totalActiveNodes} Active</span> / {totalInactiveNodes} Inactive
            </div>
          </div>
          <div className="bg-[#0b1424] border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Active Nodes</div>
            <div className="text-sm font-extrabold text-emerald-400 mt-0.5">{totalActiveNodes} Active</div>
            <div className="text-[10px] text-slate-500 mt-1">Paid package members</div>
          </div>
          <div className="bg-[#0b1424] border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Inactive Nodes</div>
            <div className="text-sm font-extrabold text-slate-400 mt-0.5">{totalInactiveNodes} Inactive</div>
            <div className="text-[10px] text-slate-500 mt-1">Free / Unpaid members</div>
          </div>
          <div className="bg-[#0b1424] border border-amber-500/30 rounded-xl p-3 bg-amber-500/5">
            <div className="text-[10px] text-amber-400 font-bold uppercase">Total Level Income</div>
            <div className="text-sm font-extrabold text-amber-300 mt-0.5">${totalEstEarnings.toFixed(2)} USDT</div>
            <div className="text-[10px] text-amber-500/80 mt-1">Calculated Level Commission</div>
          </div>
        </div>

        {/* CLEAN & TRANSPARENT TABLE */}
        <div className="bg-[#0b1424] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#050911] text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Level #</th>
                  <th className="p-3.5">Level Comm. %</th>
                  <th className="p-3.5">Total Members</th>
                  <th className="p-3.5">Active / Inactive Status</th>
                  <th className="p-3.5 text-right">Level Income (USDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {levelBreakdown.map((row) => (
                  <tr key={row.level} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold text-cyan-300 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">
                        L{row.level}
                      </span>
                      Level {row.level}
                    </td>
                    <td className="p-3.5 font-bold text-emerald-400">{row.percentage}%</td>
                    <td className="p-3.5 font-bold text-white">{row.totalUsers} users</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          {row.activeUsers} Active
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-400 border border-slate-700">
                          {row.inactiveUsers} Inactive
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-amber-300 text-right">
                      ${row.earned.toFixed(2)} USDT
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
