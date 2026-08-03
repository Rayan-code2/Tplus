import React, { useState } from 'react';
import {
  Zap,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  Users,
  Award,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { User, BoostingEntry, SystemSettings } from '../types';

interface BoostingQueueViewProps {
  currentUser: User;
  boostingQueue: BoostingEntry[];
  settings: SystemSettings;
  onSimulateBoosting: () => Promise<void>;
}

export const BoostingQueueView: React.FC<BoostingQueueViewProps> = ({
  currentUser,
  boostingQueue,
  settings,
  onSimulateBoosting,
}) => {
  const [simulating, setSimulating] = useState(false);

  const minDirects = settings.boostingPool.minDirects;
  const minPkgPrice = settings.boostingPool.minPackagePrice;
  const rewardAmt = settings.boostingPool.rewardAmount;
  const maxRebirth = settings.boostingPool.maxRebirthLimit;

  // Qualification checks
  const activePkg = settings.packages.find((p) => p.id === currentUser.activePackageId);
  const pkgPrice = activePkg ? activePkg.price : 0;

  const hasMinDirects = currentUser.directReferralsCount >= minDirects;
  const hasMinPackage = pkgPrice >= minPkgPrice;
  const isQualified = hasMinDirects && hasMinPackage;

  // Find user's position in queue
  const userEntry = boostingQueue.find((b) => b.userId === currentUser.id);
  const userPosition = userEntry ? userEntry.position : null;
  const totalEntries = boostingQueue.length;

  const progressPercent = userPosition
    ? Math.max(10, Math.round(((totalEntries - userPosition + 1) / totalEntries) * 100))
    : 0;

  const handleSimulateCycle = async () => {
    setSimulating(true);
    try {
      await onSimulateBoosting();
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-8 font-mono pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#112317] via-[#091a13] to-[#0c1a26] border border-emerald-500/40 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_25px_rgba(16,185,129,0.15)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]" />
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
                Automated FIFO Gold Pool System
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Global Boosting Queue (${rewardAmt} USDT Payout)
            </h2>
            <p className="text-xs text-slate-300">
              A fair First-In-First-Out global matrix queue. Qualify once, collect ${rewardAmt} USDT payouts continuously, and auto-rebirth up to {maxRebirth} times!
            </p>
          </div>

          <div className="bg-[#050911] border border-emerald-500/30 p-4 rounded-xl text-center space-y-1.5 shrink-0 w-full md:w-auto">
            <div className="text-[10px] text-slate-400 uppercase">Payout Reward</div>
            <div className="text-3xl font-extrabold text-emerald-400">${rewardAmt} USDT</div>
            <div className="text-[10px] text-slate-400">Paid directly to wallet</div>
          </div>
        </div>
      </div>

      {/* QUALIFICATION CHECKLIST & YOUR PROGRESS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Qualification Checklist */}
        <div className="bg-[#0b1424] border border-cyan-500/30 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            Qualification Checklist
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#050911] border border-slate-800">
              <div className="flex items-center gap-2.5">
                {hasMinDirects ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <div>
                  <div className="text-slate-200 font-bold">Direct Referrals Rule</div>
                  <div className="text-[10px] text-slate-400">
                    Required: Min {minDirects} Active Directs (You have {currentUser.directReferralsCount})
                  </div>
                </div>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  hasMinDirects ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                }`}
              >
                {hasMinDirects ? 'Qualified' : 'Pending'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#050911] border border-slate-800">
              <div className="flex items-center gap-2.5">
                {hasMinPackage ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <div>
                  <div className="text-slate-200 font-bold">Minimum Package Threshold</div>
                  <div className="text-[10px] text-slate-400">
                    Required: Min ${minPkgPrice} Active Package (You have ${pkgPrice})
                  </div>
                </div>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  hasMinPackage ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                }`}
              >
                {hasMinPackage ? 'Qualified' : 'Pending'}
              </span>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Status:{' '}
            {isQualified ? (
              <span className="text-emerald-400 font-bold">Fully Qualified for Global Gold Queue!</span>
            ) : (
              <span className="text-amber-400 font-bold">Refer {minDirects - currentUser.directReferralsCount} more user(s) to enter queue.</span>
            )}
          </div>
        </div>

        {/* Live Queue Slot Visualizer */}
        <div className="bg-[#0b1424] border border-emerald-500/30 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                Your Live Queue Position
              </h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                {totalEntries} Total In Line
              </span>
            </div>

            {userPosition ? (
              <div className="space-y-4 pt-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-slate-400 text-xs">Current Slot:</span>
                  <span className="text-3xl font-extrabold text-cyan-300">
                    Slot #{userPosition}{' '}
                    <span className="text-xs font-normal text-slate-400">of {totalEntries}</span>
                  </span>
                </div>

                {/* Queue Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Queue Entry</span>
                    <span>Payout Cycle ($50 USDT)</span>
                  </div>
                  <div className="w-full bg-[#050911] rounded-full h-3 p-0.5 border border-slate-700 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_#10b981]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Rebirths Completed:{' '}
                  <span className="text-amber-300 font-bold">
                    {userEntry?.rebirthCount || 0} / {maxRebirth} Rebirths
                  </span>
                </p>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2 text-slate-400 text-xs">
                <p>You are not currently in the queue.</p>
                <p className="text-cyan-400 text-[11px]">
                  Fulfill the qualification criteria above or buy a package to auto-enter!
                </p>
              </div>
            )}
          </div>


        </div>
      </div>

      {/* LIVE GLOBAL QUEUE TABLE */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          Live Global FIFO Queue Order
        </h3>

        <div className="bg-[#0b1424] border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#050911] text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Pos #</th>
                  <th className="p-3.5">Node ID</th>
                  <th className="p-3.5">User Name</th>
                  <th className="p-3.5">Package</th>
                  <th className="p-3.5">Rebirth Count</th>
                  <th className="p-3.5">Qualified Date</th>
                  <th className="p-3.5">Next Reward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {boostingQueue.map((entry) => {
                  const isMe = entry.userId === currentUser.id;
                  const pkg = settings.packages.find((p) => p.id === entry.packageId);

                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-slate-800/40 transition ${
                        isMe ? 'bg-cyan-500/10 font-bold border-l-2 border-l-cyan-400' : ''
                      }`}
                    >
                      <td className="p-3.5">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                            entry.position === 1
                              ? 'bg-amber-500 text-black shadow-[0_0_8px_#f59e0b]'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          #{entry.position}
                        </span>
                      </td>
                      <td className="p-3.5 text-cyan-300 font-bold flex items-center gap-1.5">
                        #{entry.nodeId}
                        {isMe && (
                          <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-500/30">
                            YOU
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-white">{entry.userName}</td>
                      <td className="p-3.5 text-slate-400">{pkg ? pkg.name : 'Starter'}</td>
                      <td className="p-3.5 font-bold text-amber-300">
                        {entry.rebirthCount} / {maxRebirth} Rebirths
                      </td>
                      <td className="p-3.5 text-slate-500 text-[10px]">
                        {new Date(entry.qualifiedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 font-bold text-emerald-400">
                        {entry.position === 1 ? 'NEXT IN LINE ($50 USDT)' : 'In Queue'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
