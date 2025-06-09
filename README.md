# Nimble Conversation Hub

Este proyecto es un asistente virtual conversacional diseñado para ayudar en la planificación de reuniones, específicamente en la recomendación de opciones de menú para eventos. Utiliza la API de Gemini para un procesamiento de lenguaje natural avanzado y una base de datos PostgreSQL para almacenar y gestionar información de menús, sedes, ciudades y proveedores.

## Características

*   **Interacción Conversacional Natural:** Permite a los usuarios interactuar con el asistente de manera fluida y natural.
*   **Recomendación de Menús Personalizada:** Sugiere opciones de menú basadas en el tipo de reunión, número de asistentes, restricciones alimentarias, presupuesto, sede, fecha y hora.
*   **Validación de Datos en Tiempo Real:** Valida la información proporcionada por el usuario (e.g., sedes, ciudades) contra los datos disponibles en la base de datos.
*   **Flexibilidad en la Recopilación de Información:** El asistente puede interpretar y extraer información de las respuestas del usuario sin seguir un flujo de preguntas rígido.
*   **Manejo de Restricciones Alimentarias:** Considera diversas restricciones alimentarias al generar recomendaciones.
*   **Respuestas Detalladas y en Markdown:** Proporciona recomendaciones de menú con explicaciones detalladas y formateadas en Markdown para una mejor legibilidad.
*   **Indicador de Escritura:** Muestra un indicador visual cuando el bot está procesando la respuesta.
*   **Gestión de Conversaciones:** Finaliza la conversación de manera adecuada una vez que se ha dado una recomendación, permitiendo iniciar una nueva planificación.

## Tecnologías Utilizadas

*   **Frontend:** React, TypeScript, Tailwind CSS, Vite
*   **Backend:** Node.js, Express.js, PostgreSQL, `pg` (cliente de PostgreSQL)
*   **IA:** Google Gemini API (modelo `gemini-2.5-flash-preview-05-20`)
*   **Utilidades:** `date-fns`, `lucide-react`, `react-markdown`, `dotenv`

## Configuración del Proyecto

Sigue estos pasos para configurar y ejecutar el proyecto en tu entorno local.

### Prerrequisitos

Asegúrate de tener instalado lo siguiente:

