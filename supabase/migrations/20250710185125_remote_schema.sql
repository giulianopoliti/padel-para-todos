create type "public"."GENDER" as enum ('MALE', 'SHEMALE', 'MIXED');

create type "public"."PREFERRED_SIDE" as enum ('DRIVE', 'REVES');

create type "public"."ROLE" as enum ('PLAYER', 'COACH', 'CLUB');

create type "public"."ROUND" as enum ('ZONE', '32VOS', '16VOS', '8VOS', '4TOS', 'SEMIFINAL', 'FINAL');

create type "public"."status_tournament" as enum ('NOT_STARTED', 'IN_PROGRESS', 'FINISHED', 'PAIRING', 'CANCELED');

create type "public"."tournament_type" as enum ('LONG', 'AMERICAN');

create table "public"."categories" (
    "name" text not null,
    "lower_range" integer not null,
    "upper_range" integer
);


create table "public"."clubes" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text,
    "address" text,
    "user_id" uuid,
    "instagram" text,
    "score_reviews" numeric,
    "courts" smallint,
    "opens_at" time without time zone,
    "closes_at" time without time zone,
    "cover_image_url" text,
    "gallery_images" jsonb default '[]'::jsonb,
    "phone" text,
    "email" text,
    "website" text,
    "description" text,
    "is_active" boolean not null default false,
    "phone2" text
);


create table "public"."coach_inquiries" (
    "id" uuid not null default gen_random_uuid(),
    "name" character varying(255),
    "phone" character varying(50) not null,
    "email" character varying(255),
    "interest" text,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP
);


create table "public"."coaches" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text,
    "last_name" text,
    "player_id" uuid default gen_random_uuid(),
    "user_id" uuid
);


create table "public"."couples" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "player1_id" uuid default gen_random_uuid(),
    "player2_id" uuid default gen_random_uuid(),
    "es_prueba" boolean default false
);


create table "public"."dni_conflicts" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone default now(),
    "dni" text not null,
    "existing_player_id" uuid not null,
    "new_player_id" uuid,
    "new_user_id" uuid,
    "status" text default 'pending'::text,
    "admin_notes" text,
    "resolved_at" timestamp with time zone,
    "resolved_by" uuid,
    "phone" text
);


create table "public"."inscriptions" (
    "id" uuid not null default gen_random_uuid(),
    "player_id" uuid not null,
    "tournament_id" uuid not null,
    "couple_id" uuid,
    "created_at" timestamp without time zone default now(),
    "is_pending" boolean default false,
    "phone" text,
    "es_prueba" boolean default false
);


create table "public"."matches" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "couple1_id" uuid default gen_random_uuid(),
    "couple2_id" uuid default gen_random_uuid(),
    "result_couple1" text,
    "result_couple2" text,
    "tournament_id" uuid,
    "winner_id" uuid,
    "round" "ROUND",
    "zone_id" uuid,
    "status" text default 'PENDING'::text,
    "order" smallint,
    "image_url" text,
    "es_prueba" boolean default false,
    "type" text default 'ZONE'::text
);


create table "public"."player_tournament_history" (
    "id" uuid not null default gen_random_uuid(),
    "player_id" uuid not null,
    "tournament_id" uuid not null,
    "points_before" integer not null default 0,
    "points_after" integer not null default 0,
    "points_earned" integer not null default 0,
    "rank_before" integer,
    "rank_after" integer,
    "rank_change" integer,
    "created_at" timestamp with time zone default now(),
    "es_prueba" boolean default false
);


create table "public"."players" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "first_name" text,
    "last_name" text,
    "score" numeric,
    "category_name" text,
    "club_id" uuid,
    "dni" text,
    "preferred_hand" text,
    "racket" text,
    "gender" "GENDER",
    "preferred_side" "PREFERRED_SIDE",
    "user_id" uuid,
    "phone" text,
    "date_of_birth" date,
    "profile_image_url" text,
    "instagram_handle" text,
    "address" text,
    "status" text default 'active'::text,
    "gallery_images" jsonb default '[]'::jsonb,
    "is_categorized" boolean default false,
    "description" text,
    "es_prueba" boolean default false
);


create table "public"."ranking_snapshots" (
    "id" uuid not null default gen_random_uuid(),
    "player_id" uuid not null,
    "rank_position" integer not null,
    "score" integer not null default 0,
    "week_start_date" date not null,
    "tournament_id" uuid,
    "snapshot_type" text default 'weekly'::text,
    "created_at" timestamp with time zone default now(),
    "es_prueba" boolean default false
);


create table "public"."reviews" (
    "player_id" uuid not null,
    "club_id" uuid not null default gen_random_uuid(),
    "score" numeric,
    "review_description" text
);


alter table "public"."reviews" enable row level security;

create table "public"."services" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null
);


create table "public"."services_clubes" (
    "service_id" uuid not null,
    "club_id" uuid not null
);


create table "public"."tournament_couple_seeds" (
    "tournament_id" uuid not null default gen_random_uuid(),
    "couple_id" uuid not null default gen_random_uuid(),
    "seed" smallint not null,
    "zone_id" uuid not null default gen_random_uuid(),
    "es_prueba" boolean default false
);


create table "public"."tournaments" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "club_id" uuid default gen_random_uuid(),
    "category_name" text,
    "type" tournament_type,
    "gender" "GENDER" default 'MALE'::"GENDER",
    "status" status_tournament default 'NOT_STARTED'::status_tournament,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "description" text,
    "max_participants" smallint,
    "name" text,
    "winner_id" uuid,
    "price" smallint,
    "winner_image_url" text,
    "pre_tournament_image_url" text,
    "es_prueba" boolean default false
);


