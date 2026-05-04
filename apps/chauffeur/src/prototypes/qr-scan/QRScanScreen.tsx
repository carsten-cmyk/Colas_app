/**
 * PROTOTYPE — QR-scanning ved silo
 * Må ikke importeres i produktionskode.
 * Når godkendt → byg ordentligt i src/screens/
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, Linking, Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config/theme';

// ─── Mock data (hardcoded til prototype) ────────────────────────────────────
const EXPECTED = {
  produkt: '82101H',
  siloLabel: 'Silo 3',
  foreman: '23991448',
};

/**
 * QR-kode format: produktkode som plain string
 * Test-værdier:
 *   82101H       → success
 *   94202A       → forkert produkt
 *   (tom/ugyldig) → kan ikke læse
 */
type ScanState = 'scanning' | 'success' | 'wrong_product' | 'unreadable';

interface ScanResult {
  state: ScanState;
  title: string;
  message: string;
}

function evaluateQR(data: string): ScanResult {
  const trimmed = data.trim();

  if (!trimmed) {
    return {
      state: 'unreadable',
      title: 'Kan ikke scanne',
      message: 'Kan ikke scanne — prøv igen eller kontakt formand',
    };
  }

  if (trimmed === EXPECTED.produkt) {
    return {
      state: 'success',
      title: `${EXPECTED.siloLabel} bekræftet`,
      message: `${EXPECTED.siloLabel} bekræftet — start læsning`,
    };
  }

  return {
    state: 'wrong_product',
    title: 'Forkert produkt',
    message: `Er du ved den forkerte silo? Tjek siloens nummer og hvis der stadigvæk er udfordringer, så ring til fabrikken.`,
  };
}

