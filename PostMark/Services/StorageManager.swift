import Foundation

struct StoredMedia {
    let imageFilename: String
    let videoMotionFilename: String?
}

enum StorageError: LocalizedError {
    case mediaDirectoryUnavailable
    case cleanupFailed(String)

    var errorDescription: String? {
        switch self {
        case .mediaDirectoryUnavailable:
            "No se pudo preparar el almacenamiento local de PostMark."
        case .cleanupFailed(let reason):
            "No se pudo limpiar la fotografía temporal: \(reason)"
        }
    }
}

struct StorageManager {
    private let fileManager = FileManager.default

    func store(_ media: CapturedMedia) throws -> StoredMedia {
        let directory = try mediaDirectory()
        let imageFilename = "\(UUID().uuidString).jpg"
        let imageURL = directory.appendingPathComponent(imageFilename)
        try media.imageData.write(to: imageURL, options: .atomic)

        var videoFilename: String?
        do {
            if let sourceURL = media.motionVideoURL {
                let filename = "\(UUID().uuidString).mov"
                let destinationURL = directory.appendingPathComponent(filename)
                try fileManager.copyItem(at: sourceURL, to: destinationURL)
                videoFilename = filename
            }
        } catch {
            do {
                try fileManager.removeItem(at: imageURL)
            } catch {
                throw StorageError.cleanupFailed(error.localizedDescription)
            }
            throw error
        }

        return StoredMedia(imageFilename: imageFilename, videoMotionFilename: videoFilename)
    }

    func remove(_ media: StoredMedia) throws {
        let directory = try mediaDirectory()
        try fileManager.removeItem(at: directory.appendingPathComponent(media.imageFilename))
        if let videoFilename = media.videoMotionFilename {
            try fileManager.removeItem(at: directory.appendingPathComponent(videoFilename))
        }
    }

    func imageURL(for filename: String) throws -> URL {
        try mediaDirectory().appendingPathComponent(filename)
    }

    private func mediaDirectory() throws -> URL {
        guard let documents = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first else {
            throw StorageError.mediaDirectoryUnavailable
        }
        let directory = documents.appendingPathComponent("PostMarkMedia", isDirectory: true)
        try fileManager.createDirectory(at: directory, withIntermediateDirectories: true)
        return directory
    }
}
