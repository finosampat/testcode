import SwiftUI

/// Circular heart button with a springy scale, symbol bounce, and haptic on toggle.
struct FavoriteButton: View {
    let isFavorite: Bool
    let action: () -> Void

    @ScaledMetric(relativeTo: .title) private var size: CGFloat = 56
    @State private var burst = false

    var body: some View {
        Button {
            withAnimation(.spring(duration: 0.4, bounce: 0.55)) {
                action()
            }
            burst.toggle()
        } label: {
            ZStack {
                Circle()
                    .fill(isFavorite ? AnyShapeStyle(Color.pink) : AnyShapeStyle(Material.ultraThinMaterial))
                    .overlay(Circle().strokeBorder(.white.opacity(0.6), lineWidth: 1.5))

                Image(systemName: isFavorite ? "heart.fill" : "heart")
                    .font(.system(size: size * 0.45, weight: .bold))
                    .foregroundStyle(.white)
                    .contentTransition(.symbolEffect(.replace))
                    .symbolEffect(.bounce, value: isFavorite)
            }
            .frame(width: size, height: size)
            .scaleEffect(isFavorite ? 1.08 : 1)
            .shadow(color: (isFavorite ? Color.pink : .black).opacity(0.35), radius: isFavorite ? 10 : 4, y: 2)
        }
        .buttonStyle(.plain)
        .sensoryFeedback(.impact(weight: .medium), trigger: burst)
        .accessibilityLabel(isFavorite ? "Remove from Favorites" : "Add to Favorites")
        .accessibilityAddTraits(isFavorite ? .isSelected : [])
        .accessibilityIdentifier("favoriteButton")
    }
}

private struct FavoriteButtonPreview: View {
    @State private var favorite = false

    var body: some View {
        FavoriteButton(isFavorite: favorite) { favorite.toggle() }
            .padding()
            .background(.blue.gradient)
    }
}

#Preview {
    FavoriteButtonPreview()
}
