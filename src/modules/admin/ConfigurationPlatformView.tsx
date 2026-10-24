import React, { useState } from 'react';
import {
  Sliders,
  Layers,
  Workflow,
  Plus,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Lock,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  Database,
  Building2,
  CheckCircle2,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import {
  CustomFieldDefinition,
  CustomFieldEntityType,
  CustomFieldDataType,
  WorkflowDefinition,
  BusinessRule,
} from '../../types';

interface ConfigurationPlatformViewProps {
  customFields: CustomFieldDefinition[];
  onAddCustomField: (field: Omit<CustomFieldDefinition, 'id'>) => void;
  onToggleCustomField: (fieldId: string) => void;
  customValues: Record<string, Record<string, any>>;
  onSetCustomFieldValue: (entityId: string, fieldKey: string, value: any) => void;
  workflows: WorkflowDefinition[];
  onUpdateWorkflow: (workflow: WorkflowDefinition) => void;
  businessRules: BusinessRule[];
  onToggleBusinessRule: (ruleId: string) => void;
  currentUser: { id: string; name: string; role: string };
  onSwitchUser: (persona: { id: string; name: string; role: string }) => void;
}

const PERSONAS = [
  { id: 'usr-001', name: 'Dewi Lestari', role: 'PPIC Supervisor', dept: 'Production Planning' },
  { id: 'usr-002', name: 'Bambang Sutrisno', role: 'Procurement Manager', dept: 'Supply Chain' },
  { id: 'usr-003', name: 'Slamet Riyadi', role: 'Receiving Dock Lead', dept: 'Warehouse' },
  { id: 'usr-004', name: 'Agung Prasetyo', role: 'Shop Floor Operator', dept: 'Machining Plant 01' },
  { id: 'usr-005', name: 'Sari Wulandari', role: 'Quality Inspector', dept: 'QA / Quality Control' },
  { id: 'usr-006', name: 'Hendra Setiawan', role: 'Cost Accountant', dept: 'Finance & Costing' },
  { id: 'usr-007', name: 'Budi Santoso', role: 'Plant General Manager', dept: 'Plant Executive' },
];

export const ConfigurationPlatformView: React.FC<ConfigurationPlatformViewProps> = ({
  customFields,
  onAddCustomField,
  onToggleCustomField,
  customValues,
  onSetCustomFieldValue,
  workflows,
  onUpdateWorkflow,
  businessRules,
  onToggleBusinessRule,
  currentUser,
  onSwitchUser,
}) => {
  const [activeTab, setActiveTab] = useState<'custom-fields' | 'workflows' | 'business-rules' | 'rbac'>('custom-fields');

  // Custom Field Form State
  const [fieldEntity, setFieldEntity] = useState<CustomFieldEntityType>('PRODUCT');
  const [fieldKey, setFieldKey] = useState<string>('');
  const [fieldLabel, setFieldLabel] = useState<string>('');
  const [fieldDataType, setFieldDataType] = useState<CustomFieldDataType>('TEXT');
  const [fieldRequired, setFieldRequired] = useState<boolean>(false);
  const [fieldDefault, setFieldDefault] = useState<string>('');
  const [fieldOptions, setFieldOptions] = useState<string>('');
  const [selectedSimEntity, setSelectedSimEntity] = useState<string>('prd-001');

  // Workflow selection
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(workflows[0]?.id || 'wf-mo-default');
  const activeWorkflow = workflows.find((w) => w.id === selectedWorkflowId) || workflows[0];

  const handleCreateField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldKey || !fieldLabel) return;

    onAddCustomField({
      entityType: fieldEntity,
      fieldKey: fieldKey.trim().replace(/\s+/g, ''),
      label: fieldLabel.trim(),
      dataType: fieldDataType,
      required: fieldRequired,
      defaultValue: fieldDefault,
      options: fieldDataType === 'SELECT' ? fieldOptions.split(',').map((o) => o.trim()).filter(Boolean) : undefined,
      active: true,
      description: `Custom attribute for ${fieldEntity}`,
    });

    setFieldKey('');
    setFieldLabel('');
    setFieldDefault('');
    setFieldOptions('');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Platform Header */}
      <div className="bg-slate-900 text-white rounded-lg p-5 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded">
                CONFIGURABLE PLATFORM ENGINE
              </span>
              <span className="text-xs text-slate-400 font-mono">SECTIONS 32–36 ARCHITECTURE</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mt-1">
              Enterprise Schema & Workflow Configuration Hub
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-0.5 leading-relaxed">
              Memungkinkan perusahaan mengkustomisasi atribut data, alur workflow persetujuan multi-tier,
              dan kebijakan bisnis tanpa memerlukan deployment ulang kode atau modifikasi tabel inti SQL.
            </p>
          </div>

          {/* Current Active Persona Widget */}
          <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg text-xs self-start sm:self-auto min-w-[220px]">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Current Persona Active</div>
            <div className="font-bold text-white mt-0.5">{currentUser.name}</div>
            <div className="text-[11px] text-blue-400 font-mono">{currentUser.role}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 pt-2 rounded-t-lg shadow-2xs overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('custom-fields')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
            activeTab === 'custom-fields'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>1. Custom Field Schema Admin</span>
          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">
            {customFields.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('workflows')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
            activeTab === 'workflows'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Workflow className="w-4 h-4" />
          <span>2. Dynamic Workflow & Approval Builder</span>
          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">
            {workflows.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('business-rules')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
            activeTab === 'business-rules'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>3. Business Rule Engine & Policy</span>
          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">
            {businessRules.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('rbac')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
            activeTab === 'rbac'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>4. Persona & Role Switching (SoD)</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: CUSTOM FIELD SCHEMA ADMIN (Section 33)                         */}
      {/* ===================================================================== */}
      {activeTab === 'custom-fields' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Creator Form */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wide">
                Tambah Atribut Dinamis Baru
              </h3>
              <p className="text-xs text-slate-500">
                Atribut ini langsung aktif di UI form tanpa memerlukan perubahan database SQL.
              </p>
            </div>

            <form onSubmit={handleCreateField} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Entitas:</label>
                <select
                  value={fieldEntity}
                  onChange={(e) => setFieldEntity(e.target.value as CustomFieldEntityType)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded font-sans focus:outline-hidden"
                >
                  <option value="PRODUCT">Item Master (SKU)</option>
                  <option value="WORK_ORDER">Production / Work Order</option>
                  <option value="QUALITY_INSPECTION">Quality Inspection</option>
                  <option value="WORK_CENTER">Work Center / Machine</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Field Label (Nama di Form):</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Tensile Strength (MPa) / Heat Lot #"
                  value={fieldLabel}
                  onChange={(e) => setFieldLabel(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Field Key (JSON Property Key):</label>
                <input
                  type="text"
                  required
                  placeholder="tensileStrengthMpa"
                  value={fieldKey}
                  onChange={(e) => setFieldKey(e.target.value)}
                  className="w-full px-2.5 py-1.5 font-mono border border-slate-200 rounded focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipe Data:</label>
                  <select
                    value={fieldDataType}
                    onChange={(e) => setFieldDataType(e.target.value as CustomFieldDataType)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded font-sans focus:outline-hidden"
                  >
                    <option value="TEXT">Teks (String)</option>
                    <option value="NUMBER">Angka (Number)</option>
                    <option value="SELECT">Pilihan (Select)</option>
                    <option value="BOOLEAN">Ya/Tidak (Boolean)</option>
                    <option value="DATE">Tanggal (Date)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Wajib Diisi:</label>
                  <div className="flex items-center gap-2 h-8">
                    <input
                      type="checkbox"
                      id="req"
                      checked={fieldRequired}
                      onChange={(e) => setFieldRequired(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <label htmlFor="req" className="text-slate-700 cursor-pointer">
                      Required Field
                    </label>
                  </div>
                </div>
              </div>

              {fieldDataType === 'SELECT' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Opsi Dropdown (Pisahkan koma):</label>
                  <input
                    type="text"
                    placeholder="Option A, Option B, Option C"
                    value={fieldOptions}
                    onChange={(e) => setFieldOptions(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded focus:outline-hidden"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nilai Default (Opsional):</label>
                <input
                  type="text"
                  placeholder="Default value..."
                  value={fieldDefault}
                  onChange={(e) => setFieldDefault(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-colors mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Simpan Atribut Skema</span>
              </button>
            </form>
          </div>

          {/* Active Field Registry List & Live Interactive Form Simulator */}
          <div className="lg:col-span-2 space-y-5">
            {/* Registered Custom Fields Table */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wide">
                    Daftar Skema Atribut Dinamis ({customFields.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Atribut aktif akan diinjeksikan secara otomatis ke form dan tabel modul bersangkutan.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden text-xs">
                {customFields.map((f) => (
                  <div key={f.id} className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{f.label}</span>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          {f.fieldKey}
                        </span>
                        <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          {f.entityType}
                        </span>
                        <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                          {f.dataType}
                        </span>
                        {f.required && (
                          <span className="text-[9px] font-mono text-rose-700 bg-rose-50 px-1 py-0.2 rounded">
                            REQUIRED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{f.description}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleCustomField(f.id)}
                        className={`text-xs px-2 py-1 rounded font-mono font-medium transition-colors ${
                          f.active
                            ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                            : 'text-slate-500 bg-slate-100 hover:bg-slate-200'
                        }`}
                      >
                        {f.active ? 'Aktif' : 'Non-Aktif'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Interactive Form Extension Simulator */}
            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wide">
                    Live Form Simulator: Pengisian Atribut Dinamis
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Menguji bagaimana operator / planner mengisi custom fields pada data riil.
                  </p>
                </div>
                <select
                  value={selectedSimEntity}
                  onChange={(e) => setSelectedSimEntity(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                >
                  <option value="prd-001">Product: Industrial Motor Controller (prd-001)</option>
                  <option value="mo-124">Production Order: MO-2026-00124 (mo-124)</option>
                </select>
              </div>

              {/* Render dynamic inputs based on selected entity */}
              {(() => {
                const entityType = selectedSimEntity.startsWith('prd') ? 'PRODUCT' : 'WORK_ORDER';
                const relevantFields = customFields.filter((f) => f.entityType === entityType && f.active);
                const currentEntityValues = customValues[selectedSimEntity] || {};

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {relevantFields.map((f) => (
                      <div key={f.id} className="bg-white p-3 rounded border border-slate-200 space-y-1">
                        <label className="block font-semibold text-slate-800 text-[11px]">
                          {f.label} {f.required && <span className="text-rose-600">*</span>}
                        </label>

                        {f.dataType === 'BOOLEAN' ? (
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="checkbox"
                              checked={!!currentEntityValues[f.fieldKey]}
                              onChange={(e) =>
                                onSetCustomFieldValue(selectedSimEntity, f.fieldKey, e.target.checked)
                              }
                              className="rounded text-blue-600"
                            />
                            <span className="text-slate-600 font-mono text-[11px]">
                              {currentEntityValues[f.fieldKey] ? 'Certified / YES' : 'Not Certified / NO'}
                            </span>
                          </div>
                        ) : f.dataType === 'SELECT' ? (
                          <select
                            value={currentEntityValues[f.fieldKey] || ''}
                            onChange={(e) =>
                              onSetCustomFieldValue(selectedSimEntity, f.fieldKey, e.target.value)
                            }
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-sans"
                          >
                            <option value="">-- Pilih {f.label} --</option>
                            {f.options?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={f.dataType === 'NUMBER' ? 'number' : 'text'}
                            value={currentEntityValues[f.fieldKey] !== undefined ? currentEntityValues[f.fieldKey] : ''}
                            onChange={(e) =>
                              onSetCustomFieldValue(selectedSimEntity, f.fieldKey, e.target.value)
                            }
                            placeholder={String(f.defaultValue || '')}
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: DYNAMIC WORKFLOW & APPROVAL BUILDER (Section 34)                */}
      {/* ===================================================================== */}
      {activeTab === 'workflows' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wide">
                  Perancang Alur Status & Transisi (State Machine Designer)
                </h3>
                <p className="text-xs text-slate-500">
                  Konfigurasikan siklus hidup dokumen, peran yang diizinkan melakukan transisi, dan syarat gate validation.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500">Pilih Model:</span>
                <select
                  value={selectedWorkflowId}
                  onChange={(e) => setSelectedWorkflowId(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold"
                >
                  {workflows.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.entityType})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Visual State Node Ribbon */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="text-xs font-bold text-slate-800 font-mono uppercase">
                Visual State Progression:
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeWorkflow.states.map((st, idx) => (
                  <React.Fragment key={st.id}>
                    <div className="px-3 py-2 bg-white border border-slate-300 rounded-md shadow-2xs text-xs">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        <span>{st.label}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {st.isInitial ? '[INITIAL]' : st.isTerminal ? '[TERMINAL]' : `Step 0${idx + 1}`}
                      </div>
                    </div>
                    {idx < activeWorkflow.states.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Configured Transitions Table */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-800 font-mono uppercase">
                Daftar Transisi & Syarat Otorisasi (Transitions & Guards):
              </div>

              <div className="border border-slate-200 rounded-md overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-mono text-[11px] border-b border-slate-200">
                      <th className="py-2.5 px-3">TRANSISI</th>
                      <th className="py-2.5 px-3">TOMBOL AKSI</th>
                      <th className="py-2.5 px-3">PERAN DIWAJIBKAN</th>
                      <th className="py-2.5 px-3">SYARAT GATE VALIDASI</th>
                      <th className="py-2.5 px-3 text-center">ALASAN WAJIB</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeWorkflow.transitions.map((tr) => (
                      <tr key={tr.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono">
                          <span className="font-semibold text-slate-700">{tr.fromState}</span>
                          <span className="text-slate-400 mx-1">→</span>
                          <span className="font-bold text-blue-700">{tr.toState}</span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{tr.actionLabel}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{tr.requiredRole}</td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {tr.condition ? (
                            <span className="text-[11px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              {tr.condition}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[10px]">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {tr.requiresReason ? (
                            <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded font-bold">
                              YES
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: BUSINESS RULE ENGINE & POLICIES (Section 35)                   */}
      {/* ===================================================================== */}
      {activeTab === 'business-rules' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wide">
                Engine Aturan Bisnis & Kebijakan Operasional
              </h3>
              <p className="text-xs text-slate-500">
                Aturan yang aktif akan dievaluasi secara deterministik saat operator atau planner mengeksekusi aksi di sistem.
              </p>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden text-xs">
              {businessRules.map((rule) => (
                <div key={rule.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-700 text-[11px]">{rule.code}</span>
                      <span className="font-bold text-slate-900">{rule.name}</span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                        {rule.triggerEvent}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-600 bg-slate-100/70 p-1 rounded inline-block">
                      IF: <span className="text-blue-800 font-semibold">{rule.conditionExpression}</span>
                    </div>

                    <div className="text-[11px] text-slate-600">
                      THEN <span className="font-semibold text-slate-900">[{rule.actionType}]</span>: {rule.actionMessage}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onToggleBusinessRule(rule.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-mono font-semibold text-xs transition-colors ${
                        rule.enabled
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {rule.enabled ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>ENFORCED</span>
                        </>
                      ) : (
                        <span>DISABLED</span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: PERSONA & ROLE SWITCHING (SoD) (Section 36)                     */}
      {/* ===================================================================== */}
      {activeTab === 'rbac' && (
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wide">
                Role Persona Switching & Segregation of Duties Sandbox
              </h3>
              <p className="text-xs text-slate-500">
                Pilih persona aktif untuk menguji hak akses otorisasi, proteksi approval diri sendiri, dan hak eksekusi stasiun kerja.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PERSONAS.map((p) => {
                const isActive = currentUser.id === p.id;
                return (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-lg border text-left transition-all ${
                      isActive
                        ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-400 font-bold">{p.id}</span>
                      {isActive ? (
                        <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-mono font-bold">
                          ACTIVE
                        </span>
                      ) : (
                        <button
                          onClick={() => onSwitchUser(p)}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-mono font-semibold"
                        >
                          Switch →
                        </button>
                      )}
                    </div>

                    <div className="font-bold text-slate-900 text-sm mt-1">{p.name}</div>
                    <div className="text-xs font-semibold text-blue-700">{p.role}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{p.dept}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
