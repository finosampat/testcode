import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { SearchBar } from '../components/SearchBar';
import { categories, categoryCounts, languageLabel } from '../content/library';
import { useReadingSettings } from '../lib/reading-settings';
import { searchWorks } from '../lib/search';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { theme, toggleTheme } = useReadingSettings();
  const [query, setQuery] = useState('');
  const counts = useMemo(() => categoryCounts(), []);
  const matches = useMemo(() => (query.trim() ? searchWorks(query) : []), [query]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Digital Library</Text>
        <Pressable accessibilityRole="button" onPress={toggleTheme} hitSlop={8}>
          <Text style={[styles.themeToggle, { color: theme.accent }]}>
            {theme.name === 'dark' ? 'Light mode' : 'Dark mode'}
          </Text>
        </Pressable>
      </View>
      <Text style={[styles.subtitle, { color: theme.muted }]}>Hindu scriptures and literature, available offline</Text>

      <SearchBar value={query} onChangeText={setQuery} placeholder="Search works" />
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('Search', { query: query.trim() || undefined })}
        style={styles.fullTextLink}
      >
        <Text style={{ color: theme.accent }}>Search inside all texts →</Text>
      </Pressable>

      {query.trim().length > 0 ? (
        <FlatList
          data={matches}
          keyExtractor={(work) => work.id}
          ListEmptyComponent={<Text style={{ color: theme.muted }}>No works match “{query}”.</Text>}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Reader', { workId: item.id })}
              style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
              <Text style={{ color: theme.muted }}>
                {item.category} · {languageLabel(item)} · {item.chapters.length} chapters
              </Text>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(category) => category}
          renderItem={({ item }) => {
            const count = counts[item] ?? 0;
            return (
              <Pressable
                accessibilityRole="button"
                disabled={count === 0}
                onPress={() => navigation.navigate('Category', { category: item })}
                style={[
                  styles.card,
                  { backgroundColor: theme.surface, borderColor: theme.border, opacity: count === 0 ? 0.55 : 1 },
                ]}
              >
                <Text style={[styles.cardTitle, { color: theme.text }]}>{item}</Text>
                <Text style={{ color: theme.muted }}>
                  {count === 0 ? 'No texts yet' : `${count} ${count === 1 ? 'work' : 'works'}`}
                </Text>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontSize: 26, fontWeight: '700' },
  themeToggle: { fontSize: 14 },
  subtitle: { marginBottom: 16, marginTop: 4 },
  fullTextLink: { paddingBottom: 12, paddingTop: 12 },
  card: { borderRadius: 14, borderWidth: 1, marginBottom: 12, padding: 16 },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
});
