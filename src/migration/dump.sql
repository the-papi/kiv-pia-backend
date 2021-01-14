
-- Dumped from database version 13.0 (Debian 13.0-1.pgdg100+1)
-- Dumped by pg_dump version 13.0 (Debian 13.0-1.pgdg100+1)

SET client_encoding = 'UTF8';

CREATE TABLE public.chat_message (
                                     id integer NOT NULL,
                                     message text NOT NULL,
                                     "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
                                     "fromId" integer NOT NULL,
                                     "gameId" integer NOT NULL
);

CREATE SEQUENCE public.chat_message_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE public.chat_message_id_seq OWNED BY public.chat_message.id;



CREATE TABLE public.friend_request (
                                       id integer NOT NULL,
                                       "requesterId" integer,
                                       "potentialFriendId" integer
);




CREATE SEQUENCE public.friend_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE public.friend_request_id_seq OWNED BY public.friend_request.id;



CREATE TABLE public.game (
                             id integer NOT NULL,
                             active boolean DEFAULT true NOT NULL,
                             "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
                             "boardSize" integer NOT NULL,
                             "winnerId" integer
);




CREATE SEQUENCE public.game_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE public.game_id_seq OWNED BY public.game.id;



CREATE TABLE public.game_state (
                                   id integer NOT NULL,
                                   x integer NOT NULL,
                                   y integer NOT NULL,
                                   "playerId" integer NOT NULL,
                                   "gameId" integer NOT NULL
);




CREATE SEQUENCE public.game_state_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE public.game_state_id_seq OWNED BY public.game_state.id;


CREATE TABLE public.player (
                               id integer NOT NULL,
                               symbol integer NOT NULL,
                               "gameId" integer NOT NULL,
                               "userId" integer NOT NULL
);




CREATE SEQUENCE public.player_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE public.player_id_seq OWNED BY public.player.id;



CREATE TABLE public."user" (
                               id integer NOT NULL,
                               email character varying NOT NULL,
                               username character varying NOT NULL,
                               password character varying NOT NULL,
                               active boolean DEFAULT true NOT NULL,
                               admin boolean DEFAULT false NOT NULL
);




CREATE TABLE public.user_friends_user (
                                          "userId_1" integer NOT NULL,
                                          "userId_2" integer NOT NULL
);




CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;



ALTER TABLE ONLY public.chat_message ALTER COLUMN id SET DEFAULT nextval('public.chat_message_id_seq'::regclass);



ALTER TABLE ONLY public.friend_request ALTER COLUMN id SET DEFAULT nextval('public.friend_request_id_seq'::regclass);



ALTER TABLE ONLY public.game ALTER COLUMN id SET DEFAULT nextval('public.game_id_seq'::regclass);



ALTER TABLE ONLY public.game_state ALTER COLUMN id SET DEFAULT nextval('public.game_state_id_seq'::regclass);



ALTER TABLE ONLY public.player ALTER COLUMN id SET DEFAULT nextval('public.player_id_seq'::regclass);



ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


