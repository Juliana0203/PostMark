import SwiftUI

/// Silueta de sello postal: bordes con perforaciones semicirculares distribuidas simétricamente
/// y esquinas ligeramente redondeadas.
public struct StampBorderShape: Shape {
    /// Radio de cada perforación semicircular.
    public var toothRadius: CGFloat
    /// Espaciado entre el centro de dos perforaciones consecutivas.
    public var toothSpacing: CGFloat
    /// Radio de redondeo de las esquinas.
    public var cornerRadius: CGFloat

    public init(toothRadius: CGFloat = 5.0, toothSpacing: CGFloat = 14.0, cornerRadius: CGFloat = 4.0) {
        self.toothRadius = toothRadius
        self.toothSpacing = toothSpacing
        self.cornerRadius = cornerRadius
    }

    public var animatableData: AnimatablePair<CGFloat, AnimatablePair<CGFloat, CGFloat>> {
        get { AnimatablePair(toothRadius, AnimatablePair(toothSpacing, cornerRadius)) }
        set {
            toothRadius = newValue.first
            toothSpacing = newValue.second.first
            cornerRadius = newValue.second.second
        }
    }

    public func path(in rect: CGRect) -> Path {
        var path = Path()
        guard rect.width > 0, rect.height > 0 else { return path }

        let shortSide = min(rect.width, rect.height)
        let corner = min(max(cornerRadius, 0), shortSide / 4)
        let radius = min(max(toothRadius, 0), shortSide / 8)
        let spacing = max(toothSpacing, radius * 2.2, 1)

        let topRight = CGPoint(x: rect.maxX, y: rect.minY)
        let bottomRight = CGPoint(x: rect.maxX, y: rect.maxY)
        let bottomLeft = CGPoint(x: rect.minX, y: rect.maxY)
        let topLeft = CGPoint(x: rect.minX, y: rect.minY)

        path.move(to: CGPoint(x: rect.minX + corner, y: rect.minY))
        addEdge(&path, to: CGPoint(x: rect.maxX - corner, y: rect.minY), inward: CGVector(dx: 0, dy: 1), radius: radius, spacing: spacing)
        path.addQuadCurve(to: CGPoint(x: rect.maxX, y: rect.minY + corner), control: topRight)

        addEdge(&path, to: CGPoint(x: rect.maxX, y: rect.maxY - corner), inward: CGVector(dx: -1, dy: 0), radius: radius, spacing: spacing)
        path.addQuadCurve(to: CGPoint(x: rect.maxX - corner, y: rect.maxY), control: bottomRight)

        addEdge(&path, to: CGPoint(x: rect.minX + corner, y: rect.maxY), inward: CGVector(dx: 0, dy: -1), radius: radius, spacing: spacing)
        path.addQuadCurve(to: CGPoint(x: rect.minX, y: rect.maxY - corner), control: bottomLeft)

        addEdge(&path, to: CGPoint(x: rect.minX, y: rect.minY + corner), inward: CGVector(dx: 1, dy: 0), radius: radius, spacing: spacing)
        path.addQuadCurve(to: CGPoint(x: rect.minX + corner, y: rect.minY), control: topLeft)

        path.closeSubpath()
        return path
    }

    /// Traza un borde desde el punto actual hasta `end`, con perforaciones centradas en cada celda
    /// (media celda libre en los extremos, así el patrón es simétrico y las esquinas quedan limpias).
    private func addEdge(
        _ path: inout Path,
        to end: CGPoint,
        inward: CGVector,
        radius: CGFloat,
        spacing: CGFloat
    ) {
        guard let start = path.currentPoint else { return }
        let dx = end.x - start.x
        let dy = end.y - start.y
        let length = hypot(dx, dy)
        guard length > 0 else { return }

        let ux = dx / length
        let uy = dy / length
        let count = max(1, Int((length / spacing).rounded()))
        let step = length / CGFloat(count)
        let toothRadius = min(radius, step * 0.45)

        if toothRadius > 0 {
            for index in 0..<count {
                let center = (CGFloat(index) + 0.5) * step
                let entry = CGPoint(x: start.x + ux * (center - toothRadius), y: start.y + uy * (center - toothRadius))
                let exit = CGPoint(x: start.x + ux * (center + toothRadius), y: start.y + uy * (center + toothRadius))
                path.addLine(to: entry)
                path.addSemicircle(from: entry, to: exit, bulgeToward: inward)
            }
        }
        path.addLine(to: end)
    }
}
