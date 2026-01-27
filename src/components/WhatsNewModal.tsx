import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTheme } from '../contexts';
import { ChangelogEntry } from '../constants/changelog';

interface WhatsNewModalProps {
  visible: boolean;
  changelog: ChangelogEntry;
  onClose: () => void;
}

/**
 * バージョンアップお知らせモーダル
 */
export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({
  visible,
  changelog,
  onClose,
}) => {
  const { colors } = useTheme();
  const { width: screenWidth } = Dimensions.get('window');

  const hasFeatures = changelog.features && changelog.features.length > 0;
  const hasImprovements =
    changelog.improvements && changelog.improvements.length > 0;
  const hasBugfixes = changelog.bugfixes && changelog.bugfixes.length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.card,
              width: screenWidth * 0.85,
              maxWidth: 400,
            },
          ]}
        >
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.emoji}>🎉</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              アップデート
            </Text>
            <Text style={[styles.version, { color: colors.primary }]}>
              v{changelog.version}
            </Text>
          </View>

          {/* コンテンツ */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {hasFeatures && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                  ■ 新機能
                </Text>
                {changelog.features!.map((item, index) => (
                  <Text
                    key={`feature-${index}`}
                    style={[styles.item, { color: colors.textPrimary }]}
                  >
                    • {item}
                  </Text>
                ))}
              </View>
            )}

            {hasImprovements && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                  ■ 改善
                </Text>
                {changelog.improvements!.map((item, index) => (
                  <Text
                    key={`improvement-${index}`}
                    style={[styles.item, { color: colors.textPrimary }]}
                  >
                    • {item}
                  </Text>
                ))}
              </View>
            )}

            {hasBugfixes && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                  ■ バグ修正
                </Text>
                {changelog.bugfixes!.map((item, index) => (
                  <Text
                    key={`bugfix-${index}`}
                    style={[styles.item, { color: colors.textPrimary }]}
                  >
                    • {item}
                  </Text>
                ))}
              </View>
            )}
          </ScrollView>

          {/* フッター */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>確認しました</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    borderRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  version: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  item: {
    fontSize: 14,
    lineHeight: 22,
    marginLeft: 4,
    marginBottom: 4,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
