-- Run in Supabase SQL Editor after the migration. All test changes roll back.
begin;
insert into auth.users (id, email, raw_user_meta_data) values
 ('11111111-1111-4111-8111-111111111111', 'parknest-test-a@example.test', '{"name":"Test A"}'),
 ('22222222-2222-4222-8222-222222222222', 'parknest-test-b@example.test', '{"name":"Test B"}');
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
do $$
declare affected integer;
begin
  if (select count(*) from public.profiles) <> 1 then raise exception 'RLS leaked another profile'; end if;
  update public.profiles set name = 'Updated A', phone = '+91 98765 43210' where id = auth.uid();
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Own profile update failed'; end if;
  update public.profiles set name = 'Forbidden' where id = '22222222-2222-4222-8222-222222222222';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Cross-user update succeeded'; end if;
  begin
    update public.profiles set email = 'forbidden@example.test' where id = auth.uid();
    raise exception 'Email update incorrectly allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.profiles where id = auth.uid();
    raise exception 'Delete incorrectly allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
rollback;
