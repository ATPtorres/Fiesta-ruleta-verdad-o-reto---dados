# ✦ Fiesta Mix

**Tres juegos en una sola aplicación Android.** Proyecto de [ATPtorres](https://github.com/ATPtorres), gratis y completamente **offline**. Sin cuentas, internet, anuncios, servidores ni permisos de micrófono/cámara.

## 📲 Descargar el APK

**[Descargar FiestaMix-Android.apk (última versión)](https://github.com/ATPtorres/Fiesta-ruleta-verdad-o-reto---dados/releases/latest/download/FiestaMix-Android.apk)**

> El enlace estará disponible cuando GitHub Actions haya completado la primera compilación. Como alternativa, abre **Actions → Android APK · Fiesta Mix → última ejecución → Artifacts**.

En Android: descarga el archivo, ábrelo y, si se solicita, concede permiso para instalar aplicaciones de esa fuente. Necesita **Android 7.0 (API 24) o posterior**. Al ser una compilación *debug* para pruebas, es apropiada para instalación personal, no para publicar en Google Play.

## 🎲 1. Lanzamiento de dados

- Elige entre **1 y 100** dados de seis caras.
- Animación de lanzamiento y resultado oculto hasta detenerse.
- **Suma total** visible en la parte superior.
- Dados gráficos con puntos reales del 1 al 6.
- Sorteo uniforme por dado, usando `crypto.getRandomValues` donde está disponible.

## 🎯 2. Ruleta personalizada

- Añade de **2 a 100** opciones con nombres o frases.
- Sectores de colores con la misma probabilidad por opción.
- Giros animados y puntero fijo, resultado en pantalla.
- Al terminar: **conservar o eliminar** la opción ganadora.
- Cuando hay más de 24 opciones, los sectores se numeran y los nombres siguen disponibles en la lista.
- Los cambios se guardan localmente para futuras sesiones.

## 🔥 3. Verdad o reto (18+)

- Añade de **2 a 60** participantes.
- **Dos ruletas apiladas**: arriba, puntero **negro pequeño** para quien pregunta/reta; abajo, puntero **rojo** para quien responde/cumple.
- Selección de dos participantes distintos; se evitan parejas repetidas y papeles repetitivos cuando la cantidad de jugadores lo permite.
- Configura el máximo de **verdades consecutivas** por persona entre 1 y 99. Al llegar al límite, su siguiente turno obliga a elegir **reto** si decide seguir jugando; cualquier persona puede pasar sin castigo.
- Contadores por participante; elegir reto reinicia su contador.
- **240 sugerencias originales**: 120 preguntas y 120 retos en cuatro niveles: suave, fiesta, picante y atrevido.
- Botones de pregunta o reto aleatorio sugerido y posibilidad de inventar uno propio.
- Historial reciente de emparejamientos para reducir repeticiones.
- Mensajes y actividades no explícitos, sin contacto físico obligatorio, apuestas ni ingesta forzada.

### Consentimiento

El juego es solo para adultos. Nadie tiene que responder preguntas íntimas ni cumplir un reto que le incomode. Se puede saltar o cambiar una sugerencia sin penalización. No se proponen retos peligrosos, humillación dañina ni contacto sin consentimiento.

## 🛠️ Proyecto y compilación

Es una aplicación Android liviana construida en **Java + Android WebView** que empaqueta `docs/` como recursos offline. La interfaz usa HTML, CSS, JavaScript y Canvas; no hay servicios externos.

Estructura:

```text
docs/index.html       Interfaz de tres juegos
docs/style.css        Diseño adaptable y animaciones
docs/app.js           Estado, interfaz, lógica de juego
docs/game-utils.js    Azar, ruleta y pares sin repetición
docs/prompts.js       240 sugerencias en 4 niveles
app/                  Contenedor nativo Android
tests/                Pruebas de reglas
.github/workflows/    Compilación Android y publicación APK
```

Abre el repositorio con Android Studio (JDK 17, SDK 35, AGP 8.9.2, Gradle 8.11.1) o usa el flujo de **Actions**. Si tienes Gradle instalado:

```bash
gradle :app:assembleDebug
```

APK: `app/build/outputs/apk/debug/app-debug.apk`. Para pruebas de lógica desde Node.js:

```bash
node --test tests/game-utils.test.cjs
```

También puedes abrir `docs/index.html` en el navegador sin servidor.

## 🔒 Privacidad y transparencia

Los nombres, reglas y contadores se guardan mediante `localStorage` del WebView, **solo en el dispositivo**. El APK no necesita permiso de INTERNET. La precisión del sorteo se basa en un generador aleatorio uniforme; los giros son la **animación del resultado seleccionado**, no un motor físico.
