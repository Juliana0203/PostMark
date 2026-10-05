# 📮 PostMark
> *El pasaporte interactivo donde tus viajes se convierten en estampillas y postales vivas.*

PostMark captura momentos de viaje en tiempo real y los transforma en **estampillas de colección** y **postales de doble cara**, certificadas con la geolocalización exacta del lugar y un matasellos vintage. Las creaciones se guardan en un **pasaporte digital**, se ubican en un **mapa de recuerdos** y se pueden **compartir** como imagen.

El repositorio contiene dos implementaciones:

| Carpeta | Descripción | Estado |
|---|---|---|
| [`postmark-app/`](./postmark-app) | **App principal**: React Native + Expo + TypeScript. Se prueba en un iPhone con Expo Go desde Windows, Linux o macOS. | Fases 1 a 5 implementadas |
| [`PostMark/`](./PostMark) y [`PostMark.xcodeproj/`](./PostMark.xcodeproj) | Prototipo nativo iOS en SwiftUI (Fases 1 y 2): captura, geolocalización, SwiftData, estampilla perforada, matasellos y postal reversible. | Fases 1 y 2; no compilado en este entorno |

Este documento describe principalmente la app Expo. El prototipo SwiftUI se resume al final.

---

## ✨ Roadmap y estado

- [x] **Fase 1: Captura y geolocalización.** Cámara a pantalla completa, GPS de alta precisión, geocodificación inversa (lugar, ciudad, país), háptica y vista previa antes de guardar.
- [x] **Fase 2: Motor gráfico.** Estampilla con borde perforado (SVG), matasellos vintage con tinta desgastada y ondas de cancelación, y postal reversible.
- [x] **Fase 3: Física y parallax.** Volteo 3D por gesto, inclinación con giroscopio, brillo especular dinámico y coreografía háptica.
- [x] **Fase 4: Pasaporte y cartografía.** Álbum por países, mapa de recuerdos con pines de estampilla y navegación por pestañas.
- [x] **Fase 5: Exportar y compartir.** Captura PNG en alta resolución, menú nativo de compartir y guardado en Fotos.

> **Nota de validación:** el código se desarrolló sin acceso a un iPhone. Pasa `tsc --noEmit` en modo estricto y `expo export --platform ios`, pero la cámara, el GPS, el giroscopio, los hápticos, el mapa, el compartir y el guardado en Fotos están **pendientes de probar en un dispositivo físico**.

---

## 🛠️ Requisitos

- Node.js 20 o superior (probado con 24) y npm.
- **Expo Go** actualizado en el iPhone. El proyecto usa Expo SDK 57, así que Expo Go debe ser una versión compatible.
- iPhone físico: la cámara, el GPS y el giroscopio requieren hardware real.
- El iPhone y el ordenador deben estar en la misma red Wi-Fi.

## 🚀 Puesta en marcha

```bash
git clone https://github.com/Juliana0203/PostMark.git
cd PostMark/postmark-app
npm install
npx expo start
```

Escanea el código QR con la cámara del iPhone y ábrelo con **Expo Go**. Concede los permisos de cámara, ubicación y (al guardar) fototeca.

Comprobaciones útiles:

```bash
npx tsc --noEmit                                   # tipado estricto
npx expo export --platform ios --output-dir /tmp/x # verifica que el bundle compila
```

---

## 📱 Cómo se usa

1. **Cámara:** apunta y pulsa el obturador (doble anillo). Vibra, toma la foto y obtiene la ubicación en ese instante. El encabezado muestra la ciudad actual en vivo y el número de sellos guardados.
2. **Vista previa:** alterna entre **Estampilla** (foto perforada con su matasellos) y **Postal**. Pulsa **Coleccionar** para guardar o **Descartar** para volver. "Abrir visor interactivo" abre la postal en grande.
3. **Pasaporte:** álbum agrupado por país. Toca un sello para abrir su postal; mantén pulsado para eliminarlo.
4. **Mapa:** cada recuerdo es un pin con la miniatura de la foto. Al tocarlo aparece una tarjeta con lugar, fecha y el botón **Abrir**.
5. **Visor de postal:** desliza para voltear, inclina el teléfono para ver el brillo, escribe una nota en el dorso, y usa **Compartir** o **Guardar en Fotos**.

---

## 🧱 Fases en detalle

### Fase 1 — Captura y geolocalización
- `CameraScreen` usa `CameraView` de `expo-camera`. Al disparar: háptico medio, `takePictureAsync({ quality: 0.85 })` y posición GPS en paralelo.
- `locationService` pide permiso en tiempo de ejecución, lee la posición con precisión alta y resuelve lugar, ciudad, país y código ISO con `reverseGeocodeAsync`. Si falla la red, devuelve **"Ubicación Desconocida"** sin interrumpir el flujo y conserva las coordenadas.
- Sin permiso de ubicación la captura continúa con coordenadas `0, 0`. El resto de la app trata ese valor como "sin ubicación": no muestra coordenadas falsas ni dibuja el pin en el mapa.
- `storageService` copia la imagen al directorio de documentos y guarda el listado como JSON en AsyncStorage (`@postmark_stamps`).

