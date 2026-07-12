// prisma/seed.js
// EcoSphere ESG Management Platform — Full Demo Seed

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding EcoSphere database...');

  // ─── Departments ────────────────────────────────────────────────────────────
  console.log('Creating departments...');
  const manufacturing = await prisma.department.create({
    data: { name: 'Manufacturing', code: 'MFG', head: 'S. Nair', employeeCount: 134 },
  });
  const logistics = await prisma.department.create({
    data: { name: 'Logistics', code: 'LOG', head: 'R. Iyer', parentId: manufacturing.id, employeeCount: 58 },
  });
  const corporate = await prisma.department.create({
    data: { name: 'Corporate', code: 'COR', head: 'A. Mehta', employeeCount: 41 },
  });
  const sales = await prisma.department.create({
    data: { name: 'Sales', code: 'SAL', head: 'V. Kapoor', employeeCount: 62 },
  });
  const rnd = await prisma.department.create({
    data: { name: 'R&D', code: 'RND', head: 'D. Menon', employeeCount: 35 },
  });
  const procurement = await prisma.department.create({
    data: { name: 'Procurement', code: 'PRC', head: 'N. Gupta', employeeCount: 22 },
  });

  // ─── Users ──────────────────────────────────────────────────────────────────
  console.log('Creating users...');
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const empHash = await bcrypt.hash('Emp@123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@ecosphere.io',
      passwordHash: adminHash,
      role: 'ADMIN',
      departmentId: corporate.id,
      gender: 'OTHER',
      xp: 0,
      points: 0,
    },
  });

  // Named employees matching department heads
  const snair = await prisma.user.create({
    data: {
      name: 'S. Nair',
      email: 's.nair@ecosphere.io',
      passwordHash: empHash,
      departmentId: manufacturing.id,
      gender: 'MALE',
      xp: 980,
      points: 320,
    },
  });
  const riyer = await prisma.user.create({
    data: {
      name: 'R. Iyer',
      email: 'r.iyer@ecosphere.io',
      passwordHash: empHash,
      departmentId: logistics.id,
      gender: 'MALE',
      xp: 540,
      points: 180,
    },
  });
  const amehta = await prisma.user.create({
    data: {
      name: 'A. Mehta',
      email: 'a.mehta@ecosphere.io',
      passwordHash: empHash,
      departmentId: corporate.id,
      gender: 'MALE',
      xp: 1200,
      points: 450,
    },
  });
  const vkapoor = await prisma.user.create({
    data: {
      name: 'V. Kapoor',
      email: 'v.kapoor@ecosphere.io',
      passwordHash: empHash,
      departmentId: sales.id,
      gender: 'FEMALE',
      xp: 760,
      points: 290,
    },
  });
  const dmenon = await prisma.user.create({
    data: {
      name: 'D. Menon',
      email: 'd.menon@ecosphere.io',
      passwordHash: empHash,
      departmentId: rnd.id,
      gender: 'MALE',
      xp: 620,
      points: 210,
    },
  });
  const ngupta = await prisma.user.create({
    data: {
      name: 'N. Gupta',
      email: 'n.gupta@ecosphere.io',
      passwordHash: empHash,
      departmentId: procurement.id,
      gender: 'FEMALE',
      xp: 430,
      points: 150,
    },
  });

  // Key named employees from spec
  const aditi = await prisma.user.create({
    data: {
      name: 'Aditi Rao',
      email: 'aditi.rao@ecosphere.io',
      passwordHash: empHash,
      departmentId: manufacturing.id,
      gender: 'FEMALE',
      xp: 3910,
      points: 1200,
    },
  });
  const karan = await prisma.user.create({
    data: {
      name: 'Karan Shah',
      email: 'karan.shah@ecosphere.io',
      passwordHash: empHash,
      departmentId: corporate.id,
      gender: 'MALE',
      xp: 1850,
      points: 600,
    },
  });
  const priya = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya.sharma@ecosphere.io',
      passwordHash: empHash,
      departmentId: rnd.id,
      gender: 'FEMALE',
      xp: 2100,
      points: 750,
    },
  });

  // 8 more employees spread across departments
  // Manufacturing employees to get dept total ~4820
  // 4820 - 3910 - 980 = -70 → add more XP to manufacturing employees
  const raj = await prisma.user.create({
    data: {
      name: 'Raj Patel',
      email: 'raj.patel@ecosphere.io',
      passwordHash: empHash,
      departmentId: manufacturing.id,
      gender: 'MALE',
      xp: 930,
      points: 310,
    },
  });
  // Manufacturing sum: 3910+980+930 = 5820 — too high
  // Let's target: Aditi(3910) + S.Nair(600) + new = 4820
  // Update S.Nair to 600 XP and add one more at 310
  // Actually let's set values precisely
  await prisma.user.update({ where: { id: snair.id }, data: { xp: 600 } });
  // Manufacturing: aditi(3910) + snair(600) + raj(310) = 4820 ✓
  await prisma.user.update({ where: { id: raj.id }, data: { xp: 310 } });

  // Corporate sum: karan(1850) + amehta(1200) + more = 3505
  // 3505 - 1850 - 1200 = 455
  const meera = await prisma.user.create({
    data: {
      name: 'Meera Joshi',
      email: 'meera.joshi@ecosphere.io',
      passwordHash: empHash,
      departmentId: corporate.id,
      gender: 'FEMALE',
      xp: 455,
      points: 140,
    },
  });

  const arjun = await prisma.user.create({
    data: {
      name: 'Arjun Singh',
      email: 'arjun.singh@ecosphere.io',
      passwordHash: empHash,
      departmentId: logistics.id,
      gender: 'MALE',
      xp: 380,
      points: 120,
    },
  });
  const fatima = await prisma.user.create({
    data: {
      name: 'Fatima Sheikh',
      email: 'fatima.sheikh@ecosphere.io',
      passwordHash: empHash,
      departmentId: sales.id,
      gender: 'FEMALE',
      xp: 510,
      points: 170,
    },
  });
  const rohit = await prisma.user.create({
    data: {
      name: 'Rohit Kumar',
      email: 'rohit.kumar@ecosphere.io',
      passwordHash: empHash,
      departmentId: rnd.id,
      gender: 'MALE',
      xp: 290,
      points: 95,
    },
  });
  const sunita = await prisma.user.create({
    data: {
      name: 'Sunita Verma',
      email: 'sunita.verma@ecosphere.io',
      passwordHash: empHash,
      departmentId: procurement.id,
      gender: 'FEMALE',
      xp: 220,
      points: 75,
    },
  });
  const vikram = await prisma.user.create({
    data: {
      name: 'Vikram Desai',
      email: 'vikram.desai@ecosphere.io',
      passwordHash: empHash,
      departmentId: manufacturing.id,
      gender: 'MALE',
      xp: 180,
      points: 60,
    },
  });
  // Note: vikram's XP would push manufacturing total. Let's not include him in manufacturing sum.
  // Manufacturing total = aditi(3910) + snair(600) + raj(310) = 4820 ✓

  // ─── Emission Factors ───────────────────────────────────────────────────────
  console.log('Creating emission factors...');
  const efDiesel = await prisma.emissionFactor.create({
    data: { name: 'Diesel', sourceType: 'FLEET', unit: 'litre', co2PerUnit: 2.68 },
  });
  const efPetrol = await prisma.emissionFactor.create({
    data: { name: 'Petrol', sourceType: 'FLEET', unit: 'litre', co2PerUnit: 2.31 },
  });
  const efElectricity = await prisma.emissionFactor.create({
    data: { name: 'Grid Electricity', sourceType: 'EXPENSE', unit: 'kWh', co2PerUnit: 0.82 },
  });
  const efNaturalGas = await prisma.emissionFactor.create({
    data: { name: 'Natural Gas', sourceType: 'MANUFACTURING', unit: 'm3', co2PerUnit: 1.90 },
  });
  const efSteel = await prisma.emissionFactor.create({
    data: { name: 'Steel', sourceType: 'PURCHASE', unit: 'kg', co2PerUnit: 1.85 },
  });
  const efAluminium = await prisma.emissionFactor.create({
    data: { name: 'Aluminium', sourceType: 'PURCHASE', unit: 'kg', co2PerUnit: 8.24 },
  });
  const efCardboard = await prisma.emissionFactor.create({
    data: { name: 'Cardboard Packaging', sourceType: 'PURCHASE', unit: 'kg', co2PerUnit: 0.94 },
  });
  const efAirFreight = await prisma.emissionFactor.create({
    data: { name: 'Air Freight', sourceType: 'FLEET', unit: 'tonne-km', co2PerUnit: 0.60 },
  });

  const emissionFactors = [efDiesel, efPetrol, efElectricity, efNaturalGas, efSteel, efAluminium, efCardboard, efAirFreight];
  const departments = [manufacturing, logistics, corporate, sales, rnd, procurement];

  // ─── Product ESG Profiles ───────────────────────────────────────────────────
  console.log('Creating product ESG profiles...');
  await prisma.productESGProfile.createMany({
    data: [
      { name: 'Eco Steel Beam', sku: 'STL-001', category: 'Raw Materials', carbonFootprintPerUnit: 185.0, recyclablePercent: 92, sustainabilityRating: 'A', notes: 'Recycled steel content' },
      { name: 'Aluminium Sheet 2mm', sku: 'ALU-002', category: 'Raw Materials', carbonFootprintPerUnit: 824.0, recyclablePercent: 85, sustainabilityRating: 'B', notes: 'High energy process' },
      { name: 'Bio-Cardboard Box', sku: 'PKG-003', category: 'Packaging', carbonFootprintPerUnit: 9.4, recyclablePercent: 98, sustainabilityRating: 'A', notes: 'FSC certified' },
      { name: 'Industrial Motor X2', sku: 'MFG-004', category: 'Equipment', carbonFootprintPerUnit: 420.0, recyclablePercent: 60, sustainabilityRating: 'C', notes: 'Refurb available' },
      { name: 'Solar Panel Kit', sku: 'ENE-005', category: 'Energy', carbonFootprintPerUnit: 80.0, recyclablePercent: 75, sustainabilityRating: 'A', notes: 'Offsets 1.2T CO2/yr' },
    ],
  });

  // ─── Environmental Goals ─────────────────────────────────────────────────────
  console.log('Creating environmental goals...');
  await prisma.environmentalGoal.create({
    data: {
      name: 'Reduce Fleet Emissions',
      departmentId: logistics.id,
      targetCO2: 500,
      currentCO2: 390,
      deadline: new Date('2026-12-31'),
      status: 'ACTIVE',
    },
  });
  await prisma.environmentalGoal.create({
    data: {
      name: 'Cut Packaging Waste',
      departmentId: manufacturing.id,
      targetCO2: 120,
      currentCO2: 98,
      deadline: new Date('2026-09-30'),
      status: 'ON_TRACK',
    },
  });
  await prisma.environmentalGoal.create({
    data: {
      name: 'Office Energy Cut',
      departmentId: corporate.id,
      targetCO2: 80,
      currentCO2: 80,
      deadline: new Date('2026-06-30'),
      status: 'COMPLETED',
    },
  });

  // ─── Categories ─────────────────────────────────────────────────────────────
  console.log('Creating categories...');
  const catPlantation = await prisma.category.create({ data: { name: 'Plantation', type: 'CSR_ACTIVITY' } });
  const catDonation = await prisma.category.create({ data: { name: 'Donation', type: 'CSR_ACTIVITY' } });
  const catCleanup = await prisma.category.create({ data: { name: 'Cleanup', type: 'CSR_ACTIVITY' } });
  const catWorkshop = await prisma.category.create({ data: { name: 'Workshop', type: 'CSR_ACTIVITY' } });
  const catTraining = await prisma.category.create({ data: { name: 'Training', type: 'CSR_ACTIVITY' } });
  const catWaste = await prisma.category.create({ data: { name: 'Waste', type: 'CHALLENGE' } });
  const catRecycling = await prisma.category.create({ data: { name: 'Recycling', type: 'CHALLENGE' } });
  const catCommute = await prisma.category.create({ data: { name: 'Commute', type: 'CHALLENGE' } });
  const catEnergy = await prisma.category.create({ data: { name: 'Energy', type: 'CHALLENGE' } });

  // ─── CSR Activities ──────────────────────────────────────────────────────────
  console.log('Creating CSR activities...');
  const actTreePlantation = await prisma.cSRActivity.create({
    data: {
      title: 'Tree Plantation',
      categoryId: catPlantation.id,
      description: 'Plant trees in the local area to offset carbon emissions and improve biodiversity.',
      date: new Date('2026-08-15'),
      evidenceRequired: true,
      pointsReward: 50,
      joinedCount: 24,
      status: 'OPEN',
    },
  });
  const actBloodDonation = await prisma.cSRActivity.create({
    data: {
      title: 'Blood Donation',
      categoryId: catDonation.id,
      description: 'Participate in the quarterly blood donation drive organized with the Red Cross.',
      date: new Date('2026-07-20'),
      evidenceRequired: true,
      pointsReward: 40,
      joinedCount: 18,
      status: 'OPEN',
    },
  });
  const actBeachCleanup = await prisma.cSRActivity.create({
    data: {
      title: 'Beach Cleanup',
      categoryId: catCleanup.id,
      description: 'Join the coastal cleanup initiative to remove plastic waste from local beaches.',
      date: new Date('2026-08-01'),
      evidenceRequired: false,
      pointsReward: 35,
      joinedCount: 31,
      status: 'OPEN',
    },
  });
  const actESGWorkshop = await prisma.cSRActivity.create({
    data: {
      title: 'ESG Workshop',
      categoryId: catWorkshop.id,
      description: 'Attend the half-day ESG awareness workshop to learn about sustainability practices.',
      date: new Date('2026-07-25'),
      evidenceRequired: false,
      pointsReward: 30,
      joinedCount: 52,
      status: 'OPEN',
    },
  });

  // ─── Employee Participations ─────────────────────────────────────────────────
  console.log('Creating employee participations...');
  await prisma.employeeParticipation.create({
    data: {
      userId: aditi.id,
      activityId: actTreePlantation.id,
      proofUrl: '/uploads/photo.jpg',
      approvalStatus: 'PENDING',
      pointsEarned: 50,
      completionDate: new Date('2026-07-10'),
    },
  });
  await prisma.employeeParticipation.create({
    data: {
      userId: karan.id,
      activityId: actESGWorkshop.id,
      proofUrl: '/uploads/cert.pdf',
      approvalStatus: 'APPROVED',
      pointsEarned: 30,
      completionDate: new Date('2026-07-08'),
    },
  });

  // ─── Challenges ─────────────────────────────────────────────────────────────
  console.log('Creating challenges...');
  const chalSprint = await prisma.challenge.create({
    data: {
      title: 'Sustainability Sprint',
      categoryId: catWaste.id,
      description: 'Complete 5 sustainability tasks in 30 days, including waste reduction and energy saving.',
      xp: 200,
      difficulty: 'HARD',
      evidenceRequired: true,
      deadline: new Date('2026-07-20'),
      status: 'ACTIVE',
    },
  });
  const chalRecycle = await prisma.challenge.create({
    data: {
      title: 'Recycle Challenge',
      categoryId: catRecycling.id,
      description: 'Recycle at least 10 kg of materials this week and document with photos.',
      xp: 80,
      difficulty: 'EASY',
      evidenceRequired: true,
      deadline: new Date('2026-07-15'),
      status: 'ACTIVE',
    },
  });
  const chalCommute = await prisma.challenge.create({
    data: {
      title: 'Commute Green Week',
      categoryId: catCommute.id,
      description: 'Use public transport or cycle to work every day for a week.',
      xp: 120,
      difficulty: 'MEDIUM',
      evidenceRequired: false,
      deadline: new Date('2026-07-25'),
      status: 'DRAFT',
    },
  });
  const chalZeroWaste = await prisma.challenge.create({
    data: {
      title: 'Zero Waste Week',
      categoryId: catWaste.id,
      description: 'Produce zero landfill waste for an entire week and share your experience.',
      xp: 150,
      difficulty: 'MEDIUM',
      evidenceRequired: true,
      deadline: new Date('2026-06-30'), // past deadline
      status: 'COMPLETED',
    },
  });

  // Priya's participation in Zero Waste Week (APPROVED)
  await prisma.challengeParticipation.create({
    data: {
      challengeId: chalZeroWaste.id,
      userId: priya.id,
      progress: 100,
      proofUrl: '/uploads/photo.jpg',
      approvalStatus: 'APPROVED',
      xpAwarded: 150,
    },
  });

  // ─── Badges ──────────────────────────────────────────────────────────────────
  console.log('Creating badges...');
  const badgeGreenBeginner = await prisma.badge.create({
    data: {
      name: 'Green Beginner',
      description: 'Earn 100 XP by participating in sustainability activities.',
      icon: '🌱',
      unlockRuleType: 'XP_THRESHOLD',
      unlockValue: 100,
    },
  });
  const badgeCarbonSaver = await prisma.badge.create({
    data: {
      name: 'Carbon Saver',
      description: 'Earn 1000 XP demonstrating consistent eco-friendly behavior.',
      icon: '🌍',
      unlockRuleType: 'XP_THRESHOLD',
      unlockValue: 1000,
    },
  });
  const badgeSustainChampion = await prisma.badge.create({
    data: {
      name: 'Sustainability Champion',
      description: 'Complete 5 challenges to earn this elite badge.',
      icon: '🏆',
      unlockRuleType: 'CHALLENGES_COMPLETED',
      unlockValue: 5,
    },
  });
  const badgeTeamPlayer = await prisma.badge.create({
    data: {
      name: 'Team Player',
      description: 'Complete 3 CSR activities to show your community spirit.',
      icon: '🤝',
      unlockRuleType: 'CSR_COMPLETED',
      unlockValue: 3,
    },
  });

  // Award Green Beginner + Carbon Saver to Aditi
  await prisma.userBadge.create({
    data: { userId: aditi.id, badgeId: badgeGreenBeginner.id, awardedAt: new Date('2026-04-01') },
  });
  await prisma.userBadge.create({
    data: { userId: aditi.id, badgeId: badgeCarbonSaver.id, awardedAt: new Date('2026-06-15') },
  });

  // ─── Rewards ─────────────────────────────────────────────────────────────────
  console.log('Creating rewards...');
  await prisma.reward.createMany({
    data: [
      { name: 'Amazon Voucher ₹500', description: 'Redeem an Amazon gift card worth ₹500 for eco-shopping.', pointsRequired: 2000, stock: 10 },
      { name: 'Plant a Tree in Your Name', description: 'We will plant a tree in your name at a reforestation site.', pointsRequired: 300, stock: 50 },
      { name: 'Extra Leave Day', description: 'Take an extra paid leave day — your green reward!', pointsRequired: 5000, stock: 5 },
      { name: 'EcoSphere Hoodie', description: 'Premium organic-cotton EcoSphere branded hoodie.', pointsRequired: 1500, stock: 20 },
    ],
  });

  // ─── ESG Policies ────────────────────────────────────────────────────────────
  console.log('Creating ESG policies...');
  const polAntiCorruption = await prisma.eSGPolicy.create({
    data: {
      title: 'Anti-Corruption Policy',
      body: 'EcoSphere is committed to conducting business with the highest standards of integrity. This policy prohibits bribery, corruption, and unethical practices in all business dealings. All employees must report any suspected violations to the compliance team.',
      version: '1.0',
      effectiveDate: new Date('2026-01-01'),
      status: 'Active',
    },
  });
  const polCodeOfConduct = await prisma.eSGPolicy.create({
    data: {
      title: 'Code of Conduct',
      body: 'Our Code of Conduct sets out the standards of behavior expected from all EcoSphere employees. This includes respect for colleagues, adherence to legal requirements, protection of confidential information, and responsible use of company resources.',
      version: '1.0',
      effectiveDate: new Date('2026-01-15'),
      status: 'Active',
    },
  });
  const polEnvironmental = await prisma.eSGPolicy.create({
    data: {
      title: 'Environmental Policy',
      body: 'EcoSphere is committed to reducing its environmental footprint. This policy outlines our commitment to carbon neutrality by 2030, waste reduction targets, renewable energy adoption, and responsible sourcing of materials.',
      version: '1.0',
      effectiveDate: new Date('2026-02-01'),
      status: 'Active',
    },
  });
  const polDataPrivacy = await prisma.eSGPolicy.create({
    data: {
      title: 'Data Privacy Policy',
      body: 'EcoSphere collects and processes personal data in accordance with applicable privacy laws including GDPR. This policy explains what data we collect, how we use it, and how we protect it. All employees must complete annual privacy training.',
      version: '1.0',
      effectiveDate: new Date('2026-03-01'),
      status: 'Active',
    },
  });

  // Policy Acknowledgements
  // All R&D users acknowledge Anti-Corruption
  const rndUsers = [priya, dmenon, rohit];
  for (const user of rndUsers) {
    await prisma.policyAcknowledgement.create({
      data: { policyId: polAntiCorruption.id, userId: user.id, acknowledgedAt: new Date('2026-04-10') },
    });
  }
  // Partial acks elsewhere
  await prisma.policyAcknowledgement.create({
    data: { policyId: polCodeOfConduct.id, userId: aditi.id, acknowledgedAt: new Date('2026-04-15') },
  });
  await prisma.policyAcknowledgement.create({
    data: { policyId: polCodeOfConduct.id, userId: karan.id, acknowledgedAt: new Date('2026-04-16') },
  });
  await prisma.policyAcknowledgement.create({
    data: { policyId: polEnvironmental.id, userId: snair.id, acknowledgedAt: new Date('2026-05-01') },
  });
  await prisma.policyAcknowledgement.create({
    data: { policyId: polDataPrivacy.id, userId: amehta.id, acknowledgedAt: new Date('2026-05-10') },
  });
  await prisma.policyAcknowledgement.create({
    data: { policyId: polAntiCorruption.id, userId: ngupta.id, acknowledgedAt: new Date('2026-04-20') },
  });
  await prisma.policyAcknowledgement.create({
    data: { policyId: polAntiCorruption.id, userId: aditi.id, acknowledgedAt: new Date('2026-04-12') },
  });

  // ─── Audits ──────────────────────────────────────────────────────────────────
  console.log('Creating audits...');
  const auditQ2 = await prisma.audit.create({
    data: {
      title: 'Q2 Waste Audit',
      departmentId: manufacturing.id,
      auditor: 'S. Nair',
      date: new Date('2026-06-12'),
      findings: '3 minor issues identified: improper waste segregation in Unit 2, missing disposal logs for June week 1, and outdated MSDS sheets for chemical storage.',
      status: 'COMPLETED',
    },
  });
  const auditVendor = await prisma.audit.create({
    data: {
      title: 'Vendor Compliance Check',
      departmentId: procurement.id,
      auditor: 'R. Iyer',
      date: new Date('2026-07-01'),
      findings: '1 open issue: late vendor disclosure from Supplier XYZ for Q2 sustainability report.',
      status: 'UNDER_REVIEW',
    },
  });

  // ─── Compliance Issues ───────────────────────────────────────────────────────
  console.log('Creating compliance issues...');
  await prisma.complianceIssue.create({
    data: {
      auditId: auditQ2.id,
      title: 'Missing MSDS sheets',
      description: 'Material Safety Data Sheets are missing for 3 chemical storage areas in Unit 2. This is a regulatory compliance requirement under HSE guidelines.',
      severity: 'HIGH',
      departmentId: manufacturing.id,
      ownerId: snair.id,
      dueDate: new Date('2026-07-20'),
      status: 'OPEN',
    },
  });
  await prisma.complianceIssue.create({
    data: {
      auditId: auditVendor.id,
      title: 'Late vendor disclosure',
      description: 'Supplier XYZ failed to submit Q2 sustainability disclosure by the June 25 deadline as required by our vendor code of conduct.',
      severity: 'MEDIUM',
      departmentId: procurement.id,
      ownerId: ngupta.id,
      dueDate: new Date('2026-06-25'),
      status: 'RESOLVED',
      resolutionNote: 'Supplier submitted the overdue disclosure on July 3, 2026. Issued formal warning letter. No further action required.',
    },
  });

  // ─── Carbon Transactions ─────────────────────────────────────────────────────
  console.log('Creating carbon transactions (~220 rows)...');

  const now = new Date('2026-07-12');
  const oneYearAgo = new Date('2025-07-12');

  // Generate sine-wave pattern over 12 months: rising Jan-Jul, falling Jul-Dec
  // 220 total rows: 42 in last 7 days, 178 spread over remaining ~358 days

  const transactions = [];

  // Helper: get date N days ago from now
  const daysAgo = (d) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() - d);
    return dt;
  };

  // Generate 42 transactions in last 7 days (days 0-6)
  for (let i = 0; i < 42; i++) {
    const day = Math.floor(Math.random() * 7);
    const dept = departments[Math.floor(Math.random() * departments.length)];
    const ef = emissionFactors[Math.floor(Math.random() * emissionFactors.length)];
    const qty = parseFloat((Math.random() * 100 + 10).toFixed(2));
    const date = daysAgo(day);
    date.setHours(Math.floor(Math.random() * 8) + 8, 0, 0, 0);
    transactions.push({
      departmentId: dept.id,
      emissionFactorId: ef.id,
      quantity: qty,
      co2Amount: parseFloat((qty * ef.co2PerUnit).toFixed(3)),
      date,
      source: 'AUTO',
    });
  }

  // Generate 178 transactions over the previous ~11 months
  const totalDaysInPeriod = 358; // days 7 to 365
  for (let i = 0; i < 178; i++) {
    // Spread across the period
    const dayOffset = 7 + Math.floor((i / 178) * totalDaysInPeriod);
    const date = daysAgo(dayOffset);

    // Sine-wave weight: higher volume mid-year (rising trend in recent months)
    // dayOffset 7 = recent, dayOffset 365 = 1 year ago
    // We want recent months to be higher
    const monthFraction = 1 - (dayOffset / 365); // 0=old, 1=recent
    const sineWeight = 0.5 + 0.5 * Math.sin(monthFraction * Math.PI);
    const qty = parseFloat(((sineWeight * 150 + 20 + Math.random() * 40)).toFixed(2));

    const dept = departments[Math.floor(Math.random() * departments.length)];
    const ef = emissionFactors[Math.floor(Math.random() * emissionFactors.length)];

    date.setHours(Math.floor(Math.random() * 8) + 8, Math.floor(Math.random() * 60), 0, 0);

    transactions.push({
      departmentId: dept.id,
      emissionFactorId: ef.id,
      quantity: qty,
      co2Amount: parseFloat((qty * ef.co2PerUnit).toFixed(3)),
      date,
      source: i % 5 === 0 ? 'MANUAL' : 'AUTO',
    });
  }

  // Insert in batches of 50
  for (let i = 0; i < transactions.length; i += 50) {
    await prisma.carbonTransaction.createMany({ data: transactions.slice(i, i + 50) });
  }

  // ─── Department Scores ───────────────────────────────────────────────────────
  console.log('Creating department scores for 2026-07...');
  // Target: Environmental 82, Social 74, Governance 88, Overall 81
  // Each department gets scores that average to these targets

  const deptScoreData = [
    { dept: manufacturing, env: 78, social: 72, gov: 85 },
    { dept: logistics, env: 80, social: 70, gov: 90 },
    { dept: corporate, env: 85, social: 78, gov: 92 },
    { dept: sales, env: 84, social: 76, gov: 88 },
    { dept: rnd, env: 82, social: 74, gov: 86 },
    { dept: procurement, env: 83, social: 74, gov: 87 },
  ];

  // Average: env = (78+80+85+84+82+83)/6 = 492/6 = 82.0 ✓
  // social = (72+70+78+76+74+74)/6 = 444/6 = 74.0 ✓
  // gov = (85+90+92+88+86+87)/6 = 528/6 = 88.0 ✓

  for (const ds of deptScoreData) {
    const totalScore = parseFloat(
      (ds.env * 0.4 + ds.social * 0.3 + ds.gov * 0.3).toFixed(1)
    );
    await prisma.departmentScore.create({
      data: {
        departmentId: ds.dept.id,
        period: '2026-07',
        envScore: ds.env,
        socialScore: ds.social,
        govScore: ds.gov,
        totalScore,
      },
    });
  }

  // ─── OrgSettings ────────────────────────────────────────────────────────────
  console.log('Creating org settings...');
  await prisma.orgSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      autoEmissionCalc: true,
      evidenceRequired: true,
      badgeAutoAward: true,
      emailAlertsCompliance: true,
      notifyApprovals: true,
      notifyPolicyReminders: true,
      notifyBadgeUnlocks: true,
      weightEnv: 40,
      weightSocial: 30,
      weightGov: 30,
    },
  });

  // ─── Activity Log ────────────────────────────────────────────────────────────
  console.log('Creating activity logs...');
  await prisma.activityLog.createMany({
    data: [
      { type: 'CHALLENGE', message: "Priya completed 'Zero Waste Week'", createdAt: new Date('2026-07-10T10:30:00') },
      { type: 'COMPLIANCE', message: 'New compliance issue in Logistics', createdAt: new Date('2026-07-09T14:15:00') },
      { type: 'CARBON', message: '42 new Carbon Transactions logged', createdAt: new Date('2026-07-08T09:00:00') },
      { type: 'POLICY', message: "R&D acknowledged Anti-Corruption Policy", createdAt: new Date('2026-07-07T11:45:00') },
    ],
  });

  // ─── Notifications ───────────────────────────────────────────────────────────
  console.log('Creating notifications...');
  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        type: 'COMPLIANCE',
        title: 'New Compliance Issue',
        message: 'Missing MSDS sheets flagged in Manufacturing — due July 20.',
        link: '/governance/compliance-issues',
        read: false,
        createdAt: new Date('2026-07-11T08:00:00'),
      },
      {
        userId: admin.id,
        type: 'CSR',
        title: 'CSR Approval Pending',
        message: 'Aditi Rao\'s Tree Plantation participation needs review.',
        link: '/social/employee-participation',
        read: false,
        createdAt: new Date('2026-07-10T16:30:00'),
      },
      {
        userId: admin.id,
        type: 'BADGE',
        title: 'Badge Awarded',
        message: 'Aditi Rao earned the Carbon Saver badge!',
        link: '/gamification/badges',
        read: false,
        createdAt: new Date('2026-07-09T12:00:00'),
      },
    ],
  });

  // ─── Placeholder upload files ─────────────────────────────────────────────
  // Created in build step via separate script; files already exist as stubs

  console.log('✅ Seeding complete!');
  console.log('');
  console.log('Demo credentials:');
  console.log('  Admin:    admin@ecosphere.io / Admin@123');
  console.log('  Employee: aditi.rao@ecosphere.io / Emp@123');
  console.log('  Employee: priya.sharma@ecosphere.io / Emp@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
