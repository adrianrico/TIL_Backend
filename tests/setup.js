// Se ejecuta ANTES de importar la app. Aísla las pruebas en una base propia.
process.env.NODE_ENV = 'test';
process.env.DB_TARGET = 'local'; // nunca Atlas durante las pruebas
process.env.DB_NAME = 'til_platform_test';
