import { PrismaClient } from '../lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Clean up in dependency order
  await prisma.auditLog.deleteMany()
  await prisma.competency.deleteMany()
  await prisma.goal.deleteMany()
  await prisma.performanceCard.deleteMany()
  await prisma.department.deleteMany()
  await prisma.user.deleteMany()

  const superAdminPassword = await bcrypt.hash('admin123', 12)
  const managerPassword = await bcrypt.hash('manager123', 12)
  const employeePassword = await bcrypt.hash('employee123', 12)

  // Create super admin (no department)
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@alamah.com',
      password: superAdminPassword,
      nameEn: 'Super Admin',
      nameAr: 'المدير العام',
      role: 'SUPER_ADMIN',
    },
  })

  // Create department (without manager first so we can create the manager user next)
  const dept = await prisma.department.create({
    data: {
      nameEn: 'Engineering',
      nameAr: 'الهندسة',
      code: 'ENG',
    },
  })

  // Create manager in the department
  const manager = await prisma.user.create({
    data: {
      email: 'manager@alamah.com',
      password: managerPassword,
      nameEn: 'Sarah Al-Mansoori',
      nameAr: 'سارة المنصوري',
      role: 'DEPARTMENT_MANAGER',
      departmentId: dept.id,
    },
  })

  // Assign manager to department
  await prisma.department.update({
    where: { id: dept.id },
    data: { managerId: manager.id },
  })

  const employeeData = [
    { email: 'ahmed@alamah.com', nameEn: 'Ahmed Al-Rashidi', nameAr: 'أحمد الراشدي' },
    { email: 'fatima@alamah.com', nameEn: 'Fatima Al-Zaabi', nameAr: 'فاطمة الزعابي' },
    { email: 'khalid@alamah.com', nameEn: 'Khalid Al-Hamdi', nameAr: 'خالد الحمدي' },
  ]

  for (const emp of employeeData) {
    const employee = await prisma.user.create({
      data: {
        email: emp.email,
        password: employeePassword,
        nameEn: emp.nameEn,
        nameAr: emp.nameAr,
        role: 'EMPLOYEE',
        departmentId: dept.id,
        managerId: manager.id,
      },
    })

    const card = await prisma.performanceCard.create({
      data: {
        employeeId: employee.id,
        managerId: manager.id,
        departmentId: dept.id,
        periodLabel: 'Q1 2025',
        status: 'GOAL_SETTING',
      },
    })

    await prisma.goal.createMany({
      data: [
        {
          cardId: card.id,
          titleEn: 'Deliver Project Milestones',
          titleAr: 'تحقيق معالم المشروع',
          weight: 40,
          createdById: manager.id,
          type: 'DEPARTMENT',
          goalStatus: 'APPROVED',
          approvedByManager: true,
          approvalDate: new Date(),
          departmentId: dept.id,
        },
        {
          cardId: card.id,
          titleEn: 'Improve Customer Satisfaction',
          titleAr: 'تحسين رضا العملاء',
          weight: 35,
          createdById: manager.id,
          type: 'DEPARTMENT',
          goalStatus: 'APPROVED',
          approvedByManager: true,
          approvalDate: new Date(),
          departmentId: dept.id,
        },
        {
          cardId: card.id,
          titleEn: 'Complete Required Training',
          titleAr: 'إتمام التدريب المطلوب',
          weight: 25,
          createdById: manager.id,
          type: 'PERSONAL',
          goalStatus: 'APPROVED',
          approvedByManager: true,
          approvalDate: new Date(),
          assignedToId: employee.id,
        },
      ],
    })

    await prisma.competency.createMany({
      data: [
        { cardId: card.id, titleEn: 'Communication Skills', titleAr: 'مهارات التواصل', weight: 35 },
        { cardId: card.id, titleEn: 'Teamwork & Collaboration', titleAr: 'العمل الجماعي والتعاون', weight: 35 },
        { cardId: card.id, titleEn: 'Problem Solving', titleAr: 'حل المشكلات', weight: 30 },
      ],
    })

    await prisma.auditLog.create({
      data: {
        action: 'CARD_CREATED',
        userId: superAdmin.id,
        cardId: card.id,
        metadata: { seeded: true, employeeId: employee.id },
      },
    })
  }

  console.log('\nSeed complete!')
  console.log('  superadmin@alamah.com / admin123    (SUPER_ADMIN)')
  console.log('  manager@alamah.com    / manager123  (DEPARTMENT_MANAGER)')
  console.log('  ahmed@alamah.com      / employee123 (EMPLOYEE)')
  console.log('  fatima@alamah.com     / employee123 (EMPLOYEE)')
  console.log('  khalid@alamah.com     / employee123 (EMPLOYEE)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
