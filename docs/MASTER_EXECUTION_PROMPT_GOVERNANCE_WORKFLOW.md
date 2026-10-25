# MASTER EXECUTION PROMPT: ENTERPRISE GOVERNANCE, WORKFLOW & SETTINGS ARCHITECTURE

You are acting as the Principal Enterprise Architect & Senior Full-Stack Engineer implementing the **Governance, Organization, Security, and Generic Workflow Engine** for Kranex Industrial ERP.

IMPORTANT:
This is an ADDITION to the existing Manufacturing ERP.
DO NOT remove, simplify, or break any previously implemented modules (Operations, PPIC Finite Capacity, Multi-Level BOM Explosion, Shop Floor Kiosk, NPI Gate, ECR Isolation, Procurement, Quality, or Cryptographic Audit Trail).

---

## 1. TOP-LEVEL NAVIGATION RESTRUCTURING

Restructure the application's primary navigation into 3 clean, enterprise-grade pillars:

```
KRANEX INDUSTRIAL ERP
│
├── 1. OPERATIONS
│   ├── Operations Dashboard
│   ├── Demand & Sales Orders
│   ├── Planning (MPS, MRP & Production Plans)
│   ├── Scheduling (Finite Capacity & Machine Gantt)
│   ├── Work Order Management
│   ├── Production Execution (Kiosk & Dispatch)
│   ├── Inventory & WMS
│   └── Quality & NCR
│
├── 2. WORKFLOW (STANDALONE PRIMARY MENU)
│   ├── My Tasks (Tugas Menunggu Tindakan Saya)
│   ├── Approval Inbox (Daftar Menunggu Persetujuan)
│   ├── Approval Requests (Daftar Pengajuan Saya)
│   ├── Pending Approvals (Antrean Global Lintas Departemen)
│   ├── Approval History (Log Persetujuan Masa Lalu)
│   └── Workflow Monitoring (SLA & Bottleneck Analisis)
│
└── 3. SETTINGS
    ├── Organization
    │   ├── Company Profile
    │   ├── Plants & Facilities
    │   ├── Departments
    │   ├── Sections / Lines
    │   ├── Positions & Job Titles
    │   └── Organization Hierarchy Tree
    ├── People
    │   ├── Employees (Tenaga Kerja Pabrik)
    │   ├── Employee Work Center Assignments
    │   ├── Skill Master
    │   └── Skill Competency Matrix
    ├── Security
    │   ├── User Accounts
    │   ├── Roles (RBAC)
    │   ├── Granular Permissions
    │   └── User Role & Plant Scoping
    ├── Approval
    │   ├── Approval Types (Plan, BOM, PR, WO, NPI)
    │   ├── Approval Matrix Rules (Multi-Tier & Conditions)
    │   ├── Approver Configurations
    │   ├── Approval Delegation (Cuti / Pelaksana Tugas)
    │   └── Escalation SLA Rules
    ├── Manufacturing Master Data
    │   ├── Item Master
    │   ├── Bill of Materials (BOM)
    │   ├── Routings & Operations
    │   ├── Work Centers
    │   ├── Machines & Equipment
    │   ├── Tooling & Dies
    │   ├── Production Shifts
    │   └── Production Calendars
    ├── Planning Parameters
    │   ├── Capacity & Efficiency Rules
    │   ├── Scheduling & Changeover Matrix
    │   ├── Priority & Firmness Rules
    │   └── Planning Horizons
    └── System Governance
        ├── Auto-Numbering Sequences
        ├── Status Definitions
        ├── Notification Subscriptions
        ├── Immutable Audit Trail
        └── Integration Endpoints
```

---

## 2. STRICT DOMAIN PRINCIPLES

### A. Employee vs. User Account Segregation
* **Employee**: Identitas personil pabrik (NIK, Nama, Departemen, Posisi, Plant, Supervisor, Skill, Shift).
* **User Account**: Kredensial login digital (Username, Email, Role, Plant Scope).
* **Rule**: Operator lantai pabrik dapat terdaftar sebagai Employee tanpa harus memiliki User Account, namun tetap dapat dialokasikan pada Manpower Planning dan Kiosk Station.

### B. Generic Rule-Based Approval Matrix
* Evaluasi approval matrix **wajib generic** berdasarkan kondisi:
  * Transaction Type (`PRODUCTION_PLAN`, `BOM_CHANGE`, `PURCHASE_REQ`, `WORK_ORDER`, `NPI_RELEASE`)
  * Plant Location (e.g. `PLANT-BATAM`)
  * Threshold Nilai (e.g. Qty > 5,000 pcs atau Nominal > Rp 100,000,000)
  * Kategori Perubahan (`MAJOR` vs `MINOR`)
