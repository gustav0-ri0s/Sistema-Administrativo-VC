import { AcademicYear, BimestreConfig, YearStatus } from '../types';

/**
 * State Machine for Academic Years
 * Valid transitions:
 * - planificación → abierto
 * - abierto → cerrado
 * - cerrado → planificación (new cycle)
 */

export const YEAR_STATUS_TRANSITIONS: Record<YearStatus, YearStatus[]> = {
    'planificación': ['abierto'],
    'abierto': ['cerrado'],
    'cerrado': ['planificación'] // Only for creating new cycles
};

/**
 * Get valid next states for a given status
 */
export function getValidTransitions(currentStatus: YearStatus): YearStatus[] {
    return YEAR_STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Check if a state transition is valid
 */
export function canTransitionTo(from: YearStatus, to: YearStatus): boolean {
    const validTransitions = getValidTransitions(from);
    return validTransitions.includes(to);
}

/**
 * Get human-readable transition error message
 */
export function getTransitionErrorMessage(from: YearStatus, to: YearStatus): string {
    if (canTransitionTo(from, to)) return '';

    const fromLabel = from === 'planificación' ? 'Planificación' : from.charAt(0).toUpperCase() + from.slice(1);
    const toLabel = to === 'planificación' ? 'Planificación' : to.charAt(0).toUpperCase() + to.slice(1);

    return `No se puede cambiar de "${fromLabel}" a "${toLabel}". Transición no permitida por las reglas de negocio.`;
}

/**
 * Bimestre Validation Logic
 */

export interface BimestreValidation {
    canEdit: boolean;
    reason: string;
    isInDateRange: boolean;
    isForceOpen: boolean;
    isYearActive: boolean;
}

/**
 * Check if a bimestre is currently active (within date range)
 */
export function isBimestreInDateRange(bimestre: BimestreConfig, currentDate: Date = new Date()): boolean {
    const start = new Date(bimestre.start_date);
    const end = new Date(bimestre.end_date);
    return currentDate >= start && currentDate <= end;
}

/**
 * Main validation function: Can a teacher edit grades for this bimestre?
 */
export function canEditGrades(
    bimestre: BimestreConfig,
    year: AcademicYear,
    currentDate: Date = new Date()
): BimestreValidation {
    const isYearActive = year.is_active;
    const isInDateRange = isBimestreInDateRange(bimestre, currentDate);
    const isForceOpen = bimestre.is_force_open || false;
    const isLocked = bimestre.is_locked;

    // Year must be active
    if (!isYearActive) {
        return {
            canEdit: false,
            reason: 'El año académico no está activo',
            isInDateRange,
            isForceOpen,
            isYearActive: false
        };
    }

    // If locked, cannot edit regardless
    if (isLocked && !isForceOpen) {
        return {
            canEdit: false,
            reason: 'El bimestre está bloqueado',
            isInDateRange,
            isForceOpen,
            isYearActive
        };
    }

    // Can edit if in date range OR force open
    const canEdit = isInDateRange || isForceOpen;

    return {
        canEdit,
        reason: canEdit ? 'Permitido' : 'Fuera del período de evaluación',
        isInDateRange,
        isForceOpen,
        isYearActive
    };
}

/**
 * Get status badge info for a bimestre
 */
export function getBimestreStatusBadge(validation: BimestreValidation): {
    text: string;
    color: string;
    icon: 'lock' | 'unlock' | 'calendar';
} {
    if (!validation.isYearActive) {
        return { text: 'AÑO INACTIVO', color: 'slate', icon: 'lock' };
    }

    if (validation.canEdit) {
        if (validation.isForceOpen) {
            return { text: 'FORZADO ABIERTO', color: 'amber', icon: 'unlock' };
        }
        return { text: 'ABIERTO PARA NOTAS', color: 'emerald', icon: 'unlock' };
    }

    if (!validation.isInDateRange) {
        return { text: 'FUERA DE PERÍODO', color: 'slate', icon: 'calendar' };
    }

    return { text: 'INGRESO DESHABILITADO', color: 'red', icon: 'lock' };
}

/**
 * Year Activation Logic
 */

export interface YearActivationResult {
    success: boolean;
    updates: Array<{ id: number; is_active: boolean; status?: YearStatus }>;
    errors: string[];
}

/**
 * Calculate updates needed to activate a year
 */
export function calculateYearActivation(
    targetYearId: number,
    allYears: AcademicYear[]
): YearActivationResult {
    const errors: string[] = [];
    const updates: Array<{ id: number; is_active: boolean; status?: YearStatus }> = [];

    const targetYear = allYears.find(y => y.id === targetYearId);

    if (!targetYear) {
        return {
            success: false,
            updates: [],
            errors: ['Año no encontrado']
        };
    }

    // Target year must be set to active and abierto
    updates.push({
        id: targetYearId,
        is_active: true,
        status: 'abierto'
    });

    // All other years must be deactivated
    allYears.forEach(year => {
        if (year.id !== targetYearId && year.is_active) {
            // Determine new status for deactivated years
            const newStatus: YearStatus = year.status === 'abierto' ? 'cerrado' : year.status;

            updates.push({
                id: year.id,
                is_active: false,
                status: newStatus
            });
        }
    });

    return {
        success: true,
        updates,
        errors
    };
}

/**
 * Check if a year is completely read-only (closed)
 * Planning and Open years allow modifications (enrollments, configs)
 */
export function isYearReadOnly(year: AcademicYear): boolean {
    return year.status === 'cerrado';
}

/**
 * Check if enrollment is allowed for this year
 * Allowed in Planning (Jan-Feb) and Open (Mar-...) modes
 */
export function canEnroll(year: AcademicYear): boolean {
    return year.status === 'planificación' || year.status === 'abierto';
}

/**
 * Check if grades can be edited (requires year to be fully active/abierto)
 */
export function canModifyAcademicData(year: AcademicYear): boolean {
    return year.status === 'abierto' && year.is_active;
}

/**
 * Get year status display info
 */
export function getYearStatusInfo(status: YearStatus): {
    label: string;
    color: string;
    bgColor: string;
} {
    switch (status) {
        case 'abierto':
            return {
                label: 'Abierto',
                color: 'text-emerald-600',
                bgColor: 'bg-emerald-50'
            };
        case 'cerrado':
            return {
                label: 'Cerrado',
                color: 'text-slate-500',
                bgColor: 'bg-slate-50'
            };
        case 'planificación':
            return {
                label: 'Planificación',
                color: 'text-[#57C5D5]',
                bgColor: 'bg-[#57C5D5]/10'
            };
    }
}

/**
 * Format date for display
 */
export function formatBimestreDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}
