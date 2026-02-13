
import React, { useState, useEffect } from 'react';
import { Classroom, Student } from '../types';
import { classroomService, studentService } from '../services/database.service';
import { useToast } from '../contexts/ToastContext';
import { BookOpen, Plus, Users, Edit3, Trash2, Loader2, X, CheckCircle2, ChevronRight, AlertCircle, ArrowLeftRight, UserCheck } from 'lucide-react';

const ClassroomManager: React.FC = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Classroom>>({
    name: '',
    level: 'inicial',
    grade: '',
    section: '',
    capacity: 30,
    active: true
  });

  // Student management state
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [classroomStudents, setClassroomStudents] = useState<Student[]>([]);
  const [isFetchingStudents, setIsFetchingStudents] = useState(false);
  const [movingStudent, setMovingStudent] = useState<Student | null>(null);
  const [targetClassroomId, setTargetClassroomId] = useState<string>('');
  const [isMoving, setIsMoving] = useState(false);

  const fetchClassrooms = async () => {
    setIsLoading(true);
    try {
      const data = await classroomService.getAll();
      setClassrooms(data);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const handleCreateOrUpdate = async () => {
    if (!formData.grade || !formData.section) {
      showToast('warning', 'Por favor complete el Grado y la Sección para continuar.', 'Datos Incompletos');
      return;
    }

    // Generate name based on level, grade and section
    const isLevelInicial = formData.level?.toLowerCase() === 'inicial';
    const generatedName = isLevelInicial
      ? `${formData.grade} - ${formData.section}`
      : `${formData.grade} ${formData.section}`;

    const dataToSave = {
      ...formData,
      name: generatedName
    };

    try {
      if (editingId) {
        await classroomService.update(editingId, dataToSave);
        showToast('success', '¡Aula actualizada con éxito!', 'Actualización Exitosa');
      } else {
        await classroomService.create(dataToSave);
        showToast('success', '¡Aula registrada correctamente!', 'Registro Exitoso');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', level: 'inicial', grade: '', section: '', capacity: 30, active: true });
      fetchClassrooms();
    } catch (error: any) {
      console.error('Error saving classroom:', error);
      showToast('error', `Hubo un problema al guardar los cambios: ${error.message || 'Error desconocido'}`, 'Error al Guardar');
    }
  };

  const handleEdit = (room: Classroom) => {
    setEditingId(room.id);
    setFormData({
      name: room.name,
      level: room.level,
      grade: room.grade,
      section: room.section,
      capacity: room.capacity,
      active: room.active
    });
    setShowForm(true);
  };

  const handleToggleActive = async (room: Classroom) => {
    try {
      await classroomService.update(room.id, { active: !room.active });
      showToast('success', `Aula ${!room.active ? 'activada' : 'desactivada'} correctamente`, 'Estado Actualizado');
      fetchClassrooms();
    } catch (error) {
      console.error('Error toggling classroom status:', error);
      showToast('error', 'No se pudo cambiar el estado del aula', 'Error');
    }
  };

  const handleDelete = async (room: Classroom) => {
    if (room.enrolled > 0) {
      showToast('error', 'No se puede eliminar un aula que tiene alumnos matriculados.', 'Error de Eliminación');
      return;
    }

    if (!confirm(`¿Está seguro de eliminar el aula "${room.name}"?`)) return;

    try {
      await classroomService.delete(room.id);
      setClassrooms(classrooms.filter(c => c.id !== room.id)); // Changed 'id' to 'room.id'
      showToast('success', 'El aula ha sido eliminada del sistema.', 'Aula Eliminada');
    } catch (error: any) {
      console.error('Error deleting classroom:', error);
      showToast('error', error.message || 'Error al eliminar el aula', 'Error de Eliminación');
    }
  };

  const handleManageStudents = async (room: Classroom) => {
    setSelectedClassroom(room);
    setIsFetchingStudents(true);
    try {
      const students = await classroomService.getStudents(room.id);
      setClassroomStudents(students);
    } catch (error) {
      console.error('Error fetching students:', error);
      showToast('error', 'No se pudieron cargar los alumnos del aula.', 'Error');
    } finally {
      setIsFetchingStudents(false);
    }
  };

  const handleMoveStudent = (student: Student) => {
    setMovingStudent(student);
    setTargetClassroomId('');
  };

  const confirmMove = async () => {
    if (!movingStudent || !targetClassroomId) return;

    setIsMoving(true);
    try {
      await studentService.moveToClassroom(movingStudent.id, targetClassroomId);
      showToast('success', 'El alumno ha sido trasladado correctamente.', 'Traslado Exitoso');

      // Refresh students list and classrooms
      if (selectedClassroom) {
        const students = await classroomService.getStudents(selectedClassroom.id);
        setClassroomStudents(students);
      }
      fetchClassrooms();
      setMovingStudent(null);
    } catch (error) {
      console.error('Error moving student:', error);
      showToast('error', 'No se pudo realizar el traslado.', 'Error');
    } finally {
      setIsMoving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-[#57C5D5] animate-spin" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cargando Aulas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left relative">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Configuración de Aulas</h2>
          <p className="text-slate-500 text-sm">Gestiona los grados, secciones y capacidad de vacantes.</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', level: 'Inicial', grade: '', section: '', capacity: 30, active: true });
            setShowForm(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#57C5D5] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#57C5D5]/20 hover:bg-[#46b3c2] transition-all"
        >
          <Plus className="w-4 h-4" /> Registrar Nueva Aula
        </button>
      </header>


      {/* MODAL FORM */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <header className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#57C5D5] rounded-xl text-white shadow-lg shadow-[#57C5D5]/20">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-xl leading-none">
                    {editingId ? 'Editar Aula' : 'Nueva Aula / Salón'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Definición de grupo académico</p>
                </div>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </header>

            <div className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nivel de Enseñanza</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-semibold outline-none focus:border-[#57C5D5] focus:bg-white transition-all appearance-none"
                  >
                    <option value="inicial">Inicial</option>
                    <option value="primaria">Primaria</option>
                    <option value="secundaria">Secundaria</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Capacidad de Alumnos</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-[#57C5D5] outline-none focus:border-[#57C5D5] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-50">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {formData.level === 'Inicial' ? 'Edad (Grado)' : 'Grado'}
                  </label>
                  <input
                    type="text"
                    placeholder={formData.level === 'Inicial' ? 'Ej. 3 años' : 'Ej. 1ro'}
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-semibold outline-none focus:border-[#57C5D5] focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {formData.level === 'Inicial' ? 'Nombre del Salon (Sección)' : 'Sección'}
                  </label>
                  <input
                    type="text"
                    placeholder={formData.level === 'Inicial' ? 'Ej. Amistad' : 'Ej. A'}
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-semibold outline-none focus:border-[#57C5D5] focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            <footer className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <button
                onClick={() => setShowForm(false)}
                className="order-2 sm:order-1 px-8 py-3 text-sm font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateOrUpdate}
                className="order-1 sm:order-2 px-12 py-3.5 bg-[#57C5D5] text-white rounded-2xl font-black text-sm shadow-xl shadow-[#57C5D5]/20 hover:bg-[#46b3c2] hover:-translate-y-0.5 transition-all"
              >
                {editingId ? 'Guardar Cambios' : 'Confirmar Registro'}
              </button>
            </footer>

          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {classrooms.map((room) => {
          const occupancyRate = room.capacity > 0 ? (room.enrolled / room.capacity) * 100 : 0;
          return (
            <div key={room.id} className={`bg-white rounded-3xl border-2 ${room.active ? 'border-slate-50 shadow-sm' : 'border-slate-100 bg-slate-50/50 opacity-80'} overflow-hidden hover:shadow-2xl transition-all group relative`}>
              {!room.active && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="bg-slate-400 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full tracking-widest shadow-sm">Inactiva</span>
                </div>
              )}
              <div className="p-8 pt-10">
                <div className="flex justify-between items-start mb-8">
                  <div className={`p-4 ${room.active ? 'bg-[#57C5D5]/10 text-[#57C5D5]' : 'bg-slate-200 text-slate-400'} rounded-3xl transition-all`}>
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(room)}
                      title={room.active ? "Desactivar Aula" : "Activar Aula"}
                      className={`p-2.5 rounded-xl transition-all ${room.active ? 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 bg-slate-100 hover:text-emerald-500'}`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(room)}
                      className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-[#57C5D5] hover:bg-[#57C5D5]/10 transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(room)}
                      className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className={`text-2xl font-black ${room.active ? 'text-slate-900' : 'text-slate-500'} leading-none`}>
                    {room.grade} {room.level === 'Inicial' ? '- ' : ''}{room.section}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-black text-[#57C5D5] uppercase tracking-widest bg-[#57C5D5]/5 px-2 py-0.5 rounded-full border border-[#57C5D5]/10">
                      Nivel {room.level}
                    </span>
                  </div>
                </div>

                <div className="mt-10 space-y-5">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ocupación Matricular</span>
                    <span className={`text-sm font-black ${occupancyRate >= 90 ? 'text-red-600' : 'text-slate-700'}`}>{room.enrolled} / {room.capacity}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${occupancyRate >= 90 ? 'bg-red-500 shadow-lg shadow-red-500/20' : 'bg-[#57C5D5] shadow-lg shadow-[#57C5D5]/20'}`}
                      style={{ width: `${occupancyRate}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center gap-2.5 pt-2">
                    <Users className="w-5 h-5 text-slate-300" />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                      {room.capacity - room.enrolled} vacantes disponibles
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50/50 p-5 border-t border-slate-100 text-center">
                <button
                  onClick={() => handleManageStudents(room)}
                  className="text-[10px] font-black text-[#57C5D5] uppercase tracking-[0.2em] hover:text-[#46b3c2] transition-colors"
                >
                  Gestionar Alumnos <ChevronRight className="w-3 h-3 inline pb-0.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MANAGE STUDENTS MODAL */}
      {selectedClassroom && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-100 rounded-2xl text-slate-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-xl leading-none">
                    Alumnos en {selectedClassroom.name}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {selectedClassroom.level} • {classroomStudents.length} matriculados
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClassroom(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              {isFetchingStudents ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-8 h-8 text-[#57C5D5] animate-spin" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Obteniendo alumnos...</p>
                </div>
              ) : classroomStudents.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-10 h-10 text-slate-300" />
                  </div>
                  <h4 className="text-slate-400 font-bold uppercase text-xs tracking-widest">No hay alumnos matriculados en esta aula</h4>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {classroomStudents.map((student) => (
                    <div key={student.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between group hover:shadow-lg transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#57C5D5]/10 rounded-xl flex items-center justify-center text-[#57C5D5] font-black group-hover:bg-[#57C5D5] group-hover:text-white transition-colors">
                          {student.first_name[0]}{student.last_name[0]}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 leading-none">{student.last_name}, {student.first_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                            DNI: {student.dni} <span className="w-1 h-1 bg-slate-300 rounded-full"></span> {student.gender === 'M' ? 'Hombre' : 'Mujer'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleMoveStudent(student)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black border border-slate-100 hover:bg-[#57C5D5]/10 hover:text-[#57C5D5] hover:border-[#57C5D5]/20 transition-all uppercase tracking-widest"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" /> Cambiar de Salón
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <footer className="p-8 bg-white border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedClassroom(null)}
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all"
              >
                Cerrar Lista
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* MOVE STUDENT MODAL */}
      {movingStudent && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <header className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-500">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <h3 className="font-black text-slate-900 uppercase tracking-tight">Traslado de Alumno</h3>
              </div>
              <button
                onClick={() => setMovingStudent(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="p-8 space-y-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Alumno a trasladar</p>
                <p className="font-black text-slate-900 text-lg uppercase tracking-tight">{movingStudent.last_name}, {movingStudent.first_name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Salón Actual: {selectedClassroom?.name}</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Seleccione Salón Destino</label>
                <select
                  value={targetClassroomId}
                  onChange={(e) => setTargetClassroomId(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-[#57C5D5] focus:bg-white transition-all appearance-none"
                >
                  <option value="">-- SELECCIONAR AULA --</option>
                  {classrooms
                    .filter(c => c.id !== selectedClassroom?.id && c.active)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.level.toUpperCase()} • {c.name} ({c.enrolled}/{c.capacity})
                      </option>
                    ))
                  }
                </select>
                <div className="flex items-start gap-2.5 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 mt-4">
                  <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-blue-600/70 leading-relaxed uppercase tracking-widest">
                    El traslado actualizará inmediatamente la ocupación en ambos salones.
                  </p>
                </div>
              </div>
            </div>

            <footer className="p-8 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setMovingStudent(null)}
                className="flex-1 px-6 py-4 bg-white text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 border-slate-100 hover:text-slate-600 hover:border-slate-300 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmMove}
                disabled={!targetClassroomId || isMoving}
                className="flex-1 px-6 py-4 bg-[#57C5D5] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#57C5D5]/20 hover:bg-[#46b3c2] disabled:opacity-50 disabled:translate-y-0 transition-all flex items-center justify-center gap-2"
              >
                {isMoving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                Confirmar Traslado
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomManager;
