import SwiftUI

/// Estampilla completa: foto recortada con perforaciones, filete impreso interior y pie de valor.
/// Todas las medidas derivan del ancho, así que se ve armónica desde 80 pt hasta pantalla completa.
struct StampThumbnailView: View {
    enum Proportion {
        case portrait
        case square

        var ratio: CGFloat {
            switch self {
            case .portrait: 0.75
            case .square: 1
            }
        }
    }

    let image: UIImage
    let metadata: StampMetadata
    var proportion: Proportion = .portrait
    var showsPostmark = false
    var caption = "POSTMARK AIR MAIL"

    private let ink = Color(hex: "1F2D50")

    private var denomination: String {
        let values = ["€ 1.20", "$ 500", "£ 0.80", "¥ 120", "$ 2.50"]
        let index = Int(metadata.id.stableUnit(salt: 3) * Double(values.count)) % values.count
        return values[index]
    }

    var body: some View {
        GeometryReader { proxy in
            let width = proxy.size.width
            let toothRadius = width * 0.028
            let filletInset = toothRadius * 2.2
            let contentInset = filletInset + toothRadius * 0.8

            VStack(spacing: 0) {
                Color.clear
                    .overlay {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFill()
                    }
                    .clipped()
                footer(width: width)
            }
            .padding(contentInset)
            .frame(width: proxy.size.width, height: proxy.size.height)
            .overlay {
                Rectangle()
                    .inset(by: filletInset)
                    .stroke(ink.opacity(0.7), lineWidth: max(0.5, width * 0.004))
            }
            .stampFrame(
                toothRadius: toothRadius,
                toothSpacing: toothRadius * 2.8,
                cornerRadius: toothRadius * 0.8
            )
            .overlay(alignment: .bottomTrailing) {
                if showsPostmark {
                    PostmarkStampView(metadata: metadata)
                        .frame(width: width * 0.9)
                        .offset(x: width * 0.12, y: width * 0.1)
                }
            }
        }
        .aspectRatio(proportion.ratio, contentMode: .fit)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Estampilla de \(metadata.locationLine)")
    }

    private func footer(width: CGFloat) -> some View {
        VStack(alignment: .leading, spacing: width * 0.006) {
            Text(caption)
                .font(.system(size: width * 0.03, weight: .semibold, design: .monospaced))
                .tracking(width * 0.004)
                .foregroundStyle(ink.opacity(0.75))
            HStack(alignment: .firstTextBaseline) {
                Text(metadata.resolvedCountry ?? metadata.city)
                    .font(.system(size: width * 0.052, weight: .semibold, design: .serif))
                    .lineLimit(1)
                    .minimumScaleFactor(0.5)
                Spacer(minLength: width * 0.02)
                Text(denomination)
                    .font(.system(size: width * 0.058, weight: .bold, design: .serif))
                    .lineLimit(1)
            }
            .foregroundStyle(ink)
        }
        .padding(.top, width * 0.025)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
