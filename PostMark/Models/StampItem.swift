import Foundation
import SwiftData

@Model
final class StampItem {
    var id: UUID
    var timestamp: Date
    var imageFilename: String
    var videoMotionFilename: String?
    var latitude: Double
    var longitude: Double
    var altitude: Double
    var placeName: String?
    var city: String
    var country: String
    var isoCountryCode: String
    var isFavorite: Bool

    init(
        id: UUID = UUID(),
        timestamp: Date = .now,
        imageFilename: String,
        videoMotionFilename: String? = nil,
        latitude: Double,
        longitude: Double,
        altitude: Double,
        placeName: String? = nil,
        city: String,
        country: String,
        isoCountryCode: String,
        isFavorite: Bool = false
    ) {
        self.id = id
        self.timestamp = timestamp
        self.imageFilename = imageFilename
        self.videoMotionFilename = videoMotionFilename
        self.latitude = latitude
        self.longitude = longitude
        self.altitude = altitude
        self.placeName = placeName
        self.city = city
        self.country = country
        self.isoCountryCode = isoCountryCode
        self.isFavorite = isFavorite
    }
}
