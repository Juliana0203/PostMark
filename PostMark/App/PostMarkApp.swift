import SwiftData
import SwiftUI

@main
struct PostMarkApp: App {
    var body: some Scene {
        WindowGroup {
            CaptureScreen()
        }
        .modelContainer(for: StampItem.self)
    }
}
