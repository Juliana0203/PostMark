import SwiftUI

extension Path {
    /// Añade un semicírculo entre `start` y `end` que se abomba hacia `normal` (vector unitario).
    /// Se construye con dos curvas Bézier cúbicas para evitar ambigüedades de sentido de giro de `addArc`.
    mutating func addSemicircle(from start: CGPoint, to end: CGPoint, bulgeToward normal: CGVector) {
        let dx = end.x - start.x
        let dy = end.y - start.y
        let radius = hypot(dx, dy) / 2
        guard radius > 0 else { return }

        let direction = CGVector(dx: dx / (2 * radius), dy: dy / (2 * radius))
        let center = CGPoint(x: (start.x + end.x) / 2, y: (start.y + end.y) / 2)
        let apex = CGPoint(x: center.x + normal.dx * radius, y: center.y + normal.dy * radius)
        let k = radius * 0.5522847498

        addCurve(
            to: apex,
            control1: CGPoint(x: start.x + normal.dx * k, y: start.y + normal.dy * k),
            control2: CGPoint(x: apex.x - direction.dx * k, y: apex.y - direction.dy * k)
        )
        addCurve(
            to: end,
            control1: CGPoint(x: apex.x + direction.dx * k, y: apex.y + direction.dy * k),
            control2: CGPoint(x: end.x + normal.dx * k, y: end.y + normal.dy * k)
        )
    }
}
