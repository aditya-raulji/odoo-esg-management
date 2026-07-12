import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET diversity and training completion metrics (Authenticated users)
export async function GET(req) {
  const { error } = await requireAuth(req);
  if (error) return error;

  try {
    // 1. Fetch active users
    const users = await prisma.user.findMany({
      where: { status: 'Active' },
      include: { department: true }
    });

    // 2. Fetch active departments
    const departments = await prisma.department.findMany({
      where: { status: 'Active' },
      include: { users: { where: { status: 'Active' } } }
    });

    // 3. Fetch approved CSR participations
    const approvedParts = await prisma.employeeParticipation.findMany({
      where: { approvalStatus: 'APPROVED' },
      include: {
        user: true,
        activity: {
          include: { category: true }
        }
      }
    });

    // Compute gender distribution
    const gendersMap = {};
    users.forEach((u) => {
      const g = u.gender ? u.gender.toUpperCase() : 'OTHER';
      const label = g === 'MALE' ? 'Male' : g === 'FEMALE' ? 'Female' : 'Other';
      gendersMap[label] = (gendersMap[label] || 0) + 1;
    });
    const genders = Object.entries(gendersMap).map(([name, value]) => ({ name, value }));

    // Compute role distribution
    const rolesMap = {};
    users.forEach((u) => {
      const r = u.role ? u.role.toUpperCase() : 'EMPLOYEE';
      const label = r === 'ADMIN' ? 'Admin' : 'Employee';
      rolesMap[label] = (rolesMap[label] || 0) + 1;
    });
    const roles = Object.entries(rolesMap).map(([name, value]) => ({ name, value }));

    // Compute department stats (employees, approved CSR participations)
    // Let's index approved parts by department
    const deptPartsCount = {};
    approvedParts.forEach((p) => {
      if (p.user?.departmentId) {
        const deptId = p.user.departmentId;
        deptPartsCount[deptId] = (deptPartsCount[deptId] || 0) + 1;
      }
    });

    const departmentStats = departments.map((dept) => {
      const employeesCount = dept.users.length;
      const approvedCount = deptPartsCount[dept.id] || 0;
      const participationRate = employeesCount > 0 ? parseFloat(((approvedCount / employeesCount) * 100).toFixed(1)) : 0;
      return {
        name: dept.name,
        employees: employeesCount,
        approvedParticipations: approvedCount,
        participationRate: participationRate
      };
    });

    // Compute training completion rate
    // Participations in the "Training" category / total employees
    const totalEmployees = users.length;
    const trainingPartsCount = approvedParts.filter(
      (p) => p.activity?.category?.name?.toLowerCase() === 'training'
    ).length;
    const trainingCompletionRate = totalEmployees > 0 ? parseFloat(((trainingPartsCount / totalEmployees) * 100).toFixed(1)) : 0;

    return NextResponse.json({
      genders,
      roles,
      departments: departmentStats,
      trainingCompletion: {
        value: trainingCompletionRate,
        count: trainingPartsCount,
        total: totalEmployees
      }
    });
  } catch (err) {
    console.error('Error generating diversity and training metrics:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}