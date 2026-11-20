BEGIN;

LOCK TABLE public.tasks IN ACCESS EXCLUSIVE MODE;

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users (id);

DO $$
BEGIN
    IF to_regrole('authenticated') IS NULL THEN
        RAISE EXCEPTION 'Supabase authenticated role is not available.';
    END IF;

    IF to_regprocedure('auth.uid()') IS NULL THEN
        RAISE EXCEPTION 'Supabase auth.uid() is not available.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.tasks WHERE user_id IS NULL) THEN
        RAISE EXCEPTION
            'Tasks without an owner exist; migration stopped without changing task rows.';
    END IF;
END
$$;

ALTER TABLE public.tasks
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;

DO $$
DECLARE
    identity_sequence REGCLASS;
BEGIN
    identity_sequence := pg_get_serial_sequence('public.tasks', 'id');
    IF identity_sequence IS NOT NULL THEN
        EXECUTE format(
            'GRANT USAGE, SELECT ON SEQUENCE %s TO authenticated',
            identity_sequence
        );
    END IF;
END
$$;

DROP POLICY IF EXISTS tasks_select_own ON public.tasks;
DROP POLICY IF EXISTS tasks_insert_own ON public.tasks;
DROP POLICY IF EXISTS tasks_update_own ON public.tasks;
DROP POLICY IF EXISTS tasks_delete_own ON public.tasks;

CREATE POLICY tasks_select_own ON public.tasks
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY tasks_insert_own ON public.tasks
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY tasks_update_own ON public.tasks
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY tasks_delete_own ON public.tasks
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

COMMIT;
