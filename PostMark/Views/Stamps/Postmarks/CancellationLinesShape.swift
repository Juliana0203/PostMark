import SwiftUI

/// Líneas sinusoidales horizontales que anulan la estampilla, como las de un matasellos real.
struct CancellationLinesShape: Shape {
    var lineCount: Int = 4
    var amplitude: CGFloat = 3
    var wavelength: CGFloat = 22
    var phase: CGFloat = 0

    func path(in rect: CGRect) -> Path {
        var path = Path()
        guard lineCount > 0, rect.width > 0, wavelength > 0 else { return path }

        let step = max(1, wavelength / 12)
        let segments = max(1, Int((rect.width / step).rounded(.up)))

        for line in 0..<lineCount {
            let baseY = rect.minY + rect.height * (CGFloat(line) + 0.5) / CGFloat(lineCount)
            let offset = phase + CGFloat(line) * 0.35
            for segment in 0...segments {
                let x = min(rect.minX + CGFloat(segment) * step, rect.maxX)
                let y = baseY + amplitude * sin(2 * CGFloat.pi * (x - rect.minX) / wavelength + offset)
                if segment == 0 {
                    path.move(to: CGPoint(x: x, y: y))
                } else {
                    path.addLine(to: CGPoint(x: x, y: y))
                }
            }
        }
        return path
    }
}
