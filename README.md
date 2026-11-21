# MyGameList

Aplicación web full-stack para la gestión y seguimiento de bibliotecas personales de videojuegos, inspirada en MyAnimeList. Permite a los usuarios administrar su perfil, clasificar juegos por estado (*Jugando, Completado, Planeado, Abandonado*), llevar control de horas jugadas, porcentaje de logros, favoritos y explorar un catálogo conectado a la API de Steam[cite: 2, 4, 6].

---

## Estructura del Proyecto

```text
├── BACKEND
│   ├── controllers
│   │   ├── auth_api_controller.js       # Registro e inicio de sesión
│   │   ├── users_api_controller.js      # Gestión de perfil y eliminación de cuenta
│   │   ├── mylist_api_controller.js     # CRUD de biblioteca personal (horas, logros, estatus, favoritos)
│   │   ├── games_api_controller.js      # Catálogo general, búsqueda, filtros y paginación
│   │   ├── steam_api_controller.js      # Consumo de Steam Web API / Store API
│   │   ├── genres_api_controller.js     # CRUD de géneros personalizados
│   │   └── platforms_api_controller.js  # CRUD de plataformas y colores
│   ├── database
│   │   └── connection.js                # Conexión a MongoDB Atlas mediante Mongoose
│   ├── models
│   │   ├── user.js                      # Esquema de Usuario (máx. 10 favoritos)
│   │   ├── game.js                      # Esquema de Videojuego (mín. 1 plataforma)
│   │   ├── user_game.js                 # Relación Usuario-Juego (horas, logros, fechas, estatus)
│   │   ├── genre.js                     # Esquema de Género
│   │   └── platform.js                  # Esquema de Plataforma (nombre y color hex)
│   ├── routes
│   │   ├── api.js                       # Enrutador maestro (/api)
│   │   ├── auth.js                      # Rutas /api/auth
│   │   ├── users.js                     # Rutas /api/users
│   │   ├── mylist.js                    # Rutas /api/mylist
│   │   ├── games.js                     # Rutas /api/games
│   │   ├── steam.js                     # Rutas /api/steam
│   │   ├── genres.js                    # Rutas /api/genres
│   │   └── platforms.js                 # Rutas /api/platforms
│   ├── .env                             # Variables de entorno (NO subir a Git)
│   ├── .gitignore
│   ├── package.json
│   └── server.js                        # Punto de entrada del servidor Express
└── FRONTEND
    ├── assets
    │   └── css
    │       └── styles.css               # Estilos globales centralizados
    ├── controllers
    │   ├── env.js                       # URL base de la API y guardia de sesión (validateLogin)
    │   ├── navbarController.js          # Renderizado dinámico de barra de navegación
    │   ├── authController.js            # Lógica de login y registro
    │   ├── indexController.js           # Carga de juegos populares en landing
    │   ├── catalogController.js         # Búsqueda, filtros y paginación del catálogo
    │   ├── gameDetailController.js      # Ficha detallada y modal de registro de juego
    │   ├── taxonomyController.js        # Modales CRUD de géneros y plataformas
    │   ├── myListController.js          # Gestión de biblioteca personal y filtros por estatus
    │   ├── profileController.js         # Estadísticas de usuario y Top 10 favoritos
    │   └── userModalController.js       # Modales de editar perfil y eliminar cuenta
    └── views
        ├── index.html                   # Página principal / Landing
        ├── login.html                   # Inicio de sesión
        ├── signup.html                  # Registro de cuenta
        ├── catalog.html                 # Catálogo general de juegos
        ├── game-detail.html             # Detalle individual de videojuego
        ├── my-list.html                 # Biblioteca personal del usuario
        └── profile.html                 # Perfil y estadísticas del jugador[cite: 2, 3, 5, 7]

```

---

## Requisitos e Instalación

### 1. Prerrequisitos

* **Node.js** (v18 o superior, incluye `fetch` nativo)
* Cuenta o URI de conexión a **MongoDB Atlas**


* **Steam Web API Key** (para consultas de biblioteca de usuario)



### 2. Instalación del Backend

1. Abre una terminal en la carpeta `BACKEND`:
```bash
cd BACKEND
npm install

```


*(Dependencias principales: `express`, `mongoose`, `cors`, `dotenv`)*.


