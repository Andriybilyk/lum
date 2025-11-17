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
