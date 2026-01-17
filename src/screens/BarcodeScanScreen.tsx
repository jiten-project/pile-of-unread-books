import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { searchByISBN } from '../services';
import { RootStackNavigationProp } from '../types';
import { useTheme } from '../contexts';

export default function BarcodeScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const navigation = useNavigation<RootStackNavigationProp>();
  const { colors } = useTheme();

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (scanned || isSearching) return;

    // ISBNバーコードのみ処理（EAN-13形式）
    const cleanData = data.replace(/[-\s]/g, '');
    if (cleanData.length !== 13 && cleanData.length !== 10) {
      return;
    }

    // ISBN-13は978または979で始まる
    if (cleanData.length === 13 && !cleanData.startsWith('978') && !cleanData.startsWith('979')) {
      return;
    }

    setScanned(true);
    setIsSearching(true);

    try {
      const bookInfo = await searchByISBN(cleanData);

      if (bookInfo) {
        navigation.navigate('BookConfirm', { bookInfo });
      } else {
        Alert.alert(
          '書籍が見つかりません',
          'この ISBN の書籍情報が見つかりませんでした。',
          [
            {
              text: '再スキャン',
              onPress: () => setScanned(false),
            },
            {
              text: '手動登録',
              onPress: () => {
                navigation.navigate('Main');
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'エラー',
        '書籍情報の取得に失敗しました。ネットワーク接続を確認してください。',
        [
          {
            text: '再スキャン',
            onPress: () => setScanned(false),
          },
          {
            text: '手動で登録',
            onPress: () => {
              navigation.navigate('Main');
            },
          },
        ]
      );
    } finally {
      setIsSearching(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>カメラへのアクセスが必要です</Text>
        <Text style={styles.description}>
          バーコードをスキャンするには、カメラへのアクセスを許可してください。
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={requestPermission}
          accessibilityLabel="カメラアクセスを許可する"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>カメラを許可する</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} />
          </View>

          {isSearching && (
            <View
              style={styles.searchingContainer}
              accessibilityLiveRegion="polite"
              accessibilityLabel="書籍情報を検索中"
            >
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.searchingText}>検索中...</Text>
            </View>
          )}
        </View>
      </CameraView>

      <View style={[styles.footer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          本のバーコード（ISBN）を枠内に合わせてください
        </Text>
        {scanned && !isSearching && (
          <TouchableOpacity
            style={[styles.rescanButton, { backgroundColor: colors.primary }]}
            onPress={() => setScanned(false)}
            accessibilityLabel="もう一度スキャンする"
            accessibilityRole="button"
          >
            <Text style={styles.rescanButtonText}>もう一度スキャン</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 280,
    height: 180,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  searchingContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  searchingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  hint: {
    fontSize: 14,
    textAlign: 'center',
  },
  rescanButton: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
