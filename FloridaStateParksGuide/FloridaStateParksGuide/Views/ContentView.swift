import SwiftUI

/// Chooses the navigation structure for the current width:
/// a sidebar + detail split view on regular width (iPad), a push stack on compact width (iPhone).
struct ContentView: View {
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    var body: some View {
        if horizontalSizeClass == .compact {
            CompactParksView()
        } else {
            RegularParksView()
        }
    }
}

struct CompactParksView: View {
    @Environment(ParksViewModel.self) private var viewModel

    var body: some View {
        NavigationStack {
            ParkListView(selection: nil)
                .navigationDestination(for: Park.ID.self) { id in
                    if let park = viewModel.park(withID: id) {
                        ParkDetailView(park: park)
                    }
                }
        }
    }
}

struct RegularParksView: View {
    @Environment(ParksViewModel.self) private var viewModel
    @State private var columnVisibility = NavigationSplitViewVisibility.all

    var body: some View {
        @Bindable var viewModel = viewModel
        NavigationSplitView(columnVisibility: $columnVisibility) {
            ParkListView(selection: $viewModel.selectedParkID)
                .navigationSplitViewColumnWidth(min: 300, ideal: 340, max: 420)
        } detail: {
            if let park = viewModel.park(withID: viewModel.selectedParkID) {
                NavigationStack {
                    ParkDetailView(park: park)
                }
                .id(park.id)
            } else {
                ContentUnavailableView(
                    "Select a Park",
                    systemImage: "map",
                    description: Text("Choose a Florida state park from the sidebar to explore it.")
                )
            }
        }
        .navigationSplitViewStyle(.balanced)
    }
}

#Preview("iPhone") {
    ContentView()
        .environment(ParksViewModel(store: UserDefaults(suiteName: "preview")!))
}

#Preview("iPad", traits: .landscapeLeft) {
    ContentView()
        .environment(ParksViewModel(store: UserDefaults(suiteName: "preview")!))
}
