
import React, { useState, useEffect } from 'react';
import { AcademicYear, IncidentSummary } from '../types';
import { mockClassrooms, mockProfiles, mockIncidents as fallbackIncidents } from '../services/mockData';
import { incidentService } from '../services/database.service';
import { useAcademicYear } from '../contexts/AcademicYearContext';
import { UserPlus, Users, School, AlertTriangle, CheckCircle, Clock, Eye, ExternalLink } from 'lucide-react';

interface EnrollmentDashboardProps {
  selectedYear?: AcademicYear;
}

const EnrollmentDashboard: React.FC<EnrollmentDashboardProps> = ({ selectedYear: propsSelectedYear }) => {
  // Use context, fallback to props for backward compatibility
  const { selectedYear: contextYear, isYearReadOnly } = useAcademicYear();
  const selectedYear = contextYear || propsSelectedYear;

  const [activeIncidents, setActiveIncidents] = useState<IncidentSummary[]>([]);
  const [incidentStats, setIncidentStats] = useState({ total: 0, pending: 0 });
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const [recent, stats] = await Promise.all([
          incidentService.getRecent(),
          incidentService.getStats()
        ]);

        if (recent && recent.length > 0) {
          setActiveIncidents(recent);
        } else {
          setActiveIncidents(fallbackIncidents);
        }

        if (stats) {
          setIncidentStats(stats);
        }
      } catch (error) {
        console.error('Error loading incidents:', error);
        setActiveIncidents(fallbackIncidents);
      } finally {
        setIsLoadingIncidents(false);
      }
    };

    fetchIncidents();
  }, []);

  const isReadOnly = selectedYear ? isYearReadOnly(selectedYear) : false;
  const isPlanning = selectedYear?.status === 'planificación';
  const isActive = selectedYear?.is_active;

  const totalStaff = mockProfiles.length;
  // Use real data from stats
  const totalIncidents = incidentStats.total;
  const pendingIncidents = incidentStats.pending;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Read-Only Banner */}
      {isReadOnly && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
          <Eye className="w-5 h-5 text-amber-600" />
          <div>
            <p className="text-sm font-bold text-amber-900">Modo Solo Lectura</p>
            <p className="text-xs text-amber-700">Este año académico está cerrado. Los datos son de solo consulta.</p>
          </div>
        </div>
      )}

      {/* Planning Mode Banner */}
      {isPlanning && !isActive && (
        <div className="bg-[#57C5D5]/10 border-2 border-[#57C5D5]/30 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-[#57C5D5]" />
          <div>
            <p className="text-sm font-bold text-[#57C5D5]">Modo Planificación</p>
            <p className="text-xs text-slate-600">Este año está en fase de planificación. Active el año para comenzar matrículas.</p>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 text-left uppercase tracking-tight">Panel Administrativo {selectedYear?.year}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : isPlanning ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}>
              Estado: {selectedYear?.status}
            </span>
            {isActive && <p className="text-[#718096] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-500" /> Ciclo Académico Vigente
            </p>}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Última Sincronización</p>
            <p className="text-xs font-bold text-slate-700">Hoy, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: ESTUDIANTES */}
        <div className="bg-[#57C5D5] p-6 rounded-3xl text-white shadow-xl shadow-[#57C5D5]/10 flex items-center justify-between overflow-hidden relative">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <UserPlus className="w-24 h-24" />
          </div>
          <div className="relative">
            <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Alumnado Total</p>
            <h3 className="text-4xl font-black mt-1">{isReadOnly ? '245' : isPlanning ? '12' : '128'}</h3>
            <p className="text-[10px] mt-2 font-bold bg-white/20 w-fit px-2 py-0.5 rounded-full uppercase tracking-tighter">
              {isPlanning ? 'Proyecciones' : 'Matrículas Confirmadas'}
            </p>
          </div>
          <div className="p-4 bg-white/20 rounded-2xl relative">
            <UserPlus className="w-8 h-8" />
          </div>
        </div>

        {/* CARD 2: PERSONAL */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-[#57C5D5] transition-colors">
          <div>
            <p className="text-[#718096] text-[10px] font-bold uppercase tracking-widest">Talento Humano</p>
            <h3 className="text-4xl font-black mt-1 text-slate-800">{totalStaff}</h3>
            <p className="text-[10px] mt-2 text-[#57C5D5] font-black uppercase tracking-tighter">Colaboradores Activos</p>
          </div>
          <div className="p-4 bg-[#57C5D5]/5 rounded-2xl text-[#57C5D5]">
            <Users className="w-8 h-8" />
          </div>
        </div>

        {/* CARD 3: CONVIVENCIA (Datos de la DB de Incidentes) */}
        <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl flex items-center justify-between group hover:bg-slate-800 transition-all overflow-hidden relative">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <AlertTriangle className="w-24 h-24" />
          </div>
          <div className="relative">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Convivencia Escolar</p>
            <h3 className="text-4xl font-black mt-1 text-white">{totalIncidents}</h3>
            <p className="text-[10px] mt-2 text-amber-400 font-bold uppercase tracking-tighter flex items-center gap-1">
              <Clock className="w-3 h-3" /> {pendingIncidents} Reportes pendientes
            </p>
          </div>
          <div className="p-4 bg-white/10 rounded-2xl text-[#57C5D5]">
            <AlertTriangle className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monitoreo de Vacantes */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h4 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Infraestructura y Aforo</h4>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#57C5D5]" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Capacidad Instalada</span>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {mockClassrooms.map(room => (
              <div key={room.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">{room.name}</span>
                  <span className="text-[10px] font-black text-slate-400">{room.enrolled}/{room.capacity}</span>
                </div>
                <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#57C5D5] h-full" style={{ width: `${(room.enrolled / room.capacity) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Últimos Incidentes (Feeding from Incidents DB) */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h4 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Reportes de Convivencia</h4>
            <a
              href="https://sistema-de-incidencias.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[9px] font-black text-[#57C5D5] uppercase hover:underline"
            >
              Ver bitácora completa <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="divide-y divide-slate-50">
            {isLoadingIncidents ? (
              <div className="p-8 text-center text-slate-400 text-xs">Cargando incidencias...</div>
            ) : (
              activeIncidents.map(inc => {
                const getStatusStyle = (status: string) => {
                  const normalized = status.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  switch (normalized) {
                    case 'registrada': return 'bg-slate-100 text-slate-600 border border-slate-200'; // Plomo
                    case 'leida': return 'bg-blue-50 text-blue-600 border border-blue-100'; // Azul
                    case 'resuelta':
                    case 'resolved': return 'bg-emerald-50 text-emerald-600 border border-emerald-100'; // Verde
                    case 'atencion': return 'bg-amber-50 text-amber-600 border border-amber-100'; // Naranja/Ambar
                    case 'pending': return 'bg-amber-50 text-amber-600 border border-amber-100'; // Fallback for pending
                    default: return 'bg-slate-50 text-slate-500 border border-slate-100';
                  }
                };

                const formatDate = (dateString: string) => {
                  try {
                    const date = new Date(dateString);
                    // Format: DD/MM/YYYY HH:MM
                    return new Intl.DateTimeFormat('es-PE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    }).format(date);
                  } catch (e) {
                    return dateString;
                  }
                };

                const normalizedStatus = inc.status.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                return (
                  <div key={inc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${normalizedStatus === 'registrada' ? 'bg-slate-400' :
                        normalizedStatus === 'leida' ? 'bg-blue-500' :
                          normalizedStatus === 'resuelta' || normalizedStatus === 'resolved' ? 'bg-emerald-500' :
                            normalizedStatus === 'atencion' || normalizedStatus === 'pending' ? 'bg-amber-500' : 'bg-slate-300'
                        }`} />
                      <div>
                        <p className="text-xs font-bold text-slate-700">{inc.correlative || 'S/N'}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{inc.type} • {formatDate(inc.incident_date)}</p>
                      </div>
                    </div>
                    <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${getStatusStyle(inc.status)}`}>
                      {inc.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentDashboard;
