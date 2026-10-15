# Desplegar MAQUINAS en Vercel con Neon

1. Sube estos cambios a GitHub e importa `pbas33-pixel/MAQUINAS` en Vercel.
   Selecciona la raíz del repositorio como Root Directory (no `frontend/`).
   `vercel.json` instala ambos paquetes, compila el dashboard y sirve Express
   como función Node.js para las rutas `/api`.
2. Desde Storage / Marketplace de Vercel, conecta Neon y crea o selecciona una
   base de datos. Los nombres de los menús pueden variar según la interfaz.
   Comprueba en las variables del proyecto que existe `DATABASE_URL` para el
   entorno que desplegarás. Usa la URL agrupada de Neon (host con `-pooler`).
   Esta variable es privada del servidor: nunca uses un prefijo `VITE_`.
3. En el editor SQL de esa base de datos Neon, ejecuta una vez el contenido de
   `backend/src/schema.sql` para crear las tablas y registrar las cuatro máquinas.
   Revisa la base de datos seleccionada antes de ejecutar: la sentencia de
   siembra actualiza nombres, ubicaciones y umbrales de máquinas ya existentes.
   La función no aplica el esquema en cada petición ni introduce datos demo.
4. Despliega o vuelve a desplegar el proyecto después de conectar Neon. Comprueba
   `/api/health` (ONLINE y `env.neonConfigured: true`) y `/api/machines`
   (HTTP 200 y cuatro máquinas). La consulta de máquinas confirma acceso real a
   la base de datos; el indicador de health solo comprueba la variable.
5. Abre el dashboard y comprueba que las lecturas se conservan al recargar. Para
   cargar el archivo incluido, usa el botón de importación Excel del dashboard.

El desarrollo local sigue usando `npm run dev:backend` y
`npm --prefix frontend run dev -- --host 0.0.0.0 --strictPort`. Sin DATABASE_URL,
el servidor local conserva su modo demo en memoria. La función de Vercel devuelve
503 si falta esta variable, para evitar aparentar persistencia en producción.

## Alcance y comprobaciones pendientes

La configuración se valida localmente; el despliegue y la conexión real requieren
acceso a las cuentas de Vercel y Neon. No pongas claves ni cadenas de conexión en
GitHub o en el chat. Configúralas en las opciones seguras del proveedor.

Gmail es opcional y permanece simulado sin credenciales. El cooldown actual vive
en la memoria de cada proceso y no se comparte entre instancias de Vercel; antes
de activar correos reales debe trasladarse a almacenamiento compartido. Las rutas
actuales no tienen autenticación: un despliegue accesible permite consultar y
modificar telemetría. Usa protección de acceso en Vercel mientras se añade
autenticación para uso público.
