import React from "react";
import { Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usesNativeTabs } from "@/src/navigation";
import { displayDate, fmt, Pump, pumpDiff, totalDiff, useApp } from "@/src/store";
import { fonts, makeStyles, useTheme } from "@/src/theme";

const clean = (t: string) => t.replace(/[^0-9.,]/g, "");

export default function Pumps() {
  const { shift, updateShift, date } = useApp();
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const s = useStyles();
  const { colors } = useTheme();

  const setPump = (i: number, key: keyof Pump, v: string) =>
    updateShift((sh) => ({ ...sh, pumps: sh.pumps.map((p, j) => (j === i ? { ...p, [key]: clean(v) } : p)) }));

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>АУТОМАТИ</Text>
          <Text style={s.sub}>{displayDate(date)} · 07h–15h</Text>
        </View>
        <View style={s.totalBox}>
          <Text style={s.totalLabel}>УКУПНО</Text>
          <Text testID="pumps-total-diff" style={s.totalValue}>{fmt(totalDiff(shift))}</Text>
        </View>
      </View>
      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[s.content, { paddingBottom: bottomChrome + 24 }]}
      >
        {shift.pumps.map((p, i) => {
          const d = pumpDiff(p);
          const neg = d < 0;
          return (
            <View key={i} style={s.card} testID={`pump-card-${i + 1}`}>
              <View style={s.cardHead}>
                <Text style={s.cardTitle}>АУТОМАТ {i + 1}</Text>
                <View style={[s.diff, neg && { backgroundColor: colors.error }]}>
                  <Text style={s.diffLabel}>РАЗЛИКА</Text>
                  <Text testID={`pump-diff-${i + 1}`} style={s.diffValue}>{fmt(d)}</Text>
                </View>
              </View>
              <View style={s.inputs}>
                <View style={s.field}>
                  <Text style={s.fieldLabel}>ПОЧЕТНО СТАЊЕ</Text>
                  <TextInput
                    testID={`pump-start-${i + 1}`}
                    value={p.start}
                    onChangeText={(t) => setPump(i, "start", t)}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    style={s.input}
                  />
                </View>
                <View style={s.field}>
                  <Text style={s.fieldLabel}>ЗАВРШНО СТАЊЕ</Text>
                  <TextInput
                    testID={`pump-end-${i + 1}`}
                    value={p.end}
                    onChangeText={(t) => setPump(i, "end", t)}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    style={s.input}
                  />
                </View>
              </View>
            </View>
          );
        })}

        <View style={s.card}>
          <Text style={s.cardTitle}>ПОТПИСИ</Text>
          <Text style={s.fieldLabel}>ЕВИДЕНТИЧАР</Text>
          <TextInput
            testID="sign-evidenticar-input"
            value={shift.evidenticar}
            onChangeText={(t) => updateShift((sh) => ({ ...sh, evidenticar: t }))}
            placeholder="Име и презиме"
            placeholderTextColor={colors.muted}
            style={[s.input, s.textInput]}
          />
          <Text style={s.fieldLabel}>РАДНИК КНЕЗ ПЕТРОЛ-А</Text>
          <TextInput
            testID="sign-radnik-input"
            value={shift.radnik}
            onChangeText={(t) => updateShift((sh) => ({ ...sh, radnik: t }))}
            placeholder="Име и презиме"
            placeholderTextColor={colors.muted}
            style={[s.input, s.textInput]}
          />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderColor: c.borderStrong,
  },
  title: { fontFamily: fonts.display, fontSize: 28, color: c.onSurface },
  sub: { fontFamily: fonts.bold, fontSize: 12, color: c.muted },
  totalBox: { backgroundColor: c.surfaceInverse, paddingHorizontal: 12, paddingVertical: 8, alignItems: "flex-end" },
  totalLabel: { fontFamily: fonts.bold, fontSize: 10, color: c.brand },
  totalValue: { fontFamily: fonts.display, fontSize: 20, color: c.onSurfaceInverse },
  content: { padding: 16, gap: 12 },
  card: { borderWidth: 2, borderColor: c.borderStrong, padding: 12, gap: 8, backgroundColor: c.surface },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontFamily: fonts.display, fontSize: 18, color: c.onSurface },
  diff: { backgroundColor: c.surfaceInverse, paddingHorizontal: 10, paddingVertical: 4, alignItems: "flex-end", minWidth: 110 },
  diffLabel: { fontFamily: fonts.bold, fontSize: 9, color: c.brand },
  diffValue: { fontFamily: fonts.display, fontSize: 18, color: c.onSurfaceInverse },
  inputs: { flexDirection: "row", gap: 8 },
  field: { flex: 1, gap: 4 },
  fieldLabel: { fontFamily: fonts.bold, fontSize: 11, color: c.muted },
  input: {
    height: 56,
    borderWidth: 2,
    borderColor: c.borderStrong,
    backgroundColor: c.surfaceSecondary,
    paddingHorizontal: 12,
    fontFamily: fonts.bold,
    fontSize: 20,
    color: c.onSurface,
  },
  textInput: { fontSize: 16 },
}));
