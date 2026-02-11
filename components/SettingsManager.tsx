
import React, { useState, useEffect } from 'react';
import {
  Building2, Award, ClipboardCheck, HeartHandshake, Timer, Save,
  Upload, Plus, Trash2, Palette, Info, Check, X, Heart, Edit3,
  Settings2, LayoutGrid, MousePointer2, UserCheck, Loader2
} from 'lucide-react';
import { GradeScale, InstitutionalSettings } from '../types';
import { useToast } from '../contexts/ToastContext';
import { settingsService, attendanceService, behaviorService, commitmentService } from '../services/database.service';

const SettingsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'info' | 'scales' | 'manual' | 'parents' | 'attendance'>('info');
  const [showCommitmentModal, setShowCommitmentModal] = useState(false);
  const [showBehaviorModal, setShowBehaviorModal] = useState(false);
  const [newCommitmentText, setNewCommitmentText] = useState('');
  const [newBehaviorName, setNewBehaviorName] = useState('');
  const [newBehaviorWeight, setNewBehaviorWeight] = useState<'Normal' | 'Crítico'>('Normal');
  const [editingBehaviorId, setEditingBehaviorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const [instInfo, setInstInfo] = useState<InstitutionalSettings>({
    name: '',
    slogan: '',
    address: '',
    city: '',
    phones: '',
    directorName: '',
    attendanceTolerance: 15
  });

  const [scales, setScales] = useState<GradeScale[]>([
    { id: '1', label: 'AD', description: 'Logro destacado', color: '#1E40AF' },
    { id: '2', label: 'A', description: 'Logro esperado', color: '#047857' },
    { id: '3', label: 'B', description: 'En proceso', color: '#B45309' },
    { id: '4', label: 'C', description: 'En inicio', color: '#B91C1C' },
  ]);

  const [behaviorCriteria, setBehaviorCriteria] = useState<any[]>([]);

  const [commitments, setCommitments] = useState<any[]>([]);

  const [attendanceTypes, setAttendanceTypes] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [info, attTypes, behaviors, comms] = await Promise.all([
        settingsService.getInstitutionalInfo(),
        attendanceService.getTypes(),
        behaviorService.getAll(),
        commitmentService.getAll()
      ]);

      if (info) setInstInfo(info);
      if (attTypes) setAttendanceTypes(attTypes);
      if (behaviors.length > 0) setBehaviorCriteria(behaviors);
      if (comms.length > 0) setCommitments(comms);

    } catch (error) {
      console.error('Error loading settings:', error);
      showToast('error', 'Error al cargar la configuración.', 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      await Promise.all([
        settingsService.updateInstitutionalInfo(instInfo),
        behaviorService.saveAll(behaviorCriteria),
        commitmentService.saveAll(commitments)
      ]);
      showToast('success', 'Configuración actualizada exitosamente.', 'Éxito');
      loadData(); // Reload to get actual DB IDs for new items
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('error', 'No se pudieron guardar los cambios.', 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCommitment = () => {
    if (newCommitmentText.trim().length < 5) {
      showToast('warning', 'Descripción del compromiso demasiado corta.', 'Atención');
      return;
    }
    setCommitments([...commitments, { id: `new-${Date.now()}`, description: newCommitmentText.trim() }]);
    setNewCommitmentText('');
    setShowCommitmentModal(false);
  };

  const handleDeleteCommitment = async (id: string) => {
    if (!window.confirm('¿Eliminar este compromiso familiar?')) return;
    try {
      if (!id.startsWith('new-')) {
        await commitmentService.delete(id);
      }
      setCommitments(prev => prev.filter(c => c.id !== id));
      showToast('success', 'Compromiso removido.', 'Éxito');
    } catch (error) {
      showToast('error', 'No se pudo eliminar.', 'Error');
    }
  };

  const handleAddBehavior = () => {
    if (newBehaviorName.trim().length < 5) {
      showToast('warning', 'Descripción del criterio demasiado corta.', 'Atención');
      return;
    }

    if (editingBehaviorId) {
      setBehaviorCriteria(prev => prev.map(c =>
        c.id === editingBehaviorId ? { ...c, name: newBehaviorName.trim(), weight: newBehaviorWeight } : c
      ));
      showToast('success', 'Criterio actualizado.', 'Éxito');
    } else {
      setBehaviorCriteria([...behaviorCriteria, {
        id: `bc${Date.now()}`,
        name: newBehaviorName.trim(),
        weight: newBehaviorWeight
      }]);
      showToast('success', 'Criterio agregado.', 'Éxito');
    }

    resetBehaviorModal();
  };

  const resetBehaviorModal = () => {
    setShowBehaviorModal(false);
    setNewBehaviorName('');
    setNewBehaviorWeight('Normal');
    setEditingBehaviorId(null);
  };

  const openEditBehavior = (crit: any) => {
    setEditingBehaviorId(crit.id);
    setNewBehaviorName(crit.name);
    setNewBehaviorWeight(crit.weight);
    setShowBehaviorModal(true);
  };

  const handleDeleteBehavior = (id: string) => {
    if (window.confirm('¿Eliminar este criterio de evaluación?')) {
      setBehaviorCriteria(prev => prev.filter(c => c.id !== id));
      showToast('success', 'Criterio eliminado.', 'Éxito');
    }
  };

  const TabButton = ({ id, label, icon: Icon }: { id: any, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all font-bold text-[10px] uppercase tracking-widest whitespace-nowrap ${activeTab === id
        ? 'border-[#57C5D5] text-[#57C5D5] bg-[#57C5D5]/5'
        : 'border-transparent text-slate-400 hover:text-slate-600'
        }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-12 h-12 text-[#57C5D5] animate-spin" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargando Ajustes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ajustes Institucionales</h2>
          <p className="text-slate-500 text-sm font-medium">Personaliza la identidad y parámetros de evaluación.</p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-[#57C5D5] text-white rounded-2xl text-sm font-black shadow-xl shadow-[#57C5D5]/20 hover:bg-[#46b3c2] transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
        </button>
      </header>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden min-h-[500px] flex flex-col">
        <nav className="flex bg-slate-50/50 border-b border-slate-100 overflow-x-auto scrollbar-hide">
          <TabButton id="info" label="Institución" icon={Building2} />
          <TabButton id="scales" label="Escalas CNEB" icon={Award} />
          <TabButton id="manual" label="Criterios Finales" icon={ClipboardCheck} />
          <TabButton id="parents" label="Compromisos" icon={HeartHandshake} />
          <TabButton id="attendance" label="Asistencia" icon={Timer} />
        </nav>

        <div className="p-10 flex-1">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 animate-in slide-in-from-left-4">
              <div className="lg:col-span-8 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Building2 className="w-3 h-3 text-[#57C5D5]" /> Nombre de la Institución
                    </label>
                    <input
                      type="text"
                      value={instInfo.name}
                      onChange={(e) => setInstInfo({ ...instInfo, name: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-[#57C5D5] focus:bg-white rounded-2xl text-sm font-black text-slate-700 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Eslogan Institucional</label>
                    <input
                      type="text"
                      value={instInfo.slogan}
                      onChange={(e) => setInstInfo({ ...instInfo, slogan: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-[#57C5D5] focus:bg-white rounded-2xl text-sm font-bold text-slate-600 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección Física</label>
                    <input
                      type="text"
                      value={instInfo.address}
                      onChange={(e) => setInstInfo({ ...instInfo, address: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-[#57C5D5] focus:bg-white rounded-2xl text-sm font-bold text-slate-600 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ciudad / Ciudad</label>
                    <input
                      type="text"
                      value={instInfo.city}
                      onChange={(e) => setInstInfo({ ...instInfo, city: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-[#57C5D5] focus:bg-white rounded-2xl text-sm font-bold text-slate-600 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfonos de Contacto</label>
                    <input
                      type="text"
                      value={instInfo.phones}
                      onChange={(e) => setInstInfo({ ...instInfo, phones: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-[#57C5D5] focus:bg-white rounded-2xl text-sm font-bold text-slate-600 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Director/a</label>
                    <input
                      type="text"
                      value={instInfo.directorName}
                      onChange={(e) => setInstInfo({ ...instInfo, directorName: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-[#57C5D5] focus:bg-white rounded-2xl text-sm font-black text-slate-700 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 flex flex-col items-center">
                <div className="w-full aspect-square max-w-[280px] p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-center group hover:border-[#57C5D5]/50 transition-all hover:bg-white">
                  <div className="w-32 h-32 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6 overflow-hidden border border-slate-100 group-hover:scale-105 transition-transform duration-500">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">SIN LOGO</span>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Logo Institucional</p>
                  <button className="flex items-center gap-2 px-6 py-2 bg-[#57C5D5]/10 text-[#57C5D5] rounded-xl text-[10px] font-black hover:bg-[#57C5D5] hover:text-white transition-all uppercase tracking-widest">
                    <Upload className="w-3 h-3" /> Cambiar Imagen
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scales' && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
              <div className="bg-[#57C5D5]/5 border border-[#57C5D5]/20 p-6 rounded-[2rem] flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#57C5D5] text-white flex items-center justify-center shadow-lg shadow-[#57C5D5]/20">
                  <Award className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-600 leading-relaxed">
                  Configura los valores de la escala nacional del CNEB. Estos se verán reflejados en todos los registros de auxiliares y libretas.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scales.map((scale, idx) => (
                  <div key={scale.id} className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex items-center justify-between group transition-all hover:shadow-xl">
                    <div className="flex items-center gap-6">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-2xl"
                        style={{ backgroundColor: scale.color }}
                      >
                        {scale.label}
                      </div>
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={scale.description}
                          onChange={(e) => {
                            const newScales = [...scales];
                            newScales[idx].description = e.target.value;
                            setScales(newScales);
                          }}
                          className="font-black text-slate-800 bg-transparent outline-none text-sm w-48 uppercase tracking-tight"
                        />
                        <div className="flex items-center gap-2">
                          <Palette className="w-3.5 h-3.5 text-slate-300" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{scale.color}</span>
                        </div>
                      </div>
                    </div>
                    <input
                      type="color"
                      value={scale.color}
                      onChange={(e) => {
                        const newScales = [...scales];
                        newScales[idx].color = e.target.value;
                        setScales(newScales);
                      }}
                      className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none p-0"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <section className="space-y-8">
                <header className="flex items-center justify-between border-b border-slate-100 pb-6">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                      <UserCheck className="w-5 h-5 text-[#57C5D5]" /> Evaluación Actitudinal (Conducta)
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tight">Criterios de comportamiento evaluados bimestralmente por el tutor.</p>
                  </div>
                  <button
                    onClick={() => {
                      resetBehaviorModal();
                      setShowBehaviorModal(true);
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all font-black"
                  >
                    <Plus className="w-4 h-4" /> Nuevo Criterio
                  </button>
                </header>
                <div className="bg-slate-50/50 rounded-[2.5rem] border border-slate-100 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-white border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descriptor del Criterio</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nivel de Impacto</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Mantenimiento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {behaviorCriteria.map((crit) => (
                        <tr key={crit.id} className="hover:bg-white transition-all group">
                          <td className="px-8 py-5">
                            <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{crit.name}</span>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${crit.weight === 'Crítico' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-white border border-slate-200 text-slate-400'
                              }`}>
                              {crit.weight}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => openEditBehavior(crit)}
                                className="p-3 text-slate-300 hover:text-[#57C5D5] hover:bg-[#57C5D5]/5 rounded-xl transition-all"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteBehavior(crit.id)}
                                className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'parents' && (
            <div className="space-y-8 animate-in slide-in-from-top-4">
              <header className="flex flex-col md:flex-row gap-6 justify-between items-center bg-slate-900 text-white p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-3xl bg-[#57C5D5]/20 flex items-center justify-center text-[#57C5D5] shadow-inner">
                    <HeartHandshake className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black uppercase tracking-tight leading-none">Compromisos de la Familia</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">Evaluación cualitativa del apoyo parental en casa.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCommitmentModal(true)}
                  className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-[#57C5D5] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#46b3c2] shadow-xl shadow-black/20 transition-all"
                >
                  <Plus className="w-4 h-4" /> Agregar Ítem Nuevo
                </button>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                {commitments.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-5 bg-white p-6 rounded-[2rem] border border-slate-100 hover:border-[#57C5D5] transition-all group hover:shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 group-hover:text-[#57C5D5] group-hover:bg-[#57C5D5]/5 transition-all flex items-center justify-center border border-slate-100">
                      <Check className="w-5 h-5 font-black" />
                    </div>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => {
                        const newC = [...commitments];
                        newC[idx].description = e.target.value;
                        setCommitments(newC);
                      }}
                      className="flex-1 bg-transparent border-none outline-none text-xs font-black text-slate-600 uppercase tracking-tight leading-relaxed"
                    />
                    <button
                      onClick={() => handleDeleteCommitment(item.id)}
                      className="p-3 opacity-0 group-hover:opacity-100 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-12 animate-in zoom-in-95 duration-300 py-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                <div className="space-y-8">
                  <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 flex flex-col gap-6">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                      <Timer className="w-5 h-5 text-[#57C5D5]" /> Control de Puntualidad
                    </h5>
                    <div className="flex items-center gap-6">
                      <input
                        type="number"
                        value={instInfo.attendanceTolerance}
                        onChange={(e) => setInstInfo({ ...instInfo, attendanceTolerance: parseInt(e.target.value) || 0 })}
                        className="w-28 px-6 py-6 bg-white border-2 border-slate-100 rounded-[2rem] text-4xl font-black text-[#57C5D5] outline-none focus:border-[#57C5D5] text-center shadow-inner"
                      />
                      <div className="space-y-1">
                        <span className="text-xl font-black text-slate-800 uppercase tracking-tighter">Minutos</span>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Tolerancia Máxima</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase border-t border-slate-200 pt-4">
                      Pasado este tiempo, el sistema marcará automáticamente como tardanza en el registro digital.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Leyenda de Estados en Registro</h5>
                  <div className="grid grid-cols-1 gap-3">
                    {attendanceTypes.map(type => (
                      <div key={type.name} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-[2rem] transition-all hover:shadow-xl hover:border-transparent group">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white shadow-lg"
                            style={{ backgroundColor: type.color }}
                          >
                            {type.name.charAt(0)}
                          </div>
                          <span className="text-xs font-black text-slate-800 uppercase tracking-widest">{type.name}</span>
                        </div>
                        <div className="w-3 h-3 rounded-full opacity-30 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: type.color }} />
                      </div>
                    ))}
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold leading-relaxed uppercase flex items-center gap-3">
                      <Info className="w-4 h-4 text-[#57C5D5]" /> El estado "Justificado" (Plomo) no afecta el porcentaje de inasistencias acumulado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PARA NUEVO COMPROMISO */}
      {showCommitmentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <header className="p-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#57C5D5]/10 rounded-2xl text-[#57C5D5]">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-none">Añadir Criterio</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Compromiso Escolar 2026</p>
                </div>
              </div>
              <button
                onClick={() => setShowCommitmentModal(false)}
                className="p-3 bg-slate-50 text-slate-300 hover:text-red-500 rounded-2xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </header>

            <div className="p-10 space-y-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                ¿Cuál es el nuevo compromiso?
              </label>
              <textarea
                autoFocus
                value={newCommitmentText}
                onChange={(e) => setNewCommitmentText(e.target.value)}
                placeholder="Ej. Revisar diariamente la agenda del estudiante..."
                className="w-full h-40 px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-sm font-bold text-slate-700 focus:border-[#57C5D5] focus:bg-white outline-none transition-all resize-none shadow-inner"
              />
              <div className="flex items-start gap-3 p-4 bg-slate-900 rounded-3xl text-white/80">
                <Info className="w-5 h-5 text-[#57C5D5] shrink-0" />
                <p className="text-[9px] font-black uppercase leading-relaxed tracking-widest">
                  Este texto se incluirá en el reporte de evaluación de todos los estudiantes.
                </p>
              </div>
            </div>

            <footer className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              <button
                onClick={() => setShowCommitmentModal(false)}
                className="px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all font-black"
              >
                DESCARTAR
              </button>
              <button
                onClick={handleAddCommitment}
                className="px-10 py-4 bg-[#57C5D5] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-[#57C5D5]/40 hover:bg-[#46b3c2] transition-all transform hover:-translate-y-1 active:scale-95"
              >
                AGREGAR A LIBRETA
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* MODAL PARA CRITERIO DE COMPORTAMIENTO */}
      {showBehaviorModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <header className="p-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#57C5D5]/10 rounded-2xl text-[#57C5D5]">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-none">{editingBehaviorId ? 'Editar Criterio' : 'Nuevo Criterio'}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Evaluación Actitudinal</p>
                </div>
              </div>
              <button
                onClick={resetBehaviorModal}
                className="p-3 bg-slate-50 text-slate-300 hover:text-red-500 rounded-2xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </header>

            <div className="p-10 space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                  Descripción del Criterio
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newBehaviorName}
                  onChange={(e) => setNewBehaviorName(e.target.value)}
                  placeholder="Ej. Respeta el turno de palabra..."
                  className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-sm font-bold text-slate-700 focus:border-[#57C5D5] focus:bg-white outline-none transition-all shadow-inner"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                  Nivel de Impacto / Importancia
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setNewBehaviorWeight('Normal')}
                    className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${newBehaviorWeight === 'Normal' ? 'bg-[#57C5D5]/5 border-[#57C5D5] text-[#57C5D5]' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                  >
                    Peso Normal
                  </button>
                  <button
                    onClick={() => setNewBehaviorWeight('Crítico')}
                    className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${newBehaviorWeight === 'Crítico' ? 'bg-red-50 border-red-500 text-red-500' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                  >
                    Impacto Crítico
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-900 rounded-3xl text-white/80">
                <Info className="w-5 h-5 text-[#57C5D5] shrink-0" />
                <p className="text-[9px] font-black uppercase leading-relaxed tracking-widest">
                  Los criterios marcados como "Críticos" tienen mayor peso en el promedio final de conducta.
                </p>
              </div>
            </div>

            <footer className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              <button
                onClick={resetBehaviorModal}
                className="px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all font-black"
              >
                CANCELAR
              </button>
              <button
                onClick={handleAddBehavior}
                className={`px-10 py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95 ${editingBehaviorId ? 'bg-emerald-500 shadow-emerald-500/40 hover:bg-emerald-600' : 'bg-[#57C5D5] shadow-[#57C5D5]/40 hover:bg-[#46b3c2]'
                  }`}
              >
                {editingBehaviorId ? 'ACTUALIZAR DATOS' : 'GUARDAR CRITERIO'}
              </button>
            </footer>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 bg-[#57C5D5] text-white p-8 rounded-[3rem] shadow-2xl shadow-[#57C5D5]/20">
        <Info className="w-10 h-10 shrink-0 opacity-50" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">
          Sincronización Global: Los cambios guardados se aplicarán instantáneamente a todas las libretas y documentos oficiales del periodo académico vigente.
        </p>
      </div>
    </div>
  );
};

export default SettingsManager;
