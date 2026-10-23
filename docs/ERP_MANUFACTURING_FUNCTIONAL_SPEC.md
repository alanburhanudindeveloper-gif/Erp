# ERP MANUFACTURING — USE CASE & FUNCTIONAL REQUIREMENTS SPECIFICATION
**Version:** 0.1  
**Status:** Draft Baseline (Developer & Architecture Ready)  
**System Target:** Kranex Industrial ERP (Discrete & Hybrid Manufacturing)  
**Document Purpose:** Baseline reference for UI/UX, Frontend & Backend Development, Database Schema, REST/RPC APIs, QA Testing Matrix, and UAT Signoff.

---

## 1. Documentation Principles & Execution Hierarchy

Setiap modul dan fitur dalam ERP ini mematuhi rantai dekomposisi requirement berikut:

```
Business Process (BP)
       │
       ▼
Use Case (UC) ───► Actor, Trigger, Preconditions, State Transition
       │
       ▼
System Function (FN) ───► Method Signature, Parameters, Return Types
       │
       ▼
Functional Requirement (FR) ───► Input, Processing, Output, Exception Handling
       │
       ▼
Business Rules (BR) ───► Immutable Constraints, Formula, Authorization
       │
       ▼
Acceptance Criteria (AC) ───► Given - When - Then (Positive & Negative Scenarios)
       │
       ▼
Test Case (TC) ───► Automated E2E, Unit, and Integration Test Scenarios
```

---

## 2. Actor / Role Matrix & Segregation of Duties (SoD)

| Role Code | Role Name | Primary Responsibilities | Strict Restrictions & SoD |
| :--- | :--- | :--- | :--- |
| **SYS_ADMIN** | System Administrator | User management, role provisioning, plant/warehouse setup, global configuration. | Tidak boleh memposting transaksi inventaris atau menyetujui PO/PR tanpa approval role. |
| **MD_ADMIN** | Master Data Admin | Item Master, UOM, Conversion Factors, Supplier & Customer master records. | Tidak boleh membuat Production Order atau melakukan posting receiving. |
| **ENG** | Manufacturing Engineer | Bill of Materials (BOM), Routing sequences, Work Center technical parameters, Tooling. | Tidak boleh mengubah harga item atau mengedit stock ledger. |
| **PLANNER** | PPIC / Production Planner | Demand forecasting, MPS generation, MRP execution, Planned Order conversion. | Tidak boleh menjalankan operasi fisik di Shop Floor. |
| **BUYER** | Procurement Officer | Purchase Requisition (PR) review, Purchase Order (PO) creation, vendor negotiations. | **SoD Rule:** Tidak boleh menyetujui PO yang dibuat sendiri jika > threshold; tidak boleh menerima barang fisik di gudang. |
| **WH_OPERATOR** | Warehouse Operator | Receiving (GRN), Putaway, Bin-to-bin Transfer, Production Issue (Kitting), Stock Count. | Tidak boleh merilis Production Order atau mengubah status Quality Inspection. |
| **PROD_OPERATOR** | Shop Floor Operator | Start/Complete Operation, record run-time, submit output tally (Good/Scrap/Rework). | Hanya dapat mengakses Work Center yang di-assign; tidak boleh mengubah BOM/Routing. |
| **PROD_SUPERVISOR**| Production Supervisor | Work order assignment, shift changeover signoff, downtime approval, scrap authorization. | Tidak boleh melakukan post financial closure. |
| **QA_INSPECTOR** | Quality Control Inspector| Receiving inspection, In-process inspection, Final QC, Stock Quarantine/Hold, NCR & CAPA. | **SoD Rule:** Hasil inspeksi independen dari target output produksi; tidak dapat di-override oleh operator. |
| **APPROVER_MGR** | Management / Approver | Persetujuan hierarkis PR, PO, Stock Adjustment variance, dan Production Order bypass. | Tidak boleh membuat draft transaksi yang kemudian disetujui sendiri (No Self-Approval). |
| **MAINTENANCE** | Maintenance Technician | Machine downtime logging, PM work orders, spare part consumption, MTBF/MTTR tracking. | Tidak boleh mengubah status stock barang jadi (FG). |
| **EXT_INTEGRATION**| Integration Agent / API | Syncing EDI, MES machine telemetry, barcode scanners, and AI Gateway proxies. | Read/Write terbatas pada endpoint dengan signature token valid. |

---

## 3. Global System Rules (Immutable Architecture Rules)

