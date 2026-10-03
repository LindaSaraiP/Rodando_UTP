# Rodando UTP — PWA final

Rodando UTP es una aplicación web progresiva (PWA) de **innovación y emprendimiento** enfocada en movilidad colaborativa universitaria. Conecta a estudiantes que ya realizan un trayecto hacia la Universidad Tecnológica de Puebla con compañeros que pueden incorporarse a la misma ruta y aportar al gasto de gasolina.

## Cumplimiento de la rúbrica

### 1. Tema de innovación, creatividad o emprendimiento
La aplicación presenta una propuesta de valor, problema, solución, beneficios y funcionamiento del proyecto. Rodando UTP no se plantea como taxi: organiza trayectos que ya iban a realizarse y permite aprovechar asientos disponibles.

### 2. Maquetado
- Header con identidad visual y logotipo.
- Menú de navegación.
- Hero de presentación.
- Sección del proyecto y propuesta de valor.
- Buscador y tarjetas de rutas.
- Sección “Cómo funciona”.
- Sección multimedia.
- Sección de seguridad.
- Panel del usuario.
- Sección de URL de publicación.
- Footer con navegación y tecnologías.

### 3. Diseño responsivo
El CSS incorpora puntos de adaptación para:
- escritorio grande;
- laptop;
- tableta;
- teléfono celular.

La navegación pasa a menú desplegable y los grids se reorganizan automáticamente.

### 4. Colores
Se utiliza una paleta coherente basada en verdes, verde esmeralda, fondos oscuros y texto de alto contraste.

### 5. Multimedia
- Texto descriptivo y funcional.
- Ilustraciones SVG locales.
- Iconos PWA.
- Video MP4 local en `public/media/rodando-utp-presentacion.mp4`.

### 6. Tipografía y legibilidad
La interfaz usa una pila tipográfica del sistema, tamaños fluidos, contraste alto, espacios consistentes y jerarquías semánticas de encabezados.

### 7. Organización del código

```text
RodandoUTP_PWA_Final/
├── server.js
├── package.json
├── render.yaml
├── .env.example
├── data/
├── docs/
│   └── schema.sql
└── public/
    ├── index.html
    ├── manifest.webmanifest
    ├── service-worker.js
    ├── css/
    │   └── styles.css
    ├── js/
    │   └── app.js
    ├── img/
    └── media/
        └── rodando-utp-presentacion.mp4
```

## Funciones reales

- Registro e inicio de sesión.
- Validación del dominio institucional configurable.
- Contraseñas con `scrypt` y salt aleatorio.
- Sesiones almacenadas en SQLite.
- Cookies `HttpOnly` + `SameSite=Strict`.
- Protección CSRF.
- Rate limiting.
- Consultas SQL parametrizadas.
- Publicación de rutas.
- Consulta y filtrado de rutas.
- Reservación real de asientos.
- Cancelación de reservas.
- Cancelación de rutas.
- Panel con publicaciones y reservaciones.
- Transacciones SQLite para evitar reservar más lugares de los disponibles.

## Características PWA

- `manifest.webmanifest`.
- Service Worker.
- `start_url`, `scope` y modo `standalone`.
- Iconos 192x192 y 512x512.
- Accesos directos desde el manifest.
- Caché del app shell.
- Apertura offline de la interfaz después de la primera carga.
- La API no se guarda en caché para evitar persistir datos privados.
- Detección en línea / sin conexión.
- Botón de instalación cuando el navegador expone `beforeinstallprompt`.

## Requisitos

- Node.js 22.5 o superior.
- Chrome, Edge u otro navegador moderno.

No requiere instalar paquetes externos; usa módulos incluidos en Node.js.

## Ejecución local

### Windows
Ejecuta:

```text
INICIAR_WINDOWS.bat
```

### Linux / Kubuntu

```bash
chmod +x iniciar-linux.sh
./iniciar-linux.sh
```

O en cualquier sistema:

```bash
npm start
```

Después abre:

```text
http://localhost:3000
```

## Instalación como PWA

Con la aplicación abierta en Chrome o Edge:

1. Abre `http://localhost:3000` o la URL HTTPS publicada.
2. Usa el botón **Instalar app** cuando aparezca, o el menú del navegador.
3. Confirma **Instalar Rodando UTP**.
4. La aplicación podrá abrirse en una ventana independiente.

## Publicación y URL para la entrega

El proyecto incluye `render.yaml` para facilitar el despliegue como servicio Node. Una plataforma de hosting asignará una URL HTTPS similar a:

```text
https://rodando-utp.onrender.com
```

**No debe escribirse esa dirección como URL final hasta que el despliegue exista realmente.** La sección “Publicación” de la página detecta automáticamente `location.origin` y muestra la URL real cuando la app se encuentra en producción.

Para conservar SQLite entre reinicios en un hosting, configura almacenamiento persistente y usa:

```text
DATABASE_FILE=/ruta/persistente/rodando-utp.db
```

## Nota sobre GitHub Pages

GitHub Pages sirve archivos estáticos, por lo que no puede ejecutar `server.js` ni SQLite. Puede utilizarse para una maqueta estática, pero **la versión funcional completa debe publicarse en un hosting que ejecute Node.js**.

## Seguridad e identidad institucional

La validación de un correo `@utpuebla.edu.mx` es un control del proyecto académico. No equivale a una verificación oficial de estudiante activo. Para una plataforma institucional real sería necesario integrar un mecanismo autorizado por la universidad.
# Rodando_UTP
