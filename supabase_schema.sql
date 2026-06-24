-- ============================================================
-- GENESES CLINIC — Schéma Supabase
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ── Profiles (liés aux auth.users de Supabase) ──────────────
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nom text not null,
  role text not null check (role in ('professeur','financier','admin','infirmiere')),
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Lecture profil propre" on profiles
  for select using (auth.uid() = id);

create policy "Lecture tous profils (staff)" on profiles
  for select using (
    exists (select 1 from profiles where id = auth.uid())
  );

-- ── Patients ────────────────────────────────────────────────
create table patients (
  id uuid default uuid_generate_v4() primary key,
  nom text not null,
  prenom text not null,
  date_naissance date,
  notes text,
  created_at timestamptz default now()
);

alter table patients enable row level security;
create policy "Staff peut tout faire" on patients
  for all using (exists (select 1 from profiles where id = auth.uid()));

-- ── Prescriptions ────────────────────────────────────────────
create table prescriptions (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references patients(id) on delete cascade not null,
  date date not null default current_date,
  notes text,
  statut text not null default 'brouillon'
    check (statut in ('brouillon','validee','archivee')),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table prescriptions enable row level security;
create policy "Staff peut tout faire" on prescriptions
  for all using (exists (select 1 from profiles where id = auth.uid()));

-- ── Prescription items ───────────────────────────────────────
create table prescription_items (
  id uuid default uuid_generate_v4() primary key,
  prescription_id uuid references prescriptions(id) on delete cascade not null,
  categorie text not null,
  nom text not null,
  nb_seances integer default 1,
  notes text,
  coche boolean default true,
  created_at timestamptz default now()
);

alter table prescription_items enable row level security;
create policy "Staff peut tout faire" on prescription_items
  for all using (exists (select 1 from profiles where id = auth.uid()));

-- ── Offres ───────────────────────────────────────────────────
create table offres (
  id uuid default uuid_generate_v4() primary key,
  prescription_id uuid references prescriptions(id),
  patient_id uuid references patients(id) on delete cascade not null,
  date date not null default current_date,
  validite_jours integer default 30,
  notes text,
  statut text not null default 'brouillon'
    check (statut in ('brouillon','envoyee','acceptee','refusee')),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table offres enable row level security;
-- Infirmière ne peut PAS voir les offres
create policy "Staff non-infirmiere" on offres
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role != 'infirmiere'
    )
  );

-- ── Offre items ──────────────────────────────────────────────
create table offre_items (
  id uuid default uuid_generate_v4() primary key,
  offre_id uuid references offres(id) on delete cascade not null,
  prescription_item_id uuid references prescription_items(id),
  categorie text not null,
  nom text not null,
  nb_seances integer default 1,
  prix_unitaire numeric(10,2) default 0,
  notes text,
  created_at timestamptz default now()
);

alter table offre_items enable row level security;
create policy "Staff non-infirmiere" on offre_items
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role != 'infirmiere'
    )
  );

-- ── Planning items ───────────────────────────────────────────
create table planning_items (
  id uuid default uuid_generate_v4() primary key,
  prescription_id uuid references prescriptions(id),
  prescription_item_id uuid references prescription_items(id),
  patient_id uuid references patients(id) on delete cascade not null,
  date date not null,
  heure_debut time not null,
  heure_fin time,
  nom_prestation text not null,
  categorie text not null default '',
  statut text not null default 'planifie'
    check (statut in ('planifie','confirme','realise','annule')),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table planning_items enable row level security;
create policy "Staff peut tout faire" on planning_items
  for all using (exists (select 1 from profiles where id = auth.uid()));

-- ── Trigger: créer profil auto à l'inscription ───────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, nom, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nom', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'admin')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
