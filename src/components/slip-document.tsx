"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Printer } from "lucide-react";

export interface SlipItemsTable {
  headers: string[];
  rows: (string | number)[][];
  totals?: { label: string; value: string }[];
  /** Index of the column that holds amounts (right-aligned). */
  amountColumnIndex?: number;
}

export interface SlipInfoRow {
  label: string;
  value: string;
}

export interface SlipDocumentProps {
  title: string; // e.g. "QUOTATION", "PAYMENT RECEIPT", "BILL OF QUANTITY"
  documentNo: string; // e.g. "QUO-2026-001"
  date?: string; // formatted date string
  status?: string; // status badge text
  // From section (company info)
  fromName?: string; // "Al Gurg Group"
  fromAddress?: string; // "Dubai, UAE"
  fromContact?: string; // "ops@algurggroup.ae"
  // To section (client/supplier info)
  toLabel?: string; // "Bill To" or "Supplier" or "Delivered To"
  toName?: string;
  toAddress?: string;
  toContact?: string;
  // Items table (optional)
  items?: SlipItemsTable;
  // Additional info rows
  infoRows?: SlipInfoRow[];
  // Notes section
  notes?: string;
  // Signature area
  signatures?: string[]; // e.g. ["Prepared by", "Approved by", "Client Signature"]
  children?: React.ReactNode; // additional custom content
}

/**
 * Reusable, printable business document/slip.
 * Wrap a SlipDocument inside a Dialog (or any visible container) and the user
 * can hit "Print" to produce a clean PDF via the browser print dialog.
 * Print behaviour is driven by the `.print-area` / `.no-print` CSS in globals.css.
 */
