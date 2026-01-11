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
    <TouchableOpacity
      style={[styles.addButton, { backgroundColor: primaryColor, shadowColor: primaryColor }]}
      onPress={handlePress}
      accessibilityLabel="本を登録する"
      accessibilityRole="button"
    >
      <Text style={styles.addButtonText}>+</Text>
    </TouchableOpacity>
  );
}

export default function TabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        tabBarStyle: {
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
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

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
  },
  tabIconFocused: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  tabLabelFocused: {
    fontWeight: '600',
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
    marginTop: -2,
  },
});
