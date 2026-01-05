import Head from "next/head";
import * as React from "react";
import { Search, Copy, Check, AlertCircle, X } from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { getApiBaseUrl } from "@/utils/createUrl";

import type { NextPageWithLayout } from "../_app";

type ApiEndpoint = {
  id: string;
  title: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  authRequired: boolean;
  requestBody?: string;
  responses: {
    status: number;
    description: string;
    example: object;
  }[];
};

const mockEndpoints: ApiEndpoint[] = [
  {
    id: "get-vending-status",
    title: "Get Vending Status",
    method: "GET",
    path: "/partners/vend/status",
    description: "Check the current vending status and system availability",
    authRequired: true,
    responses: [
      {
        status: 401,
        description: "Unauthorized - API key missing or invalid",
        example: {
          success: false,
          message: "Partner API key is required",
        },
      },

      {
        status: 500,
        description: "Internal Server Error - Vending service unavailable",
        example: {
          success: false,
          message: "Vending service unavailable",
        },
      },
      {
        status: 200,
        description: "Success - Vending status check passed",
        example: {
          success: true,
          message: "Vending status check passed: ",
          data: {
            date: "2025-11-21 15:26:38",
          },
        },
      },
    ],
  },
  {
    id: "get-meter-number",
    title: "Get Meter Number",
    method: "GET",
    path: "/partners/vend/meter-number/{meterNumber}",
    description: "Retrieve consumer information by meter number",
    authRequired: true,
    responses: [
      {
        status: 401,
        description: "Unauthorized - API key missing or invalid",
        example: {
          success: false,
          message: "Partner API key is required",
        },
      },
      {
        status: 404,
        description: "Not Found - Meter number not found",
        example: {
          success: false,
          message: "Meter not found",
        },
      },
      {
        status: 200,
        description: "Success - Consumer retrieved successfully",
        example: {
          success: true,
          message: "Consumer retrieved successfully",
          data: {
            id: 382,
            account_name: "CHIROMA CHUKWUKA ADEKUNLE",
            phone: null,
            account_number: "PCTM0001",
            account_type: "PUB",
            district: "CTM",
            account_type_number: null,
            meter_type: "PREPAID",
            postpaid_meter_number: "44070001",
            connection_date: null,
            prepaid_meter_number: "0101235035983",
            long: 8.86005,
            lat: 9.77618,
            class: null,
            category: null,
            res_address1: "CTM LTD",
            res_address2: "BUKURU",
            res_address3: "",
            con_address1: "CTM LTD",
            con_address2: "BUKURU",
            con_address3: "",
            month_count: 1,
            reading_mode: "ESTIMATED",
            units: 0,
            estimated_units: 0,
            multiplying_factor: 1,
            percentage_discount: null,
            discount_allowed: "0.00",
            tariff: "non-md-residential-A",
            feeder: "south-residential-feeder",
            substation: "",
            meter_status: "OTHERS",
            account_status: "dormant",
            reconciliation_active: 1,
            createdAt: "2023-01-10T23:54:22.000Z",
            updatedAt: "2025-11-15T14:38:37.000Z",
            deletedAt: null,
            outstanding_balance: "266188.02",
            minimum_purchase_amount: 0,
          },
        },
      },
    ],
  },
  {
    id: "issue-credit-token",
    title: "Issue Credit Token",
    method: "POST",
    path: "/partners/vend/token/issue",
    description: "Issue a credit token for a consumer meter",
    authRequired: true,
    requestBody: JSON.stringify(
      {
        meter_number: "0101235035983",
        amount: 10000,
        partner_reference: "partnerRef3",
      },
      null,
      2
    ),
    responses: [
      {
        status: 401,
        description: "Unauthorized - API key missing or invalid",
        example: {
          success: false,
          message: "Partner API key is required",
        },
      },
      {
        status: 404,
        description: "Not Found - Meter not found",
        example: {
          success: false,
          message: "Meter not found",
        },
      },
      {
        status: 201,
        description: "Success - Token issued successfully",
        example: {
          success: true,
          message: "Credit token issued successfully",
          data: {
            transaction_id: "2025112102532029",
            customer: "CHIROMA CHUKWUKA ADEKUNLE",
            meter_number: "0101235035983",
            token: "3136-5281-2931-9565-6102",
            costOfElectricity: "₦9,250",
            vat: "₦750",
            debt_reconciliation: "₦1,000",
            convenience_charge: "₦0",
            transactionReference: "NESCO2025112102531648",
            description: "Credit:Electricity",
            numberOfUnits: 50,
            UnitValue: "kWh",
            tariff: "non-md-residential-A",
            payment_type: "PARTNER",
            payment_date: "2025-11-21T13:53:20.100Z",
            customer_address: "CTM LTD",
          },
        },
      },
    ],
  },
  {
    id: "get-wallet-balance",
    title: "Get Partner Wallet Balance",
    method: "GET",
    path: "/partners/vend/wallet-balance",
    description:
      "Retrieve the current wallet balance for the authenticated partner",
    authRequired: true,
    responses: [
      {
        status: 401,
        description: "Unauthorized - API key missing or invalid",
        example: {
          success: false,
          message: "Partner API key is required",
        },
      },
      {
        status: 200,
        description: "Success - Wallet balance retrieved successfully",
        example: {
          success: true,
          message: "Wallet balance retrieved successfully",
          data: {
            balance: "142000.00",
            formattedBalance: "142,000",
          },
        },
      },
    ],
  },
  {
    id: "get-wallet-transactions",
    title: "Get Partner Wallet Transaction History",
    method: "GET",
    path: "/partners/vend/wallet-transactions",
    description:
      "Retrieve paginated wallet transaction history with optional filtering by type (credit/debit). Query parameters: ?page=1&pageSize=10&type=credit (type is optional: 'credit' or 'debit')",
    authRequired: true,
    responses: [
      {
        status: 401,
        description: "Unauthorized - API key missing or invalid",
        example: {
          success: false,
          message: "Partner API key is required",
        },
      },
      {
        status: 200,
        description: "Success - Transactions fetched successfully",
        example: {
          status: "success",
          message: "Transactions fetched",
          data: {
            total: 4,
            pagination: {
              prevPage: null,
              currentPage: 1,
              nextPage: null,
              pageTotal: 1,
              pageSize: 4,
            },
            transactions: [
              {
                id: 4,
                type: "credit",
                description: "Partner wallet topup by NESCO",
                partner_id: 3,
                email: "chukwuka.ezeaka+partner@gmail.com",
                amount: "30000.00",
                prev_balance: "160000.00",
                curr_balance: "190000.00",
                confirmed: true,
                reference: "NESCO2025112006515134",
                genus: "partner",
                status: "successful",
                createdAt: "2025-11-20T17:51:51.000Z",
                updatedAt: "2025-11-20T17:51:51.000Z",
                deletedAt: null,
              },
            ],
          },
        },
      },
    ],
  },
  {
    id: "get-transaction-details",
    title: "Query Transaction Status by Partner Reference",
    method: "GET",
    path: "/partners/vend/transaction-details/{partner_reference}",
    description:
      "Retrieve transaction details and status using the partner's reference ID",
    authRequired: true,
    responses: [
      {
        status: 401,
        description: "Unauthorized - API key missing or invalid",
        example: {
          success: false,
          message: "Partner API key is required",
        },
      },
      {
        status: 200,
        description: "Success - Transaction details fetched (completed)",
        example: {
          success: true,
          message: "Transaction details fetched",
          data: {
            transaction_id: 98,
            customer: "CHIROMA CHUKWUKA ADEKUNLE",
            meter_number: "0101235035983",
            token: "3136-5281-2931-9565-6102",
            costOfElectricity: "₦8,325",
            vat: "₦675",
            debt_reconciliation: "₦1,000",
            convenience_charge: "₦0",
            transactionReference: "NESCO2025112103213178",
            description: "Credit:Electricity",
            numberOfUnits: "50.00",
            UnitValue: "kWh",
            tariff: "non-md-residential-A",
            payment_type: "PARTNER",
            payment_date: "2025-11-21T14:21:36.000Z",
            customer_address: "CTM LTD",
            partner_reference: "partnerRef3",
            status: "completed",
          },
        },
      },
      {
        status: 200,
        description: "Transaction failed",
        example: {
          success: false,
          message: "Transaction failed",
          data: {
            transaction_id: 2147483647,
            customer: "CHIROMA CHUKWUKA ADEKUNLE",
            meter_number: "0101235035983",
            token: "3136-5281-2931-9565-6102",
            costOfElectricity: "₦9,250",
            vat: "₦750",
            debt_reconciliation: "₦1,000",
            convenience_charge: "₦0",
            transactionReference: "NESCO2025112102531648",
            description: "Credit:Electricity",
            numberOfUnits: "50.00",
            UnitValue: "kWh",
            tariff: "non-md-residential-A",
            payment_type: "PARTNER",
            payment_date: "2025-11-21T13:53:20.000Z",
            customer_address: "CTM LTD",
            partner_reference: "partnerRef1",
            status: "failed",
          },
        },
      },
    ],
  },
  {
    id: "get-consumer-transactions",
    title: "Get Consumer Token Purchase History",
    method: "GET",
    path: "/partners/vend/consumer-transactions/{meter_number}",
    description:
      "Retrieve paginated token purchase history for a specific consumer by meter number. Query parameters: ?page=1&pageSize=10",
    authRequired: true,
    responses: [
      {
        status: 401,
        description: "Unauthorized - API key missing or invalid",
        example: {
          success: false,
          message: "Partner API key is required",
        },
      },
      {
        status: 200,
        description: "Success - Transactions fetched successfully",
        example: {
          status: "success",
          message: "Transactions fetched",
          data: {
            total: 9,
            pagination: {
              prevPage: null,
              currentPage: 1,
              nextPage: null,
              pageTotal: 1,
              pageSize: 9,
            },
            transactions: [
              {
                id: 61399,
                transaction_id: 8152631,
                transaction_reference: "NESCO2025112612143840",
                status: "completed",
                issuer_id: null,
                account_number: "PCTM0001",
                meter_number: "0101235035983",
                payment_type: "PARTNER",
                customer: "CHIROMA CHUKWUKA ADEKUNLE",
                account_type: "PUB",
                tariff: "non-md-residential-A",
                feeder: "south-residential-feeder",
                amount: "10000.00",
                debt_reconciliation: "1000.00",
                charged_amount: "8325.00",
                vat: "675.00",
                transaction_charge: 100,
                kwh: "50.00",
                token: "0541-6997-6518-5037-7418",
                date: "2025-11-26T11:14:44.000Z",
                partner_id: 3,
                partner_reference: "partnerRef46",
                createdAt: "2025-11-26T11:14:44.000Z",
                updatedAt: "2025-11-26T11:14:44.000Z",
                partner: {
                  id: 3,
                  name: "BuyPower",
                  email: "chukwuka.ezeaka+partner@gmail.com",
                  phone: "08100612244",
                  isActive: true,
                  isSuspended: false,
                  account_mode: "sandbox",
                },
                consumer: {
                  id: 382,
                  account_name: "CHIROMA CHUKWUKA ADEKUNLE",
                  phone: null,
                  account_number: "PCTM0001",
                  account_type: "PUB",
                  district: "CTM",
                  account_type_number: null,
                  meter_type: "PREPAID",
                  postpaid_meter_number: "44070001",
                  connection_date: null,
                  prepaid_meter_number: "0101235035983",
                  long: 8.86005,
                  lat: 9.77618,
                  class: null,
                  category: null,
                  res_address1: "CTM LTD",
                  res_address2: "BUKURU",
                  res_address3: "",
                  con_address1: "CTM LTD",
                  con_address2: "BUKURU",
                  con_address3: "",
                  month_count: 1,
                  reading_mode: "ESTIMATED",
                  units: 0,
                  estimated_units: 0,
                  multiplying_factor: 1,
                  percentage_discount: null,
                  discount_allowed: "0.00",
                  tariff: "non-md-residential-A",
                  feeder: "south-residential-feeder",
                  substation: "",
                  meter_status: "OTHERS",
                  account_status: "dormant",
                  reconciliation_active: true,
                  createdAt: "2023-01-10T23:54:22.000Z",
                  updatedAt: "2025-11-26T11:26:03.000Z",
                  deletedAt: null,
                },
              },
            ],
          },
        },
      },
    ],
  },
];

