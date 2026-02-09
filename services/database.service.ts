
import { supabase } from './supabase';
import { Profile, Student, AcademicYear, Classroom, CurricularArea, IncidentSummary } from '../types';

export const profileService = {
    async getAll() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name', { ascending: true });

        if (error) throw error;
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
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Profile;
    }
};

export const studentService = {
    async getAll() {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .order('last_name', { ascending: true });

        if (error) throw error;
        return data as Student[];
    },

    async create(student: Partial<Student>) {
        const { data, error } = await supabase
            .from('students')
            .insert([student])
            .select()
            .single();

        if (error) throw error;
        return data as Student;
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

    async updateBimestre(id: number, updates: { is_locked?: boolean; is_force_open?: boolean }) {
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
            .insert([{ year, status, is_active: false }])
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