2. Crea un archivo `.env` dentro de `BACKEND/` (asegúrate de que esté en `.gitignore`) con las siguientes variables:


```env
PORT=3000
MONGO_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/mygamelist
STEAM_API_KEY=TU_CLAVE_DE_STEAM_32_CARACTERES

```


3. Inicia el servidor:
```bash
node server.js

```


El servidor quedará escuchando en `http://localhost:3000`.



### 3. Ejecución del Frontend

* Verifica en `FRONTEND/controllers/env.js` que `API_URL` apunte a `http://localhost:3000/api`.


* Abre `FRONTEND/views/index.html` utilizando **Live Server** en VS Code o sirviendo los archivos estáticos desde Express.



---

## Endpoints de la API (`/api`)

Todas las rutas parten de `http://localhost:3000/api` (concentradas en `BACKEND/routes/api.js`):

### Autenticación y Usuarios

| Método | Endpoint | Descripción |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Registro de nuevo usuario en MongoDB |
| `POST` | `/api/auth/login` | Validación de credenciales e inicio de sesión |
| `GET` | `/api/users/:id` | Obtiene datos del perfil, estadísticas y favoritos |
| `PUT` | `/api/users/:id` | Actualiza foto de perfil o fecha de nacimiento |
| `DELETE` | `/api/users/:id` | Elimina la cuenta del usuario

 |

### Catálogo y Steam API

| Método | Endpoint | Descripción |
| --- | --- | --- |
| `GET` | `/api/games` | Lista paginada (`?search=&genre=&platform=&sort=&page=1`) |
| `GET` | `/api/games/:id` | Detalle de un juego por `_id` de MongoDB o `steamAppId` |
| `POST` | `/api/games` | Registra un videojuego manualmente |
| `GET` | `/api/steam/search?term=` | Busca videojuegos en tiempo real en la tienda de Steam |
| `GET` | `/api/steam/popular` | Obtiene juegos destacados/populares para `index.html` |
| `GET` | `/api/steam/game/:appid` | Extrae detalle de Steam y lo guarda en caché en MongoDB |
| `GET` | `/api/steam/owned/:steamId` | Obtiene biblioteca y horas jugadas de un perfil público de Steam

 |

### Biblioteca Personal y Taxonomías

| Método | Endpoint | Descripción |
| --- | --- | --- |
| `GET` | `/api/mylist/:userId` | Obtiene todos los juegos registrados por el usuario |
| `POST` | `/api/mylist` | Agrega un juego a la lista (estatus, horas, logros, plataforma, favorito) |
| `PUT` | `/api/mylist/:id` | Actualiza horas jugadas, porcentaje de logros, estatus o favorito |
| `DELETE` | `/api/mylist/:id` | Elimina un juego de la biblioteca del usuario |
| `GET/POST/DELETE` | `/api/genres` | Gestión de géneros personalizados |
| `GET/POST/DELETE` | `/api/platforms` | Gestión de plataformas con color hexadecimal asignado

 |

---

## Convenciones de Desarrollo para el Equipo

* **Modelos (`BACKEND/models/`):** Nombres en singular y `snake_case` usando **Mongoose** (`user.js`, `game.js`, `user_game.js`). No usar archivos `.json` locales para persistencia final.


* **Controladores Backend (`BACKEND/controllers/`):** Nombres en plural con sufijo `_api_controller.js` (`auth_api_controller.js`, `games_api_controller.js`).


* **Seguridad:** Nunca incluir `STEAM_API_KEY` ni `MONGO_URI` en `FRONTEND/controllers/env.js`; todas las llamadas externas a Steam pasan por el backend.


* **Reglas de Negocio:**
* Todo juego debe tener al menos **1 plataforma** asignada.


* Cada usuario puede tener un máximo de **10 juegos favoritos**.


* Las horas provenientes de Steam (`playtime_forever`) se reciben en minutos y se convierten a horas en el backend (`Math.round(minutos / 60)`).


---

## Tecnologías

* **Backend:** Node.js, Express, Mongoose, Dotenv, CORS


* **Base de Datos:** MongoDB Atlas


* **API Externa:** Steam Web API & Steam Store API


* **Frontend:** HTML5, CSS3, JavaScript (ES6+), Bootstrap 5.3, Bootstrap Icons
