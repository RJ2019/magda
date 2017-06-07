CREATE DATABASE auth
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

\connect auth

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.users
(
    id uuid NOT NULL,
    "displayName" character varying(200) COLLATE pg_catalog."default" NOT NULL,
    email character varying(200) COLLATE pg_catalog."default" NOT NULL,
    "photoURL" character varying(200) COLLATE pg_catalog."default" NOT NULL,
    source character varying(20) COLLATE pg_catalog."default" NOT NULL,
    "sourceId" character varying(200) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT source_unique UNIQUE ("sourceId", source)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

CREATE INDEX email_index
    ON public.users USING btree
    (email COLLATE pg_catalog."default")
    TABLESPACE pg_default;

CREATE INDEX source_source_id
    ON public.users USING btree
    (source COLLATE pg_catalog."default", "sourceId" COLLATE pg_catalog."default")
    TABLESPACE pg_default;