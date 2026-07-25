const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clear existing data in reverse order of dependencies
  await prisma.savingGoal.deleteMany({});
  await prisma.budget.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.income.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Cleared existing data.');

  // 2. Create Users
  const adminPasswordHash = await bcrypt.hash('admin12345', 10);
  const userPasswordHash = await bcrypt.hash('user12345', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'System Administrator',
      email: 'admin@tracker.com',
      password: adminPasswordHash,
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'user@tracker.com',
      password: userPasswordHash,
      role: 'USER',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    },
  });

  console.log('Created Users:', { adminUser: adminUser.email, regularUser: regularUser.email });

  // 3. Create Categories
  const expenseCategoriesData = [
    { name: 'Food', icon: 'Utensils', color: '#f97316' },
    { name: 'Rent', icon: 'Home', color: '#3b82f6' },
    { name: 'Utilities', icon: 'Zap', color: '#eab308' },
    { name: 'Shopping', icon: 'ShoppingBag', color: '#ec4899' },
    { name: 'Transportation', icon: 'Car', color: '#06b6d4' },
    { name: 'Entertainment', icon: 'Film', color: '#8b5cf6' },
    { name: 'Healthcare', icon: 'HeartPulse', color: '#ef4444' },
    { name: 'Education', icon: 'GraduationCap', color: '#64748b' },
    { name: 'Others', icon: 'PlusCircle', color: '#6b7280' },
  ];

  const incomeCategoriesData = [
    { name: 'Salary', icon: 'Briefcase', color: '#10b981' },
    { name: 'Freelance', icon: 'Globe', color: '#14b8a6' },
    { name: 'Investments', icon: 'TrendingUp', color: '#0ea5e9' },
    { name: 'Gifts', icon: 'Gift', color: '#f43f5e' },
    { name: 'Others', icon: 'PlusCircle', color: '#6b7280' },
  ];

  const categories = {};

  for (const cat of expenseCategoriesData) {
    const created = await prisma.category.create({
      data: {
        name: cat.name,
        type: 'EXPENSE',
        icon: cat.icon,
        color: cat.color,
      },
    });
    categories[`EXPENSE:${cat.name}`] = created.id;
  }

  for (const cat of incomeCategoriesData) {
    const created = await prisma.category.create({
      data: {
        name: cat.name,
        type: 'INCOME',
        icon: cat.icon,
        color: cat.color,
      },
    });
    categories[`INCOME:${cat.name}`] = created.id;
  }

  console.log('Created global categories.');

  // 4. Seed Data for Regular User
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Dates for current month
  const dateStr = (day) => new Date(currentYear, currentMonth, day);
  // Dates for previous month
  const prevDateStr = (day) => {
    let m = currentMonth - 1;
    let y = currentYear;
    if (m < 0) {
      m = 11;
      y = y - 1;
    }
    return new Date(y, m, day);
  };

  // Seed Incomes
  await prisma.income.createMany({
    data: [
      {
        amount: 5000,
        categoryId: categories['INCOME:Salary'],
        date: dateStr(1),
        description: 'Monthly Corporate Salary',
        userId: regularUser.id,
      },
      {
        amount: 850,
        categoryId: categories['INCOME:Freelance'],
        date: dateStr(15),
        description: 'Web development consulting project',
        userId: regularUser.id,
      },
      {
        amount: 5000,
        categoryId: categories['INCOME:Salary'],
        date: prevDateStr(1),
        description: 'Monthly Corporate Salary',
        userId: regularUser.id,
      },
      {
        amount: 400,
        categoryId: categories['INCOME:Investments'],
        date: prevDateStr(20),
        description: 'Stock Dividends',
        userId: regularUser.id,
      },
    ],
  });

  // Seed Expenses
  await prisma.expense.createMany({
    data: [
      // Current Month
      {
        amount: 1200,
        categoryId: categories['EXPENSE:Rent'],
        date: dateStr(2),
        description: 'Apartment Rent payment',
        userId: regularUser.id,
      },
      {
        amount: 145.5,
        categoryId: categories['EXPENSE:Food'],
        date: dateStr(3),
        description: 'Weekly grocery shopping at Whole Foods',
        userId: regularUser.id,
      },
      {
        amount: 55.2,
        categoryId: categories['EXPENSE:Food'],
        date: dateStr(7),
        description: 'Dinner with friends',
        userId: regularUser.id,
      },
      {
        amount: 180,
        categoryId: categories['EXPENSE:Utilities'],
        date: dateStr(5),
        description: 'Electricity & Internet bills',
        userId: regularUser.id,
      },
      {
        amount: 320,
        categoryId: categories['EXPENSE:Shopping'],
        date: dateStr(8),
        description: 'New winter jacket and boots',
        userId: regularUser.id,
      },
      {
        amount: 45,
        categoryId: categories['EXPENSE:Transportation'],
        date: dateStr(4),
        description: 'Gas refill',
        userId: regularUser.id,
      },
      {
        amount: 120,
        categoryId: categories['EXPENSE:Entertainment'],
        date: dateStr(6),
        description: 'Concert tickets',
        userId: regularUser.id,
      },
      {
        amount: 30,
        categoryId: categories['EXPENSE:Others'],
        date: dateStr(10),
        description: 'Laundry services',
        userId: regularUser.id,
      },
      
      // Previous Month
      {
        amount: 1200,
        categoryId: categories['EXPENSE:Rent'],
        date: prevDateStr(2),
        description: 'Apartment Rent payment',
        userId: regularUser.id,
      },
      {
        amount: 130,
        categoryId: categories['EXPENSE:Food'],
        date: prevDateStr(4),
        description: 'Weekly groceries',
        userId: regularUser.id,
      },
      {
        amount: 210,
        categoryId: categories['EXPENSE:Utilities'],
        date: prevDateStr(5),
        description: 'Electricity, gas & internet',
        userId: regularUser.id,
      },
      {
        amount: 450,
        categoryId: categories['EXPENSE:Shopping'],
        date: prevDateStr(10),
        description: 'Electronics purchase',
        userId: regularUser.id,
      },
      {
        amount: 60,
        categoryId: categories['EXPENSE:Transportation'],
        date: prevDateStr(12),
        description: 'Train pass',
        userId: regularUser.id,
      },
      {
        amount: 90,
        categoryId: categories['EXPENSE:Entertainment'],
        date: prevDateStr(18),
        description: 'Movies and dining out',
        userId: regularUser.id,
      },
    ],
  });

  console.log('Seeded transactions.');

  // Seed Budgets (Current Month)
  await prisma.budget.createMany({
    data: [
      {
        limit: 400,
        categoryId: categories['EXPENSE:Food'],
        month: new Date(currentYear, currentMonth, 1),
        userId: regularUser.id,
      },
      {
        limit: 500,
        categoryId: categories['EXPENSE:Shopping'],
        month: new Date(currentYear, currentMonth, 1),
        userId: regularUser.id,
      },
      {
        limit: 1200,
        categoryId: categories['EXPENSE:Rent'],
        month: new Date(currentYear, currentMonth, 1),
        userId: regularUser.id,
      },
      {
        limit: 250,
        categoryId: categories['EXPENSE:Utilities'],
        month: new Date(currentYear, currentMonth, 1),
        userId: regularUser.id,
      },
      {
        limit: 150,
        categoryId: categories['EXPENSE:Transportation'],
        month: new Date(currentYear, currentMonth, 1),
        userId: regularUser.id,
      },
    ],
  });

  console.log('Seeded budgets.');

  // Seed Saving Goals
  await prisma.savingGoal.createMany({
    data: [
      {
        name: 'Emergency Fund',
        targetAmount: 10000,
        currentAmount: 3500,
        deadline: new Date(currentYear + 1, currentMonth, 1),
        userId: regularUser.id,
      },
      {
        name: 'New Laptop',
        targetAmount: 2000,
        currentAmount: 1200,
        deadline: new Date(currentYear, currentMonth + 3, 15),
        userId: regularUser.id,
      },
      {
        name: 'Trip to Europe',
        targetAmount: 5000,
        currentAmount: 1500,
        deadline: new Date(currentYear, currentMonth + 8, 1),
        userId: regularUser.id,
      },
    ],
  });

  console.log('Seeded saving goals.');
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
