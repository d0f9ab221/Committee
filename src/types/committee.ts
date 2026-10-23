export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue';
export type ListStatus = 'active' | 'completed' | 'paused';

export interface PageConfig {
  title: string;
  description: string;
  currencySymbol?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface CommitteeList {
  id: string;
  title: string;
  description?: string;
  monthlyAmount: number;
  totalMembers?: number;
  cycleMonths?: number;
  startDate?: string;
  status: ListStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommitteeMember {
  id: string;
  listId: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  monthlyContribution?: number;
  payoutMonth?: string;
  paymentStatus: PaymentStatus;
  notes?: string;
  orderNumber?: number;
  updatedAt?: string;
}

export interface VisitorSummary {
  uid: string;
  email?: string;
  firstVisit: string;
  lastVisit: string;
  totalVisits: number;
  recentDevice?: string;
}

export interface VisitorEvent {
  id?: string;
  eventId: string;
  uid: string;
  email?: string;
  timestamp: string;
  sessionId: string;
  deviceInfo?: string;
}
