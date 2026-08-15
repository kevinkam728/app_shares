-- 1. Asegurar que las políticas RLS permitan insertar el propio perfil
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- 2. Asegurar que las políticas RLS permitan leer el propio perfil
drop policy if exists "Users can select own profile" on public.profiles;
create policy "Users can select own profile" on public.profiles for select using (auth.uid() = id);
