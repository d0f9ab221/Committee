import React, { useState } from 'react';
import { PageConfig, CommitteeList, CommitteeMember } from '../types/committee';
import { CommitteeListCard } from './CommitteeListCard';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Search, Filter, Shield, Coins, CheckCircle, Clock, AlertTriangle, Info, LogIn } from 'lucide-react';

interface MainPageProps {
  pageConfig: PageConfig;
  lists: CommitteeList[];
  members: CommitteeMember[];
  onAddList: () => void;
  onEditList: (list: CommitteeList) => void;
  onAddMember: (listId: string) => void;
  onEditMember: (member: CommitteeMember) => void;
  onSelectMember: (member: CommitteeMember, list: CommitteeList) => void;
  onSeedData?: () => void;
}

export const MainPage: React.FC<MainPageProps> = ({
  pageConfig,
  lists,
  members,
  onAddList,
  onEditList,
  onAddMember,
  onEditMember,
  onSelectMember,
  onSeedData,
}) => {
  const { user, isAdmin, signInWithGoogle } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending' | 'Overdue'>('All');

  const currencySymbol = pageConfig.currencySymbol || 'PKR';

  // Calculate overall metrics
  const totalLists = lists.length;
  const totalMembersCount = members.length;
  const paidCount = members.filter((m) => m.paymentStatus === 'Paid').length;
  const pendingCount = members.filter((m) => m.paymentStatus === 'Pending').length;
  const overdueCount = members.filter((m) => m.paymentStatus === 'Overdue').length;

  const totalPoolTarget = members.reduce((sum, m) => sum + (m.monthlyContribution || 0), 0);
  const totalCollected = members
    .filter((m) => m.paymentStatus === 'Paid')
    .reduce((sum, m) => sum + (m.monthlyContribution || 0), 0);

  // Filter members based on search and status
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.phone && m.phone.includes(searchTerm)) ||
      (m.notes && m.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || m.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Customizable Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Private Committee Portal</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            {pageConfig.title || 'Mughal Family Committee'}
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            {pageConfig.description || 'Private committee savings pool, payout schedule, and member contribution tracker.'}
          </p>
        </div>

        {/* Global Key Stats Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Active Pools</span>
            <span className="text-xl font-extrabold text-slate-100">{totalLists}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Participants</span>
            <span className="text-xl font-extrabold text-slate-100">{totalMembersCount}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Monthly Target</span>
            <span className="text-xl font-extrabold text-amber-400">
              {currencySymbol} {totalPoolTarget.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Collected This Month</span>
            <span className="text-xl font-extrabold text-emerald-400">
              {currencySymbol} {totalCollected.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Unauthenticated Sign In Banner or Non-Admin Read-Only Notice */}
      {!user ? (
        <div className="bg-white border border-amber-200 rounded-3xl p-8 text-center space-y-4 shadow-xs max-w-lg mx-auto my-6">
          <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto font-bold">
            <Coins className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Private Committee Portal</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            To view committee pools, payout schedules, and member contribution records, please sign in with your Google account.
          </p>
          <button
            onClick={signInWithGoogle}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In with Google</span>
          </button>
        </div>
      ) : null}

      {/* Controls & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search member name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['All', 'Paid', 'Pending', 'Overdue'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status} {status === 'Paid' ? `(${paidCount})` : status === 'Pending' ? `(${pendingCount})` : status === 'Overdue' ? `(${overdueCount})` : ''}
            </button>
          ))}
        </div>

        {/* Admin Add List Button */}
        {isAdmin && (
          <button
            onClick={onAddList}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Pool</span>
          </button>
        )}
      </div>

      {/* Render Lists */}
      {lists.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center font-bold">
            <Coins className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Committee Lists Available</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isAdmin
              ? 'Get started by creating your first committee list pool.'
              : 'The administrator has not created any committee lists yet. Check back soon!'}
          </p>
          {isAdmin && (
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={onAddList}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create First Committee List</span>
              </button>
              {onSeedData && (
                <button
                  onClick={onSeedData}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs rounded-xl shadow transition border border-slate-700"
                >
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Seed Initial Sample Data</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        lists.map((list) => (
          <CommitteeListCard
            key={list.id}
            list={list}
            members={filteredMembers}
            currencySymbol={currencySymbol}
            onEditList={onEditList}
            onAddMember={onAddMember}
            onEditMember={onEditMember}
            onSelectMember={onSelectMember}
          />
        ))
      )}

    </div>
  );
};
