-- DigitalGaming seed para Neon: corre esto en el SQL Editor DESPUÉS de db/schema.sql.
-- Idempotente: solo inserta si no existe.

-- GTA VI preventa (único producto inicial)
INSERT INTO "Products"("Id","Name","Price","Category","ImageUrl","Description","Stock")
SELECT gen_random_uuid(),
       'GTA VI — Reserva preventa',
       4950,
       1,
       './assets/gta6.jpg',
       'Reserva el GTA VI y no te quedes sin el juego más esperado de la historia. Apartado con RD$4,950, válido para PS5 y Xbox Series.',
       50
WHERE NOT EXISTS (SELECT 1 FROM "Products" WHERE "Name" = 'GTA VI — Reserva preventa');

-- Admin demo (usuario: admin, clave: Admin1234). Cambia la clave tras entrar.
INSERT INTO "Users"("Id","Username","PasswordHash","Role","CreatedAtUtc")
SELECT gen_random_uuid(),
       'admin',
       'pbkdf2-sha256$210000$8Z2m2w+4Navc7VyU27W2ig==$/UnOPco5XeTFnmSecDiYLLLQVHl2vvy46qBJZ1A8xVI=',
       'admin',
       now()
WHERE NOT EXISTS (SELECT 1 FROM "Users" WHERE lower("Username") = 'admin');
