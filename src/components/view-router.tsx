"use client";

import type { SessionUser } from "@/lib/auth-shared";
import { DashboardView } from "./views/dashboard-view";
import { EnquiryList } from "./views/enquiry-list";
import { QuotationList } from "./views/quotation-list";
import { ProjectList } from "./views/project-list";
import { ProjectDetail } from "./views/project-detail";
import { QuotationDetail } from "./views/quotation-detail";
import { BoqList } from "./views/boq-list";
import { MrqList } from "./views/mrq-list";
import { SupplierQuoteList } from "./views/supplier-quote-list";
import { PrList } from "./views/pr-list";
import { LpoList } from "./views/lpo-list";
import { GrnView } from "./views/grn-view";
import { QcView } from "./views/qc-view";
import { ProductionView } from "./views/production-view";
import { DrawingsView } from "./views/drawings-view";
import { FinanceView } from "./views/finance-view";
import { ProjectDeptView } from "./views/project-dept-view";
import { RedFlagsDelaysView } from "./views/red-flags-delays-view";
import { ClientsView } from "./views/clients-view";
import { SuppliersView } from "./views/suppliers-view";
import { MaterialsView } from "./views/materials-view";
import { UsersView } from "./views/users-view";

export function ViewRouter({
  user,
  view,
  selectedId,
  setSelectedId,
  selectedSub,
  setSelectedSub,
  navigate,
}: {
  user: SessionUser;
  view: string;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  selectedSub: string | null;
  setSelectedSub: (s: string | null) => void;
  navigate: (v: string) => void;
}) {
  // Detail views take priority
  if (view === "quotations" && selectedId) {
    return (
      <QuotationDetail
        id={selectedId}
        user={user}
        onBack={() => setSelectedId(null)}
      />
    );
  }
  if (view === "projects" && selectedId) {
    return (
      <ProjectDetail
        id={selectedId}
        user={user}
        onBack={() => setSelectedId(null)}
        navigate={navigate}
      />
    );
  }

  switch (view) {
    case "admin":
    case "bm":
    case "estimation":
    case "sales":
    case "procurement":
    case "store":
    case "qc":
    case "production":
    case "engineering":
    case "project-dept":
    case "finance":
      return <DashboardView role={user.role} view={view} user={user} navigate={navigate} setSelectedId={setSelectedId} />;

    case "enquiries":
      return (
        <EnquiryList
          user={user}
          onSelect={(id) => setSelectedId(id)}
          navigateToQuotation={(id) => {
            setSelectedId(id);
            navigate("quotations");
          }}
        />
      );

    case "quotations":
      return <QuotationList user={user} onSelect={(id) => setSelectedId(id)} />;

    case "projects":
      return <ProjectList user={user} onSelect={(id) => setSelectedId(id)} />;

    case "boqs":
      return <BoqList user={user} navigate={navigate} />;

    case "mrqs":
      return <MrqList user={user} />;

    case "supplier-quotes":
      return <SupplierQuoteList user={user} />;

    case "prs":
      return <PrList user={user} />;

    case "lpos":
      return <LpoList user={user} />;

    case "grns":
      return <GrnView user={user} />;

    case "qc-pending":
    case "qc-reports":
    case "qc":
      return <QcView user={user} tab={view} />;

    case "production-orders":
      return <ProductionView user={user} />;

    case "drawings":
      return <DrawingsView user={user} />;

    case "finance":
    case "payment-links":
      return <FinanceView user={user} />;

    case "deliveries":
    case "installations":
    case "feedback":
    case "project-dept":
      return <ProjectDeptView user={user} tab={view} setSelectedId={setSelectedId} navigate={navigate} />;

    case "red-flags":
    case "delays":
      return <RedFlagsDelaysView user={user} tab={view} />;

    case "clients":
      return <ClientsView user={user} />;

    case "suppliers":
      return <SuppliersView user={user} />;

    case "materials":
      return <MaterialsView user={user} />;

    case "users":
      return <UsersView />;

    default:
      return (
        <div className="p-6 text-sm text-muted-foreground">
          Unknown view: {view}
        </div>
      );
  }
}
