
import { Profile, UserRole, Student, AcademicStatus, Classroom, CurricularArea, CourseAssignment, IncidentSummary, Assignment } from '../types';

export const mockProfiles: Profile[] = [
  { id: 'uuid-prof-1', dni: '12345678', full_name: 'Juan Perez', role: UserRole.ADMIN, email: 'admin@valores.edu.pe', active: true },
  { id: 'uuid-prof-2', dni: '87654321', full_name: 'Maria Garcia', role: UserRole.SUBDIRECTOR, email: 'mgarcia@valores.edu.pe', active: true },
  { id: 'uuid-prof-3', dni: '44556677', full_name: 'Carlos Ruiz', role: UserRole.DOCENTE, email: 'cruiz@valores.edu.pe', active: true },
];

// Added mockAssignments to fix missing member error
export const mockAssignments: Assignment[] = [
  { profileId: 'uuid-prof-3', classroomId: 'c2', canAttendance: true, canGrades: true },
];

export const mockIncidents: IncidentSummary[] = [
  { id: 'i1', correlative: 'INC-2025-001', type: 'Conducta', status: 'pending', incident_date: '2025-03-10' },
  { id: 'i2', correlative: 'INC-2025-002', type: 'Asistencia', status: 'resolved', incident_date: '2025-03-12' },
  { id: 'i3', correlative: 'INC-2025-003', type: 'Académico', status: 'investigating', incident_date: '2025-03-15' },
];

export const mockClassrooms: Classroom[] = [
  { id: 'c1', name: '3 años - Gotitas', level: 'inicial', grade: '3 años', section: 'A', capacity: 15, enrolled: 12, active: true },
  { id: 'c2', name: '1ro Primaria A', level: 'primaria', grade: '1', section: 'A', capacity: 25, enrolled: 22, active: true },
];

export const mockCurricularAreas: CurricularArea[] = [
  {
    id: 'a1',
    name: 'Matemática',
    level: 'Todos',
    order: 1,
    competencies: [
      { id: 'c1', name: 'Resuelve problemas de cantidad', description: 'Traduce cantidades...', isEvaluated: true }
    ]
  }
];

export const mockCourseAssignments: CourseAssignment[] = [
  { id: 'as1', courseId: 'a1', profileId: 'uuid-prof-3', classroomId: 'c2', hoursPerWeek: 6 },
];

export const mockStudents: Student[] = [
  {
    id: 'uuid-stud-1',
    dni: '77889900',
    first_name: 'Luis',
    last_name: 'Mendoza',
    email: 'lmendoza@valores.edu.pe',
    birth_date: '2015-05-12',
    gender: 'M',
    address: 'Av. Las Palmeras 450, Piura',
    academic_status: AcademicStatus.ACTIVO,
    academic_year_id: 2025,
    parents: []
  },
];