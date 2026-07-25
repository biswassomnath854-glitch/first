# ApexFinance — Modern Expense Tracker & Budget Manager

ApexFinance is a production-ready, mobile-first FinTech Expense Tracker application built using **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **MySQL**.

---

## 🚀 Key Features

* **Secure Authentication**: Register, Login, and Sign Out pages utilizing NextAuth.js (Credentials Provider) with database-backed hashing.
* **Simulated Password Recovery**: A mock password recovery mechanism that generates unique reset links in development and supports password updates.
* **Interactive Dashboard**:
  * Summary Cards for Net Balance, Monthly Income, Monthly Expenses, and Savings Goal rates.
  * MoM percentage growth indicators.
  * Comparative cashflow line/bar chart utilizing ChartJS.
  * Expense category doughnut breakdown.
  * Real-time feed displaying the 5 most recent transactions.
* **Unified Transactions CRUD**: Search descriptions/categories, filter by type, category, and custom date range, with built-in table pagination.
* **Receipt Upload**: Integrated image file upload mechanism that saves receipts inside `public/uploads` and displays them in a built-in lightbox viewer.
* **Allowance Budgets**: Establish monthly category budget caps. Progress bars color-shift from Green to Amber (at 75%) and Red (over 100%) to indicate spending thresholds.
* **Savings Target Goals**: Define goals with deadline date countdowns. Deposit additions and withdrawal adjustments immediately synchronize with the progress tracker.
* **Statement Statements & Exporting**: Filter datasets and download accounts as CSV spreadsheet, Excel worksheets, or print layout PDF formats.
* **System Settings**: Modify user account name, reset secure password, and upload customized profile images.
* **Platform Admin Dashboard**: Access platform-wide user lists, change roles, promote administrators, and delete member accounts.
* **Theme Customization**: Toggle between sleek dark themes and clean light modes utilizing tailwind classes.

---

## 🛠️ Tech Stack

* **Framework**: Next.js 15 (App Router, Server Actions/Route Handlers)
* **Language**: TypeScript 2
* **Styling**: Tailwind CSS v4
* **ORM**: Prisma ORM (v5.22.0)
* **Database**: MySQL (MariaDB compatible)
* **Auth**: NextAuth.js v4
* **Forms**: React Hook Form + Zod validation resolvers
* **Charts**: Chart.js + React ChartJS 2
* **Spreadsheet Helper**: XLSX
* **Icons**: Lucide React

---

## 📂 Project Architecture

```
prisma/
  ├── schema.prisma   # Database schema models
  └── seed.js         # CommonJS seed script with default data
src/
  ├── app/
  │   ├── api/        # REST Route Handlers (Auth, Admin, Budgets, Stats, etc.)
  │   ├── login/      # Sign-in UI
  │   ├── register/   # Sign-up UI
  │   ├── dashboard/  # Dashboard UI
  │   ├── transactions/ # Transaction CRUD & upload UI
  │   ├── budgets/    # Budget limits UI
  │   ├── goals/      # Goals & deposits UI
  │   ├── reports/    # Reports statement & export UI
  │   ├── profile/    # Settings UI
  │   ├── admin/      # Admin Panel UI
  │   ├── layout.tsx  # Root Layout
  │   ├── page.tsx    # Landing Page
  │   └── providers.tsx # Context Providers (next-themes, next-auth)
  ├── components/     # Reusable layout elements (Sidebar, Charts, ThemeToggle)
  ├── lib/            # Prisma and Auth singleton clients
  └── types/          # Types definitions for NextAuth extension
```

---

## ⚙️ Quick Installation

### Prerequisites
- Node.js (v18+)
- MySQL Server (XAMPP / MariaDB or standalone service)

### 1. Clone & Navigate
Place the source directory in your server environment.

### 2. Install Packages
Install dependencies (incorporate legacy peer dependencies support for React 19):
```bash
npm install
```

### 3. Setup Environment variables
Create a `.env` file in the root directory (refer to `.env.example`):
```env
DATABASE_URL="mysql://root:12345678@localhost:3306/testing_expense_tracker"
NEXTAUTH_SECRET="f657a2dfb704c7d0d0824b2a8db48113bf1e0242858a74e5"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
PORT=3000
NODE_ENV=development
```

### 4. Create Tables & Migrate Database
Apply migrations to automatically create the `testing_expense_tracker` database and database tables:
```bash
npx prisma migrate dev --name init
```

### 5. Seed Core Data
Seed global expense/income categories, demo admin accounts, user accounts, budgets, goals, and synthetic transaction histories:
```bash
npx prisma db seed
```

### 6. Run Project
Launch the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your browser.

---

## 🔑 Demo User Credentials

For immediate exploration, you can log in using these pre-seeded accounts:

### Regular User:
- **Email**: `user@tracker.com`
- **Password**: `user12345`
- **Permissions**: Complete access to Dashboard, Transactions, Budgets, Goals, Reports, Profile.

### Platform Administrator:
- **Email**: `admin@tracker.com`
- **Password**: `admin12345`
- **Permissions**: Access to Platform metrics stats, promotes user accounts, and deletes user accounts.