const DocumentationPage: NextPageWithLayout = () => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedEndpoint, setSelectedEndpoint] =
    React.useState<ApiEndpoint | null>(mockEndpoints[0]);
  const [copiedText, setCopiedText] = React.useState<string | null>(null);
  const [baseUrl] = React.useState(() => {
    if (typeof window !== "undefined") {
      return getApiBaseUrl();
    }
    return "";
  });

  const filteredEndpoints = React.useMemo(() => {
    if (!searchQuery.trim()) return mockEndpoints;

    const query = searchQuery.toLowerCase();
    return mockEndpoints.filter(
      (endpoint) =>
        endpoint.title.toLowerCase().includes(query) ||
        endpoint.path.toLowerCase().includes(query) ||
        endpoint.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleCopy = React.useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(id);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, []);

  const handleCloseDetail = React.useCallback(() => {
    setSelectedEndpoint(null);
  }, []);

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-brand-success-bg text-brand-success-text";
      case "POST":
        return "bg-brand-main-bg text-brand-main";
      case "PUT":
        return "bg-brand-pending-bg text-brand-pending-text";
      case "DELETE":
        return "bg-brand-failed-bg text-brand-failed-text";
      default:
        return "bg-brand-ash text-brand-white";
    }
  };

  return (
    <>
      <Head>
        <title>NESCO Partners · Documentation</title>
      </Head>

      <section className="grid gap-6 lg:grid-cols-3">
        {/* Left Sidebar - Endpoints List */}
        <div className="flex flex-col gap-6 min-w-0">
          {/* Base URL Display */}
          {baseUrl && (
            <div className="rounded-lg border border-brand-border-light bg-brand-light-bg p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-brand-ash mb-1">
                    Base URL
                  </p>
                  <code className="text-sm font-mono text-brand-black break-all">
                    {baseUrl}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(baseUrl, "base-url")}
                  className="flex-shrink-0 p-1.5 text-brand-ash hover:text-brand-main transition-fx"
                >
                  {copiedText === "base-url" ? (
                    <Check className="h-4 w-4 text-brand-success-text" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-ash" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-lg border-[0.3px] border-brand-border-light bg-brand-light-bg pl-10 pr-4 text-sm text-brand-black placeholder:text-brand-ash transition focus:ring-2 focus:ring-brand-main focus:outline-none"
            />
          </div>

          {/* Endpoints List */}
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-250px)]">
            {filteredEndpoints.map((endpoint) => {
              const isSelected = selectedEndpoint?.id === endpoint.id;
              return (
                <button
                  key={endpoint.id}
                  type="button"
                  onClick={() => setSelectedEndpoint(endpoint)}
                  className={`transition-fx w-full text-left rounded-lg p-3 cursor-pointer ${
                    isSelected
                      ? "bg-brand-main-bg border border-brand-main"
                      : "bg-brand-white border border-brand-border-light hover:border-brand-main hover:bg-brand-light-bg"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${getMethodColor(
                        endpoint.method
                      )}`}
                    >
                      {endpoint.method}
                    </span>
                    <span className="text-xs font-mono text-brand-ash truncate">
                      {endpoint.path}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-brand-black">
                    {endpoint.title}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side - Endpoint Details */}
        <div className="flex flex-col lg:col-span-2">
          {selectedEndpoint ? (
            <div className="rounded-2xl border border-brand-border-light bg-brand-white p-6 shadow-sm h-fit sticky top-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6 pb-4 border-b border-brand-border-light">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`inline-flex items-center rounded px-3 py-1 text-sm font-medium ${getMethodColor(
                        selectedEndpoint.method
                      )}`}
                    >
                      {selectedEndpoint.method}
                    </span>
                    <code className="text-sm font-mono text-brand-black bg-brand-light-bg px-3 py-1 rounded">
                      {selectedEndpoint.path}
                    </code>
                    {copiedText === `path-${selectedEndpoint.id}` ? (
                      <Check className="h-4 w-4 text-brand-success-text" />
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            selectedEndpoint.path,
                            `path-${selectedEndpoint.id}`
                          )
                        }
                        className="text-brand-ash hover:text-brand-main transition-fx"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold text-brand-black">
                    {selectedEndpoint.title}
                  </h2>
                  <p className="mt-2 text-sm text-brand-ash">
                    {selectedEndpoint.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseDetail}
                  className="flex-shrink-0 rounded-lg p-1.5 text-brand-ash hover:bg-brand-light-bg hover:text-brand-black transition-fx ml-4"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Path Parameters */}
                {selectedEndpoint.path.includes("{") && (
                  <div>
                    <h3 className="text-base font-semibold text-brand-black mb-3">
                      Path Parameters
                    </h3>
                    <div className="rounded-lg border border-brand-border-light bg-brand-light-bg p-4 space-y-3">
                      {selectedEndpoint.path
                        .match(/\{([^}]+)\}/g)
                        ?.map((param, index) => {
                          const paramName = param.replace(/[{}]/g, "");
                          const exampleValue =
                            paramName === "meterNumber"
                              ? "0101235035983"
                              : undefined;
                          return (
                            <div key={index} className="flex items-start gap-3">
                              <code className="text-sm font-mono text-brand-main bg-brand-white px-2 py-1 rounded border border-brand-border-light">
                                {paramName}
                              </code>
                              <div className="flex-1">
                                <p className="text-sm text-brand-black">
                                  The {paramName.replace(/_/g, " ")} to retrieve
                                  information for
                                  {exampleValue && (
                                    <span className="block mt-1 text-xs text-brand-ash">
                                      Only use this meter number for tests:{" "}
                                      <code className="font-mono text-brand-black">
                                        {exampleValue}
                                      </code>
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Authentication */}
                {selectedEndpoint.authRequired && (
                  <div className="rounded-lg bg-brand-main-bg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-brand-main flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-semibold text-brand-black mb-1">
                          Authentication Required
                        </h3>
                        <p className="text-xs text-brand-ash">
                          This endpoint requires a valid Partner API key.
                          Include it in the request header:
                        </p>
                        <code className="mt-2 block text-xs font-mono bg-brand-white px-3 py-2 rounded border border-brand-border-light">
                          api-key: {"<"}your-api-key{">"}
                        </code>
                      </div>
                    </div>
                  </div>
                )}

                {/* Request Body (if applicable) */}
                {selectedEndpoint.requestBody && (
                  <div>
                    <h3 className="text-base font-semibold text-brand-black mb-3">
                      Request Body
                    </h3>
                    <div className="relative rounded-lg border border-brand-border-light bg-brand-light-bg">
                      <button
                        type="button"
                        onClick={() => {
                          const bodyText =
                            typeof selectedEndpoint.requestBody === "string"
                              ? selectedEndpoint.requestBody
                              : JSON.stringify(
                                  selectedEndpoint.requestBody,
                                  null,
                                  2
                                );
                          handleCopy(
                            bodyText,
                            `request-${selectedEndpoint.id}`
                          );
                        }}
                        className="absolute top-3 right-3 p-2 text-brand-ash hover:text-brand-main transition-fx"
                      >
                        {copiedText === `request-${selectedEndpoint.id}` ? (
                          <Check className="h-4 w-4 text-brand-success-text" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <pre className="p-4 text-xs font-mono text-brand-black overflow-x-auto">
                        {typeof selectedEndpoint.requestBody === "string"
                          ? selectedEndpoint.requestBody
                          : JSON.stringify(
                              selectedEndpoint.requestBody,
                              null,
                              2
                            )}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Responses */}
                <div>
                  <h3 className="text-base font-semibold text-brand-black mb-3">
                    Responses
                  </h3>
                  <div className="space-y-4">
                    {selectedEndpoint.responses.map((response, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-brand-border-light bg-brand-light-bg"
                      >
                        <div className="flex items-center justify-between p-4 border-b border-brand-border-light">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${
                                response.status >= 200 && response.status < 300
                                  ? "bg-brand-success-bg text-brand-success-text"
                                  : response.status >= 400
                                    ? "bg-brand-failed-bg text-brand-failed-text"
                                    : "bg-brand-pending-bg text-brand-pending-text"
                              }`}
                            >
                              {response.status}
                            </span>
                            <span className="text-sm text-brand-black">
                              {response.description}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                JSON.stringify(response.example, null, 2),
                                `response-${selectedEndpoint.id}-${response.status}`
                              )
                            }
                            className="text-brand-ash hover:text-brand-main transition-fx"
                          >
                            {copiedText ===
                            `response-${selectedEndpoint.id}-${response.status}` ? (
                              <Check className="h-4 w-4 text-brand-success-text" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <div className="relative">
                          <pre className="p-4 text-xs font-mono text-brand-black overflow-x-auto">
                            {JSON.stringify(response.example, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-brand-border-light bg-brand-white p-6 shadow-sm flex items-center justify-center h-fit sticky top-6">
              <p className="text-sm text-brand-ash">
                Select an endpoint to view documentation
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

DocumentationPage.getLayout = (page) => (
  <DashboardLayout
    heading="Documentation"
    byText="API documentation and integration guides"
  >
    {page}
  </DashboardLayout>
);

export default DocumentationPage;
