
import React, { useState, useEffect, useMemo } from 'react';
import { Student, Parent, AcademicYear, Classroom } from '../types';
import { academicService, classroomService, studentService, enrollmentService } from '../services/database.service';

import { useAcademicYear } from '../contexts/AcademicYearContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../services/supabase';
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
  Info,
  Loader2,
  MapPin,
  Copy
} from 'lucide-react';

interface EnrollmentWizardProps {
  academicYears: AcademicYear[];
  onTabChange?: (tab: string) => void;
}

const EnrollmentWizard: React.FC<EnrollmentWizardProps> = ({ academicYears: propsYears, onTabChange }) => {
  const { academicYears: contextYears } = useAcademicYear();
  const academicYears = contextYears.length > 0 ? contextYears : propsYears;

  const openYears = academicYears.filter(year => year.status === 'abierto' || year.status === 'planificación');

  const [step, setStep] = useState(1);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dbStudents, setDbStudents] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoadingClassrooms, setIsLoadingClassrooms] = useState(false);
  const { showToast } = useToast();

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<string>('');

  useEffect(() => {
    if (openYears.length > 0 && selectedYear === null) {
      const activeAndOpen = openYears.find(y => y.is_active);
      setSelectedYear(activeAndOpen ? activeAndOpen.year : openYears[0].year);
    }
  }, [openYears, selectedYear]);

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        setIsLoadingClassrooms(true);
        const data = await classroomService.getAll();
        setClassrooms(data);
      } catch (error) {
        console.error('Error fetching classrooms:', error);
      } finally {
        setIsLoadingClassrooms(false);
      }
    };
    fetchClassrooms();
  }, []);

  const [formData, setFormData] = useState<Partial<Student>>({
    dni: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    address: '',
    gender: 'M',
    parents: [
      { id: 'p1', dni: '', full_name: '', phone: '', occupation: '', address: '', relationship: 'Padre', is_guardian: false },
      { id: 'p2', dni: '', full_name: '', phone: '', occupation: '', address: '', relationship: 'Madre', is_guardian: true }
    ]
  });

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        try {
          setIsSearching(true);
          const results = await studentService.searchStudents(searchQuery);
          setDbStudents(results);
        } catch (error) {
          console.error('Error searching students:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setDbStudents([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectStudent = (student: Student) => {
    setFormData({
      ...formData,
      id: student.id,
      dni: student.dni,
      first_name: student.first_name,
      last_name: student.last_name,
      birth_date: student.birth_date,
      address: student.address,
      parents: student.parents && student.parents.length > 0 ? student.parents : formData.parents
    });
    setIsEditMode(true);
    setIsSearchModalOpen(false);
    setSearchQuery('');
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!formData.dni || formData.dni.length < 8) {
        showToast('error', 'Debe ingresar un DNI válido de 8 dígitos.', 'DNI Requerido');
        return;
      }
      try {
        setIsValidating(true);
        const { data: existingStudent, error } = await supabase
          .from('students')
          .select('id, first_name, last_name')
          .eq('dni', formData.dni)
          .maybeSingle();
        if (error) throw error;
        if (existingStudent && (!formData.id || formData.id !== existingStudent.id)) {
          showToast('warning', `El DNI ${formData.dni} ya pertenece a ${existingStudent.first_name} ${existingStudent.last_name}.`, 'Estudiante ya Registrado');
          setIsValidating(false);
          return;
        }
      } catch (err) {
        console.error('Validation error:', err);
      } finally {
        setIsValidating(false);
      }
    }
    setStep(s => Math.min(s + 1, 3));
  };

  const handleSubmit = async () => {
    if (!selectedYear) return;
    try {
      setIsSubmitting(true);
      const yearObj = academicYears.find(y => y.year === selectedYear);
      if (!yearObj) throw new Error("Año académico no encontrado");
      await enrollmentService.completeEnrollment({
        student: formData,
        parents: formData.parents || [],
        academicYearId: yearObj.id,
        classroomId: selectedClassroom ? parseInt(selectedClassroom) : undefined
      });
      showToast('success', 'Matrícula completada exitosamente.', 'Proceso Finalizado');
      setIsSuccess(true);
    } catch (error: any) {
      console.error('Enrollment error:', error);
      showToast('error', `Error: ${error.message}`, 'Error de Sistema');
    } finally {
      setIsSubmitting(false);
    }
  };

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
  };

  const handleDniLookup = async (index: number, dni: string) => {
    if (dni.length !== 8) return;
    try {
      const { data, error } = await supabase.functions.invoke('get-reniec-data', { body: { dni } });
      if (data && data.normalized_full_name) {
        updateParent(index, 'full_name', data.normalized_full_name);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyAddressFromStudent = (idx: number) => {
    if (formData.address) {
      updateParent(idx, 'address', formData.address);
      showToast('success', 'Dirección copiada del estudiante', 'Copiado');
    } else {
      showToast('warning', 'El estudiante no tiene dirección registrada', 'Aviso');
    }
  };

  const handleCopyAddressFromOtherParent = (idx: number) => {
    const otherIdx = idx === 0 ? 1 : 0;
    const otherParent = formData.parents?.[otherIdx];
    if (otherParent?.address) {
      updateParent(idx, 'address', otherParent.address);
      showToast('success', `Dirección copiada de la familia`, 'Copiado');
    } else {
      showToast('warning', 'No hay dirección registrada en el otro familiar', 'Aviso');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
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
          {openYears.map(y => (
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
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-8 px-12">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-2 relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step >= s ? 'bg-[#57C5D5] text-white ring-4 ring-[#57C5D5]/10' : 'bg-slate-200 text-slate-500'}`}>
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
          {isSuccess ? (
            <div className="py-20 flex flex-col items-center text-center space-y-6 animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-black text-slate-900">¡Matrícula Exitosa!</h3>
              <p className="max-w-md text-slate-500 font-medium whitespace-pre-wrap">
                El estudiante <span className="text-slate-900 font-bold uppercase">{formData.last_name}, {formData.first_name}</span> ha sido registrado correctamente para el periodo {selectedYear}.
              </p>
              <div className="flex gap-4 mt-8">
                <button onClick={() => window.location.reload()} className="px-8 py-3 bg-[#57C5D5] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#57C5D5]/20 hover:scale-105 active:scale-95 transition-all">Nueva Matrícula</button>
                <button
                  onClick={() => onTabChange ? onTabChange('students') : window.location.href = '/estudiantes'}
                  className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 active:scale-95 transition-all"
                >
                  Ir al Padrón
                </button>
              </div>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                    <div className="flex items-center gap-3">
                      <User className="w-6 h-6 text-[#57C5D5]" />
                      <h3 className="text-xl font-bold text-slate-900">Datos del Estudiante</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DNI Estudiante</label>
                      <div className="relative group">
                        <input type="text" value={formData.dni} onChange={e => updateStudentField('dni', e.target.value)} className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" />
                        <button type="button" onClick={() => setIsSearchModalOpen(true)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#57C5D5] text-white rounded-lg"><Search className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombres</label>
                      <input type="text" value={formData.first_name} onChange={e => updateStudentField('first_name', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Apellidos</label>
                      <input type="text" value={formData.last_name} onChange={e => updateStudentField('last_name', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha Nacimiento</label>
                      <input type="date" value={formData.birth_date} onChange={e => updateStudentField('birth_date', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dirección de Domicilio</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={formData.address}
                          onChange={e => updateStudentField('address', e.target.value)}
                          placeholder="Calle, Jr, Av, Numero, Distrito..."
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#57C5D5] transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8 animate-in slide-in-from-right-4">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <Heart className="w-6 h-6 text-red-500" />
                    <h3 className="text-xl font-bold text-slate-900">Registro de Familia</h3>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {formData.parents?.map((parent, idx) => (
                      <div key={parent.id} className={`p-6 rounded-3xl border-2 ${parent.is_guardian ? 'border-[#57C5D5] bg-white' : 'border-slate-100 bg-slate-50'}`}>
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="font-extrabold text-slate-900">Datos de {parent.relationship}</h4>
                          <button onClick={() => updateParent(idx, 'is_guardian', !parent.is_guardian)} className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase ${parent.is_guardian ? 'bg-[#57C5D5] text-white' : 'bg-white border text-slate-400'}`}>{parent.is_guardian ? 'Apoderado' : 'Asignar'}</button>
                        </div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="relative group">
                              <input type="text" value={parent.dni} onChange={e => updateParent(idx, 'dni', e.target.value)} placeholder="DNI" className="w-full pl-4 pr-10 py-3 bg-white border rounded-xl text-sm" />
                              <button onClick={() => handleDniLookup(idx, parent.dni)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#57C5D5]"><Search className="w-4 h-4" /></button>
                            </div>
                            <input type="text" value={parent.phone} onChange={e => updateParent(idx, 'phone', e.target.value)} placeholder="Celular" className="w-full px-4 py-3 bg-white border rounded-xl text-sm" />
                          </div>
                          <input type="text" value={parent.full_name} onChange={e => updateParent(idx, 'full_name', e.target.value)} placeholder="Nombres Completos" className="w-full px-4 py-3 bg-white border rounded-xl text-sm" />
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dirección</label>
                            <input type="text" value={parent.address} onChange={e => updateParent(idx, 'address', e.target.value)} placeholder="Dirección" className="w-full px-4 py-3 bg-white border rounded-xl text-sm focus:border-[#57C5D5] outline-none transition-all" />

                            <div className="flex flex-wrap gap-2">
                              {/* Always show copy from student button */}
                              <button
                                type="button"
                                onClick={() => handleCopyAddressFromStudent(idx)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-[#57C5D5]/10 text-slate-500 hover:text-[#57C5D5] rounded-lg text-[9px] font-black uppercase tracking-tight transition-all"
                              >
                                <MapPin className="w-3 h-3" /> Misma que el Alumno
                              </button>

                              {/* Show copy from other parent for the second entry or if first one has data */}
                              {(idx === 1 || formData.parents?.[0]?.address) && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyAddressFromOtherParent(idx)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-[#57C5D5]/10 text-slate-500 hover:text-[#57C5D5] rounded-lg text-[9px] font-black uppercase tracking-tight transition-all"
                                >
                                  <Copy className="w-3 h-3" /> Misma que {idx === 0 ? 'la madre' : 'el padre'}
                                </button>
                              )}
                            </div>
                          </div>
                          <input type="text" value={parent.occupation} onChange={e => updateParent(idx, 'occupation', e.target.value)} placeholder="Ocupación" className="w-full px-4 py-3 bg-white border rounded-xl text-sm" />
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
                    <select value={selectedClassroom} onChange={e => setSelectedClassroom(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none">
                      <option value="">Seleccione un aula...</option>
                      {classrooms.map(c => <option key={c.id} value={c.id}>{c.name} ({c.enrolled}/{c.capacity})</option>)}
                    </select>
                  </div>
                </div>
              )}

              <footer className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center mt-10">
                <button onClick={prevStep} disabled={step === 1} className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-800 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /> Anterior</button>
                <button
                  disabled={!selectedYear || !formData.dni || isValidating || isSubmitting}
                  onClick={step < 3 ? handleNext : handleSubmit}
                  className={`flex items-center gap-2 px-10 py-3 rounded-2xl font-bold text-sm shadow-xl transition-all ${step < 3 ? 'bg-[#57C5D5] text-white' : 'bg-emerald-600 text-white'} disabled:opacity-50`}
                >
                  {isSubmitting ? <>Procesando... <Loader2 className="w-4 h-4 animate-spin" /></> : isValidating ? <>Validando... <Loader2 className="w-4 h-4 animate-spin" /></> : <>{step < 3 ? 'Siguiente Paso' : 'Confirmar Matrícula'} <ChevronRight className="w-4 h-4" /></>}
                </button>
              </footer>
            </>
          )}
        </div>
      </div>

      {isSearchModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
            <header className="p-6 border-b flex items-center justify-between">
              <h3 className="font-black text-slate-900">Buscar Estudiante</h3>
              <button onClick={() => { setIsSearchModalOpen(false); setSearchQuery(''); }} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6" /></button>
            </header>
            <div className="p-6 space-y-4">
              <input autoFocus type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="DNI o Nombre..." className="w-full px-4 py-4 bg-slate-50 border-2 rounded-2xl outline-none focus:border-[#57C5D5]" />
              <div className="max-h-80 overflow-y-auto space-y-2">
                {dbStudents.map(student => (
                  <button key={student.id} onClick={() => handleSelectStudent(student)} className="w-full p-4 rounded-xl border hover:border-[#57C5D5] flex items-center justify-between group transition-all">
                    <div className="text-left">
                      <p className="font-black text-xs uppercase">{student.last_name}, {student.first_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">DNI: {student.dni}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#57C5D5]" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentWizard;
