import SwiftUI

/// Reverso clásico: mensaje a la izquierda, divisoria central, estampilla con matasellos y líneas de destino.
struct PostcardBackView: View {
    let image: UIImage
    let metadata: StampMetadata
    var message = ""

    private let ink = Color(hex: "1F2D50")

    var body: some View {
        GeometryReader { proxy in
            let width = proxy.size.width
            let height = proxy.size.height
            let padding = width * 0.05

            ZStack {
                Color(hex: "FBF8F2")
                PaperGrainView(seed: 21)

                HStack(spacing: 0) {
                    messageColumn(width: width, height: height)
                        .padding(.trailing, padding * 0.6)
                    Rectangle()
                        .fill(ink.opacity(0.45))
                        .frame(width: 1)
                    addressColumn(width: width, height: height)
                        .padding(.leading, padding * 0.8)
                }
                .padding(padding)
            }
        }
        .aspectRatio(PostcardLayout.aspectRatio, contentMode: .fit)
    }

    private func messageColumn(width: CGFloat, height: CGFloat) -> some View {
        let lineHeight = height * 0.085
        let fontSize = lineHeight * 0.62

        return ZStack(alignment: .topLeading) {
            Canvas { context, size in
                var y = lineHeight
                while y < size.height {
                    context.fill(
                        Path(CGRect(x: 0, y: y, width: size.width, height: 0.6)),
                        with: .color(ink.opacity(0.18))
                    )
                    y += lineHeight
                }
            }
            Text(message.isEmpty ? "Escribe una nota de viaje…" : message)
                .font(.custom("Bradley Hand", size: fontSize))
                .lineSpacing(lineHeight - fontSize * 1.2)
                .foregroundStyle(ink.opacity(message.isEmpty ? 0.35 : 0.9))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    private func addressColumn(width: CGFloat, height: CGFloat) -> some View {
        let stampWidth = width * 0.17
        let stampHeight = stampWidth / StampThumbnailView.Proportion.portrait.ratio
        let tilt = (1 + metadata.id.stableUnit(salt: 4)) * (metadata.id.stableUnit(salt: 5) < 0.5 ? -1 : 1)
        let postmarkDiameter = stampWidth * 1.05

        return VStack(alignment: .trailing, spacing: 0) {
            ZStack(alignment: .topTrailing) {
                StampThumbnailView(image: image, metadata: metadata)
                    .frame(width: stampWidth, height: stampHeight)
                    .rotationEffect(.degrees(tilt))

                PostmarkStampView(metadata: metadata)
                    .frame(width: postmarkDiameter * 1.9)
                    .offset(x: -stampWidth * 0.3, y: stampHeight * 0.3)
            }
            .frame(maxWidth: .infinity, alignment: .trailing)

            Spacer(minLength: height * 0.04)

            addressLines(width: width, height: height)
        }
    }

    private func addressLines(width: CGFloat, height: CGFloat) -> some View {
        let texts = [
            metadata.coordinateString ?? "",
            metadata.isLocationResolved ? metadata.locationLine : "",
            "",
            ""
        ]

        return VStack(spacing: height * 0.085) {
            ForEach(texts.indices, id: \.self) { index in
                ZStack(alignment: .bottomLeading) {
                    Rectangle()
                        .fill(ink.opacity(0.35))
                        .frame(height: 0.7)
                    Text(texts[index])
                        .font(.system(size: width * 0.021, design: .monospaced))
                        .foregroundStyle(ink.opacity(0.7))
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                        .padding(.bottom, 2)
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding(.bottom, height * 0.02)
    }
}