*   Node.js (v18 o superior)
*   npm (v8 o superior)
*   PostgreSQL (v14 o superior)
*   Una clave de API de Google Gemini. Puedes obtener una en [Google AI Studio](https://ai.google.dev/).

### 1. Configuración de la Base de Datos

El proyecto espera una base de datos PostgreSQL.

**a. Crear la Base de Datos:**
Crea una base de datos llamada `sistema_comidas`. Puedes usar `psql` o una herramienta GUI como DBeaver/pgAdmin.

```bash
CREATE DATABASE sistema_comidas;
```

**b. Esquema de la Base de Datos:**
Necesitarás poblar la base de datos con las tablas `menu_proveedor`, `sede`, `ciudad`, y `proveedor`. A continuación, se presenta un esquema básico que puedes usar como punto de partida. Asegúrate de insertar algunos datos de ejemplo.

```sql
-- Tabla Ciudad
CREATE TABLE ciudad (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

-- Tabla Sede
CREATE TABLE sede (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    ciudad_id INT REFERENCES ciudad(id)
);

-- Tabla Proveedor
CREATE TABLE proveedor (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    ciudad_id INT REFERENCES ciudad(id)
);

-- Tabla Menu_Proveedor
CREATE TABLE menu_proveedor (
    id SERIAL PRIMARY KEY,
    plato VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    tipo VARCHAR(100) NOT NULL, -- e.g., 'Desayuno', 'Almuerzo', 'Cena'
    restricciones TEXT, -- e.g., 'Vegano,Sin Gluten'
    proveedor_id INT REFERENCES proveedor(id),
    sede_id INT REFERENCES sede(id),
    ciudad_id INT REFERENCES ciudad(id)
);
```

**c. Datos de Ejemplo (Opcional):**
Inserta algunos datos para pruebas.

```sql
INSERT INTO ciudad (nombre) VALUES ('Bogotá'), ('Medellín'), ('Cali');

INSERT INTO sede (nombre, ciudad_id) VALUES
('Sede La 33', (SELECT id FROM ciudad WHERE nombre = 'Medellín')),
('Sede Carrera 15', (SELECT id FROM ciudad WHERE nombre = 'Bogotá')),
('Sede Torres del atlantico', (SELECT id FROM ciudad WHERE nombre = 'Bogotá')),
('Sede Nacional', (SELECT id FROM ciudad WHERE nombre = 'Medellín')),
('Sede Holguines', (SELECT id FROM ciudad WHERE nombre = 'Cali')),
('Sede CSS', (SELECT id FROM ciudad WHERE nombre = 'Bogotá')),
('Sede Pereira', (SELECT id FROM ciudad WHERE nombre = 'Pereira'));

INSERT INTO proveedor (nombre, ciudad_id) VALUES
('La Cocina de Juan', (SELECT id FROM ciudad WHERE nombre = 'Bogotá')),
('Sabores del Valle', (SELECT id FROM ciudad WHERE nombre = 'Cali')),
('El Sazón Paisa', (SELECT id FROM ciudad WHERE nombre = 'Medellín'));

INSERT INTO menu_proveedor (plato, descripcion, precio, tipo, restricciones, proveedor_id, sede_id, ciudad_id) VALUES
('Caja de Desayuno Clásico', 'Incluye huevos revueltos, arepa con queso, jugo de naranja y café.', 18000.00, 'Desayuno', 'Ninguna', (SELECT id FROM proveedor WHERE nombre = 'La Cocina de Juan'), (SELECT id FROM sede WHERE nombre = 'Sede Carrera 15'), (SELECT id FROM ciudad WHERE nombre = 'Bogotá')),
('Opciones Saludables para Desayuno', 'Bowl de frutas con granola, yogur griego y té verde.', 20000.00, 'Desayuno', 'Vegano,Sin Gluten', (SELECT id FROM proveedor WHERE nombre = 'La Cocina de Juan'), (SELECT id FROM sede WHERE nombre = 'Sede Carrera 15'), (SELECT id FROM ciudad WHERE nombre = 'Bogotá')),
('Bandeja de Almuerzo Ejecutivo', 'Pollo a la plancha con ensalada fresca y arroz integral.', 25000.00, 'Almuerzo', 'Ninguna', (SELECT id FROM proveedor WHERE nombre = 'Sabores del Valle'), (SELECT id FROM sede WHERE nombre = 'Sede Holguines'), (SELECT id FROM ciudad WHERE nombre = 'Cali')),
('Menú de Cena Especial', 'Salmón al horno con vegetales asados y quinua.', 35000.00, 'Cena', 'Sin Lactosa', (SELECT id FROM proveedor WHERE nombre = 'El Sazón Paisa'), (SELECT id FROM sede WHERE nombre = 'Sede Nacional'), (SELECT id FROM ciudad WHERE nombre = 'Medellín'));
```

### 2. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```
VITE_API_URL=http://localhost:3001
GEMINI_API_KEY=TU_CLAVE_API_GEMINI

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=sistema_comidas
```
Asegúrate de reemplazar `TU_CLAVE_API_GEMINI` con tu clave real de la API de Google Gemini.

### 3. Instalación de Dependencias

Navega a la raíz del proyecto e instala todas las dependencias:

```bash
npm install
```

### 4. Ejecutar el Backend

Para iniciar el servidor backend:

```bash
npm run server
```
El servidor se ejecutará en `http://localhost:3001` (o el puerto que configures en `PORT` en tu `.env`).

### 5. Ejecutar el Frontend

En una nueva terminal, navega a la raíz del proyecto y ejecuta la aplicación React:

```bash
npm run dev
```
La aplicación frontend se iniciará en `http://localhost:5173` (o el puerto predeterminado de Vite).

## Uso

Abre tu navegador y accede a la URL donde se está ejecutando el frontend. Comienza a chatear con el asistente virtual para planificar tu reunión. Puedes especificar el tipo de reunión, fecha, hora, número de asistentes, restricciones alimentarias, presupuesto y el nombre del solicitante. El asistente te guiará y proporcionará recomendaciones de menú personalizadas.

## Contribución

Si deseas contribuir a este proyecto, por favor, haz un fork del repositorio y envía un pull request.

## Licencia

Este proyecto está licenciado bajo la licencia MIT.
