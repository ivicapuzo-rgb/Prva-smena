import { Image } from "expo-image";
import React, { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/src/app-store";
import { Btn, Card, Icon } from "@/src/components/kit";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function Login() {
  const { login } = useApp();
  const insets = useSafeAreaInsets();
  const s = useStyles();
  const { colors } = useTheme();
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const ok = await login(pw.trim());
    setBusy(false);
    if (!ok) {
      setPw("");
      setError("Pogrešna lozinka");
    }
  };

  return (
    <View style={s.root}>
      <KeyboardAwareScrollView bottomOffset={24} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View style={[s.hero, { height: 256 + insets.top }]}>
          <Image source={require("../assets/images/hero.webp")} style={s.heroImg} contentFit="cover" contentPosition="top" />
          <View style={s.heroShade} />
          <View style={[s.badge, { top: insets.top + 16 }]}>
            <Icon name="shield-check-outline" size={14} color={colors.onSurfaceInverse} />
            <Text style={s.badgeText}>ADMIN</Text>
          </View>
          <Text style={s.heroTitle}>PRVA SMENA</Text>
        </View>
        <View style={s.body}>
          <Card tone="accent">
            <Text style={s.title}>Prijava</Text>
            <Text style={s.label}>Admin lozinka</Text>
            <TextInput
              testID="login-password-input"
              value={pw}
              onChangeText={(t) => {
                setPw(t);
                setError("");
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="••••••"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
              onSubmitEditing={submit}
              style={[s.input, error ? { borderColor: colors.brandPrimary } : null]}
            />
            {!!error && <Text testID="login-error" style={s.error}>{error}</Text>}
            <Btn testID="login-submit-button" label="PRIJAVI SE" icon="login" onPress={submit} loading={busy} disabled={!pw} />
          </Card>
          <Text style={s.foot}>GSP Beograd · SP Novi Beograd · Podaci se čuvaju na ovom telefonu</Text>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  hero: { justifyContent: "flex-end", overflow: "hidden", backgroundColor: c.surfaceInverse },
  heroImg: { ...{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } },
  heroShade: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.overlay },
  badge: { position: "absolute", right: 16, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: c.badgeDark, paddingHorizontal: 12, height: 26, borderRadius: 13 },
  badgeText: { fontFamily: fonts.bold, fontSize: 13, color: c.onSurfaceInverse },
  heroTitle: { fontFamily: fonts.display, fontSize: 58, color: c.heroTitle, paddingHorizontal: 20, paddingBottom: 12 },
  body: { padding: 16, gap: 16, paddingTop: 24 },
  title: { fontFamily: fonts.display, fontSize: 40, color: c.onSurface },
  label: { fontFamily: fonts.semibold, fontSize: 15, color: c.onSurfaceTertiary },
  input: { height: 58, borderWidth: 2, borderColor: c.borderStrong, borderRadius: 12, paddingHorizontal: 16, fontFamily: fonts.semibold, fontSize: 22, color: c.onSurface },
  error: { fontFamily: fonts.semibold, fontSize: 15, color: c.brandPrimary },
  foot: { fontFamily: fonts.medium, fontSize: 14, color: c.muted, textAlign: "center" },
}));
