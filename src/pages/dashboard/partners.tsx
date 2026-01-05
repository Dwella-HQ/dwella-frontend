import Head from "next/head";
import * as React from "react";
import { Plus, Search } from "lucide-react";
import { useRouter } from "next/router";

import { DashboardLayout } from "@/components/DashboardLayout";
import { PartnersTable } from "@/components/PartnersTable";
import { NewPartnerModal } from "@/components/NewPartnerModal";
import {
  StatusFilterDropdown,
  PARTNER_STATUS_OPTIONS,
} from "@/components/StatusFilterDropdown";
import type { PartnerStatus } from "@/components/PartnersTable";
import { partners } from "@/api/partners/partners.mock";
import { useProfile } from "@/contexts/ProfileContext";

import type { NextPageWithLayout } from "../_app";

const PartnersPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { profile } = useProfile();
  const [statusFilter, setStatusFilter] = React.useState<"all" | PartnerStatus>(
    "all"
  );
  const [isNewPartnerModalOpen, setIsNewPartnerModalOpen] =
    React.useState(false);

  // Redirect partners away from this page
  React.useEffect(() => {
    if (profile && profile.role === "partner") {
      router.replace("/dashboard");
    }
  }, [profile, router]);

  const filteredPartners = React.useMemo(() => {
    if (statusFilter === "all") {
      return partners;
    }

    return partners.filter((partner) => partner.status === statusFilter);
  }, [statusFilter]);

  const handleNewPartnerSubmit = React.useCallback(
    (values: { name: string; email: string; status: PartnerStatus }) => {
      console.info("New partner submitted:", values);
    },
    []
  );

  return (
    <>
      <Head>
        <title>NESCO Partners · Partners</title>
      </Head>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 rounded-lg border border-brand-border-light bg-brand-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ash" />
            <input
              type="text"
              placeholder="Search partners"
              className="w-1/3 rounded-lg border border-brand-border-light bg-brand-light-bg py-2 pl-10 pr-4 text-sm text-brand-black placeholder:text-brand-ash focus:border-brand-main focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusFilterDropdown
              value={statusFilter}
              onChange={(value) =>
                setStatusFilter(value as "all" | PartnerStatus)
              }
              options={PARTNER_STATUS_OPTIONS}
            />
            <button
              type="button"
              onClick={() => setIsNewPartnerModalOpen(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-main px-4 py-2 text-sm font-medium text-brand-white transition-fx hover:bg-brand-main/90"
            >
              <Plus className="h-4 w-4" />
              New Partner
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-border-light bg-brand-white shadow-sm">
          <PartnersTable partners={filteredPartners} />
        </div>
      </section>

      <NewPartnerModal
        isOpen={isNewPartnerModalOpen}
        onClose={() => setIsNewPartnerModalOpen(false)}
        onSubmit={handleNewPartnerSubmit}
      />
    </>
  );
};

PartnersPage.getLayout = (page) => (
  <DashboardLayout
    heading="Partners"
    byText="Manage existing partners and add new partners"
  >
    {page}
  </DashboardLayout>
);

export default PartnersPage;