export function SlipDocument(props: SlipDocumentProps) {
  const {
    title,
    documentNo,
    date,
    status,
    fromName = "Al Gurg Group",
    fromAddress = "Al Quoz Industrial Area 3, Dubai, UAE",
    fromContact = "ops@algurggroup.ae  |  +971 4 000 0000",
    toLabel = "Bill To",
    toName,
    toAddress,
    toContact,
    items,
    infoRows,
    notes,
    signatures,
    children,
  } = props;

  return (
    <div className="print-area bg-white text-slate-900">
      {/* Toolbar - hidden when printing */}
      <div className="no-print flex items-center justify-between gap-2 mb-3 print:hidden">
        <p className="text-sm text-muted-foreground">
          Preview of <span className="font-mono font-medium">{documentNo}</span>
        </p>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="size-4" /> Print / Save PDF
        </Button>
      </div>

      {/* A4-styled document */}
      <div className="mx-auto max-w-[820px] border border-slate-200 bg-white shadow-sm print:border-0 print:shadow-none">
        {/* Header band */}
        <div className="flex items-stretch">
          {/* Logo block */}
          <div className="flex items-center justify-center bg-amber-800 px-6 py-5 text-amber-50">
            <div className="text-center">
              <div className="text-3xl font-black leading-none tracking-tight">AG</div>
              <div className="mt-1 text-[9px] uppercase tracking-[0.2em] text-amber-200">
                Est. 1976
              </div>
            </div>
          </div>
          {/* Company + title */}
          <div className="flex flex-1 flex-col justify-between px-6 py-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {fromName}
              </h1>
              <p className="text-xs text-slate-500">
                Furniture Manufacturing &amp; Interior Fit-out
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-2 border-t border-slate-200 pt-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  Document type
                </p>
                <p className="text-lg font-bold uppercase tracking-wide text-amber-800">
                  {title}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  Document no
                </p>
                <p className="font-mono text-sm font-bold text-slate-900">{documentNo}</p>
                {date && (
                  <p className="mt-0.5 text-xs text-slate-600">Date: {date}</p>
                )}
                {status && (
                  <span className="mt-1 inline-block rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
                    {status}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* From / To */}
        <div className="grid grid-cols-2 border-t border-slate-200">
          <div className="border-r border-slate-200 px-6 py-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              From
            </p>
            <p className="text-sm font-semibold text-slate-900">{fromName}</p>
            <p className="text-xs text-slate-600">{fromAddress}</p>
            <p className="text-xs text-slate-600">{fromContact}</p>
          </div>
          <div className="px-6 py-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {toLabel}
            </p>
            {toName ? (
              <p className="text-sm font-semibold text-slate-900">{toName}</p>
            ) : (
              <p className="text-sm text-slate-400">&mdash;</p>
            )}
            {toAddress && <p className="text-xs text-slate-600">{toAddress}</p>}
            {toContact && <p className="text-xs text-slate-600">{toContact}</p>}
          </div>
        </div>

        {/* Info rows */}
        {infoRows && infoRows.length > 0 && (
          <div className="border-t border-slate-200 px-6 py-3">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {infoRows.map((r) => (
                <div
                  key={r.label}
                  className="flex items-start justify-between gap-2 border-b border-dashed border-slate-200 py-0.5 text-xs"
                >
                  <span className="text-slate-500">{r.label}</span>
                  <span className="text-right font-medium text-slate-900">
                    {r.value || "-"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items table */}
        {items && (
          <div className="border-t border-slate-200 px-6 py-3">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-amber-50">
                  {items.headers.map((h, idx) => (
                    <th
                      key={idx}
                      className={`border border-slate-300 px-2 py-1.5 text-left font-semibold uppercase tracking-wide text-amber-900 ${
                        items.amountColumnIndex === idx ? "text-right" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={items.headers.length}
                      className="border border-slate-300 px-2 py-3 text-center text-slate-500"
                    >
                      No items
                    </td>
                  </tr>
                ) : (
                  items.rows.map((row, rIdx) => (
                    <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className={`border border-slate-300 px-2 py-1.5 ${
                            items.amountColumnIndex === cIdx
                              ? "text-right font-mono"
                              : ""
                          }`}
                        >
                          {String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
              {items.totals && items.totals.length > 0 && (
                <tfoot>
                  {items.totals.map((t, idx) => {
                    const isGrand =
                      /grand\s*total/i.test(t.label) ||
                      /total\s*amount/i.test(t.label);
                    return (
                      <tr key={idx}>
                        <td
                          colSpan={Math.max(items.headers.length - 1, 1)}
                          className={`border border-slate-300 px-2 py-1.5 text-right font-semibold ${
                            isGrand ? "bg-amber-100 text-amber-900" : "bg-slate-50"
                          }`}
                        >
                          {t.label}
                        </td>
                        <td
                          className={`border border-slate-300 px-2 py-1.5 text-right font-mono font-bold ${
                            isGrand ? "bg-amber-100 text-amber-900" : "bg-slate-50"
                          }`}
                        >
                          {t.value}
                        </td>
                      </tr>
                    );
                  })}
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* Notes */}
        {notes && (
          <div className="border-t border-slate-200 px-6 py-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Notes / Terms
            </p>
            <p className="whitespace-pre-wrap text-xs text-slate-700">{notes}</p>
          </div>
        )}

        {/* Custom children */}
        {children && (
          <div className="border-t border-slate-200 px-6 py-3">{children}</div>
        )}

        {/* Signatures */}
        {signatures && signatures.length > 0 && (
          <div className="border-t border-slate-200 px-6 py-6">
            <div
              className="grid gap-6"
              style={{ gridTemplateColumns: `repeat(${signatures.length}, minmax(0, 1fr))` }}
            >
              {signatures.map((s, idx) => (
                <div key={idx} className="text-center">
                  <div className="mb-6 border-b border-dashed border-slate-400" />
                  <p className="text-xs font-medium text-slate-700">{s}</p>
                  <p className="text-[10px] text-slate-500">Al Gurg Group</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-600">
            <span className="font-semibold text-amber-800">Al Gurg Group</span>
            <span>Al Quoz Industrial Area 3, Dubai, UAE</span>
            <span>ops@algurggroup.ae</span>
            <span>TRN: 1001 2345 6789 0123</span>
          </div>
          <p className="mt-1 text-center text-[9px] text-slate-400">
            This is a system-generated document from the Al Gurg Operations Portal and is
            valid without physical signature when issued electronically.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Convenience wrapper: renders the SlipDocument inside a Dialog so existing views
 * can show it on demand without breaking out of their existing dialogs/layout.
 */
export function SlipDialog({
  open,
  onOpenChange,
  children,
  title,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] overflow-y-auto sm:max-w-[900px]"
        showCloseButton
      >
        {title && (
          <div className="no-print mb-2">
            <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
          </div>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}
