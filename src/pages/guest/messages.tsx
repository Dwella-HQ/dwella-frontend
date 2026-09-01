import * as React from "react";
import Head from "next/head";
import { DataUnavailableBanner } from "@/components/DataUnavailableBanner";
import { GuestLayout } from "@/components/guest/GuestLayout";
import type { NextPageWithLayout } from "../_app";

const GuestMessagesPage: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Messages | Dwelliva</title>
      </Head>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="mt-1 text-sm text-gray-600">
            Communicate with Property owners and Managers
          </p>
        </div>
        <DataUnavailableBanner
          title="Messages aren't available yet"
          description="Guest messaging isn't connected to live conversations. Check back once chat is enabled for your account."
        />
      </div>
    </>
  );
};

GuestMessagesPage.getLayout = (page) => <GuestLayout>{page}</GuestLayout>;

export default GuestMessagesPage;
