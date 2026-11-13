-- Run once in the Supabase SQL editor. No secret keys belong in the repository.
begin;
create table public.pp_families (
 id uuid primary key default gen_random_uuid(),
 data jsonb not null,
 revision bigint not null default 0,
 updated_at timestamptz not null default now(),
 constraint valid_family_data check (jsonb_typeof(data->'children')='array' and jsonb_array_length(data->'children') between 1 and 100)
);
create table public.pp_members (
 family_id uuid not null references public.pp_families(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 primary key (family_id,user_id),
 unique(user_id)
);
create table public.pp_invites (
 token uuid primary key default gen_random_uuid(),
 family_id uuid not null references public.pp_families(id) on delete cascade,
 expires_at timestamptz not null default now()+interval '7 days'
);
alter table public.pp_families enable row level security;
alter table public.pp_members enable row level security;
alter table public.pp_invites enable row level security;
revoke all on public.pp_families,public.pp_members,public.pp_invites from anon,authenticated;
grant select on public.pp_families,public.pp_members to authenticated;
create policy own_membership on public.pp_members for select to authenticated using (user_id=(select auth.uid()));
create policy family_read on public.pp_families for select to authenticated using (exists(select 1 from public.pp_members m where m.family_id=id and m.user_id=(select auth.uid())));

create function public.pp_create_family(initial_data jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare family uuid;
begin
 if auth.uid() is null then raise exception 'Connexion requise'; end if;
 if exists(select 1 from public.pp_members where user_id=auth.uid()) then raise exception 'Vous avez déjà un espace familial'; end if;
 if octet_length(initial_data::text)>5000000 then raise exception 'Données trop volumineuses'; end if;
 insert into public.pp_families(data) values(initial_data) returning id into family;
 insert into public.pp_members values(family,auth.uid());
 return family;
end $$;
create function public.pp_invite_family(target_family uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare code uuid;
begin
 if not exists(select 1 from public.pp_members where family_id=target_family and user_id=auth.uid()) then raise exception 'Accès refusé'; end if;
 delete from public.pp_invites where family_id=target_family;
 insert into public.pp_invites(family_id) values(target_family) returning token into code;
 return code;
end $$;
create function public.pp_join_family(invite_token uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare family uuid;
begin
 if auth.uid() is null then raise exception 'Connexion requise'; end if;
 if exists(select 1 from public.pp_members where user_id=auth.uid()) then raise exception 'Vous avez déjà un espace familial'; end if;
 delete from public.pp_invites where token=invite_token and expires_at>now() returning family_id into family;
 if family is null then raise exception 'Code invalide ou expiré'; end if;
 insert into public.pp_members values(family,auth.uid());
 return family;
end $$;
create function public.pp_apply_changes(target_family uuid,operations jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare doc jsonb; op jsonb; kids jsonb; kid jsonb; items jsonb; kid_index int; key_name text; entity text; result jsonb;
begin
 if not exists(select 1 from public.pp_members where family_id=target_family and user_id=auth.uid()) then raise exception 'Accès refusé'; end if;
 if jsonb_typeof(operations)<>'array' or jsonb_array_length(operations)>250 or octet_length(operations::text)>5000000 then raise exception 'Modifications invalides'; end if;
 select data into doc from public.pp_families where id=target_family for update;
 for op in select value from jsonb_array_elements(operations) loop
  entity=op->>'entity';
  if entity='email' then
   select coalesce(jsonb_agg(value),'[]'::jsonb) into items from jsonb_array_elements(coalesce(doc->'recapEmails','[]'::jsonb)) where value<>to_jsonb(op->>'id');
   if not coalesce((op->>'remove')::boolean,false) then items=items||jsonb_build_array(op->>'id'); end if;
   doc=jsonb_set(doc,'{recapEmails}',items); continue;
  end if;
  kids=doc->'children';
  if entity='child' then
   if coalesce((op->>'remove')::boolean,false) then
    select coalesce(jsonb_agg(value),'[]'::jsonb) into kids from jsonb_array_elements(kids) where value->>'id'<>op->>'id';
   elsif not exists(select 1 from jsonb_array_elements(kids) where value->>'id'=op->>'id') then kids=kids||jsonb_build_array(op->'value');
   end if;
   doc=jsonb_set(doc,'{children}',kids); continue;
  end if;
  select (ordinality-1)::int,value into kid_index,kid from jsonb_array_elements(kids) with ordinality where value->>'id'=coalesce(op->>'childId',op->>'id');
  if kid_index is null then continue; end if;
  if entity='profile' then kid=kid||jsonb_build_object('name',op->'value'->'name','birth',op->'value'->'birth');
  elsif entity in ('kpi','entry') then
   key_name=case when entity='kpi' then 'kpis' else 'entries' end;
   select coalesce(jsonb_agg(value),'[]'::jsonb) into items from jsonb_array_elements(kid->key_name) where value->>'id'<>op->>'id';
   if not coalesce((op->>'remove')::boolean,false) then items=items||jsonb_build_array(op->'value'); end if;
   kid=jsonb_set(kid,array[key_name],items);
  else raise exception 'Type de modification invalide'; end if;
  doc=jsonb_set(doc,array['children',kid_index::text],kid);
 end loop;
 if octet_length(doc::text)>5000000 then raise exception 'Espace familial trop volumineux'; end if;
 update public.pp_families set data=doc,revision=revision+1,updated_at=now() where id=target_family returning jsonb_build_object('id',id,'data',data,'revision',revision) into result;
 return result;
end $$;
revoke all on function public.pp_create_family(jsonb),public.pp_invite_family(uuid),public.pp_join_family(uuid),public.pp_apply_changes(uuid,jsonb) from public,anon;
grant execute on function public.pp_create_family(jsonb),public.pp_invite_family(uuid),public.pp_join_family(uuid),public.pp_apply_changes(uuid,jsonb) to authenticated;
alter publication supabase_realtime add table public.pp_families;
commit;
