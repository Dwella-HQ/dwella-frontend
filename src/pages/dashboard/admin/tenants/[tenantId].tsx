import type { NextPageWithLayout } from "@/pages/_app";
import { AdminTenantProfile } from "@/components/admin/AdminTenantProfile";

/** Tenant profile opened from the global Tenants list — stays under /admin/tenants so nav + back match. */
const AdminTenantFromListPage: NextPageWithLayout = () => {
  return (
    <AdminTenantProfile
      layoutTitle="Tenants"
      backHref="/dashboard/admin/tenants"
      backLabel="Back to tenant list"
    />
  );
};

export default AdminTenantFromListPage;
