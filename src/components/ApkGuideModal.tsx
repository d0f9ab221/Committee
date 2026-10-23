import React from 'react';
import { X, Smartphone, CheckCircle2, ShieldCheck, Terminal, Download } from 'lucide-react';

interface ApkGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkGuideModal: React.FC<ApkGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[85vh] overflow-y-auto">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Android APK Packaging Guide</h3>
              <p className="text-[11px] text-slate-500">Mobile-First Android WebView / Capacitor / TWA Compatibility</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>APK-Ready Responsive Architecture</span>
            </div>
            <p className="text-[11px] text-emerald-800">
              This application is built with a lightweight native Android aesthetic (compact cards, 44px+ touch targets, zero external heavy UI bloat). It is ready to run inside an Android WebView, Capacitor container, or Trusted Web Activity (TWA).
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
              <Terminal className="w-4 h-4 text-amber-600" />
              <span>Option A: Capacitor Android Build (Recommended)</span>
            </h4>
            <div className="bg-slate-900 text-amber-300 font-mono p-3 rounded-xl text-[11px] space-y-1">
              <p># 1. Install Capacitor CLI in workspace</p>
              <p className="text-slate-300">npm install @capacitor/core @capacitor/cli @capacitor/android</p>
              <p className="pt-1"># 2. Initialize Capacitor project</p>
              <p className="text-slate-300">npx cap init "Committee Manager" "com.mughal.committeemanager"</p>
              <p className="pt-1"># 3. Build Web Bundle and add Android platform</p>
              <p className="text-slate-300">npm run build && npx cap add android</p>
              <p className="pt-1"># 4. Open in Android Studio to build APK</p>
              <p className="text-slate-300">npx cap open android</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span>Option B: Native Android WebView wrapper</span>
            </h4>
            <p className="text-slate-600">
              In Android Studio, create a standard WebView activity pointing to your hosted web app URL with:
            </p>
            <div className="bg-slate-100 text-slate-800 font-mono p-2.5 rounded-xl text-[10px]">
              webView.getSettings().setJavaScriptEnabled(true);<br />
              webView.getSettings().setDomStorageEnabled(true);<br />
              webView.loadUrl("YOUR_HOSTED_APP_URL");
            </div>
          </div>

          <div className="space-y-1 border-t border-slate-100 pt-3">
            <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Firebase Auth & Domain Whitelisting for APK</span>
            </h4>
            <p className="text-slate-600 text-[11px]">
              When hosting or packaging into an APK, ensure your domain or custom scheme is added under <strong>Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains</strong>.
            </p>
          </div>

        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
};
