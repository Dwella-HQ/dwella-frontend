import { useRouter } from "next/router";
import * as React from "react";
import type { NextPageWithLayout } from "@/pages/_app";

/** Announcements are not used in the admin console; keep route as a safe redirect. */
const AdminAnnouncementsRedirectPage: NextPageWithLayout = () => {
  const router = useRouter();

  React.useEffect(() => {
    void router.replace("/dashboard/admin");
  }, [router]);

  return null;
};

export default AdminAnnouncementsRedirectPage;
