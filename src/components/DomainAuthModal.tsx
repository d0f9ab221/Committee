import React, { useState } from 'react';
import { X, Globe, Copy, Check, ExternalLink, ShieldAlert } from 'lucide-react';

interface DomainAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  domainName: string;
}

export const DomainAuthModal: React.FC<DomainAuthModalProps> = ({ isOpen, onClose, domainName }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(domainName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const firebaseConsoleUrl = `https://console.firebase.google.com/project/committee-4b237/authentication/settings`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 space-y-4 animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-rose-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Domain Not Authorized in Firebase</h3>
              <p className="text-[11px] text-slate-500">Firebase Auth security restriction</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
          <p className="bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-2xl text-[11px]">
            Firebase Authentication requires your current domain to be explicitly listed under <strong>Authorized domains</strong> before Google Sign-In popups are permitted.
          </p>

          <div className="space-y-1">
            <label className="block font-bold text-slate-800 text-[11px]">Your Current Domain Hostname:</label>
            <div className="flex items-center space-x-2 bg-slate-100 p-2.5 rounded-xl border border-slate-200 font-mono text-slate-900 font-semibold text-xs">
              <Globe className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="flex-1 truncate">{domainName}</span>
              <button
                onClick={handleCopyDomain}
                className="flex items-center space-x-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] transition shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-[11px]">
            <h4 className="font-bold text-slate-900 flex items-center space-x-1">
              <span>Quick 3-Step Setup in Firebase Console:</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
              <li>
                Click the button below to open <strong>Firebase Auth Settings</strong>.
              </li>
              <li>
                Select the <strong>Authorized domains</strong> tab and click <strong>Add domain</strong>.
              </li>
              <li>
                Paste <code className="bg-white px-1.5 py-0.5 border rounded font-mono font-bold text-slate-800">{domainName}</code> and click <strong>Save</strong>.
              </li>
            </ol>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100">
          <a
            href={firebaseConsoleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-xs transition"
          >
            <span>Open Firebase Auth Console</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
          >
            I've Added It (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
