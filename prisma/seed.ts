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

  await prisma.competency.deleteMany()
  await prisma.goal.deleteMany()
  await prisma.performanceCard.deleteMany()
  await prisma.user.deleteMany()

  const managerPassword = await bcrypt.hash('manager123', 10)
  const employeePassword = await bcrypt.hash('employee123', 10)
  const hrPassword = await bcrypt.hash('hr123', 10)

  await prisma.user.create({
    data: {
      email: 'hr@alamah.com',
      password: hrPassword,
      nameEn: 'Layla Al-Farsi',
      nameAr: 'ليلى الفارسي',
      role: 'HR',
    },
  })

  const manager = await prisma.user.create({
    data: {
      email: 'manager@alamah.com',
      password: managerPassword,
      nameEn: 'Sarah Al-Mansoori',
      nameAr: 'سارة المنصوري',
      role: 'MANAGER',
    },
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
        managerId: manager.id,
      },
    })

    const card = await prisma.performanceCard.create({
      data: {
        employeeId: employee.id,
        managerId: manager.id,
        periodLabel: 'Q1 2025',
        status: 'DRAFT',
      },
    })

    await prisma.goal.createMany({
      data: [
        { cardId: card.id, titleEn: 'Deliver Project Milestones', titleAr: 'تحقيق معالم المشروع', weight: 40 },
        { cardId: card.id, titleEn: 'Improve Customer Satisfaction', titleAr: 'تحسين رضا العملاء', weight: 35 },
        { cardId: card.id, titleEn: 'Complete Required Training', titleAr: 'إتمام التدريب المطلوب', weight: 25 },
      ],
    })

    await prisma.competency.createMany({
      data: [
        { cardId: card.id, titleEn: 'Communication Skills', titleAr: 'مهارات التواصل', weight: 35 },
        { cardId: card.id, titleEn: 'Teamwork & Collaboration', titleAr: 'العمل الجماعي والتعاون', weight: 35 },
        { cardId: card.id, titleEn: 'Problem Solving', titleAr: 'حل المشكلات', weight: 30 },
      ],
    })
  }

  console.log('\nSeed complete!')
  console.log('  hr@alamah.com       / hr123')
  console.log('  manager@alamah.com  / manager123')
  console.log('  ahmed@alamah.com    / employee123')
  console.log('  fatima@alamah.com   / employee123')
  console.log('  khalid@alamah.com   / employee123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })
