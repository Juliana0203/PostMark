import SwiftUI

enum PostmarkInk {
    case charcoal
    case crimson

    var color: Color {
        switch self {
        case .charcoal: Color(hex: "2B2B2A")
        case .crimson: Color(hex: "6A1B29")
        }
    }
}

/// Matasellos vectorial: anillos irregulares, texto arqueado, fecha central, ondas de cancelación
/// y desgaste de tinta. Se funde con la superficie inferior mediante `.multiply`.
///
/// Con `showsCancellation` el lienzo es 1.9:1 y el círculo ocupa el extremo derecho;
/// la rotación se aplica alrededor del centro del círculo.
struct PostmarkStampView: View {
    let metadata: StampMetadata
    var ink: PostmarkInk = .charcoal
    var showsCancellation = true
    var inkOpacity = 0.85
    var appliesStampRotation = true

    private static let cancellationSpan: CGFloat = 0.9

    private var aspect: CGFloat {
        showsCancellation ? 1 + Self.cancellationSpan : 1
    }

    private var rotation: Angle {
        appliesStampRotation ? .degrees(-12 + 27 * metadata.id.stableUnit(salt: 1)) : .zero
    }

    var body: some View {
        Canvas { context, size in
            drawPostmark(&context, size: size)
        }
        .aspectRatio(aspect, contentMode: .fit)
        .rotationEffect(rotation, anchor: UnitPoint(x: 1 - 0.5 / aspect, y: 0.5))
        .opacity(inkOpacity)
        .blendMode(.multiply)
        .allowsHitTesting(false)
        .accessibilityElement()
        .accessibilityLabel("Matasellos de \(metadata.locationLine)")
    }

    private func drawPostmark(_ context: inout GraphicsContext, size: CGSize) {
        let diameter = min(size.height, size.width / aspect)
        guard diameter > 0 else { return }

        let center = CGPoint(x: size.width - diameter / 2, y: size.height / 2)
        let radius = diameter / 2 * 0.95
        let innerRadius = radius * 0.68
        let innerCenter = CGPoint(x: center.x + radius * 0.012, y: center.y - radius * 0.01)
        let color = ink.color
        let seed = metadata.id.stableSeed
        let coordinates = metadata.coordinateString ?? "POSTMARK"

        context.drawLayer { layer in
            layer.stroke(
                ring(center: center, radius: radius, jitter: radius * 0.012, seed: seed),
                with: .color(color),
                style: StrokeStyle(lineWidth: radius * 0.06, lineCap: .round, lineJoin: .round)
            )
            layer.stroke(
                ring(center: innerCenter, radius: innerRadius, jitter: radius * 0.01, seed: seed ^ 0xA5A5),
                with: .color(color),
                style: StrokeStyle(lineWidth: radius * 0.032, lineCap: .round, lineJoin: .round)
            )

            let textRadius = (radius + innerRadius) / 2
            drawArcText(&layer, metadata.locationLine, center: center, radius: textRadius,
                        fontSize: radius * 0.17, maxSpan: 4.4, isTop: true, color: color)
            drawArcText(&layer, coordinates, center: center, radius: textRadius,
                        fontSize: radius * 0.15, maxSpan: 3.2, isTop: false, color: color)

            drawDate(&layer, center: innerCenter, radius: innerRadius, color: color)

            if showsCancellation {
                let lines = CGRect(
                    x: 0,
                    y: center.y - diameter * 0.28,
                    width: max(0, center.x - radius * 0.92),
                    height: diameter * 0.56
                )
                let path = CancellationLinesShape(
                    lineCount: 4,
                    amplitude: diameter * 0.035,
                    wavelength: diameter * 0.22
                ).path(in: lines)
                layer.stroke(
                    path,
                    with: .linearGradient(
                        Gradient(colors: [color.opacity(0.25), color]),
                        startPoint: CGPoint(x: lines.minX, y: lines.midY),
                        endPoint: CGPoint(x: lines.maxX, y: lines.midY)
                    ),
                    style: StrokeStyle(lineWidth: diameter * 0.028, lineCap: .round)
                )
            }

            // Desgaste: se borra tinta con motas y arañazos deterministas.
            layer.blendMode = .destinationOut
            var generator = SeededRandom(seed: seed ^ 0x5EED)
            for _ in 0..<320 {
                let x = CGFloat.random(in: 0..<size.width, using: &generator)
                let y = CGFloat.random(in: 0..<size.height, using: &generator)
                let speckle = diameter * CGFloat.random(in: 0.002..<0.016, using: &generator)
                let strength = Double.random(in: 0.5..<1, using: &generator)
                layer.fill(
                    Path(ellipseIn: CGRect(x: x - speckle, y: y - speckle, width: speckle * 2, height: speckle * 2)),
                    with: .color(Color.black.opacity(strength))
                )
            }
            for _ in 0..<5 {
                let start = CGPoint(
                    x: CGFloat.random(in: 0..<size.width, using: &generator),
                    y: CGFloat.random(in: 0..<size.height, using: &generator)
                )
                let angle = CGFloat.random(in: 0..<(2 * CGFloat.pi), using: &generator)
                let length = diameter * 0.2
                var scratch = Path()
                scratch.move(to: start)
                scratch.addLine(to: CGPoint(x: start.x + cos(angle) * length, y: start.y + sin(angle) * length))
                layer.stroke(scratch, with: .color(Color.black), lineWidth: diameter * 0.006)
            }
        }
    }

