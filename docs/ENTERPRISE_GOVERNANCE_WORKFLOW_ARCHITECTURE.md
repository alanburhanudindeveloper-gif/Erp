# KRANEX INDUSTRIAL ERP — ENTERPRISE GOVERNANCE, WORKFLOW & ORGANIZATION ARCHITECTURE
## Baseline Requirements Specification & Architectural Foundation (V2.0)

**Platform:** Kranex Industrial ERP / Configurable Manufacturing Operations Platform  
**Document Code:** KRX-ARCH-GOV-WORKFLOW-2026-V2  
**Status:** Approved Architectural Baseline for Implementation  
**Audience:** Enterprise Architects, PPIC Engineers, Security Officers, AI Engineering Agents  

---

## 1. CORE PHILOSOPHY & TOP-LEVEL DOMAIN TAXONOMY

A true enterprise ERP clearly decouples **Operational Execution**, **Governance/Workflow**, and **System/Organization Settings**. It avoids monolith "giant master data" dumping by enforcing strict domain separation:

```
                                  KRANEX ENTERPRISE ERP
                                             │
      ┌──────────────────────────────────────┼──────────────────────────────────────┐
      ▼                                      ▼                                      ▼
[OPERATIONS]                            [WORKFLOW]                             [SETTINGS]
"Apa yang sedang berjalan &             "Ada transaksi apa yang sedang         "Siapa yang berhak melakukan apa
bagaimana status produksinya?"           menunggu tindakan siapa?"              & bagaimana sistem dikonfigurasi?"
  ├── Dashboard                           ├── My Tasks (Tugas Saya)              ├── Organization (Org Structure)
  ├── Demand & Sales Orders               ├── Approval Inbox                     ├── People (Employee & Skills)
  ├── Planning (MPS & MRP)                ├── Approval Requests (Diajukan)       ├── Security (RBAC & Permissions)
  ├── Scheduling (Finite Gantt)           ├── Pending Approvals                  ├── Approval (Matrix & Delegation)
  ├── Work Order                          ├── Approval History                   ├── Manufacturing (Item, BOM, RT)
  ├── Production Execution                └── Workflow Monitoring (SLA/SOP)      ├── Planning (Capacity & Rules)
  ├── Inventory & WMS                                                            └── System (Audit, Numbering, Log)
  └── Quality Assurance
```

---

## 2. DOMAIN 1: ORGANIZATION & PEOPLE

### 2.1 The Fundamental Distinction: Employee vs. User Account

In a real manufacturing plant:
* **Employee (Tenaga Kerja / SDM)**: Entitas fisik di pabrik (Operator mesin, Teknisi, Inspector, Manager). Memiliki skill, tarif jam kerja, departemen, dan shift. **Tidak semua employee membutuhkan akun login aplikasi**.
* **User (Akun Sistem / Credential)**: Identitas login digital ke aplikasi dengan role dan permission tertentu. User dapat ditautkan (*linked*) ke Employee ID.

```
┌────────────────────────────────────────────────────────┐
│                        EMPLOYEE                        │
│  • Employee ID (NIK)      • Department & Section       │
│  • Full Name              • Position / Job Title       │
│  • Plant Location         • Reporting Supervisor (NIK) │
│  • Skill & Skill Level    • Employment Status          │
└───────────────────────────┬────────────────────────────┘
                            │ (Optional 1-to-1 Link)
                            ▼
┌────────────────────────────────────────────────────────┐
│                          USER                          │
│  • Username / Email       • Is Active / Locked         │
│  • Assigned Roles (RBAC)  • Delegated Approver Ref     │
│  • Plant Scope Grants     • Last Login & Session Info  │
└────────────────────────────────────────────────────────┘
```

*Contoh Nyata*:
* *Operator Joko* $\rightarrow$ Employee ID `EMP-0412`, Plant Batam, Department Stamping, Skill: Stamping Level 3. **Tanpa User Account** (hanya diassign ke Work Center & Manpower Schedule).
* *Budi Santoso* $\rightarrow$ Employee ID `EMP-0105`, Position: PPIC Planner, Plant Batam $\rightarrow$ Memiliki User Account `budi.ppic` dengan Role `PPIC_PLANNER`.

### 2.2 Organization Hierarchy Data Model

