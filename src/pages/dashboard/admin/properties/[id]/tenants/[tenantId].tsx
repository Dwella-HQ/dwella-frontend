import { useRouter } from "next/router";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminTenantProfile } from "@/components/admin/AdminTenantProfile";

const TenantProfilePage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id: propertyId } = router.query;
  const propertyIdStr = typeof propertyId === "string" ? propertyId : "1";

  return (
    <AdminTenantProfile
      layoutTitle="Property Details"
      backHref={`/dashboard/admin/properties/${propertyIdStr}`}
      backLabel="Back to property"
    />
  );
};

export default TenantProfilePage;
