import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useLayoutEffect, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { languageLabel, worksInCategory } from '../content/library';
import { useReadingSettings } from '../lib/reading-settings';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Category'>;

export function CategoryScreen({ navigation, route }: Props) {
  const { category } = route.params;
  const { theme } = useReadingSettings();
  const works = useMemo(() => worksInCategory(category), [category]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: category });
  }, [category, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={works}
        keyExtractor={(work) => work.id}
        ListEmptyComponent={
          <Text style={{ color: theme.muted }}>
            No works in this category yet. Run the ingestion pipeline to add sources.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Reader', { workId: item.id })}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
            <Text style={{ color: theme.muted }}>
              {languageLabel(item)} · {item.chapters.length} chapters
            </Text>
            {item.author ? <Text style={{ color: theme.muted }}>{item.author}</Text> : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  card: { borderRadius: 14, borderWidth: 1, marginBottom: 12, padding: 16 },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
});
