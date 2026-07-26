import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { getWork } from '../content/library';
import { loadLastRead, saveLastRead, useReadingSettings } from '../lib/reading-settings';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Reader'>;

/** Devanagari needs a font with full conjunct/matra coverage. */
const DEVANAGARI_FONT = 'NotoSerifDevanagari_400Regular';

export function ReaderScreen({ navigation, route }: Props) {
  const { workId, chapterIndex: requestedChapter } = route.params;
  const { theme, fontSize, increaseFontSize, decreaseFontSize, toggleTheme } = useReadingSettings();
  const work = useMemo(() => getWork(workId), [workId]);
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollOffset = useRef(0);
  const [chapterIndex, setChapterIndex] = useState(requestedChapter ?? 0);
  const [restoredOffset, setRestoredOffset] = useState<number | null>(requestedChapter != null ? 0 : null);
  const [tocVisible, setTocVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: work?.title ?? 'Reader' });
  }, [navigation, work]);

  // Restore the last-read position unless a specific chapter was requested.
  useEffect(() => {
    if (requestedChapter != null) return;
    let cancelled = false;
    loadLastRead(workId).then((position) => {
      if (cancelled) return;
      setChapterIndex(position ? Math.min(position.chapterIndex, (work?.chapters.length ?? 1) - 1) : 0);
      setRestoredOffset(position?.scrollOffset ?? 0);
    });
    return () => {
      cancelled = true;
    };
  }, [requestedChapter, work, workId]);

  const persistPosition = useCallback(
    (nextChapter: number, offset: number) => {
      void saveLastRead(workId, { chapterIndex: nextChapter, scrollOffset: offset });
    },
    [workId],
  );

  const goToChapter = useCallback(
    (index: number) => {
      setChapterIndex(index);
      scrollOffset.current = 0;
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      persistPosition(index, 0);
    },
    [persistPosition],
  );

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffset.current = event.nativeEvent.contentOffset.y;
    },
    [],
  );

  useEffect(() => () => persistPosition(chapterIndex, scrollOffset.current), [chapterIndex, persistPosition]);

  if (!work) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>This work is not bundled in the app.</Text>
      </View>
    );
  }

  const chapter = work.chapters[Math.min(chapterIndex, work.chapters.length - 1)];
  const useDevanagari = work.script === 'Deva';
  const bodyFont = useDevanagari ? { fontFamily: DEVANAGARI_FONT } : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.toolbar, { borderColor: theme.border, backgroundColor: theme.surface }]}>
        <Pressable accessibilityRole="button" onPress={() => setTocVisible(true)} hitSlop={6}>
          <Text style={[styles.toolbarText, { color: theme.accent }]}>Chapters</Text>
        </Pressable>
        <View style={styles.toolbarRight}>
          <Pressable accessibilityLabel="Decrease font size" onPress={decreaseFontSize} hitSlop={6}>
            <Text style={[styles.toolbarText, { color: theme.accent }]}>A-</Text>
          </Pressable>
          <Pressable accessibilityLabel="Increase font size" onPress={increaseFontSize} hitSlop={6}>
            <Text style={[styles.toolbarText, styles.toolbarSpaced, { color: theme.accent }]}>A+</Text>
          </Pressable>
          <Pressable accessibilityLabel="Toggle reading mode" onPress={toggleTheme} hitSlop={6}>
            <Text style={[styles.toolbarText, styles.toolbarSpaced, { color: theme.accent }]}>
              {theme.name === 'dark' ? 'Light' : 'Dark'}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onScroll={onScroll}
        scrollEventThrottle={120}
        onContentSizeChange={() => {
          if (restoredOffset != null && restoredOffset > 0) {
            scrollRef.current?.scrollTo({ y: restoredOffset, animated: false });
            setRestoredOffset(0);
          }
        }}
      >
        <Text style={[styles.chapterHeading, bodyFont, { color: theme.text, fontSize: fontSize + 6 }]}>
          {chapter.heading}
        </Text>
        <Text
          style={[
            styles.body,
            bodyFont,
            { color: theme.text, fontSize, lineHeight: Math.round(fontSize * 1.65) },
          ]}
        >
          {chapter.body}
        </Text>

        <View style={styles.chapterNav}>
          <Pressable
            accessibilityRole="button"
            disabled={chapterIndex === 0}
            onPress={() => goToChapter(chapterIndex - 1)}
          >
            <Text style={{ color: chapterIndex === 0 ? theme.muted : theme.accent }}>← Previous</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={chapterIndex >= work.chapters.length - 1}
            onPress={() => goToChapter(chapterIndex + 1)}
          >
            <Text style={{ color: chapterIndex >= work.chapters.length - 1 ? theme.muted : theme.accent }}>
              Next →
            </Text>
          </Pressable>
        </View>

        <View style={[styles.licenseBox, { borderColor: theme.border }]}>
          <Text style={[styles.licenseTitle, { color: theme.text }]}>Source & license</Text>
          <Text style={{ color: theme.muted }}>{work.attribution ?? work.sourceUrl}</Text>
          <Text style={[styles.licenseLine, { color: theme.muted }]}>License: {work.license.basis}</Text>
          <Text style={[styles.licenseLine, { color: theme.muted }]}>
            Redistribution: {work.license.redistribution}
          </Text>
          {work.license.notes ? (
            <Text style={[styles.licenseLine, { color: theme.muted }]}>{work.license.notes}</Text>
          ) : null}
          <Text style={[styles.licenseLine, { color: theme.muted }]}>Source: {work.sourceUrl}</Text>
        </View>
      </ScrollView>

      <Modal visible={tocVisible} animationType="slide" onRequestClose={() => setTocVisible(false)}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={styles.tocHeader}>
            <Text style={[styles.tocTitle, { color: theme.text }]}>Chapters</Text>
            <Pressable accessibilityRole="button" onPress={() => setTocVisible(false)} hitSlop={8}>
              <Text style={{ color: theme.accent }}>Close</Text>
            </Pressable>
          </View>
          <FlatList
            data={work.chapters}
            keyExtractor={(item, index) => `${index}-${item.heading}`}
            renderItem={({ item, index }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setTocVisible(false);
                  goToChapter(index);
                }}
                style={[styles.tocRow, { borderColor: theme.border }]}
              >
                <Text
                  style={[
                    bodyFont,
                    { color: index === chapterIndex ? theme.accent : theme.text, fontWeight: index === chapterIndex ? '700' : '400' },
                  ]}
                >
                  {item.heading}
                </Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  toolbar: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  toolbarRight: { flexDirection: 'row' },
  toolbarText: { fontSize: 15 },
  toolbarSpaced: { marginLeft: 18 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 48, paddingHorizontal: 20, paddingTop: 18 },
  chapterHeading: { fontWeight: '700', marginBottom: 14 },
  body: { textAlign: 'left' },
  chapterNav: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 28 },
  licenseBox: { borderRadius: 12, borderWidth: 1, marginTop: 28, padding: 14 },
  licenseTitle: { fontWeight: '600', marginBottom: 6 },
  licenseLine: { marginTop: 4 },
  tocHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  tocTitle: { fontSize: 20, fontWeight: '700' },
  tocRow: { borderBottomWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
});
