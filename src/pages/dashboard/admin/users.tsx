import Head from "next/head";
import { useRouter } from "next/router";
import * as React from "react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";

const AdminUsersPage: NextPageWithLayout = () => {
  const router = useRouter();

  React.useEffect(() => {
    router.replace("/dashboard/admin/tenants");
  }, [router]);

  return (
    <>
      <Head>
        <title>Dwelliva · Tenants</title>
      </Head>
      <AdminLayout title="Tenants">
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B]">
          Redirecting to Tenants...
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminUsersPage;
