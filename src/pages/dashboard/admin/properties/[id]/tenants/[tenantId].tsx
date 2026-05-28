import { useRouter } from "next/router";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminTenantProfile } from "@/components/admin/AdminTenantProfile";

const TenantProfilePage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id: propertyId, tenantId } = router.query;
  const propertyIdStr = typeof propertyId === "string" ? propertyId : "1";
  const tenantIdStr = typeof tenantId === "string" ? tenantId : "";

  return (
    <AdminTenantProfile
      tenantId={tenantIdStr}
      layoutTitle="Property Details"
      backHref={`/dashboard/admin/properties/${propertyIdStr}`}
      backLabel="Back to property"
    />
  );
};

export default TenantProfilePage;
