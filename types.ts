
export enum UserRole {
  ADMIN = 'admin',
  SUBDIRECTOR = 'subdirector',
  DOCENTE = 'docente',
  AUXILIAR = 'auxiliar',
  SECRETARIA = 'secretaria',
  SUPERVISOR = 'supervisor'
}

export enum AcademicStatus {
  ACTIVO = 'Activo',
  TRASLADADO = 'Trasladado',
  RETIRADO = 'Retirado',
  RESERVA = 'Reserva',
  MATRICULADO = 'Matriculado',
  SIN_MATRICULA = 'Sin Matrícula'
}

export type YearStatus = 'abierto' | 'cerrado' | 'planificación';

export type IncidentStatus = 'pending' | 'resolved' | 'investigating' | 'registrada' | 'leida' | 'resuelta' | 'atencion';

export interface Parent {
  id: string;
  dni: string;
  full_name: string;
  phone: string;
  occupation: string;
  address?: string;
  is_guardian: boolean;
  relationship: 'Padre' | 'Madre' | 'Apoderado';
}

export interface Profile {
  id: string;
  dni: string;
  full_name: string;
  role: UserRole;
  email: string;
  active: boolean;
  gender?: string;
  personal_email?: string;
  phone?: string;
  birth_date?: string;
  address?: string;
  password?: string;
}

// Added Assignment interface to fix missing member error
export interface Assignment {
  profileId: string;
  classroomId: string;
  canAttendance: boolean;
  canGrades: boolean;
}

export interface Classroom {
  id: string;
  name: string;
  level: 'inicial' | 'primaria' | 'secundaria';
  grade: string;
  section: string;
  capacity: number;
  enrolled: number;
  active: boolean;
}

export interface Competency {
  id: string;
  name: string;
  description: string;
  isEvaluated: boolean;
}

export interface CurricularArea {
  id: string;
  name: string;
  level: 'Inicial' | 'Primaria' | 'Secundaria' | 'Todos';
  order: number;
  competencies: Competency[];
}

export interface CourseAssignment {
  id: string;
  courseId: string;
  profileId: string;
  classroomId: string;
  hoursPerWeek: number;
}

export interface BimestreConfig {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_locked: boolean;
  is_force_open?: boolean; // Allows editing outside date range
}

export interface AcademicYear {
  id: number;
  year: number;
  status: YearStatus;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  bimestres: BimestreConfig[];
}

export interface Student {
  id: string;
  dni: string;
  first_name: string;
  last_name: string;
  email?: string;
  birth_date: string;
  gender: 'M' | 'F';
  address: string;
  academic_status: AcademicStatus;
  classroomId?: string;
  academic_year_id: number;
  parents: Parent[];
}

export interface IncidentSummary {
  id: string;
  correlative: string;
  type: string;
  status: IncidentStatus;
  incident_date: string;
}

export interface GradeScale {
  id: string;
  label: string;
  description: string;
  color: string;
}

export interface InstitutionalSettings {
  name: string;
  slogan: string;
  address: string;
  city: string;
  phones: string;
  directorName: string;
  attendanceTolerance: number;
  logoUrl?: string;
}

// Academic Year Context Types
export interface AcademicYearContextType {
  selectedYear: AcademicYear | null;
  setSelectedYear: (year: AcademicYear | null) => void;
  academicYears: AcademicYear[];
  setAcademicYears: (years: AcademicYear[]) => void;
  refreshYears: () => Promise<void>;
  isYearActive: (year: AcademicYear) => boolean;
  isYearReadOnly: (year: AcademicYear) => boolean;
  canEditBimestre: (bimestre: BimestreConfig, year: AcademicYear) => boolean;
}