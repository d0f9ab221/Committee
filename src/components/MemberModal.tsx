import React, { useState, useEffect, useRef } from 'react';
import { CommitteeMember, CommitteeList, PaymentStatus } from '../types/committee';
import { addMember, updateMember } from '../services/committeeService';
import { compressImageFile, AVATAR_PRESETS } from '../utils/imageUtils';
import { X, Save, UserPlus, Camera, Upload } from 'lucide-react';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberToEdit: CommitteeMember | null;
  defaultListId: string | null;
  lists: CommitteeList[];
  currencySymbol: string;
}

export const MemberModal: React.FC<MemberModalProps> = ({
  isOpen,
  onClose,
  memberToEdit,
  defaultListId,
  lists,
  currencySymbol,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [listId, setListId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [monthlyContributionInput, setMonthlyContributionInput] = useState<string>('500');
  const [payoutMonth, setPayoutMonth] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Pending');
  const [notes, setNotes] = useState('');
  const [orderNumberInput, setOrderNumberInput] = useState<string>('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (memberToEdit) {
      setListId(memberToEdit.listId || '');
      setName(memberToEdit.name || '');
      setPhone(memberToEdit.phone || '');
      setAvatarUrl(memberToEdit.avatarUrl || '');
      setMonthlyContributionInput(String(memberToEdit.monthlyContribution !== undefined ? memberToEdit.monthlyContribution : 500));
      setPayoutMonth(memberToEdit.payoutMonth || '');
      setPaymentStatus(memberToEdit.paymentStatus || 'Pending');
      setNotes(memberToEdit.notes || '');
      setOrderNumberInput(String(memberToEdit.orderNumber ?? 1));
    } else {
      const selectedList = lists.find((l) => l.id === defaultListId) || lists[0];
      setListId(defaultListId || selectedList?.id || '');
      setName('');
      setPhone('');
      setAvatarUrl('');
      setMonthlyContributionInput(String(selectedList?.monthlyAmount !== undefined ? selectedList.monthlyAmount : 500));
      setPayoutMonth('');
      setPaymentStatus('Pending');
      setNotes('');
      setOrderNumberInput('1');
    }
  }, [memberToEdit, defaultListId, isOpen, lists]);

  if (!isOpen) return null;

  const handleOpenGallery = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 200, 0.8);
      setAvatarUrl(compressedDataUrl);
    } catch (err) {
      console.error('Failed to compress image:', err);
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listId) {
      alert('Please select a committee list.');
      return;
    }
    setIsSubmitting(true);
    try {
      const parsedContribution = Number(monthlyContributionInput);
      const safeContribution = isNaN(parsedContribution) ? 0 : parsedContribution;
      const parsedOrder = Number(orderNumberInput) || 1;

      if (memberToEdit) {
        await updateMember(memberToEdit.id, {
          listId,
          name: name.trim(),
          phone: phone.trim(),
          avatarUrl,
          monthlyContribution: safeContribution,
          payoutMonth: payoutMonth.trim(),
          paymentStatus,
          notes: notes.trim(),
          orderNumber: parsedOrder,
        });
      } else {
        await addMember({
          listId,
          name: name.trim(),
          phone: phone.trim(),
          avatarUrl,
          monthlyContribution: safeContribution,
          payoutMonth: payoutMonth.trim(),
          paymentStatus,
          notes: notes.trim(),
          orderNumber: parsedOrder,
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
      {/* Hidden Gallery Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in duration-200">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {memberToEdit ? 'Edit Member Details' : 'Add Committee Member'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Committee Pool *</label>
            <select
              value={listId}
              onChange={(e) => {
                setListId(e.target.value);
                const selected = lists.find((l) => l.id === e.target.value);
                if (selected && !memberToEdit) {
                  setMonthlyContributionInput(String(selected.monthlyAmount));
                }
              }}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
            >
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title} ({currencySymbol} {l.monthlyAmount.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Member Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Usman Mughal"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Member Photo Gallery Selection */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700 mb-1">Member Photo / Avatar</label>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleOpenGallery}
                disabled={isUploadingPhoto}
                className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold rounded-xl text-xs transition"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span>{isUploadingPhoto ? 'Uploading...' : 'Open Phone Gallery'}</span>
              </button>

              {avatarUrl ? (
                <img src={avatarUrl} alt="Selected" className="w-9 h-9 rounded-full border border-amber-400 object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 border border-slate-200">
                  <Camera className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Presets Row */}
            <div className="pt-1 flex items-center space-x-1.5 overflow-x-auto">
              <span className="text-[10px] text-slate-400 shrink-0">Presets:</span>
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(preset)}
                  className={`shrink-0 rounded-full border-2 transition ${avatarUrl === preset ? 'border-amber-500 scale-105' : 'border-transparent'}`}
                >
                  <img src={preset} alt={`Preset ${idx + 1}`} className="w-6 h-6 rounded-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Slot Order #</label>
              <input
                type="number"
                min={1}
                value={orderNumberInput}
                onChange={(e) => setOrderNumberInput(e.target.value)}
                placeholder="1"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Current Payment ({currencySymbol}) *</label>
              <input
                type="number"
                min={0}
                required
                value={monthlyContributionInput}
                onChange={(e) => setMonthlyContributionInput(e.target.value)}
                placeholder="500"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Payout Month</label>
              <input
                type="text"
                placeholder="e.g., March 2026"
                value={payoutMonth}
                onChange={(e) => setPayoutMonth(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Current Month Payment Status</label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="Paid">Paid (Green)</option>
              <option value="Pending">Pending (Amber)</option>
              <option value="Overdue">Overdue (Red)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid via Online Bank Transfer on 2nd"
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
            />
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
              <span>{isSubmitting ? 'Saving...' : memberToEdit ? 'Update Member' : 'Add Member'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
