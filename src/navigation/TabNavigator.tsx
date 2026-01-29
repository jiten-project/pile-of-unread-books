import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, TouchableOpacity, GestureResponderEvent } from 'react-native';
import {
  HomeScreen,
  BookshelfScreen,
  AddBookScreen,
  StatsScreen,
  SettingsScreen,
} from '../screens';
import { useTheme } from '../contexts';
import { TabParamList } from '../types';
import { DEVICE } from '../constants/theme';

const Tab = createBottomTabNavigator<TabParamList>();

type TabIconProps = {
  label: string;
  icon: string;
  focused: boolean;
  focusedColor: string;
  unfocusedColor: string;
};

function TabIcon({ label, icon, focused, focusedColor, unfocusedColor }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? focusedColor : unfocusedColor },
          focused && styles.tabLabelFocused,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

type AddButtonProps = BottomTabBarButtonProps & {
  primaryColor: string;
};

function AddButton({ onPress, primaryColor }: AddButtonProps) {
  const handlePress = (e: GestureResponderEvent) => {
    onPress?.(e);
  };

  return (
    <View style={styles.addButtonContainer}>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: primaryColor, shadowColor: primaryColor }]}
        onPress={handlePress}
        accessibilityLabel="本を登録する"
        accessibilityRole="button"
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

// タブバーのサイズ定数（TabNavigatorより前に定義）
// タブバーは操作性を考慮して、コンテンツより少し大きめにスケール
const TAB_SCALE = DEVICE.isTablet ? 1.3 : 1.0;
const TAB_BAR_HEIGHT = Math.round(80 * TAB_SCALE);
const TAB_BAR_PADDING_BOTTOM = 0;
const TAB_BAR_PADDING_TOP = Math.round(32 * TAB_SCALE);

// ヘッダータイトルのサイズ（iPadでは大きく）
const HEADER_TITLE_SIZE = DEVICE.isTablet ? 22 : 17;

export default function TabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontSize: HEADER_TITLE_SIZE },
        tabBarStyle: {
          height: TAB_BAR_HEIGHT,
          paddingBottom: TAB_BAR_PADDING_BOTTOM,
          paddingTop: TAB_BAR_PADDING_TOP,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'ホーム',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              label="ホーム"
              icon="🏠"
              focused={focused}
              focusedColor={colors.primary}
              unfocusedColor={colors.textTertiary}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Bookshelf"
        component={BookshelfScreen}
        options={{
          title: '本棚',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              label="本棚"
              icon="📚"
              focused={focused}
              focusedColor={colors.primary}
              unfocusedColor={colors.textTertiary}
            />
          ),
        }}
      />
      <Tab.Screen
        name="AddBook"
        component={AddBookScreen}
        options={{
          title: '本を登録',
          tabBarButton: props => <AddButton {...props} primaryColor={colors.primary} />,
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          title: '統計',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              label="統計"
              icon="📊"
              focused={focused}
              focusedColor={colors.primary}
              unfocusedColor={colors.textTertiary}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: '設定',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              label="設定"
              icon="⚙️"
              focused={focused}
              focusedColor={colors.primary}
              unfocusedColor={colors.textTertiary}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// タブアイコン・ボタンのサイズ（iPadの時だけ大きくする）
const tabIconSize = Math.round(24 * TAB_SCALE);
const tabLabelSize = Math.round(10 * TAB_SCALE);
const tabLabelMarginTop = Math.round(4 * TAB_SCALE);
const tabContainerMinWidth = Math.round(50 * TAB_SCALE);
const addButtonSize = Math.round(56 * TAB_SCALE);
const addButtonFontSize = Math.round(32 * TAB_SCALE);
const addButtonMarginTop = Math.round(-20 * TAB_SCALE);

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: tabContainerMinWidth,
  },
  tabIcon: {
    fontSize: tabIconSize,
  },
  tabIconFocused: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: tabLabelSize,
    marginTop: tabLabelMarginTop,
  },
  tabLabelFocused: {
    fontWeight: '600',
  },
  addButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: addButtonSize,
    height: addButtonSize,
    borderRadius: addButtonSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: addButtonMarginTop,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    fontSize: addButtonFontSize,
    color: '#fff',
    fontWeight: '300',
    marginTop: -2,
  },
});
