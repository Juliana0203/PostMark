import Foundation

/// Datos mínimos de un sello, desacoplados de SwiftData para poder previsualizar y reutilizar las vistas.
struct StampMetadata: Identifiable, Hashable {
    let id: UUID
    let date: Date
    let placeName: String?
    let city: String
    let country: String
    let isoCountryCode: String
    let latitude: Double
    let longitude: Double
}

extension StampMetadata {
    init(_ item: StampItem) {
        self.init(
            id: item.id,
            date: item.timestamp,
            placeName: item.placeName,
            city: item.city,
            country: item.country,
            isoCountryCode: item.isoCountryCode,
            latitude: item.latitude,
            longitude: item.longitude
        )
    }

    var isLocationResolved: Bool {
        !city.isEmpty && city != ResolvedPlace.unavailable.city
    }

    var hasCoordinates: Bool {
        !(latitude == 0 && longitude == 0)
    }

    /// País utilizable, o `nil` si no se pudo resolver.
    var resolvedCountry: String? {
        guard isLocationResolved, !country.isEmpty, country != ResolvedPlace.unavailable.country else { return nil }
        return country
    }

    /// "BOGOTÁ • COLOMBIA", "BOGOTÁ" o "SIN UBICACIÓN".
    var locationLine: String {
        guard isLocationResolved else { return "SIN UBICACIÓN" }
        let cityText = city.uppercased()
        guard let resolvedCountry else { return cityText }
        return "\(cityText) • \(resolvedCountry.uppercased())"
    }

    /// "4°35'N 74°04'W"
    var coordinateString: String? {
        guard hasCoordinates else { return nil }
        let lat = "\(Self.degreesMinutes(abs(latitude)))\(latitude >= 0 ? "N" : "S")"
        let lon = "\(Self.degreesMinutes(abs(longitude)))\(longitude >= 0 ? "E" : "W")"
        return "\(lat) \(lon)"
    }

    /// Fecha en formato postal: día, mes abreviado (español) y año.
    var postalDateLines: (day: String, month: String, year: String) {
        let months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]
        let parts = Calendar(identifier: .gregorian).dateComponents([.year, .month, .day], from: date)
        let month = max(1, min(12, parts.month ?? 1))
        return (
            String(format: "%02d", parts.day ?? 1),
            months[month - 1],
            String(parts.year ?? 1970)
        )
    }

    private static func degreesMinutes(_ value: Double) -> String {
        let totalMinutes = Int((value * 60).rounded())
        return String(format: "%d°%02d'", totalMinutes / 60, totalMinutes % 60)
    }
}
