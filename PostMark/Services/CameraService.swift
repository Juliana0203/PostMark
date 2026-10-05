import AVFoundation
import Foundation
import Observation

struct CapturedMedia: Identifiable {
    let id = UUID()
    let timestamp: Date
    let imageData: Data
    let motionVideoURL: URL?
    let warning: String?

    init(imageData: Data, motionVideoURL: URL?, warning: String?, timestamp: Date) {
        self.timestamp = timestamp
        self.imageData = imageData
        self.motionVideoURL = motionVideoURL
        self.warning = warning
    }
}

@Observable
@MainActor
final class CameraService {
    let session = AVCaptureSession()
    private(set) var isConfigured = false
    private(set) var isCapturing = false
    private(set) var errorMessage: String?

    private let cameraQueue = DispatchQueue(label: "com.postmark.camera.session")
    private let photoOutput = AVCapturePhotoOutput()
    private let movieOutput = AVCaptureMovieFileOutput()
    private var hasAudioInput = false

    func start() async throws {
        guard !isConfigured else {
            await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
                cameraQueue.async { [session] in
                    if !session.isRunning { session.startRunning() }
                    continuation.resume()
                }
            }
            return
        }

        guard await AVCaptureDevice.requestAccess(for: .video) else {
            throw CameraError.permissionDenied
        }

        do {
            try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
                cameraQueue.async { [self] in
                    do {
                        try configureSession()
                        session.startRunning()
                        continuation.resume()
                    } catch {
                        continuation.resume(throwing: error)
                    }
                }
            }
            isConfigured = true
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
            throw error
        }
    }

    func stop() {
        cameraQueue.async { [session] in
            guard session.isRunning else { return }
            session.stopRunning()
        }
    }

    func capture() async throws -> CapturedMedia {
        guard isConfigured else { throw CameraError.notReady }
        guard !isCapturing else { throw CameraError.captureInProgress }
        isCapturing = true
        defer { isCapturing = false }

        let audioStatus = AVCaptureDevice.authorizationStatus(for: .audio)
        let hasMicrophonePermission: Bool
        if audioStatus == .notDetermined {
            hasMicrophonePermission = await AVCaptureDevice.requestAccess(for: .audio)
        } else {
            hasMicrophonePermission = audioStatus == .authorized
        }

        var warning = hasMicrophonePermission ? nil : "El micro-video se grabará sin sonido porque no hay permiso de micrófono."
        if hasMicrophonePermission {
            do {
                try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
                    cameraQueue.async { [self] in
                        do {
                            try addAudioInputIfNeeded()
                            continuation.resume()
                        } catch {
                            continuation.resume(throwing: error)
                        }
                    }
                }
            } catch {
                warning = "El micro-video se grabará sin sonido: \(error.localizedDescription)"
            }
        }

        let photoSettings = AVCapturePhotoSettings(format: [AVVideoCodecKey: AVVideoCodecType.jpeg])
        photoSettings.photoQualityPrioritization = .quality
        let captureTimestamp = Date.now

        return try await withCheckedThrowingContinuation { continuation in
            let movieURL = FileManager.default.temporaryDirectory
                .appendingPathComponent("postmark-motion-\(UUID().uuidString).mov")
            let coordinator = CaptureCoordinator(
                continuation: continuation,
                warning: warning,
                timestamp: captureTimestamp
            )
            let photoOutput = self.photoOutput
            let movieOutput = self.movieOutput

            cameraQueue.async {
                movieOutput.maxRecordedDuration = CMTime(seconds: 1.5, preferredTimescale: 600)
                movieOutput.startRecording(to: movieURL, recordingDelegate: coordinator)
                photoOutput.capturePhoto(with: photoSettings, delegate: coordinator)
                self.cameraQueue.asyncAfter(deadline: .now() + 1.5) {
                    if movieOutput.isRecording { movieOutput.stopRecording() }
                }
            }
        }
    }

    private func configureSession() throws {
        session.beginConfiguration()
        defer { session.commitConfiguration() }
        session.sessionPreset = .photo

        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) else {
            throw CameraError.cameraUnavailable
        }
        let input: AVCaptureDeviceInput
        do {
            input = try AVCaptureDeviceInput(device: device)
        } catch {
            throw CameraError.cameraInputUnavailable(error.localizedDescription)
        }
        guard session.canAddInput(input) else { throw CameraError.cameraUnavailable }
        session.addInput(input)

        guard session.canAddOutput(photoOutput) else { throw CameraError.outputUnavailable }
        session.addOutput(photoOutput)
        photoOutput.maxPhotoQualityPrioritization = .quality

        guard session.canAddOutput(movieOutput) else { throw CameraError.outputUnavailable }
        session.addOutput(movieOutput)
    }

    private func addAudioInputIfNeeded() throws {
        guard !hasAudioInput else { return }
        guard let device = AVCaptureDevice.default(for: .audio) else {
            throw CameraError.microphoneUnavailable
        }
        let input: AVCaptureDeviceInput
        do {
            input = try AVCaptureDeviceInput(device: device)
        } catch {
            throw CameraError.microphoneInputUnavailable(error.localizedDescription)
        }
        guard session.canAddInput(input) else { throw CameraError.microphoneUnavailable }

        session.beginConfiguration()
        session.addInput(input)
        session.commitConfiguration()
        hasAudioInput = true
    }
}

