import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { SearchBar } from '../components/SearchBar';
import { useReadingSettings } from '../lib/reading-settings';
import { searchLibrary } from '../lib/search';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

export function SearchScreen({ navigation, route }: Props) {
  const { theme } = useReadingSettings();
  const [query, setQuery] = useState(route.params?.query ?? '');
  const hits = useMemo(() => searchLibrary(query), [query]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SearchBar value={query} onChangeText={setQuery} autoFocus placeholder="Search inside all texts" />
      <Text style={[styles.summary, { color: theme.muted }]}>
        {query.trim().length < 2
          ? 'Type at least two characters.'
          : `${hits.length} ${hits.length === 1 ? 'passage' : 'passages'} found`}
      </Text>
      <FlatList
        data={hits}
        keyExtractor={(hit, index) => `${hit.workId}-${hit.chapterIndex}-${index}`}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Reader', { workId: item.workId, chapterIndex: item.chapterIndex })}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Text style={[styles.cardTitle, { color: theme.text }]}>{item.chapterHeading}</Text>
            <Text style={[styles.meta, { color: theme.muted }]}>
              {item.workTitle} · {item.language}
            </Text>
            <Text style={{ color: theme.text }}>{item.snippet}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  summary: { paddingBottom: 8, paddingTop: 10 },
  card: { borderRadius: 14, borderWidth: 1, marginBottom: 12, padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  meta: { marginBottom: 6, marginTop: 2 },
});
