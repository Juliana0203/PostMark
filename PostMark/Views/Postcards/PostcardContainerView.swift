import SwiftUI

enum PostcardLayout {
    /// Proporción horizontal clásica de una postal (6 x 4).
    static let aspectRatio: CGFloat = 1.5
}

/// Postal reversible: toca para voltearla entre anverso y reverso.
struct PostcardContainerView: View {
    let image: UIImage
    let metadata: StampMetadata
    var message = ""

    @State private var showsBack = false

    var body: some View {
        FlipContainer(angle: showsBack ? 180 : 0) {
            PostcardFrontView(image: image, metadata: metadata)
                .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))
        } back: {
            PostcardBackView(image: image, metadata: metadata, message: message)
                .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))
        }
        .aspectRatio(PostcardLayout.aspectRatio, contentMode: .fit)
        .shadow(color: Color.black.opacity(0.18), radius: 8, x: 0, y: 4)
        .contentShape(Rectangle())
        .onTapGesture {
            HapticFeedback.impact(.light)
            withAnimation(.spring(response: 0.7, dampingFraction: 0.82)) {
                showsBack.toggle()
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Postal de \(metadata.locationLine)")
        .accessibilityHint(showsBack ? "Toca para ver el anverso" : "Toca para ver el reverso")
        .accessibilityAddTraits(.isButton)
    }
}

/// Elige la cara según el ángulo animado, de modo que el cambio ocurra exactamente a 90°.
private struct FlipContainer<Front: View, Back: View>: View, Animatable {
    var angle: Double
    let front: Front
    let back: Back

    init(angle: Double, @ViewBuilder front: () -> Front, @ViewBuilder back: () -> Back) {
        self.angle = angle
        self.front = front()
        self.back = back()
    }

    var animatableData: Double {
        get { angle }
        set { angle = newValue }
    }

    var body: some View {
        ZStack {
            if angle <= 90 {
                front
            } else {
                back.rotation3DEffect(.degrees(180), axis: (x: 0, y: 1, z: 0))
            }
        }
        .rotation3DEffect(.degrees(angle), axis: (x: 0, y: 1, z: 0), perspective: 0.5)
    }
}