```
Company (PT Kranex Manufacturing Indonesia)
  └── Plant (Plant 1 - Batam, Plant 2 - Cikarang)
        └── Department (PPIC, Production, Quality, Engineering, Warehouse, Maintenance)
              └── Section (Stamping Section, Assembly Line A, Incoming QC)
                    └── Position / Job (Plant Manager, PPIC Manager, Planner, Supervisor, Inspector)
```

* **Attributes Position / Job**:
  * `id`, `code` (e.g. `POS-MGR-PPIC`, `POS-SPV-PROD`)
  * `title` (e.g. "PPIC Manager", "Production Supervisor")
  * `departmentId`, `parentPositionId` (Reporting hierarchy for multi-level approvals)
  * `approvalAuthorityLimit` (Batas nominal/otoritas approval default)

---

## 3. DOMAIN 2: SECURITY, RBAC & PERMISSION SPECIFICATION

### 3.1 Permission Token Standard

Setiap aksi transaksi diatur oleh token permission berformat `domain.entity.action`:

| Domain | Entity | Actions | Contoh Permission Token |
|---|---|---|---|
| `planning` | `production_plan` | `create`, `edit`, `submit`, `cancel` | `planning.production_plan.submit` |
| `planning` | `finite_schedule` | `simulate`, `freeze`, `dispatch` | `planning.finite_schedule.dispatch` |
| `workflow` | `approval` | `view_inbox`, `approve`, `reject`, `delegate` | `workflow.approval.approve` |
| `manufacturing` | `work_order` | `release`, `start`, `pause`, `complete` | `manufacturing.work_order.release` |
| `engineering` | `bom` | `create_draft`, `submit_eco`, `approve` | `engineering.bom.approve` |
| `procurement` | `purchase_req` | `create`, `approve_tier1`, `approve_tier2` | `procurement.purchase_req.approve_tier1` |
| `security` | `role` | `assign`, `configure` | `security.role.assign` |

### 3.2 Standard Enterprise Roles
1. `SUPER_ADMIN`: Akses penuh ke seluruh konfigurasi sistem, audit, dan security.
2. `PLANT_MANAGER`: Otoritas level tertinggi di plant, approver untuk order bernilai tinggi, override scheduler.
3. `PPIC_MANAGER`: Approver MPS, Master Production Plan, MRP release, dan finite schedule dispatches.
4. `PPIC_PLANNER`: Drafter demand, production planner, simulasi finite scheduling, dan material reservation.
5. `PRODUCTION_MANAGER`: Approver rilis Work Order, perubahan line, dan permohonan overtime shift.
6. `PRODUCTION_SUPERVISOR`: Dispatcher job di shop floor, alokasi operator, validasi output & scrap.
7. `QUALITY_MANAGER`: Approver QC Plan, disposisi hold/quarantine, sign-off Product Release Package (NPI).
8. `ENGINEERING_MANAGER`: Approver Drawing, BOM, Routing, dan Engineering Change Request (ECR/ECO).
9. `WAREHOUSE_MANAGER`: Otoritas transfer material, penerimaan GRN, dan release reserved stock.

---

## 4. DOMAIN 3: GENERIC CONFIGURABLE WORKFLOW ENGINE

Workflow Engine dirancang **independen dan generic**, bukan hardcoded untuk PPIC saja.

### 4.1 Generic Workflow State Machine Model

```
┌─────────┐   Submit    ┌───────────┐  All Levels Approved  ┌──────────┐
│  DRAFT  │ ──────────> │ PENDING   │ ────────────────────> │ APPROVED │
└─────────┘             │ APPROVAL  │                       │/RELEASED │
    ▲                   └─────┬─────┘                       └──────────┘
    │                         │ Any Level Rejected
    │    Revise / Resubmit    ▼
    └─────────────────── ┌──────────┐
                         │ REJECTED │
                         └──────────┘
```

