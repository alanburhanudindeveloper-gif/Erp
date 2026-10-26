import test from 'node:test';
import assert from 'node:assert/strict';
import { explodeBom } from './bomExplosionService';
import type { BillOfMaterials, Product } from '../../types';

const mockProducts: Product[] = [
  {
    id: 'prod-fg-1',
    sku: 'FG-WIDGET-001',
    name: 'Standard Precision Widget',
    type: 'FINISHED_GOOD',
    baseUom: 'PCS',
    category: 'Electronics',
    makeOrBuy: 'MAKE',
    lotSerialPolicy: 'LOT',
    standardCost: 150,
    leadTimeDays: 3,
    safetyStock: 50,
    reorderPoint: 100,
    currentStock: 20,
    allocatedStock: 0,
    onOrderStock: 0,
    status: 'ACTIVE',
    description: 'Finished Widget',
  },
  {
    id: 'prod-sa-1',
    sku: 'SA-CIRCUIT-01',
    name: 'Control Circuit Sub-Assembly',
    type: 'SUB_ASSEMBLY',
    baseUom: 'PCS',
    category: 'PCBA',
    makeOrBuy: 'MAKE',
    lotSerialPolicy: 'LOT',
    standardCost: 80,
    leadTimeDays: 5,
    safetyStock: 20,
    reorderPoint: 40,
    currentStock: 10,
    allocatedStock: 2,
    onOrderStock: 0,
    status: 'ACTIVE',
    description: 'PCBA sub-assembly',
  },
  {
    id: 'prod-rm-1',
    sku: 'RM-CHIP-MCU',
    name: '32-Bit Microcontroller IC',
    type: 'RAW_MATERIAL',
    baseUom: 'PCS',
    category: 'Components',
    makeOrBuy: 'BUY',
    lotSerialPolicy: 'LOT',
    standardCost: 15,
    leadTimeDays: 14,
    safetyStock: 200,
    reorderPoint: 500,
    currentStock: 150,
    allocatedStock: 50,
    onOrderStock: 0,
    status: 'ACTIVE',
    description: 'MCU IC',
  },
  {
    id: 'prod-rm-2',
    sku: 'RM-ALUM-HOUSING',
    name: 'CNC Aluminum Enclosure',
    type: 'RAW_MATERIAL',
    baseUom: 'PCS',
    category: 'Metal',
    makeOrBuy: 'BUY',
    lotSerialPolicy: 'NONE',
    standardCost: 45,
    leadTimeDays: 7,
    safetyStock: 50,
    reorderPoint: 100,
    currentStock: 30,
    allocatedStock: 0,
    onOrderStock: 0,
    status: 'ACTIVE',
    description: 'Aluminum Housing',
  },
];

const mockBoms: BillOfMaterials[] = [
  {
    id: 'bom-fg-1',
    code: 'BOM-FG-WIDGET-01',
    revision: 'REV-A',
    productId: 'prod-fg-1',
    productSku: 'FG-WIDGET-001',
    productName: 'Standard Precision Widget',
    baseQuantity: 1,
    effectiveFrom: '2026-01-01',
    effectiveTo: '2099-12-31',
    bomType: 'STANDARD',
    status: 'ACTIVE',
    components: [
      {
        id: 'comp-1',
        componentProductId: 'prod-sa-1',
        componentSku: 'SA-CIRCUIT-01',
        componentName: 'Control Circuit Sub-Assembly',
        quantityPerUnit: 1,
        uom: 'PCS',
        scrapPercentage: 2, // 2% scrap
        unitCost: 80,
      },
      {
        id: 'comp-2',
        componentProductId: 'prod-rm-2',
        componentSku: 'RM-ALUM-HOUSING',
        componentName: 'CNC Aluminum Enclosure',
        quantityPerUnit: 1,
        uom: 'PCS',
        scrapPercentage: 0,
        unitCost: 45,
      },
    ],
  },
  {
    id: 'bom-sa-1',
    code: 'BOM-SA-CIRCUIT-01',
    revision: 'REV-B',
    productId: 'prod-sa-1',
    productSku: 'SA-CIRCUIT-01',
    productName: 'Control Circuit Sub-Assembly',
    baseQuantity: 1,
    effectiveFrom: '2026-01-01',
    effectiveTo: '2099-12-31',
    bomType: 'STANDARD',
    status: 'ACTIVE',
    components: [
      {
        id: 'comp-3',
        componentProductId: 'prod-rm-1',
        componentSku: 'RM-CHIP-MCU',
        componentName: '32-Bit Microcontroller IC',
        quantityPerUnit: 2, // 2 chips per PCBA
        uom: 'PCS',
        scrapPercentage: 1, // 1% scrap
        unitCost: 15,
      },
    ],
  },
];

test('explodeBom correctly resolves multi-level BOM hierarchy and scrap calculations', () => {
  const result = explodeBom('prod-fg-1', 100, mockProducts, mockBoms);

  assert.equal(result.hasCycle, false);
  assert.equal(result.rootProduct.sku, 'FG-WIDGET-001');

  // Should have SA-CIRCUIT-01 (L1), RM-ALUM-HOUSING (L1), and RM-CHIP-MCU (L2)
  assert.equal(result.requirements.length, 3);

  // Level 1: Sub-Assembly with 2% scrap: 100 * 1 * 1.02 = 102
  const saReq = result.requirements.find((r) => r.sku === 'SA-CIRCUIT-01');
  assert.ok(saReq);
  assert.equal(saReq.level, 1);
  assert.equal(saReq.grossQuantityRequired, 102);
  assert.equal(saReq.scrapQuantity, 2);
  // Available stock = current (10) - allocated (2) = 8
  // Net required = 102 - 8 = 94
  assert.equal(saReq.availableStock, 8);
  assert.equal(saReq.netQuantityRequired, 94);

  // Level 1: Aluminum Housing (0% scrap): 100 * 1 = 100
  const alumReq = result.requirements.find((r) => r.sku === 'RM-ALUM-HOUSING');
  assert.ok(alumReq);
  assert.equal(alumReq.grossQuantityRequired, 100);
  // Available stock = 30, net = 70
  assert.equal(alumReq.availableStock, 30);
  assert.equal(alumReq.netQuantityRequired, 70);

  // Level 2: MCU chips needed for 102 units of Sub-Assembly: 102 * 2 * 1.01 = 206.04
  const mcuReq = result.requirements.find((r) => r.sku === 'RM-CHIP-MCU');
  assert.ok(mcuReq);
  assert.equal(mcuReq.level, 2);
  assert.equal(mcuReq.grossQuantityRequired, 206.04);
  // Available stock = 150 - 50 = 100. Net = 206.04 - 100 = 106.04
  assert.equal(mcuReq.availableStock, 100);
  assert.equal(mcuReq.netQuantityRequired, 106.04);

  assert.ok(result.totalRollupCost > 0);
  assert.ok(result.criticalPathLeadTimeDays >= 14);
});

test('explodeBom throws error on unknown product identifier', () => {
  assert.throws(
    () => explodeBom('NON-EXISTENT-ID', 50, mockProducts, mockBoms),
    /Root product 'NON-EXISTENT-ID' was not found/
  );
});
