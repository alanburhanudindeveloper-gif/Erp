import React, { useState } from 'react';
import { X, Sparkles, FileText, Upload, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, DollarSign } from 'lucide-react';
import { aiGateway, ExtractedDocumentResult } from '../../lib/ai/aiGateway';

interface AiDocumentExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostDraftPo: (poData: any) => void;
}

const SAMPLE_DOCS = [
  {
    name: 'PT Steel Indo Perkasa - Quotation #Q-9921',
    text: `PURCHASE QUOTATION / PENAWARAN HARGA
PT Steel Indo Perkasa
Kawasan Industri Cikarang Blok B-12, Bekasi
Doc No: PO-EXT-2026-9921
Date: 2026-10-21
Delivery Due: 2026-11-04
Payment Terms: NET 30 Days

Kepada: PT Kranex Industrial Manufacturing
Perihal: Penawaran Material Produksi Oktober 2026

Items:
1. RAW-STL-01 - Cold Rolled Steel Sheet 2.0mm
   Qty: 2,500 KG @ IDR 18,500 / KG = IDR 46,250,000
2. RAW-ALU-02 - Extruded Aluminum Bar 6061-T6
   Qty: 800 KG @ IDR 34,000 / KG = IDR 27,200,000

Total Penawaran: IDR 73,450,000 (Excl. VAT 11%)
Packaging: Palletized with rust inhibitor film.`,
  },
  {
    name: 'PT Global Komponen - Delivery Note #DN-4402',
    text: `SURAT JALAN & DELIVERY NOTE
PT Global Komponen Presisi
Doc No: DN-2026-4402
Date: 2026-10-22
Expected Arrival: 2026-10-23
Vehicle: B 9182 KXX

Delivered to: Kranex Plant 01 - Warehouse Inbound Gate 2
PO Reference: PO-KRX-2026-0881

Items:
1. COMP-NUT-M8 - Stainless Steel Flange Nut M8
   Qty: 5,000 PCS @ IDR 450 / PCS = IDR 2,250,000
2. COMP-BOLT-M8 - Hex Bolt Grade 8.8 M8x35mm
   Qty: 5,000 PCS @ IDR 850 / PCS = IDR 4,250,000

Total: IDR 6,500,000
Lot Number: LOT-NUT-202610A`,
  },
];

export const AiDocumentExtractorModal: React.FC<AiDocumentExtractorModalProps> = ({
  isOpen,
  onClose,
  onPostDraftPo,
}) => {
  const [docText, setDocText] = useState(SAMPLE_DOCS[0].text);
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedDocumentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);

  if (!isOpen) return null;

  const handleRunExtract = () => {
    setLoading(true);
    setError(null);
    setExtracted(null);
    setIsApproved(false);

    aiGateway
      .extractDocument(docText)
      .then((res) => {
        setExtracted(res.result);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to extract document');
        setLoading(false);
      });
  };

  const handleApproveDraft = () => {
    if (extracted) {
      onPostDraftPo(extracted);
      setIsApproved(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  Document → ERP (Section 9.1 P0)
                </span>
                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono border border-blue-200">
                  Schema Validation + Discrepancy Check
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                AI Document Extraction to Structured Transaction Draft
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
          {/* Sample selector */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-slate-500 font-medium">Quick load test document:</span>
            <div className="flex gap-2">
              {SAMPLE_DOCS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDocText(sample.text);
                    setExtracted(null);
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition-colors"
                >
                  {sample.name.split('-')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Document raw text editor */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Raw Supplier Document / OCR Text Input
            </label>
            <textarea
              rows={5}
              value={docText}
              onChange={(e) => setDocText(e.target.value)}
              className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed text-slate-800"
              placeholder="Paste PO, delivery note, invoice, or supplier quotation text..."
            />
          </div>

          <div className="flex justify-end">
            <button
              disabled={loading || !docText.trim()}
              onClick={handleRunExtract}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Extracting with Gemini...' : 'Extract with AI & Validate Schema'}</span>
            </button>
          </div>

          {/* Extraction Result */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Extraction Failed</p>
                <p className="text-[11px] mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {extracted && (
            <div className="space-y-4 pt-2 border-t border-slate-200">
              {/* Extraction Header pill */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-emerald-900">{extracted.extractedSummary}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-emerald-700 font-medium">Confidence:</span>
                  <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-800">
                    {extracted.confidenceScore}%
                  </span>
                </div>
              </div>

              {/* Vendor & Header info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-medium">Vendor</span>
                  <span className="font-bold text-slate-900">{extracted.vendorName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-medium">Doc Number</span>
                  <span className="font-mono font-bold text-slate-800">{extracted.documentNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-medium">Issue Date</span>
                  <span className="text-slate-700">{extracted.issueDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-medium">Delivery Due</span>
                  <span className="text-slate-700 font-medium">{extracted.deliveryDueDate}</span>
                </div>
              </div>

              {/* Line items table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 font-bold text-slate-700 text-[11px] uppercase tracking-wider border-b border-slate-200">
                  Extracted Structured Line Items
                </div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 text-[11px]">
                      <th className="py-2 px-3">Item / SKU</th>
                      <th className="py-2 px-3 text-right">Quantity</th>
                      <th className="py-2 px-3 text-right">Unit Price</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {extracted.lineItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-sans">
                          <span className="font-bold font-mono text-slate-900">{item.itemSku}</span>
                          <span className="block text-[11px] text-slate-500">{item.description}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-slate-800">
                          {item.quantity.toLocaleString()} {item.uom}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-slate-800">
                          {extracted.currency} {item.unitPrice.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-bold text-slate-900">
                          {extracted.currency} {item.subtotal.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t border-slate-200 font-bold">
                      <td colSpan={3} className="py-2.5 px-3 text-right font-sans text-slate-700">Total Valuation:</td>
                      <td className="py-2.5 px-3 text-right font-mono text-sm text-blue-700">
                        {extracted.currency} {extracted.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Discrepancy detection (Section 9.1 rule) */}
              {extracted.discrepanciesDetected && extracted.discrepanciesDetected.length > 0 && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 text-xs">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Discrepancy Guardrail Alert:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                    {extracted.discrepanciesDetected.map((disc, idx) => (
                      <li key={idx}>{disc}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">Architectural Invariant:</span> AI creates draft PO only. Transaksi resmi baru diposting setelah approval user.
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              disabled={!extracted || isApproved}
              onClick={handleApproveDraft}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
            >
              {isApproved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Draft PO Approved & Posted!</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Review & Approve Draft PO</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
