# EcoSphere ESG Platform — Demo Walkthrough Script

This script provides step-by-step instructions to verify the key business flows, rules, and modules of the **EcoSphere** ESG Management Platform.

---

## 🔑 Demo Credentials

- **Admin Account**: `admin@ecosphere.io` / `Admin@123`
- **Employee Account**: `aditi.rao@ecosphere.io` / `Emp@123`

---

## 🎬 Step-by-Step Verification Flows

### 1. Database Setup & Initial Seeding
1. Stop any running servers.
2. In your terminal, run the database reset and seeding script:
   ```bash
   npm run db:reset
   ```
3. Verify that the database is pushed, seeded with the mock data, and completes without errors.

---

### 2. Executive Dashboard (Mockup Screen 1)
1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open `http://localhost:3000` and click the **Admin Account** preset login button.
3. Verify the KPI tiles show the targeted scores:
   - **Environmental:** 82
   - **Social:** 74
   - **Governance:** 88
   - **Overall ESG:** 81
4. Click the **Recompute Scores** button in the top right. Verify that the recompute animation plays, a success toast triggers, and the scores refresh.
5. Log out using the logout icon in the bottom left user panel.

---

### 3. ESG Rules & Weights Configuration
1. Log in as **Admin**.
2. Navigate to **Settings** -> **ESG Configuration** in the sidebar.
3. Adjust the weights under **ESG Score Weights**:
   - Change weights to Env=40, Social=35, Gov=25. The live weight total indicator should show `100% (Valid)`.
   - Change Environmental weight to 45. The live total should show `105% (Must total 100%)` in red, and the **Save Configuration** button will be disabled.
   - Revert weights to Env=40, Social=30, Gov=30 and click **Save Configuration**. Verify the success toast.
4. Try toggling **Enable automatic emission calculation** to OFF and save.

---

### 4. Environmental Operations & Carbon Calculations
1. Under **Environmental**, navigate to **Carbon Transactions**.
2. If automatic calculation is OFF:
   - Add a new manufacturing operation (e.g. 100 Litres of Diesel).
   - In the operation log table, verify it is marked as **PENDING** with no CO₂ amount transaction.
   - Click the manual **Convert** action button. Verify it atomically logs a Carbon Transaction of **268 kg CO₂** (using the factor 2.68 kg/L).
3. Navigate to **Settings** -> **ESG Configuration** and turn **Enable automatic emission calculation** to ON.
4. Go back to **Carbon Transactions** and log another 100 L Diesel manufacturing operation. Verify that a Carbon Transaction of **268 kg CO₂** is auto-created immediately.

---

### 5. CSR Activity Approvals & Evidence Rules
1. Log out as Admin and log in as **Employee** (Aditi Rao).
2. Go to **Social** -> **CSR Activities**.
3. Click **Join** on an active activity (e.g. Tree Planting). Verify that the button changes to `Joined ✓`.
4. Go to **Employee Participation** under Social.
5. Since **Require evidence for all CSR activities** is enabled globally, try clicking Submit without adding a proof URL. Verify that it asks for proof.
6. Paste a mockup image URL or text in the proof field and submit.
7. Log out, log back in as **Admin**.
8. Navigate to **Social** -> **Employee Participation**.
9. Locate Aditi's participation record in the review queue.
10. Click **Approve**. Verify that:
    - Aditi is credited with points/XP atomically.
    - Aditi receives a notification (bell icon count increases).
    - An activity log is written to the dashboard feed.

---

### 6. Governance Policies & Compliance Issues
1. Log in as **Employee** (Aditi Rao).
2. Navigate to **Governance** -> **Policies**.
3. Select a policy (e.g. Environmental Code of Conduct) and click **Acknowledge**. Verify it updates to `Acknowledged ✓`.
4. Log out and log back in as **Admin**.
5. Go to **Governance** -> **Policies**. Inspect the acknowledgement progress bar and pending users list.
6. Click **Send Reminder**. Verify that compliance notifications are sent to pending users.
7. Go to **Governance** -> **Compliance Issues**.
8. Create a new issue. Leaving the owner or due date blank must trigger a validation warning and prevent creation.
9. Assign the issue to an owner, set a past due date, and save.
10. Verify that it displays an **OVERDUE** flag badge next to the status.

---

### 7. Gamification Challenges & Rewards
1. Navigate to **Gamification** -> **Challenges**.
2. Verify that challenges can advance from **Draft** -> **Active** -> **Under Review** -> **Completed**.
3. Attempting to jump directly from **Draft** to **Completed** will be blocked.
4. Go to **Gamification** -> **Leaderboard**. Check the interleaved Employees and Departments rankings.
5. Go to **Gamification** -> **Rewards**.
6. Select a reward. Redeeming a reward that costs more than your spendable points will be blocked with a points balance alert toast.
7. Redeeming a valid reward deducts points from the balance and reduces the item's stock count atomically.

---

### 8. Report Generation
1. Navigate to **Reports** in the sidebar.
2. Select **Environmental Report**, **Social Report**, or **Governance Report**.
3. Click the export buttons (**PDF**, **Excel**, **CSV**) or the **Print** icon. Verify the file downloads and prints successfully.
