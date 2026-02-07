
import React, { useState } from 'react';
import { Profile, Classroom, Assignment, UserRole } from '../types';
import { mockClassrooms } from '../services/mockData';
import { Check, ShieldCheck, Info } from 'lucide-react';

interface AssignmentPanelProps {
  profile: Profile;
  onSave: (assignments: Assignment[]) => void;
  initialAssignments: Assignment[];
}

const AssignmentPanel: React.FC<AssignmentPanelProps> = ({ profile, onSave, initialAssignments }) => {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);

  const isSupervisoryRole = profile.role === UserRole.SUBDIRECTOR || profile.role === UserRole.ADMIN;

  const toggleAssignment = (classroomId: string, field: 'canAttendance' | 'canGrades') => {
    const existingIndex = assignments.findIndex(a => a.classroomId === classroomId);
    
    if (existingIndex > -1) {
      const newAssignments = [...assignments];
      newAssignments[existingIndex] = {
        ...newAssignments[existingIndex],
        [field]: !newAssignments[existingIndex][field]
      };
      if (!newAssignments[existingIndex].canAttendance && !newAssignments[existingIndex].canGrades) {
        newAssignments.splice(existingIndex, 1);
      }
      setAssignments(newAssignments);
    } else {
      setAssignments([
        ...assignments,
        { 
          profileId: profile.id, 
          classroomId, 
          canAttendance: field === 'canAttendance', 
          canGrades: field === 'canGrades' 
        }
      ]);
    }
  };

  const getAssignment = (classroomId: string) => {
    return assignments.find(a => a.classroomId === classroomId) || { canAttendance: false, canGrades: false };
  };

  if (isSupervisoryRole) {
    return (
      <div className="bg-[#57C5D5]/5 border border-[#57C5D5]/20 rounded-2xl p-6 flex items-start gap-4 animate-in fade-in zoom-in duration-300">
        <ShieldCheck className="w-10 h-10 text-[#57C5D5] shrink-0" />
        <div>
          <h3 className="text-slate-900 font-bold text-lg">Permisos de Supervisión Global</h3>
          <p className="text-slate-600 mt-1 text-sm leading-relaxed">
            El rol <span className="font-bold text-[#57C5D5]">{profile.role}</span> cuenta con permisos automáticos de lectura y supervisión para todos los grados y secciones. No requiere asignación manual.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Asignación de Salones</h3>
          <p className="text-sm text-slate-500">Define las responsabilidades de {profile.full_name}.</p>
        </div>
        <button 
          onClick={() => onSave(assignments)}
          className="px-6 py-2 bg-[#57C5D5] text-white rounded-xl text-sm font-bold hover:bg-[#46b3c2] transition-all shadow-lg shadow-[#57C5D5]/20"
        >
          Guardar Asignaciones
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockClassrooms.map((room) => {
          const current = getAssignment(room.id);
          const hasSome = current.canAttendance || current.canGrades;
          return (
            <div key={room.id} className={`p-4 rounded-2xl border-2 transition-all ${
              hasSome ? 'border-[#57C5D5] bg-white ring-4 ring-[#57C5D5]/5' : 'border-slate-100 bg-slate-50 opacity-80'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{room.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{room.level}</p>
                </div>
                {hasSome && <Check className="w-5 h-5 text-[#57C5D5]" />}
              </div>
              
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={current.canAttendance}
                    onChange={() => toggleAssignment(room.id, 'canAttendance')}
                    className="w-4 h-4 rounded text-[#57C5D5] border-slate-300 focus:ring-[#57C5D5]"
                  />
                  <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">Asistencia</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={current.canGrades}
                    onChange={() => toggleAssignment(room.id, 'canGrades')}
                    className="w-4 h-4 rounded text-[#57C5D5] border-slate-300 focus:ring-[#57C5D5]"
                  />
                  <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">Notas</span>
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0" />
        <p className="text-[10px] text-amber-800 leading-relaxed font-bold uppercase tracking-tight">
          Importante: Los Docentes suelen tener asignaciones por curso específico en el módulo de Carga Horaria.
        </p>
      </div>
    </div>
  );
};

export default AssignmentPanel;
