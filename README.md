# EcoSphere — ESG Management Platform

Welcome to **EcoSphere**, a comprehensive, real-time ESG (Environmental, Social, and Governance) Management Platform built for the ESG Hackathon.

## Stack Overview

- **Framework**: Next.js 14 App Router
- **Language**: JavaScript (ES2022)
- **Styling**: Tailwind CSS 3.x
- **Database**: SQLite (via Prisma ORM 5.x)
- **Authentication**: JWT stored in httpOnly cookies (using `jose` & `bcryptjs`)
- **Charts**: Recharts
- **Icons**: Lucide React

## Key Features

1. **Dashboard**: High-level overview of ESG metrics, carbon emissions trends, and performance leaderboard.
2. **Environmental Tracking**: Monitor emission factors, manage product ESG profiles, log carbon transactions, and track environmental goals.
3. **Social Metrics**: CSR activities calendar, employee participation approvals, and diversity distributions.
4. **Governance & Compliance**: Manage policy acknowledgements, track audits, and resolve high-severity compliance issues.
5. **Gamification**: Incentivize participation via eco-challenges, badges, points, and rewards redemption.
6. **Report Builder**: Access module reports and compile customized ESG summaries.

## Getting Started

### Prerequisites

Ensure you have Node.js (version 18 or higher) installed.

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Initialize and seed the SQLite database:
   ```bash
   npm run db:reset
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser to access the application.

## Demo Credentials

- **Admin Account**:
  - Email: `admin@ecosphere.io`
  - Password: `Admin@123`
- **Employee Account**:
  - Email: `aditi.rao@ecosphere.io`
  - Password: `Emp@123`
- **R&D Employee Account**:
  - Email: `priya.sharma@ecosphere.io`
  - Password: `Emp@123`
