export type Courier = {
  id: number;
  firstname: string;
  lastname: string;
  phoneNumber: string;
  nationality: string;
  cnp: string | null;
  cityId: number;
  managerId: number;
  tagIds: number[];
  ctr: number;
  commission: number;
  debt: number;
  createdAt: string;
  updatedAt: string;
};

export type City = {
  id: number;
  name: string;
};

export type Manager = {
  id: number;
  createdAt: string;
  updatedAt: string;
  firstname: string;
  lastname: string;
  phoneNumber: string;
  email: string;
  prefix: string;
  managerCommission: number;
};

export type Account = {
  id: number;
  courierId: number;
  platform: string;
  status: string;
  accountUID: string;
  accountName: string;
  phoneNumber: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type Tag = {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type Report = {
  id: number;
  createdAt: string;
  updatedAt: string;
  closedAt: string;
  startedAt: string;
  endedAt: string;
  status: string;
  boltSum: number;
  woltSum: number;
  glovoSum: number;
  totalIncome: number;
  totalOutcome: number;
  profits: number;
  boltUploaded: boolean;
  glovoUploaded: boolean;
  woltUploaded: boolean;
};

export type ReportByManager = {
  id: number;
  createdAt: string;
  updatedAt: string;
  reportId: number;
  managerId: number;
  boltBefore: number;
  boltAfter: number;
  glovoBefore: number;
  glovoAfter: number;
  woltBefore: number;
  woltAfter: number;
  totalPayout: number;
  totalManagerCommission: number;
};
