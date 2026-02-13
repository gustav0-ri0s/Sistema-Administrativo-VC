
import { supabase } from './supabase';
import { Profile, Student, AcademicYear, Classroom, CurricularArea, IncidentSummary, CourseAssignment, InstitutionalSettings, RolePermission, UserRole } from '../types';


export const rolePermissionService = {
    async getAll() {
        const { data, error } = await supabase
            .from('role_permissions')
            .select('*');

        if (error) throw error;
        return data as RolePermission[];
    },

    async update(role: UserRole, modules: string[]) {
        const { data, error } = await supabase
            .from('role_permissions')
            .upsert({
                role,
                modules,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data as RolePermission;
    },

    async getByRole(role: UserRole) {
        const { data, error } = await supabase
            .from('role_permissions')
            .select('*')
            .eq('role', role)
            .maybeSingle();

        if (error) throw error;
        return data as RolePermission | null;
    }
};


export const profileService = {
    async getAll() {
        console.log('profileService: getAll() called');
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name', { ascending: true });

        if (error) {
            console.error('profileService: getAll() error:', error);
            throw error;
        }
        console.log('profileService: getAll() returned', data?.length, 'profiles');
        return data as Profile[];
    },

    async create(profile: Partial<Profile>) {
        const { data, error } = await supabase
            .from('profiles')
            .insert([profile])
            .select()
            .single();

        if (error) throw error;
        return data as Profile;
    },

    async update(id: string, updates: Partial<Profile>) {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Profile;
    },

    async getById(id: string) {
        console.log('profileService: getById() called for ID:', id);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('profileService: getById() error:', error);
            throw error;
        }
        console.log('profileService: getById() found profile:', data?.full_name);
        return data as Profile;
    },

    async adminCreateUser(email: string, password: string, userData: Partial<Profile>) {
        console.log('profileService: adminCreateUser() called for', email);
        const { data, error } = await supabase.functions.invoke('admin-auth-handler', {
            body: { action: 'create_user', email, password, userData }
        });

        if (error) {
            console.error('profileService: adminCreateUser() error:', error);
            throw error;
        }
        return data;
    },

    async adminUpdatePassword(profile_id: string, password: string) {
        console.log('profileService: adminUpdatePassword() called for', profile_id);
        const { data, error } = await supabase.functions.invoke('admin-auth-handler', {
            body: { action: 'update_password', profile_id, password }
        });

        if (error) {
            console.error('profileService: adminUpdatePassword() error:', error);
            throw error;
        }
        return data;
    },

    async getTeachers() {
        console.log('profileService: getTeachers() called');
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'docente')
            .eq('active', true)
            .order('full_name', { ascending: true });

        if (error) {
            console.error('profileService: getTeachers() error:', error);
            throw error;
        }
        return data as Profile[];
    },

    async getActiveCount() {
        console.log('profileService: getActiveCount() called');
        const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('active', true);

        if (error) {
            console.error('profileService: getActiveCount() error:', error);
            return 0;
        }
        return count || 0;
    }
};