- **BR-GLOBAL-001 (Master Data Lifecycle):** Entitas master data dengan status `INACTIVE` atau `DEPRECATED` dilarang digunakan dalam transaksi baru. Transaksi historis yang merujuk padanya tetap mempertahankan snapshot data saat transaksi dibuat.
- **BR-GLOBAL-002 (Deterministic Transaction Identifiers):** Setiap transaksi memiliki penomoran unik terurut dengan format: `[PREFIX]-[YYYY]-[SEQUENCE_6_DIGIT]` (contoh: `PR-2026-000101`, `PO-2026-000204`, `GRN-2026-000089`, `MO-2026-000124`, `TRF-2026-000045`, `ADJ-2026-000012`).
- **BR-GLOBAL-003 (Deterministic State Machine):** Setiap dokumen transaksi memiliki lifecycle state yang kaku. Aksi pengguna hanya diizinkan bila memenuhi matriks transisi state yang sah.
- **BR-GLOBAL-004 (Immutable Ledger / No In-Place Deletions):** Transaksi yang telah berstatus `POSTED` atau `COMPLETED` tidak boleh diubah nilainya atau dihapus dari basis data. Koreksi kesalahan wajib menggunakan mekanisme **Reversal**, **Adjustment Order**, atau **Credit/Debit Note** dengan referensi ke transaksi asal.
- **BR-GLOBAL-005 (Comprehensive Audit Trail):** Setiap mutasi data wajib merekam payload log: `timestamp_utc`, `user_id`, `user_name`, `role`, `action_type`, `entity_name`, `entity_id`, `before_state`, `after_state`, `reason_code`, dan `client_ip`.
- **BR-GLOBAL-006 (Contextual Multi-Plant Authorization):** Akses data dibatasi oleh kombinasi: `User` × `Role` × `Plant_ID` × `Warehouse_ID`. Pengguna di Plant A tidak dapat memutasikan stok di Plant B tanpa hak cross-plant transfer.
- **BR-GLOBAL-007 (Idempotency & Duplicate Prevention):** Setiap tombol aksi submit pada UI wajib menerapkan idempotency token dan disabling state untuk mencegah duplikasi data akibat double-click atau network retry.
- **BR-GLOBAL-008 (Actionable Error Propagation):** Respon error dari API atau UI tidak boleh menampilkan pesan generik ("Error 500"). Pesan error wajib memuat:
  1. *What failed* (e.g., "Insufficient available stock for RM-STL-01"),
  2. *Root condition* (e.g., "Required: 200 KG, Available: 140 KG, Allocated/Hold: 60 KG"),
  3. *Actionable resolution* (e.g., "Issue release from QC Hold Lot #L-991 or submit Purchase Requisition").

---

## 4. Master Data Architecture

```
┌──────────────┐       1:N       ┌────────────────────────┐
│  Item Master │ ─────────────── │  Bill of Materials     │
│  (Product)   │                 │  (Header & Components) │
└──────┬───────┘                 └───────────┬────────────┘
       │ 1:N                                 │
       ▼                                     ▼
┌──────────────┐                 ┌────────────────────────┐
│   Routing    │ ─────────────── │    Production Order    │
│ (Operations) │                 │    (Snapshot Version)  │
└──────┬───────┘                 └────────────────────────┘
       │ N:1
       ▼
┌──────────────┐
│ Work Center  │
│  (Machine)   │
└──────────────┘
```

### UC-MD-001: Manage Item Master
- **Function:** `createItem(itemPayload: ItemDTO): Promise<ItemResult>`
- **Preconditions:** User memiliki permission `MD_ITEM_CREATE`.
- **Inputs:** `itemCode`, `itemName`, `itemType` (`RAW_MATERIAL` | `SEMI_FINISHED` | `FINISHED_GOOD` | `CONSUMABLE`), `uomCode`, `category`, `lotControlEnabled` (boolean), `minStock`, `maxStock`, `standardCost`.
- **Validations:**
  - `itemCode` unik global (regex: `^[A-Z0-9_-]{3,20}$`).
  - `uomCode` harus terdaftar dan aktif dalam tabel UOM.
  - Jika `lotControlEnabled = true`, transaksi penerimaan dan pengeluaran wajib mengisi nomor lot.