private enum CameraError: LocalizedError {
    case permissionDenied
    case cameraUnavailable
    case cameraInputUnavailable(String)
    case outputUnavailable
    case notReady
    case captureInProgress
    case microphoneUnavailable
    case microphoneInputUnavailable(String)
    case photoDataUnavailable

    var errorDescription: String? {
        switch self {
        case .permissionDenied: "PostMark necesita permiso para usar la cámara."
        case .cameraUnavailable: "No se encontró una cámara trasera disponible."
        case .cameraInputUnavailable(let reason): "No se pudo preparar la cámara: \(reason)"
        case .outputUnavailable: "No se pudieron preparar las salidas de captura."
        case .notReady: "La cámara todavía no está lista."
        case .captureInProgress: "Espera a que termine la captura actual."
        case .microphoneUnavailable: "No se pudo preparar el micrófono para el micro-video."
        case .microphoneInputUnavailable(let reason): "No se pudo preparar el micrófono: \(reason)"
        case .photoDataUnavailable: "No se pudo procesar la fotografía."
        }
    }
}

private final class CaptureCoordinator: NSObject, AVCapturePhotoCaptureDelegate, AVCaptureFileOutputRecordingDelegate, @unchecked Sendable {
    private let lock = NSLock()
    private var continuation: CheckedContinuation<CapturedMedia, Error>?
    private let timestamp: Date
    private var photoData: Data?
    private var photoError: Error?
    private var photoFinished = false
    private var videoFinished = false
    private var videoError: String?
    private var videoURLIfAvailable: URL?

    init(continuation: CheckedContinuation<CapturedMedia, Error>, warning: String?, timestamp: Date) {
        self.continuation = continuation
        self.videoError = warning
        self.timestamp = timestamp
    }

    func photoOutput(
        _ output: AVCapturePhotoOutput,
        didFinishProcessingPhoto photo: AVCapturePhoto,
        error: Error?
    ) {
        lock.lock()
        photoData = photo.fileDataRepresentation()
        photoError = error
        lock.unlock()
    }

    func photoOutput(
        _ output: AVCapturePhotoOutput,
        didFinishCaptureFor resolvedSettings: AVCaptureResolvedPhotoSettings,
        error: Error?
    ) {
        lock.lock()
        if let error { photoError = error }
        photoFinished = true
        lock.unlock()
        finishIfReady()
    }

    func fileOutput(
        _ output: AVCaptureFileOutput,
        didFinishRecordingTo outputFileURL: URL,
        from connections: [AVCaptureConnection],
        error: Error?
    ) {
        lock.lock()
        videoFinished = true
        if let error {
            let recordingError = "El micro-video no estuvo disponible: \(error.localizedDescription)"
            videoError = [videoError, recordingError].compactMap { $0 }.joined(separator: " ")
        } else {
            videoURLIfAvailable = outputFileURL
        }
        lock.unlock()
        finishIfReady()
    }

    private func finishIfReady() {
        lock.lock()
        guard photoFinished, videoFinished, let continuation else {
            lock.unlock()
            return
        }
        self.continuation = nil
        let data = photoData
        let photoError = photoError
        let videoURL = videoURLIfAvailable
        let videoError = videoError
        lock.unlock()

        guard photoError == nil, let data else {
            continuation.resume(throwing: photoError ?? CameraError.photoDataUnavailable)
            return
        }
        continuation.resume(returning: CapturedMedia(
            imageData: data,
            motionVideoURL: videoURL,
            warning: videoError,
            timestamp: timestamp
        ))
    }
}
