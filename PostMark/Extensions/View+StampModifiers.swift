import SwiftUI

/// Generador pseudoaleatorio determinista (SplitMix64) para texturas y desgaste reproducibles.
struct SeededRandom: RandomNumberGenerator {
    private var state: UInt64

    init(seed: UInt64) {
        state = seed
    }

    mutating func next() -> UInt64 {
        state &+= 0x9E37_79B9_7F4A_7C15
        var z = state
        z = (z ^ (z >> 30)) &* 0xBF58_476D_1CE4_E5B9
        z = (z ^ (z >> 27)) &* 0x94D0_49BB_1331_11EB
        return z ^ (z >> 31)
    }
}

extension UUID {
    /// Semilla estable entre ejecuciones (`hashValue` cambia en cada lanzamiento, los bytes no).
    var stableSeed: UInt64 {
        var hash: UInt64 = 0xCBF2_9CE4_8422_2325
        for byte in withUnsafeBytes(of: uuid, { Array($0) }) {
            hash = (hash ^ UInt64(byte)) &* 0x0000_0100_0000_01B3
        }
        return hash
    }

    /// Valor determinista en [0, 1) derivado del UUID; `salt` permite obtener valores independientes.
    func stableUnit(salt: UInt64 = 0) -> Double {
        var generator = SeededRandom(seed: stableSeed ^ (salt &* 0x9E37_79B9_7F4A_7C15))
        return Double.random(in: 0..<1, using: &generator)
    }
}

/// Grano de papel procedural: número fijo de motas en coordenadas relativas, sin parpadeo al redimensionar.
struct PaperGrainView: View {
    var seed: UInt64 = 7

    var body: some View {
        Canvas { context, size in
            var generator = SeededRandom(seed: seed)
            for _ in 0..<500 {
                let x = CGFloat.random(in: 0..<1, using: &generator) * size.width
                let y = CGFloat.random(in: 0..<1, using: &generator) * size.height
                let radius = CGFloat.random(in: 0.3..<0.9, using: &generator)
                let isDark = Bool.random(using: &generator)
                let opacity = Double.random(in: 0.04..<0.12, using: &generator)
                let color = isDark ? Color(hex: "6B5B45") : Color.white
                context.fill(
                    Path(ellipseIn: CGRect(x: x - radius, y: y - radius, width: radius * 2, height: radius * 2)),
                    with: .color(color.opacity(opacity))
                )
            }
        }
        .allowsHitTesting(false)
    }
}

private struct StampFrameModifier: ViewModifier {
    let toothRadius: CGFloat
    let toothSpacing: CGFloat
    let cornerRadius: CGFloat

    func body(content: Content) -> some View {
        let shape = StampBorderShape(
            toothRadius: toothRadius,
            toothSpacing: toothSpacing,
            cornerRadius: cornerRadius
        )
        content
            .background {
                ZStack {
                    shape
                        .fill(Color(hex: "FBF8F2"))
                        .shadow(color: Color.black.opacity(0.12), radius: 4, x: 0, y: 2)
                    PaperGrainView()
                        .clipShape(shape)
                }
            }
            .overlay {
                shape.stroke(Color.black.opacity(0.18), lineWidth: 0.5)
            }
    }
}

extension View {
    /// Fondo de papel marfil con grano, sombra de relieve y trazo fibroso, recortado con `StampBorderShape`.
    func stampFrame(
        toothRadius: CGFloat = 5,
        toothSpacing: CGFloat = 14,
        cornerRadius: CGFloat = 4
    ) -> some View {
        modifier(StampFrameModifier(
            toothRadius: toothRadius,
            toothSpacing: toothSpacing,
            cornerRadius: cornerRadius
        ))
    }

    /// Superpone grano de papel fotográfico fundido con `.multiply`.
    func paperGrain(seed: UInt64 = 7, opacity: Double = 1) -> some View {
        overlay {
            PaperGrainView(seed: seed)
                .opacity(opacity)
                .blendMode(.multiply)
        }
    }
}