// ─── Komponenten ────────────────────────────────────────────────────────────
interface QRScanScreenProps {
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_ERRORS = 3;

export function QRScanScreen({ onClose, onSuccess }: QRScanScreenProps) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  useEffect(() => {
    if (scanResult) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [scanResult]);

  const handleBarcodeScan = ({ data }: { data: string }) => {
    if (isProcessing || scanResult?.state === 'success') return;
    setIsProcessing(true);

    const result = evaluateQR(data);

    if (result.state === 'success') {
      onSuccess();
      return;
    }

    setScanResult(result);
    setErrorCount(prev => prev + 1);
  };

  const handleRetry = () => {
    setScanResult(null);
    setTimeout(() => setIsProcessing(false), 600); // kort pause inden re-scan
  };

  const handleCallForeman = () => {
    Linking.openURL(`tel:${EXPECTED.foreman}`).catch(() => {});
  };

  // ─── Tilladelse nægtet ──────────────────────────────────────────────────
  if (permission && !permission.granted) {
    return (
      <SafeAreaView style={styles.permissionRoot} edges={['top', 'bottom']}>
        <Ionicons name="camera-off-outline" size={48} color={theme.colors.textMuted} />
        <Text style={styles.permissionTitle}>Kameratilladelse mangler</Text>
        <Text style={styles.permissionSub}>
          Giv adgang til kameraet i Indstillinger for at scanne QR-koder.
        </Text>
        <Pressable style={styles.retryBtn} onPress={requestPermission}>
          <Text style={styles.retryBtnText}>Giv tilladelse</Text>
        </Pressable>
        <Pressable style={styles.closeLink} onPress={onClose}>
          <Text style={styles.closeLinkText}>Luk</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ─── Kamera endnu ikke klart ────────────────────────────────────────────
  if (!permission) {
    return <View style={styles.loadingRoot} />;
  }

  return (
    <View style={styles.root}>
      {/* Kamera */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={handleBarcodeScan}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Mørkt overlay rundt om scan-rammen */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      {/* Header */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={styles.headerRow}>
          <Pressable
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Luk scanner"
          >
            <Ionicons name="close" size={17} color={theme.colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Scan QR-kode</Text>
          <View style={styles.closeButton} />
        </View>
        <Text style={styles.headerSub}>
          {`Hold kameraet over QR-koden ved ${EXPECTED.siloLabel}`}
        </Text>
      </SafeAreaView>

      {/* Resultat-overlay */}
      {scanResult && (
        <Animated.View
          style={[
            styles.resultOverlay,
            { opacity: fadeAnim },
            scanResult.state === 'success' ? styles.resultSuccess : styles.resultError,
          ]}
        >
          {/* X — altid synlig i øverste højre hjørne */}
          <SafeAreaView style={styles.resultCloseRow} edges={['top']}>
            <Pressable
              style={styles.resultCloseButton}
              onPress={scanResult.state === 'success' ? onSuccess : handleRetry}
              accessibilityRole="button"
              accessibilityLabel="Luk"
            >
              <Ionicons name="close" size={17} color={theme.colors.white} />
            </Pressable>
          </SafeAreaView>

          <View style={[styles.resultContent, { paddingTop: insets.top + 138 }]}>
            <Ionicons name="close-circle" size={72} color={theme.colors.white} />
            <Text style={styles.resultTitle}>{scanResult.title}</Text>
            <Text style={styles.resultMessage}>{scanResult.message}</Text>

            <View style={styles.errorActions}>
                {scanResult?.state === 'wrong_product' ? (
                  // Forkert produkt — vis "Ring til fabrik" med det samme
                  <>
                    <Pressable
                      style={styles.retryBtn}
                      onPress={handleRetry}
                      accessibilityRole="button"
                    >
                      <Text style={styles.retryBtnText}>Prøv igen</Text>
                    </Pressable>
                    <Pressable
                      style={styles.callBtn}
                      onPress={handleCallForeman}
                      accessibilityRole="button"
                      accessibilityLabel="Ring til fabrik"
                    >
                      <Ionicons name="call" size={16} color={theme.colors.white} />
                      <Text style={styles.callBtnText}>Ring til fabrik</Text>
                    </Pressable>
                  </>
                ) : errorCount < MAX_ERRORS ? (
                  // Kan ikke scanne — vis "Prøv igen" indtil 3 fejl
                  <>
                    <Pressable
                      style={styles.retryBtn}
                      onPress={handleRetry}
                      accessibilityRole="button"
                    >
                      <Text style={styles.retryBtnText}>Prøv igen</Text>
                    </Pressable>
                    <Text style={styles.errorCount}>
                      {`Fejl ${errorCount}/${MAX_ERRORS}`}
                    </Text>
                  </>
                ) : (
                  // 3 fejl — vis "Ring til formand"
                  <Pressable
                    style={styles.callBtn}
                    onPress={handleCallForeman}
                    accessibilityRole="button"
                    accessibilityLabel="Ring til formand"
                  >
                    <Ionicons name="call" size={16} color={theme.colors.white} />
                    <Text style={styles.callBtnText}>Ring til formand</Text>
                  </Pressable>
                )}
              </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const FRAME_SIZE = 240;
const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: theme.colors.darkTeal,
  },
  permissionRoot: {
    flex: 1,
    backgroundColor: theme.colors.darkTeal,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  permissionTitle: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.fontSizes.lg,
    color: theme.colors.white,
    textAlign: 'center',
  },
  permissionSub: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.lightAqua,
    textAlign: 'center',
  },
  closeLink: {
    marginTop: theme.spacing.xs,
  },
  closeLinkText: {
    fontFamily: theme.fonts.interMedium,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.lightAqua,
    textDecorationLine: 'underline',
  },

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: FRAME_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  overlayBottom: {
    flex: 1.2,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: theme.colors.white,
  },
  cornerTL: {
    top: 0, left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0, right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0, left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0, right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomRightRadius: 4,
  },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.fontSizes.md,
    color: theme.colors.white,
  },
  headerSub: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.sm,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },

  // Resultat
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  resultCloseRow: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.xs,
  },
  resultCloseButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultSuccess: {
    backgroundColor: 'rgba(11,57,80,0.93)',
  },
  resultError: {
    backgroundColor: 'rgba(180,40,40,0.90)',
  },
  resultContent: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    flex: 1,
    justifyContent: 'flex-start',
  },
  resultTitle: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.fontSizes.xl,
    color: theme.colors.white,
    textAlign: 'center',
  },
  resultMessage: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.md,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  errorActions: {
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  errorCount: {
    fontFamily: theme.fonts.interRegular,
    fontSize: theme.fontSizes.xs,
    color: 'rgba(255,255,255,0.6)',
  },
  successBtn: {
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.yellow,
    borderRadius: theme.borderRadius.xxl,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    minWidth: 200,
    alignItems: 'center',
  },
  successBtnText: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.fontSizes.md,
    color: theme.colors.textPrimary,
  },
  retryBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: theme.borderRadius.xxl,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  retryBtnText: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.white,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xxxs,
    backgroundColor: theme.colors.darkTeal,
    borderRadius: theme.borderRadius.xxl,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    minWidth: 200,
    justifyContent: 'center',
  },
  callBtnText: {
    fontFamily: theme.fonts.poppinsSemiBold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.white,
  },
});
