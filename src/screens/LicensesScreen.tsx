import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts';

interface License {
  name: string;
  version?: string;
  license: string;
  repository?: string;
}

const LICENSES: License[] = [
  {
    name: 'React',
    version: '19.1.0',
    license: 'MIT License',
    repository: 'https://github.com/facebook/react',
  },
  {
    name: 'React Native',
    version: '0.81.5',
    license: 'MIT License',
    repository: 'https://github.com/facebook/react-native',
  },
  {
    name: 'Expo',
    version: '54.0.30',
    license: 'MIT License',
    repository: 'https://github.com/expo/expo',
  },
  {
    name: '@react-navigation/native',
    license: 'MIT License',
    repository: 'https://github.com/react-navigation/react-navigation',
  },
  {
    name: '@react-navigation/bottom-tabs',
    license: 'MIT License',
    repository: 'https://github.com/react-navigation/react-navigation',
  },
  {
    name: '@react-navigation/native-stack',
    license: 'MIT License',
    repository: 'https://github.com/react-navigation/react-navigation',
  },
  {
    name: '@react-native-async-storage/async-storage',
    license: 'MIT License',
    repository: 'https://github.com/react-native-async-storage/async-storage',
  },
  {
    name: 'expo-camera',
    license: 'MIT License',
    repository: 'https://github.com/expo/expo',
  },
  {
    name: 'expo-notifications',
    license: 'MIT License',
    repository: 'https://github.com/expo/expo',
  },
  {
    name: 'expo-sqlite',
    license: 'MIT License',
    repository: 'https://github.com/expo/expo',
  },
  {
    name: 'expo-file-system',
    license: 'MIT License',
    repository: 'https://github.com/expo/expo',
  },
  {
    name: 'expo-sharing',
    license: 'MIT License',
    repository: 'https://github.com/expo/expo',
  },
  {
    name: 'expo-document-picker',
    license: 'MIT License',
    repository: 'https://github.com/expo/expo',
  },
  {
    name: 'expo-crypto',
    license: 'MIT License',
    repository: 'https://github.com/expo/expo',
  },
  {
    name: 'zustand',
    version: '5.0.9',
    license: 'MIT License',
    repository: 'https://github.com/pmndrs/zustand',
  },
  {
    name: 'react-native-chart-kit',
    license: 'MIT License',
    repository: 'https://github.com/indiespirit/react-native-chart-kit',
  },
  {
    name: 'react-native-svg',
    license: 'MIT License',
    repository: 'https://github.com/software-mansion/react-native-svg',
  },
  {
    name: 'react-native-screens',
    license: 'MIT License',
    repository: 'https://github.com/software-mansion/react-native-screens',
  },
  {
    name: 'react-native-safe-area-context',
    license: 'MIT License',
    repository: 'https://github.com/th3rdwave/react-native-safe-area-context',
  },
];

export default function LicensesScreen() {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        オープンソースライセンス
      </Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        本アプリは以下のオープンソースソフトウェアを使用しています。
        各ソフトウェアの著作権者およびコントリビューターの皆様に感謝いたします。
      </Text>

      {LICENSES.map((lib, index) => (
        <View
          key={lib.name}
          style={[
            styles.licenseItem,
            { backgroundColor: colors.surface },
            index === LICENSES.length - 1 && styles.lastItem,
          ]}
        >
          <Text style={[styles.libraryName, { color: colors.textPrimary }]}>
            {lib.name}
            {lib.version && (
              <Text style={[styles.version, { color: colors.textTertiary }]}>
                {' '}v{lib.version}
              </Text>
            )}
          </Text>
          <Text style={[styles.licenseType, { color: colors.textSecondary }]}>
            {lib.license}
          </Text>
        </View>
      ))}

      <View style={styles.mitSection}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          MIT License
        </Text>
        <Text style={[styles.mitText, { color: colors.textSecondary }]}>
          Permission is hereby granted, free of charge, to any person obtaining
          a copy of this software and associated documentation files (the
          "Software"), to deal in the Software without restriction, including
          without limitation the rights to use, copy, modify, merge, publish,
          distribute, sublicense, and/or sell copies of the Software, and to
          permit persons to whom the Software is furnished to do so, subject to
          the following conditions:{'\n\n'}
          The above copyright notice and this permission notice shall be
          included in all copies or substantial portions of the Software.
          {'\n\n'}
          THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
          EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
          IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
          CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
          TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
          SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  licenseItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  lastItem: {
    marginBottom: 24,
  },
  libraryName: {
    fontSize: 15,
    fontWeight: '600',
  },
  version: {
    fontWeight: 'normal',
  },
  licenseType: {
    fontSize: 13,
    marginTop: 4,
  },
  mitSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  mitText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
