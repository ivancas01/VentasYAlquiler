# Guía de Inicialización del Proyecto

Esta guía contiene los pasos necesarios para configurar el entorno de desarrollo de `VentasYAlquiler` desde cero.

## Requisitos Previos
- Python 3.10+
- Node.js 18+
- npm o yarn

---

## 1. Configuración del Backend (Django)

Sigue estos pasos para poner en marcha la API:

1. **Navegar a la carpeta del backend:**
   ```powershell
   cd backend
   ```

2. **Crear un entorno virtual:**
   ```powershell
   python -m venv venv
   ```

3. **Activar el entorno virtual:**
   - En Windows (PowerShell):
     ```powershell
     .\venv\Scripts\activate
     ```
   - En macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Instalar dependencias:**
   ```powershell
   pip install -r requirements.txt
   ```

5. **Generar migraciones (Ignoradas en Git):**
   Como las migraciones no se rastrean en el repositorio, debes generarlas localmente por primera vez:
   ```powershell
   python manage.py makemigrations api
   ```

6. **Aplicar migraciones a la base de datos:**
   ```powershell
   python manage.py migrate
   ```

7. **(Opcional) Cargar datos de prueba:**
   Si deseas inicializar la base de datos con algunos productos y un superusuario (`admin`/`admin123`):
   ```powershell
   python manage.py shell < seed.py
   ```

8. **Iniciar el servidor de desarrollo (Accesible en Red Local):**
   ```powershell
   python manage.py runserver 0.0.0.0:8000
   ```
   La API estará disponible en `http://127.0.0.1:8000/` (local) y en `http://192.168.1.17:8000/` (red local).

---

## 2. Configuración del Frontend (React + Vite)

Abre una **nueva terminal** (manteniendo el backend corriendo) y sigue estos pasos:

1. **Asegúrate de estar en la raíz del proyecto:**
   ```powershell
   cd VentasYAlquiler
   ```

2. **Instalar dependencias de Node:**
   ```powershell
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```powershell
   npm run dev
   ```
   El frontend estará disponible en la URL que indique la terminal (usualmente `http://localhost:5173/`).

---

## Notas Adicionales
- **Migraciones:** Si realizas cambios en `backend/api/models.py`, recuerda ejecutar `python manage.py makemigrations` y `python manage.py migrate`. Estos archivos `.py` de migración no se subirán al repositorio.
- **Variables de Entorno:** Si el proyecto crece, considera usar un archivo `.env` para las llaves secretas y configuraciones de DB.
