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

1. **Executive Dashboard**: Live KPI tiles (82 / 74 / 88 / 81 with seeded data), 12-month emissions trend chart, department ESG ranking bar chart, activity feed with type icons, quick actions, and an admin "Recompute Scores" button.
2. **Scoring Engine** (`lib/scoring.js`): Auto-computed per-department ESG scores, persisted as `DepartmentScore` rows. Trend arrows compare current vs. previous period.
3. **Environmental Tracking**: Monitor emission factors, manage product ESG profiles, log carbon transactions, and track environmental goals.
4. **Social Metrics**: CSR activities calendar, employee participation approvals, and diversity distributions.
5. **Governance & Compliance**: Manage policy acknowledgements, track audits, and resolve high-severity compliance issues.
6. **Gamification**: Incentivize participation via eco-challenges, badges, points, and rewards redemption.
7. **Report Builder**: Access module reports and compile customized ESG summaries.

## Scoring Engine Formulas (`lib/scoring.js`)

All scores are 0–100. Departments with no data in a sub-component default to **70** (neutral).

### Environmental Score
```
E = 0.6 × avgGoalProgress + 0.4 × emissionTrendScore

avgGoalProgress  = mean of min(100, currentCO2/targetCO2 × 100) across dept goals
emissionTrendScore = clamp(100 × threeMonthAvgCO2 / max(currentMonthCO2,1), 0, 100)
```

### Social Score
```
S = 0.6 × participationRate + 0.4 × trainingCompletion

participationRate  = min(100, approvedParticipations(dept, last 90d) / deptEmployees × 100)
trainingCompletion = min(100, approvedTrainingParts(dept) / deptEmployees × 100)
```

### Governance Score
```
G = 0.4 × policyAckRate + 0.3 × auditCompletionRate + 0.3 × issueResolutionScore

policyAckRate       = min(100, acks / (deptEmployees × activePolicies) × 100)
auditCompletionRate = completedAudits / totalAudits × 100
issueResolutionScore = max(0, resolved/totalIssues × 100 − 10 × overdueOpen)
```

### Overall ESG Score
```
DeptTotal = (wEnv × E + wSoc × S + wGov × G) / 100   [weights from OrgSettings, default 40/30/30]
Overall   = round(mean of all DeptTotals)
```

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