create table "public"."users" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "email" text,
    "role" "ROLE",
    "avatar_url" text
);


create table "public"."zone_couples" (
    "created_at" timestamp with time zone not null default now(),
    "zone_id" uuid not null default gen_random_uuid(),
    "couple_id" uuid not null default gen_random_uuid(),
    "es_prueba" boolean default false
);


create table "public"."zones" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "tournament_id" uuid default gen_random_uuid(),
    "name" text,
    "es_prueba" boolean default false
);


CREATE UNIQUE INDEX category_pkey ON public.categories USING btree (name);

CREATE UNIQUE INDEX clubes_pkey ON public.clubes USING btree (id);

CREATE UNIQUE INDEX clubes_user_id_unique ON public.clubes USING btree (user_id);

CREATE UNIQUE INDEX coach_inquiries_pkey ON public.coach_inquiries USING btree (id);

CREATE UNIQUE INDEX coachs_pkey ON public.coaches USING btree (id);

CREATE UNIQUE INDEX couples_pkey ON public.couples USING btree (id);

CREATE UNIQUE INDEX dni_conflicts_pkey ON public.dni_conflicts USING btree (id);

CREATE INDEX idx_coach_inquiries_created_at ON public.coach_inquiries USING btree (created_at DESC);

CREATE INDEX idx_coach_inquiries_phone ON public.coach_inquiries USING btree (phone);

CREATE INDEX idx_couples_es_prueba ON public.couples USING btree (es_prueba);

CREATE INDEX idx_dni_conflicts_dni ON public.dni_conflicts USING btree (dni);

CREATE INDEX idx_dni_conflicts_status ON public.dni_conflicts USING btree (status);

CREATE INDEX idx_inscriptions_es_prueba ON public.inscriptions USING btree (es_prueba);

CREATE INDEX idx_inscriptions_tournament_player_optimized ON public.inscriptions USING btree (tournament_id, player_id);

CREATE INDEX idx_matches_es_prueba ON public.matches USING btree (es_prueba);

CREATE INDEX idx_matches_tournament_status_optimized ON public.matches USING btree (tournament_id, status) WHERE (status IS NOT NULL);

CREATE INDEX idx_player_tournament_history_es_prueba ON public.player_tournament_history USING btree (es_prueba);

CREATE INDEX idx_player_tournament_history_player ON public.player_tournament_history USING btree (player_id);

CREATE INDEX idx_player_tournament_history_player_prueba ON public.player_tournament_history USING btree (player_id, es_prueba);

CREATE INDEX idx_player_tournament_history_tournament ON public.player_tournament_history USING btree (tournament_id);

CREATE INDEX idx_players_category_score ON public.players USING btree (category_name, score DESC NULLS LAST);

CREATE INDEX idx_players_club_score ON public.players USING btree (club_id, score DESC NULLS LAST);

CREATE INDEX idx_players_es_prueba ON public.players USING btree (es_prueba);

CREATE INDEX idx_players_score ON public.players USING btree (score DESC NULLS LAST);

CREATE INDEX idx_players_user_gender_optimized ON public.players USING btree (user_id, gender) WHERE (gender IS NOT NULL);

CREATE INDEX idx_ranking_snapshots_es_prueba ON public.ranking_snapshots USING btree (es_prueba);

CREATE INDEX idx_ranking_snapshots_player_prueba ON public.ranking_snapshots USING btree (player_id, es_prueba);

CREATE INDEX idx_ranking_snapshots_player_week ON public.ranking_snapshots USING btree (player_id, week_start_date);

CREATE INDEX idx_ranking_snapshots_week ON public.ranking_snapshots USING btree (week_start_date);

CREATE INDEX idx_tournament_couple_seeds_es_prueba ON public.tournament_couple_seeds USING btree (es_prueba);

CREATE INDEX idx_tournament_couple_seeds_tournament_prueba ON public.tournament_couple_seeds USING btree (tournament_id, es_prueba);

CREATE INDEX idx_tournaments_es_prueba ON public.tournaments USING btree (es_prueba);

CREATE INDEX idx_tournaments_status_date_optimized ON public.tournaments USING btree (status, start_date) WHERE ((status IS NOT NULL) AND (start_date IS NOT NULL));

CREATE INDEX idx_users_role_optimized ON public.users USING btree (role) WHERE (role IS NOT NULL);

CREATE INDEX idx_zone_couples_es_prueba ON public.zone_couples USING btree (es_prueba);

CREATE INDEX idx_zone_couples_zone_prueba ON public.zone_couples USING btree (zone_id, es_prueba);

CREATE INDEX idx_zones_es_prueba ON public.zones USING btree (es_prueba);

CREATE UNIQUE INDEX inscriptions_pkey ON public.inscriptions USING btree (id);

CREATE UNIQUE INDEX matchs_pkey ON public.matches USING btree (id);

CREATE UNIQUE INDEX player_tournament_history_pkey ON public.player_tournament_history USING btree (id);

CREATE UNIQUE INDEX player_tournament_history_player_id_tournament_id_key ON public.player_tournament_history USING btree (player_id, tournament_id);

CREATE UNIQUE INDEX players_pkey ON public.players USING btree (id);

CREATE UNIQUE INDEX players_user_id_unique ON public.players USING btree (user_id);

CREATE UNIQUE INDEX ranking_snapshots_pkey ON public.ranking_snapshots USING btree (id);

CREATE UNIQUE INDEX ranking_snapshots_player_id_week_start_date_snapshot_type_key ON public.ranking_snapshots USING btree (player_id, week_start_date, snapshot_type);

