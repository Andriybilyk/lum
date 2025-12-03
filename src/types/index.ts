export interface User {
  id: string;
  name: string;
  role: 'employee' | 'manager';
  level: string;
  hourlyRate: number;
  managerId?: string;
  telegramId?: string;
}

export interface Hours {
  id: string;
  userId: string;
  date: string;
  hours: number;
  object: string;
  isBusinessTrip: boolean;
  salary: number;
}

export interface Process {
  id: string;
  userId: string;
  date: string;
  processName: string;
  object?: string;
  volume: number;
  unit: string;
  rate: number;
  salary: number;
  photoBefore?: string;    // URL фото перед початком роботи
  photoDuring?: string;    // URL фото під час виконання
  photoAfter?: string;     // URL фото після завершення
  photosUploadedAt?: string; // Час останнього оновлення фото
}

export interface Assignment {
  id: string;
  employeeId: string;
  managerId: string;
  date: string;
  description: string;
  notes: string;
  status: 'pending' | 'confirmed' | 'declined' | 'employee_confirmed' | 'manager_confirmed';
}

export interface Level {
  id: string;
  name: string;
  hourlyRate: number;
}

export interface ObjectType {
  id: string;
  name: string;
  isBusinessTrip?: boolean;
  maxHours?: number;
  address?: string;
  managerId?: string;
  startDate?: string;
  endDate?: string;
  plannedBudget?: number;
  actualBudget?: number;
  materialsCost?: number;
}

export interface ProcessType {
  id: string;
  name: string;
  object?: string;
  rate: number;
  unit: string;
  plannedVolume?: number;
}

export interface EditHourData {
  date: string;
  hours: number;
  object: string;
  isBusinessTrip: boolean;
}

export interface EditProcessData {
  date: string;
  processName: string;
  object?: string;
  volume: number;
  unit: string;
  rate: number;
}

export interface EmployeeStats {
  totalHours: number;
  totalEarnings: number;
}

export interface TeamReport {
  employeeId: string;
  name: string;
  hours: number;
  earnings: number;
}

export interface AdditionalWork {
  id: string;
  userId: string;
  managerId: string;
  objectName: string;
  date: string;
  workName: string;
  description: string;
  unit: string;
  volume: number;
  rate: number;
  salary: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id: string;
  userId: string;
  date: string;
  object: string;
  materialName: string;
  quantity: number;
  unit: string;
  price?: number;          // Ціна за одиницю (опціонально)
  totalCost?: number;      // Загальна вартість (quantity × price, автоматично)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeReport {
  hours: Array<{
    id: string;
    date: string;
    object: string;
    hours: number;
    businessTrip: boolean;
    earnings: number;
  }>;
  processes: Array<{
    id: string;
    date: string;
    name: string;
    object: string;
    volume: number;
    unit: string;
    rate: number;
    earnings: number;
  }>;
  materials: Array<{
    id: string;
    date: string;
    object: string;
    materialName: string;
    quantity: number;
    unit: string;
    notes?: string;
  }>;
  totalHours: number;
  totalEarnings: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface WorkPhoto {
  id: string;
  userId: string;
  object: string;
  date: string;
  photoUrl: string;
  description?: string;
  photoType: 'general' | 'progress' | 'issue' | 'completion';
  createdAt: string;
  updatedAt: string;
}
