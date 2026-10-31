export type EmployeeStatus = 'Active' | 'On Leave' | 'Probation' | 'Terminated'
export type EmployeeLevel = 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Principal'

export interface Employee {
  id: number
  employeeId: string
  name: string
  email: string
  department: string
  title: string
  level: EmployeeLevel
  status: EmployeeStatus
  city: string
  country: string
  salary: number
  bonus: number
  performance: number
  startDate: Date
  lastReview: Date
  remote: boolean
  profileUrl: string
}

export const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Sales',
  'Marketing',
  'Finance',
  'Human Resources',
  'Operations',
  'Customer Support',
  'Legal',
]
export const LEVELS: EmployeeLevel[] = ['Junior', 'Mid', 'Senior', 'Lead', 'Principal']
export const STATUSES: EmployeeStatus[] = ['Active', 'On Leave', 'Probation', 'Terminated']
export const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Germany',
  'France',
  'India',
  'Japan',
  'Australia',
  'Brazil',
  'Netherlands',
  'Spain',
  'Singapore',
]
