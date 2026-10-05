import CoreLocation
import SwiftData
import SwiftUI
import UIKit

struct StampPreviewSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext

    let media: CapturedMedia
    let location: CLLocation?
    let place: ResolvedPlace

    @State private var isSaving = false
    @State private var saveError: String?

    private let storage = StorageManager()
    private let paper = Color(red: 0.976, green: 0.965, blue: 0.941)
    private let ink = Color(red: 0.12, green: 0.18, blue: 0.31)

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    Text("Tu nuevo recuerdo")
                        .font(.system(size: 30, weight: .regular, design: .serif))
                        .foregroundStyle(ink)

                    if let image = UIImage(data: media.imageData) {
                        StampThumbnailView(image: image, metadata: metadata, showsPostmark: true)
                            .frame(width: 240)
                            .frame(maxWidth: .infinity)
                    }

                    VStack(alignment: .leading, spacing: 12) {
                        Label(place.place ?? place.city, systemImage: "mappin.and.ellipse")
                            .font(.system(.title3, design: .serif).weight(.medium))
                        Text("\(place.city), \(place.country)")
                            .font(.system(.subheadline, design: .serif))
                            .foregroundStyle(.secondary)
                        if let location {
                            Text(String(format: "%.5f°, %.5f°  ·  %.0f m", location.coordinate.latitude, location.coordinate.longitude, location.altitude))
                                .font(.system(.caption, design: .monospaced))
                                .foregroundStyle(.secondary)
                        } else {
                            Text("Coordenadas no disponibles")
                                .font(.system(.caption, design: .monospaced))
                                .foregroundStyle(.secondary)
                        }
                    }
                    .foregroundStyle(ink)
                    .frame(maxWidth: .infinity, alignment: .leading)

                    if let warning = media.warning {
                        Label(warning, systemImage: "exclamationmark.triangle")
                            .font(.footnote)
                            .foregroundStyle(.orange)
                    }

                    if let saveError {
                        Text(saveError)
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }

                    Button(action: save) {
                        HStack {
                            if isSaving { ProgressView().tint(paper) }
                            Text(isSaving ? "Guardando…" : "Guardar en mi colección")
                                .font(.system(.headline, design: .serif))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .foregroundStyle(paper)
                        .background(ink, in: Capsule())
                    }
                    .disabled(isSaving)
                }
                .padding(24)
            }
            .background(paper.ignoresSafeArea())
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Cerrar") { dismiss() }
                        .foregroundStyle(ink)
                }
            }
        }
        .presentationDetents([.large])
    }

    private var metadata: StampMetadata {
        StampMetadata(
            id: media.id,
            date: media.timestamp,
            placeName: place.place,
            city: place.city,
            country: place.country,
            isoCountryCode: place.code,
            latitude: location?.coordinate.latitude ?? 0,
            longitude: location?.coordinate.longitude ?? 0
        )
    }

    @MainActor
    private func save() {
        guard !isSaving else { return }
        isSaving = true
        defer { isSaving = false }

        var storedMedia: StoredMedia?
        var insertedItem: StampItem?
        do {
            let stored = try storage.store(media)
            storedMedia = stored
            let item = StampItem(
                id: media.id,
                timestamp: media.timestamp,
                imageFilename: stored.imageFilename,
                videoMotionFilename: stored.videoMotionFilename,
                latitude: location?.coordinate.latitude ?? 0,
                longitude: location?.coordinate.longitude ?? 0,
                altitude: location?.altitude ?? 0,
                placeName: place.place,
                city: place.city,
                country: place.country,
                isoCountryCode: place.code
            )
            insertedItem = item
            modelContext.insert(item)
            try modelContext.save()
            dismiss()
        } catch {
            if let insertedItem { modelContext.delete(insertedItem) }
            var message = "No se pudo guardar la estampilla: \(error.localizedDescription)"
            if let storedMedia {
                do {
                    try storage.remove(storedMedia)
                } catch {
                    message += " Además, no se pudieron limpiar los archivos guardados: \(error.localizedDescription)"
                }
            }
            saveError = message
        }
    }
}
