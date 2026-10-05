import SwiftUI

/// Anverso estilo postal turística de los 60-70: foto enmarcada en papel marfil, grano y barniz mate.
struct PostcardFrontView: View {
    let image: UIImage
    let metadata: StampMetadata

    var body: some View {
        GeometryReader { proxy in
            let width = proxy.size.width
            let margin = width * 0.035

            ZStack {
                Color(hex: "FBF8F2")

                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
                    .frame(width: width - margin * 2, height: proxy.size.height - margin * 2)
                    .clipped()
                    .overlay {
                        LinearGradient(
                            colors: [.clear, Color.black.opacity(0.45)],
                            startPoint: .center,
                            endPoint: .bottom
                        )
                    }
                    .overlay(alignment: .bottomLeading) {
                        caption(width: width)
                            .padding(width * 0.03)
                    }
                    .overlay { Color.white.opacity(0.05) }
                    .paperGrain(seed: 11)
            }
        }
        .aspectRatio(PostcardLayout.aspectRatio, contentMode: .fit)
    }

    private func caption(width: CGFloat) -> some View {
        VStack(alignment: .leading, spacing: width * 0.004) {
            Text(metadata.isLocationResolved ? metadata.city.uppercased() : "POSTMARK")
                .font(.system(size: width * 0.055, weight: .bold, design: .serif))
                .tracking(width * 0.004)
            if let country = metadata.resolvedCountry {
                Text(country.uppercased())
                    .font(.system(size: width * 0.026, weight: .medium, design: .serif))
                    .tracking(width * 0.006)
            }
        }
        .foregroundStyle(Color.white)
        .shadow(color: Color.black.opacity(0.5), radius: 2, x: 0, y: 1)
    }
}
