import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { ArrowLeft } from "lucide-react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";

const AddLandlordPage: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Dwelliva · Add Landlord</title>
      </Head>
      <AdminLayout title="L & P">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ArrowLeft className="h-4 w-4" />
              <span>Add Landlord</span>
            </div>
            <div className="flex gap-2">
              <Link
                href="/dashboard/admin/lp"
                className="rounded-md border border-red-400 px-4 py-1.5 text-xs text-red-600"
              >
                Cancel
              </Link>
              <button className="rounded-md bg-[#111827] px-5 py-1.5 text-xs text-white">
                Add
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#DBEAFE] text-sm font-semibold text-[#2563EB]">
                JD
              </div>
              <div>
                <button className="rounded-md border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-1 text-xs">
                  Choose File
                </button>
                <p className="mt-1 text-[10px] text-[#64748B]">
                  JPG, PNG up to 2MB
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                "Business Name",
                "Phone Number",
                "Address",
                "PIN",
                "State",
                "City",
              ].map((field) => (
                <div
                  key={field}
                  className={field === "Business Name" ? "col-span-2" : ""}
                >
                  <label className="mb-1 block text-xs font-medium text-[#334155]">
                    {field}
                  </label>
                  <input
                    className="h-10 w-full rounded-md border border-[#E2E8F0] px-3 text-xs outline-none"
                    placeholder="Placeholder"
                  />
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-3">
              <div className="rounded-md border border-[#E2E8F0] p-3">
                <p className="text-xs font-medium">Government Issued ID</p>
                <button className="mt-2 rounded-md border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-1 text-xs">
                  Choose File
                </button>
              </div>
              <div className="rounded-md border border-[#E2E8F0] p-3">
                <p className="text-xs font-medium">
                  Tax Identification Number (TIN)
                </p>
                <button className="mt-2 rounded-md border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-1 text-xs">
                  Choose File
                </button>
              </div>
              <div className="rounded-md bg-[#EFF6FF] p-2 text-[10px] text-[#2563EB]">
                Note: all documents and phone number are required.
              </div>
            </div>
          </div>
        </section>
      </AdminLayout>
    </>
  );
};

export default AddLandlordPage;