Setiap workflow request menyimpan metadata terstruktur:
* `id`: Unique Approval Request ID (e.g. `APR-2026-0089`)
* `transactionType`: `PRODUCTION_PLAN` | `WORK_ORDER` | `BOM_CHANGE` | `PURCHASE_REQ` | `NPI_GATE`
* `transactionId`: ID entitas sumber (e.g. `PP-2026-001`, `PR-2026-0412`)
* `transactionNumber`: Nomor dokumen yang mudah dibaca user
* `title`: Ringkasan transaksi (e.g. "Production Plan PP-2026-001 (10,000 pcs FG-001)")
* `submitter`: `{ employeeId, userId, name, department }`
* `submittedAt`: ISO Timestamp
* `currentStepIndex`: 1, 2, 3...
* `totalSteps`: Jumlah level approval yang dipersyaratkan oleh Approval Matrix
* `steps`: Array detail approver per level (status `PENDING`, `APPROVED`, `REJECTED`, `DELEGATED`)
* `overallStatus`: `SUBMITTED` | `IN_REVIEW` | `APPROVED` | `REJECTED` | `CANCELLED`
* `payloadSnapshot`: Snapshot JSON dari data yang disetujui untuk memastikan integritas data (tidak ada mutasi diam-diam selama masa approval).

---

## 5. DOMAIN 4: CONFIGURABLE APPROVAL MATRIX ENGINE

Tidak boleh ada pengkondisian hardcode seperti `if (type === 'plan') approve(ppicManager)`.
Approval Matrix dikonfigurasi melalui aturan berbasis kriteria (*Rule-Based Condition Evaluation*).

### 5.1 Approval Matrix Schema

```typescript
export interface ApprovalMatrixRule {
  id: string;
  name: string;
  transactionType: 'PRODUCTION_PLAN' | 'WORK_ORDER' | 'BOM_CHANGE' | 'PURCHASE_REQ' | 'NPI_GATE';
  priority: number; // Evaluated highest priority first
  isActive: boolean;
  conditions: {
    plantId?: string;           // e.g. "PLANT-BATAM"
    departmentId?: string;      // e.g. "DEPT-PPIC"
    minValue?: number;          // e.g. Rp 100,000,000 or 5,000 pcs
    maxValue?: number;          // e.g. Rp 500,000,000 or Infinity
    productCategory?: string;   // e.g. "AUTOMOTIVE_SAFETY"
    changeClassification?: 'MAJOR' | 'MINOR';
  };
  levels: {
    levelNumber: number;
    levelName: string;
    approverType: 'POSITION' | 'ROLE' | 'DIRECT_SUPERVISOR' | 'SPECIFIC_USER';
    approverTarget: string; // e.g. "POS-MGR-PPIC" or "ROLE_PROD_MGR"
    slaHours: number;       // e.g. 24 hours before escalation
    canDelegate: boolean;
  }[];
}
```

### 5.2 Real Enterprise Matrix Examples

#### Kasus A: Production Plan
* **Kondisi**: `Plant = Batam`, `Quantity > 5,000 pcs`
* **Level 1**: PPIC Manager (`POS-MGR-PPIC` atau `Role: PPIC_MANAGER`)
* **Level 2**: Production Manager (`POS-MGR-PROD` atau `Role: PRODUCTION_MANAGER`)
* **Level 3**: Plant Manager (`POS-MGR-PLANT` atau `Role: PLANT_MANAGER`)

#### Kasus B: BOM Change / Engineering Change Order (ECO)
* **Kondisi**: `TransactionType = BOM_CHANGE`, `Classification = MAJOR`
* **Level 1**: Engineering Manager (`POS-MGR-ENG`)
* **Level 2**: Quality Manager (`POS-MGR-QA`)
* **Level 3**: Production Manager (`POS-MGR-PROD`)

#### Kasus C: Purchase Requisition (PR)
* **Threshold < Rp 10,000,000**:
  * Level 1: Department Supervisor (`DIRECT_SUPERVISOR`)
* **Threshold Rp 10,000,000 – Rp 100,000,000**:
  * Level 1: Department Supervisor
  * Level 2: Department Manager
* **Threshold > Rp 100,000,000**:
  * Level 1: Department Manager
  * Level 2: Finance Manager
  * Level 3: Plant Director

---

## 6. DOMAIN 5: DELEGATION & ESCALATION ARCHITECTURE

### 6.1 Approval Delegation Engine
Ketika pejabat otoritas sedang cuti, dinas luar, atau berhalangan, alur transaksi **tidak boleh mandek (stuck)**.

