import React, { useState } from 'react';
import { Student, AcademicStatus, Classroom } from '../types';
import { studentService, classroomService } from '../services/database.service';
import { useToast } from '../contexts/ToastContext';
import { useAcademicYear } from '../contexts/AcademicYearContext';
import { Search, Plus, UserCircle, Calendar, CreditCard, ChevronDown, Edit3, Mail, Trash2, X, Loader2, Filter, Eye, Phone, MapPin, Briefcase, Heart, BellRing, School, Info } from 'lucide-react';

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Filtros de Grado y Sección
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');

  const { selectedYear } = useAcademicYear();
  const { showToast } = useToast();

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsData, classroomsData] = await Promise.all([
          studentService.getAll(),
          classroomService.getAll()
        ]);
        setStudents(studentsData);
        setClassrooms(classroomsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        showToast('error', 'Error al cargar datos necesarios', 'Error de Conexión');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Generar opciones para los filtros basadas en las aulas disponibles
  const levels = Array.from(new Set(classrooms.map(c => c.level))).sort();

  const grades = Array.from(new Set(classrooms
    .filter(c => !selectedLevel || c.level === selectedLevel)
    .map(c => c.grade)
  )).sort((a, b) => {
    // Intento de ordenamiento inteligente (números primero, luego texto)
    const gradeA = String(a);
    const gradeB = String(b);
    const numA = parseInt(gradeA);
    const numB = parseInt(gradeB);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return gradeA.localeCompare(gradeB);
  });

  const sections = Array.from(new Set(classrooms
    .filter(c =>
      (!selectedLevel || c.level === selectedLevel) &&
      (!selectedGrade || c.grade === selectedGrade)
    )
    .map(c => c.section)
  )).sort();

  // Estado para el formulario (NUEVO O EDITANDO)
  const [formData, setFormData] = useState<Partial<Student>>({
    dni: '',
    first_name: '',
    last_name: '',
    email: '',
    birth_date: '',
    address: '',
    academic_status: AcademicStatus.SIN_MATRICULA
  });

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.dni && s.dni.includes(searchTerm));

    const matchesYear = !selectedYear || s.academic_year_id === selectedYear.id;

    // Lógica de filtrado por aula
    let matchesClassroom = true;
    if (selectedLevel || selectedGrade || selectedSection) {
      if (!s.classroom_id) {
        matchesClassroom = false; // Si hay filtros activos y el alumno no tiene aula, no coincide
      } else {
        const studentClassroom = classrooms.find(c => c.id === s.classroom_id);
        if (!studentClassroom) {
          matchesClassroom = false;
        } else {
          if (selectedLevel && studentClassroom.level !== selectedLevel) matchesClassroom = false;
          if (selectedGrade && studentClassroom.grade !== selectedGrade) matchesClassroom = false;
          if (selectedSection && studentClassroom.section !== selectedSection) matchesClassroom = false;
        }
      }
    }

    return matchesSearch && matchesYear && matchesClassroom;
  });

  const handleEditClick = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      dni: student.dni,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      birth_date: student.birth_date,
      address: student.address || '',
      academic_status: student.academic_status
    });
    setShowForm(true);
  };

  const handleAddNewClick = () => {
    setEditingStudent(null);
    setFormData({
      dni: '',
      first_name: '',
      last_name: '',
      email: '',
      birth_date: '',
      address: '',
      academic_status: AcademicStatus.SIN_MATRICULA
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.dni || !formData.first_name || !formData.last_name) {
      showToast('warning', 'Por favor complete todos los campos marcados como obligatorios.', 'Datos Incompletos');
      return;
    }

    try {
      if (editingStudent) {
        console.log('StudentManagement: Updating student...', editingStudent.id, formData);

        // Remove virtual/join fields before sending to database
        const { parents, ...updateData } = formData as any;

        const updatedStudent = await studentService.update(editingStudent.id, {
          ...updateData,
          academic_year_id: selectedYear?.id
        });

        // Merge updated data into local state, preserving parents if they were already there
        setStudents(students.map(s => s.id === editingStudent.id ? {
          ...s,
          ...updatedStudent,
          parents: s.parents // Keep existing parents as they come from a different join
        } : s));

        showToast('success', 'La información se actualizó correctamente.', 'Alumno Actualizado');
      } else {
        console.log('StudentManagement: Creating new student...', formData);

        const newStudentData: Partial<Student> = {
          ...formData,
          gender: 'M',
          academic_year_id: selectedYear?.id,
          parents: []
        };
        const savedStudent = await studentService.create(newStudentData);
        setStudents([savedStudent, ...students]);

        showToast('success', 'El estudiante ha sido registrado en el sistema.', 'Nuevo Registro');
      }

      setShowForm(false);
      setEditingStudent(null);
    } catch (error: any) {
      console.error('StudentManagement: Error saving student:', error);
      showToast('error', `Hubo un problema: ${error.message || 'Error de conexión con la base de datos'}`, 'Error al Guardar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este registro?')) return;
    try {
      await studentService.delete(id);
      setStudents(students.filter(s => s.id !== id));
      showToast('success', 'Estudiante eliminado correctamente.', 'Registro Eliminado');
    } catch (error: any) {
      showToast('error', `Error al eliminar: ${error.message}`, 'Error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-[#57C5D5] animate-spin" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cargando Estudiantes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 text-left">Padron de Estudiantes</h2>
          <p className="text-slate-500 text-sm text-left">Registro oficial de la I.E.P. 'Valores y Ciencias'.</p>
        </div>
        <button
          onClick={handleAddNewClick}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#57C5D5] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#57C5D5]/20 hover:bg-[#46b3c2] transition-all w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Registrar Estudiante
        </button>
      </header>


      {showForm && (
        <div className="bg-white p-8 rounded-3xl border-2 border-[#57C5D5]/20 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
              {editingStudent ? <Edit3 className="w-6 h-6 text-[#57C5D5]" /> : <UserCircle className="w-6 h-6 text-[#57C5D5]" />}
              {editingStudent ? `Corregir Datos: ${editingStudent.last_name}` : 'Nuevo Registro Estudiantil'}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1">
              <X className="w-4 h-4" /> Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-[#57C5D5]" /> DNI (Obligatorio)
              </label>
              <input
                type="text"
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#57C5D5] outline-none font-bold"
                placeholder="8 dígitos"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombres</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#57C5D5] outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Apellidos</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#57C5D5] outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#57C5D5]" /> Fec. Nacimiento
              </label>
              <input
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#57C5D5] outline-none"
              />
            </div>
            <div className="lg:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#57C5D5]" /> Dirección de Domicilio
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#57C5D5] outline-none"
                placeholder="Calle, Jr, Av, Número, Distrito..."
              />
            </div>
            <div className="lg:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Mail className="w-3 h-3 text-[#57C5D5]" /> Correo Institucional
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#57C5D5] outline-none"
                placeholder="estudiante@valores.edu.pe"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado Académico</label>
              <select
                value={formData.academic_status}
                onChange={(e) => setFormData({ ...formData, academic_status: e.target.value as AcademicStatus })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-bold"
              >
                {Object.values(AcademicStatus).map(status => {
                  // Si es un registro nuevo, solo permitir Sin Matrícula o Reserva
                  if (!editingStudent && status !== AcademicStatus.SIN_MATRICULA && status !== AcademicStatus.RESERVA) {
                    return null;
                  }
                  return <option key={status} value={status}>{status}</option>;
                })}
              </select>
            </div>
          </div>

          {!editingStudent && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 leading-relaxed font-bold uppercase tracking-tight">
                <p>Nota: Al registrar un nuevo estudiante aquí, se crea su ficha de identidad.</p>
                <p className="mt-1">Para realizar la matrícula formal y asignarlo a una aula (Matriculado/Activo), debe utilizar el módulo de <span className="underline italic">Matrícula</span>.</p>
              </div>
            </div>
          )}
          <div className="mt-8 flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="px-6 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">Descartar</button>
            <button
              onClick={handleSave}
              className="px-10 py-3 bg-[#57C5D5] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#57C5D5]/20 hover:bg-[#46b3c2] transition-all active:scale-95"
            >
              {editingStudent ? 'Actualizar Información' : 'Confirmar Registro'}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Filtros Superiores */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <School className="w-4 h-4" />
            </div>
            <select
              value={selectedLevel}
              onChange={(e) => {
                setSelectedLevel(e.target.value);
                setSelectedGrade('');
                setSelectedSection('');
              }}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#57C5D5] appearance-none"
            >
              <option value="">Todos los Niveles</option>
              {levels.map(level => (
                <option key={level} value={level}>{String(level).toUpperCase()}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <div className="md:col-span-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Filter className="w-4 h-4" />
            </div>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setSelectedSection('');
              }}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#57C5D5] appearance-none disabled:bg-slate-50 disabled:text-slate-300"
              disabled={!selectedLevel && grades.length === 0}
            >
              <option value="">Todos los Grados</option>
              {grades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <div className="md:col-span-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Filter className="w-4 h-4" />
            </div>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#57C5D5] appearance-none disabled:bg-slate-50 disabled:text-slate-300"
              disabled={(!selectedLevel && !selectedGrade) || sections.length === 0}
            >
              <option value="">Todas las Secciones</option>
              {sections.map(section => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Search Bar - Moved to grid */}
          <div className="md:col-span-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por DNI/Nombre..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#57C5D5]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Student Count Summary */}
        <div className="flex items-center gap-3 px-2">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Mostrando {filteredStudents.length} {filteredStudents.length === 1 ? 'estudiante' : 'estudiantes'}
          </span>
          {(selectedLevel || selectedGrade || selectedSection) && (
            <span className="px-2 py-0.5 bg-[#57C5D5]/10 text-[#57C5D5] rounded-full text-[10px] font-black uppercase tracking-wider">
              {[
                selectedLevel,
                selectedGrade,
                selectedSection ? `Sección ${selectedSection}` : ''
              ].filter(Boolean).join(' • ')}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estudiante</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aula Asignada</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">DNI</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((s) => {
                const studentClassroom = classrooms.find(c => c.id === s.classroom_id);

                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#57C5D5]/10 flex items-center justify-center text-[#57C5D5] font-black text-xs">
                          {s.last_name.charAt(0)}{s.first_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 uppercase text-[11px] leading-tight">{s.last_name}, {s.first_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">Fec: {s.birth_date}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <School className="w-3.5 h-3.5 text-slate-400" />
                        <div>
                          <span className="text-[11px] font-bold text-slate-700 block uppercase">
                            {studentClassroom ? `${studentClassroom.grade} ${studentClassroom.section}` : <span className="text-slate-400 italic">Sin Aula</span>}
                          </span>
                          {studentClassroom && (
                            <span className="text-[9px] font-black text-[#57C5D5] uppercase tracking-widest">{studentClassroom.level}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{s.dni}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${s.academic_status === AcademicStatus.ACTIVO || s.academic_status === AcademicStatus.MATRICULADO
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : s.academic_status === AcademicStatus.SIN_MATRICULA
                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}>
                        {s.academic_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(s)}
                          title="Editar Estudiante"
                          className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-[#57C5D5] hover:bg-[#57C5D5]/5 transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          title="Eliminar Estudiante"
                          className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewingStudent(s)}
                          className="flex items-center gap-1 text-[10px] font-black text-[#57C5D5] hover:text-[#46b3c2] hover:underline uppercase tracking-widest pl-2 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Ver Detalle
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">
                    No se encontraron estudiantes con esos criterios
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Student Detail Modal (Emergency/Secretary View) */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <header className="p-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <UserCircle className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#57C5D5] flex items-center justify-center text-white text-2xl font-black">
                    {viewingStudent.last_name.charAt(0)}{viewingStudent.first_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">{viewingStudent.last_name}, {viewingStudent.first_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/20">DNI: {viewingStudent.dni}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${viewingStudent.academic_status === AcademicStatus.MATRICULADO || viewingStudent.academic_status === AcademicStatus.ACTIVO
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}>
                        {viewingStudent.academic_status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                className="relative z-10 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </header>

            <div className="p-8 overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-slate-200">
              {/* Personal Info Section */}
              <section className="space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">
                  <UserCircle className="w-4 h-4 text-[#57C5D5]" /> Información Personal
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-[#57C5D5]/50" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Fecha de Nacimiento</p>
                      <p className="text-sm font-bold text-slate-700">{viewingStudent.birth_date || 'No registrada'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="absolute pointer-events-none opacity-0" />
                    <MapPin className="w-5 h-5 text-[#57C5D5]/50" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Dirección</p>
                      <p className="text-sm font-bold text-slate-700">{viewingStudent.address || 'No registrada'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#57C5D5]/50" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Email Institucional</p>
                      <p className="text-sm font-bold text-slate-700">{viewingStudent.email || 'No asignado'}</p>
                    </div>
                  </div>
                  {viewingStudent.classroom_id && (
                    <div className="flex items-center gap-3">
                      <School className="w-5 h-5 text-[#57C5D5]/50" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Aula Asignada</p>
                        {(() => {
                          const room = classrooms.find(c => c.id === viewingStudent.classroom_id);
                          return room ? (
                            <p className="text-sm font-bold text-slate-700">{room.grade} "{room.section}" ({room.level})</p>
                          ) : (
                            <p className="text-sm font-bold text-slate-700 italic">No encontrada</p>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Family/Emergency Contact Section */}
              <section className="space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">
                  <BellRing className="w-4 h-4 text-red-500" /> Contacto de Emergencia / Familia
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viewingStudent.parents && viewingStudent.parents.length > 0 ? (
                    viewingStudent.parents.map((parent, idx) => (
                      <div key={idx} className={`p-6 rounded-3xl border-2 transition-all ${parent.is_guardian ? 'border-[#57C5D5] bg-[#57C5D5]/5 ring-4 ring-[#57C5D5]/5' : 'border-slate-100 bg-white'}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-[9px] font-black uppercase text-[#57C5D5] tracking-widest leading-none block mb-1">
                              {parent.relationship}
                            </span>
                            <p className="text-sm font-black text-slate-800 uppercase">{parent.full_name}</p>
                          </div>
                          {parent.is_guardian && (
                            <span className="bg-[#57C5D5] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-lg shadow-[#57C5D5]/20">Apoderado</span>
                          )}
                        </div>

                        <div className="space-y-3">
                          <a
                            href={`tel:${parent.phone}`}
                            className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 hover:border-[#57C5D5] hover:shadow-md transition-all group"
                          >
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                              <Phone className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Llamar Ahora</p>
                              <p className="text-sm font-black text-slate-700">{parent.phone || 'Sin teléfono'}</p>
                            </div>
                          </a>

                          <div className="flex items-start gap-3 px-1">
                            <Briefcase className="w-4 h-4 text-slate-300 mt-1 shrink-0" />
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Ocupación</p>
                              <p className="text-[11px] font-medium text-slate-600">{parent.occupation || 'No especificada'}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 px-1">
                            <MapPin className="w-4 h-4 text-slate-300 mt-1 shrink-0" />
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Dirección de Vivienda</p>
                              <p className="text-[11px] font-medium text-slate-600 leading-tight">{parent.address || viewingStudent.address || 'No especificada'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-8 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No se encontraron datos familiares registrados</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <footer className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setViewingStudent(null)}
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
              >
                Cerrar Expediente
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
