-- Run this once if your games table was created with the older ROOM-0x format.
alter table public.games
drop constraint if exists room_code_format;

alter table public.games
add constraint room_code_format
check (room_code::text ~* '^ROOM-KZ[A-Z0-9]{4}$');
