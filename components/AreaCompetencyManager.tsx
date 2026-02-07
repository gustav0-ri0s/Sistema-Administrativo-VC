
import React, { useState } from 'react';
import { CurricularArea, Competency } from '../types';
import { mockCurricularAreas } from '../services/mockData';
import { Layers, Plus, Search, Trash2, Edit3, ChevronRight, Info, Copy, CheckCircle2, X } from 'lucide-react';

const AreaCompetencyManager: React.FC = () => {
  const [areas, setAreas] = useState<CurricularArea[]>(mockCurricularAreas);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<CurricularArea | null>(null);
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [showCompetencyForm, setShowCompetencyForm] = useState(false);

  const filteredAreas = areas.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleCopyFromPrevious = () => {
    if (confirm('¿Deseas importar la configuración de competencias del año anterior? Esta acción sobrescribirá cambios no guardados.')) {
      // Lógica de simulación de copia
      alert('Configuración importada exitosamente desde el Ciclo 2024.');
    }
  };

  const toggleCompetencyStatus = (areaId: string, competencyId: string) => {
    setAreas(areas.map(a => {
      if (a.id === areaId) {
        return {
          ...a,
          competencies: a.competencies.map(c => 
            c.id === competencyId ? { ...c, isEvaluated: !c.isEvaluated } : c
          )
        };
      }
      return a;
    }));
    // Actualizar también el área seleccionada en el panel detalle si existe
    if (selectedArea && selectedArea.id === areaId) {
      setSelectedArea({
        ...selectedArea,
        competencies: selectedArea.competencies.map(c => 
          c.id === competencyId ? { ...c, isEvaluated: !c.isEvaluated } : c
        )
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Estructura Curricular CNEB</h2>
          <p className="text-slate-500 text-sm">Define las 31 competencias oficiales distribuidas por área y nivel.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleCopyFromPrevious}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
          >
            <Copy className="w-4 h-4" /> Importar 2024
          </button>
          <button 
            onClick={() => setShowAreaForm(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#57C5D5] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#57C5D5]/20 hover:bg-[#46b3c2] transition-all"
          >
            <Plus className="w-4 h-4" /> Nueva Área
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Panel Maestro: Lista de Áreas */}
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
            {filteredAreas.map(area => (
              <button
                key={area.id}
                onClick={() => setSelectedArea(area)}
                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                  selectedArea?.id === area.id 
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
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{area.level} • {area.competencies.length} Competencias</p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${selectedArea?.id === area.id ? 'text-[#57C5D5] translate-x-1' : 'text-slate-300'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Panel Detalle: Competencias del Área Seleccionada */}
        <div className="lg:col-span-7">
          {selectedArea ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden animate-in slide-in-from-right-4 duration-300">
              <header className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{selectedArea.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">Gestión de competencias asociadas al reporte de notas.</p>
                </div>
                <button 
                  onClick={() => setShowCompetencyForm(true)}
                  className="px-4 py-2 bg-[#57C5D5] text-white rounded-xl text-xs font-bold hover:bg-[#46b3c2] shadow-md"
                >
                  Agregar Competencia
                </button>
              </header>

              <div className="p-6 space-y-4">
                {selectedArea.competencies.length > 0 ? (
                  selectedArea.competencies.map((comp) => (
                    <div key={comp.id} className="p-5 bg-white border border-slate-100 rounded-2xl hover:border-[#57C5D5] transition-all group shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                             <h4 className="font-bold text-slate-800 text-sm">{comp.name}</h4>
                             {comp.isEvaluated && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          </div>
                          <p className="text-xs text-slate-500 mt-2 leading-relaxed">{comp.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={comp.isEvaluated} 
                              onChange={() => toggleCompetencyStatus(selectedArea.id, comp.id)}
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#57C5D5]"></div>
                            <span className="ml-2 text-[9px] font-black text-slate-400 uppercase tracking-tighter">Evaluar</span>
                          </label>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 hover:bg-slate-50 rounded text-slate-300 hover:text-[#57C5D5]"><Edit3 className="w-4 h-4" /></button>
                            <button className="p-1.5 hover:bg-slate-50 rounded text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <Layers className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No hay competencias registradas</p>
                  </div>
                )}
              </div>

              <footer className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center gap-2">
                 <Info className="w-4 h-4 text-[#57C5D5]" />
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                    Estas competencias aparecerán en la libreta bajo el área de {selectedArea.name}.
                 </p>
              </footer>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white border border-slate-100 rounded-3xl shadow-sm text-center p-10">
              <div className="p-6 bg-slate-50 rounded-full mb-6">
                <Layers className="w-16 h-16 text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Configuración Curricular</h3>
              <p className="text-slate-400 text-sm mt-2 max-w-xs">Selecciona un área curricular del panel izquierdo para gestionar sus competencias de evaluación.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Simulado: Nueva Área */}
      {showAreaForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
             <header className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-900">Nueva Área Curricular</h3>
                <button onClick={() => setShowAreaForm(false)}><X className="w-6 h-6 text-slate-400" /></button>
             </header>
             <div className="p-8 space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre del Área</label>
                  <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#57C5D5]" placeholder="Ej. Arte y Cultura" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nivel Aplicable</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                    <option>Inicial</option>
                    <option>Primaria</option>
                    <option>Secundaria</option>
                    <option>Todos</option>
                  </select>
                </div>
             </div>
             <footer className="p-6 bg-slate-50 border-t flex justify-end gap-3">
                <button onClick={() => setShowAreaForm(false)} className="px-6 py-2 text-sm font-bold text-slate-400">Cancelar</button>
                <button className="px-8 py-2.5 bg-[#57C5D5] text-white rounded-xl font-bold text-sm">Crear Área</button>
             </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default AreaCompetencyManager;
