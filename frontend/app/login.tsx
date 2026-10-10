import React, { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Btn, Icon } from "@/src/components/ui";
import { useApp } from "@/src/store";
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
      setError("Погрешна лозинка");
    }
  };

  return (
    <View style={s.root}>
      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[s.content, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}
      >
        <View style={s.logo}>
          <Text style={s.logoText}>ГСП</Text>
        </View>
        <Text style={s.code}>QF-E-003 · СП НОВИ БЕОГРАД</Text>
        <Text style={s.title}>ЛИСТА{"\n"}ТОЧЕЊА{"\n"}ГОРИВА</Text>
        <View style={s.bar} />
        <Text style={s.label}>АДМИН ЛОЗИНКА</Text>
        <View style={[s.inputWrap, error ? { borderColor: colors.error } : null]}>
          <Icon name="lock" size={22} color={colors.onSurface} />
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
            style={s.input}
          />
        </View>
        {!!error && (
          <Text testID="login-error" style={s.error}>
            {error}
          </Text>
        )}
        <Btn testID="login-submit-button" label="ПРИЈАВА" icon="arrow-right-bold" onPress={submit} loading={busy} disabled={!pw} />
        <Text style={s.foot}>Подаци се чувају само на овом телефону.</Text>
      </KeyboardAwareScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  content: { paddingHorizontal: 24, gap: 16 },
  logo: { width: 72, height: 72, backgroundColor: c.surfaceInverse, alignItems: "center", justifyContent: "center" },
  logoText: { color: c.onSurfaceInverse, fontFamily: fonts.display, fontSize: 24 },
  code: { fontFamily: fonts.bold, fontSize: 12, color: c.muted, letterSpacing: 1 },
  title: { fontFamily: fonts.display, fontSize: 44, lineHeight: 48, color: c.onSurface },
  bar: { height: 8, width: 96, backgroundColor: c.brandPrimary },
  label: { fontFamily: fonts.bold, fontSize: 12, color: c.muted, letterSpacing: 1, marginTop: 16 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: c.borderStrong,
    paddingHorizontal: 16,
    height: 64,
    backgroundColor: c.surfaceSecondary,
  },
  input: { flex: 1, fontFamily: fonts.bold, fontSize: 20, color: c.onSurface, height: "100%" },
  error: { color: c.error, fontFamily: fonts.bold, fontSize: 14 },
  foot: { fontFamily: fonts.regular, fontSize: 12, color: c.muted, marginTop: 8 },
}));
