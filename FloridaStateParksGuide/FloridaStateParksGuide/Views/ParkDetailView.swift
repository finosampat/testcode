import SwiftUI

struct ParkDetailView: View {
    @Environment(ParksViewModel.self) private var viewModel
    let park: Park

    /// Always read the latest copy so favorite changes made elsewhere are reflected.
    private var current: Park { viewModel.park(withID: park.id) ?? park }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                GradientHeaderView(park: current) {
                    FavoriteButton(isFavorite: current.isFavorite) {
                        viewModel.toggleFavorite(current)
                    }
                }

                VStack(alignment: .leading, spacing: 24) {
                    StatsRowView(park: current)

                    VStack(alignment: .leading, spacing: 8) {
                        Text("About")
                            .font(.title2.bold())
                        Text(current.description)
                            .font(.body)
                            .foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    ActivitiesSectionView(activities: current.activities, tint: current.gradientColors.first ?? .accentColor)
                }
                .padding(.horizontal)
                .frame(maxWidth: 820, alignment: .leading)
                .frame(maxWidth: .infinity)
            }
            .padding(.bottom, 32)
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle(current.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    withAnimation(.spring(duration: 0.35, bounce: 0.5)) {
                        viewModel.toggleFavorite(current)
                    }
                } label: {
                    Label(
                        current.isFavorite ? "Remove from Favorites" : "Add to Favorites",
                        systemImage: current.isFavorite ? "heart.fill" : "heart"
                    )
                    .contentTransition(.symbolEffect(.replace))
                }
                .tint(.pink)
                .accessibilityIdentifier("toolbarFavoriteButton")
            }
        }
    }
}

#Preview {
    NavigationStack {
        ParkDetailView(park: Park.seed[0])
    }
    .environment(ParksViewModel(store: UserDefaults(suiteName: "preview")!))
}
