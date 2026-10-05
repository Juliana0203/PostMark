import CoreLocation
import Foundation
import Observation

struct ResolvedPlace {
    let place: String?
    let city: String
    let country: String
    let code: String

    static let unavailable = ResolvedPlace(
        place: nil,
        city: "Ubicación desconocida / Sin conexión",
        country: "Ubicación desconocida / Sin conexión",
        code: ""
    )
}

@Observable
@MainActor
final class LocationManager: NSObject, CLLocationManagerDelegate {
    private(set) var authorizationStatus: CLAuthorizationStatus
    private(set) var latestLocation: CLLocation?
    private(set) var resolvedPlace = ResolvedPlace.unavailable
    private(set) var errorMessage: String?

    private let manager: CLLocationManager
    private let geocoder = CLGeocoder()

    override init() {
        manager = CLLocationManager()
        authorizationStatus = manager.authorizationStatus
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
        manager.distanceFilter = 10
    }

    func requestWhenInUseAuthorization() {
        manager.requestWhenInUseAuthorization()
    }

    func startUpdatingLocation() {
        guard authorizationStatus == .authorizedWhenInUse || authorizationStatus == .authorizedAlways else {
            requestWhenInUseAuthorization()
            return
        }
        manager.startUpdatingLocation()
    }

    func stopUpdatingLocation() {
        manager.stopUpdatingLocation()
    }

    func reverseGeocode(location: CLLocation) async -> (place: String?, city: String, country: String, code: String) {
        do {
            let placemarks = try await geocoder.reverseGeocodeLocation(location)
            guard let placemark = placemarks.first else {
                resolvedPlace = .unavailable
                return (
                    ResolvedPlace.unavailable.place,
                    ResolvedPlace.unavailable.city,
                    ResolvedPlace.unavailable.country,
                    ResolvedPlace.unavailable.code
                )
            }

            let city = placemark.locality ?? placemark.subAdministrativeArea ?? placemark.administrativeArea
                ?? ResolvedPlace.unavailable.city
            let placeName = placemark.areasOfInterest?.first
                ?? placemark.name.flatMap { $0 == city ? nil : $0 }
            let country = placemark.country ?? ResolvedPlace.unavailable.country
            let code = placemark.isoCountryCode ?? ""
            resolvedPlace = ResolvedPlace(place: placeName, city: city, country: country, code: code)
            errorMessage = nil
            return (placeName, city, country, code)
        } catch {
            resolvedPlace = .unavailable
            errorMessage = "No se pudo resolver el lugar. Se guardarán las coordenadas."
            return (
                ResolvedPlace.unavailable.place,
                ResolvedPlace.unavailable.city,
                ResolvedPlace.unavailable.country,
                ResolvedPlace.unavailable.code
            )
        }
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus
        if authorizationStatus == .authorizedWhenInUse || authorizationStatus == .authorizedAlways {
            manager.startUpdatingLocation()
            errorMessage = nil
        } else if authorizationStatus == .denied || authorizationStatus == .restricted {
            errorMessage = "Activa el acceso a ubicación para añadir el matasellos geográfico."
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        latestLocation = location
        Task {
            _ = await reverseGeocode(location: location)
        }
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        errorMessage = "Ubicación no disponible: \(error.localizedDescription). Se conservarán las coordenadas disponibles."
    }
}
