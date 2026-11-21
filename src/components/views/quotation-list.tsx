"use client";

import { useState } from "react";
import { useList, useAction } from "@/lib/queries";
import type { SessionUser } from "@/lib/auth-shared";
import { PageHeader } from "../erp/primitives";
import { DataTable } from "../erp/data-table";
import { StatusBadge } from "../status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Printer } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { QuotationForm } from "./quotation-form";

export function QuotationList({
  user,
  onSelect,
}: {
  user: SessionUser;
  onSelect: (id: string) => void;
}) {
  const { data, isLoading } = useList<any>("quotations");
  const [createOpen, setCreateOpen] = useState(false);

  const canCreate =
    user.role === "ESTIMATION" ||
    user.role === "ADMIN" ||
    user.role === "SALES";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Quotations"
        description="All quotations across draft, approval, sent, signed & released"
        actions={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> New Quotation
            </Button>
          ) : null
        }
      />
      <DataTable
        loading={isLoading}
        data={data}
        onRowClick={(q) => onSelect(q.id)}
        columns={[
          { key: "quotationNo", header: "Quotation", render: (q) => <span className="font-medium">{q.quotationNo}</span> },
          { key: "client", header: "Client", render: (q) => q.client?.name },
          { key: "enquiry", header: "Enquiry", render: (q) => q.enquiry?.enquiryNo },
          { key: "total", header: "Total", render: (q) => formatCurrency(q.total) },
          { key: "createdBy", header: "Created by", render: (q) => q.creator?.name },
          { key: "status", header: "Status", render: (q) => <StatusBadge status={q.status} /> },
          { key: "createdAt", header: "Created", render: (q) => formatDate(q.createdAt) },
        ]}
      />
      {createOpen && (
        <QuotationForm
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={(id) => {
            setCreateOpen(false);
            onSelect(id);
          }}
        />
      )}
    </div>
  );
}

