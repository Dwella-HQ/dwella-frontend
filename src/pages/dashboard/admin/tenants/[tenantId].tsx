import { useRouter } from "next/router";
import * as React from "react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";

const AdminTenantProfileRedirectPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { tenantId } = router.query;

  React.useEffect(() => {
    if (!router.isReady) return;
    const tenantIdStr = typeof tenantId === "string" ? tenantId : "1";
    void router.replace(`/dashboard/admin/properties/1/tenants/${tenantIdStr}`);
  }, [router, tenantId]);

  return (
    <AdminLayout title="Tenant">
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B]">
        Opening tenant profile...
      </div>
    </AdminLayout>
  );
};

export default AdminTenantProfileRedirectPage;