INSERT INTO public."user" VALUES (1, 'admin', 'admin', '$2a$10$LH1Wv6957n2VKsidF/DwEeVFeh2oqp2auv8qMUHKZUzPKSak9u6Uq', true, true);
INSERT INTO public."user" VALUES (3, 'test3@test3.cz', 'test3@test3.cz', '$2a$10$hXTLrrVLZik8huv7izsFR.wkX9eJ.PqABcnAL2Ephzvm8oPOMmYHO', true, false);
INSERT INTO public."user" VALUES (4, 'test4@test4.cz', 'test4@test4.cz', '$2a$10$hXTLrrVLZik8huv7izsFR.wkX9eJ.PqABcnAL2Ephzvm8oPOMmYHO', true, false);
INSERT INTO public."user" VALUES (5, 'test5@test5.cz', 'test5@test5.cz', '$2a$10$hXTLrrVLZik8huv7izsFR.wkX9eJ.PqABcnAL2Ephzvm8oPOMmYHO', true, false);
INSERT INTO public."user" VALUES (6, 'test6@test6.cz', 'test6@test6.cz', '$2a$10$hXTLrrVLZik8huv7izsFR.wkX9eJ.PqABcnAL2Ephzvm8oPOMmYHO', true, false);
INSERT INTO public."user" VALUES (7, 'test7@test7.cz', 'test7@test7.cz', '$2a$10$hXTLrrVLZik8huv7izsFR.wkX9eJ.PqABcnAL2Ephzvm8oPOMmYHO', true, false);
INSERT INTO public."user" VALUES (8, 'test8@test8.cz', 'test8@test8.cz', '$2a$10$hXTLrrVLZik8huv7izsFR.wkX9eJ.PqABcnAL2Ephzvm8oPOMmYHO', true, false);
INSERT INTO public."user" VALUES (9, 'test9@test9.cz', 'test9@test9.cz', '$2a$10$hXTLrrVLZik8huv7izsFR.wkX9eJ.PqABcnAL2Ephzvm8oPOMmYHO', true, false);
INSERT INTO public."user" VALUES (10, 'test10@test10.cz', 'test10@test10.cz', '$2a$10$hXTLrrVLZik8huv7izsFR.wkX9eJ.PqABcnAL2Ephzvm8oPOMmYHO', true, false);
INSERT INTO public."user" VALUES (11, 'test11@test11.cz', 'test11@test11.cz', '$2a$10$hXTLrrVLZik8huv7izsFR.wkX9eJ.PqABcnAL2Ephzvm8oPOMmYHO', true, false);
INSERT INTO public."user" VALUES (12, 'test12@test12.cz', 'test12@test12.cz', '$2a$10$hXTLrrVLZik8huv7izsFR.wkX9eJ.PqABcnAL2Ephzvm8oPOMmYHO', true, false);
INSERT INTO public."user" VALUES (13, 'test13@test13.cz', 'test13@test13.cz', '$2a$10$hXTLrrVLZik8huv7izsFR.wkX9eJ.PqABcnAL2Ephzvm8oPOMmYHO', true, false);
INSERT INTO public."user" VALUES (14, 'test14@test14.cz', 'test14@test14.cz', '$2a$10$hXTLrrVLZik8huv7izsFR.wkX9eJ.PqABcnAL2Ephzvm8oPOMmYHO', true, false);
INSERT INTO public."user" VALUES (15, 'test15@test15.cz', 'test15@test15.cz', '$2a$10$hXTLrrVLZik8huv7izsFR.wkX9eJ.PqABcnAL2Ephzvm8oPOMmYHO', true, false);
INSERT INTO public."user" VALUES (16, 'test16@test16.cz', 'test16@test16.cz', '$2a$10$hXTLrrVLZik8huv7izsFR.wkX9eJ.PqABcnAL2Ephzvm8oPOMmYHO', true, false);
INSERT INTO public."user" VALUES (17, 'test17@test17.cz', 'test17@test17.cz', '$2a$10$hXTLrrVLZik8huv7izsFR.wkX9eJ.PqABcnAL2Ephzvm8oPOMmYHO', true, false);
INSERT INTO public."user" VALUES (18, 'test18@test18.cz', 'test18@test18.cz', '$2a$10$hXTLrrVLZik8huv7izsFR.wkX9eJ.PqABcnAL2Ephzvm8oPOMmYHO', true, false);
INSERT INTO public."user" VALUES (19, 'test19@test19.cz', 'test19@test19.cz', '$2a$10$hXTLrrVLZik8huv7izsFR.wkX9eJ.PqABcnAL2Ephzvm8oPOMmYHO', true, false);
INSERT INTO public."user" VALUES (20, 'test20@test20.cz', 'test20@test20.cz', '$2a$10$hXTLrrVLZik8huv7izsFR.wkX9eJ.PqABcnAL2Ephzvm8oPOMmYHO', true, false);
INSERT INTO public."user" VALUES (2, 'test1@test1.cz', 'test1@test1.cz', '$2a$10$h9y2gR1uvjqrNVL1sUoah.rhqXvlVeQApRW0MIttpTarxqeC9XUQW', true, false);
INSERT INTO public."user" VALUES (21, 'test2@test2.cz', 'test2@test2.cz', '$2a$10$hXTLrrVLZik8huv7izsFR.wkX9eJ.PqABcnAL2Ephzvm8oPOMmYHO', true, false);