CREATE UNIQUE INDEX services_clubes_pkey ON public.services_clubes USING btree (service_id, club_id);

CREATE UNIQUE INDEX services_pkey ON public.services USING btree (id);

CREATE UNIQUE INDEX tournament_couple_seeds_pkey ON public.tournament_couple_seeds USING btree (tournament_id, couple_id);

CREATE UNIQUE INDEX tournament_couple_seeds_tournament_id_seed_unique ON public.tournament_couple_seeds USING btree (tournament_id, seed);

CREATE UNIQUE INDEX tournament_pkey ON public.tournaments USING btree (id);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

CREATE UNIQUE INDEX zone_couples_pkey ON public.zone_couples USING btree (zone_id, couple_id);

CREATE UNIQUE INDEX zones_pkey ON public.zones USING btree (id);

alter table "public"."categories" add constraint "category_pkey" PRIMARY KEY using index "category_pkey";

alter table "public"."clubes" add constraint "clubes_pkey" PRIMARY KEY using index "clubes_pkey";

alter table "public"."coach_inquiries" add constraint "coach_inquiries_pkey" PRIMARY KEY using index "coach_inquiries_pkey";

alter table "public"."coaches" add constraint "coachs_pkey" PRIMARY KEY using index "coachs_pkey";

alter table "public"."couples" add constraint "couples_pkey" PRIMARY KEY using index "couples_pkey";

alter table "public"."dni_conflicts" add constraint "dni_conflicts_pkey" PRIMARY KEY using index "dni_conflicts_pkey";

alter table "public"."inscriptions" add constraint "inscriptions_pkey" PRIMARY KEY using index "inscriptions_pkey";

alter table "public"."matches" add constraint "matchs_pkey" PRIMARY KEY using index "matchs_pkey";

alter table "public"."player_tournament_history" add constraint "player_tournament_history_pkey" PRIMARY KEY using index "player_tournament_history_pkey";

alter table "public"."players" add constraint "players_pkey" PRIMARY KEY using index "players_pkey";

alter table "public"."ranking_snapshots" add constraint "ranking_snapshots_pkey" PRIMARY KEY using index "ranking_snapshots_pkey";

alter table "public"."services" add constraint "services_pkey" PRIMARY KEY using index "services_pkey";

alter table "public"."services_clubes" add constraint "services_clubes_pkey" PRIMARY KEY using index "services_clubes_pkey";

alter table "public"."tournament_couple_seeds" add constraint "tournament_couple_seeds_pkey" PRIMARY KEY using index "tournament_couple_seeds_pkey";

alter table "public"."tournaments" add constraint "tournament_pkey" PRIMARY KEY using index "tournament_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."zone_couples" add constraint "zone_couples_pkey" PRIMARY KEY using index "zone_couples_pkey";

alter table "public"."zones" add constraint "zones_pkey" PRIMARY KEY using index "zones_pkey";

alter table "public"."clubes" add constraint "clubes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE not valid;

alter table "public"."clubes" validate constraint "clubes_user_id_fkey";

alter table "public"."clubes" add constraint "clubes_user_id_unique" UNIQUE using index "clubes_user_id_unique";

alter table "public"."coaches" add constraint "coaches_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE not valid;

alter table "public"."coaches" validate constraint "coaches_user_id_fkey";

