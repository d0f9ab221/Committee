import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errorHandling';
import { PageConfig, CommitteeList, CommitteeMember, PaymentStatus } from '../types/committee';

const ADMIN_EMAIL = 'kfmughal79@gmail.com';

export function isUserVerifiedAdmin(): boolean {
  const user = auth.currentUser;
  return !!user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() && user.emailVerified === true;
}

// 1. Subscribe to Page Configuration
export function subscribePageConfig(
  onUpdate: (config: PageConfig) => void,
  onError?: (err: Error) => void
) {
  const pageDocRef = doc(db, 'page', 'main');
  return onSnapshot(
    pageDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onUpdate({
          title: data.title || 'Mughal Family Committee',
          description: data.description || 'Private committee savings pool & member payout cycle manager.',
          currencySymbol: data.currencySymbol || 'PKR',
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy
        });
      } else {
        // Fallback default if doc doesn't exist yet
        onUpdate({
          title: 'Mughal Family Committee',
          description: 'Private committee savings pool & member payout cycle manager.',
          currencySymbol: 'PKR'
        });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'page/main');
      onError?.(error as Error);
    }
  );
}

// Update Page Config (Admin only)
export async function updatePageConfig(config: Partial<PageConfig>): Promise<void> {
  const path = 'page/main';
  try {
    const pageDocRef = doc(db, 'page', 'main');
    const payload = {
      title: config.title || 'Mughal Family Committee',
      description: config.description || '',
      currencySymbol: config.currencySymbol || 'PKR',
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser?.uid || 'admin'
    };
    await setDoc(pageDocRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 2. Committee Lists
export function subscribeCommitteeLists(
  onUpdate: (lists: CommitteeList[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'lists';
  const listsCollection = collection(db, path);
  return onSnapshot(
    listsCollection,
    (snapshot) => {
      const lists: CommitteeList[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title || 'Untitled Pool',
          description: data.description || '',
          monthlyAmount: data.monthlyAmount || 0,
          totalMembers: data.totalMembers || 0,
          cycleMonths: data.cycleMonths || 12,
          startDate: data.startDate || '',
          status: data.status || 'active',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      });
      onUpdate(lists);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onError?.(error as Error);
    }
  );
}

export async function addCommitteeList(
  listData: Omit<CommitteeList, 'id'>
): Promise<string> {
  const path = 'lists';
  try {
    const listsCol = collection(db, path);
    const now = new Date().toISOString();
    const docRef = await addDoc(listsCol, {
      title: listData.title,
      description: listData.description || '',
      monthlyAmount: Number(listData.monthlyAmount) || 0,
      totalMembers: Number(listData.totalMembers) || 0,
      cycleMonths: Number(listData.cycleMonths) || 12,
      startDate: listData.startDate || '',
      status: listData.status || 'active',
      createdAt: now,
      updatedAt: now
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCommitteeList(
  id: string,
  listData: Partial<CommitteeList>
): Promise<void> {
  const path = `lists/${id}`;
  try {
    const listRef = doc(db, 'lists', id);
    const now = new Date().toISOString();
    const updatePayload: Record<string, any> = { updatedAt: now };
    if (listData.title !== undefined) updatePayload.title = listData.title;
    if (listData.description !== undefined) updatePayload.description = listData.description;
    if (listData.monthlyAmount !== undefined) updatePayload.monthlyAmount = Number(listData.monthlyAmount);
    if (listData.totalMembers !== undefined) updatePayload.totalMembers = Number(listData.totalMembers);
    if (listData.cycleMonths !== undefined) updatePayload.cycleMonths = Number(listData.cycleMonths);
    if (listData.startDate !== undefined) updatePayload.startDate = listData.startDate;
    if (listData.status !== undefined) updatePayload.status = listData.status;

    await updateDoc(listRef, updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCommitteeList(id: string, listMembers: CommitteeMember[] = []): Promise<void> {
  const path = `lists/${id}`;
  try {
    // Delete all associated member records first
    const membersToDelete = listMembers.filter((m) => m.listId === id);
    if (membersToDelete.length > 0) {
      await Promise.all(membersToDelete.map((m) => deleteDoc(doc(db, 'members', m.id))));
    }
    // Delete list document
    await deleteDoc(doc(db, 'lists', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 3. Committee Members
export function subscribeMembers(
  onUpdate: (members: CommitteeMember[]) => void,
  onError?: (err: Error) => void
) {
  const path = 'members';
  const membersCol = collection(db, path);
  return onSnapshot(
    membersCol,
    (snapshot) => {
      const members: CommitteeMember[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          listId: data.listId || '',
          name: data.name || 'Member',
          phone: data.phone || '',
          avatarUrl: data.avatarUrl || '',
          monthlyContribution: data.monthlyContribution !== undefined ? Number(data.monthlyContribution) : 0,
          payoutMonth: data.payoutMonth || '',
          paymentStatus: (data.paymentStatus as PaymentStatus) || 'Pending',
          notes: data.notes || '',
          orderNumber: data.orderNumber ?? 0,
          updatedAt: data.updatedAt
        };
      });
      // Sort by orderNumber asc
      members.sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0));
      onUpdate(members);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onError?.(error as Error);
    }
  );
}

export async function addMember(
  memberData: Omit<CommitteeMember, 'id'>
): Promise<string> {
  const path = 'members';
  try {
    const membersCol = collection(db, path);
    const now = new Date().toISOString();
    const docRef = await addDoc(membersCol, {
      listId: memberData.listId,
      name: memberData.name,
      phone: memberData.phone || '',
      avatarUrl: memberData.avatarUrl || '',
      monthlyContribution: memberData.monthlyContribution !== undefined ? Number(memberData.monthlyContribution) : 0,
      payoutMonth: memberData.payoutMonth || '',
      paymentStatus: memberData.paymentStatus || 'Pending',
      notes: memberData.notes || '',
      orderNumber: Number(memberData.orderNumber) || 1,
      updatedAt: now
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateMember(
  id: string,
  memberData: Partial<CommitteeMember>
): Promise<void> {
  const path = `members/${id}`;
  try {
    const memberRef = doc(db, 'members', id);
    const now = new Date().toISOString();
    const payload: Record<string, any> = { updatedAt: now };

    if (memberData.listId !== undefined) payload.listId = memberData.listId;
    if (memberData.name !== undefined) payload.name = memberData.name;
    if (memberData.phone !== undefined) payload.phone = memberData.phone;
    if (memberData.avatarUrl !== undefined) payload.avatarUrl = memberData.avatarUrl;
    if (memberData.monthlyContribution !== undefined) payload.monthlyContribution = Number(memberData.monthlyContribution);
    if (memberData.payoutMonth !== undefined) payload.payoutMonth = memberData.payoutMonth;
    if (memberData.paymentStatus !== undefined) payload.paymentStatus = memberData.paymentStatus;
    if (memberData.notes !== undefined) payload.notes = memberData.notes;
    if (memberData.orderNumber !== undefined) payload.orderNumber = Number(memberData.orderNumber);

    await updateDoc(memberRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteMember(id: string): Promise<void> {
  const path = `members/${id}`;
  try {
    await deleteDoc(doc(db, 'members', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function toggleMemberPaymentStatus(
  id: string,
  currentStatus: PaymentStatus
): Promise<void> {
  let nextStatus: PaymentStatus = 'Paid';
  if (currentStatus === 'Paid') nextStatus = 'Pending';
  else if (currentStatus === 'Pending') nextStatus = 'Overdue';
  else if (currentStatus === 'Overdue') nextStatus = 'Paid';

  await updateMember(id, { paymentStatus: nextStatus });
}


// Helper: Seed initial sample data for fresh Firestore databases
export async function seedSampleData(): Promise<void> {
  const listId = await addCommitteeList({
    title: 'Mughal Family Pool 2026',
    description: 'Monthly savings pool for family members. Payout on 5th of each month.',
    monthlyAmount: 20000,
    totalMembers: 5,
    cycleMonths: 12,
    startDate: 'Jan 2026',
    status: 'active'
  });

  if (listId) {
    await addMember({
      listId,
      name: 'KF Mughal (Admin)',
      phone: '+92 300 1234567',
      monthlyContribution: 20000,
      payoutMonth: 'Month 1 - Jan 2026',
      paymentStatus: 'Paid',
      notes: 'Admin slot #1',
      orderNumber: 1
    });

    await addMember({
      listId,
      name: 'Usman Mughal',
      phone: '+92 321 7654321',
      monthlyContribution: 20000,
      payoutMonth: 'Month 2 - Feb 2026',
      paymentStatus: 'Paid',
      notes: 'Paid via online transfer',
      orderNumber: 2
    });

    await addMember({
      listId,
      name: 'Tariq Mughal',
      phone: '+92 333 9876543',
      monthlyContribution: 20000,
      payoutMonth: 'Month 3 - Mar 2026',
      paymentStatus: 'Pending',
      notes: 'Due on 5th',
      orderNumber: 3
    });
  }
}