### Fase 2 — Motor gráfico (SVG)
- **`StampPerforatedBorder`:** contorno rectangular con muescas semicirculares simétricas centradas en cada celda; recorta la foto con un `ClipPath`. Parámetros: `width`, `height`, `toothRadius` (4.5), `toothSpacing` (12), `fillColor` (`#FAF7F2`).
- **`StampCard`:** estampilla montada con margen de papel, filete interior de 1 px y pie `POSTMARK • PAÍS` con una denominación ficticia estable. Todas las medidas derivan del ancho, así que escala igual en miniatura que en grande.
- **`VintagePostmark`:** anillos punteados, ciudad y país en arco, coordenadas en arco inferior, fecha postal (`05 OCT 2026`) entre dos líneas y tres ondas de cancelación. El desgaste es una máscara de motas y arañazos. Rotación entre −12° y +12° y desgaste **deterministas** a partir de una semilla (`id` o fecha), para que el sello se vea igual cada vez.
- **`PostcardFront` / `PostcardBack` / `PostcardCard`:** frente con marco blanco y destino en serif; dorso con división central, nota de viaje, líneas de dirección, estampilla inclinada y matasellos superpuesto.

### Fase 3 — Física, giroscopio y háptica
- **`InteractivePostcard`:** `Gesture.Pan` + `Gesture.Tap` (Gesture Handler) y Reanimated. El arrastre sigue al dedo con resistencia; al soltar completa el giro si supera el 30 % del ancho o la velocidad horizontal es alta, con `withSpring({ damping: 14, stiffness: 90 })`. Usa `perspective: 1200` y `backfaceVisibility: 'hidden'`; el dorso no se ve en espejo.
- **`useDeviceTilt`:** `DeviceMotion` a 16 ms, filtro de paso bajo + resorte. Expone `tiltX` (±6°), `tiltY` (±8°) y `glarePosition` (0–100). Se suscribe solo cuando la postal está activa y la app en primer plano.
- **`PostcardSheenOverlay`:** banda de luz `rgba(255,255,255,0.18)` que se mueve en sentido opuesto a la inclinación.
- **`AnimatedInkStamp`:** el matasellos "cae" con escala 1.6 → 1 y un golpe háptico fuerte al tocar 1.0.
- **Háptica:** ligera al cruzar los 90°, media al asentar la tarjeta, fuerte al estampar.

### Fase 4 — Pasaporte, mapa y navegación
- **`storageService`:** `getAllStamps`, `getStampsByCountry`, `updateStampNote`, `updateStamp`, `deleteStamp` (borra también la foto). Las escrituras se encadenan para evitar condiciones de carrera.
- **`PassportView`:** fondo `#F4EEDD`, secciones por país, cuadrícula de 2 columnas, estado vacío con botón para tomar la primera foto.
- **`WorldMapView`:** `react-native-maps` (Apple Maps en iOS, sin clave). Se centra en la última ubicación y encuadra todos los pines. Los pines son miniaturas de la foto con marco.
- **`MainNavigator`:** barra flotante con Cámara, Pasaporte y Mapa, `Haptics.selectionAsync()` al cambiar y fundido con Reanimated. Solo la pestaña activa está montada, lo que ahorra batería.

### Fase 5 — Exportar y compartir
- **`shareService`:** `captureViewAsImage` (PNG temporal con `react-native-view-shot`, ×3 sobre el tamaño lógico), `sharePostcardImage` (`expo-sharing`) y `saveToPhotoLibrary` (`expo-media-library`, solo permiso de escritura).
- **`ExportPostcardCanvas`:** lienzo apaisado 700×340 (frente con estampilla + dorso con nota, matasellos y coordenadas) sobre papel `#FAF7EE`. Se monta fuera de pantalla en el visor.
- **`PostcardActionsBar`:** botones **Compartir** y **Guardar en Fotos** con estado de carga, bloqueo de doble pulsación, aviso con acceso a Ajustes si se rechaza el permiso, y borrado del archivo temporal.

---

## 🗂️ Estructura de `postmark-app/`

