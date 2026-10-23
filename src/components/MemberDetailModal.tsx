import React, { useState, useRef } from 'react';
import { CommitteeMember, CommitteeList } from '../types/committee';
import { useAuth } from '../context/AuthContext';
import { toggleMemberPaymentStatus, updateMember } from '../services/committeeService';
import { compressImageFile, AVATAR_PRESETS } from '../utils/imageUtils';
import { X, CheckCircle2, Clock, AlertTriangle, Phone, Copy, Check, Edit2, Camera, User, Calendar, DollarSign, Save, Image, Upload } from 'lucide-react';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: CommitteeMember | null;
  list: CommitteeList | null;
  currencySymbol: string;
  onEditMember: (member: CommitteeMember) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  isOpen,
  onClose,
  member,
  list,
  currencySymbol,
  onEditMember,
}) => {
  const { user, isAdmin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [copied, setCopied] = useState(false);
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);

  if (!isOpen || !member) return null;

  const currentContribution = member.monthlyContribution !== undefined ? member.monthlyContribution : (list?.monthlyAmount || 0);
  const displayPhoto = member.avatarUrl || (user && user.displayName?.toLowerCase().includes(member.name.toLowerCase()) ? user.photoURL : null);

  const handleToggleStatus = async () => {
    if (!isAdmin) return;
    setLoadingStatus(true);
    try {
      await toggleMemberPaymentStatus(member.id, member.paymentStatus);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStatus(false);
    }
  };

  // Open native gallery file picker
  const handleOpenGallery = () => {
    if (!isAdmin) return;
    fileInputRef.current?.click();
  };

  // Handle direct gallery photo selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;

    setIsUploadingPhoto(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 200, 0.8);
      await updateMember(member.id, { avatarUrl: compressedDataUrl });
      setIsEditingPhoto(false);
    } catch (err) {
      console.error('Failed to compress/save gallery image:', err);
      alert('Failed to process image file. Please try another image.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Apply preset avatar
  const handleSelectPreset = async (presetUrl: string) => {
    if (!isAdmin) return;
    setIsUploadingPhoto(true);
    try {
      await updateMember(member.id, { avatarUrl: presetUrl });
      setIsEditingPhoto(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Remove photo
  const handleRemovePhoto = async () => {
    if (!isAdmin) return;
    setIsUploadingPhoto(true);
    try {
      await updateMember(member.id, { avatarUrl: '' });
      setIsEditingPhoto(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleCopyReceipt = () => {
    const text = `📋 *Committee Payment Record*\n👤 Member: ${member.name}\n🔢 Slot: #${member.orderNumber || '1'}\n💰 Current Payment: ${currencySymbol} ${currentContribution.toLocaleString()}\n📅 Payout Month: ${member.payoutMonth || 'TBD'}\n📌 Status: ${member.paymentStatus}\n📝 Notes: ${member.notes || 'None'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Hidden Gallery Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in duration-200 relative overflow-hidden">
        
        {/* COMPLETED Stamp Overlay */}
        {(member.paymentStatus === 'Paid' || list?.status === 'completed') && (
          <div className="absolute top-3 right-10 z-20 pointer-events-none transform -rotate-12 opacity-90 transition-all">
            <img
              src="/assets/aistudio/b052b881599bc61cd6727a2cdc19f62d_7caa05aa.jpg"
              alt="Completed Stamp"
              className="w-24 sm:w-28 h-auto drop-shadow-md mix-blend-multiply"
            />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="w-7 h-7 rounded-full bg-slate-900 text-amber-400 font-bold text-xs flex items-center justify-center">
              #{member.orderNumber || '1'}
            </span>
            <h3 className="text-base font-bold text-slate-900">Member Payment Details</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Avatar / Photo Card */}
        <div className="flex flex-col items-center space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center relative">
          <div className="relative group">
            {displayPhoto ? (
              <img
                src={displayPhoto}
                alt={member.name}
                className="w-20 h-20 rounded-full border-2 border-amber-400 object-cover shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-2xl border-2 border-amber-400 shadow-md">
                {member.name[0]?.toUpperCase() || 'M'}
              </div>
            )}

            {isAdmin && (
              <button
                onClick={() => setIsEditingPhoto(!isEditingPhoto)}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition"
                title="Change Photo from Gallery"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900">{member.name}</h4>
            {list && <p className="text-xs text-amber-700 font-semibold">{list.title}</p>}
          </div>

          {/* Admin Photo Changer Options (Gallery / Camera / Presets) */}
          {isEditingPhoto && isAdmin && (
            <div className="w-full pt-3 border-t border-slate-200 text-left space-y-3 text-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-[11px]">Choose Member Photo:</span>
                {member.avatarUrl && (
                  <button
                    onClick={handleRemovePhoto}
                    disabled={isUploadingPhoto}
                    className="text-[10px] text-rose-600 font-bold hover:underline"
                  >
                    Remove Custom Photo
                  </button>
                )}
              </div>

              {/* Direct Gallery Pick Button */}
              <button
                onClick={handleOpenGallery}
                disabled={isUploadingPhoto}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold rounded-xl text-xs shadow-xs transition"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span>{isUploadingPhoto ? 'Uploading Image...' : 'Open Phone Gallery / Camera'}</span>
              </button>

              {/* Gallery Presets Row */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-medium">Or select a preset avatar:</span>
                <div className="flex items-center justify-center space-x-2 overflow-x-auto py-1">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectPreset(preset)}
                      disabled={isUploadingPhoto}
                      className="shrink-0 rounded-full border-2 border-transparent hover:border-amber-400 transition"
                    >
                      <img src={preset} alt={`Preset ${idx + 1}`} className="w-9 h-9 rounded-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase text-slate-400 font-semibold block">Current Payment</span>
            <span className="text-base font-extrabold text-slate-900">
              {currencySymbol} {currentContribution.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase text-slate-400 font-semibold block">Payout Month</span>
            <span className="text-xs font-bold text-slate-900">{member.payoutMonth || 'TBD'}</span>
          </div>
        </div>

        {/* Status & Contact */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-700">Payment Status:</span>
            <button
              disabled={!isAdmin || loadingStatus}
              onClick={handleToggleStatus}
              className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold transition ${
                member.paymentStatus === 'Paid'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                  : member.paymentStatus === 'Pending'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200'
                  : 'bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200'
              } ${isAdmin ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
              title={isAdmin ? 'Click to toggle status' : ''}
            >
              {member.paymentStatus === 'Paid' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              {member.paymentStatus === 'Pending' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
              {member.paymentStatus === 'Overdue' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
              <span>{member.paymentStatus}</span>
            </button>
          </div>

          {member.phone && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-700">Phone Contact:</span>
              <a
                href={`tel:${member.phone}`}
                className="text-xs font-bold text-amber-700 hover:underline flex items-center space-x-1"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{member.phone}</span>
              </a>
            </div>
          )}

          {member.notes && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-700 text-[11px] block">Notes:</span>
              <p className="text-slate-600 italic text-xs">{member.notes}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-between space-x-2 border-t border-slate-100">
          <button
            onClick={handleCopyReceipt}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Receipt!' : 'Copy Receipt'}</span>
          </button>

          {isAdmin && (
            <div className="flex items-center space-x-2">
              <button
                disabled={loadingStatus}
                onClick={handleToggleStatus}
                className={`flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-bold transition ${
                  member.paymentStatus === 'Paid'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                }`}
                title="Toggle Completed Stamp"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{member.paymentStatus === 'Paid' ? 'Stamped' : 'Stamp Completed'}</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onEditMember(member);
                }}
                className="flex items-center space-x-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-xs transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
