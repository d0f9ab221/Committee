import React, { useState, useEffect } from 'react';
import { CommitteeList, ListStatus } from '../types/committee';
import { addCommitteeList, updateCommitteeList } from '../services/committeeService';
import { X, Save, Coins } from 'lucide-react';

interface ListModalProps {
  isOpen: boolean;
  onClose: () => void;
  listToEdit: CommitteeList | null;
  currencySymbol: string;
}

export const ListModal: React.FC<ListModalProps> = ({
  isOpen,
  onClose,
  listToEdit,
  currencySymbol,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [monthlyAmountInput, setMonthlyAmountInput] = useState('500');
  const [totalMembersInput, setTotalMembersInput] = useState('10');
  const [cycleMonthsInput, setCycleMonthsInput] = useState('12');
  const [startDate, setStartDate] = useState('');
  const [status, setStatus] = useState<ListStatus>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (listToEdit) {
      setTitle(listToEdit.title || '');
      setDescription(listToEdit.description || '');
      setMonthlyAmountInput(String(listToEdit.monthlyAmount ?? 500));
      setTotalMembersInput(String(listToEdit.totalMembers ?? 10));
      setCycleMonthsInput(String(listToEdit.cycleMonths ?? 12));
      setStartDate(listToEdit.startDate || '');
      setStatus(listToEdit.status || 'active');
    } else {
      setTitle('');
      setDescription('');
      setMonthlyAmountInput('500');
      setTotalMembersInput('10');
      setCycleMonthsInput('12');
      setStartDate('');
      setStatus('active');
    }
  }, [listToEdit, isOpen]);

  if (!isOpen) return null;

  const numMonthly = Number(monthlyAmountInput) || 0;
  const numMembers = Number(totalMembersInput) || 0;
  const calculatedTarget = numMonthly * numMembers;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const parsedMonthlyAmount = Number(monthlyAmountInput) || 0;
      const parsedTotalMembers = Number(totalMembersInput) || 1;
      const parsedCycleMonths = Number(cycleMonthsInput) || 12;

      if (listToEdit) {
        await updateCommitteeList(listToEdit.id, {
          title: title.trim(),
          description: description.trim(),
          monthlyAmount: parsedMonthlyAmount,
          totalMembers: parsedTotalMembers,
          cycleMonths: parsedCycleMonths,
          startDate,
          status,
        });
      } else {
        await addCommitteeList({
          title: title.trim(),
          description: description.trim(),
          monthlyAmount: parsedMonthlyAmount,
          totalMembers: parsedTotalMembers,
          cycleMonths: parsedCycleMonths,
          startDate,
          status,
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Coins className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {listToEdit ? 'Edit Committee Pool' : 'Create Committee Pool'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Pool Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Committee Pool 2026 - Gold Cycle"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description / Payout Rules</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Monthly payout on 5th of each month."
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Monthly Amount ({currencySymbol}) *</label>
              <input
                type="number"
                required
                min={0}
                value={monthlyAmountInput}
                onChange={(e) => setMonthlyAmountInput(e.target.value)}
                placeholder="500"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Member Slots</label>
              <input
                type="number"
                min={1}
                value={totalMembersInput}
                onChange={(e) => setTotalMembersInput(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Live Calculation Preview */}
          <div className="bg-amber-50/80 border border-amber-200/80 p-3 rounded-2xl text-amber-950 space-y-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-amber-800">Monthly Contribution per Member:</span>
              <span className="font-extrabold">{currencySymbol} {numMonthly.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-amber-800">Total Monthly Pool Target ({numMembers} slots):</span>
              <span className="font-black text-amber-900">{currencySymbol} {calculatedTarget.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Cycle Duration (Months)</label>
              <input
                type="number"
                min={1}
                value={cycleMonthsInput}
                onChange={(e) => setCycleMonthsInput(e.target.value)}
                placeholder="12"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Start Date / Month</label>
              <input
                type="text"
                placeholder="e.g., Jan 2026"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Pool Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ListStatus)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
            </select>
          </div>

          <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : listToEdit ? 'Update Pool' : 'Create Pool'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
