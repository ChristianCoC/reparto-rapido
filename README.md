# 🚚 RepartoRápido - Control Ágil de Envíos y Organización del Vehículo

Aplicación web progresiva (PWA) móvil, ultra liviana, rápida y diseñada para repartidores. Permite cargar paquetes por código de ruteo (`#HH58`), organizarlos dentro del vehículo (**Copiloto**, **Atrás**, **Baúl**), verificar direcciones en el mapa y tachar entregas en tiempo real.

---

## ⚡ Flujo de Trabajo y Nuevas Funcionalidades

### 1. Carga Rápida con Prefijo Automático del Viaje
* **Autocompletado de Letras del Viaje:** Como las letras no cambian durante el día de reparto, al cargar el primer paquete (ej: `AA01`), la aplicación memoriza el prefijo `AA`. Para los siguientes paquetes, solo necesitas ingresar los números (ej: `02`, `03`) y se autocompleta `#AA02`, `#AA03` al instante. Puedes cambiar o borrar el prefijo con un toque en cualquier momento.
* **Ubicación del Vehículo 100% Fija:** La selección entre **Copiloto**, **Atrás** o **Baúl** se mantiene fija y persistente. Girar la pantalla o cambiar de pestaña jamás cambiará la ubicación a menos que el usuario toque otra opción.
* **Panel Luminoso de Total Cargados:** Medallón de alto contraste y brillo para ver rápidamente la cantidad total de paquetes en el furgón, incluso bajo luz solar directa.

### 2. Control de Entregas (Checklist Numérico + Buscador Rápido)
* **Orden Numérico Estricto:** Los paquetes se ordenan automáticamente de menor a mayor según su numeración (#AA01, #AA02, #AA03, #AA10...), sin importar en qué orden se hayan cargado al auto.
* **Buscador Rápido:** Barra de búsqueda en la parte superior para filtrar cualquier paquete en segundos por número o letras (ej: escribes `15` y filtra directo a `#AA15`).
* **Conteo Exacto en Tiempo Real:** Paneles de **Total**, **Faltan (Pendientes)** y **Listos (Entregados)** con porcentaje de progreso diario.

### 3. Mapa y Verificador de Direcciones
* Autocompletado en tiempo real con sugerencias directas (estilo Google Maps).
* Prioriza resultados cercanos usando tu ubicación GPS.
* Te indica la distancia en km (**🟢 Cerca**, **🔵 Media**, **🟡 Lejos**) con acceso a un toque para navegar en **Google Maps** o **Waze**.

### 4. Cierre de Jornada y Limpieza
* Guarda todo en `localStorage` (sin riesgo de perder nada si se bloquea el teléfono).
* Botón de **Cierre de Jornada**: Muestra el porcentaje de efectividad, permite exportar un reporte en `.txt` y limpia los datos para el día siguiente.

---

## 🚀 Despliegue en Producción
Alojado de forma gratuita en Vercel con HTTPS:
👉 **[https://app-envios-six.vercel.app](https://app-envios-six.vercel.app)**
