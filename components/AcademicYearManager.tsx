
import React from 'react';
import { AcademicYear, YearStatus } from '../types';
import { academicService } from '../services/database.service';
import { useAcademicYear } from '../contexts/AcademicYearContext';
import { canTransitionTo, getTransitionErrorMessage, getBimestreStatusBadge, canEditGrades } from '../utils/academicYear.utils';
import { Calendar, Power, Lock, Unlock, Plus, CalendarDays, CheckCircle2, AlertCircle, Clock, AlertTriangle } from 'lucide-react';

interface AcademicYearManagerProps {
  years: AcademicYear[];
  setYears: React.Dispatch<React.SetStateAction<AcademicYear[]>>;
}

const AcademicYearManager: React.FC<AcademicYearManagerProps> = ({ years: propsYears, setYears: propsSetYears }) => {
  // Use context for global state
  const { academicYears, refreshYears, selectedYear } = useAcademicYear();

  // Use context years if available, otherwise use props
  const years = academicYears.length > 0 ? academicYears : propsYears;
  const setYears = propsSetYears;
  const activeYear = years.find(y => y.is_active);

  const fetchYears = async () => {
    try {
      console.log('AcademicYearManager: Fetching years from Supabase...');
      await refreshYears(); // Use context refresh
      const data = await academicService.getYears();
      console.log('AcademicYearManager: Received years:', data);
      setYears(data);
    } catch (e) {
      console.error('AcademicYearManager: Error fetching years:', e);
    }
  };

  React.useEffect(() => {
    console.log('AcademicYearManager: Component mounted, years.length =', years.length);
    fetchYears();
  }, []);

  const setYearAsActive = async (year: AcademicYear) => {
    try {
      console.log('AcademicYearManager: Activating year', year.year);
      // Use the new atomic activateYear service
      await academicService.activateYear(year.id);
      console.log('AcademicYearManager: Year activated successfully');
      await fetchYears();
      alert(`Año ${year.year} activado exitosamente`);
    } catch (e) {
      console.error('AcademicYearManager: Error setting active year:', e);
      alert('Error al activar el año académico: ' + (e as Error).message);
    }
  };

  const updateYearStatus = async (yearId: number, currentStatus: YearStatus, newStatus: YearStatus) => {
    // Validate state transition
    if (!canTransitionTo(currentStatus, newStatus)) {
      const errorMsg = getTransitionErrorMessage(currentStatus, newStatus);
      alert(errorMsg);
      return;
    }

    try {
      console.log('AcademicYearManager: Updating year status', yearId, 'from', currentStatus, 'to', newStatus);
      await academicService.updateYear(yearId, { status: newStatus });
      console.log('AcademicYearManager: Status updated successfully');
      await fetchYears();
    } catch (e) {
      console.error('AcademicYearManager: Error updating status:', e);
      alert('Error al actualizar el estado: ' + (e as Error).message);
    }
  };

  const toggleBimestreLock = async (bimId: number, currentLock: boolean) => {
    try {
      console.log('AcademicYearManager: Toggling bimestre lock', bimId, 'from', currentLock, 'to', !currentLock);
      await academicService.updateBimestre(bimId, { is_locked: !currentLock });
      console.log('AcademicYearManager: Lock toggled successfully');
      await fetchYears();
    } catch (e) {
      console.error('AcademicYearManager: Error toggling lock:', e);
      alert('Error al cambiar el candado: ' + (e as Error).message);
    }
  };

  const handleCreateYear = async () => {
    const nextYear = Math.max(...years.map(y => y.year), new Date().getFullYear()) + 1;
    try {
      console.log('AcademicYearManager: Creating new year', nextYear);
      await academicService.createYear(nextYear, 'planificación');
      console.log('AcademicYearManager: Year created successfully');
      await fetchYears();
      alert(`Ciclo Académico ${nextYear} creado exitosamente`);
    } catch (e) {
      console.error('AcademicYearManager: Error creating year:', e);
      alert('Error al crear el año: ' + (e as Error).message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Configuración de Ciclos Académicos</h2>
          <p className="text-slate-500 text-sm">Control central de apertura de años, matrículas y periodos de evaluación.</p>
        </div>
        <button
          onClick={handleCreateYear}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#57C5D5] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#57C5D5]/20 hover:bg-[#46b3c2] transition-all"
        >
          <Plus className="w-4 h-4" /> Aperturar Nuevo Ciclo
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {years.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest">No hay ciclos configurados</p>
          </div>
        )}
        {[...years].sort((a, b) => b.year - a.year).map((y) => (
          <div
            key={y.year}
            className={`p-6 rounded-3xl border-2 transition-all relative overflow-hidden ${y.is_active ? 'border-[#57C5D5] bg-white ring-8 ring-[#57C5D5]/5 shadow-xl' : 'border-slate-100 bg-slate-50 shadow-sm'
              }`}
          >
            {y.is_active && (
              <div className="absolute top-0 right-0 bg-[#57C5D5] text-white px-4 py-1.5 rounded-bl-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Operando
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div className={`p-3 rounded-2xl ${y.is_active ? 'bg-[#57C5D5]/10 text-[#57C5D5]' : 'bg-slate-200 text-slate-500'}`}>
                <Calendar className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 leading-none">{y.year}</h3>
                <span className={`text-[10px] font-bold uppercase tracking-tighter ${y.status === 'abierto' ? 'text-emerald-500' : y.status === 'planificación' ? 'text-[#57C5D5]' : 'text-slate-400'
                  }`}>
                  {y.status === 'planificación' ? 'Planificación' : y.status.charAt(0).toUpperCase() + y.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {!y.is_active && y.status !== 'cerrado' && (
                <button
                  onClick={() => setYearAsActive(y)}
                  className="w-full py-2.5 bg-[#57C5D5] text-white rounded-xl text-xs font-bold hover:bg-[#46b3c2] transition-colors flex items-center justify-center gap-2"
                >
                  <Power className="w-3 h-3" /> Activar Año Escolar
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={y.status}
                  onChange={(e) => updateYearStatus(y.id, y.status, e.target.value as YearStatus)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase text-slate-600 outline-none focus:ring-1 focus:ring-[#57C5D5] cursor-pointer"
                >
                  <option value="abierto">Abierto</option>
                  <option value="planificación">Planificación</option>
                  <option value="cerrado">Cerrado</option>
                </select>

                <button className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase text-slate-400 hover:text-[#57C5D5] transition-colors">
                  Configurar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeYear && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <header className="p-6 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#57C5D5] rounded-2xl">
                <CalendarDays className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-black text-lg uppercase tracking-tight">Cronograma Activo {activeYear.year}</h4>
                <p className="text-[#57C5D5] text-[10px] font-bold uppercase tracking-[0.2em]">Control de periodos de evaluación</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl border border-white/10">
                <Clock className="w-4 h-4 text-[#57C5D5]" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Hoy: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </header>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {activeYear.bimestres.map((bim) => (
                <div
                  key={bim.id}
                  className={`group p-6 rounded-3xl border-2 transition-all duration-300 relative ${bim.is_locked
                    ? 'bg-slate-50 border-slate-200 opacity-75'
                    : 'bg-white border-[#57C5D5]/20 shadow-lg shadow-[#57C5D5]/5 ring-4 ring-[#57C5D5]/5'
                    }`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${bim.is_locked ? 'text-slate-400' : 'text-[#57C5D5]'}`}>
                        Periodo Académico
                      </span>
                      <h5 className={`text-xl font-black ${bim.is_locked ? 'text-slate-600' : 'text-slate-900'}`}>
                        {bim.name}
                      </h5>
                    </div>
                    <button
                      onClick={() => toggleBimestreLock(bim.id, bim.is_locked)}
                      title={bim.is_locked ? "Abrir Bimestre" : "Cerrar Bimestre"}
                      className={`p-3 rounded-2xl transition-all duration-300 transform active:scale-90 shadow-lg ${bim.is_locked
                        ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 shadow-emerald-500/20'
                        }`}
                    >
                      {bim.is_locked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Apertura</label>
                        {!bim.is_locked && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                      </div>
                      <input
                        type="date"
                        disabled={bim.is_locked}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#57C5D5] transition-all disabled:cursor-not-allowed"
                        defaultValue={bim.start_date}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cierre</label>
                      <input
                        type="date"
                        disabled={bim.is_locked}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#57C5D5] transition-all disabled:cursor-not-allowed"
                        defaultValue={bim.end_date}
                      />
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <div className={`flex items-center gap-2 ${bim.is_locked ? 'text-slate-400' : 'text-emerald-600'}`}>
                      {bim.is_locked ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        {bim.is_locked ? 'Ingreso Deshabilitado' : 'Abierto para Notas'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-[#57C5D5]/5 rounded-3xl border border-[#57C5D5]/20 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-[#57C5D5] shrink-0" />
              <div>
                <h6 className="text-sm font-black text-slate-900 uppercase">Aviso de Seguridad</h6>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Al cerrar un bimestre con el icono de candado, se deshabilita automáticamente la edición de asistencia, notas y criterios transversales para todos los docentes de Inicial, Primaria y Secundaria. Solo el Administrador puede revertir esta acción.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicYearManager;
