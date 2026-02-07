
import React, { useState, useEffect, useMemo } from 'react';
import { Student, Parent, AcademicYear } from '../types';
import { mockClassrooms, mockStudents } from '../services/mockData';
import { useAcademicYear } from '../contexts/AcademicYearContext';
import {
  User,
  Heart,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  CalendarRange,
  CheckCircle,
  Search,
  X,
  UserCircle,
  AlertCircle,
  Edit,
  // Added missing Info icon import
  Info
} from 'lucide-react';

interface EnrollmentWizardProps {
  academicYears: AcademicYear[];
}

const EnrollmentWizard: React.FC<EnrollmentWizardProps> = ({ academicYears: propsYears }) => {
  // Use context for academic years
  const { academicYears: contextYears } = useAcademicYear();
  const academicYears = contextYears.length > 0 ? contextYears : propsYears;

  // Filter only open years for enrollment
  const openYears = academicYears.filter(year => year.status === 'abierto');
  const hasNoOpenYears = openYears.length === 0;
  const [step, setStep] = useState(1);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  const openYears = academicYears.filter(y => y.status === 'Abierto');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    if (openYears.length > 0 && selectedYear === null) {
      const activeAndOpen = openYears.find(y => y.isActive);
      setSelectedYear(activeAndOpen ? activeAndOpen.year : openYears[0].year);
    }
  }, [openYears, selectedYear]);

  const [formData, setFormData] = useState<Partial<Student>>({
    dni: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    parents: [
      { id: 'p1', dni: '', full_name: '', phone: '', occupation: '', relationship: 'Padre', is_guardian: false },
      { id: 'p2', dni: '', full_name: '', phone: '', occupation: '', relationship: 'Madre', is_guardian: true }
    ]
  });

  // Filtrado de estudiantes en tiempo real para el modal
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return mockStudents.filter(s =>
      s.dni.includes(query) ||
      s.first_name.toLowerCase().includes(query) ||
      s.last_name.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSelectStudent = (student: Student) => {
    setFormData({
      ...formData,
      dni: student.dni,
      first_name: student.first_name,
      last_name: student.last_name,
      birth_date: student.birth_date,
    });
    setIsEditMode(true);
    setIsSearchModalOpen(false);
    setSearchQuery('');
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const updateParent = (index: number, field: keyof Parent, value: any) => {
    const newParents = [...(formData.parents || [])];
    newParents[index] = { ...newParents[index], [field]: value };
    if (field === 'is_guardian' && value === true) {
      newParents.forEach((p, i) => { if (i !== index) p.is_guardian = false; });
    }
    setFormData({ ...formData, parents: newParents });
  };

  const updateStudentField = (field: keyof Student, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (isEditMode) setIsEditMode(false); // Si edita manualmente después de buscar, el modo estricto de "carga" se relaja
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header del Proceso */}
      <div className="bg-white border-b-4 border-[#57C5D5] rounded-3xl p-6 shadow-xl shadow-[#57C5D5]/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#57C5D5]/10 rounded-2xl text-[#57C5D5]">
            <CalendarRange className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Periodo de Matrícula</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">I.E.P. Valores y Ciencias</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {openYears.length > 0 ? (
            openYears.map(y => (
              <button
                key={y.year}
                onClick={() => setSelectedYear(y.year)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold transition-all border-2 ${selectedYear === y.year
                    ? 'bg-[#57C5D5] text-white border-[#57C5D5] shadow-lg shadow-[#57C5D5]/20'
                    : 'bg-white text-slate-400 border-slate-100 hover:border-[#57C5D5]/30'
                  }`}
              >
                {selectedYear === y.year && <CheckCircle className="w-4 h-4" />}
                Año Lectivo {y.year}
              </button>
            ))
          ) : (
            <div className="bg-red-50 text-red-600 px-8 py-3 rounded-2xl border-2 border-red-100 flex items-center gap-3 font-black">MATRÍCULAS CERRADAS</div>
          )}
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 px-12">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-2 relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step >= s ? 'bg-[#57C5D5] text-white ring-4 ring-[#57C5D5]/10' : 'bg-slate-200 text-slate-500'
                }`}>
                {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= s ? 'text-[#57C5D5]' : 'text-slate-400'}`}>
                {s === 1 ? 'Estudiante' : s === 2 ? 'Familia' : 'Finalizar'}
              </span>
            </div>
            {s < 3 && <div className={`flex-1 h-1 mx-4 rounded-full transition-all duration-500 ${step > s ? 'bg-[#57C5D5]' : 'bg-slate-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-10">
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <User className="w-6 h-6 text-[#57C5D5]" />
                  <h3 className="text-xl font-bold text-slate-900">Datos del Estudiante</h3>
                </div>
                {isEditMode && (
                  <div className="flex items-center gap-2 bg-[#57C5D5]/10 px-3 py-1 rounded-full border border-[#57C5D5]/20 animate-pulse">
                    <Edit className="w-3 h-3 text-[#57C5D5]" />
                    <span className="text-[10px] font-black text-[#57C5D5] uppercase">Actualizando Expediente</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between">
                    <span>DNI Estudiante (Obligatorio)</span>
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={formData.dni}
                      onChange={(e) => updateStudentField('dni', e.target.value)}
                      className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#57C5D5] outline-none text-sm transition-all"
                      placeholder="8 dígitos"
                    />
                    <button
                      type="button"
                      onClick={() => setIsSearchModalOpen(true)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#57C5D5] text-white rounded-lg shadow-lg shadow-[#57C5D5]/20 hover:bg-[#46b3c2] transition-colors"
                      title="Buscar estudiante en la base de datos"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombres</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => updateStudentField('first_name', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#57C5D5] outline-none text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Apellidos</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => updateStudentField('last_name', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#57C5D5] outline-none text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => updateStudentField('birth_date', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#57C5D5] outline-none text-sm"
                  />
                </div>
              </div>

              {!isEditMode && (
                <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                  {/* Fixed: Icon Info was missing from imports */}
                  <Info className="w-5 h-5 text-amber-500 shrink-0" />
                  <p className="text-[10px] text-amber-700 font-bold uppercase leading-relaxed">
                    Si el estudiante ya estuvo matriculado anteriormente, use la lupa para cargar sus datos automáticamente y evitar duplicados.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <Heart className="w-6 h-6 text-red-500" />
                <h3 className="text-xl font-bold text-slate-900">Registro de Familia</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {formData.parents?.map((parent, idx) => (
                  <div key={parent.id} className={`p-6 rounded-3xl border-2 transition-all ${parent.is_guardian ? 'border-[#57C5D5] bg-white ring-8 ring-[#57C5D5]/5' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-extrabold text-slate-900 tracking-tight">Datos de {parent.relationship}</h4>
                      <button
                        onClick={() => updateParent(idx, 'is_guardian', !parent.is_guardian)}
                        className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase transition-all ${parent.is_guardian ? 'bg-[#57C5D5] text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-400'
                          }`}
                      >
                        {parent.is_guardian ? 'Apoderado' : 'Asignar'}
                      </button>
                    </div>
                    <div className="space-y-4">
                      <input type="text" placeholder="Nombres Completos" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-1 focus:ring-[#57C5D5]" />
                      <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="DNI" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-1 focus:ring-[#57C5D5]" />
                        <input type="text" placeholder="Celular" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-1 focus:ring-[#57C5D5]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <GraduationCap className="w-6 h-6 text-emerald-600" />
                <h3 className="text-xl font-bold text-slate-900">Asignación Final</h3>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aula y Sección</label>
                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#57C5D5] outline-none">
                  <option>Seleccione un aula con vacantes...</option>
                  {mockClassrooms.map(c => <option key={c.id} value={c.id}>{c.name} ({c.enrolled}/{c.capacity})</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        <footer className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-[#718096] hover:text-slate-800 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
          <button
            disabled={!selectedYear || !formData.dni}
            onClick={step < 3 ? nextStep : () => { }}
            className={`flex items-center gap-2 px-10 py-3 rounded-2xl font-bold text-sm shadow-xl transition-all active:scale-95 ${step < 3 ? 'bg-[#57C5D5] text-white shadow-[#57C5D5]/20 hover:bg-[#46b3c2]' : 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700'
              } disabled:opacity-50`}
          >
            {step < 3 ? 'Siguiente Paso' : 'Confirmar Matrícula'} <ChevronRight className="w-4 h-4" />
          </button>
        </footer>
      </div>

      {/* MODAL DE BÚSQUEDA INTEGRADA */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
            <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#57C5D5] rounded-xl text-white">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 leading-none">Buscador de Estudiantes</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Base de Datos Global</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsSearchModalOpen(false);
                  setSearchQuery('');
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </header>

            <div className="p-6 space-y-6">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#57C5D5] transition-colors" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Escriba DNI, Nombres o Apellidos..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-[#57C5D5] focus:bg-white text-sm font-medium transition-all"
                />
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => handleSelectStudent(student)}
                      className="w-full p-4 rounded-2xl border-2 border-transparent hover:border-[#57C5D5] hover:bg-[#57C5D5]/5 flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#57C5D5]/10 group-hover:text-[#57C5D5] transition-all">
                          <UserCircle className="w-8 h-8" />
                        </div>
                        <div className="text-left">
                          <p className="font-black text-slate-800 text-sm uppercase leading-tight">
                            {student.last_name}, {student.first_name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">DNI: {student.dni}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#57C5D5] transition-all" />
                    </button>
                  ))
                ) : searchQuery.length > 2 ? (
                  <div className="text-center py-10 space-y-3">
                    <div className="p-4 bg-slate-50 rounded-full w-fit mx-auto">
                      <AlertCircle className="w-10 h-10 text-slate-300" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-600">No se encontraron coincidencias</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        Puede proceder con el registro manual
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 opacity-40">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Empiece a escribir para buscar...
                    </p>
                  </div>
                )}
              </div>
            </div>

            <footer className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Base de Datos Valores y Ciencias &copy; 2025
              </p>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentWizard;
