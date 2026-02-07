
import React, { useState } from 'react';
import { Classroom } from '../types';
import { mockClassrooms } from '../services/mockData';
import { BookOpen, Plus, Users, Edit3, Trash2 } from 'lucide-react';

const ClassroomManager: React.FC = () => {
  const [classrooms] = useState<Classroom[]>(mockClassrooms);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Configuración de Aulas</h2>
          <p className="text-slate-500 text-sm">Gestiona los salones físicos, grados y capacidad de vacantes.</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#57C5D5] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#57C5D5]/20 hover:bg-[#46b3c2] transition-all"
        >
          <Plus className="w-4 h-4" /> Registrar Nueva Aula
        </button>
      </header>

      {showForm && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#57C5D5]" /> Nueva Aula / Salón
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 font-bold text-[10px] uppercase tracking-widest">Cancelar</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nombre del Aula</label>
              <input type="text" placeholder="Ej. Gotitas de Amor" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#57C5D5] outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nivel</label>
              <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none">
                <option>Inicial</option>
                <option>Primaria</option>
                <option>Secundaria</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Capacidad</label>
              <input type="number" defaultValue={25} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#57C5D5]" />
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button className="px-10 py-3 bg-[#57C5D5] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#57C5D5]/20 hover:bg-[#46b3c2] transition-all">Crear Aula</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classrooms.map((room) => {
          const occupancyRate = (room.enrolled / room.capacity) * 100;
          return (
            <div key={room.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all group">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                   <div className="p-4 bg-[#57C5D5]/10 rounded-2xl text-[#57C5D5]">
                      <BookOpen className="w-8 h-8" />
                   </div>
                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-[#57C5D5]"><Edit3 className="w-4 h-4" /></button>
                      <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </div>
                <h3 className="text-xl font-black text-slate-900 leading-tight">{room.name}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{room.level} - {room.grade}° {room.section}</p>
                
                <div className="mt-8 space-y-4">
                  <div className="flex justify-between items-end">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ocupación Estudiantil</span>
                     <span className={`text-sm font-black ${occupancyRate >= 90 ? 'text-red-600' : 'text-[#57C5D5]'}`}>{room.enrolled} / {room.capacity}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${occupancyRate >= 90 ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-[#57C5D5] shadow-lg shadow-[#57C5D5]/50'}`}
                      style={{ width: `${occupancyRate}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Users className="w-4 h-4 text-slate-300" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Quedan {room.capacity - room.enrolled} vacantes disponibles</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
                <button className="text-[10px] font-black text-[#57C5D5] uppercase tracking-widest hover:underline">Gestionar Alumnos</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClassroomManager;