* **Delegation Record Schema**:
  * `id`: Delegasi unik (`DLG-2026-004`)
  * `fromUserId` / `fromPosition`: Approver asal (e.g. PPIC Manager)
  * `toUserId` / `toPosition`: Pelaksana Tugas / Acting Approver (e.g. Senior Planner)
  * `startDate`: Tanggal mulai berlaku (e.g. `2026-10-25 00:00`)
  * `endDate`: Tanggal berakhir (e.g. `2026-10-30 23:59`)
  * `scope`: `ALL` | `PRODUCTION_PLAN` | `PURCHASE_REQ`
  * `reason`: Catatan delegasi resmi (e.g. "Annual Leave / Cuti Tahunan")
  * `status`: `ACTIVE` | `EXPIRED` | `REVOKED`
* **Execution Logic**:
  * Saat Approval Request masuk, sistem mengecek tabel delegasi aktif:
    $$\text{Effective Approver} = \text{Delegation.isActive}(\text{Original Approver},\ \text{Now}) \ ?\ \text{Delegatee} : \text{Original Approver}$$
  * Di riwayat approval tercatat: *"Approved by Joko (Acting PPIC Manager on behalf of Budi Santoso per DLG-2026-004)"*.

### 6.2 Escalation Engine
* **SLA Level 1 (24 Jam)**: Jika request berstatus `PENDING` melampaui SLA $24\text{ jam}$, sistem menerbitkan **Reminder Notification** bertanda kuning.
* **SLA Level 2 (48 Jam)**: Jika belum ada tindakan setelah $48\text{ jam}$, sistem secara otomatis **meng-eskalasi tiket approval** ke atasan langsung approver (atau Plant Director) dan membubuhkan event log *"AUTO_ESCALATED_SLA_BREACH"*.

---

## 7. DOMAIN 6: MASTER DATA GOVERNANCE & REVISION CONTROL

### 7.1 Domain Separation & Data Ownership
Master data dikelompokkan dalam sub-domain ketat:
1. `Organization`: Company, Plant, Department, Section, Position.
2. `People`: Employee, Employee Assignment, Skill, Skill Matrix.
3. `Security`: User Account, Role, Permission, User Role Mapping.
4. `Approval`: Approval Type, Approval Matrix Rules, Delegation Registry.
5. `Manufacturing`: Item Master, BOM, Routing, Operation, Machine, Work Center, Tooling, Calendar.
6. `Planning`: Capacity Rules, Scheduling Rules, Changeover Matrix, Planning Horizon.
7. `System`: Numbering Sequences, Status Definitions, Notification Rules, Audit Trails.

### 7.2 Revision & Effective Date Invariant (Rule 10)
* Setiap perubahan struktur Item, BOM, atau Routing menghasilkan nomor revisi baru (`REV-A` $\rightarrow$ `REV-B`) dengan atribut:
  * `effectiveFrom`: Tanggal mulai berlaku.
  * `effectiveTo`: Tanggal habis masa berlaku.
  * `supersededBy`: Nomor revisi pengganti.
* **In-Flight Order Isolation**:
  * Work Order yang sudah berstatus `RELEASED` atau `IN_PROGRESS` **wajib mengunci snapshot revisi saat rilis**.
  * Rilis revisi baru di Master Data **tidak boleh memutasi atau merusak riwayat transaksi yang sedang berjalan di lantai pabrik**.

---

## 8. DOMAIN 7: IMMUTABLE AUDIT TRAIL ENGINE

Setiap mutasi pada organisasi, security, master data, dan alur approval dicatat dalam cryptographic hash-chained audit log:

```typescript
export interface EnterpriseAuditLog {
  id: string;
  timestamp: string;
  domain: 'ORGANIZATION' | 'SECURITY' | 'WORKFLOW' | 'MASTER_DATA' | 'PLANNING' | 'EXECUTION';
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SUBMIT' | 'APPROVE' | 'REJECT' | 'DELEGATE' | 'ESCALATE';
  entityType: string;
  entityId: string;
  entityNumber: string;
  actorUserId: string;
  actorEmployeeName: string;
  actorPositionTitle: string;
  actorRole: string;
  ipAddress?: string;
  previousPayloadHash?: string;
  currentPayloadHash: string;
  changeSummary: string;
  details: {
    before?: Record<string, any>;
    after: Record<string, any>;
  };
}
```