- **Business Rule:** Item dengan status `DRAFT` tidak dapat digunakan dalam BOM aktif atau Purchase Requisition.
- **Acceptance Criteria (AC-MD-001):**
  - *Given* form item diisi dengan SKU `FG-KRNX-01` yang belum pernah ada,
  - *When* admin menekan Simpan,
  - *Then* sistem membuat entitas dengan status `ACTIVE`, mencatat audit log, dan mengembalikan status 201.
  - *Negative Case:* Jika SKU `FG-KRNX-01` sudah ada, sistem menolak penyimpanan dengan error `ERR_ITEM_DUPLICATE_CODE`.

### UC-MD-003: Manage Bill of Materials (BOM) & Revisioning
- **Function:** `createBomRevision(bomPayload: BomDTO): Promise<BomRevisionResult>`
- **Inputs:** `parentItemId`, `revisionNumber`, `effectiveStartDate`, `effectiveEndDate`, `components: { componentItemId, quantity, uom, scrapPct }[]`.
- **Validations:**
  - Tidak boleh terjadi **Circular Dependency** (A membutuhkan B, dan B membutuhkan A).
  - Setiap komponen harus aktif dan memiliki tipe item yang valid (Finished Good tidak boleh menjadi komponen dirinya sendiri).
  - `quantity > 0` dan `scrapPct >= 0`.
- **Immutable Rule (BR-MD-003):** Saat Production Order dibuat, sistem menyimpan *snapshot copy* dari BOM Revision yang aktif pada tanggal order. Perubahan pada master BOM di kemudian hari tidak boleh merubah BOM pada Production Order yang sedang berjalan atau sudah selesai.

### UC-MD-004: Manage Routing & Work Centers
- **Function:** `createRouting(routingPayload: RoutingDTO): Promise<RoutingResult>`
- **Inputs:** `productId`, `routingCode`, `operations: { sequence, operationName, workCenterId, setupTimeMinutes, runTimeMinutesPerUnit, qcCheckpointRequired }[]`.
- **Validations:**
  - `sequence` harus kelipatan 10 terurut (10, 20, 30...).
  - `workCenterId` harus valid, aktif, dan memiliki kapasitas harian terdefinisi.
  - Jika `qcCheckpointRequired = true`, sistem mewajibkan trigger QC Inspection sebelum operasi berikutnya dapat dimulai.

---

## 5. Procurement & Inbound Execution

### State Machine: Purchase Requisition (PR) & Purchase Order (PO)
```
[PR Lifecycle]
DRAFT ──► PENDING_APPROVAL ──┬──► APPROVED ──► PO_GENERATED ──► CLOSED
                             └──► REJECTED

[PO Lifecycle]
DRAFT ──► PENDING_APPROVAL ──┬──► APPROVED ──► PARTIALLY_RECEIVED ──► FULLY_RECEIVED ──► CLOSED
                             └──► REJECTED
```

### UC-PRC-001 & 002: Create & Approve Purchase Requisition (PR)
- **Function:** `createPurchaseRequisition(prPayload: PrDTO): Promise<PR>`
- **Approval Engine Thresholds:**
  - `Total < Rp 10,000,000`: Approval level 1 (Department Supervisor).
  - `Rp 10,000,000 - Rp 100,000,000`: Approval level 2 (Plant Manager).
  - `Total > Rp 100,000,000`: Approval level 3 (Operations Director).
- **SoD Rule (BR-PRC-002):** Pembuat dokumen (Requester) tidak boleh menyetujui dokumen miliknya sendiri, bahkan jika ia memiliki hak akses approval.

### UC-PRC-004: Inbound Receiving & Goods Receipt Note (GRN)
- **Function:** `postGoodsReceipt(poId: string, receivedItems: ReceiptLineItem[]): Promise<GrnResult>`
- **Flow:**
  1. Operator gudang memilih nomor PO aktif (`APPROVED` atau `PARTIALLY_RECEIVED`).
  2. Input kuantitas fisik yang tiba per item dan tentukan nomor lot supplier (`supplierLotNumber`).
  3. Cek parameter item master:
     - Jika item memerlukan QC (`incomingQcRequired = true`): Stok dimasukkan ke status `HOLD / QUARANTINE` dan otomatis membuat tugas `QualityInspection`.
     - Jika item non-QC: Stok langsung berstatus `AVAILABLE` di gudang penerimaan.
  4. Posting GRN menghasilkan entri transaksi pada **Stock Ledger** (`StockMovement`).
  5. Sistem memperbarui kuantitas PO: Jika semua kuantitas terpenuhi, PO beralih ke `FULLY_RECEIVED`.

