# 🚚 RepartoRápido - Control Ágil de Envíos y Organización del Vehículo

Aplicación web progresiva (PWA) móvil, ultra liviana, rápida y diseñada para repartidores. Permite cargar paquetes por código de ruteo (`#HH58`), organizarlos dentro del vehículo (**Copiloto**, **Atrás**, **Baúl**), verificar direcciones en el mapa y tachar entregas en tiempo real.

---

## ⚡ Flujo de Trabajo

### 1. Carga Rápida de Paquetes
* **Solo el código que importa:** Escribe directamente el código del cartel de ruteo (ej: `#HH58`, `#BD32`). La app auto-agrega el `#` y convierte a mayúsculas automáticamente.
* **3 Ubicaciones del Vehículo:**
  * 🔵 **Copiloto:** Asiento delantero / paquetes de entrega inmediata.
  * 🟢 **Atrás:** Asientos traseros / carga media.
  * 🟡 **Baúl:** Baúl / fondo del vehículo para paradas finales.
* **Carga en 1 segundo:** Mantienes la zona seleccionada, tipeas el código y pulsas `Enter`. El cursor se mantiene listo para el siguiente paquete.

### 2. Mapa y Verificador de Direcciones
* Permite **buscar y ubicar cualquier dirección** rápidamente (ej: *"Av. San Martín 1500, Vicente López"*).
* Muestra si la dirección queda **cerca o lejos** respecto a tu ubicación GPS actual (calcula distancia en km).
* Botones con un toque para abrir la navegación directa en **Google Maps** o **Waze**.

### 3. Control de Entregas (Checklist Confiable)
* Conteo estricto y en tiempo real:
  * **Todos:** Total de paquetes cargados en el vehículo.
  * **Pendientes:** Paquetes que aún faltan entregar.
  * **Entregados:** Paquetes completados.
* Toque en el círculo para **tachar / tildar** el paquete entregado con feedback de vibración y sonido.
* Filtro por ubicación para saber exactamente qué paquetes buscar en el **Copiloto**, **Atrás** o **Baúl**.

### 4. Cierre de Jornada y Limpieza
* Guarda todo en el almacenamiento del navegador (`localStorage`) para que **no se pierdan los datos si se bloquea la pantalla**.
* Botón de **Cierre de Jornada**: Muestra la efectividad del día, permite descargar un resumen en `.txt` y limpia todos los paquetes para dejar la app vacía para el día siguiente.

---

## 🛠️ Tecnologías Utilizadas
* **React 18 + TypeScript + Vite**: Ultra rápido y liviano.
* **Tailwind CSS**: Interfaz táctil de alto contraste para exteriores.
* **Leaflet + OpenStreetMap**: Mapas gratuitos y sin límites de API.
* **PWA**: Instalable en Android y iPhone como app nativa.

---

## 🚀 Despliegue en Producción
Alojado de forma gratuita en Vercel con HTTPS:
👉 **[https://app-envios-six.vercel.app](https://app-envios-six.vercel.app)**
