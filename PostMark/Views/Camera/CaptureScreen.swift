import CoreLocation
import SwiftUI

struct CaptureScreen: View {
    @State private var camera = CameraService()
    @State private var locationManager = LocationManager()
    @State private var capturedMedia: CapturedMedia?
    @State private var temporaryVideoURL: URL?
    @State private var captureLocation: CLLocation?
    @State private var capturePlace = ResolvedPlace.unavailable
    @State private var alertMessage: String?

    var body: some View {
        ZStack {
            CameraPreviewView(session: camera.session)
                .ignoresSafeArea()
                .overlay(Color.black.opacity(camera.isConfigured ? 0 : 1))

            VStack(spacing: 0) {
                CompassLocationBadge(
                    city: locationManager.resolvedPlace.city,
                    country: locationManager.resolvedPlace.country
                )
                .padding(.top, 12)
                if let locationError = locationManager.errorMessage {
                    Text(locationError)
                        .font(.system(.caption, design: .serif))
                        .padding(.horizontal, 14)
                        .padding(.vertical, 9)
                        .background(.regularMaterial, in: Capsule())
                        .padding(.top, 8)
                }

                Spacer()

                shutterButton
                    .padding(.bottom, 30)
            }
            .padding(.horizontal, 24)
        }
        .preferredColorScheme(.dark)
        .task {
            locationManager.startUpdatingLocation()
            do {
                try await camera.start()
            } catch {
                alertMessage = error.localizedDescription
            }
        }
        .onDisappear {
            camera.stop()
            locationManager.stopUpdatingLocation()
        }
        .sheet(item: $capturedMedia, onDismiss: cleanUpTemporaryVideo) { media in
            StampPreviewSheet(
                media: media,
                location: captureLocation,
                place: capturePlace
            )
        }
        .alert("PostMark", isPresented: alertIsPresented) {
            Button("Entendido", role: .cancel) { alertMessage = nil }
        } message: {
            Text(alertMessage ?? "")
        }
    }

    private var shutterButton: some View {
        Button {
            HapticFeedback.impact(.medium)
            Task { await takePhoto() }
        } label: {
            ZStack {
                Circle()
                    .stroke(Color.white.opacity(0.88), lineWidth: 2)
                    .frame(width: 78, height: 78)
                Circle()
                    .fill(Color(red: 0.98, green: 0.96, blue: 0.92))
                    .frame(width: 62, height: 62)
            }
            .scaleEffect(camera.isCapturing ? 0.92 : 1)
            .animation(.spring(response: 0.24, dampingFraction: 0.58), value: camera.isCapturing)
        }
        .buttonStyle(.plain)
        .disabled(!camera.isConfigured || camera.isCapturing)
        .accessibilityLabel("Tomar fotografía")
    }

    private var alertIsPresented: Binding<Bool> {
        Binding(
            get: { alertMessage != nil },
            set: { if !$0 { alertMessage = nil } }
        )
    }

    @MainActor
    private func takePhoto() async {
        do {
            let media = try await camera.capture()
            temporaryVideoURL = media.motionVideoURL
            let location = locationManager.latestLocation
            captureLocation = location
            if let location {
                let result = await locationManager.reverseGeocode(location: location)
                capturePlace = ResolvedPlace(
                    place: result.place,
                    city: result.city,
                    country: result.country,
                    code: result.code
                )
            } else {
                capturePlace = ResolvedPlace.unavailable
            }
            capturedMedia = media
        } catch {
            alertMessage = error.localizedDescription
        }
    }

    private func cleanUpTemporaryVideo() {
        guard let temporaryVideoURL else { return }
        do {
            try FileManager.default.removeItem(at: temporaryVideoURL)
            self.temporaryVideoURL = nil
        } catch {
            alertMessage = "No se pudo eliminar el archivo temporal: \(error.localizedDescription)"
        }
    }
}