export const courseAssignmentService = {
    async getAll() {
        const { data, error } = await supabase
            .from('course_assignments')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map((d: any) => ({
            id: d.id.toString(),
            courseId: d.area_id.toString(),
            profileId: d.profile_id,
            classroomId: d.classroom_id.toString(),
            hoursPerWeek: d.hours_per_week
        })) as CourseAssignment[];
    },

    async createBulk(assignments: Omit<CourseAssignment, 'id'>[]) {
        const dbData = assignments.map(a => ({
            area_id: parseInt(a.courseId),
            profile_id: a.profileId,
            classroom_id: parseInt(a.classroomId),
            hours_per_week: a.hoursPerWeek
        }));

        const { data, error } = await supabase
            .from('course_assignments')
            .insert(dbData)
            .select();

        if (error) throw error;
        return data;
    },

    async delete(id: string | number) {
        const { error } = await supabase
            .from('course_assignments')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

export const studentService = {
    async getAll() {
        const { data, error } = await supabase
            .from('students')
            .select(`
                *,
                student_parents (
                    relationship,
                    is_guardian,
                    parents (*)
                )
            `)
            .order('last_name', { ascending: true });

        if (error) throw error;

        // Map the join table structure to the flat parents list expected by the UI
        return data.map((s: any) => ({
            ...s,
            parents: s.student_parents?.map((sp: any) => ({
                ...sp.parents,
                relationship: sp.relationship,
                is_guardian: sp.is_guardian
            })) || []
        })) as Student[];
    },

    async create(student: Partial<Student>) {
        const { parents, ...dbData } = student as any;
        const { data, error } = await supabase
            .from('students')
            .insert([dbData])
            .select()
            .single();

        if (error) throw error;
        return data as Student;
    },

    async update(id: string, updates: Partial<Student>) {
        const { parents, ...dbData } = updates as any;
        const { data, error } = await supabase
            .from('students')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Student;
    },

    async moveToClassroom(studentId: string, classroomId: number | string) {
        const { data, error } = await supabase
            .from('students')
            .update({ classroom_id: classroomId })
            .eq('id', studentId)
            .select()
            .single();

        if (error) throw error;
        return data as Student;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getCountByYear(academicYearId: number) {
        console.log('studentService: getCountByYear() called for year ID:', academicYearId);
        const { count, error } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('academic_year_id', academicYearId);

        if (error) {
            console.error('studentService: getCountByYear() error:', error);
            return 0;
        }
        return count || 0;
    },

    async searchStudents(query: string) {
        console.log('studentService: searchStudents() called with:', query);
        const { data, error } = await supabase
            .from('students')
            .select(`
                *,
                student_parents (
                    relationship,
                    is_guardian,
                    parents (*)
                )
            `)
            .or(`dni.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
            .limit(10);

        if (error) throw error;

        return data.map((s: any) => ({
            ...s,
            parents: s.student_parents?.map((sp: any) => ({
                ...sp.parents,
                relationship: sp.relationship,
                is_guardian: sp.is_guardian
            })) || []
        })) as Student[];
    }
};

export const academicService = {
    async getYears() {
        console.log('DB Service: Fetching academic years...');
        const { data, error } = await supabase
            .from('academic_years')
            .select('*, bimestres(*)')
            .order('year', { ascending: false });

        if (error) {
            console.error('DB Service: Error fetching years:', error);
            throw error;
        }
        console.log('DB Service: Fetched years:', data);
        return data as AcademicYear[];
    },

    async updateYear(id: number, updates: Partial<AcademicYear>) {
        console.log('DB Service: Updating year', id, 'with:', updates);

        // If the status is being changed to 'cerrado', update students
        if (updates.status === 'cerrado') {
            console.log('DB Service: Closing year, updating students status...');
            const { error: studentError } = await supabase
                .from('students')
                .update({ academic_status: 'sin_matricula' })
                .eq('academic_year_id', id)
                .eq('academic_status', 'matriculado');

            if (studentError) {
                console.error('DB Service: Error updating students on year close:', studentError);
                // We keep going but log the error
            }
        }

        const { error } = await supabase
            .from('academic_years')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('DB Service: Error updating year:', error);
            throw error;
        }
        console.log('DB Service: Year updated successfully');
    },

    async activateYear(yearId: number) {
        console.log('DB Service: Activating year', yearId);

        // First, deactivate all years
        const { error: deactivateError } = await supabase
            .from('academic_years')
            .update({ is_active: false })
            .neq('id', 0); // Update all rows

        if (deactivateError) {
            console.error('DB Service: Error deactivating years:', deactivateError);
            throw deactivateError;
        }

        // Then activate the target year and set it to 'abierto'
        const { error: activateError } = await supabase
            .from('academic_years')
            .update({ is_active: true, status: 'abierto' })
            .eq('id', yearId);

        if (activateError) {
            console.error('DB Service: Error activating year:', activateError);
            throw activateError;
        }

        console.log('DB Service: Year activated successfully');
    },

    async updateBimestre(id: number, updates: { is_locked?: boolean; is_force_open?: boolean; start_date?: string; end_date?: string }) {
        console.log('DB Service: Updating bimestre', id, 'with:', updates);
        const { error } = await supabase
            .from('bimestres')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('DB Service: Error updating bimestre:', error);
            throw error;
        }
        console.log('DB Service: Bimestre updated successfully');
    },

    async createYear(year: number, status: string) {
        console.log('DB Service: Creating year', year, 'with status', status);
        const { data: yearData, error: yearError } = await supabase
            .from('academic_years')
            .insert([{
                year,
                status,
                is_active: false,
                start_date: `${year}-03-01`,
                end_date: `${year}-12-20`
            }])
            .select()
            .single();

        if (yearError) {
            console.error('DB Service: Error creating year:', yearError);
            throw yearError;
        }
        console.log('DB Service: Year created:', yearData);

        const bimestres = [
            { academic_year_id: yearData.id, name: 'I Bimestre', start_date: `${year}-03-01`, end_date: `${year}-05-15`, is_locked: false },
            { academic_year_id: yearData.id, name: 'II Bimestre', start_date: `${year}-05-20`, end_date: `${year}-07-25`, is_locked: true },
            { academic_year_id: yearData.id, name: 'III Bimestre', start_date: `${year}-08-10`, end_date: `${year}-10-15`, is_locked: true },
            { academic_year_id: yearData.id, name: 'IV Bimestre', start_date: `${year}-10-20`, end_date: `${year}-12-20`, is_locked: true },
        ];

        console.log('DB Service: Creating bimestres for year', year);
        const { error: bimError } = await supabase.from('bimestres').insert(bimestres);
        if (bimError) {
            console.error('DB Service: Error creating bimestres:', bimError);
            throw bimError;
        }
        console.log('DB Service: Bimestres created successfully');

        return yearData;

    }
};

export const incidentService = {
    async getRecent(limit: number = 5) {
        console.log('DB Service: Fetching recent incidents...');
        const { data, error } = await supabase
            .from('incidents')
            .select('id, correlative, type, status, incident_date')
            .order('incident_date', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('DB Service: Error fetching incidents:', error);
            // Return empty array instead of throwing to prevent crashing the dashboard
            return [];
        }
        return data as IncidentSummary[];
    },

    async getStats() {
        try {
            // Get total count
            const { count: total, error: totalError } = await supabase
                .from('incidents')
                .select('*', { count: 'exact', head: true });

            if (totalError) throw totalError;

            // Get pending count (not 'resuelta' or 'resolved')
            // Using a raw filter because 'neq' might be case sensitive depending on collation, 
            // but for now we assume standard behavior or we can fetch all status if needed.
            // Simplified approach: fetch all statuses and count in JS if dataset is small, 
            // OR use multiple queries. 
            // Robust approach: 
            const { data: allIncidents, error: listError } = await supabase
                .from('incidents')
                .select('status');

            if (listError) throw listError;

            const pending = allIncidents.filter(i => {
                const s = i.status.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return s !== 'resuelta' && s !== 'resolved';
            }).length;

            return { total: total || 0, pending };

        } catch (error) {
            console.error('DB Service: Error fetching stats:', error);
            return { total: 0, pending: 0 };
        }
    }
};

export const classroomService = {
    async getAll() {
        console.log('classroomService: getAll() called');
        const { data, error } = await supabase
            .from('classrooms')
            .select(`
                *,
                students (id)
            `)
            .order('level', { ascending: true })
            .order('grade', { ascending: true })
            .order('section', { ascending: true });

        if (error) {
            console.error('classroomService: getAll() error:', error);
            throw error;
        }

        return data.map(item => ({
            ...item,
            enrolled: (item.students as any[])?.length || 0,
            active: item.active ?? true
        })) as Classroom[];
    },

    async create(classroom: Partial<Classroom>) {
        const { enrolled, ...dbData } = classroom as any;
        if (dbData.level) dbData.level = dbData.level.toLowerCase();

        const { data, error } = await supabase
            .from('classrooms')
            .insert([dbData])
            .select()
            .single();

        if (error) throw error;
        return data as Classroom;
    },

    async update(id: string | number, updates: Partial<Classroom>) {
        console.log('classroomService: update() called', { id, updates });
        const { enrolled, ...dbUpdates } = updates as any; // Strip non-DB fields

        // Ensure level is lowercase if present
        if (dbUpdates.level) {
            dbUpdates.level = dbUpdates.level.toLowerCase();
        }

        const { data, error } = await supabase
            .from('classrooms')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('classroomService: update() error:', error);
            throw error;
        }
        return data as Classroom;
    },

    async getStudents(classroomId: number | string) {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('classroom_id', classroomId)
            .order('last_name', { ascending: true });

        if (error) throw error;
        return data as Student[];
    },

    async delete(id: string | number) {
        const { error } = await supabase
            .from('classrooms')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

export const curricularAreaService = {
    async getAll() {
        console.log('curricularAreaService: getAll() called');
        const { data, error } = await supabase
            .from('curricular_areas')
            .select(`
                *,
                competencies (*)
            `)
            .order('order', { ascending: true });

        if (error) {
            console.error('curricularAreaService: getAll() error:', error);
            throw error;
        }

        // Map database snake_case to frontend camelCase if necessary
        return data.map(area => ({
            ...area,
            level: area.level.charAt(0).toUpperCase() + area.level.slice(1),
            competencies: area.competencies.map((comp: any) => ({
                id: comp.id.toString(),
                name: comp.name,
                description: comp.description || '',
                isEvaluated: comp.is_evaluated
            }))
        })) as CurricularArea[];
    },

    async updateCompetencyStatus(id: string | number, isEvaluated: boolean) {
        const { error } = await supabase
            .from('competencies')
            .update({ is_evaluated: isEvaluated })
            .eq('id', id);

        if (error) throw error;
    }
};

export const settingsService = {
    async getInstitutionalInfo() {
        const { data, error } = await supabase
            .from('institutional_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is 'no rows found'

        if (!data) return null;

        return {
            name: data.name,
            slogan: data.slogan,
            address: data.address,
            city: data.city,
            phones: data.phones,
            directorName: data.director_name,
            attendanceTolerance: data.attendance_tolerance ?? 15,
            logoUrl: data.logo_url || '/image/logo.png'
        } as InstitutionalSettings;
    },

    async updateInstitutionalInfo(info: InstitutionalSettings) {
        const { error } = await supabase
            .from('institutional_settings')
            .upsert({
                id: 1,
                name: info.name,
                slogan: info.slogan,
                address: info.address,
                city: info.city,
                phones: info.phones,
                director_name: info.directorName,
                attendance_tolerance: info.attendanceTolerance,
                logo_url: info.logoUrl,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
    },

    async uploadLogo(file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `logo_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('institucion')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('institucion')
            .getPublicUrl(filePath);

        return publicUrl;
    }
};

export const behaviorService = {
    async getAll() {
        const { data, error } = await supabase
            .from('behavior_criteria')
            .select('*')
            .eq('active', true)
            .order('id', { ascending: true });

        if (error) throw error;
        return data.map((d: any) => ({
            id: d.id.toString(),
            name: d.name,
            weight: d.weight
        }));
    },
    async saveAll(criteria: { id?: string, name: string, weight: string }[]) {
        // Simple approach: delete all and re-insert for the whole list
        // Or UPSERT. Let's use UPSERT if they have numeric IDs.
        const dbData = criteria.map(c => ({
            ...(c.id?.startsWith('bc') ? {} : { id: parseInt(c.id!) }),
            name: c.name,
            weight: c.weight,
            active: true
        }));

        const { error } = await supabase
            .from('behavior_criteria')
            .upsert(dbData);
        if (error) throw error;
    },
    async delete(id: string) {
        const { error } = await supabase
            .from('behavior_criteria')
            .update({ active: false })
            .eq('id', parseInt(id));
        if (error) throw error;
    }
};

export const commitmentService = {
    async getAll() {
        const { data, error } = await supabase
            .from('family_commitments')
            .select('*')
            .eq('active', true)
            .order('id', { ascending: true });

        if (error) throw error;
        return data.map((d: any) => ({
            id: d.id.toString(),
            description: d.description
        }));
    },
    async saveAll(commitments: { id?: string, description: string }[]) {
        const dbData = commitments.map(c => ({
            ...(c.id ? { id: parseInt(c.id) } : {}),
            description: c.description,
            active: true
        }));

        const { error } = await supabase
            .from('family_commitments')
            .upsert(dbData);
        if (error) throw error;
    },
    async delete(id: string) {
        const { error } = await supabase
            .from('family_commitments')
            .update({ active: false })
            .eq('id', parseInt(id));
        if (error) throw error;
    }
};

export const attendanceService = {
    async getTypes() {
        const { data, error } = await supabase
            .from('attendance_types')
            .select('*')
            .eq('active', true)
            .order('id', { ascending: true });

        if (error) throw error;
        return data.map((d: any) => ({
            id: d.id.toString(),
            name: d.name,
            color: d.color
        }));
    }
};

export const enrollmentService = {
    async completeEnrollment(enrollmentData: {
        student: Partial<Student>,
        parents: any[],
        academicYearId: number,
        classroomId?: number
    }) {
        const { student, parents, academicYearId, classroomId } = enrollmentData;

        // 1. Upsert Student
        const { data: savedStudent, error: studentError } = await supabase
            .from('students')
            .upsert({
                id: student.id || undefined,
                dni: student.dni,
                first_name: student.first_name,
                last_name: student.last_name,
                email: student.email,
                gender: student.gender || 'M',
                address: student.address,
                birth_date: student.birth_date,
                academic_status: 'matriculado',
                academic_year_id: academicYearId,
                classroom_id: classroomId
            }, { onConflict: 'dni' })
            .select()
            .single();

        if (studentError) throw studentError;

        // 2. Process Parents
        for (const p of parents) {
            if (!p.dni) continue;

            // Upsert Parent by DNI
            const { data: savedParent, error: parentError } = await supabase
                .from('parents')
                .upsert({
                    dni: p.dni,
                    full_name: p.full_name,
                    phone: p.phone,
                    occupation: p.occupation,
                    address: p.address
                }, { onConflict: 'dni' })
                .select()
                .single();

            if (parentError) throw parentError;

            // Link in student_parents
            const { error: linkError } = await supabase
                .from('student_parents')
                .upsert({
                    student_id: savedStudent.id,
                    parent_id: savedParent.id,
                    relationship: p.relationship,
                    is_guardian: p.is_guardian
                }, { onConflict: 'student_id,parent_id' });

            if (linkError) throw linkError;
        }

        // 3. Update Classroom if specified (Optional: would need a bridge table or field in students)
        if (classroomId) {
            // Depending on how classroom assignment is stored. 
            // Assuming students table has a classroom_id (checking schema below)
        }

        return savedStudent;
    }
};
