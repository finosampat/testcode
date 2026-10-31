import { faker } from '@faker-js/faker'

import {
  COUNTRIES,
  DEPARTMENTS,
  type Employee,
  type EmployeeLevel,
} from './employeeTypes'

export * from './employeeTypes'

const LEVEL_BASE: Record<EmployeeLevel, number> = { Junior: 55_000, Mid: 80_000, Senior: 115_000, Lead: 145_000, Principal: 185_000 }

export function generateEmployees(count: number, seed = 42): Employee[] {
  faker.seed(seed)
  const now = new Date()
  const rows: Employee[] = new Array(count)
  for (let i = 0; i < count; i++) {
    const first = faker.person.firstName()
    const last = faker.person.lastName()
    const level = faker.helpers.weightedArrayElement([
      { weight: 25, value: 'Junior' as const },
      { weight: 35, value: 'Mid' as const },
      { weight: 25, value: 'Senior' as const },
      { weight: 10, value: 'Lead' as const },
      { weight: 5, value: 'Principal' as const },
    ])
    const status = faker.helpers.weightedArrayElement([
      { weight: 78, value: 'Active' as const },
      { weight: 8, value: 'On Leave' as const },
      { weight: 9, value: 'Probation' as const },
      { weight: 5, value: 'Terminated' as const },
    ])
    const startDate = faker.date.past({ years: 12, refDate: now })
    startDate.setHours(0, 0, 0, 0)
    const lastReview = faker.date.between({ from: startDate, to: now })
    lastReview.setHours(0, 0, 0, 0)
    const salary = Math.round((LEVEL_BASE[level] * faker.number.float({ min: 0.85, max: 1.3 })) / 100) * 100
    const handle = `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, '')
    rows[i] = {
      id: i + 1,
      employeeId: `EMP-${String(i + 1).padStart(6, '0')}`,
      name: `${first} ${last}`,
      email: `${handle}${i}@example.com`,
      department: faker.helpers.arrayElement(DEPARTMENTS),
      title: faker.person.jobTitle(),
      level,
      status,
      city: faker.location.city(),
      country: faker.helpers.arrayElement(COUNTRIES),
      salary,
      bonus: Math.round(salary * faker.number.float({ min: 0, max: 0.2 })),
      performance: faker.number.int({ min: 5, max: 100 }),
      startDate,
      lastReview,
      remote: faker.datatype.boolean({ probability: 0.35 }),
      profileUrl: `https://example.com/people/${handle}`,
    }
  }
  return rows
}