---

## 6. Inventory Ledger & Warehouse Management

### UC-INV-001: Multi-Bucket Stock Segregation
Sistem memisahkan stok dalam 5 status independen per SKU, Lot, dan Lokasi Gudang:
1. `AVAILABLE`: Stok bebas yang siap dialokasikan untuk produksi atau pengiriman.
2. `RESERVED / ALLOCATED`: Stok yang telah dikomitkan ke Production Order yang berstatus `RELEASED`.
3. `HOLD / QUARANTINE`: Stok dalam inspeksi QC, isolasi kegagalan batch, atau investigasi NCR.
4. `REJECTED`: Stok yang terbukti cacat dan menunggu proses retur ke vendor atau pemusnahan (scrap).
5. `WIP (Work-in-Process)`: Material yang sedang berada di stasiun kerja dan belum menjadi barang jadi.

### UC-INV-002: Atomic Stock Transfer
- **Function:** `transferStock(sourceLoc: Location, destLoc: Location, sku: string, qty: number, lot: string): Promise<TransferResult>`
- **Rule (BR-INV-002):** Transaksi transfer wajib dijalankan dalam single database transaction (ACID). Pengurangan kuantitas di gudang asal dan penambahan kuantitas di gudang tujuan wajib terjadi serentak; jika salah satu gagal, sistem melakukan rollback penuh.

### UC-INV-003: Issue Material to Production Order
- **Rule (BR-INV-003):** 
  - Material hanya dapat dikeluarkan untuk Production Order yang berstatus `RELEASED` atau `IN_PROGRESS`.
  - Sistem melarang pengeluaran material dengan status `HOLD` atau `REJECTED`.
  - Mendukung dua mode: **Manual Kitting Issue** (scan lot fisik saat penyerahan material) dan **Backflush Consumption** (konsumsi otomatis berdasarkan output produk jadi).

---

## 7. Planning & Deterministic MRP Engine

```
Input Sources:
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Sales Orders │   │ Forecast MPS │   │ Safety Stock │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
                          ▼
             ┌─────────────────────────┐
             │ Deterministic MRP Run   │
             │ (Formula-driven Engine) │
             └────────────┬────────────┘
                          │
     ┌────────────────────┴────────────────────┐
     ▼                                         ▼
┌───────────────────────────┐     ┌───────────────────────────┐
│ Planned Production Orders │     │ Planned Purchase Orders   │
│ (Make recommendations)    │     │ (Buy recommendations)     │
└───────────────────────────┘     └───────────────────────────┘
```

### UC-PLAN-002: Deterministic MRP Run
- **Function:** `executeMrpCalculation(planningHorizonDays: number): MrpExecutionOutput`
- **Core Calculation Formula:**
  $$\text{Net Requirement} = \text{Gross Requirement} + \text{Safety Stock} - (\text{Stock On-Hand} + \text{Scheduled Receipts}) + \text{Allocated Stock}$$
- **BOM Explosion Rule (BR-MRP-003):** Sistem meledakkan BOM secara rekursif dari Level 0 (Finished Good) ke Level 1, 2, ..., n dengan mempertimbangkan `Lead Time Offset` (waktu pemesanan komponen disesuaikan dengan waktu mulai operasi perakitan).
- **Determinism Mandate (BR-MRP-010):** Dengan dataset snapshot permintaan, stok, dan PO terbuka yang sama, hasil perhitungan MRP **wajib 100% identik**. AI dilarang mengubah kalkulasi aritmatika kuantitas material secara otonom tanpa review planner.

---

## 8. Production Execution & Shop Floor Control

### State Machine: Production Order (MO)
```
DRAFT ──► PLANNED ──► RELEASED ──► IN_PROGRESS ──► COMPLETED ──► CLOSED
  │          │           │
  └── CANCELLED ─────────┘
```

### UC-PROD-001: Create Production Order
- **Function:** `createProductionOrder(dto: CreateMoDTO): Promise<ProductionOrder>`
- **Automated Processing:**
  1. Generate nomor order unik `MO-[YYYY]-[SEQUENCE]`.
  2. Kunci (freeze) snapshot BOM Revision dan Routing Revision yang berlaku pada `plannedStartDate`.
  3. Hitung kebutuhan bruto seluruh komponen ($Qty \times BomRatio \times (1 + ScrapFactor)$).
  4. Bentuk baris jadwal operasi pada tabel Work Order operations.

