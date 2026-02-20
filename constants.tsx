
import React from 'react';
import {
  ShieldCheck,
  Users,
  UserPlus,
  BookOpen,
  FileBarChart,
  Settings,
  GraduationCap,
  CalendarDays,
  Briefcase,
  Library,
  ClipboardList,
  Layers,
  Languages
} from 'lucide-react';
import { UserRole } from './types';

export const ROLE_ICONS: Record<string, React.ReactNode> = {
  [UserRole.ADMIN]: <ShieldCheck className="w-5 h-5 text-red-600" />,
  [UserRole.SUBDIRECTOR]: <ShieldCheck className="w-5 h-5 text-indigo-600" />,
  [UserRole.DOCENTE]: <GraduationCap className="w-5 h-5 text-emerald-600" />,
  [UserRole.AUXILIAR]: <Users className="w-5 h-5 text-amber-600" />,
  [UserRole.SECRETARIA]: <Briefcase className="w-5 h-5 text-purple-600" />,
  [UserRole.SUPERVISOR]: <ShieldCheck className="w-5 h-5 text-blue-600" />,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrador',
  [UserRole.SUBDIRECTOR]: 'Subdirector',
  [UserRole.DOCENTE]: 'Docente',
  [UserRole.AUXILIAR]: 'Auxiliar',
  [UserRole.SECRETARIA]: 'Secretaria',
  [UserRole.SUPERVISOR]: 'Supervisor',
};

export const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Inicio', icon: <FileBarChart className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.SECRETARIA] },
  { id: 'academic-year', label: 'Año Académico', icon: <CalendarDays className="w-5 h-5" />, roles: [UserRole.ADMIN] },
  { id: 'enrollment', label: 'Matrícula', icon: <UserPlus className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.SECRETARIA] },
  { id: 'areas', label: 'Áreas y Competencias', icon: <Layers className="w-5 h-5" />, roles: [UserRole.ADMIN] }, // Cambiado de Courses
  { id: 'course-assignments', label: 'Carga Horaria', icon: <ClipboardList className="w-5 h-5" />, roles: [UserRole.ADMIN] },
  { id: 'profiles', label: 'Personal', icon: <Users className="w-5 h-5" />, roles: [UserRole.ADMIN] },
  { id: 'students', label: 'Estudiantes', icon: <GraduationCap className="w-5 h-5" />, roles: [UserRole.ADMIN, UserRole.SECRETARIA] },
  { id: 'english', label: 'Gestión de Inglés', icon: <Languages className="w-5 h-5" />, roles: [UserRole.ADMIN] },
  { id: 'classrooms', label: 'Aulas', icon: <BookOpen className="w-5 h-5" />, roles: [UserRole.ADMIN] },
  { id: 'settings', label: 'Ajustes', icon: <Settings className="w-5 h-5" />, roles: [UserRole.ADMIN] },
  { id: 'roles', label: 'Roles y Permisos', icon: <ShieldCheck className="w-5 h-5" />, roles: [UserRole.ADMIN] },
];

