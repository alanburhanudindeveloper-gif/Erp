import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createMasterDataRepository } from './masterDataRepository';
import type { Product, BillOfMaterials } from '../../types';

describe('Master Data Repository Operations', () => {
  it('manages products and BOMs through authoritative persistence', () => {
    const repo = createMasterDataRepository([], [], [], [], []);

    const product: Product = {
      id: 'prd-test-1',
      sku: 'TEST-SKU-001',
      name: 'Test Product',
      type: 'FINISHED_GOOD',
      baseUom: 'PCS',
      category: 'Test Category',
      makeOrBuy: 'MAKE',
      lotSerialPolicy: 'LOT',
      standardCost: 100,
      leadTimeDays: 5,
      safetyStock: 10,
      reorderPoint: 20,
      currentStock: 50,
      allocatedStock: 0,
      onOrderStock: 0,
      status: 'ACTIVE',
      description: 'Test product description',
    };

    repo.saveProduct(product);
    assert.strictEqual(repo.listProducts().length, 1);
    assert.strictEqual(repo.findProductById('prd-test-1')?.sku, 'TEST-SKU-001');

    const bom: BillOfMaterials = {
      id: 'bom-test-1',
      code: 'BOM-TEST-001',
      revision: 'Rev A',
      productId: 'prd-test-1',
      productSku: 'TEST-SKU-001',
      productName: 'Test Product',
      baseQuantity: 1,
      effectiveFrom: '2026-01-01',
      effectiveTo: '2027-12-31',
      bomType: 'STANDARD',
      status: 'ACTIVE',
      components: [],
    };

    repo.saveBom(bom);
    assert.strictEqual(repo.listBoms().length, 1);
    assert.strictEqual(repo.findBomById('bom-test-1')?.code, 'BOM-TEST-001');
  });
});