```text
postmark-app/
├── App.tsx                         # Raíz: GestureHandlerRootView + SafeAreaProvider + MainNavigator
├── app.json                        # Permisos y plugins de Expo
└── src/
    ├── types/stamp.ts              # StampLocation, StampItem (StampRecord)
    ├── services/
    │   ├── locationService.ts      # Permisos, GPS, geocodificación inversa
    │   ├── storageService.ts       # Imágenes + JSON en AsyncStorage (CRUD)
    │   └── shareService.ts         # Captura PNG, compartir, guardar en Fotos
    ├── hooks/useDeviceTilt.ts      # Inclinación suavizada del dispositivo
    ├── navigation/MainNavigator.tsx
    ├── screens/
    │   ├── CameraScreen.tsx
    │   ├── PassportView.tsx
    │   ├── WorldMapView.tsx
    │   └── PostcardViewerScreen.tsx
    ├── components/
    │   ├── CameraHeader.tsx, CaptureButton.tsx, StampPreviewModal.tsx
    │   ├── stamps/    StampPerforatedBorder, StampCard, VintagePostmark, AnimatedInkStamp
    │   └── postcards/ PostcardFront, PostcardBack, PostcardCard, InteractivePostcard,
    │                  PostcardSheenOverlay, ExportPostcardCanvas, PostcardActionsBar
    └── utils/  coordinateFormatter.ts, dateFormatter.ts, seededRandom.ts
```

## 🧩 Modelo de datos

```ts
interface StampLocation {
  latitude: number; longitude: number; altitude?: number | null;
  placeName?: string | null; city: string; country: string; isoCountryCode?: string | null;
}
interface StampItem {
  id: string; timestamp: string /* ISO */; imageUri: string;
  location: StampLocation; isFavorite: boolean; note?: string;
}
```

Las fotos viven en `documentDirectory/stamps/<id>.<ext>` y el listado (más reciente primero) en AsyncStorage bajo `@postmark_stamps`. Todo es local: no hay servidor ni cuenta.

## 🔐 Permisos

| Permiso | Cuándo se pide | Texto |
|---|---|---|
| Cámara | Al abrir la app | "PostMark necesita acceso a tu cámara para capturar los momentos que convertirás en estampillas y postales de viaje." |
| Ubicación (en uso) | Al abrir la app | "PostMark utiliza tu ubicación en tiempo real para certificar y registrar el lugar exacto en el matasellos de tu estampilla." |
| Fotos (solo escritura) | Al pulsar "Guardar en Fotos" | "PostMark guarda tus postales en tu fototeca." |

## 📦 Tecnologías

Expo SDK 57 · React Native 0.86 · TypeScript (`strict`) · `expo-camera` · `expo-location` · `expo-haptics` · `expo-file-system` · `expo-sensors` · `expo-linear-gradient` · `expo-sharing` · `expo-media-library` · `react-native-svg` · `react-native-reanimated` 4 + `react-native-worklets` · `react-native-gesture-handler` · `react-native-maps` · `react-native-view-shot` · `@react-native-async-storage/async-storage`.

## ⚠️ Limitaciones conocidas

- Sin probar en dispositivo físico (ver nota de validación).
- El modo de mezcla `multiply` del matasellos no existe en React Native; se simula con opacidad.
- El signo de los giros del gesto y del brillo del giroscopio puede requerir un ajuste tras la primera prueba.
- Los pines del mapa muestran la foto, no el sello perforado completo.
- No hay captura de micro-video ("Live Motion") en la versión Expo.
- Guardar en Fotos desde Expo Go puede requerir un build de desarrollo si iOS restringe los permisos de fototeca.

---

## 🍎 Prototipo nativo SwiftUI (`PostMark/`)

Implementación paralela en Swift 5.9+ / iOS 17+ con SwiftData, AVFoundation y CoreLocation. Incluye:

- **Fase 1:** `CameraService` (foto + clip de micro-movimiento), `LocationManager` con `reverseGeocode`, `StampItem` (`@Model`), `StorageManager` y `CaptureScreen` con hoja de vista previa.
- **Fase 2:** `StampBorderShape`, `PostmarkStampView` (Canvas), `CancellationLinesShape`, `StampThumbnailView` y las vistas de postal reversible, más extensiones (`Path+Arc`, `View+StampModifiers`, `Color+Hex`).

Para abrirlo hace falta macOS con Xcode 15+: `open PostMark.xcodeproj`, elegir el equipo en *Signing & Capabilities* y ejecutar en un iPhone. No se pudo compilar en el entorno de desarrollo (Windows), por lo que su validación se limitó a revisión de código y comprobación de la estructura del proyecto.
## Remasterización sensorial

- **HolographicShine**: foil dorado/tornasol sobre la estampilla (vista previa) que se desplaza y rota con la inclinación (`useDeviceTilt`).
- **`soundService`**: `playStampThud` (Heavy), `playPaperRustle` (Light) y `playShutterClick` (Medium), cada uno con su sonido y háptico. Usa **`expo-audio`** porque `expo-av` ya no existe en Expo SDK 57. Los WAV de `assets/sounds` están sintetizados y se pueden reemplazar por otros.
- **`StickerDropView`**: al coleccionar, la app salta al Pasaporte y la nueva estampilla cae (escala 1.15 → 1, sombra → suave, resorte muy amortiguado) con el golpe de sello al impactar.
- Sin probar en dispositivo; la intensidad del foil puede requerir ajuste.
