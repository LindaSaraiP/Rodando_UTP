# Guía de publicación

La versión completa de Rodando UTP usa `server.js` y SQLite, por lo que debe publicarse en un servicio que ejecute Node.js. GitHub Pages por sí solo no ejecuta el backend.

## Opción recomendada: Render

1. Sube la carpeta del proyecto a un repositorio de GitHub.
2. En Render crea un **Web Service** desde ese repositorio.
3. Render puede detectar `render.yaml` incluido en el proyecto.
4. Verifica que el comando de inicio sea:

   `npm start`

5. Configura `NODE_ENV=production`.
6. Si necesitas que SQLite sea persistente entre reinicios, agrega un disco persistente y define `DATABASE_FILE` con la ruta del disco, por ejemplo:

   `/var/data/rodando-utp.db`

7. Al finalizar, Render asignará una URL HTTPS.
8. Abre esa URL y revisa la sección **Publicación** de Rodando UTP; mostrará la dirección exacta que debes anexar a la actividad.

## Comprobación final

- La URL debe comenzar con `https://`.
- `https://TU-DOMINIO/manifest.webmanifest` debe abrir el manifest.
- `https://TU-DOMINIO/service-worker.js` debe abrir el Service Worker.
- Chrome/Edge debe ofrecer la opción de instalar la app.
