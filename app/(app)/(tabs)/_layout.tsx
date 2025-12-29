import { Tabs, useRouter } from 'expo-router';
import { View, TouchableOpacity } from 'react-native';
import { Home, Plus, History, FileText, User } from 'lucide-react-native';

export default function TabLayout() {
    const router = useRouter();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#161B22',
                    borderTopWidth: 0,  // Remove border line completely
                    elevation: 0,       // Android shadow removal
                    height: 60,         // Minimal height
                    paddingTop: 12,     // Visual center top
                    paddingBottom: 5,   // Minimal bottom padding
                },
                tabBarActiveTintColor: '#22D3EE',
                tabBarInactiveTintColor: '#6E7681',
                tabBarShowLabel: false, // No labels
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <Home color={color} size={28} />,
                }}
            />

            <Tabs.Screen
                name="history"
                options={{
                    title: 'History',
                    tabBarIcon: ({ color }) => <History color={color} size={28} />,
                }}
            />

            <Tabs.Screen
                name="new_entry_placeholder"
                options={{
                    title: 'New',
                    tabBarIcon: ({ color }) => (
                        <View className="items-center justify-center">
                            <View className="bg-primary/10 w-12 h-12 rounded-xl items-center justify-center border border-primary/20">
                                <Plus color="#22D3EE" size={28} strokeWidth={2.5} />
                            </View>
                        </View>
                    ),
                    tabBarButton: (props) => {
                        const { delayLongPress, ...rest } = props as any;
                        return (
                            <TouchableOpacity
                                {...rest}
                                delayLongPress={delayLongPress ?? undefined}
                                onPress={() => router.push('/(app)/new-entry')}
                                activeOpacity={0.7}
                            />
                        );
                    },
                }}
            />

            <Tabs.Screen
                name="reports"
                options={{
                    title: 'Reports',
                    tabBarIcon: ({ color }) => <FileText color={color} size={28} />,
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <User color={color} size={28} />,
                }}
            />
        </Tabs>
    );
}
