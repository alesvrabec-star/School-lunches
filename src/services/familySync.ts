import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  deleteDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db, ensureAuth } from '../firebase';
import {
  AppSettings,
  LunchRecord,
  MonthlyPaymentRecord,
  ExtraPayment,
} from '../types/lunch';

export interface FamilyInfo {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

const LOCAL_FAMILY_KEY = 'obednik_family_session_v1';
const LOCAL_USER_ROLE_KEY = 'obednik_user_role_v1'; // 'Táta' | 'Máma' | custom

export function getStoredFamilyId(): string | null {
  return localStorage.getItem(LOCAL_FAMILY_KEY);
}

export function setStoredFamilyId(id: string | null): void {
  if (id) {
    localStorage.setItem(LOCAL_FAMILY_KEY, id);
  } else {
    localStorage.removeItem(LOCAL_FAMILY_KEY);
  }
}

export function getStoredUserRole(): string {
  return localStorage.getItem(LOCAL_USER_ROLE_KEY) || 'Rodič';
}

export function setStoredUserRole(role: string): void {
  localStorage.setItem(LOCAL_USER_ROLE_KEY, role);
}

function generateReadableCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `OBED-${num}`;
}

export async function createFamily(
  familyName: string,
  initialSettings: AppSettings,
  existingRecords: Record<string, LunchRecord>,
  existingPayments: Record<string, MonthlyPaymentRecord>,
  existingExtras: ExtraPayment[]
): Promise<FamilyInfo> {
  await ensureAuth();
  const familyId = `fam_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const code = generateReadableCode();

  const familyData = {
    id: familyId,
    code,
    name: familyName || `Rodina (${initialSettings.child.name})`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: initialSettings,
  };

  // 1. Create family document
  await setDoc(doc(db, 'families', familyId), familyData);

  // 2. Upload initial records
  const batchPromises: Promise<any>[] = [];
  Object.values(existingRecords).forEach((rec) => {
    batchPromises.push(
      setDoc(doc(db, 'families', familyId, 'records', rec.date), rec)
    );
  });

  // 3. Upload initial payments
  Object.values(existingPayments).forEach((pay) => {
    batchPromises.push(
      setDoc(doc(db, 'families', familyId, 'payments', pay.monthKey), pay)
    );
  });

  // 4. Upload initial extras
  existingExtras.forEach((extra) => {
    batchPromises.push(
      setDoc(doc(db, 'families', familyId, 'extras', extra.id), extra)
    );
  });

  await Promise.all(batchPromises);

  setStoredFamilyId(familyId);
  return {
    id: familyId,
    code,
    name: familyData.name,
    createdAt: familyData.createdAt,
    updatedAt: familyData.updatedAt,
  };
}

export async function joinFamilyByCode(code: string): Promise<FamilyInfo | null> {
  await ensureAuth();
  const cleanCode = code.trim().toUpperCase();
  const q = query(collection(db, 'families'), where('code', '==', cleanCode));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const familyDoc = snapshot.docs[0];
  const data = familyDoc.data();
  const info: FamilyInfo = {
    id: familyDoc.id,
    code: data.code,
    name: data.name,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };

  setStoredFamilyId(info.id);
  return info;
}

export async function getFamilyById(familyId: string): Promise<FamilyInfo | null> {
  await ensureAuth();
  const snap = await getDoc(doc(db, 'families', familyId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    code: data.code,
    name: data.name,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export function subscribeToFamily(
  familyId: string,
  callbacks: {
    onSettingsChange: (settings: AppSettings) => void;
    onRecordsChange: (records: Record<string, LunchRecord>) => void;
    onPaymentsChange: (payments: Record<string, MonthlyPaymentRecord>) => void;
    onExtrasChange: (extras: ExtraPayment[]) => void;
    onError: (err: any) => void;
  }
): () => void {
  const unsubs: Unsubscribe[] = [];

  // 1. Settings listener
  unsubs.push(
    onSnapshot(
      doc(db, 'families', familyId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.settings) {
            callbacks.onSettingsChange(data.settings);
          }
        }
      },
      callbacks.onError
    )
  );

  // 2. Records listener
  unsubs.push(
    onSnapshot(
      collection(db, 'families', familyId, 'records'),
      (snap) => {
        const recordsMap: Record<string, LunchRecord> = {};
        snap.forEach((docSnap) => {
          recordsMap[docSnap.id] = docSnap.data() as LunchRecord;
        });
        callbacks.onRecordsChange(recordsMap);
      },
      callbacks.onError
    )
  );

  // 3. Payments listener
  unsubs.push(
    onSnapshot(
      collection(db, 'families', familyId, 'payments'),
      (snap) => {
        const paymentsMap: Record<string, MonthlyPaymentRecord> = {};
        snap.forEach((docSnap) => {
          paymentsMap[docSnap.id] = docSnap.data() as MonthlyPaymentRecord;
        });
        callbacks.onPaymentsChange(paymentsMap);
      },
      callbacks.onError
    )
  );

  // 4. Extras listener
  unsubs.push(
    onSnapshot(
      collection(db, 'families', familyId, 'extras'),
      (snap) => {
        const list: ExtraPayment[] = [];
        snap.forEach((docSnap) => {
          list.push(docSnap.data() as ExtraPayment);
        });
        callbacks.onExtrasChange(list);
      },
      callbacks.onError
    )
  );

  return () => {
    unsubs.forEach((unsub) => unsub());
  };
}

// Remote Mutations:
export async function syncRecordToCloud(
  familyId: string,
  record: LunchRecord | null,
  dateStr: string
) {
  await ensureAuth();
  const ref = doc(db, 'families', familyId, 'records', dateStr);
  if (!record || record.status === 'unmarked') {
    await deleteDoc(ref);
  } else {
    await setDoc(ref, record);
  }
}

export async function syncPaymentToCloud(
  familyId: string,
  payment: MonthlyPaymentRecord
) {
  await ensureAuth();
  const ref = doc(db, 'families', familyId, 'payments', payment.monthKey);
  await setDoc(ref, payment);
}

export async function syncExtraPaymentToCloud(
  familyId: string,
  extra: ExtraPayment | null,
  id: string
) {
  await ensureAuth();
  const ref = doc(db, 'families', familyId, 'extras', id);
  if (!extra) {
    await deleteDoc(ref);
  } else {
    await setDoc(ref, extra);
  }
}

export async function syncSettingsToCloud(
  familyId: string,
  settings: AppSettings
) {
  await ensureAuth();
  const ref = doc(db, 'families', familyId);
  await setDoc(ref, { settings, updatedAt: new Date().toISOString() }, { merge: true });
}
