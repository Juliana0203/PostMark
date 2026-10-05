# 📮 PostMark (iOS)
> *El pasaporte interactivo donde tus viajes se convierten en estampillas y postales vivas.*

PostMark es una aplicación nativa para iOS diseñada con SwiftUI y AVFoundation. Captura momentos de viaje en tiempo real y los transforma en estampillas de colección y postales interactivas de doble cara con animación natural, textura física y certificación de geolocalización.

---

### ✨ Características Clave (Roadmap General)
- [x] **Fase 1: Captura & Geolocalización:** Obturador con captura Live Motion y geocodificación inversa en tiempo real.
- [x] **Fase 2: Motor de Estampilla & Matasellos:** Bordes troquelados por shader vectorial y sello de tinta desgastada con fecha.
- [ ] **Fase 3: Física & Parallax 3D:** Volteo fluido de postal y respuesta a la inclinación del teléfono con giroscopio.
- [ ] **Fase 4: Pasaporte & Cartografía:** Álbum coleccionable y mapa interactivo de recuerdos fijados por coordenadas.
- [ ] **Fase 5: Compartir & Visor Web:** Exportación en video bucle y enlace web interactivo para compartir por mensajería.

---

### 🛠️ Requisitos Técnicos
- **Plataforma:** iOS 17.0+
- **Lenguaje:** Swift 5.9+ / Swift 6
- **IDE:** Xcode 15.0 o superior
- **Dispositivo recomendado:** iPhone físico (la cámara, el giroscopio y el GPS de alta precisión requieren hardware real).

---

### 🚀 Instalación y Puesta en Marcha
1. Clona el repositorio:
   ```bash
   git clone https://github.com/Juliana0203/PostMark.git
   cd PostMark
   ```
2. Abre el proyecto en Xcode:
   ```bash
   open PostMark.xcodeproj
   ```
3. Selecciona tu equipo de desarrollo en **Signing & Capabilities** (*Team*).
4. Conecta tu iPhone y asegúrate de autorizar los permisos de desarrollador en el dispositivo (`Ajustes > Privacidad y seguridad > Modo de desarrollador`).
5. Compila y ejecuta (`Cmd + R`).

---

### 📂 Arquitectura (Fase 1)
- **SwiftUI + Observation:** Gestión reactiva del estado sin sobrecarga de redibujado.
- **AVFoundation:** Captura simultánea de imagen de alta fidelidad y búfer de movimiento.
- **CoreLocation:** Rastreo geográfico eficiente con resolución inversa de nombres de lugares.
- **SwiftData:** Persistencia local con consultas tipadas y seguras.

### 🎨 Motor gráfico (Fase 2)
- **StampBorderShape:** silueta paramétrica con perforaciones simétricas; los dientes escalan con el ancho del sello.
- **PostmarkStampView:** matasellos vectorial (Canvas) con anillos irregulares, texto arqueado, ondas de cancelación y desgaste determinista por UUID, fundido con .multiply.
- **PostcardContainerView:** postal reversible (toca para voltear) con anverso fotográfico y reverso con estampilla y matasellos.