alter table "public"."coaches" add constraint "coachs_player_id_fkey" FOREIGN KEY (player_id) REFERENCES players(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."coaches" validate constraint "coachs_player_id_fkey";

alter table "public"."couples" add constraint "couples_player1_id_fkey" FOREIGN KEY (player1_id) REFERENCES players(id) ON UPDATE CASCADE not valid;

alter table "public"."couples" validate constraint "couples_player1_id_fkey";

alter table "public"."couples" add constraint "couples_player2_id_fkey" FOREIGN KEY (player2_id) REFERENCES players(id) ON UPDATE CASCADE not valid;

alter table "public"."couples" validate constraint "couples_player2_id_fkey";

alter table "public"."dni_conflicts" add constraint "dni_conflicts_existing_player_id_fkey" FOREIGN KEY (existing_player_id) REFERENCES players(id) not valid;

alter table "public"."dni_conflicts" validate constraint "dni_conflicts_existing_player_id_fkey";

alter table "public"."dni_conflicts" add constraint "dni_conflicts_new_player_id_fkey" FOREIGN KEY (new_player_id) REFERENCES players(id) not valid;

alter table "public"."dni_conflicts" validate constraint "dni_conflicts_new_player_id_fkey";

alter table "public"."dni_conflicts" add constraint "dni_conflicts_new_user_id_fkey" FOREIGN KEY (new_user_id) REFERENCES users(id) not valid;

alter table "public"."dni_conflicts" validate constraint "dni_conflicts_new_user_id_fkey";

alter table "public"."dni_conflicts" add constraint "dni_conflicts_resolved_by_fkey" FOREIGN KEY (resolved_by) REFERENCES users(id) not valid;

alter table "public"."dni_conflicts" validate constraint "dni_conflicts_resolved_by_fkey";

alter table "public"."dni_conflicts" add constraint "dni_conflicts_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'resolved'::text, 'dismissed'::text]))) not valid;

alter table "public"."dni_conflicts" validate constraint "dni_conflicts_status_check";

alter table "public"."inscriptions" add constraint "inscriptions_couple_id_fkey" FOREIGN KEY (couple_id) REFERENCES couples(id) not valid;

alter table "public"."inscriptions" validate constraint "inscriptions_couple_id_fkey";

alter table "public"."inscriptions" add constraint "inscriptions_player_id_fkey" FOREIGN KEY (player_id) REFERENCES players(id) not valid;

alter table "public"."inscriptions" validate constraint "inscriptions_player_id_fkey";

alter table "public"."inscriptions" add constraint "inscriptions_tournament_id_fkey" FOREIGN KEY (tournament_id) REFERENCES tournaments(id) not valid;

alter table "public"."inscriptions" validate constraint "inscriptions_tournament_id_fkey";

alter table "public"."matches" add constraint "matches_couple1_id_fkey" FOREIGN KEY (couple1_id) REFERENCES couples(id) ON UPDATE CASCADE not valid;

alter table "public"."matches" validate constraint "matches_couple1_id_fkey";

alter table "public"."matches" add constraint "matches_couple2_id_fkey" FOREIGN KEY (couple2_id) REFERENCES couples(id) ON UPDATE CASCADE not valid;

alter table "public"."matches" validate constraint "matches_couple2_id_fkey";

alter table "public"."matches" add constraint "matches_tournament_id_fkey" FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."matches" validate constraint "matches_tournament_id_fkey";

alter table "public"."matches" add constraint "matches_type_check" CHECK ((type = ANY (ARRAY['ZONE'::text, 'ELIMINATION'::text]))) not valid;

alter table "public"."matches" validate constraint "matches_type_check";

alter table "public"."matches" add constraint "matches_winner_id_fkey" FOREIGN KEY (winner_id) REFERENCES couples(id) not valid;

alter table "public"."matches" validate constraint "matches_winner_id_fkey";

alter table "public"."matches" add constraint "matches_zone_id_fkey" FOREIGN KEY (zone_id) REFERENCES zones(id) ON UPDATE CASCADE not valid;

alter table "public"."matches" validate constraint "matches_zone_id_fkey";

alter table "public"."player_tournament_history" add constraint "player_tournament_history_player_id_fkey" FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE not valid;

alter table "public"."player_tournament_history" validate constraint "player_tournament_history_player_id_fkey";

alter table "public"."player_tournament_history" add constraint "player_tournament_history_player_id_tournament_id_key" UNIQUE using index "player_tournament_history_player_id_tournament_id_key";

alter table "public"."player_tournament_history" add constraint "player_tournament_history_tournament_id_fkey" FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE not valid;

alter table "public"."player_tournament_history" validate constraint "player_tournament_history_tournament_id_fkey";

alter table "public"."players" add constraint "players_category_name_fkey" FOREIGN KEY (category_name) REFERENCES categories(name) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."players" validate constraint "players_category_name_fkey";

alter table "public"."players" add constraint "players_club_id_fkey" FOREIGN KEY (club_id) REFERENCES clubes(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."players" validate constraint "players_club_id_fkey";

alter table "public"."players" add constraint "players_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text]))) not valid;

alter table "public"."players" validate constraint "players_status_check";

alter table "public"."players" add constraint "players_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE not valid;

alter table "public"."players" validate constraint "players_user_id_fkey";

alter table "public"."players" add constraint "players_user_id_unique" UNIQUE using index "players_user_id_unique";

alter table "public"."ranking_snapshots" add constraint "ranking_snapshots_player_id_fkey" FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE not valid;

alter table "public"."ranking_snapshots" validate constraint "ranking_snapshots_player_id_fkey";

alter table "public"."ranking_snapshots" add constraint "ranking_snapshots_player_id_week_start_date_snapshot_type_key" UNIQUE using index "ranking_snapshots_player_id_week_start_date_snapshot_type_key";

alter table "public"."ranking_snapshots" add constraint "ranking_snapshots_snapshot_type_check" CHECK ((snapshot_type = ANY (ARRAY['weekly'::text, 'tournament_end'::text]))) not valid;

alter table "public"."ranking_snapshots" validate constraint "ranking_snapshots_snapshot_type_check";

alter table "public"."ranking_snapshots" add constraint "ranking_snapshots_tournament_id_fkey" FOREIGN KEY (tournament_id) REFERENCES tournaments(id) not valid;

alter table "public"."ranking_snapshots" validate constraint "ranking_snapshots_tournament_id_fkey";

alter table "public"."reviews" add constraint "reviews_club_id_fkey" FOREIGN KEY (club_id) REFERENCES clubes(id) ON UPDATE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_club_id_fkey";

alter table "public"."reviews" add constraint "reviews_player_id_fkey" FOREIGN KEY (player_id) REFERENCES players(id) ON UPDATE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_player_id_fkey";

alter table "public"."services_clubes" add constraint "services_clubes_club_id_fkey" FOREIGN KEY (club_id) REFERENCES clubes(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."services_clubes" validate constraint "services_clubes_club_id_fkey";

alter table "public"."services_clubes" add constraint "services_clubes_service_id_fkey" FOREIGN KEY (service_id) REFERENCES services(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."services_clubes" validate constraint "services_clubes_service_id_fkey";

alter table "public"."tournament_couple_seeds" add constraint "fk_tournament_couple_seeds_couple_id" FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE not valid;

alter table "public"."tournament_couple_seeds" validate constraint "fk_tournament_couple_seeds_couple_id";

alter table "public"."tournament_couple_seeds" add constraint "tournament_couple_seeds_tournament_id_seed_unique" UNIQUE using index "tournament_couple_seeds_tournament_id_seed_unique";

alter table "public"."tournaments" add constraint "tournaments_category_name_fkey" FOREIGN KEY (category_name) REFERENCES categories(name) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."tournaments" validate constraint "tournaments_category_name_fkey";

alter table "public"."tournaments" add constraint "tournaments_club_id_fkey" FOREIGN KEY (club_id) REFERENCES clubes(id) ON UPDATE CASCADE not valid;

alter table "public"."tournaments" validate constraint "tournaments_club_id_fkey";

alter table "public"."tournaments" add constraint "tournaments_price_check" CHECK ((price >= 0)) not valid;

alter table "public"."tournaments" validate constraint "tournaments_price_check";

alter table "public"."tournaments" add constraint "tournaments_winner_id_fkey" FOREIGN KEY (winner_id) REFERENCES couples(id) ON UPDATE CASCADE not valid;

alter table "public"."tournaments" validate constraint "tournaments_winner_id_fkey";

alter table "public"."users" add constraint "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_id_fkey";

alter table "public"."zone_couples" add constraint "zone_couples_couple_id_fkey" FOREIGN KEY (couple_id) REFERENCES couples(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."zone_couples" validate constraint "zone_couples_couple_id_fkey";

alter table "public"."zone_couples" add constraint "zone_couples_zone_id_fkey" FOREIGN KEY (zone_id) REFERENCES zones(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."zone_couples" validate constraint "zone_couples_zone_id_fkey";

alter table "public"."zones" add constraint "zones_tournament_id_fkey" FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON UPDATE CASCADE not valid;

alter table "public"."zones" validate constraint "zones_tournament_id_fkey";

grant delete on table "public"."categories" to "anon";

grant insert on table "public"."categories" to "anon";

grant references on table "public"."categories" to "anon";

grant select on table "public"."categories" to "anon";

grant trigger on table "public"."categories" to "anon";

grant truncate on table "public"."categories" to "anon";

grant update on table "public"."categories" to "anon";

grant delete on table "public"."categories" to "authenticated";

grant insert on table "public"."categories" to "authenticated";

grant references on table "public"."categories" to "authenticated";

grant select on table "public"."categories" to "authenticated";

grant trigger on table "public"."categories" to "authenticated";

grant truncate on table "public"."categories" to "authenticated";

grant update on table "public"."categories" to "authenticated";

grant delete on table "public"."categories" to "service_role";

grant insert on table "public"."categories" to "service_role";

grant references on table "public"."categories" to "service_role";

grant select on table "public"."categories" to "service_role";

grant trigger on table "public"."categories" to "service_role";

grant truncate on table "public"."categories" to "service_role";

grant update on table "public"."categories" to "service_role";

grant delete on table "public"."clubes" to "anon";

grant insert on table "public"."clubes" to "anon";

grant references on table "public"."clubes" to "anon";

grant select on table "public"."clubes" to "anon";

grant trigger on table "public"."clubes" to "anon";

grant truncate on table "public"."clubes" to "anon";

grant update on table "public"."clubes" to "anon";

grant delete on table "public"."clubes" to "authenticated";

grant insert on table "public"."clubes" to "authenticated";

grant references on table "public"."clubes" to "authenticated";

grant select on table "public"."clubes" to "authenticated";

grant trigger on table "public"."clubes" to "authenticated";

grant truncate on table "public"."clubes" to "authenticated";

grant update on table "public"."clubes" to "authenticated";

grant delete on table "public"."clubes" to "service_role";

grant insert on table "public"."clubes" to "service_role";

grant references on table "public"."clubes" to "service_role";

grant select on table "public"."clubes" to "service_role";

grant trigger on table "public"."clubes" to "service_role";

grant truncate on table "public"."clubes" to "service_role";

grant update on table "public"."clubes" to "service_role";

grant delete on table "public"."coach_inquiries" to "anon";

grant insert on table "public"."coach_inquiries" to "anon";

grant references on table "public"."coach_inquiries" to "anon";

grant select on table "public"."coach_inquiries" to "anon";

grant trigger on table "public"."coach_inquiries" to "anon";

grant truncate on table "public"."coach_inquiries" to "anon";

grant update on table "public"."coach_inquiries" to "anon";

grant delete on table "public"."coach_inquiries" to "authenticated";

grant insert on table "public"."coach_inquiries" to "authenticated";

grant references on table "public"."coach_inquiries" to "authenticated";

grant select on table "public"."coach_inquiries" to "authenticated";

grant trigger on table "public"."coach_inquiries" to "authenticated";

grant truncate on table "public"."coach_inquiries" to "authenticated";

grant update on table "public"."coach_inquiries" to "authenticated";

grant delete on table "public"."coach_inquiries" to "service_role";

grant insert on table "public"."coach_inquiries" to "service_role";

grant references on table "public"."coach_inquiries" to "service_role";

grant select on table "public"."coach_inquiries" to "service_role";

grant trigger on table "public"."coach_inquiries" to "service_role";

grant truncate on table "public"."coach_inquiries" to "service_role";

grant update on table "public"."coach_inquiries" to "service_role";

grant delete on table "public"."coaches" to "anon";

grant insert on table "public"."coaches" to "anon";

grant references on table "public"."coaches" to "anon";

grant select on table "public"."coaches" to "anon";

grant trigger on table "public"."coaches" to "anon";

grant truncate on table "public"."coaches" to "anon";

grant update on table "public"."coaches" to "anon";

grant delete on table "public"."coaches" to "authenticated";

grant insert on table "public"."coaches" to "authenticated";

grant references on table "public"."coaches" to "authenticated";

grant select on table "public"."coaches" to "authenticated";

grant trigger on table "public"."coaches" to "authenticated";

grant truncate on table "public"."coaches" to "authenticated";

grant update on table "public"."coaches" to "authenticated";

grant delete on table "public"."coaches" to "service_role";

grant insert on table "public"."coaches" to "service_role";

grant references on table "public"."coaches" to "service_role";

grant select on table "public"."coaches" to "service_role";

grant trigger on table "public"."coaches" to "service_role";

grant truncate on table "public"."coaches" to "service_role";

grant update on table "public"."coaches" to "service_role";

grant delete on table "public"."couples" to "anon";

grant insert on table "public"."couples" to "anon";

grant references on table "public"."couples" to "anon";

grant select on table "public"."couples" to "anon";

grant trigger on table "public"."couples" to "anon";

grant truncate on table "public"."couples" to "anon";

grant update on table "public"."couples" to "anon";

grant delete on table "public"."couples" to "authenticated";

grant insert on table "public"."couples" to "authenticated";

grant references on table "public"."couples" to "authenticated";

grant select on table "public"."couples" to "authenticated";

grant trigger on table "public"."couples" to "authenticated";

grant truncate on table "public"."couples" to "authenticated";

grant update on table "public"."couples" to "authenticated";

grant delete on table "public"."couples" to "service_role";

grant insert on table "public"."couples" to "service_role";

grant references on table "public"."couples" to "service_role";

grant select on table "public"."couples" to "service_role";

grant trigger on table "public"."couples" to "service_role";

grant truncate on table "public"."couples" to "service_role";

grant update on table "public"."couples" to "service_role";

grant delete on table "public"."dni_conflicts" to "anon";

grant insert on table "public"."dni_conflicts" to "anon";

grant references on table "public"."dni_conflicts" to "anon";

grant select on table "public"."dni_conflicts" to "anon";

grant trigger on table "public"."dni_conflicts" to "anon";

grant truncate on table "public"."dni_conflicts" to "anon";

grant update on table "public"."dni_conflicts" to "anon";

grant delete on table "public"."dni_conflicts" to "authenticated";

grant insert on table "public"."dni_conflicts" to "authenticated";

grant references on table "public"."dni_conflicts" to "authenticated";

grant select on table "public"."dni_conflicts" to "authenticated";

grant trigger on table "public"."dni_conflicts" to "authenticated";

grant truncate on table "public"."dni_conflicts" to "authenticated";

grant update on table "public"."dni_conflicts" to "authenticated";

grant delete on table "public"."dni_conflicts" to "service_role";

grant insert on table "public"."dni_conflicts" to "service_role";

grant references on table "public"."dni_conflicts" to "service_role";

grant select on table "public"."dni_conflicts" to "service_role";

grant trigger on table "public"."dni_conflicts" to "service_role";

grant truncate on table "public"."dni_conflicts" to "service_role";

grant update on table "public"."dni_conflicts" to "service_role";

grant delete on table "public"."inscriptions" to "anon";

grant insert on table "public"."inscriptions" to "anon";

grant references on table "public"."inscriptions" to "anon";

grant select on table "public"."inscriptions" to "anon";

grant trigger on table "public"."inscriptions" to "anon";

grant truncate on table "public"."inscriptions" to "anon";

grant update on table "public"."inscriptions" to "anon";

grant delete on table "public"."inscriptions" to "authenticated";

grant insert on table "public"."inscriptions" to "authenticated";

grant references on table "public"."inscriptions" to "authenticated";

grant select on table "public"."inscriptions" to "authenticated";

grant trigger on table "public"."inscriptions" to "authenticated";

grant truncate on table "public"."inscriptions" to "authenticated";

grant update on table "public"."inscriptions" to "authenticated";

grant delete on table "public"."inscriptions" to "service_role";

grant insert on table "public"."inscriptions" to "service_role";

grant references on table "public"."inscriptions" to "service_role";

grant select on table "public"."inscriptions" to "service_role";

grant trigger on table "public"."inscriptions" to "service_role";

grant truncate on table "public"."inscriptions" to "service_role";

grant update on table "public"."inscriptions" to "service_role";

grant delete on table "public"."matches" to "anon";

grant insert on table "public"."matches" to "anon";

grant references on table "public"."matches" to "anon";

grant select on table "public"."matches" to "anon";

grant trigger on table "public"."matches" to "anon";

grant truncate on table "public"."matches" to "anon";

grant update on table "public"."matches" to "anon";

grant delete on table "public"."matches" to "authenticated";

grant insert on table "public"."matches" to "authenticated";

grant references on table "public"."matches" to "authenticated";

grant select on table "public"."matches" to "authenticated";

grant trigger on table "public"."matches" to "authenticated";

grant truncate on table "public"."matches" to "authenticated";

grant update on table "public"."matches" to "authenticated";

grant delete on table "public"."matches" to "service_role";

grant insert on table "public"."matches" to "service_role";

grant references on table "public"."matches" to "service_role";

grant select on table "public"."matches" to "service_role";

grant trigger on table "public"."matches" to "service_role";

grant truncate on table "public"."matches" to "service_role";

grant update on table "public"."matches" to "service_role";

grant delete on table "public"."player_tournament_history" to "anon";

grant insert on table "public"."player_tournament_history" to "anon";

grant references on table "public"."player_tournament_history" to "anon";

grant select on table "public"."player_tournament_history" to "anon";

grant trigger on table "public"."player_tournament_history" to "anon";

grant truncate on table "public"."player_tournament_history" to "anon";

grant update on table "public"."player_tournament_history" to "anon";

grant delete on table "public"."player_tournament_history" to "authenticated";

grant insert on table "public"."player_tournament_history" to "authenticated";

grant references on table "public"."player_tournament_history" to "authenticated";

grant select on table "public"."player_tournament_history" to "authenticated";

grant trigger on table "public"."player_tournament_history" to "authenticated";

grant truncate on table "public"."player_tournament_history" to "authenticated";

grant update on table "public"."player_tournament_history" to "authenticated";

grant delete on table "public"."player_tournament_history" to "service_role";

grant insert on table "public"."player_tournament_history" to "service_role";

grant references on table "public"."player_tournament_history" to "service_role";

grant select on table "public"."player_tournament_history" to "service_role";

grant trigger on table "public"."player_tournament_history" to "service_role";

grant truncate on table "public"."player_tournament_history" to "service_role";

grant update on table "public"."player_tournament_history" to "service_role";

grant delete on table "public"."players" to "anon";

grant insert on table "public"."players" to "anon";

grant references on table "public"."players" to "anon";

grant select on table "public"."players" to "anon";

grant trigger on table "public"."players" to "anon";

grant truncate on table "public"."players" to "anon";

grant update on table "public"."players" to "anon";

grant delete on table "public"."players" to "authenticated";

grant insert on table "public"."players" to "authenticated";

grant references on table "public"."players" to "authenticated";

grant select on table "public"."players" to "authenticated";

grant trigger on table "public"."players" to "authenticated";

grant truncate on table "public"."players" to "authenticated";

grant update on table "public"."players" to "authenticated";

grant delete on table "public"."players" to "service_role";

grant insert on table "public"."players" to "service_role";

grant references on table "public"."players" to "service_role";

grant select on table "public"."players" to "service_role";

grant trigger on table "public"."players" to "service_role";

grant truncate on table "public"."players" to "service_role";

grant update on table "public"."players" to "service_role";

grant delete on table "public"."ranking_snapshots" to "anon";

grant insert on table "public"."ranking_snapshots" to "anon";

grant references on table "public"."ranking_snapshots" to "anon";

grant select on table "public"."ranking_snapshots" to "anon";

grant trigger on table "public"."ranking_snapshots" to "anon";

grant truncate on table "public"."ranking_snapshots" to "anon";

grant update on table "public"."ranking_snapshots" to "anon";

grant delete on table "public"."ranking_snapshots" to "authenticated";

grant insert on table "public"."ranking_snapshots" to "authenticated";

grant references on table "public"."ranking_snapshots" to "authenticated";

grant select on table "public"."ranking_snapshots" to "authenticated";

grant trigger on table "public"."ranking_snapshots" to "authenticated";

grant truncate on table "public"."ranking_snapshots" to "authenticated";

grant update on table "public"."ranking_snapshots" to "authenticated";

grant delete on table "public"."ranking_snapshots" to "service_role";

grant insert on table "public"."ranking_snapshots" to "service_role";

grant references on table "public"."ranking_snapshots" to "service_role";

grant select on table "public"."ranking_snapshots" to "service_role";

grant trigger on table "public"."ranking_snapshots" to "service_role";

grant truncate on table "public"."ranking_snapshots" to "service_role";

grant update on table "public"."ranking_snapshots" to "service_role";

grant delete on table "public"."reviews" to "anon";

grant insert on table "public"."reviews" to "anon";

grant references on table "public"."reviews" to "anon";

grant select on table "public"."reviews" to "anon";

grant trigger on table "public"."reviews" to "anon";

grant truncate on table "public"."reviews" to "anon";

grant update on table "public"."reviews" to "anon";

grant delete on table "public"."reviews" to "authenticated";

grant insert on table "public"."reviews" to "authenticated";

grant references on table "public"."reviews" to "authenticated";

grant select on table "public"."reviews" to "authenticated";

grant trigger on table "public"."reviews" to "authenticated";

grant truncate on table "public"."reviews" to "authenticated";

grant update on table "public"."reviews" to "authenticated";

grant delete on table "public"."reviews" to "service_role";

grant insert on table "public"."reviews" to "service_role";

grant references on table "public"."reviews" to "service_role";

grant select on table "public"."reviews" to "service_role";

grant trigger on table "public"."reviews" to "service_role";

grant truncate on table "public"."reviews" to "service_role";

grant update on table "public"."reviews" to "service_role";

grant delete on table "public"."services" to "anon";

grant insert on table "public"."services" to "anon";

grant references on table "public"."services" to "anon";

grant select on table "public"."services" to "anon";

grant trigger on table "public"."services" to "anon";

grant truncate on table "public"."services" to "anon";

grant update on table "public"."services" to "anon";

grant delete on table "public"."services" to "authenticated";

grant insert on table "public"."services" to "authenticated";

grant references on table "public"."services" to "authenticated";

grant select on table "public"."services" to "authenticated";

grant trigger on table "public"."services" to "authenticated";

grant truncate on table "public"."services" to "authenticated";

grant update on table "public"."services" to "authenticated";

grant delete on table "public"."services" to "service_role";

grant insert on table "public"."services" to "service_role";

grant references on table "public"."services" to "service_role";

grant select on table "public"."services" to "service_role";

grant trigger on table "public"."services" to "service_role";

grant truncate on table "public"."services" to "service_role";

grant update on table "public"."services" to "service_role";

grant delete on table "public"."services_clubes" to "anon";

grant insert on table "public"."services_clubes" to "anon";

grant references on table "public"."services_clubes" to "anon";

grant select on table "public"."services_clubes" to "anon";

grant trigger on table "public"."services_clubes" to "anon";

grant truncate on table "public"."services_clubes" to "anon";

grant update on table "public"."services_clubes" to "anon";

grant delete on table "public"."services_clubes" to "authenticated";

grant insert on table "public"."services_clubes" to "authenticated";

grant references on table "public"."services_clubes" to "authenticated";

grant select on table "public"."services_clubes" to "authenticated";

grant trigger on table "public"."services_clubes" to "authenticated";

grant truncate on table "public"."services_clubes" to "authenticated";

grant update on table "public"."services_clubes" to "authenticated";

grant delete on table "public"."services_clubes" to "service_role";

grant insert on table "public"."services_clubes" to "service_role";

grant references on table "public"."services_clubes" to "service_role";

grant select on table "public"."services_clubes" to "service_role";

grant trigger on table "public"."services_clubes" to "service_role";

grant truncate on table "public"."services_clubes" to "service_role";

grant update on table "public"."services_clubes" to "service_role";

grant delete on table "public"."tournament_couple_seeds" to "anon";

grant insert on table "public"."tournament_couple_seeds" to "anon";

grant references on table "public"."tournament_couple_seeds" to "anon";

grant select on table "public"."tournament_couple_seeds" to "anon";

grant trigger on table "public"."tournament_couple_seeds" to "anon";

grant truncate on table "public"."tournament_couple_seeds" to "anon";

grant update on table "public"."tournament_couple_seeds" to "anon";

grant delete on table "public"."tournament_couple_seeds" to "authenticated";

grant insert on table "public"."tournament_couple_seeds" to "authenticated";

grant references on table "public"."tournament_couple_seeds" to "authenticated";

grant select on table "public"."tournament_couple_seeds" to "authenticated";

grant trigger on table "public"."tournament_couple_seeds" to "authenticated";

grant truncate on table "public"."tournament_couple_seeds" to "authenticated";

grant update on table "public"."tournament_couple_seeds" to "authenticated";

grant delete on table "public"."tournament_couple_seeds" to "service_role";

grant insert on table "public"."tournament_couple_seeds" to "service_role";

grant references on table "public"."tournament_couple_seeds" to "service_role";

grant select on table "public"."tournament_couple_seeds" to "service_role";

grant trigger on table "public"."tournament_couple_seeds" to "service_role";

grant truncate on table "public"."tournament_couple_seeds" to "service_role";

grant update on table "public"."tournament_couple_seeds" to "service_role";

grant delete on table "public"."tournaments" to "anon";

grant insert on table "public"."tournaments" to "anon";

grant references on table "public"."tournaments" to "anon";

grant select on table "public"."tournaments" to "anon";

grant trigger on table "public"."tournaments" to "anon";

grant truncate on table "public"."tournaments" to "anon";

grant update on table "public"."tournaments" to "anon";

grant delete on table "public"."tournaments" to "authenticated";

grant insert on table "public"."tournaments" to "authenticated";

grant references on table "public"."tournaments" to "authenticated";

grant select on table "public"."tournaments" to "authenticated";

grant trigger on table "public"."tournaments" to "authenticated";

grant truncate on table "public"."tournaments" to "authenticated";

grant update on table "public"."tournaments" to "authenticated";

grant delete on table "public"."tournaments" to "service_role";

grant insert on table "public"."tournaments" to "service_role";

grant references on table "public"."tournaments" to "service_role";

grant select on table "public"."tournaments" to "service_role";

grant trigger on table "public"."tournaments" to "service_role";

grant truncate on table "public"."tournaments" to "service_role";

grant update on table "public"."tournaments" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

grant delete on table "public"."zone_couples" to "anon";

grant insert on table "public"."zone_couples" to "anon";

grant references on table "public"."zone_couples" to "anon";

grant select on table "public"."zone_couples" to "anon";

grant trigger on table "public"."zone_couples" to "anon";

grant truncate on table "public"."zone_couples" to "anon";

grant update on table "public"."zone_couples" to "anon";

grant delete on table "public"."zone_couples" to "authenticated";

grant insert on table "public"."zone_couples" to "authenticated";

grant references on table "public"."zone_couples" to "authenticated";

grant select on table "public"."zone_couples" to "authenticated";

grant trigger on table "public"."zone_couples" to "authenticated";

grant truncate on table "public"."zone_couples" to "authenticated";

grant update on table "public"."zone_couples" to "authenticated";

grant delete on table "public"."zone_couples" to "service_role";

grant insert on table "public"."zone_couples" to "service_role";

grant references on table "public"."zone_couples" to "service_role";

grant select on table "public"."zone_couples" to "service_role";

grant trigger on table "public"."zone_couples" to "service_role";

grant truncate on table "public"."zone_couples" to "service_role";

grant update on table "public"."zone_couples" to "service_role";

grant delete on table "public"."zones" to "anon";

grant insert on table "public"."zones" to "anon";

grant references on table "public"."zones" to "anon";

grant select on table "public"."zones" to "anon";

grant trigger on table "public"."zones" to "anon";

grant truncate on table "public"."zones" to "anon";

grant update on table "public"."zones" to "anon";

grant delete on table "public"."zones" to "authenticated";

grant insert on table "public"."zones" to "authenticated";

grant references on table "public"."zones" to "authenticated";

grant select on table "public"."zones" to "authenticated";

grant trigger on table "public"."zones" to "authenticated";

grant truncate on table "public"."zones" to "authenticated";

grant update on table "public"."zones" to "authenticated";

grant delete on table "public"."zones" to "service_role";

grant insert on table "public"."zones" to "service_role";

grant references on table "public"."zones" to "service_role";

grant select on table "public"."zones" to "service_role";

grant trigger on table "public"."zones" to "service_role";

grant truncate on table "public"."zones" to "service_role";

grant update on table "public"."zones" to "service_role";


