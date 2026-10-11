export type DayStatus = 'eaten' | 'canceled' | 'missed' | 'holiday' | 'unmarked';

export interface LunchRecord {
  date: string; // 'YYYY-MM-DD'
  status: DayStatus;
  note?: string;
  updatedAt?: number;
}

export interface MonthlyPaymentRecord {
  id: string; // 'YYYY-MM'
  monthKey: string; // 'YYYY-MM'
  label: string; // e.g. "Září 2026"
  plannedAmount: number;
  paid: boolean;
  actualAmount: number;
  paidDate?: string;
  note?: string;
}

export interface ExtraPayment {
  id: string;
  date: string; // 'YYYY-MM-DD'
  amount: number; // positive for extra deposit, negative for refund
  note: string;
  type: 'deposit' | 'refund';
}

export interface ChildProfile {
  name: string;
  schoolName: string;
  grade: string;
  canteenAccount: string;
  symbol: string; // Variabilní symbol
}

export interface AppSettings {
  child: ChildProfile;
  pricePerLunch: number; // Kč
  monthlyPayment: number; // Kč trvalý příkaz
  schoolYear: string; // e.g. "2026/2027"
  schoolYearStartYear: number; // 2026
  initialBalance: number; // Přeplatek / nedoplatek z minulého roku (Kč)
  paymentDayOfMonth: number; // den v měsíci kdy odchází trvalý příkaz (např. 15)
  defaultMealName: string;
}

export interface DayInfo {
  dateStr: string; // 'YYYY-MM-DD'
  date: Date;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ...
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isSchoolDay: boolean;
}

export interface MonthSummary {
  monthKey: string; // 'YYYY-MM'
  monthName: string; // e.g. "Říjen 2026"
  monthIndex: number; // 0-11
  year: number;
  totalSchoolDays: number;
  eatenCount: number;
  canceledCount: number;
  missedCount: number;
  unmarkedPastCount: number;
  holidayCount: number;
  costEaten: number;
  costMissed: number;
  totalCost: number; // costEaten + costMissed (neodhlášené se účtují)
  paidAmount: number;
  difference: number; // paidAmount - totalCost
}

export interface OverallSettlement {
  totalSchoolDaysSoFar: number;
  eatenCount: number;
  canceledCount: number;
  missedCount: number;
  unmarkedPastCount: number;
  futureSchoolDaysCount: number;

  totalSpentOnLunches: number; // (eaten + missed) * price
  totalSavedByCancelation: number; // canceled * price
  totalPaidSoFar: number; // suma potvrzených plateb + počáteční stav + mimořádné
  
  currentBalance: number; // totalPaidSoFar - totalSpentOnLunches
  // > 0 = přeplatek (škola vrátí), < 0 = nedoplatek (bude třeba doplatit)

  // Projected at end of June:
  projectedTotalPayments: number;
  projectedRemainingSchoolDays: number;
  projectedTotalYearCostIfNormal: number; // assuming future days are eaten
  projectedEndYearBalance: number;
}
