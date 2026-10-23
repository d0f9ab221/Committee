import React, { useState } from 'react';
import { CommitteeList, CommitteeMember, PaymentStatus } from '../types/committee';
import { useAuth } from '../context/AuthContext';
import { toggleMemberPaymentStatus, deleteMember, deleteCommitteeList, updateCommitteeList } from '../services/committeeService';
import { CheckCircle2, Clock, AlertTriangle, UserPlus, Edit2, Trash2, Phone, Calendar, DollarSign, ChevronDown, ChevronUp, Lock, Check, X, Eye, CheckCircle } from 'lucide-react';

interface CommitteeListCardProps {
  list: CommitteeList;
  members: CommitteeMember[];
  currencySymbol: string;
  onEditList: (list: CommitteeList) => void;
  onAddMember: (listId: string) => void;
  onEditMember: (member: CommitteeMember) => void;
  onSelectMember: (member: CommitteeMember, list: CommitteeList) => void;
}

export const CommitteeListCard: React.FC<CommitteeListCardProps> = ({
  list,
  members,
  currencySymbol,
  onEditList,
  onAddMember,
  onEditMember,
  onSelectMember,
}) => {
  const { user, isAdmin } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null);

  // Inline editing state for list title
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [inlineTitle, setInlineTitle] = useState(list.title);
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  // Filter members belonging to this list
  const listMembers = members.filter((m) => m.listId === list.id);

  // Calculate statistics & target payment progress for this list
  const totalMembers = listMembers.length;
  const paidMembersCount = listMembers.filter((m) => m.paymentStatus === 'Paid').length;
  const pendingMembersCount = listMembers.filter((m) => m.paymentStatus === 'Pending').length;
  const overdueMembersCount = listMembers.filter((m) => m.paymentStatus === 'Overdue').length;

  const memberContributionsSum = listMembers.reduce(
    (sum, m) => sum + (m.monthlyContribution !== undefined ? m.monthlyContribution : list.monthlyAmount),
    0
  );

  const totalMonthlyTarget = list.totalMembers && list.totalMembers > listMembers.length
    ? Math.max(memberContributionsSum, list.monthlyAmount * list.totalMembers)
    : (memberContributionsSum || list.monthlyAmount);

  const collectedAmount = listMembers
    .filter((m) => m.paymentStatus === 'Paid')
    .reduce(
      (sum, m) => sum + (m.monthlyContribution !== undefined ? m.monthlyContribution : list.monthlyAmount),
      0
    );

  const remainingTarget = Math.max(0, totalMonthlyTarget - collectedAmount);
  const progressPercent = totalMonthlyTarget > 0 ? Math.min(100, Math.round((collectedAmount / totalMonthlyTarget) * 100)) : 0;

  const handleToggleStatus = async (e: React.MouseEvent, member: CommitteeMember) => {
    e.stopPropagation(); // Don't trigger modal click
    if (!isAdmin) return;
    setLoadingMemberId(member.id);
    try {
      await toggleMemberPaymentStatus(member.id, member.paymentStatus);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMemberId(null);
    }
  };

  const handleToggleListCompleted = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    const nextStatus = list.status === 'completed' ? 'active' : 'completed';
    try {
      await updateCommitteeList(list.id, { status: nextStatus });
    } catch (err) {
      console.error('Failed to toggle list completed status:', err);
    }
  };

  const handleSaveInlineTitle = async () => {
    if (!isAdmin || !inlineTitle.trim()) return;
    setIsSavingTitle(true);
    try {
      await updateCommitteeList(list.id, { title: inlineTitle.trim() });
      setIsEditingTitle(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleDeleteMember = async (e: React.MouseEvent, member: CommitteeMember) => {
    e.stopPropagation();
    if (!isAdmin) {
      alert('Only verified administrator (kfmughal79@gmail.com) can remove members.');
      return;
    }
    if (confirm(`Remove member "${member.name}" from this committee list?`)) {
      setLoadingMemberId(member.id);
      try {
        await deleteMember(member.id);
      } catch (err: any) {
        console.error('Delete member error:', err);
        alert(`Could not delete member. Permission or network error: ${err?.message || err}`);
      } finally {
        setLoadingMemberId(null);
      }
    }
  };

  const handleDeleteList = async () => {
    if (!isAdmin) {
      alert('Only verified administrator (kfmughal79@gmail.com) can delete committee lists.');
      return;
    }
    if (confirm(`Are you sure you want to delete committee list "${list.title}" and all its associated member records?`)) {
      try {
        await deleteCommitteeList(list.id, listMembers);
      } catch (err: any) {
        console.error('Delete committee list error:', err);
        alert(`Could not delete committee list. Permission or network error: ${err?.message || err}`);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-6 transition relative">
      
      {/* Completed Stamp Overlay if status is completed */}
      {list.status === 'completed' && (
        <div className="absolute top-2 right-12 z-20 pointer-events-none transform -rotate-12 opacity-90 transition-all scale-90 sm:scale-100">
          <img
            src="/assets/aistudio/b052b881599bc61cd6727a2cdc19f62d_7caa05aa.jpg"
            alt="Completed Stamp"
            className="w-28 sm:w-36 h-auto drop-shadow-md mix-blend-multiply"
          />
        </div>
      )}

      {/* List Header */}
      <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            {isEditingTitle && isAdmin ? (
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  value={inlineTitle}
                  onChange={(e) => setInlineTitle(e.target.value)}
                  className="px-2.5 py-1 text-sm bg-slate-800 border border-amber-400 rounded-lg text-white font-bold focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveInlineTitle}
                  disabled={isSavingTitle}
                  className="p-1 rounded bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                  title="Save Title"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setInlineTitle(list.title);
                    setIsEditingTitle(false);
                  }}
                  className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <h3
                onClick={() => isAdmin && setIsEditingTitle(true)}
                className={`text-lg font-bold tracking-tight text-white ${
                  isAdmin ? 'cursor-pointer hover:text-amber-300 transition decoration-amber-400/50 hover:underline' : ''
                }`}
                title={isAdmin ? 'Click to edit title inline' : ''}
              >
                {list.title}
              </h3>
            )}

            <button
              disabled={!isAdmin}
              onClick={handleToggleListCompleted}
              className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full transition ${
                list.status === 'active'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                  : list.status === 'completed'
                  ? 'bg-emerald-500 text-slate-950 border border-emerald-400 font-extrabold shadow-xs hover:bg-emerald-400'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              } ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
              title={isAdmin ? 'Click to toggle completed stamp' : 'Pool Status'}
            >
              {list.status === 'completed' ? '✓ COMPLETED' : list.status}
            </button>
          </div>
          {list.description && <p className="text-xs text-slate-300 max-w-xl">{list.description}</p>}
        </div>

        {/* Amount & Admin Actions */}
        <div className="flex items-center justify-between sm:justify-end space-x-3">
          <div className="text-right">
            <span className="text-[10px] uppercase text-slate-400 block font-semibold">Current Payment / Pool</span>
            <span className="text-base font-extrabold text-amber-400">
              {currencySymbol} {list.monthlyAmount.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-800">
            {isAdmin && (
              <>
                <button
                  onClick={handleToggleListCompleted}
                  className={`p-1.5 rounded-lg transition ${
                    list.status === 'completed'
                      ? 'bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400'
                      : 'text-slate-300 hover:text-emerald-400 hover:bg-slate-800'
                  }`}
                  title={list.status === 'completed' ? 'Remove Completed Stamp' : 'Set Completed Stamp'}
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEditList(list)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-slate-800 transition"
                  title="Edit List Settings"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDeleteList}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-rose-400 hover:bg-slate-800 transition"
                  title="Delete Committee List"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 transition"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Progress & Quick Summary */}
      <div className="bg-slate-50 border-b border-slate-200 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-slate-500 text-[11px] block">Total Members</span>
            <span className="text-sm font-bold text-slate-800">{totalMembers} slots</span>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
            <span className="text-emerald-700 text-[11px] block font-medium">Collected</span>
            <span className="text-sm font-bold text-emerald-800">
              {currencySymbol} {collectedAmount.toLocaleString()}
            </span>
          </div>
          <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100">
            <span className="text-amber-700 text-[11px] block font-medium">Pending</span>
            <span className="text-sm font-bold text-amber-800">{pendingMembersCount} members</span>
          </div>
          <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100">
            <span className="text-rose-700 text-[11px] block font-medium">Overdue</span>
            <span className="text-sm font-bold text-rose-800">{overdueMembersCount} members</span>
          </div>
        </div>

        {/* Collection Bar */}
        <div>
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
            <span>Current Payment Progress ({progressPercent}%)</span>
            <span>
              {currencySymbol} {collectedAmount.toLocaleString()} / {currencySymbol} {totalMonthlyTarget.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Member Table & Mobile Cards */}
      {isExpanded && (
        <div className="p-4">
          
          {/* Top Actions */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <span>Member Contributions & Payment Status</span>
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                {listMembers.length}
              </span>
            </h4>

            {isAdmin && (
              <button
                onClick={() => onAddMember(list.id)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>
            )}
          </div>

          {listMembers.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-500 font-medium">No members added to this committee pool yet.</p>
              {isAdmin && (
                <button
                  onClick={() => onAddMember(list.id)}
                  className="mt-2 text-xs font-bold text-amber-600 hover:text-amber-700 underline"
                >
                  Click to add the first member
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-50">
                      <th className="py-2.5 px-3">Slot #</th>
                      <th className="py-2.5 px-3">Member Name & Photo</th>
                      <th className="py-2.5 px-3">Current Payment</th>
                      <th className="py-2.5 px-3">Payout Month</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3">Notes</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {listMembers.map((member) => {
                      const isCurrentUser = user && user.displayName?.toLowerCase().includes(member.name.toLowerCase());
                      const displayPhoto = member.avatarUrl || (isCurrentUser ? user?.photoURL : null);
                      const currentVal = member.monthlyContribution !== undefined ? member.monthlyContribution : list.monthlyAmount;

                      return (
                        <tr
                          key={member.id}
                          onClick={() => onSelectMember(member, list)}
                          className="hover:bg-amber-50/40 cursor-pointer transition"
                        >
                          <td className="py-3 px-3 font-bold text-slate-400">#{member.orderNumber || '-'}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            <div className="flex items-center space-x-2">
                              {displayPhoto ? (
                                <img
                                  src={displayPhoto}
                                  alt={member.name}
                                  className="w-7 h-7 rounded-full border border-amber-400 object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-amber-400/50">
                                  {member.name[0]?.toUpperCase() || 'M'}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center space-x-1.5">
                                  <span>{member.name}</span>
                                  {isCurrentUser && (
                                    <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                                      You
                                    </span>
                                  )}
                                </div>
                                {member.phone && (
                                  <span className="text-[10px] text-slate-400 flex items-center space-x-1 font-normal">
                                    <Phone className="w-2.5 h-2.5" />
                                    <span>{member.phone}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-800">
                            {currencySymbol} {currentVal.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-medium">
                            {member.payoutMonth || 'TBD'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              disabled={!isAdmin || loadingMemberId === member.id}
                              onClick={(e) => handleToggleStatus(e, member)}
                              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold transition ${
                                member.paymentStatus === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                                  : member.paymentStatus === 'Pending'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200'
                                  : 'bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200'
                              } ${!isAdmin ? 'cursor-default' : 'cursor-pointer hover:scale-105'}`}
                              title={isAdmin ? 'Click to toggle payment status' : 'Payment Status'}
                            >
                              {member.paymentStatus === 'Paid' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                              {member.paymentStatus === 'Pending' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                              {member.paymentStatus === 'Overdue' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                              <span>{member.paymentStatus}</span>
                            </button>
                          </td>
                          <td className="py-3 px-3 text-slate-500 max-w-[180px] truncate text-[11px]">
                            {member.notes || '-'}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectMember(member, list);
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                                title="View Member Dialogue"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditMember(member);
                                    }}
                                    className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 transition"
                                    title="Edit Member"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDeleteMember(e, member)}
                                    className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 transition"
                                    title="Delete Member"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Native Card View */}
              <div className="block md:hidden space-y-3">
                {listMembers.map((member) => {
                  const isCurrentUser = user && user.displayName?.toLowerCase().includes(member.name.toLowerCase());
                  const displayPhoto = member.avatarUrl || (isCurrentUser ? user?.photoURL : null);
                  const currentVal = member.monthlyContribution !== undefined ? member.monthlyContribution : list.monthlyAmount;

                  return (
                    <div
                      key={member.id}
                      onClick={() => onSelectMember(member, list)}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2 cursor-pointer hover:border-amber-400 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {displayPhoto ? (
                            <img
                              src={displayPhoto}
                              alt={member.name}
                              className="w-8 h-8 rounded-full border border-amber-400 object-cover shrink-0"
                            />
                          ) : (
                            <span className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-400/50">
                              #{member.orderNumber || '?'}
                            </span>
                          )}
                          <div>
                            <div className="flex items-center space-x-1">
                              <h5 className="font-bold text-slate-900 text-sm">{member.name}</h5>
                              {isCurrentUser && (
                                <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            {member.phone && (
                              <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                                <Phone className="w-3 h-3" />
                                <span>{member.phone}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <button
                          disabled={!isAdmin || loadingMemberId === member.id}
                          onClick={(e) => handleToggleStatus(e, member)}
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold transition ${
                            member.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : member.paymentStatus === 'Pending'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {member.paymentStatus === 'Paid' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {member.paymentStatus === 'Pending' && <Clock className="w-3 h-3 text-amber-600" />}
                          {member.paymentStatus === 'Overdue' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                          <span>{member.paymentStatus}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 text-slate-600">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Current Payment</span>
                          <span className="font-bold text-slate-800">
                            {currencySymbol} {currentVal.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Payout Month</span>
                          <span className="font-semibold text-slate-800">{member.payoutMonth || 'TBD'}</span>
                        </div>
                      </div>

                      {member.notes && (
                        <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                          "{member.notes}"
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-amber-700 font-semibold">
                        <span className="flex items-center space-x-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Tap card to view dialogue details</span>
                        </span>

                        {isAdmin && (
                          <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditMember(member);
                              }}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => handleDeleteMember(e, member)}
                              className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

        </div>
      )}

    </div>
  );
};
