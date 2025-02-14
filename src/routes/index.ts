import { Router, Request, Response } from 'express';
import { VERSION, prisma } from '../config';

// Inicializa el enrutador de Express
const router = Router();

/**
 * Ruta principal que devuelve un mensaje de bienvenida con la versión de la API.
 */
router.get('/', (_req: Request, res: Response) => {
  res.send(`🚀 Bienvenido a la API de RUC🇵🇾 v${VERSION}`);
});

/**
 * Ruta para buscar un contribuyente por su RUC.
 * @param ruc - El RUC del contribuyente a buscar.
 */
router.get('/ruc/:ruc', async (req: Request, res: Response) => {
  const { ruc } = req.params;
  const contribuyente = await prisma.contribuyente.findUnique({
    where: { ruc },
  });
  res.send(contribuyente);
});

/**
 * Ruta para buscar contribuyentes por su razón social.
 * @param razonSocial - La razón social o parte de ella para buscar contribuyentes.
 */
router.get('/razon-social/:razonSocial', async (req: Request, res: Response) => {
  const { razonSocial } = req.params;
  const contribuyentes = await prisma.contribuyente.findMany({
    where: { razonSocial: { contains: razonSocial } },
  });
  res.send(contribuyentes);
});

/**
 * Ruta de respaldo para manejar solicitudes a rutas no existentes (404).
 */
router.use((_req: Request, res: Response) => {
  res.status(404).send('🤷‍♂️ No hay nada que ver aquí...');
});

// Exporta el enrutador para su uso en la aplicación
export default router;