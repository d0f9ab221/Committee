import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PageConfig, VisitorSummary, VisitorEvent } from '../types/committee';
import { updatePageConfig } from '../services/committeeService';
import { subscribeVisitorStats, subscribeVisitorEvents } from '../services/visitorService';
import { ShieldCheck, Users, Eye, Settings, Search, RefreshCw, Lock, Activity, Smartphone, Calendar, Save, AlertCircle } from 'lucide-react';

interface AdminPanelProps {
  pageConfig: PageConfig;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ pageConfig }) => {
  const { isAdmin, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'page' | 'visitors' | 'events'>('page');

  // Form states for Page Info
  const [title, setTitle] = useState(pageConfig.title || '');
  const [description, setDescription] = useState(pageConfig.description || '');
  const [currencySymbol, setCurrencySymbol] = useState(pageConfig.currencySymbol || 'PKR');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Real-time visitor data states
  const [visitorStats, setVisitorStats] = useState<VisitorSummary[]>([]);
  const [visitorEvents, setVisitorEvents] = useState<VisitorEvent[]>([]);
  const [visitorSearch, setVisitorSearch] = useState('');
  const [selectedVisitorUid, setSelectedVisitorUid] = useState<string | null>(null);

  useEffect(() => {
    setTitle(pageConfig.title || 'Mughal Family Committee');
    setDescription(pageConfig.description || 'Private committee savings pool & member payout cycle manager.');
    setCurrencySymbol(pageConfig.currencySymbol || 'PKR');
  }, [pageConfig]);

  const [rulesNotice, setRulesNotice] = useState(false);

  // Subscribe to visitor stats if admin
  useEffect(() => {
    if (!isAdmin) return;

    const unsubStats = subscribeVisitorStats(
      (stats) => {
        setVisitorStats(stats);
        setRulesNotice(false);
      },
      (err) => setRulesNotice(true)
    );
    const unsubEvents = subscribeVisitorEvents(
      (events) => {
        setVisitorEvents(events);
        setRulesNotice(false);
      },
      (err) => setRulesNotice(true)
    );

    return () => {
      unsubStats();
      unsubEvents();
    };
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center max-w-lg mx-auto my-12 space-y-4 shadow-sm">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Access Denied</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          The Admin Panel is strictly restricted to <code>kfmughal79@gmail.com</code> with verified email credentials.
        </p>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left text-[11px] text-slate-500 space-y-1">
          <p><strong>Logged in as:</strong> {user?.email || 'Not logged in'}</p>
          <p><strong>Email Verified:</strong> {user?.emailVerified ? 'Yes' : 'No'}</p>
        </div>
      </div>
    );
  }

  const handleSavePageConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updatePageConfig({ title, description, currencySymbol });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter visitor stats
  const filteredVisitors = visitorStats.filter(
    (v) =>
      (v.email && v.email.toLowerCase().includes(visitorSearch.toLowerCase())) ||
      v.uid.toLowerCase().includes(visitorSearch.toLowerCase())
  );

  const totalUniqueVisitors = visitorStats.length;
  const totalRecordedVisits = visitorStats.reduce((sum, v) => sum + v.totalVisits, 0);

  const selectedVisitorEvents = visitorEvents.filter((e) => e.uid === selectedVisitorUid);

  return (
    <div className="space-y-6">
      
      {/* Admin Panel Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Private Admin Control Center</h2>
            <p className="text-xs text-slate-400">Authenticated as: {user?.email}</p>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center space-x-1.5 bg-slate-800 p-1.5 rounded-2xl border border-slate-700 text-xs">
          <button
            onClick={() => setActiveTab('page')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'page' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Header Settings</span>
          </button>
          <button
            onClick={() => setActiveTab('visitors')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'visitors' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Visitor Stats ({totalUniqueVisitors})</span>
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'events' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Recent Activity ({visitorEvents.length})</span>
          </button>
        </div>
      </div>

      {rulesNotice && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
          <div className="flex items-start space-x-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Firestore Rules Notice for Visitor Analytics</p>
              <p className="text-[11px] text-amber-800">
                To view live visitor stats, copy the updated <code>firestore.rules</code> file and publish it in your Firebase Console.
              </p>
            </div>
          </div>
          <a
            href="https://console.firebase.google.com/project/committee-4b237/firestore/rules"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-[11px] transition shrink-0 text-center"
          >
            Open Rules Tab
          </a>
        </div>
      )}

      {/* Tab 1: Page Header Configuration */}
      {activeTab === 'page' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Customizable Header Title & Description</h3>
            <p className="text-xs text-slate-500">
              Changes updated here immediately update the main page in real time for all users.
            </p>
          </div>

          <form onSubmit={handleSavePageConfig} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Page Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-amber-500"
                placeholder="e.g., Mughal Family Committee"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Page Subtitle / Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-amber-500"
                placeholder="Brief summary or notice for committee members..."
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-32 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-amber-500"
                placeholder="PKR, $, AED"
              />
            </div>

            <div className="pt-2 flex items-center space-x-3">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center space-x-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-xs transition"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Header Changes'}</span>
              </button>

              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  Header updated successfully in Firestore!
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Visitor Statistics Summary */}
      {activeTab === 'visitors' && (
        <div className="space-y-6">
          
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Unique Visitors</span>
                <span className="text-lg font-extrabold text-slate-900">{totalUniqueVisitors}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Total Visits Recorded</span>
                <span className="text-lg font-extrabold text-slate-900">{totalRecordedVisits}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Auth Protection</span>
                <span className="text-xs font-bold text-slate-800">Firestore Security Rules</span>
              </div>
            </div>
          </div>

          {/* Visitor Table & Search */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recorded Visitor Summaries</h3>
                <p className="text-xs text-slate-500">Real-time visitor analytics synced directly from Firestore.</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by email or UID..."
                  value={visitorSearch}
                  onChange={(e) => setVisitorSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {filteredVisitors.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                No visitor statistics recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] bg-slate-50">
                      <th className="py-2.5 px-3">Visitor Email</th>
                      <th className="py-2.5 px-3">Firebase UID</th>
                      <th className="py-2.5 px-3">Total Visits</th>
                      <th className="py-2.5 px-3">First Visit</th>
                      <th className="py-2.5 px-3">Last Visit</th>
                      <th className="py-2.5 px-3 text-right">Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredVisitors.map((v) => (
                      <tr key={v.uid} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-semibold text-slate-900">{v.email || 'Unverified'}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500 truncate max-w-[120px]">
                          {v.uid}
                        </td>
                        <td className="py-3 px-3 font-extrabold text-amber-600">{v.totalVisits}</td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">
                          {v.firstVisit ? new Date(v.firstVisit).toLocaleString() : '-'}
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">
                          {v.lastVisit ? new Date(v.lastVisit).toLocaleString() : '-'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedVisitorUid(v.uid);
                              setActiveTab('events');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] transition"
                          >
                            View Logs
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab 3: Detailed Event Activity Logs */}
      {activeTab === 'events' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Detailed Visit Activity Logs</h3>
              <p className="text-xs text-slate-500">Individual session event logs recorded with timestamps and session keys.</p>
            </div>

            {selectedVisitorUid && (
              <button
                onClick={() => setSelectedVisitorUid(null)}
                className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1 rounded-xl transition"
              >
                Clear UID Filter
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] bg-slate-50">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Session ID</th>
                  <th className="py-2.5 px-3">Device / Environment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(selectedVisitorUid ? selectedVisitorEvents : visitorEvents).map((event, idx) => (
                  <tr key={event.id || idx} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {event.timestamp ? new Date(event.timestamp).toLocaleString() : '-'}
                    </td>
                    <td className="py-3 px-3 text-slate-700">{event.email || 'Unverified'}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{event.sessionId}</td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">{event.deviceInfo || 'Browser'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
