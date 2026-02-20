import React, { useState, useEffect } from 'react';
import {
    Users, BookOpen, Search, Filter, Plus, Edit2, Trash2,
    CheckCircle, AlertCircle, Save, X, School, GraduationCap,
    ArrowRight
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { useToast } from '../contexts/ToastContext';
import { Classroom, Student, AcademicStatus } from '../types';

interface EnglishClassroom extends Classroom {
    student_count?: number;
}

interface EnglishStudent extends Student {
    regular_classroom?: {
        grade: string;
        section: string;
        level: string;
    };
    english_classroom?: {
        id: string;
        grade: string;
        section: string;
    };
}

const EnglishManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'classrooms' | 'assignment'>('assignment');
    const [loading, setLoading] = useState(true);
    const [englishClassrooms, setEnglishClassrooms] = useState<EnglishClassroom[]>([]);
    const [students, setStudents] = useState<EnglishStudent[]>([]);
    const { showToast } = useToast();

    // Filters
    const [cycleFilter, setCycleFilter] = useState<'todos' | 'VI' | 'VII'>('todos');
    const [levelFilter, setLevelFilter] = useState<string>('todos');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [showClassroomModal, setShowClassroomModal] = useState(false);
    const [editingClassroom, setEditingClassroom] = useState<EnglishClassroom | null>(null);
    const [classroomForm, setClassroomForm] = useState({
        grade: 'Ciclo VI',
        section: 'A1',
        capacity: 30
    });

    useEffect(() => {
        fetchEnglishClassrooms();
        if (activeTab === 'assignment') {
            fetchStudents();
        }
    }, [activeTab]);

    const fetchEnglishClassrooms = async () => {
        try {
            const { data, error } = await supabase
                .from('classrooms')
                .select('*')
                .eq('is_english_group', true)
                .order('grade')
                .order('section');

            if (error) throw error;
            setEnglishClassrooms(data || []);
        } catch (error) {
            console.error('Error fetching english classrooms:', error);
            showToast('error', 'Error al cargar salones de inglés');
        }
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            // Fetch students with their regular classroom and English classroom
            const { data, error } = await supabase
                .from('students')
                .select(`
          *,
          regular_classroom:classrooms!students_classroom_id_fkey (grade, section, level),
          english_classroom:classrooms!students_english_classroom_id_fkey (id, grade, section)
        `)
                .eq('academic_status', AcademicStatus.MATRICULADO);

            if (error) throw error;

            // Filter only secondary students
            // const secondaryStudents = (data || []).filter((s: EnglishStudent) =>
            //    s.regular_classroom?.level?.toLowerCase() === 'secundaria'
            // );

            // DEBUG: Show all to verify data fetch
            const secondaryStudents = data || [];

            setStudents(secondaryStudents);
        } catch (error) {
            console.error('Error fetching students:', error);
            showToast('error', 'Error al cargar estudiantes');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClassroom = async () => {
        try {
            const { error } = await supabase
                .from('classrooms')
                .insert([{
                    name: `Inglés ${classroomForm.grade} - ${classroomForm.section}`,
                    grade: classroomForm.grade,
                    section: classroomForm.section,
                    level: 'Secundaria', // English is only for Secondary for now
                    capacity: classroomForm.capacity,
                    is_english_group: true,
                    active: true,
                    course_id: null // Will implement course link later if needed
                }]);

            if (error) throw error;

            showToast('success', 'Salón de inglés creado');
            setShowClassroomModal(false);
            fetchEnglishClassrooms();
        } catch (error) {
            console.error('Error creating classroom:', error);
            showToast('error', 'Error al crear salón');
        }
    };

    const handleAssignStudent = async (studentId: string, englishClassroomId: string | null) => {
        try {
            const { error } = await supabase
                .from('students')
                .update({ english_classroom_id: englishClassroomId })
                .eq('id', studentId);

            if (error) throw error;

            showToast('success', 'Asignación actualizada');
            // Optimistic update
            setStudents(prev => prev.map(s => {
                if (s.id === studentId) {
                    const newClassroom = englishClassrooms.find(c => c.id === englishClassroomId);
                    return {
                        ...s,
                        english_classroom: newClassroom ? {
                            id: newClassroom.id,
                            grade: newClassroom.grade,
                            section: newClassroom.section
                        } : undefined,
                        english_classroom_id: englishClassroomId
                    };
                }
                return s;
            }));
        } catch (error) {
            console.error('Error assigning student:', error);
            showToast('error', 'Error al asignar estudiante');
        }
    };

    // Logic to determine Cycle from Grade
    const getCycleFromGrade = (grade: string | undefined) => {
        if (!grade) return null;
        const lowerGrade = grade.toLowerCase();
        if (lowerGrade.includes('1ero') || lowerGrade.includes('1er') || lowerGrade.includes('2do')) return 'Ciclo VI';
        if (lowerGrade.includes('3ero') || lowerGrade.includes('4to') || lowerGrade.includes('5to')) return 'Ciclo VII';
        return null;
    };

    // Filter Logic
    const filteredStudents = students.filter(student => {
        const studentCycle = getCycleFromGrade(student.regular_classroom?.grade);
        const matchesCycle = cycleFilter === 'todos' || studentCycle === `Ciclo ${cycleFilter}`;
        const matchesSearch =
            student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.dni?.includes(searchTerm);

        // Filter by ASSIGNED level (if they have one)
        const matchesLevel = levelFilter === 'todos' ||
            (levelFilter === 'sin_asignar' ? !student.english_classroom_id : student.english_classroom?.section === levelFilter);

        return matchesCycle && matchesSearch && matchesLevel;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                        Gestión de Inglés <span className="text-blue-600">.</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Administra grupos por nivel y asignaciones de estudiantes
                    </p>
                </div>
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                    <button
                        onClick={() => setActiveTab('assignment')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'assignment'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Users className="w-4 h-4 inline-block mr-2" />
                        Asignación
                    </button>
                    <button
                        onClick={() => setActiveTab('classrooms')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'classrooms'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <BookOpen className="w-4 h-4 inline-block mr-2" />
                        Salones y Niveles
                    </button>
                </div>
            </div>

            {activeTab === 'assignment' && (
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    {/* DEBUG PANEL */}
                    <div className="p-4 bg-red-50 text-red-800 text-xs font-mono border-b border-red-100">
                        <p>DEBUG INFO:</p>
                        <p>Total Fetched Students: {students.length}</p>
                        <p>Filtered Students: {filteredStudents.length}</p>
                        <p>Loading: {loading ? 'YES' : 'NO'}</p>
                        {students.length > 0 && (
                            <p>First Student: {JSON.stringify(students[0])}</p>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o DNI..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                            />
                        </div>
                        <select
                            value={cycleFilter}
                            onChange={(e) => setCycleFilter(e.target.value as any)}
                            className="px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="todos">Todos los Ciclos</option>
                            <option value="VI">Ciclo VI (1ro - 2do)</option>
                            <option value="VII">Ciclo VII (3ro - 5to)</option>
                        </select>
                        <select
                            value={levelFilter}
                            onChange={(e) => setLevelFilter(e.target.value)}
                            className="px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="todos">Todos los Niveles</option>
                            <option value="sin_asignar">Sin Asignar</option>
                            <option value="A1">Nivel A1</option>
                            <option value="A1+">Nivel A1+</option>
                            <option value="A2">Nivel A2</option>
                            <option value="A2+">Nivel A2+</option>
                            <option value="B1">Nivel B1</option>
                        </select>
                    </div>

                    {/* Student List */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Estudiante</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Grado Regular</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Ciclo (Inglés)</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nivel Asignado</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                                <p className="font-medium">Cargando estudiantes...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                                            No se encontraron estudiantes con los filtros seleccionados
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student) => {
                                        const cycle = getCycleFromGrade(student.regular_classroom?.grade);
                                        const availableClassrooms = englishClassrooms.filter(c => c.grade === cycle);

                                        return (
                                            <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                                            {student.first_name[0]}{student.last_name[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800">{student.last_name}, {student.first_name}</p>
                                                            <p className="text-xs text-slate-500 font-mono">{student.dni}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                                        {student.regular_classroom?.grade} - {student.regular_classroom?.section}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${cycle === 'Ciclo VI' ? 'bg-indigo-100 text-indigo-700' :
                                                        cycle === 'Ciclo VII' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {cycle || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={student.english_classroom_id || ''}
                                                        onChange={(e) => handleAssignStudent(student.id, e.target.value || null)}
                                                        className={`w-full max-w-[180px] px-3 py-2 text-sm rounded-lg border focus:ring-2 outline-none transition-all ${student.english_classroom_id
                                                            ? 'bg-green-50 border-green-200 text-green-700 focus:ring-green-500'
                                                            : 'bg-white border-slate-200 text-slate-600 focus:ring-blue-500'
                                                            }`}
                                                    >
                                                        <option value="">Sin Asignar</option>
                                                        {availableClassrooms.map(classroom => (
                                                            <option key={classroom.id} value={classroom.id}>
                                                                {classroom.section} (Cap: {classroom.capacity})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {student.english_classroom_id && (
                                                        <button
                                                            onClick={() => handleAssignStudent(student.id, null)}
                                                            title="Desasignar"
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'classrooms' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div
                        onClick={() => {
                            setEditingClassroom(null);
                            setClassroomForm({ grade: 'Ciclo VI', section: 'A1', capacity: 30 });
                            setShowClassroomModal(true);
                        }}
                        className="group flex flex-col items-center justify-center p-8 bg-white rounded-3xl border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition-all duration-300 min-h-[200px]"
                    >
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Plus className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-700">Crear Nuevo Grupo</h3>
                        <p className="text-sm text-slate-500 text-center mt-2 px-4">
                            Añadir un salón de inglés (ej: Ciclo VI - A2)
                        </p>
                    </div>

                    {englishClassrooms.map(classroom => (
                        <div key={classroom.id} className="group bg-white rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-200 overflow-hidden">
                            <div className={`h-2 w-full ${classroom.grade === 'Ciclo VI' ? 'bg-indigo-500' : 'bg-purple-500'}`} />
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className={`inline-block px-2 py-1 rounded-md text-xs font-bold tracking-wider mb-2 ${classroom.grade === 'Ciclo VI' ? 'bg-indigo-50 text-indigo-700' : 'bg-purple-50 text-purple-700'
                                            }`}>
                                            {classroom.grade}
                                        </span>
                                        <h3 className="text-3xl font-black text-slate-800">{classroom.section}</h3>
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded-xl">
                                        <GraduationCap className={`w-6 h-6 ${classroom.grade === 'Ciclo VI' ? 'text-indigo-500' : 'text-purple-500'}`} />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-slate-500 font-medium mb-6">
                                    <div className="flex items-center gap-1.5">
                                        <Users className="w-4 h-4" />
                                        <span>Capacidad: {classroom.capacity}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            // Implement edit later if needed, mostly user wants create/assign
                                            showToast('info', 'Edición próximamente');
                                        }}
                                        className="flex-1 py-2 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        Editar
                                    </button>
                                    {/* Delete button could go here */}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Classroom Modal */}
            {showClassroomModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800">Nuevo Grupo de Inglés</h3>
                            <button
                                onClick={() => setShowClassroomModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Ciclo</label>
                                <select
                                    value={classroomForm.grade}
                                    onChange={(e) => setClassroomForm({ ...classroomForm, grade: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="Ciclo VI">Ciclo VI (1ro y 2do)</option>
                                    <option value="Ciclo VII">Ciclo VII (3ro, 4to, 5to)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nivel (Sección)</label>
                                <select
                                    value={classroomForm.section}
                                    onChange={(e) => setClassroomForm({ ...classroomForm, section: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="A1">A1</option>
                                    <option value="A1+">A1+</option>
                                    <option value="A2">A2</option>
                                    <option value="A2+">A2+</option>
                                    <option value="B1">B1</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Capacidad</label>
                                <input
                                    type="number"
                                    value={classroomForm.capacity}
                                    onChange={(e) => setClassroomForm({ ...classroomForm, capacity: Number(e.target.value) })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <button
                                onClick={handleCreateClassroom}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all mt-4"
                            >
                                Crear Grupo
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default EnglishManagement;
