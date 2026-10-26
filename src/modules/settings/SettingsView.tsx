import React, { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  EmployeeMaster,
  UserAccount,
  PositionMaster,
  DepartmentMaster,
  PlantMaster,
  ApprovalMatrixRule,
} from '../../types';
import {
  INITIAL_COMPANY,
  INITIAL_PLANTS,
  INITIAL_DEPARTMENTS,
  INITIAL_POSITIONS,
  INITIAL_EMPLOYEES,
  INITIAL_USER_ACCOUNTS,
  INITIAL_APPROVAL_MATRIX_RULES,
} from '../../lib/mockData';
import { DataTable } from '../../components/common/DataTable';
import {
  Building2,
  Users,
  Shield,
  Sliders,
  Cpu,
  Layers,
  Award,
  CheckCircle,
  XCircle,
  Key,
} from 'lucide-react';

interface SettingsViewProps {
  initialTab?: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ initialTab = 'organization' }) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [employees, setEmployees] = useState<EmployeeMaster[]>(INITIAL_EMPLOYEES);
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USER_ACCOUNTS);
  const [positions, setPositions] = useState<PositionMaster[]>(INITIAL_POSITIONS);
  const [departments, setDepartments] = useState<DepartmentMaster[]>(INITIAL_DEPARTMENTS);
  const [plants, setPlants] = useState<PlantMaster[]>(INITIAL_PLANTS);
  const [rules, setRules] = useState<ApprovalMatrixRule[]>(INITIAL_APPROVAL_MATRIX_RULES);

  // TanStack columns for Physical Employees
  const employeeColumns: ColumnDef<EmployeeMaster>[] = [
    {
      accessorKey: 'nik',
      header: 'NIK (ID Karyawan)',
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-slate-800">
          {row.original.nik}
        </span>
      ),
    },
    {
      accessorKey: 'fullName',
      header: 'Nama Lengkap',
      cell: ({ row }) => (
        <div>
          <span className="font-medium text-slate-900 block">{row.original.fullName}</span>
          <span className="text-[11px] text-slate-400">{row.original.positionTitle}</span>
        </div>
      ),
    },
    {
      accessorKey: 'plantId',
      header: 'Plant',
      cell: ({ row }) => (
        <span className="text-slate-600">
          {row.original.plantId === 'PLANT-01' ? 'Batam' : 'Cikarang'}
        </span>
      ),
    },
    {
      id: 'skillMatrix',
      header: 'Skill Matrix & Level',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {row.original.skills.map((s) => (
            <span
              key={s.skillCode}
              className="text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200"
            >
              {s.skillName} (Lvl {s.level})
            </span>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'hourlyRate',
      header: 'Tarif / Jam',
      cell: ({ row }) => (
        <span className="font-mono text-slate-700 tabular-nums">
          Rp {row.original.hourlyRate.toLocaleString()}
        </span>
      ),
    },
    {
      id: 'linkedUser',
      header: 'Status Akun Login',
      cell: ({ row }) => {
        const hasAccount = !!row.original.linkedUserId;
        return (
          <div className="flex items-center gap-1.5">
            {hasAccount ? (
              <span className="text-emerald-700 font-medium text-xs flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Memiliki Akun ({row.original.linkedUserId})</span>
              </span>
            ) : (
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <span>Hanya Operator Fisik (Tanpa Akun)</span>
              </span>
            )}
          </div>
        );
      },
    },
  ];

  // TanStack columns for User Accounts
  const userColumns: ColumnDef<UserAccount>[] = [
    {
      accessorKey: 'username',
      header: 'Username',
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-indigo-700">
          {row.original.username}
        </span>
      ),
    },
    {
      accessorKey: 'fullName',
      header: 'Nama Pengguna & Email',
      cell: ({ row }) => (
        <div>
          <span className="font-medium text-slate-900 block">{row.original.fullName}</span>
          <span className="text-[11px] text-slate-400">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'roles',
      header: 'Roles (RBAC)',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.roles.map((r) => (
            <span
              key={r}
              className="text-[10px] font-mono font-medium px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100"
            >
              {r}
            </span>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'plantScope',
      header: 'Scope Plant',
      cell: ({ row }) => (
        <span className="text-slate-600 font-mono text-[11px]">
          {row.original.plantScope.join(', ')}
        </span>
      ),
    },
    {
      accessorKey: 'lastLoginAt',
      header: 'Login Terakhir',
      cell: ({ row }) => (
        <span className="font-mono text-slate-500 text-[11px]">
          {row.original.lastLoginAt || 'Belum login'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Settings Top Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Pusat Konfigurasi & Master Tata Kelola (Settings Hub)
            </h1>
            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded-md">
              Enterprise Master
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pengaturan struktur organisasi, pemisahan entitas Tenaga Kerja (Employee) vs Akun Pengguna (User), RBAC, dan matriks approval.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('organization')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'organization'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Struktur Organisasi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('people')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'people'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Tenaga Kerja (Employee Master & Skill)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'security'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Keamanan & Akun Sistem (User & RBAC)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('approval-matrix')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'approval-matrix'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Approval Matrix Rules</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        {activeTab === 'organization' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Profil Perusahaan & Hierarki Pabrik Manufaktur
              </h2>
              <p className="text-xs text-slate-500">
                PT Kranex Manufacturing Indonesia — Multi-Plant Organization Architecture.
              </p>
            </div>

            {/* Company Profile Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs">
              <div className="font-semibold text-slate-900 text-sm mb-1">{INITIAL_COMPANY.name}</div>
              <div className="text-slate-600">{INITIAL_COMPANY.headquartersAddress}</div>
              <div className="flex items-center gap-4 mt-2 text-slate-500">
                <span>NPWP: <strong>{INITIAL_COMPANY.taxNumber}</strong></span>
                <span>Mata Uang Dasar: <strong>{INITIAL_COMPANY.currency}</strong></span>
              </div>
            </div>

            {/* Plants Grid */}
            <div className="space-y-2">
              <div className="font-semibold text-slate-900 text-xs">Daftar Plant Aktif:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plants.map((plant) => (
                  <div key={plant.id} className="border border-slate-200 rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs font-mono">{plant.code}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">
                        Aktif
                      </span>
                    </div>
                    <div className="font-semibold text-slate-900 text-sm mt-1">{plant.name}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{plant.location}</div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                      <span>Hari Kerja: <strong>{plant.workingDaysPerWeek} hari/minggu</strong></span>
                      <span>Kapasitas Shift: <strong>{plant.shiftsPerDay} shift/hari</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Departments & Hierarchy */}
            <div className="space-y-2 pt-2">
              <div className="font-semibold text-slate-900 text-xs">Departemen & Cost Center:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {departments.map((dept) => (
                  <div key={dept.id} className="p-3 border border-slate-200 rounded-lg text-xs bg-slate-50/50">
                    <div className="font-mono text-[11px] text-indigo-700 font-semibold">{dept.code}</div>
                    <div className="font-medium text-slate-900 mt-0.5">{dept.name}</div>
                    <div className="text-[11px] text-slate-400 mt-1">Cost Center: {dept.costCenterCode}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'people' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Daftar Tenaga Kerja Pabrik (Employee Master)
              </h2>
              <p className="text-xs text-slate-500">
                Prinsip Desain: Operator mesin, perakit, dan teknisi dicatat sebagai Employee fisik untuk perhitungan kapasitas manpower tanpa keharusan memiliki lisensi akun sistem.
              </p>
            </div>

            <DataTable
              data={employees}
              columns={employeeColumns}
              searchPlaceholder="Cari NIK, nama karyawan, atau jabatan..."
            />
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Akun Pengguna Sistem & Hak Akses (User & RBAC)
              </h2>
              <p className="text-xs text-slate-500">
                Pengguna aplikasi digital yang memiliki hak otorisasi, persetujuan transaksi, atau perencanaan PPIC.
              </p>
            </div>

            <DataTable
              data={users}
              columns={userColumns}
              searchPlaceholder="Cari username atau role..."
            />
          </div>
        )}

        {activeTab === 'approval-matrix' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Matriks Persetujuan Multi-Jenjang (Approval Matrix Rules)
              </h2>
              <p className="text-xs text-slate-500">
                Kondisi evaluasi dinamis untuk transaksi manufaktur (Production Plan, PR, Perubahan BOM).
              </p>
            </div>

            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-xs">{rule.title}</span>
                      <span className="ml-2 font-mono text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                        {rule.approvalType}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">Plant: {rule.plantId}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{rule.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {rule.levels.map((lvl) => (
                      <div
                        key={lvl.level}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700"
                      >
                        Lvl {lvl.level}: {lvl.authorityTitle} · <span className="font-mono text-indigo-600">{lvl.roleRequired}</span> (SLA {lvl.slaHours}h)
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
