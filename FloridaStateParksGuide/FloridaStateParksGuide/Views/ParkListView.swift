import SwiftUI

/// Searchable list of parks grouped by region.
/// Pass a selection binding when used as a split-view sidebar; pass `nil` for a push-navigation stack.
struct ParkListView: View {
    @Environment(ParksViewModel.self) private var viewModel
    let selection: Binding<Park.ID?>?

    var body: some View {
        @Bindable var viewModel = viewModel
        list
            .navigationTitle("Florida State Parks")
            .searchable(
                text: $viewModel.searchText,
                placement: selection == nil ? .automatic : .navigationBarDrawer(displayMode: .always),
                prompt: "Parks, regions, activities"
            )
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Toggle(isOn: $viewModel.showFavoritesOnly.animation()) {
                        Label("Favorites Only", systemImage: viewModel.showFavoritesOnly ? "heart.fill" : "heart")
                    }
                    .toggleStyle(.button)
                    .tint(.pink)
                    .accessibilityIdentifier("favoritesFilter")
                }
            }
            .overlay {
                if viewModel.filteredParks.isEmpty {
                    emptyState
                }
            }
    }

    @ViewBuilder
    private var list: some View {
        if let selection {
            List(selection: selection) { rows }
        } else {
            List { rows }
        }
    }

    private var rows: some View {
        ForEach(viewModel.sections) { section in
            Section {
                ForEach(section.parks) { park in
                    NavigationLink(value: park.id) {
                        ParkRowView(park: park)
                    }
                    .accessibilityIdentifier("parkRow.\(park.id)")
                    .swipeActions(edge: .trailing) {
                        Button {
                            withAnimation { viewModel.toggleFavorite(park) }
                        } label: {
                            Label(
                                park.isFavorite ? "Unfavorite" : "Favorite",
                                systemImage: park.isFavorite ? "heart.slash" : "heart"
                            )
                        }
                        .tint(.pink)
                    }
                }
            } header: {
                Label(section.region.rawValue, systemImage: section.region.systemImage)
            }
        }
    }

    @ViewBuilder
    private var emptyState: some View {
        if !viewModel.searchText.isEmpty {
            ContentUnavailableView.search(text: viewModel.searchText)
        } else {
            ContentUnavailableView(
                "No Favorites Yet",
                systemImage: "heart",
                description: Text("Tap the heart on a park to save it here.")
            )
        }
    }
}