### UC-PROD-002: Release Production Order & Hard Allocation
- **Validation Before Release:**
  - Cek ketersediaan material komponen berstatus `AVAILABLE`.
  - Jika material cukup: Ubah status material menjadi `RESERVED` untuk order ini.
  - Jika terjadi kekurangan (shortage): Sistem memberikan peringatan eksplisit daftar material yang kurang dan memerlukan konfirmasi otorisasi supervisor sebelum dapat di-release.

### UC-PROD-004 & 006: Shop Floor Execution & Output Tally
- **Function:** `recordOperationOutput(moId: string, opSeq: number, tally: OutputTallyDTO): Promise<ExecutionResult>`
- **Parameters:** `goodQty`, `scrapQty`, `reworkQty`, `reasonCode`, `operatorId`, `runMinutes`.
- **Validation:**
  $$\text{Total Reported} = \text{Good} + \text{Scrap} + \text{Rework}$$
  - $\text{Total Reported}$ tidak boleh melebihi toleransi over-production (default maks +5% dari kuantitas order).
  - Jika `scrapQty > 0`, parameter `reasonCode` wajib diisi (contoh: `RC-TOOL-WEAR`, `RC-RAW-MAT-DEFECT`, `RC-OP-ERROR`).

### UC-PROD-005: Material Consumption (Manual Issue vs. Backflush)
- **Manual Issue:** Transaksi mutasi stok dibuat saat gudang menyerahkan material ke lantai produksi.
- **Backflush:** Saat kuantitas barang jadi diposting pada operasi akhir:
  $$\text{Deducted Stock} = \text{Good Output Qty} \times \text{Standard BOM Component Qty}$$
  Sistem otomatis mengurangi stok bahan baku dan membukukan harga pokok material ke akun WIP/FG.

### UC-PROD-009: Closing Production Order
- **Preconditions for Closure:**
  - Seluruh operasi wajib berstatus `COMPLETED`.
  - Tidak ada tugas QC terbuka (`IN_PROGRESS`) pada order terkait.
  - Seluruh alokasi material (`RESERVED`) telah dikonsumsi atau dikembalikan ke gudang.
  - Varian biaya (cost variance) antara Standar dan Aktual telah dihitung dan tercatat di ledger costing.

---

## 9. Quality Assurance & Non-Conformance Management

```
Inspection Trigger Point
 (GRN, In-Process, Final FG)
            │
            ▼
┌────────────────────────┐
│ Quality Inspection Task│
│ (Sample Size & Specs)  │
└───────────┬────────────┘
            │
    ┌───────┴───────┐
    ▼               ▼
[ PASSED ]     [ FAILED ]
    │               │
    ▼               ▼
Release to      Place Stock on HOLD
Available       Create Non-Conformance Report (NCR)
                    │
                    ▼
            ┌─────────────────────────────┐
            │ QA Disposition Committee    │
            │ • Scrap                     │
            │ • Rework Order              │
            │ • Return to Vendor (RTV)    │
            │ • Accept on Deviation (CAPA)│
            └─────────────────────────────┘
```

### UC-QA-001: Quality Inspection Execution
- **Function:** `recordInspectionResult(inspectionId: string, result: InspectionDTO): Promise<InspectionRecord>`
- **Flow:** Memuat batas toleransi parameter uji dari Engineering master. Operator QC mencatat nilai aktual (contoh: Ketebalan plat, Tensile strength, Dimensi). Jika nilai di luar toleransi, sistem otomatis menetapkan status `FAILED`.

### UC-QA-002 & 003: Stock Hold & Disposition
- Saat lot dinyatakan `FAILED`, stok otomatis dikunci dengan status `HOLD`.
- Tindakan disposisi resmi wajib didokumentasikan dengan persetujuan QA Manager:
  - **Rework:** Otomatis menghasilkan `ReworkOrder` dengan routing perbaikan.
  - **Scrap:** Memotong stok dari inventory dan mencatat kerugian pada akun Scrap Expense.
  - **Return to Supplier:** Menghasilkan dokumen memo debit vendor.

---

## 10. Traceability Matrix: Requirement to Test Case Mapping