SELECT pg_catalog.setval('public.chat_message_id_seq', 1, false);



SELECT pg_catalog.setval('public.friend_request_id_seq', 1, false);



SELECT pg_catalog.setval('public.game_id_seq', 1, false);



SELECT pg_catalog.setval('public.game_state_id_seq', 1, false);



SELECT pg_catalog.setval('public.player_id_seq', 1, false);



SELECT pg_catalog.setval('public.user_id_seq', 22, true);



ALTER TABLE ONLY public.game
    ADD CONSTRAINT "PK_352a30652cd352f552fef73dec5" PRIMARY KEY (id);



ALTER TABLE ONLY public.chat_message
    ADD CONSTRAINT "PK_3cc0d85193aade457d3077dd06b" PRIMARY KEY (id);



ALTER TABLE ONLY public.friend_request
    ADD CONSTRAINT "PK_4c9d23ff394888750cf66cac17c" PRIMARY KEY (id);



ALTER TABLE ONLY public.player
    ADD CONSTRAINT "PK_65edadc946a7faf4b638d5e8885" PRIMARY KEY (id);



ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY (id);



ALTER TABLE ONLY public.game_state
    ADD CONSTRAINT "PK_e7b8f9fb87d56841a7aaa284f52" PRIMARY KEY (id);



ALTER TABLE ONLY public.user_friends_user
    ADD CONSTRAINT "PK_f2b5631d91f6b7fda632135932f" PRIMARY KEY ("userId_1", "userId_2");



CREATE INDEX "IDX_04840fd160b733de706a336013" ON public.user_friends_user USING btree ("userId_1");



CREATE UNIQUE INDEX "IDX_78a916df40e02a9deb1c4b75ed" ON public."user" USING btree (username);



CREATE UNIQUE INDEX "IDX_e12875dfb3b1d92d7d7c5377e2" ON public."user" USING btree (email);



CREATE INDEX "IDX_e81f236c989f3fd54836b50a12" ON public.user_friends_user USING btree ("userId_2");



ALTER TABLE ONLY public.user_friends_user
    ADD CONSTRAINT "FK_04840fd160b733de706a3360134" FOREIGN KEY ("userId_1") REFERENCES public."user"(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.chat_message
    ADD CONSTRAINT "FK_0e017c7444083eb6bf16dff0d01" FOREIGN KEY ("fromId") REFERENCES public."user"(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.game_state
    ADD CONSTRAINT "FK_22f2655d13814615419e6f2977c" FOREIGN KEY ("playerId") REFERENCES public.player(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.chat_message
    ADD CONSTRAINT "FK_51c4788a4d9874ddae11c13b876" FOREIGN KEY ("gameId") REFERENCES public.game(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.player
    ADD CONSTRAINT "FK_7687919bf054bf262c669d3ae21" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.player
    ADD CONSTRAINT "FK_7dfdd31fcd2b5aa3b08ed15fe8a" FOREIGN KEY ("gameId") REFERENCES public.game(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.friend_request
    ADD CONSTRAINT "FK_9347bde29efe00b67d39f29d9e7" FOREIGN KEY ("requesterId") REFERENCES public."user"(id);



ALTER TABLE ONLY public.friend_request
    ADD CONSTRAINT "FK_c2a41e7b0ca43c0cc60ad484a73" FOREIGN KEY ("potentialFriendId") REFERENCES public."user"(id);



ALTER TABLE ONLY public.game
    ADD CONSTRAINT "FK_cd57acb58d1147c23da5cd09cae" FOREIGN KEY ("winnerId") REFERENCES public.player(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.game_state
    ADD CONSTRAINT "FK_dc92896f0725c0cf0127b50eb92" FOREIGN KEY ("gameId") REFERENCES public.game(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.user_friends_user
    ADD CONSTRAINT "FK_e81f236c989f3fd54836b50a12d" FOREIGN KEY ("userId_2") REFERENCES public."user"(id) ON DELETE CASCADE;


--
