/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { MainPage } from './components/MainPage';
import { AdminPanel } from './components/AdminPanel';
import { ListModal } from './components/ListModal';
import { MemberModal } from './components/MemberModal';
import { MemberDetailModal } from './components/MemberDetailModal';
import { ApkGuideModal } from './components/ApkGuideModal';
import { DomainAuthModal } from './components/DomainAuthModal';
import { PageConfig, CommitteeList, CommitteeMember } from './types/committee';
import {
  subscribePageConfig,
  subscribeCommitteeLists,
  subscribeMembers,
  seedSampleData
} from './services/committeeService';
import { testFirestoreConnection } from './firebase/config';
import { Loader2, AlertTriangle, RefreshCw, X, ShieldAlert } from 'lucide-react';

function CommitteeAppContent() {
  const { user, loading: authLoading, authError, clearAuthError } = useAuth();
  const [currentTab, setCurrentTab] = useState<'main' | 'admin'>('main');

  // Firestore Data States
  const [pageConfig, setPageConfig] = useState<PageConfig>({
    title: 'Mughal Family Committee',
    description: 'Private committee savings pool, payout schedule, and member contribution tracker.',
    currencySymbol: 'PKR'
  });
  const [lists, setLists] = useState<CommitteeList[]>([]);
  const [members, setMembers] = useState<CommitteeMember[]>([]);

  // UI Modals
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [listToEdit, setListToEdit] = useState<CommitteeList | null>(null);

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<CommitteeMember | null>(null);
  const [defaultListId, setDefaultListId] = useState<string | null>(null);

  const [isApkGuideOpen, setIsApkGuideOpen] = useState(false);

  const [dataLoading, setDataLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Validate connection & subscribe to Firestore only when user is authenticated
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setDataLoading(false);
      setFirestoreError(null);
      setLists([]);
      setMembers([]);
      return;
    }

    testFirestoreConnection();
    setDataLoading(true);

    const unsubConfig = subscribePageConfig(
      (config) => setPageConfig(config),
      (err) => setFirestoreError(err.message)
    );

    const unsubLists = subscribeCommitteeLists(
      (listData) => {
        setLists(listData);
        setDataLoading(false);
      },
      (err) => {
        setFirestoreError(err.message);
        setDataLoading(false);
      }
    );

    const unsubMembers = subscribeMembers(
      (memberData) => setMembers(memberData),
      (err) => setFirestoreError(err.message)
    );

    return () => {
      unsubConfig();
      unsubLists();
      unsubMembers();
    };
  }, [user, authLoading]);

  // Handlers
  const handleOpenAddList = () => {
    setListToEdit(null);
    setIsListModalOpen(true);
  };

  const handleOpenEditList = (list: CommitteeList) => {
    setListToEdit(list);
    setIsListModalOpen(true);
  };

  const handleOpenAddMember = (listId: string) => {
    setMemberToEdit(null);
    setDefaultListId(listId);
    setIsMemberModalOpen(true);
  };

  const handleOpenEditMember = (member: CommitteeMember) => {
    setMemberToEdit(member);
    setDefaultListId(member.listId);
    setIsMemberModalOpen(true);
  };

  const handleSeedSampleData = async () => {
    try {
      await seedSampleData();
    } catch (err) {
      console.error('Failed to seed sample data:', err);
    }
  };

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const selectedMemberForDetail = members.find((m) => m.id === selectedMemberId) || null;
  const selectedListForDetail = lists.find((l) => l.id === selectedMemberForDetail?.listId) || null;

  const handleSelectMember = (member: CommitteeMember) => {
    setSelectedMemberId(member.id);
  };

  const isUnauthorizedDomain = authError?.startsWith('UNAUTHORIZED_DOMAIN:');
  const unauthorizedDomainName = isUnauthorizedDomain && authError ? authError.split(':')[1] : '';

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 space-y-3">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-xs font-semibold text-slate-300">Connecting to Committee Manager Database...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenApkGuide={() => setIsApkGuideOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        
        {/* Auth Error Notice Banner */}
        {authError && !isUnauthorizedDomain && (
          <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl p-4 mb-6 flex items-start justify-between space-x-3 text-xs shadow-xs">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold">Authentication Notice</h4>
                <p className="text-rose-800">{authError}</p>
              </div>
            </div>
            <button onClick={clearAuthError} className="p-1 rounded text-rose-400 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Firestore Connection Warning (if any) */}
        {firestoreError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl p-4 mb-6 flex items-start space-x-3 text-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <div className="flex-1 space-y-1">
              <h4 className="font-bold">Firestore Database Notice</h4>
              <p className="text-rose-800">{firestoreError}</p>
              <p className="text-[11px] text-rose-700">
                Ensure project <code>committee-4b237</code> API keys or Firestore Rules are properly deployed.
              </p>
            </div>
          </div>
        )}

        {currentTab === 'main' ? (
          <MainPage
            pageConfig={pageConfig}
            lists={lists}
            members={members}
            onAddList={handleOpenAddList}
            onEditList={handleOpenEditList}
            onAddMember={handleOpenAddMember}
            onEditMember={handleOpenEditMember}
            onSelectMember={handleSelectMember}
            onSeedData={handleSeedSampleData}
          />
        ) : (
          <AdminPanel pageConfig={pageConfig} />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div>
            <span className="font-bold text-slate-200">Committee Manager</span> &bull; Private Savings Pool App
          </div>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>Project: <code>committee-4b237</code></span>
            <span>&bull;</span>
            <span>Admin: <code>kfmughal79@gmail.com</code></span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        listToEdit={listToEdit}
        currencySymbol={pageConfig.currencySymbol || 'PKR'}
      />

      <MemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        memberToEdit={memberToEdit}
        defaultListId={defaultListId}
        lists={lists}
        currencySymbol={pageConfig.currencySymbol || 'PKR'}
      />

      <MemberDetailModal
        isOpen={Boolean(selectedMemberForDetail)}
        onClose={() => setSelectedMemberId(null)}
        member={selectedMemberForDetail}
        list={selectedListForDetail}
        currencySymbol={pageConfig.currencySymbol || 'PKR'}
        onEditMember={handleOpenEditMember}
      />

      <ApkGuideModal
        isOpen={isApkGuideOpen}
        onClose={() => setIsApkGuideOpen(false)}
      />

      <DomainAuthModal
        isOpen={Boolean(isUnauthorizedDomain)}
        onClose={clearAuthError}
        domainName={unauthorizedDomainName}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CommitteeAppContent />
    </AuthProvider>
  );
}
