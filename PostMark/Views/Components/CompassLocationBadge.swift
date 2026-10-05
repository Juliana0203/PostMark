import SwiftUI

struct CompassLocationBadge: View {
    let city: String
    let country: String

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: "location.north.circle")
                .font(.system(size: 18, weight: .regular))
                .foregroundStyle(Color(red: 0.78, green: 0.31, blue: 0.28))
            VStack(alignment: .leading, spacing: 2) {
                Text(city)
                    .font(.system(.subheadline, design: .serif).weight(.semibold))
                Text(country)
                    .font(.system(.caption, design: .serif))
                    .foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 15)
        .padding(.vertical, 11)
        .background(.regularMaterial, in: Capsule())
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Ubicación: \(city), \(country)")
    }
}