* Multi-Level Approver:
  * Level 1: e.g. PPIC Manager (`POS-MGR-PPIC`)
  * Level 2: e.g. Production Manager (`POS-MGR-PROD`)
  * Level 3: e.g. Plant Manager (`POS-MGR-PLANT`)

### C. Approval Delegation & Escalation
* Mendukung delegasi aktif (*Delegated Approver*) saat pejabat berwenang cuti (misal: 25–30 Okt).
* Transaksi yang masuk ke inbox delegator otomatis dapat ditindaklanjuti oleh acting approver dengan catatan audit resmi.
* Eskalasi otomatis bila pending melebihi SLA 24–48 jam.

### D. Snapshot Immutability (Rule 10)
* Setiap approval request mengunci payload snapshot data asli.
* Work Order yang berstatus Released tetap mengonsumsi BOM & Routing snapshot revisi asli (`REV-A`), tidak terpengaruh oleh revisi baru (`REV-B`) sebelum ada ECR authorization resmi.

---

## 3. IMPLEMENTATION SCOPE & ACCEPTANCE CRITERIA

1. **TypeScript Interfaces**:
   * Definisikan tipe terpisah di `src/types/index.ts` untuk `Company`, `PlantMaster`, `DepartmentMaster`, `PositionMaster`, `EmployeeMaster`, `UserAccount`, `RoleDefinition`, `PermissionToken`, `ApprovalMatrixRule`, `ApprovalRequest`, `ApprovalStep`, `ApprovalDelegation`, `EscalationRule`.
2. **Generic Workflow Engine Service**:
   * Buat `src/lib/services/workflowService.ts`:
     * `evaluateApprovalMatrix(transactionType, payload)`: Mengembalikan rantai level approver yang sesuai aturan.
     * `submitApprovalRequest(transactionType, entityId, payload, submitter)`: Menerbitkan tiket approval baru.
     * `approveStep(requestId, actorUserId, comment)`: Menandai level selesai; jika semua level disetujui, mutasikan status entitas sumber ke `APPROVED / RELEASED`.
     * `rejectStep(requestId, actorUserId, reason)`: Membatalkan permohonan dan mengembalikan entitas sumber ke `REJECTED / DRAFT`.
     * `delegateApproval(delegationConfig)`: Registrasi delegasi wewenang sementara.
     * `checkSlaEscalation()`: Deteksi tiket yang melewati SLA.
3. **Workflow Center UI (`src/modules/workflow/`)**:
   * `WorkflowView.tsx` dengan sub-tab:
     * `my-tasks` / `approval-inbox`: Data grid dengan badge jumlah pending (`🔔 3 Pending`), filter tipe, tombol aksi cepat.
     * `decision-drawer`: Drawer detail transaksi dengan capacity check summary / financial diff / BOM diff, histori approval, dan form Approve/Reject/Delegate.
     * `approval-requests`: Transaksi yang diajukan oleh user yang sedang login beserta status per levelnya.
     * `approval-history`: Log permanen riwayat approval.
     * `monitoring`: Metrik SLA lead-time approval.
4. **Settings UI (`src/modules/settings/`)**:
   * `SettingsView.tsx` dengan sidebar navigasi sub-kategori:
     * `Organization`: Perusahaan, Plant, Departemen, Posisi, Bagan Struktur Organisasi.
     * `People`: Master Employee, Skill Matrix, Assignment.
     * `Security`: Master User, Role Editor, Permissions Checkbox Grid.
     * `Approval`: Rule Builder Approval Matrix, Form Delegasi, SLA Config.
     * `Manufacturing`: Master Data Pabrik (terhubung ke Item, BOM, Routing, Machine, Work Center).
     * `Planning`: Rule Parameter, Setup Time Matrix, Capacity Factors.
     * `System`: Numbering, Audit Logs, Notification Rules.
5. **Top Bar Header Integration**:
   * Di `src/components/layout/Header.tsx`, tampilkan indikator dinamis `🔔 [N] Pending Approvals` yang dapat diklik langsung untuk membuka Workflow Approval Inbox.
6. **Feature Registry & Verification**:
   * Daftarkan modul Governance & Workflow ke Feature Registry.
   * Pastikan `npm run build` dan `npm run lint` lulus 100% tanpa error.
