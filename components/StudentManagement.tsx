
import React, { useState } from 'react';
import { Student, AcademicStatus } from '../types';
import { studentService } from '../services/database.service';
import { useToast } from '../contexts/ToastContext';
import { Search, Plus, UserCircle, Calendar, CreditCard, ChevronDown, Edit3, Mail, Trash2, X, Loader2 } from 'lucide-react';

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const { showToast } = useToast();

  React.useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await studentService.getAll();
        setStudents(data);
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  // Estado para el formulario (NUEVO O EDITANDO)
  const [formData, setFormData] = useState<Partial<Student>>({
    dni: '',
    first_name: '',
    last_name: '',
    email: '',
    birth_date: '',
    academic_status: AcademicStatus.ACTIVO
  });

  const filteredStudents = students.filter(s =>
    s.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.dni && s.dni.includes(searchTerm))
  );

  const handleEditClick = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      dni: student.dni,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      birth_date: student.birth_date,
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
      academic_status: AcademicStatus.ACTIVO
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
        // En una implementación real, aquí llamaríamos a studentService.update
        setStudents(students.map(s => s.id === editingStudent.id ? { ...s, ...formData as Student } : s));
      } else {
        const newStudentData: Partial<Student> = {
          ...formData,
          gender: 'M',
          address: 'Dirección no especificada',
          academic_year_id: (students.length > 0 ? students[0].academic_year_id : undefined),
          parents: []
        };
        const savedStudent = await studentService.create(newStudentData);
        setStudents([savedStudent, ...students]);
      }

      setShowForm(false);
      setEditingStudent(null);
      showToast('success', 'Información del estudiante guardada con éxito.', '¡Éxito!');
    } catch (error: any) {
      console.error('Error saving student:', error);
      showToast('error', `No se pudo guardar la información: ${error.message || 'Error desconocido'}`, 'Error al Guardar');
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
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 text-left">Padron de Estudiantes</h2>
          <p className="text-slate-500 text-sm text-left">Registro oficial de la I.E.P. 'Valores y Ciencias'.</p>
        </div>
        <button
          onClick={handleAddNewClick}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#57C5D5] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#57C5D5]/20 hover:bg-[#46b3c2] transition-all"
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
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
              >
                {Object.values(AcademicStatus).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
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

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por DNI, Nombres o Apellidos..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#57C5D5]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estudiante</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Correo Institucional</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">DNI</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.map((s) => (
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
                    <Mail className="w-3.5 h-3.5 text-[#57C5D5]" />
                    <span className="text-xs text-slate-600 font-medium">{s.email || 'No asignado'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-bold text-slate-600">{s.dni}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${s.academic_status === AcademicStatus.ACTIVO ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'
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
                      className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button className="flex items-center gap-1 text-[10px] font-black text-[#57C5D5] hover:underline uppercase tracking-widest pl-2">
                      Expediente
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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
  );
};

export default StudentManagement;
