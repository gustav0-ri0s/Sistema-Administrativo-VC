
import React, { useState } from 'react';
/* Fixed: Updated imports to use CurricularArea and mockCurricularAreas */
import { CurricularArea } from '../types';
import { mockCurricularAreas } from '../services/mockData';
import { Library, Plus, Search, Trash2, Edit3, BookOpen } from 'lucide-react';

const CourseManager: React.FC = () => {
  /* Fixed: Use CurricularArea and mockCurricularAreas */
  const [courses] = useState<CurricularArea[]>(mockCurricularAreas);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);

  const filtered = courses.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Catálogo de Cursos</h2>
          <p className="text-slate-500 text-sm">Gestiona la lista oficial de materias y áreas académicas.</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#57C5D5] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#57C5D5]/20 hover:bg-[#46b3c2] transition-all"
        >
          <Plus className="w-4 h-4" /> Nuevo Curso
        </button>
      </header>

      {showForm && (
        <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 shadow-2xl animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Library className="w-5 h-5 text-[#57C5D5]" /> Registrar Materia
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 font-bold text-[10px] uppercase tracking-widest">Cancelar</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nombre del Curso</label>
              <input type="text" placeholder="Ej. Álgebra Avanzada" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#57C5D5] outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Área Curricular</label>
              <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none">
                <option>Ciencias</option>
                <option>Letras</option>
                <option>Psicomotricidad</option>
                <option>Arte y Cultura</option>
                <option>Inglés</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nivel Aplicable</label>
              <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none">
                <option>Todos</option>
                <option>Inicial</option>
                <option>Primaria</option>
                <option>Secundaria</option>
              </select>
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button className="px-10 py-3 bg-[#57C5D5] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#57C5D5]/20 hover:bg-[#46b3c2] transition-all">Crear Curso</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar curso..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#57C5D5]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Curso</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Área</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nivel</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(course => (
              <tr key={course.id} className="hover:bg-slate-50/50 group transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#57C5D5]/10 text-[#57C5D5] rounded-xl">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-700 text-sm">{course.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500 font-bold uppercase tracking-tight">
                  {/* Fixed: Use name as area since CurricularArea is the area */}
                  {course.name}
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-full uppercase tracking-tighter">{course.level}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-white hover:shadow-md rounded-lg text-slate-400 hover:text-[#57C5D5] transition-all">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-white hover:shadow-md rounded-lg text-slate-400 hover:text-red-600 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CourseManager;
