import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { useReadingSettings } from '../lib/reading-settings';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
};

export function SearchBar({ value, onChangeText, placeholder, autoFocus, onSubmitEditing }: Props) {
  const { theme } = useReadingSettings();
  return (
    <View style={[styles.wrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <TextInput
        accessibilityLabel="Search"
        style={[styles.input, { color: theme.text }]}
        placeholder={placeholder ?? 'Search all texts'}
        placeholderTextColor={theme.muted}
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={onSubmitEditing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  input: {
    fontSize: 16,
    paddingVertical: 10,
  },
});
