import { CronJob } from 'cron';
import { URL_ROOT, CRON_SCHEDULE, TIMEZONE, PORT, prisma } from './config';
import axios from 'axios';
import AdmZip from 'adm-zip';
import express, { Express } from 'express';
import { Contribuyente } from './types';
import router from './routes';

// Verifica si se pasó el argumento 'startmeup' al ejecutar el script
const startmeup = process.argv[2] === 'startmeup';

// Configura el trabajo cron para ejecutar el proceso ETL en un horario específico
const etlSchedule = new CronJob(
  CRON_SCHEDULE,
  startETL,
  null,
  false,
  TIMEZONE
);

// Inicializa la aplicación Express
const app: Express = express();
app.use(router);

// Función principal que inicia el servidor web y el proceso ETL
main();

/**
 * Descarga y parsea un archivo ZIP basado en un dígito final.
 * @param endingDigit - El dígito final usado para determinar el archivo ZIP a descargar.
 * @returns Un array de objetos `Contribuyente` parseados del archivo ZIP descargado.
 */
async function downloadAndParseZip(endingDigit: number): Promise<Contribuyente[]> {
  console.log('Descargando ZIP y parseando datos para el dígito final: ', endingDigit);
  const fechaHoraImportacion = new Date().toISOString();
  const url = `${URL_ROOT}${endingDigit}.zip`;
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const zip = new AdmZip(Buffer.from(response.data, 'binary'));
  const zipEntries = zip.getEntries();
  const txtFile = zipEntries[0];

  if (!txtFile) {
    console.log('No se encontró un archivo TXT en el ZIP');
    return [];
  }

  const content = txtFile.getData().toString('utf8');
  const lines = content.split('\n');

  const dataParsed = lines.map(line => {
    const [ruc, razonSocial, digitoVerificador, rucAnterior, estado] = line.split('|');
    if (!ruc || !razonSocial || !digitoVerificador) {
      return undefined;
    } else {
      return { ruc, razonSocial, digitoVerificador, rucAnterior, estado, fechaHoraImportacion };
    }
  });

  const data: Contribuyente[] = dataParsed.filter((item): item is Contribuyente => item !== undefined);
  return data;
}

/**
 * Almacena un array de objetos `Contribuyente` en la base de datos.
 * @param contribuyentes - El array de objetos `Contribuyente` a almacenar.
 */
async function storeData(contribuyentes: Contribuyente[]) {
  console.log('Almacenando datos...');
  for (const item of contribuyentes) {
    try {
      await prisma.contribuyente.upsert({
        where: { ruc: item.ruc },
        update: item,
        create: item,
      });
    } catch (error) {
      console.log('Error almacenando el item: ', item, error);
      break;
    }
  }
}

/**
 * Inicia el servidor web y el proceso ETL.
 * Si se pasó el flag `--startmeup`, el proceso ETL se iniciará inmediatamente.
 */
async function main(): Promise<void> {
  startWebserver();
  etlSchedule.start();

  if (startmeup) {
    await startETL();
  } else {
    console.log('El proceso ETL comenzará en el horario programado');
  }
}

/**
 * Itera sobre un rango de dígitos finales, descarga y parsea un archivo ZIP para cada dígito,
 * y almacena los datos parseados en la base de datos.
 */
async function startETL(): Promise<void> {
  for (let endingDigit = 0; endingDigit < 10; endingDigit++) {
    const data = await downloadAndParseZip(endingDigit);
    console.log(`${data.length} contribuyentes encontrados`);
    if (data.length) {
      await storeData(data);
    }
    console.log(`Finalizado con el dígito final: ${endingDigit}`);
  }
}

/**
 * Inicia el servidor web en el puerto especificado.
 */
function startWebserver(): void {
  app.listen(PORT, () => {
    console.log(`⚡️ RUC API está escuchando en http://localhost:${PORT}`);
  });
}