    private func drawDate(_ layer: inout GraphicsContext, center: CGPoint, radius: CGFloat, color: Color) {
        let date = metadata.postalDateLines
        let rows: [(text: String, offset: CGFloat, scale: CGFloat)] = [
            (date.day, -0.56, 0.27),
            (date.month, 0, 0.34),
            (date.year, 0.56, 0.26)
        ]
        for row in rows {
            let resolved = layer.resolve(
                Text(row.text)
                    .font(.system(size: radius * row.scale, weight: .bold, design: .monospaced))
                    .foregroundColor(color)
            )
            layer.draw(resolved, at: CGPoint(x: center.x, y: center.y + radius * row.offset), anchor: .center)
        }

        for offset in [-0.27, 0.27] as [CGFloat] {
            let half = radius * (1 - offset * offset).squareRoot() * 0.97
            var rule = Path()
            rule.move(to: CGPoint(x: center.x - half, y: center.y + radius * offset))
            rule.addLine(to: CGPoint(x: center.x + half, y: center.y + radius * offset))
            layer.stroke(rule, with: .color(color), lineWidth: radius * 0.04)
        }
    }

    /// Dibuja el texto carácter a carácter sobre un arco centrado arriba (`isTop`) o abajo.
    /// Usa fuente monoespaciada, por lo que el ancho de cada glifo es predecible.
    private func drawArcText(
        _ layer: inout GraphicsContext,
        _ text: String,
        center: CGPoint,
        radius: CGFloat,
        fontSize: CGFloat,
        maxSpan: CGFloat,
        isTop: Bool,
        color: Color
    ) {
        let characters = Array(text)
        guard !characters.isEmpty, radius > 0 else { return }

        let advanceRatio: CGFloat = 0.68
        let count = CGFloat(characters.count)
        let fitted = min(fontSize, maxSpan * radius / (count * advanceRatio))
        let step = fitted * advanceRatio / radius
        let span = step * count

        for (index, character) in characters.enumerated() where character != " " {
            let angle = -span / 2 + (CGFloat(index) + 0.5) * step
            let position: CGPoint
            let rotation: CGFloat
            if isTop {
                position = CGPoint(x: center.x + radius * sin(angle), y: center.y - radius * cos(angle))
                rotation = angle
            } else {
                position = CGPoint(x: center.x + radius * sin(angle), y: center.y + radius * cos(angle))
                rotation = -angle
            }

            let glyph = layer.resolve(
                Text(String(character))
                    .font(.system(size: fitted, weight: .bold, design: .monospaced))
                    .foregroundColor(color)
            )
            var glyphContext = layer
            glyphContext.translateBy(x: position.x, y: position.y)
            glyphContext.rotate(by: .radians(Double(rotation)))
            glyphContext.draw(glyph, at: .zero, anchor: .center)
        }
    }

    /// Anillo con deformación suave y determinista, para que no parezca un círculo perfecto.
    private func ring(center: CGPoint, radius: CGFloat, jitter: CGFloat, seed: UInt64) -> Path {
        var generator = SeededRandom(seed: seed)
        let phaseA = CGFloat.random(in: 0..<(2 * CGFloat.pi), using: &generator)
        let phaseB = CGFloat.random(in: 0..<(2 * CGFloat.pi), using: &generator)
        let steps = 180

        var path = Path()
        for step in 0...steps {
            let t = 2 * CGFloat.pi * CGFloat(step) / CGFloat(steps)
            let r = radius + jitter * (0.6 * sin(3 * t + phaseA) + 0.4 * sin(5 * t + phaseB))
            let point = CGPoint(x: center.x + r * cos(t), y: center.y + r * sin(t))
            if step == 0 {
                path.move(to: point)
            } else {
                path.addLine(to: point)
            }
        }
        path.closeSubpath()
        return path
    }
}