| Use Case ID | Functional Req | Business Rule | Acceptance Criteria | Automated Test Case | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UC-MD-001** | FR-MD-001 | BR-GLOBAL-001 | AC-MD-001 | `tc-md-item-uniqueness` | Passed |
| **UC-MD-003** | FR-MD-003 | BR-MD-003 | AC-MD-003 | `tc-bom-circular-detection` | Passed |
| **UC-PRC-002**| FR-PRC-002 | BR-PRC-002 | AC-PRC-001 | `tc-pr-approval-threshold` | Passed |
| **UC-PRC-004**| FR-PRC-004 | BR-INV-001 | AC-PRC-004 | `tc-grn-qc-auto-routing` | Passed |
| **UC-INV-002** | FR-INV-002 | BR-INV-002 | AC-INV-002 | `tc-atomic-stock-transfer` | Passed |
| **UC-INV-003** | FR-INV-003 | BR-INV-003 | AC-INV-003 | `tc-prevent-hold-stock-issue` | Passed |
| **UC-PLAN-002**| FR-MRP-002 | BR-MRP-010 | AC-MRP-001 | `tc-deterministic-mrp-math` | Passed |
| **UC-PROD-001**| FR-PROD-001| BR-GLOBAL-002 | AC-PROD-001| `tc-mo-numbering-and-snapshot`| Passed |
| **UC-PROD-002**| FR-PROD-002| BR-PROD-002 | AC-PROD-002| `tc-mo-release-shortage-guard`| Passed |
| **UC-PROD-004**| FR-PROD-004| BR-PROD-004 | AC-PROD-004| `tc-operation-sequence-order`| Passed |
| **UC-PROD-007**| FR-PROD-007| BR-PROD-007 | AC-PROD-007| `tc-scrap-reason-code-enforce`| Passed |
| **UC-QA-002**  | FR-QA-002  | BR-QA-002  | AC-QA-002  | `tc-stock-hold-quarantine` | Passed |

---

## 11. Baseline Architectural Decisions (Resolving Section 26)

Untuk menghilangkan ambiguitas teknis pada tahap implementasi dan pengujian, parameter bisnis dibekukan dengan spesifikasi baku berikut:

1. **Manufacturing Model:** **Hybrid Make-to-Stock (MTS) & Make-to-Order (MTO)**. Item standar diproduksi berdasarkan safety stock & forecast MPS, sedangkan custom SKU dipicu langsung oleh Sales Order.
2. **Production Type:** **Discrete Manufacturing** (Assembly, Cutting, Machining, Welding, Stamping, Painting, Packaging).
3. **Material Consumption Policy:** **Configurable Dual-Method**. Default backflush otomatis saat penyelesaian operasi perakitan, dengan opsi manual scan lot issue untuk material bernilai tinggi (Class A Inventory).
4. **Tracking Level:** **Lot / Batch Number Tracking** wajib untuk seluruh Raw Material logam, resin kimia, dan Finished Goods. Tiap lot memiliki timestamp dan sertifikat analitik supplier.
5. **Quality Checkpoints:** Tiga pintu gerbang inspeksi wajib:
   - *Incoming QC (IQC)* pada saat penerimaan material di dermaga gudang.
   - *In-Process QC (IPQC)* pada checkpoint operasi kritis (misal: setelah welding/cutting).
   - *Final Outgoing QC (FQC)* sebelum barang jadi dipindahkan ke gudang distribusi.
6. **Costing Methodology:** **Standard Costing with Monthly Variance Analysis**. Menghitung varian harga material (Purchase Price Variance) dan varian efisiensi jam kerja (Labor/Overhead Efficiency Variance).
7. **Warehouse Hierarchy:** **Multi-Plant, Multi-Warehouse, Multi-Bin**. Format lokasi baku: `[PLANT]-[WAREHOUSE]-[AISLE]-[RACK]-[SHELF]` (contoh: `PLANT01-RM-WH-A02-R01-S03`).
8. **Segregation of Duties & Self-Approval:** **Strictly Forbidden**. Pengguna yang membuat transaksi PR/PO/Adjustment tidak dapat meng-approve transaksinya sendiri dalam kondisi apa pun.
9. **Financial Accounting Integration:** Arsitektur modular *Sub-ledger ready*. Seluruh transaksi material dan produksi menerbitkan entri jurnal debet/kredit otomatis ke akun buku besar umum (GL).
10. **Role of Artificial Intelligence:** **Strict Operational Advisory Layer**. AI Gateway digunakan untuk analisis anomali, ringkasan laporan operasional manajemen, pembacaan OCR PO masuk, dan rekomendasi penjadwalan. Seluruh kalkulasi material (MRP, BOM, Inventory, Costing) tetap **100% deterministik dan matematis**.
