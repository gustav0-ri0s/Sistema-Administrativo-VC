
import React, { useState } from 'react';
import { 
  Building2, Award, ClipboardCheck, HeartHandshake, Timer, Save, 
  Upload, Plus, Trash2, Palette, Info, Check, X, Heart, 
  Settings2, LayoutGrid, Terminal, Share2, MousePointer2, UserCheck
} from 'lucide-react';
import { GradeScale, InstitutionalSettings } from '../types';

const SettingsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'info' | 'scales' | 'transversal' | 'parents' | 'attendance'>('info');
  const [showCommitmentModal, setShowCommitmentModal] = useState(false);
  const [newCommitmentText, setNewCommitmentText] = useState('');

  const [instInfo] = useState<InstitutionalSettings>({
    name: 'I.E.P. Valores y Ciencias',
    slogan: 'Formamos triunfadores/as desde el inicio',
    address: 'Jr. Los Próceres 355',
    city: 'Tarapoto',
    phones: '(042) 523456 / 945 678 123',
    directorName: 'Lic. María Elena Rivas'
  });

  const [scales, setScales] = useState<GradeScale[]>([
    { id: '1', label: 'AD', description: 'Logro destacado', color: '#1E40AF' },
    { id: '2', label: 'A', description: 'Logro esperado', color: '#047857' },
    { id: '3', label: 'B', description: 'En proceso', color: '#B45309' },
    { id: '4', label: 'C', description: 'En inicio', color: '#B91C1C' },
  ]);

  // Datos para Criterios Finales (Transversales y Comportamiento)
  const [transversalCompetencies, setTransversalCompetencies] = useState([
    { 
      id: 'ct1', 
      name: 'Se desenvuelve en entornos virtuales generados por las TIC', 
      code: 'TIC',
      isActive: true,
      description: 'Interactúa en entornos virtuales, personaliza perfiles y gestiona información.' 
    },
    { 
      id: 'ct2', 
      name: 'Gestiona su aprendizaje de manera autónoma', 
      code: 'AUT',
      isActive: true,
      description: 'Define metas de aprendizaje, organiza acciones y monitorea su desempeño.' 
    }
  ]);

  const [behaviorCriteria, setBehaviorCriteria] = useState([
    { id: 'bc1', name: 'Puntualidad y Asistencia', weight: 'Normal' },
    { id: 'bc2', name: 'Respeto a las normas de convivencia', weight: 'Crítico' },
    { id: 'bc3', name: 'Presentación personal y uniforme', weight: 'Normal' },
    { id: 'bc4', name: 'Participación en actividades institucionales', weight: 'Normal' }
  ]);

  const [commitments, setCommitments] = useState([
    'Acompaña en el aprendizaje diario', 
    'Cumple estrictamente con el uniforme institucional', 
    'Envía loncheras nutritivas siguiendo el cronograma', 
    'Asiste puntualmente a todas las reuniones de aula',
    'Fomenta la práctica de valores en el hogar',
    'Revisa diariamente el cuaderno de control/agenda'
  ]);

  const handleAddCommitment = () => {
    if (newCommitmentText.trim().length < 5) {
      alert("Por favor, describa el compromiso con más detalle.");
      return;
    }
    setCommitments([...commitments, newCommitmentText.trim()]);
    setNewCommitmentText('');
    setShowCommitmentModal(false);
  };

  const TabButton = ({ id, label, icon: Icon }: { id: any, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all font-bold text-xs uppercase tracking-widest whitespace-nowrap ${
        activeTab === id 
          ? 'border-[#57C5D5] text-[#57C5D5] bg-[#57C5D5]/5' 
          : 'border-transparent text-slate-400 hover:text-slate-600'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 text-left">Ajustes Globales</h2>
          <p className="text-slate-500 text-sm text-left">Personaliza la identidad y parámetros de evaluación de la institución.</p>
        </div>
        <button className="flex items-center gap-2 px-8 py-2.5 bg-[#57C5D5] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#57C5D5]/20 hover:bg-[#46b3c2] transition-all">
          <Save className="w-4 h-4" /> Guardar Cambios
        </button>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <nav className="flex bg-slate-50/50 border-b border-slate-100 overflow-x-auto scrollbar-hide">
          <TabButton id="info" label="Institución" icon={Building2} />
          <TabButton id="scales" label="Escalas CNEB" icon={Award} />
          <TabButton id="transversal" label="Criterios Finales" icon={ClipboardCheck} />
          <TabButton id="parents" label="Compromisos" icon={HeartHandshake} />
          <TabButton id="attendance" label="Asistencia" icon={Timer} />
        </nav>

        <div className="p-8">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-in slide-in-from-left-4">
              <div className="lg:col-span-2 space-y-6 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre de la I.E.P.</label>
                    <input type="text" value={instInfo.name} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#57C5D5] outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lema</label>
                    <input type="text" value={instInfo.slogan} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dirección</label>
                    <input type="text" value={instInfo.address} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Director/a</label>
                    <input type="text" value={instInfo.directorName} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700" />
                  </div>
                </div>
              </div>
              <div className="space-y-8">
                <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center text-center group hover:border-[#57C5D5] transition-all">
                  <div className="w-24 h-24 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4 overflow-hidden border border-slate-100 group-hover:scale-105 transition-transform">
                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">LOGO IEP</span>
                  </div>
                  <button className="flex items-center gap-2 text-[10px] font-black text-[#57C5D5] hover:underline uppercase tracking-widest">
                    <Upload className="w-3 h-3" /> Cargar Logo
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scales' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 text-left">
              <div className="bg-[#57C5D5]/5 border border-[#57C5D5]/20 p-6 rounded-2xl flex items-start gap-4 mb-8">
                <Award className="w-6 h-6 text-[#57C5D5] shrink-0" />
                <p className="text-[10px] text-[#57C5D5] font-black uppercase tracking-widest leading-relaxed">
                  Las escalas definen la visualización cromática de los logros de aprendizaje en los reportes bimestrales.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scales.map((scale, idx) => (
                  <div key={scale.id} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between group transition-all hover:border-[#57C5D5] hover:shadow-lg">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg"
                        style={{ backgroundColor: scale.color }}
                      >
                        {scale.label}
                      </div>
                      <div>
                        <input 
                          type="text" 
                          value={scale.description} 
                          onChange={(e) => {
                            const newScales = [...scales];
                            newScales[idx].description = e.target.value;
                            setScales(newScales);
                          }}
                          className="font-black text-slate-800 bg-transparent outline-none text-sm w-48 uppercase"
                        />
                        <div className="flex items-center gap-2 mt-1">
                          <Palette className="w-3 h-3 text-slate-300" />
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
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-none p-0"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'transversal' && (
            <div className="space-y-10 animate-in fade-in duration-500 text-left">
              {/* COMPETENCIAS TRANSVERSALES */}
              <section className="space-y-6">
                <header className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.15em] flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-[#57C5D5]" /> Competencias Transversales (CNEB)
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Habilidades obligatorias que atraviesan todas las áreas curriculares.</p>
                  </div>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {transversalCompetencies.map((comp) => (
                    <div key={comp.id} className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl hover:border-[#57C5D5] transition-all group relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-3">
                          <span className="text-[8px] font-black bg-[#57C5D5] text-white px-2 py-0.5 rounded-full uppercase">{comp.code}</span>
                       </div>
                       <div className="flex items-start gap-4">
                          <div className="p-3 bg-white rounded-2xl shadow-sm text-[#57C5D5] group-hover:scale-110 transition-transform">
                             {comp.code === 'TIC' ? <MousePointer2 className="w-5 h-5" /> : <Settings2 className="w-5 h-5" />}
                          </div>
                          <div>
                             <h4 className="text-xs font-black text-slate-800 leading-tight pr-8">{comp.name}</h4>
                             <p className="text-[10px] text-slate-500 font-bold mt-2 leading-relaxed">{comp.description}</p>
                          </div>
                       </div>
                       <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                             <Check className="w-3 h-3" /> Habilitado en Libreta
                          </span>
                          <button className="text-[9px] font-black text-slate-400 hover:text-[#57C5D5] uppercase tracking-widest">Editar Config.</button>
                       </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* CRITERIOS DE COMPORTAMIENTO */}
              <section className="space-y-6">
                <header className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.15em] flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#57C5D5]" /> Evaluación Actitudinal
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Criterios de conducta y valores evaluados por el tutor/a.</p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                    <Plus className="w-3 h-3" /> Nuevo Criterio
                  </button>
                </header>
                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Criterio de Evaluación</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Importancia</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {behaviorCriteria.map((crit) => (
                        <tr key={crit.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-slate-700 uppercase">{crit.name}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                              crit.weight === 'Crítico' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {crit.weight}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-slate-300 hover:text-[#57C5D5]"><Edit3 className="w-3.5 h-3.5" /></button>
                                <button className="p-2 text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
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
            <div className="space-y-8 animate-in slide-in-from-top-4 text-left">
              <header className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-[#57C5D5]" /> Compromisos de la Familia
                  </h4>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">Estos criterios se evalúan bimestralmente en la libreta.</p>
                </div>
                <button 
                  onClick={() => setShowCommitmentModal(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#57C5D5] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#46b3c2] shadow-lg shadow-[#57C5D5]/10"
                >
                  <Plus className="w-3 h-3" /> Agregar Ítem
                </button>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {commitments.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 hover:border-[#57C5D5] transition-all group hover:shadow-md animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:text-[#57C5D5] group-hover:bg-[#57C5D5]/5 transition-all">
                      <Check className="w-4 h-4" />
                    </div>
                    <input 
                      type="text" 
                      value={item}
                      onChange={(e) => {
                        const newC = [...commitments];
                        newC[idx] = e.target.value;
                        setCommitments(newC);
                      }}
                      className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-slate-600"
                    />
                    <button 
                      onClick={() => setCommitments(commitments.filter((_, i) => i !== idx))}
                      className="p-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="max-w-xl mx-auto space-y-12 animate-in zoom-in-95 duration-300 py-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
                  <div className="space-y-6">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <Timer className="w-4 h-4 text-[#57C5D5]" /> Control de Puntualidad
                    </h5>
                    <div className="flex items-end gap-3">
                       <input type="number" defaultValue={15} className="w-24 px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl text-3xl font-black text-[#57C5D5] outline-none focus:border-[#57C5D5] text-center" />
                       <span className="text-xs font-black text-slate-400 pb-5 uppercase tracking-widest">MINUTOS</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase">
                      Tolerancia permitida antes de registrarse como tardanza automática en el parte diario.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visualización de Estados</h5>
                    <div className="space-y-3">
                       {['Asistencia', 'Tardanza', 'Inasistencia'].map(status => (
                         <div key={status} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                            <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{status}</span>
                            <div className={`w-4 h-4 rounded-full shadow-inner ${status === 'Asistencia' ? 'bg-emerald-500 shadow-emerald-500/50' : status === 'Tardanza' ? 'bg-amber-500 shadow-amber-500/50' : 'bg-red-500 shadow-red-500/50'}`} />
                         </div>
                       ))}
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PARA NUEVO COMPROMISO */}
      {showCommitmentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#57C5D5]/10 rounded-2xl text-[#57C5D5]">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Nuevo Compromiso Familiar</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Criterio de Evaluación Bimestral</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCommitmentModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </header>
            
            <div className="p-8 space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Descripción del Criterio
              </label>
              <textarea 
                autoFocus
                value={newCommitmentText}
                onChange={(e) => setNewCommitmentText(e.target.value)}
                placeholder="Ej. Participa activamente en la escuela de padres..."
                className="w-full h-32 px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-medium text-slate-700 focus:border-[#57C5D5] focus:bg-white outline-none transition-all resize-none"
              />
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[9px] text-amber-700 font-bold uppercase leading-tight">
                  Este texto aparecerá tal cual en el reporte impreso de los estudiantes de todos los niveles.
                </p>
              </div>
            </div>

            <footer className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowCommitmentModal(false)}
                className="px-6 py-2.5 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddCommitment}
                className="px-10 py-3 bg-[#57C5D5] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#57C5D5]/20 hover:bg-[#46b3c2] transition-all active:scale-95"
              >
                Vincular Criterio
              </button>
            </footer>
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-3 bg-slate-900 text-white p-6 rounded-3xl shadow-2xl">
         <Info className="w-8 h-8 text-[#57C5D5] shrink-0" />
         <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">
            Nota: Al guardar los cambios, se actualizarán automáticamente las cabeceras de todas las libretas y reportes del ciclo operativo actual.
         </p>
      </div>
    </div>
  );
};

// Internal Edit3 icon mock since it was missing in components but used in some files
const Edit3 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
);

export default SettingsManager;
