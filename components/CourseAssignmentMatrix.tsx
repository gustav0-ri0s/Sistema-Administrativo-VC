
import React, { useState, useEffect, useMemo } from 'react';
import { CourseAssignment, Classroom, CurricularArea, Profile } from '../types';
import { classroomService, profileService, curricularAreaService, courseAssignmentService } from '../services/database.service';
import { useToast } from '../contexts/ToastContext';
import { ClipboardList, Plus, User, Book, MapPin, Trash2, Clock, Loader2, CheckSquare, Square, CheckCircle2, Search, X, Check, Filter, ChevronRight, ChevronLeft, Calendar } from 'lucide-react';

const CourseAssignmentMatrix: React.FC = () => {
  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [docentes, setDocentes] = useState<Profile[]>([]);
  const [areas, setAreas] = useState<CurricularArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [selectedTeacher, setSelectedTeacher] = useState<Profile | null>(null);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedClassroomIds, setSelectedClassroomIds] = useState<string[]>([]);
  const [hoursPerWeek, setHoursPerWeek] = useState(2);
  const [searchTerm, setSearchTerm] = useState('');

  // Matrix State for Step 3: { [classroomId]: string[] (areaIds) }
  const [matrix, setMatrix] = useState<Record<string, string[]>>({});

  // View Details State
  const [viewingTeacher, setViewingTeacher] = useState<Profile | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [cData, dData, aData, asData] = await Promise.all([
        classroomService.getAll(),
        profileService.getTeachers(),
        curricularAreaService.getAll(),
        courseAssignmentService.getAll()
      ]);
      setClassrooms(cData);
      setDocentes(dData);
      setAreas(aData);
      setAssignments(asData);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('error', 'No se pudieron cargar los datos de asignación.', 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocentes = useMemo(() => {
    if (!teacherSearch) return docentes.slice(0, 5);
    return docentes.filter(d =>
      d.full_name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      d.dni?.includes(teacherSearch)
    ).slice(0, 10);
  }, [docentes, teacherSearch]);

  const toggleClassroom = (id: string) => {
    setSelectedClassroomIds(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const toggleMatrixCell = (classroomId: string, areaId: string) => {
    setMatrix(prev => {
      const currentAreas = prev[classroomId] || [];
      const newAreas = currentAreas.includes(areaId)
        ? currentAreas.filter(id => id !== areaId)
        : [...currentAreas, areaId];
      return { ...prev, [classroomId]: newAreas };
    });
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !selectedTeacher) {
      showToast('warning', 'Selecciona un docente para continuar.', 'Atención');
      return;
    }
    if (currentStep === 2 && selectedClassroomIds.length === 0) {
      showToast('warning', 'Selecciona al menos un salón.', 'Atención');
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => setCurrentStep(prev => prev - 1);

  const resetModal = () => {
    setShowModal(false);
    setCurrentStep(1);
    setSelectedTeacher(null);
    setTeacherSearch('');
    setSelectedClassroomIds([]);
    setMatrix({});
  };

  const handleCreateAssignments = async () => {
    const totalSelections = Object.values(matrix).flat().length;
    if (totalSelections === 0) {
      showToast('warning', 'No has seleccionado áreas para ningún salón.', 'Atención');
      return;
    }

    try {
      setIsSaving(true);
      const newAssignments: Omit<CourseAssignment, 'id'>[] = [];

      Object.entries(matrix).forEach(([classroomId, areaIds]) => {
        (areaIds as string[]).forEach(areaId => {
          const exists = assignments.some(as =>
            as.profileId === selectedTeacher?.id &&
            as.classroomId === classroomId &&
            as.courseId === areaId
          );

          if (!exists) {
            newAssignments.push({
              profileId: selectedTeacher!.id,
              classroomId,
              courseId: areaId,
              hoursPerWeek: hoursPerWeek
            });
          }
        });
      });

      if (newAssignments.length === 0) {
        showToast('info', 'Las combinaciones seleccionadas ya existen para este docente.', 'Sin cambios');
      } else {
        await courseAssignmentService.createBulk(newAssignments);
        showToast('success', `Se han creado ${newAssignments.length} asignaciones exitosamente.`, 'Éxito');
        loadData();
      }
      resetModal();
    } catch (error) {
      console.error('Error saving assignments:', error);
      showToast('error', 'No se pudieron guardar las asignaciones.', 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta asignación?')) return;
    try {
      await courseAssignmentService.delete(id);
      showToast('success', 'Asignación eliminada.', 'Éxito');
      loadData();
    } catch (error) {
      showToast('error', 'No se pudo eliminar la asignación.', 'Error');
    }
  };

  const groupedTeachers = useMemo(() => {
    const teacherMap = new Map<string, CourseAssignment[]>();

    assignments.forEach(as => {
      if (!teacherMap.has(as.profileId)) {
        teacherMap.set(as.profileId, []);
      }
      teacherMap.get(as.profileId)?.push(as);
    });

    return Array.from(teacherMap.entries()).map(([profileId, teacherAssignments]) => {
      const teacher = docentes.find(d => d.id === profileId);
      return {
        profileId,
        teacher,
        assignments: teacherAssignments
      };
    }).filter(item => item.teacher);
  }, [assignments, docentes]);

  const filteredGroupedTeachers = useMemo(() => {
    if (!searchTerm) return groupedTeachers;
    const search = searchTerm.toLowerCase();

    return groupedTeachers.filter(({ teacher, assignments }) => {
      const matchesName = teacher?.full_name.toLowerCase().includes(search);
      const matchesAssignment = assignments.some(as => {
        const c = classrooms.find(cl => cl.id === as.classroomId);
        const a = areas.find(ar => ar.id === as.courseId);
        return (c?.name || `${c?.grade} ${c?.section}`).toLowerCase().includes(search) ||
          a?.name.toLowerCase().includes(search);
      });
      return matchesName || matchesAssignment;
    });
  }, [groupedTeachers, searchTerm, classrooms, areas]);

  const teacherAssignmentsForViewing = useMemo(() => {
    if (!viewingTeacher) return [];
    return assignments.filter(as => as.profileId === viewingTeacher.id);
  }, [assignments, viewingTeacher]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-12 h-12 text-[#57C5D5] animate-spin" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sincronizando Carga Académica...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Carga Horaria Docente</h2>
          <p className="text-slate-500 text-sm font-medium">Gestión administrativa de la estructura académica.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-8 py-4 bg-[#57C5D5] text-white rounded-2xl text-sm font-black shadow-xl shadow-[#57C5D5]/20 hover:bg-[#46b3c2] transition-all transform hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" /> Registrar Carga
        </button>
      </header>

      {/* MULTI-STEP MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">

            {/* Modal Header */}
            <header className="p-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#57C5D5] text-white flex items-center justify-center shadow-lg shadow-[#57C5D5]/20">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-none">Asignación por Pasos</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`w-2 h-2 rounded-full ${currentStep >= 1 ? 'bg-[#57C5D5]' : 'bg-slate-200'}`} />
                    <span className={`w-2 h-2 rounded-full ${currentStep >= 2 ? 'bg-[#57C5D5]' : 'bg-slate-200'}`} />
                    <span className={`w-2 h-2 rounded-full ${currentStep >= 3 ? 'bg-[#57C5D5]' : 'bg-slate-200'}`} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Paso {currentStep} de 3</span>
                  </div>
                </div>
              </div>
              <button onClick={resetModal} className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">

              {/* Step 1: Teacher Search */}
              {currentStep === 1 && (
                <div className="space-y-10 animate-in slide-in-from-bottom-5 duration-300">
                  <div className="text-center space-y-2">
                    <h4 className="text-2xl font-black text-slate-800 tracking-tight">¿Quién es el docente?</h4>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.1em]">Busca por nombre completo o DNI para empezar</p>
                  </div>

                  <div className="max-w-xl mx-auto space-y-6">
                    <div className="relative">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-[#57C5D5]" />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Empezar a escribir nombre..."
                        className="w-full pl-16 pr-6 py-6 bg-slate-50 border-2 border-transparent focus:border-[#57C5D5] focus:bg-white rounded-[2rem] text-lg font-bold outline-none transition-all shadow-inner"
                        value={teacherSearch}
                        onChange={(e) => setTeacherSearch(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {filteredDocentes.map(d => (
                        <button
                          key={d.id}
                          onClick={() => setSelectedTeacher(d)}
                          className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${selectedTeacher?.id === d.id
                            ? 'border-[#57C5D5] bg-[#57C5D5]/5 ring-4 ring-[#57C5D5]/5'
                            : 'border-slate-50 hover:border-slate-200'
                            }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm ${selectedTeacher?.id === d.id ? 'bg-[#57C5D5] text-white' : 'bg-slate-100 text-slate-400'}`}>
                              {d.full_name?.charAt(0)}
                            </div>
                            <div className="text-left">
                              <p className="font-black text-slate-800 text-sm uppercase leading-tight">{d.full_name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">DNI: {d.dni || '---'}</p>
                            </div>
                          </div>
                          {selectedTeacher?.id === d.id && <CheckCircle2 className="w-5 h-5 text-[#57C5D5]" />}
                        </button>
                      ))}
                      {docentes.length > 0 && filteredDocentes.length === 0 && (
                        <p className="text-center text-slate-400 text-xs font-bold py-10 uppercase tracking-widest">No se encontraron docentes con ese criterio</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Classroom Selection */}
              {currentStep === 2 && (
                <div className="space-y-10 animate-in slide-in-from-bottom-5 duration-300">
                  <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#57C5D5] flex items-center justify-center font-black text-[#57C5D5] text-xl shadow-[#57C5D5]/5 shadow-lg">
                      {selectedTeacher?.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-[#57C5D5] uppercase tracking-widest">Docente Titular</p>
                      <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{selectedTeacher?.full_name}</h4>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-lg font-black text-slate-800 text-center tracking-tight">¿En qué salones dictará el docente?</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {classrooms.map(c => (
                        <button
                          key={c.id}
                          onClick={() => toggleClassroom(c.id)}
                          className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-4 transition-all ${selectedClassroomIds.includes(c.id)
                            ? 'border-[#57C5D5] bg-[#57C5D5]/5 shadow-xl shadow-[#57C5D5]/10'
                            : 'border-slate-50 hover:border-slate-100'
                            }`}
                        >
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedClassroomIds.includes(c.id) ? 'bg-[#57C5D5] text-white' : 'bg-slate-100 text-slate-300'}`}>
                            <MapPin className="w-6 h-6" />
                          </div>
                          <div className="text-center">
                            <p className="font-black text-slate-800 text-sm uppercase leading-tight">{c.name || `${c.grade} ${c.section}`}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Nivel {c.level}</p>
                          </div>
                          {selectedClassroomIds.includes(c.id) ? <CheckSquare className="w-5 h-5 text-[#57C5D5]" /> : <Square className="w-5 h-5 text-slate-200" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Area Assignment for Selected Classrooms */}
              {currentStep === 3 && (
                <div className="space-y-10 animate-in slide-in-from-bottom-5 duration-300">
                  <div className="flex flex-col md:flex-row gap-6 justify-between p-8 bg-slate-900 rounded-[2.5rem] text-white">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-white text-slate-900 flex items-center justify-center font-black text-2xl shadow-xl shadow-white/10">
                        {selectedTeacher?.full_name?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-2xl font-black uppercase tracking-tight leading-none">{selectedTeacher?.full_name}</h4>
                        <div className="flex items-center gap-4 mt-3">
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-[#57C5D5]" /> {selectedClassroomIds.length} SALONES
                          </p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2 border-l border-white/10 pl-4">
                            <Book className="w-3 h-3 text-[#57C5D5]" /> {Object.values(matrix).flat().length} ASIGNACIONES
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/5 p-5 rounded-3xl border border-white/10 flex flex-col justify-center min-w-[150px]">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Horas Lectivas (Base)</label>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#57C5D5]" />
                          <input
                            type="number"
                            className="bg-transparent border-none text-xl font-black text-white w-12 outline-none focus:text-[#57C5D5]"
                            value={hoursPerWeek}
                            onChange={(e) => setHoursPerWeek(parseInt(e.target.value))}
                          />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">HRS</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <h4 className="text-xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                      <Book className="w-6 h-6 text-[#57C5D5]" /> Asignación de Áreas Curriculares
                    </h4>

                    <div className="grid grid-cols-1 gap-12">
                      {selectedClassroomIds.map(cid => {
                        const room = classrooms.find(r => r.id === cid);
                        const selectedAreasForThisRoom = matrix[cid] || [];

                        return (
                          <div key={cid} className="space-y-6 p-8 bg-slate-50 rounded-[3rem] border-2 border-slate-100/50 shadow-inner">
                            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-4">
                              <span className="text-sm font-black text-slate-800 uppercase flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#57C5D5] shadow-sm">
                                  <MapPin className="w-4 h-4" />
                                </div>
                                Salón: {room?.name || 'Aula'}
                              </span>
                              <button
                                onClick={() => {
                                  const next = selectedAreasForThisRoom.length === areas.length ? [] : areas.map(a => a.id);
                                  setMatrix(p => ({ ...p, [cid]: next }));
                                }}
                                className={`text-[9px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-xl transition-all ${selectedAreasForThisRoom.length === areas.length
                                  ? 'bg-red-50 text-red-500 hover:bg-red-100'
                                  : 'bg-white text-slate-400 hover:text-[#57C5D5] shadow-lg shadow-black/5'
                                  }`}
                              >
                                {selectedAreasForThisRoom.length === areas.length ? 'Limpiar Salón' : 'Asignar Todas las Áreas'}
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {areas.map(area => {
                                const isSelected = selectedAreasForThisRoom.includes(area.id);
                                return (
                                  <button
                                    key={area.id}
                                    onClick={() => toggleMatrixCell(cid, area.id)}
                                    className={`flex items-center gap-4 p-4 rounded-[1.5rem] border-2 transition-all ${isSelected
                                      ? 'bg-white border-[#57C5D5] text-slate-800 shadow-xl shadow-[#57C5D5]/5'
                                      : 'bg-white/50 border-white text-slate-400 hover:border-slate-200 hover:bg-white'
                                      }`}
                                  >
                                    {isSelected ? <CheckSquare className="w-5 h-5 text-[#57C5D5]" /> : <Square className="w-5 h-5 opacity-30" />}
                                    <span className="text-[10px] font-black text-left leading-tight uppercase tracking-tight">{area.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <footer className="p-8 border-t border-slate-50 bg-white grid grid-cols-2 md:grid-cols-4 gap-4 sticky bottom-0 z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
              <button
                onClick={resetModal}
                className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-all border-2 border-transparent"
              >
                Cerrar
              </button>

              <div className="col-span-full md:col-start-3 md:col-span-2 flex gap-4">
                {currentStep > 1 && (
                  <button
                    onClick={handlePrevStep}
                    className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </button>
                )}

                {currentStep < 3 ? (
                  <button
                    disabled={currentStep === 1 && !selectedTeacher}
                    onClick={handleNextStep}
                    className="flex-[2] px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all disabled:opacity-30 disabled:grayscale"
                  >
                    Siguiente Paso <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    disabled={isSaving}
                    onClick={handleCreateAssignments}
                    className="flex-[2] px-6 py-4 bg-[#57C5D5] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#57C5D5]/20 flex items-center justify-center gap-3 hover:bg-[#46b3c2] transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {isSaving ? 'GUARDANDO...' : 'REGISTRAR CARGA'}
                  </button>
                )}
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* Main Overview List */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <Filter className="w-6 h-6 text-[#57C5D5]" />
            Resumen Escolar
          </h3>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              type="text"
              placeholder="Filtrar por profesor, grado o área..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-xs outline-none focus:ring-4 focus:ring-[#57C5D5]/10 shadow-sm transition-all text-slate-500 font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGroupedTeachers.map(({ teacher, assignments: teacherAssignments }) => {
            const totalHours = teacherAssignments.reduce((sum, as) => sum + as.hoursPerWeek, 0);
            const academicUnits = new Set(teacherAssignments.map(as => as.classroomId)).size;

            return (
              <button
                key={teacher?.id}
                onClick={() => {
                  setViewingTeacher(teacher!);
                  setShowDetailModal(true);
                }}
                className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-[#57C5D5]/20 transition-all group relative overflow-hidden text-left"
              >
                <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-[#57C5D5]/5 rounded-full" />

                <div className="flex justify-between items-start relative z-10 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#57C5D5]/10 text-[#57C5D5] flex items-center justify-center font-black text-xl shadow-inner">
                    {teacher?.full_name?.charAt(0)}
                  </div>
                  <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border border-emerald-100">
                    Docente
                  </div>
                </div>

                <div className="space-y-1 relative z-10">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight line-clamp-1">{teacher?.full_name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">DNI: {teacher?.dni || '---'}</p>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4 relative z-10 border-t border-slate-50 pt-6">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cursos</p>
                    <div className="flex items-center gap-2">
                      <Book className="w-3.5 h-3.5 text-[#57C5D5]" />
                      <span className="text-xs font-black text-slate-700">{teacherAssignments.length}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Grados</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#57C5D5]" />
                      <span className="text-xs font-black text-slate-700">{academicUnits}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between relative z-10 bg-slate-50 p-4 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#57C5D5]" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{totalHours} Horas Totales</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#57C5D5] transition-all" />
                </div>
              </button>
            );
          })}

          {filteredGroupedTeachers.length === 0 && (
            <div className="col-span-full py-28 text-center bg-slate-50/50 rounded-[4rem] border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200/50">
                <ClipboardList className="w-10 h-10 text-slate-200" />
              </div>
              <p className="text-sm text-slate-400 font-black uppercase tracking-[0.3em]">Sin registros de carga académica</p>
            </div>
          )}
        </div>

        {/* DETAIL MODAL */}
        {showDetailModal && viewingTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
              <header className="p-8 border-b border-slate-50 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#57C5D5] text-white flex items-center justify-center shadow-lg shadow-[#57C5D5]/20 font-black text-xl">
                    {viewingTeacher.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 leading-none uppercase tracking-tight">{viewingTeacher.full_name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                      <Clock className="w-3 h-3 text-[#57C5D5]" /> Carga Horaria Detallada
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setViewingTeacher(null);
                  }}
                  className="p-3 bg-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
                <div className="grid grid-cols-1 gap-4">
                  {teacherAssignmentsForViewing.map((as) => {
                    const room = classrooms.find(c => c.id === as.classroomId);
                    const area = areas.find(a => a.id === as.courseId);

                    return (
                      <div key={as.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
                        <div className="flex items-center gap-6">
                          <div className="p-4 bg-[#57C5D5]/5 rounded-2xl text-[#57C5D5]">
                            <Book className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-[#57C5D5] uppercase tracking-widest leading-none">
                              {room?.name || (room ? `${room.grade} ${room.section}` : 'N/A')}
                            </p>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{area?.name}</h4>
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Clock className="w-3 h-3" /> {as.hoursPerWeek} Horas semanales
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(as.id)}
                          className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })}

                  {teacherAssignmentsForViewing.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No hay asignaciones registradas</p>
                    </div>
                  )}
                </div>
              </div>

              <footer className="p-8 bg-white border-t border-slate-50 flex justify-end shrink-0">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setViewingTeacher(null);
                  }}
                  className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all"
                >
                  Entendido
                </button>
              </footer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseAssignmentMatrix;
