import React, { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/src/app-store";
import { Btn, Card, Icon } from "@/src/components/kit";
import { fonts, makeStyles, useTheme } from "@/src/theme";

/** Admin panel guard: renders children only after admin password is entered. */
export function AdminGate({ title, children }: { title: string; children: React.ReactNode }) {
  const { unlocked, login } = useApp();
  const insets = useSafeAreaInsets();
  const s = useStyles();
  const { colors } = useTheme();
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (unlocked) return <>{children}</>;

  const submit = async () => {
    setBusy(true);
    const ok = await login(pw.trim());
    setBusy(false);
    if (!ok) {
      setPw("");
      setError("Pogrešna lozinka");
    } else setPw("");
  };

  return (
    <View style={s.root}>
      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[s.content, { paddingTop: insets.top + 16 }]}
      >
        <Text style={s.title}>{title}</Text>
        <Card tone="accent" testID="admin-gate">
          <View style={s.lockRow}>
            <Icon name="shield-lock-outline" size={32} color={colors.brandPrimary} />
            <Text style={s.cardTitle}>Admin panel</Text>
          </View>
          <Text style={s.label}>Unesite admin lozinku za pristup.</Text>
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
            placeholderTextColor={colors.placeholder}
            returnKeyType="done"
            onSubmitEditing={submit}
            style={[s.input, error ? { borderColor: colors.brandPrimary } : null]}
          />
          {!!error && <Text testID="login-error" style={s.error}>{error}</Text>}
          <Btn testID="login-submit-button" label="PRIJAVI SE" icon="login" onPress={submit} loading={busy} disabled={!pw} />
        </Card>
      </KeyboardAwareScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  content: { paddingHorizontal: 16, gap: 24, paddingBottom: 24 },
  title: { fontFamily: fonts.wide, fontSize: 32, color: c.onSurface },
  lockRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardTitle: { fontFamily: fonts.display, fontSize: 34, color: c.onSurface },
  label: { fontFamily: fonts.semibold, fontSize: 16, color: c.onSurfaceTertiary },
  input: { height: 58, borderWidth: 2, borderColor: c.borderStrong, borderRadius: 12, paddingHorizontal: 16, fontFamily: fonts.semibold, fontSize: 22, color: c.onSurface },
  error: { fontFamily: fonts.semibold, fontSize: 15, color: c.brandPrimary },
}));
