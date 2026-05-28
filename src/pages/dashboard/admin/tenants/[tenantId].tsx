import { useRouter } from "next/router";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminTenantProfile } from "@/components/admin/AdminTenantProfile";

/** Tenant profile opened from the global Tenants list - stays under /admin/tenants so nav + back match. */
const AdminTenantFromListPage: NextPageWithLayout = () => {
  const router = useRouter();
  const tenantId =
    typeof router.query.tenantId === "string" ? router.query.tenantId : "";

  return (
    <AdminTenantProfile
      tenantId={tenantId}
      layoutTitle="Tenants"
      backHref="/dashboard/admin/tenants"
      backLabel="Back to tenant list"
    />
  );
};

export default AdminTenantFromListPage;
