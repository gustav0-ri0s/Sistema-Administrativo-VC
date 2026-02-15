
-- Script to restructure curricular areas and competencies as requested

-- 1. Ensure 'Competencias Transversales' area exists
-- We insert it for 'primaria' and 'secundaria' if they exist in your structure, 
-- or just once if your 'curricular_areas' table doesn't strictly enforce level separation for this name.
-- Assuming we want it to be available generally.

-- Insert for Primaria if not exists
INSERT INTO curricular_areas (name, "order", level)
SELECT 'Competencias Transversales', 100, 'primaria'
WHERE NOT EXISTS (
    SELECT 1 FROM curricular_areas 
    WHERE name = 'Competencias Transversales' AND level = 'primaria'
);

-- Insert for Secundaria if not exists
INSERT INTO curricular_areas (name, "order", level)
SELECT 'Competencias Transversales', 100, 'secundaria'
WHERE NOT EXISTS (
    SELECT 1 FROM curricular_areas 
    WHERE name = 'Competencias Transversales' AND level = 'secundaria'
);

-- If unique constraint is just on name (unlikely for multi-level systems), use simpler INSERT.
-- If conflict, ignore.

-- 2. Move competencies
-- We need to handle this carefully. If competencies are shared (no level column), we just update area_id.
-- If competencies have level, we match level. Usually competencies are associated with area_id.

-- Safe bet if competencies are unique by name:
UPDATE competencies
SET area_id = (SELECT id FROM curricular_areas WHERE name = 'Competencias Transversales' AND level = 'primaria' LIMIT 1)
WHERE name ILIKE '%Gestiona su aprendizaje de manera autónoma%' AND area_id IN (SELECT id FROM curricular_areas WHERE level = 'primaria');

UPDATE competencies
SET area_id = (SELECT id FROM curricular_areas WHERE name = 'Competencias Transversales' AND level = 'secundaria' LIMIT 1)
WHERE name ILIKE '%Gestiona su aprendizaje de manera autónoma%' AND area_id IN (SELECT id FROM curricular_areas WHERE level = 'secundaria');

-- Same for TIC competency
UPDATE competencies
SET area_id = (SELECT id FROM curricular_areas WHERE name = 'Competencias Transversales' AND level = 'primaria' LIMIT 1)
WHERE name ILIKE '%Se desenvuelve en entornos virtuales%' AND area_id IN (SELECT id FROM curricular_areas WHERE level = 'primaria');

UPDATE competencies
SET area_id = (SELECT id FROM curricular_areas WHERE name = 'Competencias Transversales' AND level = 'secundaria' LIMIT 1)
WHERE name ILIKE '%Se desenvuelve en entornos virtuales%' AND area_id IN (SELECT id FROM curricular_areas WHERE level = 'secundaria');

-- 4. Cleanup: Force delete 'Competencia Transversal TIC'
-- First, remove any course assignments linked to this old area to avoid Foreign Key errors
DELETE FROM course_assignments
WHERE area_id IN (SELECT id FROM curricular_areas WHERE name ILIKE '%Competencia Transversal TIC%');

-- Now delete the area itself
DELETE FROM curricular_areas
WHERE name ILIKE '%Competencia Transversal TIC%';

-- 5. Cleanup: Delete 'Tutoría' if it was ONLY holding that competency (unlikely, usually Tutoría has others or is a placeholder)
-- But user only asked to move the competency, not delete Tutoría.
