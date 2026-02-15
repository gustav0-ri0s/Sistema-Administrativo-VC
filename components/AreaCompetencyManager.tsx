
import React, { useState, useEffect } from 'react';
import { CurricularArea, Competency } from '../types';
import { curricularAreaService } from '../services/database.service';
import { useToast } from '../contexts/ToastContext';
import { Layers, Plus, Search, Trash2, Edit3, ChevronRight, Info, CheckCircle2, X, Loader2, Save, AlertTriangle } from 'lucide-react';

const AreaCompetencyManager: React.FC = () => {
  const [areas, setAreas] = useState<CurricularArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<CurricularArea | null>(null);

  // Area Modal State
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [editingArea, setEditingArea] = useState<CurricularArea | null>(null);
  const [areaForm, setAreaForm] = useState({ name: '', level: 'Primaria', order: 0 });

  // Competency Modal State
  const [showCompetencyModal, setShowCompetencyModal] = useState(false);
  const [editingCompetency, setEditingCompetency] = useState<Competency | null>(null);
  const [competencyForm, setCompetencyForm] = useState({
    name: '',
    description: '',
    isEvaluated: true,
    targetAreaId: ''
  });

  const { showToast } = useToast();

  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = async () => {
    try {
      setLoading(true);
      const data = await curricularAreaService.getAll();
      setAreas(data);

      // Keep selected area in sync
      if (selectedArea) {
        const refreshed = data.find(a => a.id === selectedArea.id);
        setSelectedArea(refreshed || null);
      }
    } catch (error) {
      console.error('Error loading areas:', error);
      showToast('error', 'No se pudieron cargar las áreas curriculares.', 'Error de Conexión');
    } finally {
      setLoading(false);
    }
  };

  const filteredAreas = areas.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Board Functions: Areas
  const openNewAreaModal = () => {
    setEditingArea(null);
    setAreaForm({ name: '', level: 'Primaria', order: areas.length + 1 });
    setShowAreaModal(true);
  };

  const openEditAreaModal = (area: CurricularArea) => {
    setEditingArea(area);
    setAreaForm({ name: area.name, level: area.level, order: area.order });
    setShowAreaModal(true);
  };

  const handleSaveArea = async () => {
    if (!areaForm.name.trim()) return showToast('error', 'El nombre es obligatorio', 'Validación');

    try {
      if (editingArea) {
        await curricularAreaService.update(editingArea.id, {
          name: areaForm.name,
          level: areaForm.level as any,
          order: areaForm.order
        });
        showToast('success', 'Área actualizada correctamente', 'Éxito');
      } else {
        await curricularAreaService.create({
          name: areaForm.name,
          level: areaForm.level as any,
          order: areaForm.order
        });
        showToast('success', 'Área creada correctamente', 'Éxito');
      }
      setShowAreaModal(false);
      loadAreas();
    } catch (error) {
      console.error('Error saving area:', error);
      showToast('error', 'No se pudo guardar el área', 'Error');
    }
  };

  const handleDeleteArea = async (area: CurricularArea) => {
    if (!window.confirm(`¿Estás seguro de eliminar el área "${area.name}"? Se perderán todas sus competencias.`)) return;

    try {
      await curricularAreaService.delete(area.id);
      showToast('success', 'Área eliminada correctamente', 'Éxito');
      if (selectedArea?.id === area.id) setSelectedArea(null);
      loadAreas();
    } catch (error) {
      console.error('Error deleting area:', error);
      showToast('error', 'No se pudo eliminar el área', 'Error');
    }
  };

  // Board Functions: Competencies
  const openNewCompetencyModal = () => {
    if (!selectedArea) return;
    setEditingCompetency(null);
    setCompetencyForm({
      name: '',
      description: '',
      isEvaluated: true,
      targetAreaId: selectedArea.id
    });
    setShowCompetencyModal(true);
  };

  const openEditCompetencyModal = (comp: Competency) => {
    if (!selectedArea) return;
    setEditingCompetency(comp);
    setCompetencyForm({
      name: comp.name,
      description: comp.description,
      isEvaluated: comp.isEvaluated,
      targetAreaId: selectedArea.id
    });
    setShowCompetencyModal(true);
  };

  const handleSaveCompetency = async () => {
    if (!selectedArea) return;
    if (!competencyForm.name.trim()) return showToast('error', 'El nombre es obligatorio', 'Validación');

    try {
      if (editingCompetency) {
        // Update
        // Check if we need to move it
        const updates: any = {
          name: competencyForm.name,
          description: competencyForm.description,
          isEvaluated: competencyForm.isEvaluated
        };

        if (competencyForm.targetAreaId !== selectedArea.id) {
          updates.area_id = competencyForm.targetAreaId;
        }

        await curricularAreaService.updateCompetency(editingCompetency.id, updates);
        showToast('success', 'Competencia actualizada correctamente', 'Éxito');
      } else {
        // Create
        await curricularAreaService.createCompetency({
          name: competencyForm.name,
          description: competencyForm.description,
          isEvaluated: competencyForm.isEvaluated,
          area_id: competencyForm.targetAreaId // Should usually be current area, but allow override
        });
        showToast('success', 'Competencia creada correctamente', 'Éxito');
      }
      setShowCompetencyModal(false);
      loadAreas();
    } catch (error) {
      console.error('Error saving competency:', error);
      showToast('error', 'No se pudo guardar la competencia', 'Error');
    }
  };

  const handleDeleteCompetency = async (compId: string) => {
    if (!window.confirm('¿Eliminar esta competencia?')) return;
    try {
      await curricularAreaService.deleteCompetency(compId);
      showToast('success', 'Competencia eliminada', 'Éxito');
      loadAreas();
    } catch (error) {
      console.error('Error:', error);
      showToast('error', 'No se pudo eliminar', 'Error');
    }
  };

  const toggleStatus = async (compId: string, currentStatus: boolean) => {
    try {
      await curricularAreaService.updateCompetencyStatus(compId, !currentStatus);
      // Optimistic update done by loadAreas usually, but let's just reload
      loadAreas();
    } catch (err) {
      showToast('error', 'Error al cambiar estado', 'Error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Estructura Curricular CNEB</h2>
          <p className="text-slate-500 text-sm">Gestiona las áreas, competencias y capacidades del plan de estudios.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openNewAreaModal}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#57C5D5] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#57C5D5]/20 hover:bg-[#46b3c2] transition-all"
          >
            <Plus className="w-4 h-4" /> Nueva Área
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Helper Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar área (Matemática, etc)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#57C5D5]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest">Cargando...</p>
              </div>
            ) : filteredAreas.map(area => (
              <button
                key={area.id}
                onClick={() => setSelectedArea(area)}
                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${selectedArea?.id === area.id
                  ? 'border-[#57C5D5] bg-white ring-4 ring-[#57C5D5]/5 shadow-md'
                  : 'border-white bg-white hover:border-slate-100 shadow-sm'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${selectedArea?.id === area.id ? 'bg-[#57C5D5] text-white' : 'bg-slate-50 text-slate-400'}`}>
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800 text-sm">{area.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{area.competencies.length} Competencias • {area.name === 'Competencias Transversales' ? 'Todos (Transversal)' : area.level}</p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${selectedArea?.id === area.id ? 'text-[#57C5D5] translate-x-1' : 'text-slate-300'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-7">
          {selectedArea ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden animate-in slide-in-from-right-4 duration-300">
              <header className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{selectedArea.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-500 uppercase">{selectedArea.name === 'Competencias Transversales' ? 'TODOS (Transversal)' : selectedArea.level}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditAreaModal(selectedArea)}
                    className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-[#57C5D5] transition-colors" title="Editar Área"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteArea(selectedArea)}
                    className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-red-500 transition-colors" title="Eliminar Área"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <div className="h-6 w-px bg-slate-200 mx-1"></div>
                  <button
                    onClick={openNewCompetencyModal}
                    className="px-4 py-2 bg-[#57C5D5] text-white rounded-xl text-xs font-bold hover:bg-[#46b3c2] shadow-md flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Competencia
                  </button>
                </div>
              </header>

              <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
                {selectedArea.competencies.length > 0 ? (
                  selectedArea.competencies.map((comp) => (
                    <div key={comp.id} className="p-5 bg-white border border-slate-100 rounded-2xl hover:border-[#57C5D5] transition-all group shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-800 text-sm">{comp.name}</h4>
                            {comp.isEvaluated && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          </div>
                          <p className="text-xs text-slate-500 mt-2 leading-relaxed whitespace-pre-wrap">{comp.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <label className="relative inline-flex items-center cursor-pointer" title="Activar/Desactivar evaluación">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={comp.isEvaluated}
                              onChange={() => toggleStatus(comp.id, comp.isEvaluated)}
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#57C5D5]"></div>
                          </label>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditCompetencyModal(comp)}
                              className="p-1.5 hover:bg-slate-50 rounded text-slate-300 hover:text-[#57C5D5]"
                              title="Editar"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCompetency(comp.id)}
                              className="p-1.5 hover:bg-slate-50 rounded text-slate-300 hover:text-red-500"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <Layers className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No hay competencias</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white border border-slate-100 rounded-3xl shadow-sm text-center p-10">
              <div className="p-6 bg-slate-50 rounded-full mb-6">
                <Layers className="w-16 h-16 text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Configuración Curricular</h3>
              <p className="text-slate-400 text-sm mt-2 max-w-xs">Selecciona un área curricular del panel izquierdo para empezar.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Nueva/Editar Área */}
      {showAreaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <header className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">{editingArea ? 'Editar Área' : 'Nueva Área Curricular'}</h3>
              <button onClick={() => setShowAreaModal(false)}><X className="w-6 h-6 text-slate-400" /></button>
            </header>
            <div className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre del Área</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#57C5D5]"
                  placeholder="Ej. Arte y Cultura"
                  value={areaForm.name}
                  onChange={e => setAreaForm({ ...areaForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nivel</label>
                  <select
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#57C5D5]"
                    value={areaForm.level}
                    onChange={e => setAreaForm({ ...areaForm, level: e.target.value })}
                  >
                    <option value="Inicial">Inicial</option>
                    <option value="Primaria">Primaria</option>
                    <option value="Secundaria">Secundaria</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Orden</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#57C5D5]"
                    value={areaForm.order}
                    onChange={e => setAreaForm({ ...areaForm, order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
            <footer className="p-6 bg-slate-50 border-t flex justify-end gap-3">
              <button onClick={() => setShowAreaModal(false)} className="px-6 py-2 text-sm font-bold text-slate-400 hover:text-slate-600">Cancelar</button>
              <button onClick={handleSaveArea} className="px-8 py-2.5 bg-[#57C5D5] text-white rounded-xl font-bold text-sm hover:bg-[#46b3c2] flex items-center gap-2">
                <Save className="w-4 h-4" /> {editingArea ? 'Actualizar' : 'Crear'}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* MODAL: Nueva/Editar Competencia */}
      {showCompetencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <header className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">{editingCompetency ? 'Editar Competencia' : 'Nueva Competencia'}</h3>
              <button onClick={() => setShowCompetencyModal(false)}><X className="w-6 h-6 text-slate-400" /></button>
            </header>
            <div className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre</label>
                <textarea
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#57C5D5] min-h-[80px]"
                  placeholder="Ej. Resuelve problemas de forma, movimiento y localización"
                  value={competencyForm.name}
                  onChange={e => setCompetencyForm({ ...competencyForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descripción (Opcional)</label>
                <textarea
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#57C5D5] min-h-[60px]"
                  placeholder="Detalles adicionales..."
                  value={competencyForm.description}
                  onChange={e => setCompetencyForm({ ...competencyForm, description: e.target.value })}
                />
              </div>

              {/* Área Selector (Move Competency) */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Layers className="w-3 h-3" /> Área Asignada
                </label>
                <select
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#57C5D5]"
                  value={competencyForm.targetAreaId}
                  onChange={e => setCompetencyForm({ ...competencyForm, targetAreaId: e.target.value })}
                >
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.level})
                    </option>
                  ))}
                </select>
                {editingCompetency && competencyForm.targetAreaId !== selectedArea?.id && (
                  <p className="text-xs text-amber-500 font-bold flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3 h-3" /> La competencia se moverá a otra área.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="evalCheck"
                  className="w-5 h-5 accent-[#57C5D5] rounded cursor-pointer"
                  checked={competencyForm.isEvaluated}
                  onChange={e => setCompetencyForm({ ...competencyForm, isEvaluated: e.target.checked })}
                />
                <label htmlFor="evalCheck" className="text-sm text-slate-600 cursor-pointer select-none">
                  Habilitar evaluación en libreta
                </label>
              </div>

            </div>
            <footer className="p-6 bg-slate-50 border-t flex justify-end gap-3">
              <button onClick={() => setShowCompetencyModal(false)} className="px-6 py-2 text-sm font-bold text-slate-400 hover:text-slate-600">Cancelar</button>
              <button onClick={handleSaveCompetency} className="px-8 py-2.5 bg-[#57C5D5] text-white rounded-xl font-bold text-sm hover:bg-[#46b3c2] flex items-center gap-2">
                <Save className="w-4 h-4" /> {editingCompetency ? 'Actualizar' : 'Crear'}
              </button>
            </footer>
          </div>
        </div>
      )}

    </div>
  );
};

export default AreaCompetencyManager;
