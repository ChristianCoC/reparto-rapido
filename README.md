# 🚚 RepartoRápido - Control de Envíos y Logística Ligera

Aplicación web progresiva (PWA) móvil, liviana y diseñada para repartidores. Permite escanear paquetes con la cámara, asignarles una ubicación física dentro del vehículo para agilizar la carga, visualizar las paradas en el mapa interactivo y gestionar las entregas tildando y tachando paquetes.

## 🚀 Características Principales

1. **Escáner Integrado:**
   - Detección en tiempo real de **códigos de barras (Code 128, EAN, UPC)** y **códigos QR**.
   - Soporte para cámara trasera de móviles y opción de captura desde fotos o galería.
   - Beep sonoro automático (`Web Audio API`) y respuesta de vibración háptica al escanear.
   - Opción de ingreso manual con teclado.

2. **Organizador del Vehículo (Croquis Interactivo):**
   - Asignación visual por zonas del vehículo:
     - `A1`: Copiloto / Cabina (entregas inmediatas)
     - `B1`: Fila 1 Delante
     - `C1`: Fila 2 Medio
     - `D1`: Puerta Lateral
     - `E1`: Fondo / Baúl
   - Vista gráfica de la furgoneta para filtrar y localizar paquetes al instante.

3. **Mapa Interactivo de Paradas:**
   - Mapa con **OpenStreetMap y Leaflet** (100% gratuito, sin límites ni tarjetas de crédito).
   - Pines numerados con el color de la zona en el vehículo.
   - Botón directo para abrir cada destino en **Google Maps** o **Waze**.

4. **Checklist de Entregas (Tachar / Tildar):**
   - Tildar con un toque para marcar como "Entregado" (con efecto tachado y sonido de confirmación).
   - Marcar incidencias ("Cliente ausente", "Dirección errónea", etc.).
   - Filtros rápidos: *Todos*, *Pendientes*, *Entregados*.

5. **Sin Base de Datos & Cierre de Jornada:**
   - Almacenamiento local en el dispositivo (`localStorage`): no se pierden datos si se apaga la pantalla.
   - Botón de **Cierre de Jornada**: Muestra el porcentaje de efectividad, permite descargar un reporte en texto y limpia todos los datos para dejar la app en blanco para el siguiente día.

---

## 🛠️ Ejecución Local

Para probar la app en tu computadora o en la red local:

```bash
# 1. Iniciar servidor de desarrollo
npm run dev
```

Abre en tu navegador la URL que muestra la consola (por ejemplo `http://localhost:5173`).

---

## ☁️ Despliegue 100% Gratuito (Vercel / Netlify)

Dado que es una aplicación web estática (PWA), puedes subirla en 1 minuto sin costo:

### Opción A: Vercel (Recomendada)
1. Instala el CLI de Vercel si no lo tienes: `npm i -g vercel`
2. Ejecuta en esta carpeta: `vercel`
3. Sigue las instrucciones (enter a todo). Te dará una URL pública HTTPS gratuita lista para usar en cualquier celular.

### Opción B: Netlify
1. Arrastra la carpeta `dist/` a [app.netlify.com/drop](https://app.netlify.com/drop) o conecta el repositorio de GitHub.
