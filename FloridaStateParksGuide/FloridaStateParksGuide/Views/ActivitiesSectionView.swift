import SwiftUI

struct ActivitiesSectionView: View {
    let activities: [Activity]
    let tint: Color

    @ScaledMetric(relativeTo: .body) private var minColumnWidth: CGFloat = 160
    @ScaledMetric(relativeTo: .body) private var iconSize: CGFloat = 36

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Activities")
                .font(.title2.bold())

            LazyVGrid(columns: [GridItem(.adaptive(minimum: minColumnWidth), spacing: 12)], spacing: 12) {
                ForEach(activities) { activity in
                    HStack(spacing: 10) {
                        Image(systemName: activity.systemImage)
                            .font(.body.weight(.semibold))
                            .foregroundStyle(.white)
                            .frame(width: iconSize, height: iconSize)
                            .background(tint.gradient, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                            .accessibilityHidden(true)
                        Text(activity.title)
                            .font(.subheadline.weight(.medium))
                            .fixedSize(horizontal: false, vertical: true)
                        Spacer(minLength: 0)
                    }
                    .padding(10)
                    .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
            }
        }
    }
}

#Preview {
    ActivitiesSectionView(activities: Park.seed[0].activities, tint: .teal).padding()
}
