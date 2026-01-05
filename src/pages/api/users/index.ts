import type { NextApiRequest, NextApiResponse } from "next";

const users = [
  {
    id: "dwella-1",
    name: "Adaobi Lawson",
    email: "adaobi.lawson@dwella.ng",
    role: "Partner Manager",
    status: "active",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "dwella-2",
    name: "Chinedu Okafor",
    email: "chinedu.okafor@dwella.ng",
    role: "Finance Analyst",
    status: "active",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: "dwella-3",
    name: "Fatima Bello",
    email: "fatima.bello@dwella.ng",
    role: "Operations Lead",
    status: "invited",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
];

const handler = (_req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).json({
    data: users,
  });
};

export default handler;


