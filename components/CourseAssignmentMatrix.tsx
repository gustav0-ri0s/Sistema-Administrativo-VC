
import React, { useState, useEffect } from 'react';
import { mockProfiles, mockCurricularAreas, mockCourseAssignments } from '../services/mockData';
import { CourseAssignment, UserRole, Classroom } from '../types';
import { classroomService } from '../services/database.service';
import { ClipboardList, Plus, User, Book, MapPin, Trash2, Clock, Loader2 } from 'lucide-react';

const CourseAssignmentMatrix: React.FC = () => {
  const [assignments] = useState<CourseAssignment[]>(mockCourseAssignments);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const data = await classroomService.getAll();
        setClassrooms(data);
      } catch (error) {
        console.error('Error fetching classrooms:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClassrooms();
  }, []);

  const docentes = mockProfiles.filter(p => p.role === UserRole.DOCENTE);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-[#57C5D5] animate-spin" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cargando Datos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Asignación de Carga Académica</h2>
          <p className="text-slate-500 text-sm">Cruza la información de Docentes, Salones y Cursos.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#57C5D5] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#57C5D5]/20 hover:bg-[#46b3c2] transition-all"
        >
          <Plus className="w-4 h-4" /> Asignar Carga
        </button>
      </header>

      {showForm && (
        <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-2xl animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-[#57C5D5]" /> Nueva Asignación de Curso
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 font-bold text-[10px] uppercase tracking-widest">Cerrar</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 tracking-widest">
                <User className="w-3 h-3 text-[#57C5D5]" /> Docente
              </label>
              <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#57C5D5]">
                <option>Seleccionar Docente...</option>
                {docentes.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 tracking-widest">
                <MapPin className="w-3 h-3 text-[#57C5D5]" /> Aula / Salón
              </label>
              <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#57C5D5]">
                <option>Seleccionar Aula...</option>
                {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 tracking-widest">
                <Book className="w-3 h-3 text-[#57C5D5]" /> Curso
              </label>
              <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#57C5D5]">
                <option>Seleccionar Curso...</option>
                {/* Fixed: Use mockCurricularAreas instead of mockCourses */}
                {mockCurricularAreas.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 tracking-widest">
                <Clock className="w-3 h-3 text-[#57C5D5]" /> Horas Sem.
              </label>
              <input type="number" defaultValue={2} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-bold text-[#57C5D5]" />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button className="px-12 py-3 bg-[#57C5D5] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#57C5D5]/20 hover:bg-[#46b3c2] transition-all">
              Vincular Carga Académica
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map((as) => {
          const docente = mockProfiles.find(p => p.id === as.profileId);
          const classroom = classrooms.find(c => c.id === as.classroomId.toString());
          /* Fixed: Use mockCurricularAreas instead of mockCourses */
          const course = mockCurricularAreas.find(co => co.id === as.courseId);

          return (
            <div key={as.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group border-l-8 border-l-[#57C5D5]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-xl font-black text-slate-900 leading-tight">{course?.name || 'Curso no especificado'}</h4>
                  <p className="text-[10px] font-black text-[#57C5D5] uppercase tracking-widest mt-2 bg-[#57C5D5]/5 w-fit px-2 py-0.5 rounded-full">{classroom?.name || 'Aula no especificada'}</p>
                </div>
                <button className="p-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-600 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xs font-black text-slate-500 border border-slate-100">
                    {docente?.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 uppercase leading-none">{docente?.full_name || 'Docente no asignado'}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Titular Responsable</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#57C5D5]" />
                    <span className="text-xs font-black text-slate-600 tracking-tighter">{as.hoursPerWeek} HORAS LECTIVAS</span>
                  </div>
                  <span className="text-[9px] font-black px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full uppercase tracking-widest border border-emerald-100">Activo</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


export default CourseAssignmentMatrix;
