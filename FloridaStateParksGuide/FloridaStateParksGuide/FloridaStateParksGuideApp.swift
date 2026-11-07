import SwiftUI

@main
struct FloridaStateParksGuideApp: App {
    @State private var viewModel: ParksViewModel

    init() {
        // UI tests pass this flag so every run starts with no favorites.
        if ProcessInfo.processInfo.arguments.contains("-resetFavorites") {
            UserDefaults.standard.removeObject(forKey: ParksViewModel.favoritesKey)
        }
        _viewModel = State(initialValue: ParksViewModel())
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(viewModel)
        }
    }
}
