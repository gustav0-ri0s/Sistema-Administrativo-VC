# Sincronización de Asignaciones de Salones

## Problema Resuelto

Cuando el sistema de asistencia asigna un salón a un docente, el check de "Asistencia" en el módulo de Personal del sistema administrativo no aparecía marcado.

## Causa del Problema

El sistema de asistencia y el sistema administrativo comparten la misma base de datos pero usan diferentes convenciones de nombres para las columnas:

- **Sistema de Asistencia**: Usa `user_id` en la tabla `course_assignments`
- **Sistema Administrativo**: Esperaba `profile_id` en la tabla `course_assignments`

Ambos campos referencian al mismo usuario (`auth.users.id`), pero el código no estaba leyendo correctamente el campo `user_id`.

## Solución Implementada

### 1. Actualización del Servicio de Base de Datos

**Archivo**: `services/database.service.ts`

Se modificó `courseAssignmentService.getAll()` para que lea tanto `user_id` (del sistema de asistencia) como `profile_id` (del sistema administrativo):

```typescript
profileId: d.user_id || d.profile_id,
```

Esto permite que el sistema lea correctamente las asignaciones creadas por el sistema de asistencia.

### 2. Actualización de la Lógica de Asignaciones

**Archivo**: `components/ProfileManagement.tsx`

Se modificó la lógica de `initialAssignments` para que:

- **Marque solo "Asistencia"** cuando existe un registro en `course_assignments` (creado por el sistema de asistencia)
- **No marque automáticamente "Notas"**, dejando que el administrador lo haga manualmente si es necesario

```typescript
if (hasAttendanceAssignment) {
  return {
    profileId: editingProfile.id,
    classroomId: c.id,
    canAttendance: true,  // Marcado por el sistema de asistencia
    canGrades: false      // No se marca automáticamente
  };
}
```

## Estructura de la Base de Datos

### Tabla: `course_assignments`

Esta tabla es compartida entre ambos sistemas:

```
course_assignments
├── id (uuid, primary key, auto-generado)
├── profile_id (uuid, foreign key → profiles.id)
├── classroom_id (integer, foreign key → classrooms.id)
├── area_id (integer, foreign key → curricular_areas.id, nullable)
├── hours_per_week (integer, nullable)
└── created_at (timestamp)
```

**Nota importante**: 
- La tabla usa `profile_id` (no `user_id` como se pensó inicialmente)
- Tiene `created_at` pero NO tiene `updated_at`
- Los campos `area_id` y `hours_per_week` son opcionales

### Relaciones

- `profile_id` → Referencia a `profiles.id` (el usuario/docente)
- `classroom_id` → Referencia a `classrooms.id` (el salón específico)
- `area_id` → Referencia a `curricular_areas.id` (área curricular, opcional)
- `profiles.id` → Corresponde a `auth.users.id` (mismo usuario en Supabase Auth)

## Flujo de Trabajo

### 1. Sistema de Asistencia → Sistema Administrativo

1. **Sistema de Asistencia** asigna un salón a un docente:
   - Crea un registro en `course_assignments` con `profile_id` y `classroom_id`

2. **Sistema Administrativo** lee las asignaciones:
   - `courseAssignmentService.getAll()` lee todos los registros
   - `ProfileManagement.tsx` muestra el check de "Asistencia" marcado

### 2. Sistema Administrativo → Base de Datos

Cuando un administrador modifica las asignaciones desde el módulo de Personal:

1. **Al hacer clic en "Guardar Asignaciones"**:
   - Se eliminan todas las asignaciones antiguas del usuario en `course_assignments`
   - Se crean nuevos registros **solo para los salones con "Asistencia" marcada**
   - Los registros se crean con `profile_id` y `classroom_id`
   - El check de "Notas" no afecta `course_assignments` (es solo para el sistema administrativo)

2. **Sincronización automática**:
   - Los cambios son visibles inmediatamente en ambos sistemas
   - Si se desmarca "Asistencia", el registro se elimina de `course_assignments`
   - Si se marca "Asistencia", se crea un nuevo registro en `course_assignments`

### 3. Permisos del Administrador

El administrador puede:
- Ver las asignaciones del sistema de asistencia (check "Asistencia" activo)
- Marcar adicionalmente el check de "Notas" si es necesario (solo afecta al sistema administrativo)
- Desmarcar el check de "Asistencia" para remover permisos (elimina el registro de `course_assignments`)
- Agregar nuevas asignaciones que serán visibles en el sistema de asistencia

## Verificación

Para verificar que la sincronización funciona correctamente:

1. Desde el sistema de asistencia, asignar un salón a un docente
2. En el sistema administrativo, ir a **Personal** → **Editar** el docente
3. En la sección "Asignación de Salones", el salón asignado debe aparecer con el check de "Asistencia" marcado

## Notas Importantes

- Los cambios son **bidireccionales**: Si se desmarca "Asistencia" en el sistema administrativo, se eliminará el registro de `course_assignments`
- El check de "Notas" es **independiente** y se gestiona solo desde el sistema administrativo
- Ambos sistemas deben usar el mismo `user_id` (que corresponde a `auth.users.id` de Supabase)
