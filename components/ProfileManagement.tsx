
import React, { useState } from 'react';
import { Profile, UserRole, Assignment, Classroom } from '../types';
import { profileService, classroomService } from '../services/database.service';
import { useToast } from '../contexts/ToastContext';
import { mockAssignments } from '../services/mockData';
import { ROLE_ICONS, ROLE_LABELS } from '../constants';
import { Search, Filter, Edit3, MoreVertical, X, UserPlus, Mail, CreditCard, User, Loader2, Phone, Key, Smartphone, UserCheck, Venus, Mars, RefreshCw, Calendar, Save, ShieldCheck, Eye, EyeOff, MapPin } from 'lucide-react';
import { supabase } from '../services/supabase';
import AssignmentPanel from './AssignmentPanel';

const ProfileManagement: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [viewingProfile, setViewingProfile] = useState<Profile | null>(null);
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [loadingDni, setLoadingDni] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDniLookup = async (dni: string, isEditing: boolean) => {
    const cleanDni = dni.trim();
    if (cleanDni.length !== 8) {
      showToast('warning', 'El DNI debe tener 8 dígitos para realizar la consulta.', 'DNI Inválido');
      return;
    }

    console.log('ProfileManagement: Starting DNI lookup for:', cleanDni);
    setLoadingDni(true);

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('La consulta está demorando demasiado. Intente nuevamente.')), 15000)
    );

    try {
      if (!supabase) throw new Error('Cliente de Supabase no inicializado');

      console.log('ProfileManagement: Invoking Edge Function for DNI:', cleanDni);

      // Race the function call against the timeout
      const result = await Promise.race([
        supabase.functions.invoke('get-reniec-data', {
          body: { dni: cleanDni }
        }),
        timeoutPromise
      ]) as any;

      if (!result) throw new Error('No se recibió respuesta del servidor.');

      const { data, error } = result;

      if (error) {
        console.error('ProfileManagement: Edge Function error:', error);
        throw error;
      }

      console.log('ProfileManagement: DNI lookup successfully completed');

      if (data && data.normalized_full_name) {
        if (isEditing) {
          setEditingProfile(prev => prev ? { ...prev, full_name: data.normalized_full_name } : null);
        } else {
          setNewProfile(prev => ({ ...prev, full_name: data.normalized_full_name }));
        }
        showToast('success', 'Datos recuperados exitosamente de RENIEC.', 'Consulta Exitosa');
      } else {
        showToast('error', 'No se encontraron datos para este DNI en los servidores de RENIEC.', 'Sin Resultados');
      }
    } catch (error: any) {
      console.error('ProfileManagement: Error fetching DNI data:', error);
      const errorMsg = error.message === 'Failed to fetch' ? 'Error de conexión con el servidor. Revisa tu internet.' : error.message;
      showToast('error', `Error en consulta: ${errorMsg}`, 'Falla de Servicio');
    } finally {
      console.log('ProfileManagement: Resetting loadingDni state');
      setLoadingDni(false);
    }
  };

  React.useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      console.log('ProfileManagement: Starting fetchData...');
      setIsLoading(true);
      try {
        const [profilesData, classroomsData] = await Promise.all([
          profileService.getAll(),
          classroomService.getAll()
        ]);

        console.log('ProfileManagement: Data received:', profilesData?.length, 'profiles,', classroomsData?.length, 'classrooms');
        if (isMounted) {
          setProfiles(profilesData || []);
          setClassrooms(classroomsData || []);
        }
      } catch (error) {
        console.error('ProfileManagement: Error fetching data:', error);
      } finally {
        console.log('ProfileManagement: Fetch finished, setting isLoading to false');
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    // Safety timeout: force loading to stop after 6 seconds
    const timeoutId = setTimeout(() => {
      if (isLoading && isMounted) {
        console.warn('ProfileManagement: Fetch timeout reached, forcing isLoading to false');
        setIsLoading(false);
      }
    }, 6000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);


  // Fixed: Replaced 'status' with 'active' to match the Profile interface
  const [newProfile, setNewProfile] = useState<Partial<Profile>>({
    role: UserRole.DOCENTE,
    active: true,
    address: ''
  });

  const filteredProfiles = (profiles || []).filter(p => {
    if (!p) return false;
    const matchesSearch = (p.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.dni && p.dni.includes(searchTerm));
    const matchesRole = roleFilter === 'All' || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewProfile({ ...newProfile, password });
  };

  const handleCreateProfile = async () => {
    console.log('ProfileManagement: Attempting to create profile with Auth...', newProfile);
    if (!newProfile.dni || !newProfile.full_name || !newProfile.email || !newProfile.password) {
      showToast('warning', 'Por favor complete todos los campos obligatorios y genere una contraseña.', 'Datos Incompletos');
      return;
    }

    try {
      console.log('ProfileManagement: Calling adminCreateUser Edge Function...');
      const { email, password, ...userData } = newProfile;
      const result = await profileService.adminCreateUser(email!, password!, userData);

      console.log('ProfileManagement: Creation successful!', result);
      setProfiles([result.profile, ...profiles]);
      setIsAddingProfile(false);
      setNewProfile({ role: UserRole.DOCENTE, active: true, address: '' });
      showToast('success', 'Personal registrado exitosamente con cuenta de acceso.', '¡Registro Exitoso!');
    } catch (error: any) {
      console.error('ProfileManagement: Error creating profile:', error);
      showToast('error', `Error al registrar personal: ${error.message || 'Error desconocido'}`, 'Error de Registro');
    }
  };


  const handleUpdateProfile = async () => {
    console.log('ProfileManagement: Attempting to update profile...', editingProfile);
    if (!editingProfile) return;

    const { id, password, ...updates } = editingProfile;

    // Soft validation: allow existing nulls but prevent empty strings for required fields if provided
    if (!editingProfile.full_name || !editingProfile.email) {
      console.warn('ProfileManagement: Update blocked - missing Name or Email');
      showToast('warning', 'Nombre y Correo Institucional son obligatorios.', 'Campos Requeridos');
      return;
    }

    setIsUpdating(true);
    try {
      let currentId = id;
      // If a new password is provided, update it via Edge Function and include in DB update
      if (password && password.trim() !== '') {
        console.log('ProfileManagement: Updating password for profile ID:', id);
        const repairResult = await profileService.adminUpdatePassword(id, password);

        // If the Repair Sync migrated the ID, use the new one for the next database update
        if (repairResult && repairResult.new_id) {
          console.log('ProfileManagement: Repair Sync successful, NEW ID:', repairResult.new_id);
          currentId = repairResult.new_id;
          (updates as any).password = password;
        } else {
          (updates as any).password = password;
        }
      }

      console.log('ProfileManagement: Sending update to service for ID:', currentId, updates);
      const updatedProfile = await profileService.update(currentId, updates);
      console.log('ProfileManagement: Update successful!', updatedProfile);

      // Update state: if the ID changed, replace the old profile entry with the new one
      if (currentId !== id) {
        setProfiles(profiles.map(p => p.id === id ? updatedProfile : p));
      } else {
        setProfiles(profiles.map(p => p.id === updatedProfile.id ? updatedProfile : p));
      }

      setEditingProfile(null);
      showToast('success', 'Los cambios se han guardado correctamente.', 'Actualización Exitosa');

      // Refresh local profile list
      const freshProfiles = await profileService.getAll();
      setProfiles(freshProfiles);
    } catch (error: any) {
      console.error('ProfileManagement: Error updating profile:', error);
      showToast('error', `Error al actualizar: ${error.message || 'Error de red'}`, 'Error Crítico');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-[#57C5D5] animate-spin" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cargando Personal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestión de Personal</h2>
          <p className="text-slate-500 text-sm">Administra el equipo docente y administrativo de la institución.</p>
        </div>
        <button
          onClick={() => setIsAddingProfile(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#57C5D5] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#57C5D5]/20 hover:bg-[#46b3c2] transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Personal
        </button>
      </header>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por DNI o Nombre..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#57C5D5] transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#718096]" />
          <select
            className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#57C5D5]"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">Todos los roles</option>
            {Object.values(UserRole).map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Completo</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">DNI / Email</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProfiles.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                      {p.full_name?.charAt(0) || '?'}
                    </div>
                    <span className="font-semibold text-slate-800">{p.full_name || 'Nombre no registrado'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-slate-900">{p.dni}</p>
                  <p className="text-xs text-slate-500">{p.email}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full w-fit">
                    {ROLE_ICONS[p.role]}
                    <span className="text-xs font-bold text-slate-600">{ROLE_LABELS[p.role]}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {/* Fixed: Replaced 'status' with 'active' check */}
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${p.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {p.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 transition-opacity">
                    <button
                      onClick={() => setViewingProfile(p)}
                      className="p-2 hover:bg-white hover:shadow-md rounded-lg text-slate-400 hover:text-emerald-500 transition-all"
                      title="Ver Reporte"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingProfile({ ...p, password: '' })}
                      className="p-2 hover:bg-white hover:shadow-md rounded-lg text-slate-400 hover:text-[#57C5D5] transition-all"
                      title="Editar Datos"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-white hover:shadow-md rounded-lg text-slate-400 hover:text-slate-600 transition-all">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAddingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#57C5D5] rounded-xl text-white">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Registrar Nuevo Personal</h3>
                  <p className="text-sm text-slate-500">Completa los datos básicos para el alta.</p>
                </div>
              </div>
              <button onClick={() => setIsAddingProfile(false)} className="p-2 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            </header>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">DNI (Obligatorio)</label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={newProfile.dni || ''}
                      onChange={(e) => setNewProfile({ ...newProfile, dni: e.target.value })}
                      className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#57C5D5] outline-none transition-all"
                      placeholder="8 dígitos"
                    />
                    <button
                      type="button"
                      disabled={loadingDni}
                      onClick={() => handleDniLookup(newProfile.dni || '', false)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#57C5D5] text-white rounded-lg shadow-lg shadow-[#57C5D5]/20 hover:bg-[#46b3c2] transition-colors disabled:opacity-50"
                    >
                      {loadingDni ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre Completo</label>
                  <input
                    type="text"
                    value={newProfile.full_name || ''}
                    onChange={(e) => setNewProfile({ ...newProfile, full_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#57C5D5] outline-none"
                    placeholder="Ej. Carlos Mendoza"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Correo Institucional</label>
                  <input
                    type="email"
                    value={newProfile.email || ''}
                    onChange={(e) => setNewProfile({ ...newProfile, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#57C5D5] outline-none"
                    placeholder="usuario@valores.edu.pe"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Correo Personal</label>
                  <input
                    type="email"
                    value={newProfile.personal_email || ''}
                    onChange={(e) => setNewProfile({ ...newProfile, personal_email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#57C5D5] outline-none"
                    placeholder="ejemplo@gmail.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Celular</label>
                  <input
                    type="text"
                    value={newProfile.phone || ''}
                    onChange={(e) => setNewProfile({ ...newProfile, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#57C5D5] outline-none"
                    placeholder="999 999 999"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={newProfile.birth_date || ''}
                    onChange={(e) => setNewProfile({ ...newProfile, birth_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#57C5D5] outline-none"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Dirección Domiciliaria</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3 w-4 h-4 text-slate-300" />
                    <input
                      type="text"
                      value={newProfile.address || ''}
                      onChange={(e) => setNewProfile({ ...newProfile, address: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#57C5D5] outline-none"
                      placeholder="Av. Las Lilas 123, Distrito"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Sexo</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewProfile({ ...newProfile, gender: 'M' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all ${newProfile.gender === 'M' ? 'border-[#57C5D5] bg-[#57C5D5]/5 text-[#57C5D5]' : 'border-slate-100 text-slate-500'}`}
                    >
                      <Mars className="w-4 h-4" /> Masculino
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewProfile({ ...newProfile, gender: 'F' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all ${newProfile.gender === 'F' ? 'border-[#57C5D5] bg-[#57C5D5]/5 text-[#57C5D5]' : 'border-slate-100 text-slate-500'}`}
                    >
                      <Venus className="w-4 h-4" /> Femenino
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Contraseña de Acceso</label>
                  <div className="flex gap-2 relative">
                    <div className="relative flex-1">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newProfile.password || ''}
                        onChange={(e) => setNewProfile({ ...newProfile, password: e.target.value })}
                        autoComplete="new-password"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#57C5D5] outline-none pr-12"
                        placeholder="Escribir o generar..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 flex items-center gap-2 whitespace-nowrap"
                    >
                      <RefreshCw className="w-4 h-4" /> Generar
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Seleccionar Rol</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.values(UserRole).map((role) => (
                    <button
                      key={role}
                      onClick={() => setNewProfile({ ...newProfile, role })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${newProfile.role === role
                        ? 'border-[#57C5D5] bg-[#57C5D5]/5 text-[#57C5D5]'
                        : 'border-slate-100 bg-white hover:border-slate-200 text-slate-600'
                        }`}
                    >
                      {ROLE_ICONS[role]}
                      <span className="text-[10px] font-bold uppercase">{ROLE_LABELS[role]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <footer className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setIsAddingProfile(false)} className="px-6 py-2 text-sm font-bold text-slate-400">Cancelar</button>
              <button onClick={handleCreateProfile} className="px-8 py-2.5 bg-[#57C5D5] text-white rounded-xl font-bold text-sm shadow-xl shadow-[#57C5D5]/20 hover:bg-[#46b3c2]">Registrar Personal</button>
            </footer>
          </div>
        </div>
      )}

      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-300">
            <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#57C5D5]/10 rounded-xl text-[#57C5D5]">{ROLE_ICONS[editingProfile.role]}</div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Editar: {editingProfile.full_name}</h3>
                  <p className="text-sm text-slate-500">Modifica los datos del personal.</p>
                </div>
              </div>
              <button onClick={() => setEditingProfile(null)} className="p-2 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            </header>
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">DNI</label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={editingProfile.dni || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, dni: e.target.value })}
                      className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#57C5D5] transition-all"
                    />
                    <button
                      type="button"
                      disabled={loadingDni}
                      onClick={() => handleDniLookup(editingProfile.dni || '', true)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#57C5D5] text-white rounded-lg shadow-lg shadow-[#57C5D5]/20 hover:bg-[#46b3c2] transition-colors disabled:opacity-50"
                    >
                      {loadingDni ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre Completo</label>
                  <input
                    type="text"
                    value={editingProfile.full_name || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, full_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Correo Institucional</label>
                  <input
                    type="email"
                    value={editingProfile.email || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Correo Personal</label>
                  <input
                    type="email"
                    value={editingProfile.personal_email || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, personal_email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Celular</label>
                  <input
                    type="text"
                    value={editingProfile.phone || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={editingProfile.birth_date || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, birth_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Dirección Domiciliaria</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3 w-4 h-4 text-slate-300" />
                    <input
                      type="text"
                      value={editingProfile.address || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, address: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#57C5D5]"
                      placeholder="Av. Las Lilas 123, Distrito"
                    />
                  </div>
                </div>
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Cambio de Contraseña</label>
                  <div className="relative">
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      value={editingProfile.password || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, password: e.target.value })}
                      placeholder="Dejar en blanco para no cambiar"
                      autoComplete="new-password"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#57C5D5]/20 focus:border-[#57C5D5] transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Estado</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingProfile({ ...editingProfile, active: true })}
                      className={`flex-1 py-2.5 rounded-xl border-2 transition-all ${editingProfile.active ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-100 text-slate-500'}`}
                    >
                      Activo
                    </button>
                    <button
                      onClick={() => setEditingProfile({ ...editingProfile, active: false })}
                      className={`flex-1 py-2.5 rounded-xl border-2 transition-all ${!editingProfile.active ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-100 text-slate-500'}`}
                    >
                      Inactivo
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Sexo</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingProfile({ ...editingProfile, gender: 'M' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all ${editingProfile.gender === 'M' ? 'border-[#57C5D5] bg-[#57C5D5]/5 text-[#57C5D5]' : 'border-slate-100 text-slate-500'}`}
                    >
                      <Mars className="w-4 h-4" /> Masculino
                    </button>
                    <button
                      onClick={() => setEditingProfile({ ...editingProfile, gender: 'F' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all ${editingProfile.gender === 'F' ? 'border-[#57C5D5] bg-[#57C5D5]/5 text-[#57C5D5]' : 'border-slate-100 text-slate-500'}`}
                    >
                      <Venus className="w-4 h-4" /> Femenino
                    </button>
                  </div>
                </div>
              </div>

              <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#57C5D5]" /> Nivel de Acceso y Rol
                  </h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.values(UserRole).map((role) => (
                    <button
                      key={role}
                      onClick={() => setEditingProfile({ ...editingProfile, role })}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${editingProfile.role === role
                        ? 'border-[#57C5D5] bg-[#57C5D5]/5 text-[#57C5D5] ring-2 ring-[#57C5D5]/20'
                        : 'border-white bg-white hover:border-slate-200 text-slate-600'
                        }`}
                    >
                      {ROLE_ICONS[role]}
                      <span className="text-xs font-bold">{ROLE_LABELS[role]}</span>
                    </button>
                  ))}
                </div>
              </section>

              <AssignmentPanel
                profile={editingProfile}
                classrooms={classrooms}
                initialAssignments={mockAssignments.filter(a => a.profileId === editingProfile.id)}
                onSave={(newAssignments) => {
                  handleUpdateProfile();
                }}
              />

            </div>
            <footer className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setEditingProfile(null)} className="px-6 py-2 text-sm font-bold text-slate-400" disabled={isUpdating}>Cancelar</button>
              <button
                onClick={handleUpdateProfile}
                disabled={isUpdating}
                className="px-8 py-2.5 bg-[#57C5D5] text-white rounded-xl font-bold text-sm shadow-xl shadow-[#57C5D5]/20 hover:bg-[#46b3c2] flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </footer>
          </div>
        </div>
      )}
      {viewingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Ficha de Personal</h3>
                  <p className="text-sm text-slate-500">Vista de reporte institucional.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Imprimir"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button onClick={() => setViewingProfile(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-6 h-6" /></button>
              </div>
            </header>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto print:max-h-none">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-32 h-32 rounded-3xl bg-slate-100 flex items-center justify-center text-4xl font-bold text-slate-300 border-4 border-white shadow-xl shrink-0">
                  {viewingProfile.full_name?.charAt(0)}
                </div>
                <div className="space-y-4 flex-1 w-full">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 leading-tight">{viewingProfile.full_name}</h2>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="px-3 py-1 bg-[#57C5D5]/10 text-[#57C5D5] rounded-full text-xs font-bold uppercase tracking-widest">{ROLE_LABELS[viewingProfile.role]}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${viewingProfile.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {viewingProfile.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12 border-t border-slate-100 pt-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DNI</label>
                      <p className="text-slate-700 font-semibold flex items-center gap-2 pr-4 border-r border-slate-50 last:border-0"><CreditCard className="w-4 h-4 text-slate-300" /> {viewingProfile.dni}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Correo Institucional</label>
                      <p className="text-slate-700 font-semibold flex items-center gap-2"><Mail className="w-4 h-4 text-slate-300" /> {viewingProfile.email}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Celular</label>
                      <p className="text-slate-700 font-semibold flex items-center gap-2"><Phone className="w-4 h-4 text-slate-300" /> {viewingProfile.phone || 'No registrado'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">F. Nacimiento</label>
                      <p className="text-slate-700 font-semibold flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-300" /> {viewingProfile.birth_date || 'No registrado'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Correo Personal</label>
                      <p className="text-slate-700 font-semibold flex items-center gap-2"><Mail className="w-4 h-4 text-slate-300" /> {viewingProfile.personal_email || 'No registrado'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Género</label>
                      <p className="text-slate-700 font-semibold flex items-center gap-2">
                        {viewingProfile.gender === 'M' ? <Mars className="w-4 h-4 text-blue-300" /> : <Venus className="w-4 h-4 text-pink-300" />}
                        {viewingProfile.gender === 'M' ? 'Masculino' : viewingProfile.gender === 'F' ? 'Femenino' : 'No especificado'}
                      </p>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dirección</label>
                      <p className="text-slate-700 font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-300" /> {viewingProfile.address || 'No registrado'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignments in Report */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Responsabilidades de Aula
                </h4>
                {mockAssignments.filter(a => a.profileId === viewingProfile.id).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {mockAssignments.filter(a => a.profileId === viewingProfile.id).map((asg, idx) => {
                      const room = classrooms.find(r => r.id === asg.classroomId);
                      return (
                        <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{room?.name || 'Aula desconocida'}</p>
                            <p className="text-[10px] text-slate-400 uppercase">{room?.level} - {room?.grade} {room?.section}</p>
                          </div>
                          <div className="flex gap-1">
                            {asg.canAttendance && <span className="p-1.5 bg-green-50 text-green-600 rounded-md text-[8px] font-bold uppercase">Asistencia</span>}
                            {asg.canGrades && <span className="p-1.5 bg-blue-50 text-blue-600 rounded-md text-[8px] font-bold uppercase">Notas</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-white rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-400 font-medium">Sin asignaciones directas de aula.</p>
                  </div>
                )}
              </div>
            </div>

            <footer className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingProfile(null)}
                className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95"
              >
                Cerrar Reporte
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileManagement;