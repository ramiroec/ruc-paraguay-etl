import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
// Carga las variables de entorno desde un archivo .env
dotenv.config();
// URL base para descargar los archivos ZIP de RUC
export const URL_ROOT = `https://www.dnit.gov.py/documents/20123/662360/ruc`;
// Configuración del cron para programar tareas (por defecto, cada minuto)
export const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 */1 * * * *';
// URL de la base de datos (por defecto, una base de datos SQLite local)
export const DATABASE_URL = process.env.DATABASE_URL || 'file:../data/rucpy.db';
// Zona horaria para el cron (por defecto, Asunción, Paraguay)
export const TIMEZONE = process.env.TIMEZONE || 'America/Asuncion';
// Puerto en el que se ejecutará la aplicación (por defecto, 8080)
export const PORT = process.env.PORT || 8080;
// Versión de la aplicación
export const VERSION = '0.0.1';
// Instancia de Prisma Client para interactuar con la base de datos
export const prisma = new PrismaClient();