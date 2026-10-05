import React from "react";
import { DataLayerCollection } from "../../types/detection";
import { Check, X, ShoppingBag, Database } from "lucide-react";

interface DataLayerInspectorViewProps {
  dataLayer: DataLayerCollection;
}

export const DataLayerInspectorView: React.FC<DataLayerInspectorViewProps> = ({ dataLayer }) => {
  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">window.dataLayer State</h3>
            <p className="text-xs text-slate-500">Centralized client-side event bus inspection</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 font-semibold block uppercase">Status</span>
            <span className="text-sm font-bold text-slate-800 flex items-center gap-1 mt-1">
              {dataLayer.exists ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" /> Initialized
                </>
              ) : (
                <>
                  <X className="w-4 h-4 text-rose-500" /> Missing
                </>
              )}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 font-semibold block uppercase">Total Pushes</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">
              {dataLayer.pushesCount} pushes
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 font-semibold block uppercase">Ecommerce Schema</span>
            <span className="text-sm font-bold text-slate-800 flex items-center gap-1 mt-1">
              {dataLayer.hasEcommerce ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" /> Detected
                </>
              ) : (
                <>
                  <X className="w-4 h-4 text-slate-400" /> Not Detected
                </>
              )}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 font-semibold block uppercase">Purchase Payload</span>
            <span className="text-sm font-bold text-slate-800 flex items-center gap-1 mt-1">
              {dataLayer.purchaseData?.hasPurchase ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" /> Observed
                </>
              ) : (
                <span className="text-slate-400 font-normal">None</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Purchase Audit Section if applicable */}
      {dataLayer.purchaseData?.hasPurchase && (
        <div className="bg-white rounded-xl border border-blue-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-blue-900 font-bold text-sm">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            Ecommerce Purchase Payload Audit
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-blue-50/50 rounded border border-blue-100">
              <span className="text-slate-500 block">transaction_id:</span>
              <span className="font-mono font-bold text-blue-800">
                {dataLayer.purchaseData.transaction_id || "⚠ MISSING"}
              </span>
            </div>
            <div className="p-3 bg-blue-50/50 rounded border border-blue-100">
              <span className="text-slate-500 block">value:</span>
              <span className="font-mono font-bold text-blue-800">
                {dataLayer.purchaseData.value !== undefined ? dataLayer.purchaseData.value : "⚠ MISSING"}
              </span>
            </div>
            <div className="p-3 bg-blue-50/50 rounded border border-blue-100">
              <span className="text-slate-500 block">currency:</span>
              <span className="font-mono font-bold text-blue-800">
                {dataLayer.purchaseData.currency || "⚠ MISSING"}
              </span>
            </div>
            <div className="p-3 bg-blue-50/50 rounded border border-blue-100">
              <span className="text-slate-500 block">items count:</span>
              <span className="font-mono font-bold text-blue-800">
                {dataLayer.purchaseData.itemsCount ?? 0}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Raw Event Pushes List */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h4 className="font-bold text-slate-800 text-sm mb-3">
          Observed DataLayer Event Pushes ({dataLayer.events.length})
        </h4>

        {dataLayer.events.length === 0 ? (
          <p className="text-xs text-slate-400">No events found in dataLayer pushes.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {dataLayer.events.map((ev, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-mono text-xs border border-slate-200"
              >
                {ev}
              </span>
            ))}
          </div>
        )}

        {/* Sanitized JSON Snippet */}
        {dataLayer.rawItems.length > 0 && (
          <div className="mt-5">
            <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Sanitized Push Payload Sample (PII Redacted)
            </h5>
            <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg text-xs font-mono overflow-x-auto max-h-64">
              {JSON.stringify(dataLayer.rawItems.slice(0, 5), null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