---

## 9. DOMAIN 8: NOTIFICATION SYSTEM & EVENT BUS

* **Badge Counter**: Menampilkan lencana liveness di bilah navigasi atas (e.g. `🔔 3 Approval Pending`).
* **Kategori Notifikasi**:
  1. `APPROVAL_PENDING`: Transaksi baru membutuhkan tindakan pengguna.
  2. `APPROVAL_DECISION`: Transaksi yang diajukan pengguna disetujui / ditolak.
  3. `DELEGATION_ALERT`: Pengguna ditunjuk sebagai acting approver.
  4. `SLA_WARNING`: Peringatan batas waktu approval mendekati jatuh tempo.
  5. `CAPACITY_EXCEPTION`: Shortage material atau defisit kapasitas mesin/operator.

---

## 10. DOMAIN 9 & 10: WORKFLOW CENTER & APPROVAL INBOX

Workflow Center dijadikan **menu navigasi utama mandiri (Level 1 Nav)**:

### 10.1 Workflow Menu Breakdown
* **My Tasks / Approval Inbox**:
  * Daftar transaksi yang menunggu tindakan user yang sedang login (atau yang didelegasikan ke user tersebut).
  * Filter berdasarkan: Tipe Transaksi (`Production Plan`, `BOM Change`, `PR`, `Work Order`), Urgensi, Plant.
  * **Interactive Decision Drawer**:
    * Snapshot data lengkap transaksi.
    * Ringkasan dampak: Kalkulasi kapasitas (untuk Plan), Nilai nominal & budget (untuk PR), Diff BOM (untuk ECO).
    * Action Buttons: **Approve**, **Reject** (Wajib isi alasan), **Delegate**, **Request Info**.
* **Approval Requests (Diajukan Saya)**:
  * Melacak status transaksi yang dibuat oleh user: sedang menunggu siapa di level berapa.
* **Pending Approvals**:
  * Tampilan transparansi manajerial: melihat seluruh antrean approval lintas departemen.
* **Approval History**:
  * Arsip permanen semua keputusan persetujuan/penolakan masa lalu lengkap dengan stempel waktu dan tanda tangan digital.
* **Workflow Monitoring**:
  * Dashboard lead time approval (Berapa jam rata-rata dari Submit sampai Release per departemen) dan deteksi bottleneck approval.

---

## 11. VERIFIKASI MATEMATIKA & TEST SCENARIOS (DOD MATRIX)

1. **Test Scenario TS-GOV-01**: *Segregation of Employee vs User Account*
   * 12 Employee terdaftar (8 Operator, 2 Inspector, 1 Planner, 1 Manager).
   * Hanya 2 User Account yang aktif (Planner dan Manager). Operator tetap dapat dijadwalkan di Manpower Matrix tanpa akun login.
2. **Test Scenario TS-GOV-02**: *Configurable Approval Matrix Multi-Tier*
   * Submit Production Plan `PP-2026-001` (10,000 pcs FG-001).
   * Level 1 (PPIC Manager) Approve $\rightarrow$ Status berubah ke `IN_REVIEW (Step 2/3)`.
   * Level 2 (Production Manager) Approve $\rightarrow$ Status berubah ke `IN_REVIEW (Step 3/3)`.
   * Level 3 (Plant Manager) Approve $\rightarrow$ Status `APPROVED / RELEASED`, otomatis membuka opsi dispatch Work Order.
3. **Test Scenario TS-GOV-03**: *Approval Delegation Test*
   * PPIC Manager mendelegasikan wewenang ke Acting PPIC Manager tanggal 25–30 Okt.
   * Transaksi masuk ke inbox Acting Manager. Setelah di-approve, log audit mencatat *"Approved on behalf of PPIC Manager"*.
4. **Test Scenario TS-GOV-04**: *Revision Snapshot Freeze (Rule 10)*
   * Work Order berjalan pada BOM `REV-A`.
   * Engineering merilis BOM `REV-B`.
   * Work Order yang sedang berjalan tetap mengonsumsi komponen sesuai `REV-A`, audit log membuktikan integritas historis.

---
*Dokumen ini merupakan baseline arsitektural resmi yang siap diturunkan ke Master Execution Prompt untuk implementasi kode modular.*
